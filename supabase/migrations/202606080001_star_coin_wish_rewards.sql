alter table public.wishes
  add column if not exists progress_star_coin_value numeric not null default 0 check (progress_star_coin_value >= 0),
  add column if not exists completion_star_coin_bonus numeric not null default 0 check (completion_star_coin_bonus >= 0);

alter table public.wish_steps
  add column if not exists star_coin_value numeric not null default 1 check (star_coin_value >= 0);

alter table public.reward_claims
  alter column star_coin_delta type numeric using star_coin_delta::numeric;

create unique index if not exists idx_reward_claims_unique_wish_completion_bonus
on public.reward_claims (source_wish_id)
where source_wish_id is not null
  and claim_kind = 'wish_completion_bonus'::public.reward_claim_kind;

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
  pending_quantity integer;
  target_delta numeric;
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

  pending_quantity := greatest(normalized_current - claimed_quantity, 0);
  target_delta := pending_quantity * coalesce(target_wish.progress_star_coin_value, 0);

  update public.wishes
  set progress_current = normalized_current,
      updated_at = timezone('utc', now())
  where id = target_wish.id;

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
end;
$$;

create or replace function public.set_wish_step_done_with_star_coin(
  target_wish_id uuid,
  target_step_id uuid,
  next_done boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  target_step public.wish_steps;
  target_delta numeric;
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

  select *
  into target_step
  from public.wish_steps step
  where step.id = target_step_id
    and step.wish_id = target_wish_id;

  if target_step.id is null then
    raise exception 'Wish step not found';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_step.id::text), hashtext(target_wish.space_id::text));

  update public.wish_steps
  set is_done = coalesce(next_done, false),
      updated_at = timezone('utc', now())
  where id = target_step.id;

  update public.wishes
  set updated_at = timezone('utc', now())
  where id = target_wish.id;

  target_delta := coalesce(target_step.star_coin_value, 0);

  if coalesce(next_done, false) and target_delta > 0 then
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
    select
      target_wish.space_id,
      target_wish.owner_id,
      null,
      target_wish.id,
      target_step.id,
      'step_star_coin'::public.reward_claim_kind,
      1,
      target_delta::text || ' 星星币',
      '完成步骤「' || target_step.title || '」时自动获得星星币。',
      target_delta,
      timezone('utc', now())
    where not exists (
      select 1
      from public.reward_claims claim
      where claim.source_step_id = target_step.id
    );
  end if;
end;
$$;

create or replace function public.complete_wish_with_reward(
  target_wish_id uuid,
  target_reward_item_id uuid default null
)
returns public.reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  inserted_claim public.reward_claims;
  target_delta numeric;
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
    raise exception '只有这条愿望的归属人可以完成它';
  end if;

  if target_wish.status = 'done' then
    raise exception '这个愿望已经完成了';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_wish.id::text), hashtext(target_wish.space_id::text));

  if exists (
    select 1
    from public.reward_claims claim
    where claim.source_wish_id = target_wish.id
      and claim.claim_kind in (
        'wish_reward'::public.reward_claim_kind,
        'wish_completion_bonus'::public.reward_claim_kind
      )
  ) then
    raise exception '这条愿望的完成奖励已经领过了';
  end if;

  update public.wishes
  set status = 'done',
      completed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = target_wish.id;

  target_delta := coalesce(target_wish.completion_star_coin_bonus, 0);

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
    'wish_completion_bonus'::public.reward_claim_kind,
    1,
    target_delta::text || ' 星星币',
    '完成愿望「' || target_wish.title || '」时自动获得的额外星星币。',
    target_delta,
    timezone('utc', now())
  )
  returning * into inserted_claim;

  return inserted_claim;
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

revoke all on function public.set_wish_count_progress_with_star_coin(uuid, integer) from public;
revoke all on function public.set_wish_step_done_with_star_coin(uuid, uuid, boolean) from public;
revoke all on function public.complete_wish_with_reward(uuid, uuid) from public;
revoke all on function public.get_app_capabilities() from public;

grant execute on function public.set_wish_count_progress_with_star_coin(uuid, integer) to authenticated;
grant execute on function public.set_wish_step_done_with_star_coin(uuid, uuid, boolean) to authenticated;
grant execute on function public.complete_wish_with_reward(uuid, uuid) to authenticated;
grant execute on function public.get_app_capabilities() to authenticated;
