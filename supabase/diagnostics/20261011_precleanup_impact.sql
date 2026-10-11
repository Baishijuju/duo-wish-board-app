-- 清理前影响汇总（只读）。改为纵向输出，便于 CLI 表格渲染。
with target as (
  select w.id, w.title, w.owner_id, w.space_id
  from public.wishes w
  where w.title ilike 'cloud-bench%'
     or w.title ilike 'daily-seed%'
     or w.title ilike '延迟测试愿望-%'
     or w.title = '同步修复验证-星币读取保留'
     or w.title = '1'
)
select '待删愿望数' as metric, (select count(*) from target)::text as value
union all select '涉及归属人数', (select count(distinct owner_id) from target)::text
union all select '涉及空间数', (select count(distinct space_id) from target)::text
union all select '关联步骤 wish_steps', (select count(*) from public.wish_steps s join target t on t.id = s.wish_id)::text
union all select '关联留言 wish_comments', (select count(*) from public.wish_comments c join target t on t.id = c.wish_id)::text
union all select '关联图片 wish_images', (select count(*) from public.wish_images i join target t on t.id = i.wish_id)::text
union all select '关联手账 wish_threads', (select count(*) from public.wish_threads th join target t on t.id = th.wish_id)::text
union all select '关联每日投影', (select count(*) from public.wish_count_progress_daily d join target t on t.id = d.wish_id)::text
union all select '关联星币流水条数', (select count(*) from public.reward_claims r join target t on t.id = r.source_wish_id)::text
union all select '将移除的星币总量', (select coalesce(sum(r.star_coin_delta), 0) from public.reward_claims r join target t on t.id = r.source_wish_id)::text
union all select '目标空间 ID 列表', (select string_agg(distinct space_id::text, ', ') from target)
union all select '目标归属人 ID 列表', (select string_agg(distinct owner_id::text, ', ') from target);
