create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username));

create table if not exists public.player_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tiles jsonb not null default '[]'::jsonb,
  towns jsonb not null default '[]'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  trips jsonb not null default '[]'::jsonb,
  distance_km numeric not null default 0,
  xp integer not null default 0,
  level integer not null default 1,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists player_progress_set_updated_at on public.player_progress;
create trigger player_progress_set_updated_at
before update on public.player_progress
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_username text;
begin
  requested_username := nullif(trim(new.raw_user_meta_data->>'username'), '');

  if requested_username is null then
    requested_username := 'MotoManiak-' || left(new.id::text, 8);
  end if;

  insert into public.profiles (id, username)
  values (new.id, requested_username)
  on conflict (id) do nothing;

  return new;
exception
  when unique_violation then
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.player_progress enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "player_progress_select_own" on public.player_progress;
create policy "player_progress_select_own"
on public.player_progress
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "player_progress_insert_own" on public.player_progress;
create policy "player_progress_insert_own"
on public.player_progress
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "player_progress_update_own" on public.player_progress;
create policy "player_progress_update_own"
on public.player_progress
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
