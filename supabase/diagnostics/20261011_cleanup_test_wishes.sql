-- 清理：生产库中残留的测试愿望及其全部关联数据
--
-- 背景
--   排查 wish_count_progress_daily 漂移时，发现测试脚本产生的数据残留在生产库：
--     cloud-bench *   来自 scripts/benchmark-cloud-operations.mjs
--     daily-seed *    来自 scripts/seed-daily-scenarios.mjs
--     另有 4 条手工测试：同步修复验证-星币读取保留 / 1 / 延迟测试愿望-* ×2
--   这些数据会污染回顾页统计与星币口径。
--
-- 安全性（双重限定）
--   1) 名称必须匹配上述模式；
--   2) 且必须位于测试空间 a00f2907-bf09-4a59-b62f-700991bb493d
--      （"tai jie yue 的愿望空间"，1 名成员）。
--   真实共用空间 83fa4725-309c-4e46-b5af-9231a279d104
--      （"1103475965 的愿望空间"，2 名成员）经核查含 0 条测试数据，不受本脚本影响。
--
-- 不在范围内（保留）
--   测试空间中 2 条名称正常的愿望：做一次晚餐 / 看一下雨（2026-06-07），
--   以及真实空间中全部 44 条愿望。
--
-- 影响（执行前实测）
--   31 条愿望 / 8 步骤 / 11 留言 / 7 图片 / 91 手账条目 / 1 每日投影 / 31 星币流水
--   将移除星币合计 31。
--
-- 幂等性
--   可重复执行；第二次执行各项计数均为 0。

with target as (
  select w.id, w.title
  from public.wishes w
  where w.space_id = 'a00f2907-bf09-4a59-b62f-700991bb493d'::uuid
    and (
      w.title ilike 'cloud-bench%'
      or w.title ilike 'daily-seed%'
      or w.title ilike '延迟测试愿望-%'
      or w.title = '同步修复验证-星币读取保留'
      or w.title = '1'
    )
),
deleted_reactions as (
  delete from public.thread_reactions tr
  using public.wish_threads th, target t
  where tr.target_thread_id = th.id::text
    and th.wish_id = t.id
  returning tr.id
),
deleted_thread_images as (
  delete from public.wish_thread_images wi
  using public.wish_threads th, target t
  where wi.thread_id = th.id
    and th.wish_id = t.id
  returning wi.id
),
deleted_threads as (
  delete from public.wish_threads th
  using target t
  where th.wish_id = t.id
  returning th.id
),
deleted_comment_images as (
  delete from public.wish_comment_images ci
  using public.wish_comments c, target t
  where ci.comment_id = c.id
    and c.wish_id = t.id
  returning ci.id
),
deleted_comments as (
  delete from public.wish_comments c
  using target t
  where c.wish_id = t.id
  returning c.id
),
deleted_steps as (
  delete from public.wish_steps s
  using target t
  where s.wish_id = t.id
  returning s.id
),
deleted_images as (
  delete from public.wish_images i
  using target t
  where i.wish_id = t.id
  returning i.id
),
deleted_daily as (
  delete from public.wish_count_progress_daily d
  using target t
  where d.wish_id = t.id
  returning d.id
),
deleted_claims as (
  delete from public.reward_claims r
  using target t
  where r.source_wish_id = t.id
  returning r.id
),
deleted_wishes as (
  delete from public.wishes w
  using target t
  where w.id = t.id
  returning w.id
)
select '目标愿望数' as metric, (select count(*) from target)::text as value
union all select '已删 thread_reactions', (select count(*) from deleted_reactions)::text
union all select '已删 wish_thread_images', (select count(*) from deleted_thread_images)::text
union all select '已删 wish_threads', (select count(*) from deleted_threads)::text
union all select '已删 wish_comment_images', (select count(*) from deleted_comment_images)::text
union all select '已删 wish_comments', (select count(*) from deleted_comments)::text
union all select '已删 wish_steps', (select count(*) from deleted_steps)::text
union all select '已删 wish_images', (select count(*) from deleted_images)::text
union all select '已删 每日投影', (select count(*) from deleted_daily)::text
union all select '已删 reward_claims', (select count(*) from deleted_claims)::text
union all select '已删 wishes', (select count(*) from deleted_wishes)::text;
