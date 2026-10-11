-- 列出全部愿望，按「可疑测试数据优先」排序，便于人工确认删除范围。
select
  case
    when w.title ilike 'cloud-bench%' then 'A-测试'
    when w.title ilike 'daily-seed%' then 'A-测试'
    else 'B-待确认'
  end as bucket,
  left(w.title, 40) as title,
  w.status,
  w.progress_mode,
  (w.created_at + interval '8 hours')::date as created_date
from public.wishes w
order by bucket, w.created_at;
