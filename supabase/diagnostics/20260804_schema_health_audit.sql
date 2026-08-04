-- Supabase schema health audit for wish/reward/thread consistency
-- Generated: 2026-08-04

-- 1) RLS enabled but no policies (high risk)
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = 'public' and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
having c.relrowsecurity = true and count(p.policyname) = 0
order by c.relname;

-- 2) Thread projection drift: reward_claims not projected into wish_threads
select
  rc.claim_kind,
  count(*) as missing_thread_count
from public.reward_claims rc
left join public.wish_threads wt
  on wt.source_table = 'reward_claims'
 and wt.source_id = rc.id
where wt.id is null
group by rc.claim_kind
order by missing_thread_count desc;

-- 3) Count progress daily drift vs claims (owner-aware)
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
select count(*) as mismatch_count
from (
  select
    coalesce(c.wish_id, d.wish_id) as wish_id,
    coalesce(c.progress_date, d.progress_date) as progress_date,
    coalesce(c.owner_id, d.owner_id) as owner_id,
    c.claim_units,
    d.progress_units as daily_units
  from claim_daily c
  full join public.wish_count_progress_daily d
    on d.wish_id = c.wish_id
   and d.progress_date = c.progress_date
   and d.owner_id = c.owner_id
  where c.wish_id is null
     or d.wish_id is null
     or c.claim_units <> d.progress_units
) drift;

-- 4) Daily table uniqueness vs semantics check
-- If this returns rows, current unique(wish_id, progress_date) may cause owner collisions.
select
  wish_id,
  progress_date,
  count(distinct owner_id) as owner_count,
  array_agg(distinct owner_id) as owners
from public.wish_count_progress_daily
group by wish_id, progress_date
having count(distinct owner_id) > 1
order by progress_date desc;

-- 5) Reward claim mutual-exclusion anomalies
-- source_step_id should only appear for step-related kinds.
select
  claim_kind,
  count(*) as anomaly_count
from public.reward_claims
where source_step_id is not null
  and claim_kind not in ('step_reward'::public.reward_claim_kind, 'step_star_coin'::public.reward_claim_kind)
group by claim_kind
order by anomaly_count desc;

-- 6) Reward claim title/note snapshot nullability sanity
select
  count(*) filter (where char_length(trim(title_snapshot)) = 0) as empty_title_rows,
  count(*) filter (where note_snapshot is null) as null_note_rows
from public.reward_claims;
