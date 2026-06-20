create or replace function public.mq_real_player_leaderboard(p_limit integer default 20)
returns table(user_id uuid, username text, avatar_url text, tiles_count integer)
language sql
security definer
set search_path = public, auth
as $$
  select p.id, p.username, p.avatar_url,
    coalesce(jsonb_array_length(coalesce(pp.tiles, '[]'::jsonb)), 0)::integer
  from public.profiles p
  join auth.users u on u.id = p.id
  left join public.player_progress pp on pp.user_id = p.id
  where coalesce(u.is_anonymous, false) = false
    and u.email is not null
    and nullif(trim(p.username), '') is not null
  order by coalesce(jsonb_array_length(coalesce(pp.tiles, '[]'::jsonb)), 0) desc
  limit greatest(1, least(p_limit, 100));
$$;

grant execute on function public.mq_real_player_leaderboard(integer) to anon, authenticated;
