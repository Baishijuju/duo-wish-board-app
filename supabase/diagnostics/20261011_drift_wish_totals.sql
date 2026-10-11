-- 诊断：漂移愿望的「愿望级总量」对比
--
-- 目的：区分两种可能的漂移成因
--   A) 日期归属错误：总量一致，只是分摊到了不同日期
--   B) 总量本身偏高：投影表真的多记了
--
-- 同时输出 RPC 判定 pending_quantity 时用的 claimed_quantity 口径
-- （count_reward + star_coin + count_star_coin，且不限日期），
-- 用于验证「lifetime claims >= progress_current 时 pending=0，投影仍被累加」这一假设。

select
  left(w.title, 20) as title,
  w.progress_current,
  w.progress_target,
  (select coalesce(sum(c.quantity), 0)::int
     from public.reward_claims c
    where c.source_wish_id = w.id
      and c.source_step_id is null
      and c.claim_kind in ('count_reward'::public.reward_claim_kind,
                           'star_coin'::public.reward_claim_kind,
                           'count_star_coin'::public.reward_claim_kind)
  ) as rpc_claimed_lifetime,
  (select coalesce(sum(c.quantity), 0)::int
     from public.reward_claims c
    where c.source_wish_id = w.id
      and c.source_step_id is null
      and c.claim_kind = 'count_star_coin'::public.reward_claim_kind
  ) as ledger_total,
  (select coalesce(sum(d.progress_units), 0)::int
     from public.wish_count_progress_daily d
    where d.wish_id = w.id
  ) as projection_total
from public.wishes w
where w.id in (
  '1024369d-ca4e-43df-b49b-a70990343d58',
  '2e524923-cd6d-4a43-be85-556ea52a185e',
  '99a4b04f-2ed9-48bc-9e07-f986f3a3b725'
)
order by title;
