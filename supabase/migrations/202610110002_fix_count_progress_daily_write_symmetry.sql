-- 根因修复：消除 set_wish_count_progress_with_star_coin 对投影表的写入不对称
--
-- 问题（2026-10-11 诊断确认）
--   本函数原实现（202608040001）有两个写入方，口径不一致：
--
--     -- 第 64-92 行：投影表按「原始进度增量」无条件累加
--     if increased_quantity > 0 then
--       insert into public.wish_count_progress_daily (...)
--       on conflict (wish_id, progress_date)
--       do update set progress_units = public.wish_count_progress_daily.progress_units
--                                     + excluded.progress_units;
--     end if;
--
--     -- 第 94-121 行：流水表只在两个条件都满足时才写入「计币增量」
--     if pending_quantity > 0 and target_delta > 0 then
--       insert into public.reward_claims (..., quantity, ...) values (..., pending_quantity, ...);
--     end if;
--
--   而 202608040005 的触发器只在 reward_claims 变更时才重算投影。
--   因此当第二个守卫为假（投影被累加、但没写流水）时，触发器不触发，
--   投影永久保留了这笔无流水支撑的增量。
--
--   触发场景：claimed_quantity 是「全生命周期、含 count_reward/star_coin 三种 kind」的总量，
--   当它已经覆盖新的 normalized_current 时 unclaimed_quantity 归零 -> pending_quantity = 0。
--   典型操作是先下调再上调 progress_current（例如纠正误记）。
--
-- 修复策略
--   遵循项目既定契约（见 docs/supabase-refactor-plan-2026-08-04.md）：
--     「以 reward_claims 为事实源，wish_count_progress_daily 为可重建投影」
--   即投影表的唯一写入方应当是触发器。本迁移：
--     1) 删除对 wish_count_progress_daily 的直接累加；
--     2) 在函数末尾显式重算当天投影，使其严格等于流水口径（当天无流水则删除该行）。
--   这样无论守卫是否成立，投影都不会再偏离流水。
--
-- 影响面
--   真实愿望的 progress_star_coin_value 均为非 0，因此正常推进仍会产生 count_star_coin 流水，
--   投影行为不变。仅当 progress_star_coin_value = 0 时不再产生投影行 ——
--   这与「投影 = 流水投影」的契约一致。当前库中 coin_value = 0 的数字进度愿望
--   全部为 cloud-bench / daily-seed 测试数据，无真实用户影响。
--
-- 幂等性
--   可重复执行（create or replace）。

create or replace function public.set_wish_count_progress_with_star_coin(
  target_wish_id uuid,
  next_current integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  normalized_current integer;
  claimed_quantity integer;
  increased_quantity integer;
  unclaimed_quantity integer;
  pending_quantity integer;
  target_delta numeric;
  beijing_progress_date date;
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

  if target_wish.owner_id <> auth.uid() then
    raise exception '只有这条愿望的归属人可以推进它';
  end if;

  if coalesce(target_wish.progress_mode, 'none') <> 'count'::public.wish_progress_mode then
    raise exception '这条愿望不是数字进度';
  end if;

  normalized_current := least(greatest(coalesce(next_current, 0), 0), greatest(coalesce(target_wish.progress_target, 0), 1));

  perform pg_advisory_xact_lock(hashtext(target_wish.id::text), hashtext(target_wish.space_id::text));

  select coalesce(sum(claim.quantity), 0)
  into claimed_quantity
  from public.reward_claims claim
  where claim.source_wish_id = target_wish.id
    and claim.source_step_id is null
    and claim.claim_kind in (
      'count_reward'::public.reward_claim_kind,
      'star_coin'::public.reward_claim_kind,
      'count_star_coin'::public.reward_claim_kind
    );

  increased_quantity := greatest(normalized_current - coalesce(target_wish.progress_current, 0), 0);
  unclaimed_quantity := greatest(normalized_current - claimed_quantity, 0);
  pending_quantity := least(increased_quantity, unclaimed_quantity);
  target_delta := pending_quantity * coalesce(target_wish.progress_star_coin_value, 0);
  beijing_progress_date := (timezone('utc', now()) + interval '8 hours')::date;

  update public.wishes
  set progress_current = normalized_current,
      updated_at = timezone('utc', now())
  where id = target_wish.id;

  -- 变更点 1：此处原先直接累加 wish_count_progress_daily，现已移除。
  -- 投影表改由 reward_claims 的触发器独占维护，避免两个写入方口径漂移。

  if pending_quantity > 0 and target_delta > 0 then
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
      target_wish.owner_id,
      null,
      target_wish.id,
      null,
      'count_star_coin'::public.reward_claim_kind,
      pending_quantity,
      target_delta::text || ' 星星币',
      '数字进度推进后自动获得星星币。',
      target_delta,
      timezone('utc', now())
    );
  end if;

  -- 变更点 2：显式重算当天投影，使其严格等于流水口径。
  -- 当天有 count_star_coin 流水则写入绝对合计；没有则删除该行（自愈历史漂移）。
  perform public.recompute_count_progress_daily_for_wish_date(target_wish.id, beijing_progress_date);
end;
$$;

revoke all on function public.set_wish_count_progress_with_star_coin(uuid, integer) from public;
grant execute on function public.set_wish_count_progress_with_star_coin(uuid, integer) to authenticated;
