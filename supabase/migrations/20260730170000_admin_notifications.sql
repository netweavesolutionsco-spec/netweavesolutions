-- ============================================================================
-- Admin Notifications
-- ----------------------------------------------------------------------------
-- Backs the Admin Panel notification centre (bell drawer + Notifications page).
-- Previously the panel was seeded from an empty in-memory array and could never
-- show anything. This table is the single, admin-scoped store that every
-- important event across the product writes into:
--   New Client Registration / Login, Project Created / Status Updated,
--   New Contact Request, Requirement Submitted, Client Message, Support Request,
--   Meeting Scheduled / Accepted / Rejected, Payment Received,
--   File / Document Uploaded, CMS / Blog Published, Team Member Added,
--   Portfolio Added, and other important admin activity.
--
-- It is deliberately distinct from public.client_notifications
-- (20260728190000_client_portal.sql), which is CLIENT-scoped (per-client feed).
-- This one is staff-facing: only admins may read/manage it, while the backend
-- service_role (client portal → supabaseAdmin) and admins/editors may insert.
--
-- The RLS model mirrors the admin-only pattern used by public.leads
-- (20260729120000_leads_enquiry_form.sql). has_role() is the SECURITY DEFINER
-- helper from 20260723175111_*.sql; set_updated_at() is the shared trigger fn.
-- ============================================================================

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  user_name text,
  related_module text,
  type text not null default 'info'
    check (type in ('info', 'success', 'warning', 'lead')),
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.admin_notifications is
  'Staff-facing notification feed for the Admin Panel. One row per important event product-wide.';
comment on column public.admin_notifications.user_name is
  'Human-readable name of the actor/subject (e.g. the client who submitted a request). Optional.';
comment on column public.admin_notifications.related_module is
  'Source module for icon/routing, e.g. clients | projects | leads | support | meetings | payments | files | cms | blog | team | portfolio.';
comment on column public.admin_notifications.type is
  'Visual severity/category: info | success | warning | lead.';
comment on column public.admin_notifications.action_url is
  'Optional admin-panel path to open when the notification is clicked.';
comment on column public.admin_notifications.read_at is
  'When an admin marked this notification read. NULL = unread.';

create index if not exists admin_notifications_created_idx
  on public.admin_notifications(created_at desc);
create index if not exists admin_notifications_unread_idx
  on public.admin_notifications(read_at)
  where read_at is null;

drop trigger if exists admin_notifications_set_updated_at on public.admin_notifications;
create trigger admin_notifications_set_updated_at before update on public.admin_notifications
for each row execute function public.set_updated_at();

alter table public.admin_notifications enable row level security;

-- Backend (service_role) inserts on client-originated events and bypasses RLS.
-- Admins manage everything from the panel; editors may create admin-originated
-- events (CMS/blog publish, team/portfolio add) via the publishable client.
grant select, insert, update, delete on public.admin_notifications to authenticated;
grant all on public.admin_notifications to service_role;

drop policy if exists "admin_notifications_admin_read" on public.admin_notifications;
create policy "admin_notifications_admin_read"
  on public.admin_notifications for select
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') );

drop policy if exists "admin_notifications_staff_insert" on public.admin_notifications;
create policy "admin_notifications_staff_insert"
  on public.admin_notifications for insert
  to authenticated
  with check ( public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor') );

drop policy if exists "admin_notifications_admin_update" on public.admin_notifications;
create policy "admin_notifications_admin_update"
  on public.admin_notifications for update
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') )
  with check ( public.has_role(auth.uid(), 'admin') );

drop policy if exists "admin_notifications_admin_delete" on public.admin_notifications;
create policy "admin_notifications_admin_delete"
  on public.admin_notifications for delete
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') );
