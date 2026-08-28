-- 1) Recent reward claims that no longer point to a live wish (common after deleting wishes).
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
limit 80;

-- 2) Claims whose source_wish_id points to a missing wish (if any legacy rows exist).
select
  claim.id,
  claim.owner_id,
  claim.source_wish_id,
  claim.claim_kind,
  claim.quantity,
  claim.star_coin_delta,
  claim.title_snapshot,
  claim.note_snapshot,
  claim.created_at
from public.reward_claims claim
left join public.wishes wish on wish.id = claim.source_wish_id
where claim.source_wish_id is not null
  and wish.id is null
order by claim.created_at desc
limit 80;

-- 3) Recent daily progress rows for quick cross-check.
select
  id,
  wish_id,
  owner_id,
  progress_date,
  progress_units,
  updated_at
from public.wish_count_progress_daily
order by updated_at desc
limit 80;

-- 4) Snapshot payload presence (we may clear and let it rebuild if stale).
select id, month_key, snapshot_status, created_at
from public.monthly_journal_snapshots
order by created_at desc
limit 24;