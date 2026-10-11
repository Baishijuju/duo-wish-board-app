-- 诊断：漂移愿望的流水构成
--
-- 假设：202608040001 的 RPC 先对投影表按 increased_quantity 累加（无条件），
-- 但当 pending_quantity = 0 或 progress_star_coin_value = 0 时不会插入 reward_claims，
-- 于是 202608040005 的触发器不触发，投影无人重算 -> 投影永久高于流水。
--
-- 若假设成立，这些愿望应当出现：
--   a) progress_star_coin_value = 0，或
--   b) 该日期存在 count_reward / star_coin 类流水（RPC 计入 claimed_quantity，
--      但触发器与验收口径只统计 count_star_coin）

select
  claim.source_wish_id as wish_id,
  left(w.title, 20) as title,
  w.progress_star_coin_value as coin_value,
  (timezone('utc', claim.created_at) + interval '8 hours')::date as d,
  claim.claim_kind,
  sum(claim.quantity)::int as qty,
  count(*)::int as rows
from public.reward_claims claim
join public.wishes w on w.id = claim.source_wish_id
where claim.source_wish_id in (
  '1024369d-ca4e-43df-b49b-a70990343d58',
  '2e524923-cd6d-4a43-be85-556ea52a185e',
  '99a4b04f-2ed9-48bc-9e07-f986f3a3b725'
)
group by 1, 2, 3, 4, 5
order by d, title, claim_kind;
