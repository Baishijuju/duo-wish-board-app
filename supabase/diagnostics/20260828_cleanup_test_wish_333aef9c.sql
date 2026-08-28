-- Cleanup for temporary test wish and all linked traces.
-- Target wish:
--   id = 333aef9c-b5f9-4c2d-b9df-1d336ab403fc
--   title like 测试实时同步-%

with target as (
  select id, title
  from public.wishes
  where id = '333aef9c-b5f9-4c2d-b9df-1d336ab403fc'::uuid
     or title like '测试实时同步-%'
  order by created_at desc
  limit 1
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
deleted_wish as (
  delete from public.wishes w
  using target t
  where w.id = t.id
  returning w.id
)
select
  (select count(*) from target) as target_wish_count,
  (select count(*) from deleted_reactions) as deleted_thread_reactions,
  (select count(*) from deleted_thread_images) as deleted_thread_images,
  (select count(*) from deleted_threads) as deleted_threads,
  (select count(*) from deleted_comment_images) as deleted_comment_images,
  (select count(*) from deleted_comments) as deleted_comments,
  (select count(*) from deleted_steps) as deleted_steps,
  (select count(*) from deleted_images) as deleted_images,
  (select count(*) from deleted_daily) as deleted_daily_progress,
  (select count(*) from deleted_claims) as deleted_reward_claims,
  (select count(*) from deleted_wish) as deleted_wishes;