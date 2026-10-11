-- 诊断：数字进度愿望的 progress_star_coin_value 分布
--
-- 用途：决定「删除 RPC 中对投影表的直接写入」是否会丢语义。
-- 若存在 coin_value = 0 的数字进度愿望，则删掉直接写入后，
-- 这些愿望的推进将不再进入 wish_count_progress_daily（因为不会产生 count_star_coin 流水）。

select
  w.progress_star_coin_value as coin_value,
  count(*)::int as wish_count,
  count(*) filter (where w.progress_mode = 'count'::public.wish_progress_mode)::int as count_mode_wishes,
  sum(case when w.progress_mode = 'count'::public.wish_progress_mode then 1 else 0 end)::int as count_mode_total
from public.wishes w
group by w.progress_star_coin_value
order by w.progress_star_coin_value;

-- 单独列出 coin_value = 0 且为数字进度的愿望（若存在，是行为变更的影响面）
select
  left(w.title, 30) as title,
  w.progress_mode,
  w.progress_current,
  w.progress_target,
  w.status
from public.wishes w
where w.progress_mode = 'count'::public.wish_progress_mode
  and coalesce(w.progress_star_coin_value, 0) = 0
order by w.created_at desc;
