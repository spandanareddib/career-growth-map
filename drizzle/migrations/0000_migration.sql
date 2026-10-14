create type public.app_role as enum ('job_seeker','recruiter');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Signup: both roles are non-privileged account types; only these two values are accepted.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := coalesce(new.raw_user_meta_data->>'account_type', 'job_seeker');
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'));
  if r not in ('job_seeker','recruiter') then r := 'job_seeker'; end if;
  insert into public.user_roles (user_id, role) values (new.id, r::app_role) on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_name text not null,
  file_path text not null,
  mime_type text not null,
  status text not null default 'queued',
  progress_note text,
  error text,
  parsed jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.resumes to authenticated;
grant all on public.resumes to service_role;
alter table public.resumes enable row level security;
create policy "own resumes" on public.resumes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  title text not null,
  company text,
  description text not null,
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.jobs to authenticated;
grant all on public.jobs to service_role;
alter table public.jobs enable row level security;
create policy "read own or public jobs" on public.jobs for select to authenticated using (auth.uid() = owner_id or is_public);
create policy "insert own jobs" on public.jobs for insert to authenticated with check (auth.uid() = owner_id and (not is_public or public.has_role(auth.uid(),'recruiter')));
create policy "update own jobs" on public.jobs for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id and (not is_public or public.has_role(auth.uid(),'recruiter')));
create policy "delete own jobs" on public.jobs for delete to authenticated using (auth.uid() = owner_id);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'running',
  score int,
  result jsonb,
  error text,
  applied boolean not null default false,
  candidate_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.analyses to authenticated;
grant all on public.analyses to service_role;
alter table public.analyses enable row level security;
create policy "own analyses" on public.analyses for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recruiter sees applicants" on public.analyses for select to authenticated using (
  applied and exists (select 1 from public.jobs j where j.id = job_id and j.owner_id = auth.uid())
);

alter publication supabase_realtime add table public.resumes;
alter publication supabase_realtime add table public.analyses;

create policy "own resume files read" on storage.objects for select to authenticated using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own resume files insert" on storage.objects for insert to authenticated with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own resume files delete" on storage.objects for delete to authenticated using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);