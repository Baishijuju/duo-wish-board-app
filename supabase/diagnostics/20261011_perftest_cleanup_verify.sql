-- 性能测试清理后的最终验证
select '残留测试愿望' as metric,
       (select count(*) from public.wishes where title ~ '^(性能探针|对照探针|严格探针|调试探针)-')::text as value
union all select '孤儿每日投影',
       (select count(*) from public.wish_count_progress_daily d
         where not exists (select 1 from public.wishes w where w.id = d.wish_id))::text
union all select '孤儿星币流水',
       (select count(*) from public.reward_claims r
         where r.source_wish_id is not null
           and not exists (select 1 from public.wishes w where w.id = r.source_wish_id))::text
union all select '孤儿手账条目',
       (select count(*) from public.wish_threads th
         where th.wish_id is not null
           and not exists (select 1 from public.wishes w where w.id = th.wish_id))::text
union all select '孤儿留言',
       (select count(*) from public.wish_comments c
         where not exists (select 1 from public.wishes w where w.id = c.wish_id))::text
union all select '孤儿留言图片',
       (select count(*) from public.wish_comment_images ci
         where not exists (select 1 from public.wish_comments c where c.id = ci.comment_id))::text
union all select '真实空间愿望数（期望 44）',
       (select count(*) from public.wishes w
         where w.space_id = '83fa4725-309c-4e46-b5af-9231a279d104'::uuid)::text;
