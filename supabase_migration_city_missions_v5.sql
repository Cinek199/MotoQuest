create extension if not exists pgcrypto;

create table if not exists public.mq_cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  center_lat double precision not null,
  center_lon double precision not null,
  active_missions integer not null check (active_missions > 0),
  required_missions integer not null check (required_missions > 0),
  completion_xp integer not null default 5000,
  created_at timestamptz not null default now()
);

create table if not exists public.mq_special_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  icon text not null,
  xp integer not null default 1500,
  created_at timestamptz not null default now()
);

create table if not exists public.mq_city_missions (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.mq_cities(id) on delete cascade,
  slug text not null,
  title text not null,
  description text not null,
  mission_type text not null check (mission_type in ('photo', 'motoshot', 'explore', 'ride', 'poi')),
  target_name text,
  target_lat double precision,
  target_lon double precision,
  radius_m integer not null default 350,
  photo_required boolean not null default false,
  motorcycle_required boolean not null default false,
  verification_prompt text,
  xp integer not null default 250,
  is_special boolean not null default false,
  special_badge_id uuid references public.mq_special_badges(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);

create table if not exists public.mq_mission_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.mq_city_missions(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create table if not exists public.mq_mission_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.mq_city_missions(id) on delete cascade,
  storage_path text,
  latitude double precision,
  longitude double precision,
  distance_m double precision,
  status text not null check (status in ('pending', 'approved', 'rejected', 'error')),
  ai_confidence numeric,
  ai_result jsonb,
  rejection_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.mq_mission_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.mq_city_missions(id) on delete cascade,
  submission_id uuid references public.mq_mission_submissions(id) on delete set null,
  completed_at timestamptz not null default now(),
  primary key (user_id, mission_id)
);

create table if not exists public.mq_city_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  city_id uuid not null references public.mq_cities(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, city_id)
);

