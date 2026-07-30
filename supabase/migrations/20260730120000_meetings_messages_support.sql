-- ============================================================================
-- Meeting Scheduler, Client Messages & Support Requests
-- ----------------------------------------------------------------------------
-- Extends the existing client-portal schema (20260728190000_client_portal.sql)
-- rather than introducing parallel systems:
--   1. project_meetings  — add `platform` (Google Meet / Microsoft Teams) and
--      widen the status set so meeting requests start as "pending" and admins
--      can Accept / Reject / Mark Completed.
--   2. project_messages  — add `subject` (optional) and `admin_read_at` so the
--      admin Client Messages page can show Read/Unread without touching the
--      client-facing `seen_at` semantics.
--   3. support_requests  — new table backing the Support module, mirroring the
--      RLS model already used by project_meetings.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. project_meetings: platform + wider status set
-- ---------------------------------------------------------------------------
alter table public.project_meetings
  add column if not exists platform text;

alter table public.project_meetings
  drop constraint if exists project_meetings_platform_check;
alter table public.project_meetings
  add constraint project_meetings_platform_check
  check (platform is null or platform in ('google_meet', 'microsoft_teams', 'zoom', 'other'));

comment on column public.project_meetings.platform is
  'Meeting platform requested by the client: google_meet | microsoft_teams | zoom | other.';

-- Widen status so a request begins life as "pending" and admins can move it
-- through accept / reject / completed. Existing values remain valid.
alter table public.project_meetings
  drop constraint if exists project_meetings_status_check;
alter table public.project_meetings
  add constraint project_meetings_status_check
  check (status in (
    'pending', 'accepted', 'rejected', 'completed',
    'scheduled', 'cancelled', 'rescheduled'
  ));

alter table public.project_meetings
  alter column status set default 'pending';

-- Denormalised client identity so the admin Meeting Requests table can render
-- Client Name / Email without a cross-table join (mirrors the leads model).
alter table public.project_meetings
  add column if not exists client_name text;
alter table public.project_meetings
  add column if not exists client_email text;

-- ---------------------------------------------------------------------------
-- 2. project_messages: subject + admin read tracking + sender email
-- ---------------------------------------------------------------------------
alter table public.project_messages
  add column if not exists subject text;
alter table public.project_messages
  add column if not exists sender_email text;
alter table public.project_messages
  add column if not exists admin_read_at timestamptz;

comment on column public.project_messages.subject is
  'Optional subject line supplied by the client.';
comment on column public.project_messages.sender_email is
  'Denormalised sender email so the admin Client Messages page can show it directly.';
comment on column public.project_messages.admin_read_at is
  'When a team member marked this client message as read in the admin panel.';

create index if not exists project_messages_admin_read_idx
  on public.project_messages(admin_read_at);

-- ---------------------------------------------------------------------------
-- 3. support_requests
-- ---------------------------------------------------------------------------
create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.client_projects(id) on delete set null,
  client_name text not null,
  client_email text not null,
  subject text not null,
  message text not null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_client_created_idx
  on public.support_requests(client_id, created_at desc);
create index if not exists support_requests_status_idx
  on public.support_requests(status);

drop trigger if exists support_requests_set_updated_at on public.support_requests;
create trigger support_requests_set_updated_at before update on public.support_requests
for each row execute function public.set_updated_at();

alter table public.support_requests enable row level security;

grant select, insert, update on public.support_requests to authenticated;
grant all on public.support_requests to service_role;

-- Clients manage their own requests; admins and editors see and manage all.
drop policy if exists "support_requests_self_select" on public.support_requests;
create policy "support_requests_self_select" on public.support_requests for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

drop policy if exists "support_requests_self_insert" on public.support_requests;
create policy "support_requests_self_insert" on public.support_requests for insert to authenticated
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

drop policy if exists "support_requests_staff_update" on public.support_requests;
create policy "support_requests_staff_update" on public.support_requests for update to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
