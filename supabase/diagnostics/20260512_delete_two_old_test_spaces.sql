-- 在 Supabase Dashboard 的 SQL Editor 中执行。
-- 目标：删除 1103475965@qq.com 这 3 个测试空间里最早的 2 个，仅保留最新的一个。
-- 将删除的空间：
-- 58bac9da-638c-4c8e-9548-ce69edef95fc
-- 85a3c8a0-6647-433e-aac1-5859e99fcd98
-- 保留的空间：
-- 83fa4725-309c-4e46-b5af-9231a279d104
-- 注意：数据库行会级联删除，但 storage bucket 里的对象不会自动清理。

begin;

create temp table cleanup_target_spaces (
  id uuid primary key
) on commit drop;

insert into cleanup_target_spaces (id)
values
  ('58bac9da-638c-4c8e-9548-ce69edef95fc'),
  ('85a3c8a0-6647-433e-aac1-5859e99fcd98');

do $$
declare
  target_user_id uuid;
  matched_count integer;
begin
  select id
  into target_user_id
  from auth.users
  where email = '1103475965@qq.com'
  limit 1;

  if target_user_id is null then
    raise exception '未找到 1103475965@qq.com 对应的 auth.users 记录';
  end if;

  select count(*)
  into matched_count
  from public.spaces
  where id in (select id from cleanup_target_spaces)
    and created_by = target_user_id;

  if matched_count <> 2 then
    raise exception '待删除空间校验失败：预期命中 2 条，实际命中 % 条。', matched_count;
  end if;
end
$$;

select
  'target-spaces-preview' as step,
  space.id,
  space.name,
  space.invite_code,
  space.created_by,
  space.created_at
from public.spaces as space
where space.id in (select id from cleanup_target_spaces)
order by space.created_at asc;

select 'space_members' as relation, count(*) as row_count
from public.space_members
where space_id in (select id from cleanup_target_spaces)
union all
select 'wishes' as relation, count(*) as row_count
from public.wishes
where space_id in (select id from cleanup_target_spaces)
union all
select 'wish_comments' as relation, count(*) as row_count
from public.wish_comments comment
join public.wishes wish on wish.id = comment.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
union all
select 'wish_steps' as relation, count(*) as row_count
from public.wish_steps step
join public.wishes wish on wish.id = step.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
union all
select 'wish_images' as relation, count(*) as row_count
from public.wish_images image
join public.wishes wish on wish.id = image.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
union all
select 'wish_comment_images' as relation, count(*) as row_count
from public.wish_comment_images image
join public.wish_comments comment on comment.id = image.comment_id
join public.wishes wish on wish.id = comment.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
union all
select 'wish_threads' as relation, count(*) as row_count
from public.wish_threads thread
where thread.space_id in (select id from cleanup_target_spaces)
union all
select 'wish_thread_images' as relation, count(*) as row_count
from public.wish_thread_images image
join public.wish_threads thread on thread.id = image.thread_id
where thread.space_id in (select id from cleanup_target_spaces)
union all
select 'thread_reactions' as relation, count(*) as row_count
from public.thread_reactions reaction
where reaction.space_id in (select id from cleanup_target_spaces)
union all
select 'monthly_journal_snapshots' as relation, count(*) as row_count
from public.monthly_journal_snapshots snapshot
where snapshot.space_id in (select id from cleanup_target_spaces)
union all
select 'reward_pool_items' as relation, count(*) as row_count
from public.reward_pool_items item
where item.space_id in (select id from cleanup_target_spaces)
union all
select 'reward_claims' as relation, count(*) as row_count
from public.reward_claims claim
where claim.space_id in (select id from cleanup_target_spaces)
union all
select 'space_email_bindings' as relation, count(*) as row_count
from public.space_email_bindings binding
where binding.space_id in (select id from cleanup_target_spaces)
order by relation asc;

select
  'wish_images_storage_paths' as step,
  image.storage_path
from public.wish_images image
join public.wishes wish on wish.id = image.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
order by image.storage_path;

select
  'wish_comment_images_storage_paths' as step,
  image.storage_path
from public.wish_comment_images image
join public.wish_comments comment on comment.id = image.comment_id
join public.wishes wish on wish.id = comment.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
order by image.storage_path;

select
  'wish_thread_images_storage_paths' as step,
  image.storage_path
from public.wish_thread_images image
join public.wish_threads thread on thread.id = image.thread_id
where thread.space_id in (select id from cleanup_target_spaces)
order by image.storage_path;

with deleted_spaces as (
  delete from public.spaces
  where id in (select id from cleanup_target_spaces)
    and created_by = (
      select id
      from auth.users
      where email = '1103475965@qq.com'
      limit 1
    )
  returning id, name, invite_code, created_at
)
select
  'deleted-spaces' as step,
  id,
  name,
  invite_code,
  created_at
from deleted_spaces
order by created_at asc;

select
  'remaining-spaces' as step,
  id,
  name,
  invite_code,
  created_at
from public.spaces
where created_by = (
  select id
  from auth.users
  where email = '1103475965@qq.com'
  limit 1
)
order by created_at asc;

commit;