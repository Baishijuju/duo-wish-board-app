-- Backfill missing wish_threads projections for historical reward_claims rows.
-- Idempotent: uses dedupe_key = reward_claim:<claim_id> and only fills missing rows.

insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  claim.space_id,
  claim.source_wish_id,
  claim.owner_id,
  case
    when claim.claim_kind = 'premium_redeem'::public.reward_claim_kind
      then 'premium_redeem'::public.wish_thread_event_kind
    else 'reward_claimed'::public.wish_thread_event_kind
  end,
  case claim.claim_kind
    when 'step_reward'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 完成了小步骤「' || coalesce(step.title, '这个小步骤') || '」，并领取了「' || claim.title_snapshot || '」。'
    when 'count_reward'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 把「' || coalesce(wish.title, '这个数字愿望') || '」的数字进度往前推进了 '
      || greatest(coalesce(claim.quantity, 1), 1)::text
      || ' 点，并领取了「' || claim.title_snapshot || '」。'
    when 'wish_reward'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 完成了「' || coalesce(wish.title, claim.title_snapshot) || '」，并领取了「' || claim.title_snapshot || '」。'
    when 'star_coin'::public.reward_claim_kind then
      case
        when claim.source_step_id is not null then
          public.get_space_member_display_name(claim.space_id, claim.owner_id)
          || ' 完成了小步骤「' || coalesce(step.title, '这个小步骤') || '」，把这次奖励存成了 '
          || abs(claim.star_coin_delta)::text || ' 枚星星币。'
        else
          public.get_space_member_display_name(claim.space_id, claim.owner_id)
          || ' 存下了 ' || abs(claim.star_coin_delta)::text || ' 枚星星币。'
      end
    when 'step_star_coin'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 完成了小步骤「' || coalesce(step.title, '这个小步骤') || '」，收下了 '
      || abs(claim.star_coin_delta)::text || ' 枚星星币。'
    when 'count_star_coin'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 把「' || coalesce(wish.title, '这个数字愿望') || '」的数字进度往前推进了 '
      || greatest(coalesce(claim.quantity, 1), 1)::text
      || ' 点，收下了 ' || abs(claim.star_coin_delta)::text || ' 枚星星币。'
    when 'wish_completion_bonus'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 完成了「' || coalesce(wish.title, '这个愿望') || '」，收下了 '
      || abs(claim.star_coin_delta)::text || ' 枚星星币。'
    when 'reward_deposit'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 往「' || coalesce(pool.title, claim.title_snapshot) || '」助力存入了 '
      || abs(claim.star_coin_delta)::text || ' 枚星星币。'
    when 'premium_redeem'::public.reward_claim_kind then
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 领取了「' || claim.title_snapshot || '」。'
    else
      public.get_space_member_display_name(claim.space_id, claim.owner_id)
      || ' 接住了「' || claim.title_snapshot || '」。'
  end,
  jsonb_build_object(
    'claimKind', claim.claim_kind,
    'rewardItemId', claim.reward_item_id,
    'sourceWishId', claim.source_wish_id,
    'sourceStepId', claim.source_step_id,
    'starCoinDelta', claim.star_coin_delta,
    'quantity', greatest(coalesce(claim.quantity, 1), 1),
    'titleSnapshot', claim.title_snapshot,
    'noteSnapshot', claim.note_snapshot,
    'wishTitle', wish.title,
    'stepTitle', step.title
  ),
  'reward_claims',
  claim.id,
  'reward_claim:' || claim.id::text,
  claim.created_at,
  timezone('utc', now())
from public.reward_claims claim
left join public.wishes wish on wish.id = claim.source_wish_id
left join public.wish_steps step on step.id = claim.source_step_id
left join public.reward_pool_items pool on pool.id = claim.reward_item_id
left join public.wish_threads thread
  on thread.source_table = 'reward_claims'
 and thread.source_id = claim.id
where thread.id is null;
