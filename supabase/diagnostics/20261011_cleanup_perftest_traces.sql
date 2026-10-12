-- 清理：本次性能测试产生的全部痕迹（标题前缀 性能探针-）
--
-- 覆盖：愿望本体 + 步骤/留言/留言图片/手账/手账图片/表情回应/每日投影/星币流水
--
-- 存储对象不在本脚本处理：Supabase 禁止直接删除 storage 表
-- （storage.protect_delete 会抛 42501，要求改用 Storage API）。
-- 对应的桶内对象由 .e2e/cleanup-storage.mjs 通过 Storage API 删除。
--
-- 幂等：可重复执行，第二次各项计数均为 0。

with target as (
  select w.id
  from public.wishes w
  where w.title ~ '^(性能探针|对照探针|严格探针|调试探针)-'
),
deleted_reactions as (
  delete from public.thread_reactions tr
  using public.wish_threads th, target t
  where tr.target_thread_id = th.id::text
    and th.wish_id = t.id
  returning tr.id
),
deleted_thread_images as (
  delete from public.wish_thread_images ti
  using public.wish_threads th, target t
  where ti.thread_id = th.id
    and th.wish_id = t.id
  returning ti.id
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
select '目标愿望' as metric, (select count(*) from target)::text as value
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
