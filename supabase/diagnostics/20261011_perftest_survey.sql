-- 清理前勘察：本次性能测试产生的所有痕迹
select '测试愿望' as item, count(*)::text as cnt from public.wishes where title like '性能探针-%'
union all select '测试愿望的步骤', count(*)::text from public.wish_steps s join public.wishes w on w.id = s.wish_id where w.title like '性能探针-%'
union all select '测试愿望的留言', count(*)::text from public.wish_comments c join public.wishes w on w.id = c.wish_id where w.title like '性能探针-%'
union all select '留言图片', count(*)::text from public.wish_comment_images ci join public.wish_comments c on c.id = ci.comment_id join public.wishes w on w.id = c.wish_id where w.title like '性能探针-%'
union all select '手账条目', count(*)::text from public.wish_threads th join public.wishes w on w.id = th.wish_id where w.title like '性能探针-%'
union all select '手账图片', count(*)::text from public.wish_thread_images ti join public.wish_threads th on th.id = ti.thread_id join public.wishes w on w.id = th.wish_id where w.title like '性能探针-%'
union all select '表情回应', count(*)::text from public.thread_reactions tr join public.wish_threads th on th.id::text = tr.target_thread_id join public.wishes w on w.id = th.wish_id where w.title like '性能探针-%'
union all select '每日投影', count(*)::text from public.wish_count_progress_daily d join public.wishes w on w.id = d.wish_id where w.title like '性能探针-%'
union all select '星币流水', count(*)::text from public.reward_claims r join public.wishes w on w.id = r.source_wish_id where w.title like '性能探针-%'
union all select '存储对象', count(*)::text from storage.objects o where o.name like '%e691f95f%' or o.bucket_id = 'wish-comment-images' and o.created_at > now() - interval '2 hours';

select id::text, title, created_at from public.wishes where title like '性能探针-%' order by created_at;
