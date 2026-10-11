-- 诊断：确认线上 set_wish_count_progress_with_star_coin 的实际定义特征
--
-- 目的：仓库里的 202608040001 是最后一次 create or replace，但线上可能被手工改过。
-- 在基于仓库源码写修复迁移之前，先核对线上函数体是否与仓库版本一致。
--
-- 判据：仓库版（202608040001）包含对 wish_count_progress_daily 的直接写入，
-- 若线上版也包含，则 position > 0；同时给出函数体长度与 md5 便于比对。

select
  p.proname as function_name,
  length(pg_get_functiondef(p.oid)) as def_length,
  md5(pg_get_functiondef(p.oid)) as def_md5,
  position('wish_count_progress_daily' in pg_get_functiondef(p.oid)) as daily_write_position,
  position('increased_quantity' in pg_get_functiondef(p.oid)) as increased_qty_position,
  position('pending_quantity' in pg_get_functiondef(p.oid)) as pending_qty_position
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'set_wish_count_progress_with_star_coin';
