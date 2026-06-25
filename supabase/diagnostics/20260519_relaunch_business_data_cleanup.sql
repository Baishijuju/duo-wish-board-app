-- 在 Supabase Dashboard 的 SQL Editor 中执行。
-- 目标：为重新上线清空现有业务数据，但保留账号、空间、成员关系、邮箱绑定和全部 migrations。
--
-- 默认会删除：
-- - wishes
-- - wish_comments
-- - wish_steps
-- - wish_images
-- - wish_comment_images
-- - wish_threads
-- - wish_thread_images
-- - thread_reactions
-- - reward_claims
-- - monthly_journal_snapshots
--
-- 默认会保留：
-- - spaces
-- - space_members
-- - space_email_bindings
-- - reward_pool_items
-- - auth.users
--
-- 注意：Storage bucket 里的对象不会随着数据库级联自动清理。
-- 本脚本会列出需要手动从以下两个 bucket 删除的 storage_path：
-- - wish-images
-- - wish-comment-images
-- wish_thread_images 只是 wish_comment_images 的镜像记录，共用 wish-comment-images bucket，无需单独删第三个 bucket。

begin;

create temp table cleanup_target_spaces (
  id uuid primary key
) on commit drop;

insert into cleanup_target_spaces (id)
values
  -- 把这里替换成你要清空业务数据的 space_id。
  -- 可以填多条。
  ('83fa4725-309c-4e46-b5af-9231a279d104')
;

do $$
declare
  input_count integer;
  matched_count integer;
begin
  select count(*)
  into input_count
  from cleanup_target_spaces;

  if input_count = 0 then
    raise exception '请先在 cleanup_target_spaces 里填入至少一个 space_id';
  end if;

  select count(*)
  into matched_count
  from public.spaces
  where id in (select id from cleanup_target_spaces);

  if matched_count <> input_count then
    raise exception 'space_id 校验失败：预期命中 % 条，实际命中 % 条。', input_count, matched_count;
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
select 'reward_claims' as relation, count(*) as row_count
from public.reward_claims claim
where claim.space_id in (select id from cleanup_target_spaces)
union all
select 'reward_pool_items' as relation, count(*) as row_count
from public.reward_pool_items item
where item.space_id in (select id from cleanup_target_spaces)
union all
select 'monthly_journal_snapshots' as relation, count(*) as row_count
from public.monthly_journal_snapshots snapshot
where snapshot.space_id in (select id from cleanup_target_spaces)
union all
select 'space_email_bindings' as relation, count(*) as row_count
from public.space_email_bindings binding
where binding.space_id in (select id from cleanup_target_spaces)
order by relation asc;

select
  'wish-images storage paths' as step,
  image.storage_path
from public.wish_images image
join public.wishes wish on wish.id = image.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
order by image.storage_path;

select
  'wish-comment-images storage paths' as step,
  image.storage_path
from public.wish_comment_images image
join public.wish_comments comment on comment.id = image.comment_id
join public.wishes wish on wish.id = comment.wish_id
where wish.space_id in (select id from cleanup_target_spaces)
order by image.storage_path;

-- 从这里开始是实际删除。

delete from public.thread_reactions
where space_id in (select id from cleanup_target_spaces);

delete from public.reward_claims
where space_id in (select id from cleanup_target_spaces);

delete from public.monthly_journal_snapshots
where space_id in (select id from cleanup_target_spaces);

delete from public.wish_threads
where space_id in (select id from cleanup_target_spaces);

delete from public.wishes
where space_id in (select id from cleanup_target_spaces);

-- 如果你连奖励池配置也想一起归零，再取消下面这一段注释。
-- delete from public.reward_pool_items
-- where space_id in (select id from cleanup_target_spaces);

select 'remaining_wishes' as relation, count(*) as row_count
from public.wishes
where space_id in (select id from cleanup_target_spaces)
union all
select 'remaining_reward_claims' as relation, count(*) as row_count
from public.reward_claims
where space_id in (select id from cleanup_target_spaces)
union all
select 'remaining_wish_threads' as relation, count(*) as row_count
from public.wish_threads
where space_id in (select id from cleanup_target_spaces)
union all
select 'remaining_monthly_journal_snapshots' as relation, count(*) as row_count
from public.monthly_journal_snapshots
where space_id in (select id from cleanup_target_spaces)
union all
select 'remaining_reward_pool_items' as relation, count(*) as row_count
from public.reward_pool_items
where space_id in (select id from cleanup_target_spaces)
order by relation asc;

commit;