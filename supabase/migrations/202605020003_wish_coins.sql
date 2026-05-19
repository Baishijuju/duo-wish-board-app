create table if not exists public.wish_coins (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  wish_id uuid not null references public.wishes (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  cycle_key text not null check (char_length(trim(cycle_key)) between 1 and 64),
  amount integer not null default 1 check (amount = 1),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_wish_coins_space_cycle_voter
on public.wish_coins (space_id, cycle_key, voter_id, created_at desc);

create index if not exists idx_wish_coins_wish_created
on public.wish_coins (wish_id, created_at desc);

alter table public.wish_coins enable row level security;

drop policy if exists "wish_coins_select_visible_wish" on public.wish_coins;
create policy "wish_coins_select_visible_wish"
on public.wish_coins
for select
to authenticated
using (
  public.is_space_member(space_id)
  and public.can_access_wish(wish_id)
);

grant select on table public.wish_coins to authenticated;

create or replace function public.cast_wish_coin(target_wish_id uuid)
returns public.wish_coins
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  cycle_start_beijing timestamp without time zone;
  cycle_start_utc timestamptz;
  cycle_key_value text;
  used_coin_count integer;
  inserted_coin public.wish_coins;
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
    raise exception '当前成员暂时不能给这个愿望投币';
  end if;

  if target_wish.status = 'done' then
    raise exception '这个愿望已经实现了，不需要再投币';
  end if;

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text), hashtext(target_wish.space_id::text));

  cycle_start_beijing := date_trunc('week', timezone('Asia/Shanghai', now()) - interval '4 days 20 hours') + interval '4 days 20 hours';
  cycle_start_utc := timezone('Asia/Shanghai', cycle_start_beijing);
  cycle_key_value := to_char(cycle_start_beijing, 'YYYY-MM-DD"T"HH24:MI:SS') || '+08:00';

  select coalesce(sum(coin.amount), 0)
  into used_coin_count
  from public.wish_coins coin
  where coin.space_id = target_wish.space_id
    and coin.voter_id = auth.uid()
    and coin.cycle_key = cycle_key_value;

  if used_coin_count >= 3 then
    raise exception '这周的 3 枚愿望币已经投完了';
  end if;

  insert into public.wish_coins (space_id, wish_id, voter_id, cycle_key, amount, created_at)
  values (target_wish.space_id, target_wish.id, auth.uid(), cycle_key_value, 1, timezone('utc', now()))
  returning * into inserted_coin;

  update public.wishes
  set is_starred = true
  where id = target_wish.id
    and is_starred is distinct from true;

  return inserted_coin;
end;
$$;

grant execute on function public.cast_wish_coin(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wish_coins'
  ) then
    alter publication supabase_realtime add table public.wish_coins;
  end if;
end
$$;
