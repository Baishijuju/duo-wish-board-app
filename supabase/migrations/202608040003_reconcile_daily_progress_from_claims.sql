-- Reconcile wish_count_progress_daily from count_star_coin claims.
-- This is a one-time data repair to avoid stale/incorrect daily progress units
-- impacting merged thread copy like "今天前进了 X 点".

with claim_daily as (
  select
    claim.source_wish_id as wish_id,
    claim.space_id,
    claim.owner_id,
    (timezone('utc', claim.created_at) + interval '8 hours')::date as progress_date,
    greatest(sum(greatest(claim.quantity, 0)), 0)::integer as progress_units,
    max(claim.created_at) as last_event_at
  from public.reward_claims claim
  where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
    and claim.source_wish_id is not null
    and claim.source_step_id is null
  group by
    claim.source_wish_id,
    claim.space_id,
    claim.owner_id,
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

-- Remove daily rows that no longer have a matching count_star_coin claim aggregate.
delete from public.wish_count_progress_daily daily
where not exists (
  select 1
  from (
    select
      claim.source_wish_id as wish_id,
      (timezone('utc', claim.created_at) + interval '8 hours')::date as progress_date
    from public.reward_claims claim
    where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
      and claim.source_wish_id is not null
      and claim.source_step_id is null
    group by
      claim.source_wish_id,
      (timezone('utc', claim.created_at) + interval '8 hours')::date
  ) claim_daily
  where claim_daily.wish_id = daily.wish_id
    and claim_daily.progress_date = daily.progress_date
);
