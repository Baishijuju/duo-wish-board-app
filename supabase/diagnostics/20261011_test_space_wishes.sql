-- 列出测试空间 a00f2907 中的全部愿望，找出未被规则匹配的 2 条
select
  left(w.title, 44) as title,
  w.status,
  w.progress_mode,
  (w.created_at + interval '8 hours')::date as created_date,
  case
    when w.title ilike 'cloud-bench%' or w.title ilike 'daily-seed%'
      or w.title ilike '延迟测试愿望-%' or w.title = '同步修复验证-星币读取保留' or w.title = '1'
    then '匹配(将删除)' else '未匹配(需判断)'
  end as matched
from public.wishes w
where w.space_id = 'a00f2907-bf09-4a59-b62f-700991bb493d'::uuid
order by matched, w.created_at;
