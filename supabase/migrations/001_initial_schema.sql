-- Enable required extensions
create extension if not exists "uuid-ossp" schema extensions;
create extension if not exists "pgcrypto" schema extensions;

-- User roles enum
create type user_role as enum ('admin', 'client', 'team_member', 'user');

-- User profiles table
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text unique,
  display_name text,
  avatar_url text,
  role user_role default 'user'::user_role,
  company_name text,
  phone text,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects table
create table if not exists public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text,
  live_url text,
  github_url text,
  technologies text[] default array[]::text[],
  featured boolean default false,
  status text default 'completed',
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Blog posts table
create table if not exists public.blog_posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  content text,
  excerpt text,
  featured_image text,
  status text default 'draft',
  published_at timestamp with time zone,
  view_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Testimonials table
create table if not exists public.testimonials (
  id uuid default uuid_generate_v4() primary key,
  client_name text not null,
  company text,
  project_id uuid references public.projects(id) on delete set null,
  content text not null,
  rating integer default 5,
  featured boolean default false,
  image_url text,
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Team members table
create table if not exists public.team_members (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  title text,
  bio text,
  image_url text,
  social_links jsonb default '{}'::jsonb,
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Leads/Contact submissions table
create table if not exists public.leads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  email text not null,
  company text,
  message text,
  status text default 'new',
  replied_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Services table
create table if not exists public.services (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  icon text,
  features text[],
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.team_members enable row level security;
alter table public.leads enable row level security;
alter table public.services enable row level security;

-- Row Level Security Policies

-- Profiles: Users can read all, update only their own
create policy "Users can view all profiles"
  on public.profiles for select
  using ( true );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- Projects: Public read, authenticated users can create, owners can update
create policy "Projects are viewable by everyone"
  on public.projects for select
  using ( true );

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check ( auth.role() = 'authenticated' and user_id = auth.uid() );

create policy "Users can update own projects"
  on public.projects for update
  using ( user_id = auth.uid() );

create policy "Users can delete own projects"
  on public.projects for delete
  using ( user_id = auth.uid() );

-- Blog posts: Public read published, admins can manage
create policy "Published blog posts are viewable by everyone"
  on public.blog_posts for select
  using ( status = 'published' or auth.uid() = author_id );

create policy "Admins can insert blog posts"
  on public.blog_posts for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authors can update own blog posts"
  on public.blog_posts for update
  using ( author_id = auth.uid() );

-- Testimonials: Public read
create policy "Testimonials are viewable by everyone"
  on public.testimonials for select
  using ( true );

-- Team members: Public read
create policy "Team members are viewable by everyone"
  on public.team_members for select
  using ( true );

-- Leads: Authenticated users can insert
create policy "Anyone can submit a lead"
  on public.leads for insert
  with check ( true );

-- Services: Public read
create policy "Services are viewable by everyone"
  on public.services for select
  using ( true );

-- Create indexes for better performance
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists projects_user_id_idx on public.projects(user_id);
create index if not exists projects_featured_idx on public.projects(featured);
create index if not exists blog_posts_slug_idx on public.blog_posts(slug);
create index if not exists blog_posts_status_idx on public.blog_posts(status);
create index if not exists blog_posts_author_id_idx on public.blog_posts(author_id);
create index if not exists testimonials_featured_idx on public.testimonials(featured);
create index if not exists leads_status_idx on public.leads(status);
create index if not exists leads_email_idx on public.leads(email);

-- Create a trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply the trigger to all tables
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at_column();

create trigger update_projects_updated_at before update on public.projects
  for each row execute function update_updated_at_column();

create trigger update_blog_posts_updated_at before update on public.blog_posts
  for each row execute function update_updated_at_column();

create trigger update_testimonials_updated_at before update on public.testimonials
  for each row execute function update_updated_at_column();

create trigger update_team_members_updated_at before update on public.team_members
  for each row execute function update_updated_at_column();

create trigger update_leads_updated_at before update on public.leads
  for each row execute function update_updated_at_column();

create trigger update_services_updated_at before update on public.services
  for each row execute function update_updated_at_column();

-- Create profiles for new auth users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
