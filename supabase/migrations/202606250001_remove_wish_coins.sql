do $$
begin
  if to_regclass('public.wish_coins') is not null then
    drop trigger if exists trg_wish_coins_thread on public.wish_coins;
  end if;
end
$$;

drop function if exists public.sync_wish_coin_to_thread();
drop function if exists public.cast_wish_coin(uuid);

do $$
begin
  if exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wish_coins'
  ) then
    alter publication supabase_realtime drop table public.wish_coins;
  end if;
end
$$;

delete from public.thread_reactions reaction
using public.wish_threads thread
where reaction.target_thread_id = thread.id::text
  and thread.event_kind::text in ('wish_coin_cast', 'dragon_ball_reached');

delete from public.wish_thread_images image
using public.wish_threads thread
where image.thread_id = thread.id
  and thread.event_kind::text in ('wish_coin_cast', 'dragon_ball_reached');

delete from public.wish_threads
where event_kind::text in ('wish_coin_cast', 'dragon_ball_reached');

drop table if exists public.wish_coins cascade;

create or replace function public.get_app_capabilities()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'has_bound_space_memberships', to_regclass('public.space_email_bindings') is not null,
    'has_wish_progress', exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'wishes'
        and column_name = 'progress_mode'
    ),
    'has_wish_comment_images', to_regclass('public.wish_comment_images') is not null,
    'has_reward_pools', to_regclass('public.reward_pool_items') is not null
      and to_regclass('public.reward_claims') is not null,
    'has_unified_threads', to_regclass('public.wish_threads') is not null,
    'has_monthly_snapshots', to_regclass('public.monthly_journal_snapshots') is not null,
    'has_wish_image_note', exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'wish_images'
        and column_name = 'note'
    ),
    'has_wish_image_cover', exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'wish_images'
        and column_name = 'is_cover'
    ),
    'has_wish_image_order', exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'wish_images'
        and column_name = 'sort_order'
    ),
    'has_monthly_snapshot_backfill', to_regprocedure('public.ensure_monthly_journal_snapshots(uuid)') is not null
  );
$$;

revoke all on function public.get_app_capabilities() from public;
grant execute on function public.get_app_capabilities() to authenticated;
