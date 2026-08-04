-- Post-migration acceptance checks
-- Purpose: one-shot verification after applying 202608040004/005/006 migrations

with
rls_without_policy as (
  select count(*)::int as value
  from (
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relrowsecurity = true
    group by c.relname
    having count(p.policyname) = 0
  ) t
),
missing_reward_claim_threads as (
  select count(*)::int as value
  from public.reward_claims rc
  left join public.wish_threads wt
    on wt.source_table = 'reward_claims'
   and wt.source_id = rc.id
  where wt.id is null
),
count_progress_drift as (
  with claim_daily as (
    select
      claim.source_wish_id as wish_id,
      (timezone('utc', claim.created_at) + interval '8 hours')::date as progress_date,
      claim.owner_id,
      greatest(sum(greatest(claim.quantity, 0)), 0)::int as claim_units
    from public.reward_claims claim
    where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
      and claim.source_wish_id is not null
      and claim.source_step_id is null
    group by
      claim.source_wish_id,
      (timezone('utc', claim.created_at) + interval '8 hours')::date,
      claim.owner_id
  )
  select count(*)::int as value
  from (
    select 1
    from claim_daily c
    full join public.wish_count_progress_daily d
      on d.wish_id = c.wish_id
     and d.progress_date = c.progress_date
     and d.owner_id = c.owner_id
    where c.wish_id is null
       or d.wish_id is null
       or c.claim_units <> d.progress_units
  ) drift
),
daily_owner_collision as (
  select count(*)::int as value
  from (
    select wish_id, progress_date
    from public.wish_count_progress_daily
    group by wish_id, progress_date
    having count(distinct owner_id) > 1
  ) t
),
invalid_step_source_kind as (
  select count(*)::int as value
  from public.reward_claims
  where source_step_id is not null
    and claim_kind not in (
      'step_reward'::public.reward_claim_kind,
      'step_star_coin'::public.reward_claim_kind,
      'star_coin'::public.reward_claim_kind
    )
)
select
  check_name,
  actual_value,
  expected_value,
  actual_value = expected_value as passed
from (
  select 'rls_enabled_without_policy_count'::text as check_name, (select value from rls_without_policy) as actual_value, 0::int as expected_value
  union all
  select 'missing_reward_claim_thread_count', (select value from missing_reward_claim_threads), 0
  union all
  select 'count_progress_daily_drift_count', (select value from count_progress_drift), 0
  union all
  select 'daily_owner_collision_count', (select value from daily_owner_collision), 0
  union all
  select 'invalid_step_source_claim_kind_count', (select value from invalid_step_source_kind), 0
) checks
order by check_name;
