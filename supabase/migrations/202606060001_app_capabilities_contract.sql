create or replace function public.get_app_capabilities()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'has_bound_space_memberships', to_regclass('public.space_email_bindings') is not null,
    'has_wish_progress', (
      exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'wishes'
          and column_name = 'progress_mode'
      )
      and to_regclass('public.wish_steps') is not null
    ),
    'has_wish_comment_images', to_regclass('public.wish_comment_images') is not null,
    'has_wish_coins', to_regclass('public.wish_coins') is not null,
    'has_reward_pools', (
      to_regclass('public.reward_pool_items') is not null
      and to_regclass('public.reward_claims') is not null
    ),
    'has_unified_threads', (
      to_regclass('public.wish_threads') is not null
      and to_regclass('public.wish_thread_images') is not null
      and to_regclass('public.thread_reactions') is not null
    ),
    'has_monthly_snapshots', to_regclass('public.monthly_journal_snapshots') is not null,
    'has_wish_image_note', exists (
      select 1
      from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname = 'update_wish_image_note'
    ),
    'has_wish_image_cover', exists (
      select 1
      from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname = 'set_wish_image_cover'
    ),
    'has_wish_image_order', exists (
      select 1
      from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname = 'set_wish_image_order'
    ),
    'has_monthly_snapshot_backfill', exists (
      select 1
      from pg_proc
      where pronamespace = 'public'::regnamespace
        and proname = 'ensure_monthly_journal_snapshots'
    )
  );
$$;

revoke all on function public.get_app_capabilities() from public;
grant execute on function public.get_app_capabilities() to authenticated;
