-- 验证：set_wish_count_progress_with_star_coin 的修复是否真正生效
--
-- 注意：不能用「函数体是否包含 wish_count_progress_daily」判断，
-- 因为修复版在注释里提到了该表名，会产生假阳性。
-- 这里检查的是**实际语句**是否还存在。

select
  '写投影表的 insert 语句' as check_item,
  case when position('insert into public.wish_count_progress_daily' in d.def) > 0
       then '仍存在（未修复）' else '已移除（正确）' end as result
from (select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'set_wish_count_progress_with_star_coin') d

union all
select
  '写投影表的 update 累加语句',
  case when position('progress_units + excluded.progress_units' in d.def) > 0
       then '仍存在（未修复）' else '已移除（正确）' end
from (select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'set_wish_count_progress_with_star_coin') d

union all
select
  '显式重算投影的调用',
  case when position('recompute_count_progress_daily_for_wish_date' in d.def) > 0
       then '已加入（正确）' else '缺失（异常）' end
from (select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'set_wish_count_progress_with_star_coin') d

union all
select
  '登录校验守卫',
  case when position('Authentication required' in d.def) > 0
       then '保留（正确）' else '丢失（严重）' end
from (select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'set_wish_count_progress_with_star_coin') d

union all
select
  '归属人校验',
  case when position('只有这条愿望的归属人可以推进它' in d.def) > 0
       then '保留（正确）' else '丢失（严重）' end
from (select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'set_wish_count_progress_with_star_coin') d

union all
select
  '并发锁 pg_advisory_xact_lock',
  case when position('pg_advisory_xact_lock' in d.def) > 0
       then '保留（正确）' else '丢失（严重）' end
from (select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'set_wish_count_progress_with_star_coin') d

union all
select
  '写流水的 insert 语句',
  case when position('insert into public.reward_claims' in d.def) > 0
       then '保留（正确）' else '丢失（严重）' end
from (select pg_get_functiondef(p.oid) as def
        from pg_proc p join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname = 'set_wish_count_progress_with_star_coin') d;
