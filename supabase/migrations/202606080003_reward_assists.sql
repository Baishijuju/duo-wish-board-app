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

grant execute on function public.deposit_reward_star_coins(uuid, numeric) to authenticated;
grant execute on function public.redeem_premium_reward(uuid) to authenticated;