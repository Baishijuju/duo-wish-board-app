create table if not exists public.wish_count_progress_daily (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  space_id uuid not null,
  owner_id uuid not null,
  progress_date date not null,
  progress_units integer not null default 0 check (progress_units >= 0),
  last_event_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (wish_id, progress_date)
);

create index if not exists idx_wish_count_progress_daily_owner_date
on public.wish_count_progress_daily (owner_id, progress_date desc);

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

  if increased_quantity > 0 then
    insert into public.wish_count_progress_daily (
      wish_id,
      space_id,
      owner_id,
      progress_date,
      progress_units,
      last_event_at,
      created_at,
      updated_at
    )
    values (
      target_wish.id,
      target_wish.space_id,
      target_wish.owner_id,
      beijing_progress_date,
      increased_quantity,
      timezone('utc', now()),
      timezone('utc', now()),
      timezone('utc', now())
    )
    on conflict (wish_id, progress_date)
    do update set
      progress_units = public.wish_count_progress_daily.progress_units + excluded.progress_units,
      space_id = excluded.space_id,
      owner_id = excluded.owner_id,
      last_event_at = excluded.last_event_at,
      updated_at = timezone('utc', now());
  end if;

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
