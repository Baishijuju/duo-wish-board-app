-- 诊断：count_progress_daily 漂移明细
--
-- 背景：20260804_post_migration_acceptance.sql 的 count_progress_daily_drift_count 期望为 0，
-- 但 2026-10-11 实测为 4。本脚本沿用完全相同的判定口径（full join + 单位比对），
-- 但输出每一行漂移的具体数值，用于定位原因。
--
-- 口径说明：
--   claim_daily 从 reward_claims 聚合（claim_kind = count_star_coin，
--   排除 step 来源，按 UTC+8 折算自然日），与投影表 wish_count_progress_daily 对齐。

with claim_daily as (
  select
    claim.source_wish_id as wish_id,
    (timezone('utc', claim.created_at) + interval '8 hours')::date as progress_date,
    claim.owner_id,
    greatest(sum(greatest(claim.quantity, 0)), 0)::int as claim_units,
    count(*)::int as claim_rows
  from public.reward_claims claim
  where claim.claim_kind = 'count_star_coin'::public.reward_claim_kind
    and claim.source_wish_id is not null
    and claim.source_step_id is null
  group by
    claim.source_wish_id,
    (timezone('utc', claim.created_at) + interval '8 hours')::date,
    claim.owner_id
)
select
  coalesce(c.wish_id, d.wish_id) as wish_id,
  left(coalesce(w.title, '(已删除)'), 28) as wish_title,
  coalesce(c.progress_date, d.progress_date) as progress_date,
  coalesce(c.owner_id, d.owner_id) as owner_id,
  c.claim_units,
  c.claim_rows,
  d.progress_units,
  coalesce(c.claim_units, 0) - coalesce(d.progress_units, 0) as diff,
  case
    when c.wish_id is null then '投影表多余'
    when d.wish_id is null then '投影缺失'
    else '数值不一致'
  end as drift_type
from claim_daily c
full join public.wish_count_progress_daily d
  on d.wish_id = c.wish_id
 and d.progress_date = c.progress_date
 and d.owner_id = c.owner_id
left join public.wishes w
  on w.id = coalesce(c.wish_id, d.wish_id)
where c.wish_id is null
   or d.wish_id is null
   or c.claim_units <> d.progress_units
order by progress_date desc, wish_id;
