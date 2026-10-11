-- 清理后验证：空间愿望数、孤儿数据、残留测试数据
select '真实空间 1103475965 的愿望空间 愿望数' as metric,
       (select count(*) from public.wishes w
         where w.space_id = '83fa4725-309c-4e46-b5af-9231a279d104'::uuid)::text as value
union all select '测试空间 tai jie yue 愿望数（期望 2）',
       (select count(*) from public.wishes w
         where w.space_id = 'a00f2907-bf09-4a59-b62f-700991bb493d'::uuid)::text
union all select '全库残留测试愿望数（期望 0）',
       (select count(*) from public.wishes w
         where w.title ilike 'cloud-bench%' or w.title ilike 'daily-seed%'
            or w.title ilike '延迟测试愿望-%' or w.title = '同步修复验证-星币读取保留'
            or w.title = '1')::text
union all select '孤儿每日投影（wish 已不存在）',
       (select count(*) from public.wish_count_progress_daily d
         where not exists (select 1 from public.wishes w where w.id = d.wish_id))::text
union all select '孤儿星币流水（source_wish 已不存在）',
       (select count(*) from public.reward_claims r
         where r.source_wish_id is not null
           and not exists (select 1 from public.wishes w where w.id = r.source_wish_id))::text
union all select '孤儿手账条目（wish 已不存在）',
       (select count(*) from public.wish_threads th
         where th.wish_id is not null
           and not exists (select 1 from public.wishes w where w.id = th.wish_id))::text
union all select '孤儿步骤',
       (select count(*) from public.wish_steps s
         where not exists (select 1 from public.wishes w where w.id = s.wish_id))::text
union all select '孤儿留言',
       (select count(*) from public.wish_comments c
         where not exists (select 1 from public.wishes w where w.id = c.wish_id))::text
union all select '孤儿图片',
       (select count(*) from public.wish_images i
         where not exists (select 1 from public.wishes w where w.id = i.wish_id))::text;
