-- 数据修复：把 wish_count_progress_daily 重算为 reward_claims 的投影
--
-- 背景
--   20260804_post_migration_acceptance.sql 的 count_progress_daily_drift_count 期望为 0，
--   2026-10-11 实测为 4。经诊断：
--     - progress_current 与 reward_claims 流水完全一致（愿望级数据没问题）
--     - 只有 wish_count_progress_daily 偏高，共多出 9 个单位，涉及 3 条「每日一万步」愿望
--     - 同步触发器 trg_reward_claims_sync_count_progress_daily 存在且已启用
--
-- 成因（详见 202610110002 的修复说明）
--   202608040001 的 RPC 对投影表按 increased_quantity 无条件累加，
--   但只在 pending_quantity > 0 且 target_delta > 0 时才写流水。
--   当该守卫为假（例如用户先下调再上调 progress_current，导致
--   claimed_quantity 已覆盖新值、unclaimed_quantity 归零）时，
--   投影被累加却没有流水支撑，且触发器不会触发，差异永久残留。
--
-- 本迁移做什么
--   按项目既定契约「reward_claims 为事实源，daily 为可重建投影」，
--   从流水全量重算投影，并删除没有流水支撑的孤儿行。
--
-- 幂等性
--   可重复执行。口径与 202608040005 尾部的 one-time reconcile 完全一致。

-- 1) 按流水重算（存在则覆盖为绝对口径，不做累加）
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

-- 2) 删除没有任何流水支撑的孤儿投影行
delete from public.wish_count_progress_daily daily
where not exists (
  select 1
  from public.reward_claims claim
  where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
    and claim.source_wish_id = daily.wish_id
    and claim.source_step_id is null
    and (timezone('utc', claim.created_at) + interval '8 hours')::date = daily.progress_date
);
