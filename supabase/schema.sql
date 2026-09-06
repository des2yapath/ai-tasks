-- AI Tasks initial schema
-- Run in Supabase SQL Editor, or use `supabase db push` with the migration copy.

create extension if not exists pgcrypto;

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null default '',
  input_summary text not null default '',
  attachments jsonb not null default '[]',
  instructions text not null default '',
  provider_name text not null,
  model text not null,
  status text not null default 'pending_review'
    check (status in ('pending_review','applied','discarded','failed')),
  task_count integer not null default 0,
  result jsonb not null default '{"projectName":null,"tasks":[]}',
  error text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  color text not null default '#6366f1',
  icon text not null default 'folder',
  archived boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  parent_task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  description text not null default '',
  status text not null default 'todo'
    check (status in ('inbox','todo','in_progress','done','archived')),
  priority text not null default 'none'
    check (priority in ('none','low','medium','high','urgent')),
  due_date date,
  completed_at timestamptz,
  estimated_minutes integer,
  tags text[] not null default '{}',
  source text not null default 'manual' check (source in ('manual','ai','quick_add')),
  ai_generated boolean not null default false,
  generation_id uuid references public.ai_generations(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_idx on public.tasks(user_id);
create index tasks_project_idx on public.tasks(project_id);
create index tasks_due_idx on public.tasks(due_date);
create index tasks_status_idx on public.tasks(user_id, status);
create index tasks_parent_idx on public.tasks(parent_task_id);
create index projects_user_idx on public.projects(user_id);
create index generations_user_idx on public.ai_generations(user_id, created_at desc);

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.ai_generations enable row level security;

create policy "owner_all_projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_all_tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_all_generations" on public.ai_generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.ai_generations;
