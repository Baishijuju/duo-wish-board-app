-- 诊断：确认 reward_claims -> wish_count_progress_daily 的同步触发器是否真的存在并启用
--
-- 背景：202608040001 的 RPC 对投影表做「增量累加」，累加量 increased_quantity
-- 与它写入 reward_claims 的 pending_quantity 并不相等；
-- 202608040005 的触发器本应在流水变更后把投影「重算为绝对值」来消除这个差异。
-- 若触发器缺失或被禁用，差异就会永久残留 —— 正是实测观察到的「投影高于流水」。

select
  '触发器' as item,
  t.tgname as name,
  case t.tgenabled
    when 'O' then '启用'
    when 'D' then '已禁用'
    when 'R' then '仅复制模式'
    when 'A' then '始终启用'
    else t.tgenabled::text
  end as status
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
where not t.tgisinternal
  and c.relname = 'reward_claims'

union all

select
  '相关函数' as item,
  p.proname as name,
  pg_get_function_identity_arguments(p.oid) as status
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'recompute_count_progress_daily_for_wish_date',
    'sync_count_progress_daily_from_reward_claims',
    'set_wish_count_progress_with_star_coin'
  )

order by item, name;
