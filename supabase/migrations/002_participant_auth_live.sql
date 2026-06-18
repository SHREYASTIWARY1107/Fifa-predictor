-- Additive migration: participant reclaim + live minute (no data loss)

alter table participants
  add column if not exists password_hash text;

alter table matches
  add column if not exists live_minute int;
