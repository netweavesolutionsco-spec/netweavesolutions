-- ============================================================================
-- Project Requirements (Contact page "Send us a brief")
-- ----------------------------------------------------------------------------
-- The public contact form previously wrote to `leads`, which anyone could
-- submit anonymously. Briefs are now submitted from a signed-in client session
-- and land in their own table so the Admin Panel can show a dedicated
-- "Project Requirements" section with Client Name / Email / Requirement /
-- Budget / Timeline / Submission Date / Status.
--
-- The RLS model deliberately mirrors public.support_requests
-- (20260730120000_meetings_messages_support.sql): the owning client can read
-- and create their own rows, admins and editors can read and manage all.
-- ============================================================================

create table if not exists public.project_requirements (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.client_projects(id) on delete set null,
  client_name text not null,
  client_email text not null,
  phone text,
  company text,
  service text,
  budget text,
  timeline text,
  requirement text not null,
  source text not null default 'contact-page',
  status text not null default 'new'
    check (status in ('new', 'in_review', 'quoted', 'accepted', 'rejected', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.project_requirements is
  'Project briefs submitted by signed-in clients from the Contact page.';
comment on column public.project_requirements.timeline is
  'Free-text delivery timeline supplied by the client (e.g. "4-6 weeks"). Optional.';
comment on column public.project_requirements.budget is
  'Free-text budget band supplied by the client. Optional.';

create index if not exists project_requirements_client_created_idx
  on public.project_requirements(client_id, created_at desc);
create index if not exists project_requirements_status_idx
  on public.project_requirements(status);

drop trigger if exists project_requirements_set_updated_at on public.project_requirements;
create trigger project_requirements_set_updated_at before update on public.project_requirements
for each row execute function public.set_updated_at();

alter table public.project_requirements enable row level security;

grant select, insert, update on public.project_requirements to authenticated;
grant all on public.project_requirements to service_role;

drop policy if exists "project_requirements_self_select" on public.project_requirements;
create policy "project_requirements_self_select" on public.project_requirements for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

drop policy if exists "project_requirements_self_insert" on public.project_requirements;
create policy "project_requirements_self_insert" on public.project_requirements for insert to authenticated
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

drop policy if exists "project_requirements_staff_update" on public.project_requirements;
create policy "project_requirements_staff_update" on public.project_requirements for update to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
