alter table public.player_progress
  add column if not exists garage jsonb not null default '[]'::jsonb,
  add column if not exists active_bike_id text;

comment on column public.player_progress.garage is 'Motocykle synchronizowane miedzy urzadzeniami';
comment on column public.player_progress.active_bike_id is 'Id aktywnego motocykla';
