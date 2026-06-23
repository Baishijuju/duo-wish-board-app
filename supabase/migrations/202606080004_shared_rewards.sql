alter table public.reward_pool_items
  add column if not exists reward_scope text not null default 'personal' check (reward_scope in ('personal', 'shared'));

create index if not exists idx_reward_pool_items_space_scope_tier
on public.reward_pool_items (space_id, reward_scope, tier, updated_at desc);

create or replace function public.redeem_premium_reward(target_reward_item_id uuid)
returns public.reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  target_reward_item public.reward_pool_items;
  deposited_star_coins numeric;
  redeemed_reward_count numeric;
  inserted_claim public.reward_claims;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_reward_item
  from public.reward_pool_items item
  where item.id = target_reward_item_id;

  if target_reward_item.id is null then
    raise exception 'Reward item not found';
  end if;

  if not public.is_space_member(target_reward_item.space_id) then
    raise exception '当前成员暂时不能领取这条奖励';
  end if;

  if target_reward_item.tier <> 'premium'
    or target_reward_item.is_archived then
    raise exception '只能领取有效的星币奖励';
  end if;

  if coalesce(target_reward_item.reward_scope, 'personal') <> 'shared'
    and target_reward_item.owner_id <> auth.uid() then
    raise exception '只能领取自己的奖励或共同奖励';
  end if;

  if target_reward_item.star_coin_cost <= 0 then
    raise exception '这条奖励还没有设置星星币价格';
  end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text), hashtext(target_reward_item.space_id::text));

  select coalesce(sum(abs(claim.star_coin_delta)), 0)
  into deposited_star_coins
  from public.reward_claims claim
  where claim.space_id = target_reward_item.space_id
    and claim.reward_item_id = target_reward_item.id
    and claim.claim_kind = 'reward_deposit'::public.reward_claim_kind;

  select coalesce(sum(claim.quantity), 0)
  into redeemed_reward_count
  from public.reward_claims claim
  where claim.space_id = target_reward_item.space_id
    and claim.reward_item_id = target_reward_item.id
    and claim.claim_kind = 'premium_redeem'::public.reward_claim_kind;

  if greatest(deposited_star_coins - (redeemed_reward_count * target_reward_item.star_coin_cost), 0) < target_reward_item.star_coin_cost then
    raise exception '这条奖励还没有存满星星币';
  end if;

  insert into public.reward_claims (
    space_id,
    owner_id,
    reward_item_id,
    source_wish_id,
    source_step_id,
    claim_kind,
    quantity,
    title_snapshot,
    note_snapshot,
    star_coin_delta,
    created_at
  )
  values (
    target_reward_item.space_id,
    auth.uid(),
    target_reward_item.id,
    null,
    null,
    'premium_redeem'::public.reward_claim_kind,
    1,
    target_reward_item.title,
    target_reward_item.note,
    0,
    timezone('utc', now())
  )
  returning * into inserted_claim;

  return inserted_claim;
end;
$$;

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
      and exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'wishes'
          and column_name = 'progress_star_coin_value'
      )
      and exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'wishes'
          and column_name = 'completion_star_coin_bonus'
      )
      and to_regclass('public.wish_steps') is not null
      and exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'wish_steps'
          and column_name = 'star_coin_value'
      )
    ),
    'has_wish_comment_images', to_regclass('public.wish_comment_images') is not null,
    'has_wish_coins', to_regclass('public.wish_coins') is not null,
    'has_reward_pools', (
      to_regclass('public.reward_pool_items') is not null
      and to_regclass('public.reward_claims') is not null
      and exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'reward_pool_items'
          and column_name = 'reward_scope'
      )
      and exists (
        select 1
        from pg_proc
        where pronamespace = 'public'::regnamespace
          and proname = 'set_wish_count_progress_with_star_coin'
      )
      and exists (
        select 1
        from pg_proc
        where pronamespace = 'public'::regnamespace
          and proname = 'set_wish_step_done_with_star_coin'
      )
      and exists (
        select 1
        from pg_proc
        where pronamespace = 'public'::regnamespace
          and proname = 'deposit_reward_star_coins'
      )
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

revoke all on function public.redeem_premium_reward(uuid) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.redeem_premium_reward(uuid) to authenticated;
grant execute on function public.get_app_capabilities() to authenticated;