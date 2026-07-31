-- =====================================================================
-- No-Code Website Builder + CMS — foundation schema
-- Adds: cms_pages (draft/published per page), cms_page_versions (publish
-- history), media_assets (Media Library metadata), and a public
-- `site-media` storage bucket. Mirrors the existing site_content /
-- client-files conventions (public read, admin/editor write via has_role).
-- =====================================================================

-- =========================
-- cms_pages
-- =========================
create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default 'Untitled Page',
  status text not null default 'draft' check (status in ('draft', 'published')),
  data jsonb not null default '{}'::jsonb,            -- working draft: { sections, seo, og }
  published_data jsonb not null default '{}'::jsonb,  -- live snapshot
  scheduled_at timestamptz,
  is_system boolean not null default false,           -- true = shipped page (home), not user-deletable
  sort int not null default 0,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

grant select on public.cms_pages to anon;
grant select, insert, update, delete on public.cms_pages to authenticated;
grant all on public.cms_pages to service_role;
alter table public.cms_pages enable row level security;

-- Public site reads published pages (draft/published gate handled in server fns).
create policy "cms_pages_public_read" on public.cms_pages for select using (true);
-- Admins and editors may write; delete is additionally gated in the server fn (admin-only).
create policy "cms_pages_staff_insert" on public.cms_pages for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "cms_pages_staff_update" on public.cms_pages for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "cms_pages_admin_delete" on public.cms_pages for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop trigger if exists cms_pages_set_updated_at on public.cms_pages;
create trigger cms_pages_set_updated_at before update on public.cms_pages
for each row execute function public.set_updated_at();

create index if not exists cms_pages_slug_idx on public.cms_pages(slug);
create index if not exists cms_pages_status_idx on public.cms_pages(status);

-- =========================
-- cms_page_versions (publish history)
-- =========================
create table if not exists public.cms_page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.cms_pages(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  label text,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

grant select, insert on public.cms_page_versions to authenticated;
grant all on public.cms_page_versions to service_role;
alter table public.cms_page_versions enable row level security;

-- Only staff can read/insert version history; public has no access.
create policy "cms_page_versions_staff_read" on public.cms_page_versions for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "cms_page_versions_staff_insert" on public.cms_page_versions for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));

create index if not exists cms_page_versions_page_created_idx
  on public.cms_page_versions(page_id, created_at desc);

-- =========================
-- media_assets (Media Library)
-- =========================
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'site-media',
  path text not null,
  url text not null,
  type text not null default 'image' check (type in ('image', 'video', 'pdf', 'svg', 'doc', 'other')),
  folder text not null default '',
  tags text[] not null default '{}',
  alt text not null default '',
  title text not null default '',
  width int,
  height int,
  size_bytes bigint,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

grant select on public.media_assets to anon;
grant select, insert, update, delete on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
alter table public.media_assets enable row level security;

-- Media is public (referenced by the live site); staff manage it.
create policy "media_assets_public_read" on public.media_assets for select using (true);
create policy "media_assets_staff_insert" on public.media_assets for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "media_assets_staff_update" on public.media_assets for update to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'));
create policy "media_assets_admin_delete" on public.media_assets for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create index if not exists media_assets_folder_idx on public.media_assets(folder);
create index if not exists media_assets_created_idx on public.media_assets(created_at desc);

-- =========================
-- site-media storage bucket (public read, staff write)
-- =========================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  52428800,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    'application/pdf',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do nothing;

-- Public read (bucket is public). Staff-only writes.
create policy "site_media_public_select" on storage.objects for select
  using (bucket_id = 'site-media');

create policy "site_media_staff_insert" on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-media'
  and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
);

create policy "site_media_staff_update" on storage.objects for update to authenticated
using (
  bucket_id = 'site-media'
  and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
)
with check (
  bucket_id = 'site-media'
  and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'editor'))
);

create policy "site_media_admin_delete" on storage.objects for delete to authenticated
using (
  bucket_id = 'site-media'
  and public.has_role(auth.uid(), 'admin')
);

-- =========================
-- Seed the Home page (matches the current routes/index.tsx composition
-- exactly, so the first render is visually identical). Each section pulls
-- its content from existing collections/settings via its block wrapper;
-- the `data` here only fixes type/order/enabled/name.
-- =========================
insert into public.cms_pages (slug, title, status, is_system, sort, data, published_data)
values (
  '/',
  'Home',
  'published',
  true,
  0,
  jsonb_build_object(
    'seo', jsonb_build_object(
      'title', 'Netweavesolutions — Premium Software Development Agency',
      'description', 'Websites, apps and custom software crafted by a senior team. Transforming ideas into powerful digital solutions.'
    ),
    'og', jsonb_build_object('title', 'Netweavesolutions', 'description', 'Premium software development agency.', 'image', ''),
    'sections', jsonb_build_array(
      jsonb_build_object('id', 'home-hero',        'type', 'hero',            'name', 'Hero',              'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-techstack',   'type', 'techStack',       'name', 'Tech Stack',        'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-services',    'type', 'services',        'name', 'Services',          'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-whychoose',   'type', 'whyChoose',       'name', 'Why Choose Us',     'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-featured',    'type', 'featuredProject', 'name', 'Featured Project',  'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-portfolio',   'type', 'portfolio',       'name', 'Portfolio Grid',    'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-testimonials','type', 'testimonials',    'name', 'Testimonials',      'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-pricing',     'type', 'pricing',         'name', 'Pricing',           'enabled', true, 'data', jsonb_build_object('compact', true)),
      jsonb_build_object('id', 'home-faq',         'type', 'faq',             'name', 'FAQ',               'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-cta',         'type', 'contactCta',      'name', 'Contact CTA',       'enabled', true, 'data', '{}'::jsonb),
      jsonb_build_object('id', 'home-expertform',  'type', 'expertForm',      'name', 'Expert Assistance', 'enabled', true, 'data', '{}'::jsonb)
    )
  ),
  '{}'::jsonb
)
on conflict (slug) do nothing;

-- Publish the seed (published_data = data) for the home row.
update public.cms_pages set published_data = data where slug = '/';

-- Realtime: allow the public site to react to page publishes (mirrors site_content).
-- Guarded add so re-running the migration is safe.
alter table public.cms_pages replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'cms_pages'
  ) then
    alter publication supabase_realtime add table public.cms_pages;
  end if;
end
$$;
