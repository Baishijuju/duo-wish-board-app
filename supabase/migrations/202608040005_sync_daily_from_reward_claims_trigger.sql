-- Keep wish_count_progress_daily in sync with reward_claims automatically.
-- This migration is compatibility-first and does not change existing unique keys.

create or replace function public.recompute_count_progress_daily_for_wish_date(
  target_wish_id uuid,
  target_progress_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  aggregated record;
begin
  if target_wish_id is null or target_progress_date is null then
    return;
  end if;

  select
    claim.source_wish_id as wish_id,
    min(claim.space_id::text)::uuid as space_id,
    min(claim.owner_id::text)::uuid as owner_id,
    target_progress_date as progress_date,
    greatest(sum(greatest(claim.quantity, 0)), 0)::integer as progress_units,
    max(claim.created_at) as last_event_at
  into aggregated
  from public.reward_claims claim
  where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
    and claim.source_wish_id = target_wish_id
    and claim.source_step_id is null
    and (timezone('utc', claim.created_at) + interval '8 hours')::date = target_progress_date
  group by claim.source_wish_id;

  if aggregated.wish_id is null then
    delete from public.wish_count_progress_daily daily
    where daily.wish_id = target_wish_id
      and daily.progress_date = target_progress_date;
    return;
  end if;

  insert into public.wish_count_progress_daily (
    wish_id,
    space_id,
    owner_id,
    progress_date,
    progress_units,
    last_event_at,
    created_at,
    updated_at
  )
  values (
    aggregated.wish_id,
    aggregated.space_id,
    aggregated.owner_id,
    aggregated.progress_date,
    aggregated.progress_units,
    aggregated.last_event_at,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (wish_id, progress_date)
  do update set
    space_id = excluded.space_id,
    owner_id = excluded.owner_id,
    progress_units = excluded.progress_units,
    last_event_at = excluded.last_event_at,
    updated_at = timezone('utc', now());
end;
$$;

create or replace function public.sync_count_progress_daily_from_reward_claims()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_progress_date date;
  new_progress_date date;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    if old.claim_kind = 'count_star_coin'::public.reward_claim_kind
      and old.source_wish_id is not null
      and old.source_step_id is null then
      old_progress_date := (timezone('utc', old.created_at) + interval '8 hours')::date;
      perform public.recompute_count_progress_daily_for_wish_date(old.source_wish_id, old_progress_date);
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.claim_kind = 'count_star_coin'::public.reward_claim_kind
      and new.source_wish_id is not null
      and new.source_step_id is null then
      new_progress_date := (timezone('utc', new.created_at) + interval '8 hours')::date;
      perform public.recompute_count_progress_daily_for_wish_date(new.source_wish_id, new_progress_date);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reward_claims_sync_count_progress_daily on public.reward_claims;

create trigger trg_reward_claims_sync_count_progress_daily
after insert or update or delete on public.reward_claims
for each row
execute function public.sync_count_progress_daily_from_reward_claims();

-- One-time full reconcile to eliminate existing drift.
with claim_daily as (
  select
    claim.source_wish_id as wish_id,
    min(claim.space_id::text)::uuid as space_id,
    min(claim.owner_id::text)::uuid as owner_id,
    (timezone('utc', claim.created_at) + interval '8 hours')::date as progress_date,
    greatest(sum(greatest(claim.quantity, 0)), 0)::integer as progress_units,
    max(claim.created_at) as last_event_at
  from public.reward_claims claim
  where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
    and claim.source_wish_id is not null
    and claim.source_step_id is null
  group by
    claim.source_wish_id,
    (timezone('utc', claim.created_at) + interval '8 hours')::date
)
insert into public.wish_count_progress_daily (
  wish_id,
  space_id,
  owner_id,
  progress_date,
  progress_units,
  last_event_at,
  created_at,
  updated_at
)
select
  claim_daily.wish_id,
  claim_daily.space_id,
  claim_daily.owner_id,
  claim_daily.progress_date,
  claim_daily.progress_units,
  claim_daily.last_event_at,
  timezone('utc', now()),
  timezone('utc', now())
from claim_daily
on conflict (wish_id, progress_date)
do update set
  space_id = excluded.space_id,
  owner_id = excluded.owner_id,
  progress_units = excluded.progress_units,
  last_event_at = excluded.last_event_at,
  updated_at = timezone('utc', now());

-- Cleanup rows with no source claims.
delete from public.wish_count_progress_daily daily
where not exists (
  select 1
  from public.reward_claims claim
  where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
    and claim.source_wish_id = daily.wish_id
    and claim.source_step_id is null
    and (timezone('utc', claim.created_at) + interval '8 hours')::date = daily.progress_date
);
