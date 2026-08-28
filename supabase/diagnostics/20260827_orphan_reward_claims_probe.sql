select
  id,
  owner_id,
  source_wish_id,
  claim_kind,
  quantity,
  star_coin_delta,
  title_snapshot,
  note_snapshot,
  created_at
from public.reward_claims
where source_wish_id is null
  and claim_kind in (
    'count_reward'::public.reward_claim_kind,
    'count_star_coin'::public.reward_claim_kind,
    'wish_reward'::public.reward_claim_kind
  )
order by created_at desc
limit 120;