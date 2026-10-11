-- 勘察：生产库中的测试数据残留
--
-- 目的：在删除前先看清范围。只读，不修改任何数据。
-- 背景：排查漂移时发现 cloud-bench / daily-seed 前缀的愿望，
-- 分别来自 scripts/benchmark-cloud-operations.mjs 与 scripts/seed-daily-scenarios.mjs。

-- 1) 全部愿望标题一览（含归属空间与创建时间），用于人工判断哪些是测试数据
select
  left(w.title, 38) as title,
  w.status,
  w.progress_mode,
  w.progress_current,
  w.progress_target,
  (w.created_at + interval '8 hours')::date as created_date
from public.wishes w
order by w.created_at;

-- 2) 按可疑前缀/关键词归类统计
select
  case
    when w.title ilike 'cloud-bench%' then 'cloud-bench'
    when w.title ilike 'daily-seed%' then 'daily-seed'
    when w.title ilike '%test%' then 'test'
    when w.title ilike '%e2e%' then 'e2e'
    when w.title ilike '%bench%' then 'bench'
    else '其他（真实数据）'
  end as category,
  count(*)::int as wish_count
from public.wishes w
group by 1
order by 2 desc;