create table if not exists public.mq_user_special_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.mq_special_badges(id) on delete cascade,
  mission_id uuid references public.mq_city_missions(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

insert into public.mq_cities
  (slug, name, center_lat, center_lon, active_missions, required_missions)
values
  ('warszawa', 'Warszawa', 52.2297, 21.0122, 20, 10),
  ('krakow', 'Krakow', 50.0647, 19.9450, 16, 8),
  ('wroclaw', 'Wroclaw', 51.1079, 17.0385, 16, 8),
  ('poznan', 'Poznan', 52.4064, 16.9252, 14, 7),
  ('lodz', 'Lodz', 51.7592, 19.4560, 14, 7),
  ('gdansk', 'Gdansk', 54.3520, 18.6466, 12, 6),
  ('szczecin', 'Szczecin', 53.4285, 14.5528, 12, 6),
  ('lublin', 'Lublin', 51.2465, 22.5684, 10, 5),
  ('katowice', 'Katowice', 50.2649, 19.0238, 10, 5),
  ('bydgoszcz', 'Bydgoszcz', 53.1235, 18.0084, 10, 5)
on conflict (slug) do update set
  name = excluded.name,
  center_lat = excluded.center_lat,
  center_lon = excluded.center_lon,
  active_missions = excluded.active_missions,
  required_missions = excluded.required_missions;

insert into public.mq_special_badges (slug, name, description, icon, xp)
values
  ('nocny-wilk', 'Nocny Wilk', 'MotoShot przy charakterystycznym miejscu po zmroku.', 'moon', 2000),
  ('lowca-wschodow', 'Lowca Wschodow Slonca', 'Zdjecie motocykla podczas wschodu slonca.', 'sunrise', 2000),
  ('lowca-burz', 'Lowca Burz', 'Zdjecie motocykla podczas burzy.', 'storm', 2500),
  ('lodowy-jezdziec', 'Lodowy Jezdziec', 'Jazda motocyklem w zimowych warunkach.', 'snow', 2500),
  ('krol-przeleczy', 'Krol Przeleczy', 'Odkrywanie przeleczy gorskich.', 'mountain', 3000),
  ('pogromca-zamkow', 'Pogromca Zamkow', 'Odwiedzanie polskich zamkow.', 'castle', 3000),
  ('zdobywca-wybrzeza', 'Zdobywca Wybrzeza', 'Odkrywanie punktow polskiego wybrzeza.', 'coast', 3000)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  xp = excluded.xp;

do $$
declare
  city record;
  mission_no integer;
  pool_size integer;
  angle double precision;
  radius_degrees double precision;
begin
  for city in select * from public.mq_cities loop
    pool_size := city.active_missions + 5;

    insert into public.mq_city_missions (
      city_id, slug, title, description, mission_type, target_name,
      target_lat, target_lon, radius_m, photo_required,
      motorcycle_required, verification_prompt, xp
    ) values (
      city.id,
      'foto-symbol-miasta',
      'Symbol miasta: ' || city.name,
      'Sfotografuj rozpoznawalny symbol lub charakterystyczne miejsce miasta.',
      'photo',
      'rozpoznawalny symbol miasta ' || city.name,
      city.center_lat,
      city.center_lon,
      1800,
      true,
      false,
      'Zdjecie musi wyraznie przedstawiać rozpoznawalny symbol, zabytek albo tablice jednoznacznie zwiazana z miastem ' || city.name || '.',
      400
    ) on conflict (city_id, slug) do nothing;

    insert into public.mq_city_missions (
      city_id, slug, title, description, mission_type, target_name,
      target_lat, target_lon, radius_m, photo_required,
      motorcycle_required, verification_prompt, xp
    ) values (
      city.id,
      'motoshot-centrum',
      'MotoShot: ' || city.name,
      'Zrob zdjecie swojego motocykla przy rozpoznawalnym miejscu miasta.',
      'motoshot',
      'centrum miasta ' || city.name,
      city.center_lat,
      city.center_lon,
      2000,
      true,
      true,
      'Zdjecie musi zawierac prawdziwy motocykl oraz rozpoznawalny miejski punkt, zabytek albo tablice zwiazana z miastem ' || city.name || '.',
      600
    ) on conflict (city_id, slug) do nothing;

    for mission_no in 1..pool_size - 2 loop
      angle := (mission_no::double precision / greatest(pool_size - 2, 1)) * 2 * pi();
      radius_degrees := 0.010 + ((mission_no % 5) * 0.004);

      insert into public.mq_city_missions (
        city_id, slug, title, description, mission_type, target_name,
        target_lat, target_lon, radius_m, photo_required,
        motorcycle_required, xp
      ) values (
        city.id,
        'punkt-' || lpad(mission_no::text, 2, '0'),
        'Punkt odkrywcy ' || mission_no,
        'Dotrzyj do wyznaczonego punktu w miescie ' || city.name || '.',
        'explore',
        'punkt odkrywcy ' || mission_no || ' - ' || city.name,
        city.center_lat + sin(angle) * radius_degrees,
        city.center_lon + cos(angle) * radius_degrees / greatest(cos(radians(city.center_lat)), 0.35),
        300,
        false,
        false,
        250
      ) on conflict (city_id, slug) do nothing;
    end loop;
  end loop;
end $$;

insert into public.mq_city_missions (
  city_id, slug, title, description, mission_type, target_name,
  target_lat, target_lon, radius_m, photo_required, motorcycle_required,
  verification_prompt, xp, is_special, special_badge_id
)
select
  c.id,
  'specjalna-nocny-wilk',
  'Nocny Wilk',
  'Zrob zdjecie motocykla przy charakterystycznym miejscu po zmroku.',
  'motoshot',
  'nocna Warszawa',
  c.center_lat,
  c.center_lon,
  2500,
  true,
  true,
  'Zdjecie musi przedstawiać prawdziwy motocykl, noc lub wyrazny zmrok oraz charakterystyczne oswietlone miejsce miejskie.',
  b.xp,
  true,
  b.id
from public.mq_cities c
join public.mq_special_badges b on b.slug = 'nocny-wilk'
where c.slug = 'warszawa'
on conflict (city_id, slug) do nothing;

create or replace function public.mq_assign_city_missions(p_city_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  mission_limit integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select active_missions into mission_limit
  from public.mq_cities
  where id = p_city_id;

  insert into public.mq_mission_assignments (user_id, mission_id)
  select auth.uid(), mission.id
  from public.mq_city_missions mission
  where mission.city_id = p_city_id
    and mission.is_special = false
  order by md5(mission.id::text || auth.uid()::text)
  limit mission_limit
  on conflict do nothing;
end;
$$;

create or replace function public.mq_refresh_rewards()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mission_city uuid;
  needed integer;
  completed integer;
  badge uuid;
  special boolean;
begin
  select city_id, special_badge_id, is_special
  into mission_city, badge, special
  from public.mq_city_missions
  where id = new.mission_id;

  if special and badge is not null then
    insert into public.mq_user_special_badges (user_id, badge_id, mission_id)
    values (new.user_id, badge, new.mission_id)
    on conflict do nothing;
    return new;
  end if;

  select required_missions into needed
  from public.mq_cities
  where id = mission_city;

  select count(*) into completed
  from public.mq_mission_completions completion
  join public.mq_city_missions mission on mission.id = completion.mission_id
  where completion.user_id = new.user_id
    and mission.city_id = mission_city
    and mission.is_special = false;

  if completed >= needed then
    insert into public.mq_city_completions (user_id, city_id)
    values (new.user_id, mission_city)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists mq_completion_rewards on public.mq_mission_completions;
create trigger mq_completion_rewards
after insert on public.mq_mission_completions
for each row execute function public.mq_refresh_rewards();

alter table public.mq_cities enable row level security;
alter table public.mq_special_badges enable row level security;
alter table public.mq_city_missions enable row level security;
alter table public.mq_mission_assignments enable row level security;
alter table public.mq_mission_submissions enable row level security;
alter table public.mq_mission_completions enable row level security;
alter table public.mq_city_completions enable row level security;
alter table public.mq_user_special_badges enable row level security;

drop policy if exists "mq_cities_read" on public.mq_cities;
drop policy if exists "mq_badges_read" on public.mq_special_badges;
drop policy if exists "mq_missions_read" on public.mq_city_missions;
drop policy if exists "mq_assignments_own_read" on public.mq_mission_assignments;
drop policy if exists "mq_submissions_own_read" on public.mq_mission_submissions;
drop policy if exists "mq_completions_own_read" on public.mq_mission_completions;
drop policy if exists "mq_city_completions_own_read" on public.mq_city_completions;
drop policy if exists "mq_special_badges_own_read" on public.mq_user_special_badges;

create policy "mq_cities_read" on public.mq_cities for select to authenticated using (true);
create policy "mq_badges_read" on public.mq_special_badges for select to authenticated using (true);
create policy "mq_missions_read" on public.mq_city_missions for select to authenticated using (true);
create policy "mq_assignments_own_read" on public.mq_mission_assignments for select to authenticated using (auth.uid() = user_id);
create policy "mq_submissions_own_read" on public.mq_mission_submissions for select to authenticated using (auth.uid() = user_id);
create policy "mq_completions_own_read" on public.mq_mission_completions for select to authenticated using (auth.uid() = user_id);
create policy "mq_city_completions_own_read" on public.mq_city_completions for select to authenticated using (auth.uid() = user_id);
create policy "mq_special_badges_own_read" on public.mq_user_special_badges for select to authenticated using (auth.uid() = user_id);

grant execute on function public.mq_assign_city_missions(uuid) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mission-photos',
  'mission-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "mission_photos_insert_own" on storage.objects;
drop policy if exists "mission_photos_read_own" on storage.objects;
drop policy if exists "mission_photos_delete_own" on storage.objects;

create policy "mission_photos_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'mission-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "mission_photos_read_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'mission-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "mission_photos_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'mission-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
