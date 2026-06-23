create or replace function public.deposit_reward_star_coins(target_reward_item_id uuid, deposit_amount numeric)
returns public.reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  target_reward_item public.reward_pool_items;
  normalized_amount numeric;
  available_star_coins numeric;
  deposited_star_coins numeric;
  redeemed_reward_count numeric;
  remaining_star_coins numeric;
  inserted_claim public.reward_claims;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  normalized_amount := greatest(floor(coalesce(deposit_amount, 0)), 1);

  select *
  into target_reward_item
  from public.reward_pool_items item
  where item.id = target_reward_item_id;

  if target_reward_item.id is null then
    raise exception 'Reward item not found';
  end if;

  if not public.is_space_member(target_reward_item.space_id) then
    raise exception '当前成员暂时不能给这条奖励存入星星币';
  end if;

  if target_reward_item.tier <> 'premium'
    or target_reward_item.is_archived then
    raise exception '只能给空间里的有效奖励存入星星币';
  end if;

  if target_reward_item.star_coin_cost <= 0 then
    raise exception '这条奖励还没有设置星星币价格';
  end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text), hashtext(target_reward_item.space_id::text));

  select coalesce(sum(claim.star_coin_delta), 0)
  into available_star_coins
  from public.reward_claims claim
  where claim.space_id = target_reward_item.space_id
    and claim.owner_id = auth.uid();

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

  remaining_star_coins := greatest(target_reward_item.star_coin_cost - greatest(deposited_star_coins - (redeemed_reward_count * target_reward_item.star_coin_cost), 0), 0);
  normalized_amount := least(normalized_amount, remaining_star_coins);

  if remaining_star_coins <= 0 then
    raise exception '这条奖励已经存满了';
  end if;

  if available_star_coins < normalized_amount then
    raise exception '手里的星星币不够存入这条奖励';
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
    'reward_deposit'::public.reward_claim_kind,
    normalized_amount,
    target_reward_item.title,
    '助力存入「' || target_reward_item.title || '」。',
    -normalized_amount,
    timezone('utc', now())
  )
  returning * into inserted_claim;

  return inserted_claim;
end;
$$;

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

  if target_reward_item.owner_id <> auth.uid()
    or target_reward_item.tier <> 'premium'
    or target_reward_item.is_archived then
    raise exception '只能领取自己奖励池里的有效奖励';
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

create or replace function public.sync_reward_claim_to_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  target_step public.wish_steps;
  actor_name text;
  target_event_kind public.wish_thread_event_kind;
  thread_message text;
  target_wish_id uuid;
  claim_quantity numeric;
begin
  if new.source_wish_id is not null then
    select *
    into target_wish
    from public.wishes wish
    where wish.id = new.source_wish_id;
  end if;

  if new.source_step_id is not null then
    select *
    into target_step
    from public.wish_steps step
    where step.id = new.source_step_id;
  end if;

  claim_quantity := greatest(coalesce(new.quantity, 1), 1);
  actor_name := public.get_space_member_display_name(new.space_id, new.owner_id);
  target_event_kind := case
    when new.claim_kind = 'premium_redeem' then 'premium_redeem'::public.wish_thread_event_kind
    else 'reward_claimed'::public.wish_thread_event_kind
  end;
  target_wish_id := coalesce(new.source_wish_id, null);

  thread_message := case new.claim_kind
    when 'step_reward' then actor_name || ' 完成了小步骤「' || coalesce(target_step.title, '这个小步骤') || '」，并领取了「' || new.title_snapshot || '」。'
    when 'count_reward' then actor_name || ' 把「' || coalesce(target_wish.title, '这个数字愿望') || '」的数字进度往前推进了 ' || claim_quantity::text || ' 点，并领取了「' || new.title_snapshot || '」。'
    when 'wish_reward' then actor_name || ' 完成了「' || coalesce(target_wish.title, new.title_snapshot) || '」，并领取了「' || new.title_snapshot || '」。'
    when 'star_coin' then case
      when new.source_step_id is not null then actor_name || ' 完成了小步骤「' || coalesce(target_step.title, '这个小步骤') || '」，把这次奖励存成了 ' || abs(new.star_coin_delta)::text || ' 枚星星币。'
      else actor_name || ' 把「' || coalesce(target_wish.title, '这个数字愿望') || '」的数字进度往前推进了 ' || claim_quantity::text || ' 点，并存下了 ' || abs(new.star_coin_delta)::text || ' 枚星星币。'
    end
    when 'step_star_coin' then actor_name || ' 完成了小步骤「' || coalesce(target_step.title, '这个小步骤') || '」，收下了 ' || abs(new.star_coin_delta)::text || ' 枚星星币。'
    when 'count_star_coin' then actor_name || ' 把「' || coalesce(target_wish.title, '这个数字愿望') || '」的数字进度往前推进了 ' || claim_quantity::text || ' 点，收下了 ' || abs(new.star_coin_delta)::text || ' 枚星星币。'
    when 'wish_completion_bonus' then actor_name || ' 完成了「' || coalesce(target_wish.title, '这个愿望') || '」，收下了 ' || abs(new.star_coin_delta)::text || ' 枚星星币。'
    when 'reward_deposit' then actor_name || ' 往「' || coalesce((select title from public.reward_pool_items where id = new.reward_item_id), new.title_snapshot) || '」助力存入了 ' || abs(new.star_coin_delta)::text || ' 枚星星币。'
    when 'premium_redeem' then actor_name || ' 领取了「' || new.title_snapshot || '」。'
    else actor_name || ' 接住了「' || new.title_snapshot || '」。'
  end;

  perform public.upsert_wish_thread(
    null,
    new.space_id,
    target_wish_id,
    new.owner_id,
    target_event_kind,
    thread_message,
    jsonb_build_object(
      'claimKind', new.claim_kind,
      'rewardItemId', new.reward_item_id,
      'sourceWishId', new.source_wish_id,
      'sourceStepId', new.source_step_id,
      'starCoinDelta', new.star_coin_delta,
      'quantity', claim_quantity,
      'titleSnapshot', new.title_snapshot,
      'noteSnapshot', new.note_snapshot,
      'wishTitle', coalesce(target_wish.title, null),
      'stepTitle', coalesce(target_step.title, null)
    ),
    'reward_claims',
    new.id,
    timezone('utc', now())
  );

  return new;
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

revoke all on function public.deposit_reward_star_coins(uuid, numeric) from public;
revoke all on function public.redeem_premium_reward(uuid) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.deposit_reward_star_coins(uuid, numeric) to authenticated;
grant execute on function public.redeem_premium_reward(uuid) to authenticated;
grant execute on function public.get_app_capabilities() to authenticated;