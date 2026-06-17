-- FIFA World Cup 2026 Friends Predictor schema

create extension if not exists "pgcrypto";

create table if not exists league_settings (
  id int primary key default 1 check (id = 1),
  pin_hash text not null,
  name text not null default 'Friends WC 2026',
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  avatar_color text not null default '#22c55e',
  created_at timestamptz not null default now(),
  constraint display_name_length check (char_length(display_name) between 2 and 20)
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  external_id int not null unique,
  round text not null,
  stage text not null check (stage in ('group', 'r32', 'r16', 'qf', 'sf', 'third', 'final')),
  group_name text,
  team1 text not null,
  team2 text not null,
  flag1 text,
  flag2 text,
  venue text,
  kickoff_at timestamptz not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'live', 'finished')),
  home_score int,
  away_score int,
  synced_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists matches_kickoff_idx on matches (kickoff_at);
create index if not exists matches_stage_idx on matches (stage);
create index if not exists matches_status_idx on matches (status);

create table if not exists predictions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants (id) on delete cascade,
  match_id uuid not null references matches (id) on delete cascade,
  home_pred int not null check (home_pred >= 0),
  away_pred int not null check (away_pred >= 0),
  points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (participant_id, match_id)
);

create index if not exists predictions_participant_idx on predictions (participant_id);
create index if not exists predictions_match_idx on predictions (match_id);

create or replace function calculate_prediction_points(
  home_pred int,
  away_pred int,
  home_score int,
  away_score int
) returns int
language plpgsql
immutable
as $$
declare
  pred_result int;
  actual_result int;
begin
  if home_score is null or away_score is null then
    return 0;
  end if;

  if home_pred = home_score and away_pred = away_score then
    return 3;
  end if;

  pred_result := case
    when home_pred > away_pred then 1
    when home_pred < away_pred then -1
    else 0
  end;

  actual_result := case
    when home_score > away_score then 1
    when home_score < away_score then -1
    else 0
  end;

  if pred_result = actual_result then
    return 1;
  end if;

  return 0;
end;
$$;

create or replace function recalculate_match_points(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  select id, status, home_score, away_score
  into m
  from matches
  where id = p_match_id;

  if m.id is null or m.status <> 'finished' or m.home_score is null or m.away_score is null then
    return;
  end if;

  update predictions p
  set
    points = calculate_prediction_points(p.home_pred, p.away_pred, m.home_score, m.away_score),
    updated_at = now()
  where p.match_id = p_match_id;
end;
$$;

create or replace view leaderboard
with (security_invoker = true)
as
select
  p.id as participant_id,
  p.display_name,
  p.avatar_color,
  coalesce(sum(pr.points), 0)::int as total_points,
  count(pr.id) filter (
    where pr.points = 3
  )::int as exact_scores,
  count(pr.id)::int as predictions_made,
  rank() over (order by coalesce(sum(pr.points), 0) desc, p.display_name asc) as rank
from participants p
left join predictions pr on pr.participant_id = p.id
group by p.id, p.display_name, p.avatar_color;

alter table league_settings enable row level security;
alter table participants enable row level security;
alter table matches enable row level security;
alter table predictions enable row level security;

create policy "league_settings_select" on league_settings
  for select to anon, authenticated using (true);

create policy "participants_select" on participants
  for select to anon, authenticated using (true);

create policy "matches_select" on matches
  for select to anon, authenticated using (true);

create policy "predictions_select" on predictions
  for select to anon, authenticated using (true);

grant select on leaderboard to anon, authenticated;
grant usage on schema public to anon, authenticated;
