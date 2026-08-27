-- Read-only probe for Realtime filter compatibility.
with subscription_tables(table_name, requires_space_id_filter) as (
  values
    ('wishes', true),
    ('wish_threads', true),
    ('wish_thread_images', false),
    ('thread_reactions', true),
    ('wish_comments', false),
    ('wish_steps', false),
    ('wish_images', false),
    ('reward_pool_items', true),
    ('reward_claims', true),
    ('monthly_journal_snapshots', true),
    ('wish_comment_images', false)
)
select
  tables.table_name,
  tables.requires_space_id_filter,
  exists (
    select 1
    from information_schema.columns columns
    where columns.table_schema = 'public'
      and columns.table_name = tables.table_name
      and columns.column_name = 'space_id'
  ) as has_space_id,
  exists (
    select 1
    from pg_publication_tables publication_tables
    where publication_tables.pubname = 'supabase_realtime'
      and publication_tables.schemaname = 'public'
      and publication_tables.tablename = tables.table_name
  ) as is_in_realtime_publication
from subscription_tables tables
order by tables.table_name;

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('wishes', 'wish_threads', 'thread_reactions', 'reward_pool_items', 'reward_claims', 'monthly_journal_snapshots')
  and column_name = 'space_id'
order by table_name;