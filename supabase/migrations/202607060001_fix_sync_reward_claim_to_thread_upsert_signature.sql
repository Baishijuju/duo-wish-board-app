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
    'reward_claim:' || new.id::text,
    timezone('utc', now()),
    timezone('utc', now())
  );

  return new;
end;
$$;
