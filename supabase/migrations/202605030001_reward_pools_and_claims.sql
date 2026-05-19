do $$
begin
  if not exists (select 1 from pg_type where typname = 'reward_tier') then
    create type public.reward_tier as enum ('daily', 'premium');
  end if;

  if not exists (select 1 from pg_type where typname = 'reward_claim_kind') then
    create type public.reward_claim_kind as enum ('step_reward', 'wish_reward', 'star_coin', 'premium_redeem');
  end if;
end
$$;

create table if not exists public.reward_pool_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  tier public.reward_tier not null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  note text not null default '',
  star_coin_cost integer not null default 0 check (star_coin_cost >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  reward_item_id uuid references public.reward_pool_items (id) on delete set null,
  source_wish_id uuid references public.wishes (id) on delete set null,
  source_step_id uuid references public.wish_steps (id) on delete set null,
  claim_kind public.reward_claim_kind not null,
  title_snapshot text not null check (char_length(trim(title_snapshot)) between 1 and 120),
  note_snapshot text not null default '',
  star_coin_delta integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_reward_pool_items_space_owner_tier
on public.reward_pool_items (space_id, owner_id, tier, updated_at desc);

create index if not exists idx_reward_claims_space_owner_created
on public.reward_claims (space_id, owner_id, created_at desc);

create unique index if not exists idx_reward_claims_unique_step_source
on public.reward_claims (source_step_id)
where source_step_id is not null;

create unique index if not exists idx_reward_claims_unique_wish_source
on public.reward_claims (source_wish_id)
where source_wish_id is not null
  and claim_kind = 'wish_reward'::public.reward_claim_kind;

drop trigger if exists trg_reward_pool_items_updated_at on public.reward_pool_items;
create trigger trg_reward_pool_items_updated_at
before update on public.reward_pool_items
for each row
execute function public.set_updated_at();

alter table public.reward_pool_items enable row level security;
alter table public.reward_claims enable row level security;

drop policy if exists "reward_pool_items_select_member" on public.reward_pool_items;
create policy "reward_pool_items_select_member"
on public.reward_pool_items
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "reward_pool_items_insert_owner" on public.reward_pool_items;
create policy "reward_pool_items_insert_owner"
on public.reward_pool_items
for insert
to authenticated
with check (
  public.is_space_member(space_id)
  and owner_id = auth.uid()
);

drop policy if exists "reward_pool_items_update_owner" on public.reward_pool_items;
create policy "reward_pool_items_update_owner"
on public.reward_pool_items
for update
to authenticated
using (
  public.is_space_member(space_id)
  and owner_id = auth.uid()
)
with check (
  public.is_space_member(space_id)
  and owner_id = auth.uid()
);

drop policy if exists "reward_pool_items_delete_owner" on public.reward_pool_items;
create policy "reward_pool_items_delete_owner"
on public.reward_pool_items
for delete
to authenticated
using (
  public.is_space_member(space_id)
  and owner_id = auth.uid()
);

drop policy if exists "reward_claims_select_member" on public.reward_claims;
create policy "reward_claims_select_member"
on public.reward_claims
for select
to authenticated
using (public.is_space_member(space_id));

grant select, insert, update, delete on table public.reward_pool_items to authenticated;
grant select on table public.reward_claims to authenticated;

create or replace function public.complete_step_with_reward(
  target_wish_id uuid,
  target_step_id uuid,
  target_reward_item_id uuid default null,
  claim_star_coin boolean default false
)
returns public.reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  target_step public.wish_steps;
  target_reward_item public.reward_pool_items;
  inserted_claim public.reward_claims;
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

  if not public.can_access_wish(target_wish_id) then
    raise exception '当前成员暂时不能完成这个愿望步骤';
  end if;

  select *
  into target_step
  from public.wish_steps step
  where step.id = target_step_id
    and step.wish_id = target_wish_id;

  if target_step.id is null then
    raise exception 'Wish step not found';
  end if;

  if target_step.is_done then
    raise exception '这个步骤已经完成了';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_step.id::text), hashtext(target_wish.space_id::text));

  if exists (
    select 1
    from public.reward_claims claim
    where claim.source_step_id = target_step.id
  ) then
    raise exception '这个步骤的奖励已经领过了';
  end if;

  if claim_star_coin and target_reward_item_id is not null then
    raise exception '星星币奖励和日常奖励不能同时领取';
  end if;

  if not claim_star_coin and target_reward_item_id is null then
    raise exception '请选择一条日常奖励或改领星星币';
  end if;

  if not claim_star_coin then
    select *
    into target_reward_item
    from public.reward_pool_items item
    where item.id = target_reward_item_id;

    if target_reward_item.id is null then
      raise exception 'Reward item not found';
    end if;

    if target_reward_item.space_id <> target_wish.space_id
      or target_reward_item.owner_id <> auth.uid()
      or target_reward_item.tier <> 'daily'
      or target_reward_item.is_archived then
      raise exception '只能领取自己日常奖励池里的有效奖励';
    end if;
  end if;

  update public.wish_steps
  set is_done = true
  where id = target_step.id;

  update public.wishes
  set updated_at = timezone('utc', now())
  where id = target_wish.id;

  insert into public.reward_claims (
    space_id,
    owner_id,
    reward_item_id,
    source_wish_id,
    source_step_id,
    claim_kind,
    title_snapshot,
    note_snapshot,
    star_coin_delta,
    created_at
  )
  values (
    target_wish.space_id,
    auth.uid(),
    case when claim_star_coin then null else target_reward_item.id end,
    target_wish.id,
    target_step.id,
    case
      when claim_star_coin then 'star_coin'::public.reward_claim_kind
      else 'step_reward'::public.reward_claim_kind
    end,
    case when claim_star_coin then '1 枚星星币' else target_reward_item.title end,
    case when claim_star_coin then '完成一个小步骤，先把这次奖励存成 1 枚星星币。' else target_reward_item.note end,
    case when claim_star_coin then 1 else 0 end,
    timezone('utc', now())
  )
  returning * into inserted_claim;

  return inserted_claim;
