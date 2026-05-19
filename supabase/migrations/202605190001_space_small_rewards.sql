alter type public.reward_claim_kind add value if not exists 'count_reward';

alter table if exists public.reward_claims
  add column if not exists quantity integer not null default 1 check (quantity > 0);

create or replace function public.claim_completed_step_reward(
  target_wish_id uuid,
  target_step_id uuid,
  target_reward_item_id uuid default null,
  claim_star_coin boolean default false
)
returns public.reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  target_step public.wish_steps;
  target_reward_item public.reward_pool_items;
  inserted_claim public.reward_claims;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_wish
  from public.wishes wish
  where wish.id = target_wish_id;

  if target_wish.id is null then
    raise exception 'Wish not found';
  end if;

  if not public.can_access_wish(target_wish_id) then
    raise exception '当前成员暂时不能领取这个步骤的小奖励';
  end if;

  select *
  into target_step
  from public.wish_steps step
  where step.id = target_step_id
    and step.wish_id = target_wish_id;

  if target_step.id is null then
    raise exception 'Wish step not found';
  end if;

  if not target_step.is_done then
    raise exception '先把这个步骤完成，再来领奖';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_step.id::text), hashtext(target_wish.space_id::text));

  if exists (
    select 1
    from public.reward_claims claim
    where claim.source_step_id = target_step.id
  ) then
    raise exception '这个步骤的小奖励已经领过了';
  end if;

  if claim_star_coin and target_reward_item_id is not null then
    raise exception '星星币奖励和日常奖励不能同时领取';
  end if;

  if not claim_star_coin and target_reward_item_id is null then
    raise exception '请选择一条日常奖励或改领星星币';
  end if;

  if not claim_star_coin then
    select *
    into target_reward_item
    from public.reward_pool_items item
    where item.id = target_reward_item_id;

    if target_reward_item.id is null then
      raise exception 'Reward item not found';
    end if;

    if target_reward_item.space_id <> target_wish.space_id
      or target_reward_item.owner_id <> auth.uid()
      or target_reward_item.tier <> 'daily'
      or target_reward_item.is_archived then
      raise exception '只能领取自己日常奖励池里的有效奖励';
    end if;
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
    target_wish.space_id,
    auth.uid(),
    case when claim_star_coin then null else target_reward_item.id end,
    target_wish.id,
    target_step.id,
    case
      when claim_star_coin then 'star_coin'::public.reward_claim_kind
      else 'step_reward'::public.reward_claim_kind
    end,
    1,
    case when claim_star_coin then '1 枚星星币' else target_reward_item.title end,
    case when claim_star_coin then '完成一个小步骤后，在空间页把这次奖励存成了 1 枚星星币。' else target_reward_item.note end,
    case when claim_star_coin then 1 else 0 end,
    timezone('utc', now())
  )
  returning * into inserted_claim;

  return inserted_claim;
end;
$$;

create or replace function public.claim_count_progress_reward(
  target_wish_id uuid,
  target_reward_item_id uuid default null,
  claim_star_coin boolean default false,
  claim_quantity integer default 1
)
returns public.reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  target_reward_item public.reward_pool_items;
  inserted_claim public.reward_claims;
  normalized_quantity integer;
  claimed_quantity integer;
  pending_quantity integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_wish
  from public.wishes wish
  where wish.id = target_wish_id;

  if target_wish.id is null then
    raise exception 'Wish not found';
  end if;

  if not public.can_access_wish(target_wish_id) then
    raise exception '当前成员暂时不能领取这条数字进度的小奖励';
  end if;

  if coalesce(target_wish.progress_mode, 'none') <> 'count'::public.wish_progress_mode then
    raise exception '这条愿望不是数字进度';
  end if;

  normalized_quantity := greatest(coalesce(claim_quantity, 1), 1);

  perform pg_advisory_xact_lock(hashtext(target_wish.id::text), hashtext(target_wish.space_id::text));

  select coalesce(sum(claim.quantity), 0)
  into claimed_quantity
  from public.reward_claims claim
  where claim.source_wish_id = target_wish.id
    and claim.source_step_id is null
    and claim.claim_kind in ('count_reward'::public.reward_claim_kind, 'star_coin'::public.reward_claim_kind);

  pending_quantity := greatest(
    least(coalesce(target_wish.progress_current, 0), greatest(coalesce(target_wish.progress_target, 0), 1)) - claimed_quantity,
    0
  );

  if pending_quantity <= 0 then
    raise exception '这条数字进度暂时没有待领取的小奖励';
  end if;

  if normalized_quantity > pending_quantity then
    raise exception '这条数字进度暂时只剩 % 点待领取', pending_quantity;
  end if;

  if claim_star_coin and target_reward_item_id is not null then
    raise exception '星星币奖励和日常奖励不能同时领取';
  end if;

  if not claim_star_coin and target_reward_item_id is null then
    raise exception '请选择一条日常奖励或改领星星币';
  end if;

  if not claim_star_coin then
    select *
    into target_reward_item
    from public.reward_pool_items item
    where item.id = target_reward_item_id;

    if target_reward_item.id is null then
      raise exception 'Reward item not found';
    end if;

    if target_reward_item.space_id <> target_wish.space_id
      or target_reward_item.owner_id <> auth.uid()
      or target_reward_item.tier <> 'daily'
      or target_reward_item.is_archived then
      raise exception '只能领取自己日常奖励池里的有效奖励';
    end if;
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
    target_wish.space_id,
    auth.uid(),
    case when claim_star_coin then null else target_reward_item.id end,
    target_wish.id,
    null,
    case
      when claim_star_coin then 'star_coin'::public.reward_claim_kind
      else 'count_reward'::public.reward_claim_kind
    end,
    normalized_quantity,
    case when claim_star_coin then normalized_quantity::text || ' 枚星星币' else target_reward_item.title end,
    case when claim_star_coin then '数字进度前进后，在空间页把这次奖励先存成了星星币。' else target_reward_item.note end,
    case when claim_star_coin then normalized_quantity else 0 end,
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
  claim_quantity integer;
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
    else actor_name || ' 用 ' || abs(new.star_coin_delta)::text || ' 枚星星币兑换了「' || new.title_snapshot || '」。'
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
    'reward_claim:' || new.id::text,
    new.created_at,
    new.created_at
  );

  return new;
end;
$$;

grant execute on function public.claim_completed_step_reward(uuid, uuid, uuid, boolean) to authenticated;
grant execute on function public.claim_count_progress_reward(uuid, uuid, boolean, integer) to authenticated;
