-- ============================================================================
-- Team Invitations
-- ----------------------------------------------------------------------------
-- Backs the Admin Panel "Invite Member" flow. An admin sends an invitation to a
-- prospective team member; the invitee opens a tokenised link and completes
-- account setup, at which point the invitation is marked accepted and the new
-- user is granted the mapped app_role.
--
-- Display roles shown in the UI (Super Admin, Admin, Manager, Editor, Content
-- Manager, Support) are richer than the app_role enum (admin | editor | viewer |
-- customer | manager). We persist the human display role verbatim in
-- `display_role` and map it to an app_role at accept time:
--   Super Admin / Admin        -> admin
--   Manager                    -> manager
--   Editor / Content Manager   -> editor
--   Support                    -> viewer
-- The mapped enum is also stored in `app_role` up front so the backend does not
-- have to re-derive it.
--
-- Tokens are opaque, single-use, and expire (default 7 days). Only admins may
-- read/manage invitations; the backend service_role inserts/updates them and the
-- public accept endpoint validates the token server-side (never via RLS).
-- ============================================================================

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  display_role text not null,
  app_role public.app_role not null,
  department text,
  message text,
  token text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_by_name text,
  accepted_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.team_invitations is
  'Pending/accepted/expired/cancelled invitations for Admin Panel team members.';
comment on column public.team_invitations.display_role is
  'Human-facing role label chosen in the invite modal (may be richer than app_role).';
comment on column public.team_invitations.app_role is
  'The app_role enum granted on accept, mapped from display_role.';
comment on column public.team_invitations.token is
  'Opaque single-use secret embedded in the accept link. Validated server-side only.';

-- One live (pending) invitation per email; accepted/cancelled/expired rows may
-- coexist as history. Partial unique index enforces "no duplicate pending".
create unique index if not exists team_invitations_pending_email_uidx
  on public.team_invitations (lower(email))
  where status = 'pending';

create index if not exists team_invitations_status_idx
  on public.team_invitations (status, created_at desc);
create index if not exists team_invitations_token_idx
  on public.team_invitations (token);

drop trigger if exists team_invitations_set_updated_at on public.team_invitations;
create trigger team_invitations_set_updated_at before update on public.team_invitations
for each row execute function public.set_updated_at();

alter table public.team_invitations enable row level security;

grant select, insert, update, delete on public.team_invitations to authenticated;
grant all on public.team_invitations to service_role;

-- Admins read + manage everything from the panel. All mutation that matters
-- (create/resend/cancel/accept) flows through the backend service_role, which
-- bypasses RLS; these policies simply let the admin UI read/manage directly too.
drop policy if exists "team_invitations_admin_read" on public.team_invitations;
create policy "team_invitations_admin_read"
  on public.team_invitations for select
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') );

drop policy if exists "team_invitations_admin_insert" on public.team_invitations;
create policy "team_invitations_admin_insert"
  on public.team_invitations for insert
  to authenticated
  with check ( public.has_role(auth.uid(), 'admin') );

drop policy if exists "team_invitations_admin_update" on public.team_invitations;
create policy "team_invitations_admin_update"
  on public.team_invitations for update
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') )
  with check ( public.has_role(auth.uid(), 'admin') );

drop policy if exists "team_invitations_admin_delete" on public.team_invitations;
create policy "team_invitations_admin_delete"
  on public.team_invitations for delete
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') );

-- Realtime so the Team page invitation list updates live as statuses change.
alter table public.team_invitations replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'team_invitations'
  ) then
    alter publication supabase_realtime add table public.team_invitations;
  end if;
end
$$;

-- ----------------------------------------------------------------------------
-- Team member status support
-- ----------------------------------------------------------------------------
-- Deactivate/Reactivate a member without deleting them. profiles already has a
-- `status` column (active | suspended | pending) from
-- 20260730000000_auth_roles_profile_fields.sql for CLIENTS; we reuse it for
-- staff too. 'suspended' == deactivated. No schema change required here, but we
-- record the intent for future readers.
comment on column public.profiles.status is
  'active | suspended | pending. Applies to both clients and staff; suspended = deactivated / cannot sign in.';