end;
$$;

create or replace function public.complete_wish_with_reward(
  target_wish_id uuid,
  target_reward_item_id uuid
)
returns public.reward_claims
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  target_reward_item public.reward_pool_items;
  inserted_claim public.reward_claims;
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

  if not public.can_access_wish(target_wish_id) then
    raise exception '当前成员暂时不能完成这个愿望';
  end if;

  if target_wish.status = 'done' then
    raise exception '这个愿望已经完成了';
  end if;

  perform pg_advisory_xact_lock(hashtext(target_wish.id::text), hashtext(target_wish.space_id::text));

  if exists (
    select 1
    from public.reward_claims claim
    where claim.source_wish_id = target_wish.id
      and claim.claim_kind = 'wish_reward'::public.reward_claim_kind
  ) then
    raise exception '这条愿望的完成奖励已经领过了';
  end if;

  select *
  into target_reward_item
  from public.reward_pool_items item
  where item.id = target_reward_item_id;

  if target_reward_item.id is null then
    raise exception 'Reward item not found';
  end if;

  if target_reward_item.space_id <> target_wish.space_id
    or target_reward_item.owner_id <> auth.uid()
    or target_reward_item.tier <> 'premium'
    or target_reward_item.is_archived then
    raise exception '只能领取自己高档奖励池里的有效奖励';
  end if;

  update public.wishes
  set status = 'done',
      completed_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  where id = target_wish.id;

  insert into public.reward_claims (
    space_id,
    owner_id,
    reward_item_id,
    source_wish_id,
    source_step_id,
    claim_kind,
    title_snapshot,
    note_snapshot,
    star_coin_delta,
    created_at
  )
  values (
    target_wish.space_id,
    auth.uid(),
    target_reward_item.id,
    target_wish.id,
    null,
    'wish_reward'::public.reward_claim_kind,
    target_reward_item.title,
    target_reward_item.note,
    0,
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
  available_star_coins integer;
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
    raise exception '当前成员暂时不能兑换这条奖励';
  end if;

  if target_reward_item.owner_id <> auth.uid()
    or target_reward_item.tier <> 'premium'
    or target_reward_item.is_archived then
    raise exception '只能兑换自己高档奖励池里的有效奖励';
  end if;

  if target_reward_item.star_coin_cost <= 0 then
    raise exception '这条高档奖励还没有设置星星币价格';
  end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text), hashtext(target_reward_item.space_id::text));

  select coalesce(sum(claim.star_coin_delta), 0)
  into available_star_coins
  from public.reward_claims claim
  where claim.space_id = target_reward_item.space_id
    and claim.owner_id = auth.uid();

  if available_star_coins < target_reward_item.star_coin_cost then
    raise exception '还没有攒够兑换这条奖励的星星币';
  end if;

  insert into public.reward_claims (
    space_id,
    owner_id,
    reward_item_id,
    source_wish_id,
    source_step_id,
    claim_kind,
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
    target_reward_item.title,
    target_reward_item.note,
    -target_reward_item.star_coin_cost,
    timezone('utc', now())
  )
  returning * into inserted_claim;

  return inserted_claim;
end;
$$;

grant execute on function public.complete_step_with_reward(uuid, uuid, uuid, boolean) to authenticated;
grant execute on function public.complete_wish_with_reward(uuid, uuid) to authenticated;
grant execute on function public.redeem_premium_reward(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reward_pool_items'
  ) then
    alter publication supabase_realtime add table public.reward_pool_items;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reward_claims'
  ) then
    alter publication supabase_realtime add table public.reward_claims;
  end if;
end
$$;