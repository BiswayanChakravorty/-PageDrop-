-- Run in the Supabase SQL Editor before enabling uploads.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  slug varchar(60) not null unique,
  file_name varchar(255) not null,
  file_url text,
  published_url text not null,
  content_type text not null,
  file_size bigint not null check (file_size > 0),
  status text not null default 'pending' check (status in ('pending', 'published', 'failed')),
  views_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_slug on public.projects (slug);
create index if not exists idx_projects_status_created_at on public.projects (status, created_at desc);
create index if not exists idx_projects_user_id on public.projects (user_id);

create table if not exists public.analytics (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'download', 'qr')),
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists idx_analytics_project_created_at on public.analytics (project_id, created_at desc);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.analytics enable row level security;
-- No public policies are intentionally created. Server routes use SUPABASE_SERVICE_ROLE_KEY.
