create extension if not exists "uuid-ossp" schema extensions;
create extension if not exists "pgcrypto" schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.client_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  project_code text not null unique default ('NWS-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  name text not null,
  category text not null,
  description text not null,
  industry text,
  technology_stack text[] not null default array[]::text[],
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'submitted' check (status in ('submitted', 'planning', 'running', 'review', 'completed', 'on_hold', 'cancelled')),
  progress integer not null default 0 check (progress between 0 and 100),
  deadline date,
  expected_budget numeric(12,2),
  budget numeric(12,2),
  currency text not null default 'INR',
  assigned_team jsonb not null default '[]'::jsonb,
  requirements text,
  reference_websites text[] not null default array[]::text[],
  reference_files jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.client_projects(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'completed')),
  assigned_to text,
  deadline date,
  progress integer not null default 0 check (progress between 0 and 100),
  checklist jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.client_projects(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  folder text not null default 'documents' check (folder in ('documents', 'images', 'videos', 'contracts', 'invoices', 'designs', 'source_code', 'requirements', 'support')),
  name text not null,
  file_url text not null,
  mime_type text,
  file_size bigint not null default 0,
  version integer not null default 1,
  version_history jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.client_projects(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_name text not null,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  pinned boolean not null default false,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.client_projects(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  quotation_number text not null unique default ('QT-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  title text not null,
  scope jsonb not null default '[]'::jsonb,
  amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'revision_requested', 'expired')),
  expires_at timestamptz,
  pdf_url text,
  revision_note text,
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.client_projects(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade,
  invoice_number text not null unique default ('INV-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  title text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'partially_paid', 'overdue', 'void')),
  due_at date,
  paid_at timestamptz,
  pdf_url text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.project_invoices(id) on delete set null,
  project_id uuid references public.client_projects(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null default 0,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed', 'refunded')),
  provider text not null default 'stripe',
  provider_payment_id text,
  receipt_url text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.client_projects(id) on delete set null,
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  agenda text,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes between 15 and 480),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  google_meet_url text,
  zoom_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_notifications (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.client_activity_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  project_id uuid references public.client_projects(id) on delete set null,
  action text not null,
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-files',
  'client-files',
  false,
  52428800,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
    'text/csv',
    'video/mp4'
  ]
)
on conflict (id) do nothing;

create index if not exists client_projects_client_id_idx on public.client_projects(client_id);
create index if not exists client_projects_status_idx on public.client_projects(status);
create index if not exists project_tasks_project_id_idx on public.project_tasks(project_id);
create index if not exists project_tasks_client_status_idx on public.project_tasks(client_id, status);
create index if not exists project_files_client_folder_idx on public.project_files(client_id, folder);
create index if not exists project_messages_project_created_idx on public.project_messages(project_id, created_at desc);
create index if not exists project_messages_client_created_idx on public.project_messages(client_id, created_at desc);
create index if not exists project_quotations_client_status_idx on public.project_quotations(client_id, status);
create index if not exists project_invoices_client_status_idx on public.project_invoices(client_id, status);
create index if not exists project_payments_client_status_idx on public.project_payments(client_id, status);
create index if not exists project_meetings_client_scheduled_idx on public.project_meetings(client_id, scheduled_at);
create index if not exists client_notifications_client_read_idx on public.client_notifications(client_id, read_at);
create index if not exists client_activity_logs_client_created_idx on public.client_activity_logs(client_id, created_at desc);

drop trigger if exists client_projects_set_updated_at on public.client_projects;
create trigger client_projects_set_updated_at before update on public.client_projects
for each row execute function public.set_updated_at();

drop trigger if exists project_tasks_set_updated_at on public.project_tasks;
create trigger project_tasks_set_updated_at before update on public.project_tasks
for each row execute function public.set_updated_at();

drop trigger if exists project_files_set_updated_at on public.project_files;
create trigger project_files_set_updated_at before update on public.project_files
for each row execute function public.set_updated_at();

drop trigger if exists project_messages_set_updated_at on public.project_messages;
create trigger project_messages_set_updated_at before update on public.project_messages
for each row execute function public.set_updated_at();

drop trigger if exists project_quotations_set_updated_at on public.project_quotations;
create trigger project_quotations_set_updated_at before update on public.project_quotations
for each row execute function public.set_updated_at();

drop trigger if exists project_invoices_set_updated_at on public.project_invoices;
create trigger project_invoices_set_updated_at before update on public.project_invoices
for each row execute function public.set_updated_at();

drop trigger if exists project_payments_set_updated_at on public.project_payments;
create trigger project_payments_set_updated_at before update on public.project_payments
for each row execute function public.set_updated_at();

drop trigger if exists project_meetings_set_updated_at on public.project_meetings;
create trigger project_meetings_set_updated_at before update on public.project_meetings
for each row execute function public.set_updated_at();

alter table public.client_projects enable row level security;
alter table public.project_tasks enable row level security;
alter table public.project_files enable row level security;
alter table public.project_messages enable row level security;
alter table public.project_quotations enable row level security;
alter table public.project_invoices enable row level security;
alter table public.project_payments enable row level security;
alter table public.project_meetings enable row level security;
alter table public.client_notifications enable row level security;
alter table public.client_activity_logs enable row level security;

grant select, insert, update, delete on public.client_projects to authenticated;
grant select, insert, update, delete on public.project_tasks to authenticated;
grant select, insert, update, delete on public.project_files to authenticated;
grant select, insert, update, delete on public.project_messages to authenticated;
grant select, insert, update, delete on public.project_quotations to authenticated;
grant select, insert, update, delete on public.project_invoices to authenticated;
grant select, insert, update, delete on public.project_payments to authenticated;
grant select, insert, update, delete on public.project_meetings to authenticated;
grant select, update on public.client_notifications to authenticated;
grant select, insert on public.client_activity_logs to authenticated;
grant all on public.client_projects to service_role;
grant all on public.project_tasks to service_role;
grant all on public.project_files to service_role;
grant all on public.project_messages to service_role;
grant all on public.project_quotations to service_role;
grant all on public.project_invoices to service_role;
grant all on public.project_payments to service_role;
grant all on public.project_meetings to service_role;
grant all on public.client_notifications to service_role;
grant all on public.client_activity_logs to service_role;

create policy "client_projects_self_select" on public.client_projects for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "client_projects_self_insert" on public.client_projects for insert to authenticated
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "client_projects_staff_update" on public.client_projects for update to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "project_tasks_self_select" on public.project_tasks for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "project_tasks_self_insert" on public.project_tasks for insert to authenticated
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "project_tasks_self_update" on public.project_tasks for update to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "project_files_self_manage" on public.project_files for all to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "project_messages_self_manage" on public.project_messages for all to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "project_quotations_self_select" on public.project_quotations for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "project_quotations_client_update" on public.project_quotations for update to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "project_invoices_self_select" on public.project_invoices for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "project_payments_self_select" on public.project_payments for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "project_meetings_self_manage" on public.project_meetings for all to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "client_notifications_self_select" on public.client_notifications for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "client_notifications_self_update" on public.client_notifications for update to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "client_activity_logs_self_select" on public.client_activity_logs for select to authenticated
using (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "client_activity_logs_self_insert" on public.client_activity_logs for insert to authenticated
with check (client_id = auth.uid() or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create policy "client_files_storage_self_select" on storage.objects for select to authenticated
using (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
);

create policy "client_files_storage_self_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
);

create policy "client_files_storage_self_update" on storage.objects for update to authenticated
using (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
)
with check (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
);

create policy "client_files_storage_self_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
);
