-- 诊断：Realtime 的复制标识（replica identity）与发布配置
-- 若表不是 REPLICA IDENTITY FULL，UPDATE/DELETE 的 payload 可能缺少行数据，
-- 导致前端拿不到 payload.new.id，回声抑制失效。

select
  c.relname as table_name,
  case c.relreplident
    when 'd' then 'DEFAULT(仅主键)'
    when 'f' then 'FULL(整行)'
    when 'i' then 'INDEX'
    when 'n' then 'NOTHING'
    else c.relreplident::text
  end as replica_identity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('wishes','wish_threads','reward_claims','wish_comments','wish_steps','wish_images','thread_reactions','wish_comment_images','wish_thread_images','reward_pool_items','monthly_journal_snapshots')
order by c.relname;

select
  p.pubname as publication,
  p.pubinsert as pub_insert,
  p.pubupdate as pub_update,
  p.pubdelete as pub_delete,
  p.pubviaroot as pub_via_root
from pg_publication p;
