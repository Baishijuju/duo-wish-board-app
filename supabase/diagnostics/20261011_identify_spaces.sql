-- 空间 ID 与名称、愿望数对照（含测试数据分布）
select
  s.id::text as space_id,
  left(coalesce(s.name, '(未命名)'), 24) as space_name,
  (select count(*) from public.space_members m where m.space_id = s.id)::int as members,
  (select count(*) from public.wishes w where w.space_id = s.id)::int as total_wishes,
  (select count(*) from public.wishes w
    where w.space_id = s.id
      and (w.title ilike 'cloud-bench%' or w.title ilike 'daily-seed%'
           or w.title ilike '延迟测试愿望-%' or w.title = '同步修复验证-星币读取保留' or w.title = '1')
  )::int as test_wishes
from public.spaces s
order by total_wishes desc;
