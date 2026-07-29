-- ============================================================================
-- Expert Assistance enquiry form — extend public.leads
-- ----------------------------------------------------------------------------
-- Adds the fields captured by the homepage "Reach Out for Expert Assistance"
-- form, and fixes two pre-existing gaps:
--   1. There was no SELECT policy on public.leads, so the admin Leads page
--      could never actually read rows (RLS silently returned an empty set).
--   2. status values were stored lowercase ('new') while the admin StatusBadge
--      component keys off Capitalized values ('New'), so badges rendered unstyled.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. New columns
-- ---------------------------------------------------------------------------
alter table public.leads add column if not exists phone text;
alter table public.leads add column if not exists service text;
alter table public.leads add column if not exists budget text;
alter table public.leads add column if not exists source text default 'website';

comment on column public.leads.phone is 'Contact phone / WhatsApp number supplied by the lead.';
comment on column public.leads.service is 'Service the lead is interested in.';
comment on column public.leads.budget is 'Self-reported budget band.';
comment on column public.leads.source is 'Which surface produced the lead, e.g. home-expert-form, contact-page.';

-- ---------------------------------------------------------------------------
-- 2. Normalise existing status values to match the admin StatusBadge map
-- ---------------------------------------------------------------------------
update public.leads
   set status = initcap(status)
 where status is not null
   and status <> initcap(status);

alter table public.leads alter column status set default 'New';

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_source_idx on public.leads (source);

-- ---------------------------------------------------------------------------
-- 4. RLS policies
--    Inserts already allowed for anyone by the "Anyone can submit a lead"
--    policy in 001_initial_schema.sql. Reads/updates/deletes are admin-only.
--    has_role() is the SECURITY DEFINER helper from 20260723175111_*.sql.
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;

drop policy if exists "leads_admin_read" on public.leads;
create policy "leads_admin_read"
  on public.leads for select
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') );

drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_admin_update"
  on public.leads for update
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') )
  with check ( public.has_role(auth.uid(), 'admin') );

drop policy if exists "leads_admin_delete" on public.leads;
create policy "leads_admin_delete"
  on public.leads for delete
  to authenticated
  using ( public.has_role(auth.uid(), 'admin') );
