create index if not exists idx_reward_claims_space_created
on public.reward_claims (space_id, created_at desc);

create or replace function public.get_reward_claim_sync_payload(target_space_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_space_member(target_space_id) then
    raise exception 'Space membership required';
  end if;

  select jsonb_build_object(
    'summary_claims', coalesce((
      select jsonb_agg(to_jsonb(summary_rows) order by summary_rows.created_at desc, summary_rows.id desc)
      from (
        select
          (array_agg(claim.id order by claim.created_at desc, claim.id desc))[1] as id,
          claim.owner_id,
          claim.reward_item_id,
          claim.source_wish_id,
          claim.source_step_id,
          claim.claim_kind,
          sum(claim.quantity)::bigint as quantity,
          (array_agg(claim.title_snapshot order by claim.created_at desc, claim.id desc))[1] as title_snapshot,
          (array_agg(claim.note_snapshot order by claim.created_at desc, claim.id desc))[1] as note_snapshot,
          sum(claim.star_coin_delta) as star_coin_delta,
          max(claim.created_at) as created_at
        from public.reward_claims claim
        where claim.space_id = target_space_id
          and claim.created_at < now() - interval '7 days'
        group by
          claim.owner_id,
          claim.reward_item_id,
          claim.source_wish_id,
          claim.source_step_id,
          claim.claim_kind,
          case when claim.star_coin_delta < 0 then -1 else 1 end
      ) summary_rows
    ), '[]'::jsonb),
    'recent_claims', coalesce((
      select jsonb_agg(to_jsonb(recent_rows) order by recent_rows.created_at desc, recent_rows.id desc)
      from (
        select
          claim.id,
          claim.owner_id,
          claim.reward_item_id,
          claim.source_wish_id,
          claim.source_step_id,
          claim.claim_kind,
          claim.quantity,
          claim.title_snapshot,
          claim.note_snapshot,
          claim.star_coin_delta,
          claim.created_at
        from public.reward_claims claim
        where claim.space_id = target_space_id
          and claim.created_at >= now() - interval '7 days'
        order by claim.created_at desc, claim.id desc
      ) recent_rows
    ), '[]'::jsonb),
    'latest_claims', coalesce((
      select jsonb_agg(to_jsonb(latest_rows) order by latest_rows.created_at desc, latest_rows.id desc)
      from (
        select
          claim.id,
          claim.owner_id,
          claim.reward_item_id,
          claim.source_wish_id,
          claim.source_step_id,
          claim.claim_kind,
          claim.quantity,
          claim.title_snapshot,
          claim.note_snapshot,
          claim.star_coin_delta,
          claim.created_at
        from public.reward_claims claim
        where claim.space_id = target_space_id
        order by claim.created_at desc, claim.id desc
        limit 8
      ) latest_rows
    ), '[]'::jsonb)
  )
  into payload;

  return payload;
end;
$$;

create or replace function public.get_reward_claim_review_data(
  target_space_id uuid,
  range_start date,
  range_end date
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  range_start_at timestamptz;
  range_end_at timestamptz;
  payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_space_member(target_space_id) then
    raise exception 'Space membership required';
  end if;

  if range_start is null or range_end is null or range_end < range_start then
    raise exception 'Invalid reward claim date range';
  end if;

  range_start_at := range_start::timestamp at time zone 'Asia/Shanghai';
  range_end_at := (range_end + 1)::timestamp at time zone 'Asia/Shanghai';

  with recursive ordered_claims as (
    select
      claim.owner_id,
      claim.id,
      claim.created_at,
      claim.star_coin_delta::numeric as star_coin_delta,
      row_number() over (partition by claim.owner_id order by claim.created_at, claim.id) as row_number
    from public.reward_claims claim
    where claim.space_id = target_space_id
      and claim.created_at < range_start_at
  ), running_balances as (
    select
      claim.owner_id,
      claim.row_number,
      greatest(claim.star_coin_delta, 0::numeric) as balance
    from ordered_claims claim
    where claim.row_number = 1

    union all

    select
      claim.owner_id,
      claim.row_number,
      greatest(balance.balance + claim.star_coin_delta, 0::numeric) as balance
    from running_balances balance
    join ordered_claims claim
      on claim.owner_id = balance.owner_id
      and claim.row_number = balance.row_number + 1
  ), opening_balances as (
    select balance.owner_id, balance.balance
    from running_balances balance
    where not exists (
      select 1
      from running_balances newer
      where newer.owner_id = balance.owner_id
        and newer.row_number > balance.row_number
    )
  )
  select jsonb_build_object(
    'opening_balances', coalesce((
      select jsonb_agg(jsonb_build_object('owner_id', balance.owner_id, 'balance', balance.balance))
      from opening_balances balance
    ), '[]'::jsonb),
    'claims', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', claim.id,
        'owner_id', claim.owner_id,
        'reward_item_id', claim.reward_item_id,
        'source_wish_id', claim.source_wish_id,
        'source_step_id', claim.source_step_id,
        'claim_kind', claim.claim_kind,
        'quantity', claim.quantity,
        'title_snapshot', claim.title_snapshot,
        'note_snapshot', claim.note_snapshot,
        'star_coin_delta', claim.star_coin_delta,
        'created_at', claim.created_at
      ) order by claim.created_at, claim.id)
      from public.reward_claims claim
      where claim.space_id = target_space_id
        and claim.created_at >= range_start_at
        and claim.created_at < range_end_at
    ), '[]'::jsonb)
  )
  into payload;

  return payload;
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
      and to_regclass('public.wish_steps') is not null
    ),
    'has_wish_comment_images', to_regclass('public.wish_comment_images') is not null,
    'has_wish_coins', to_regclass('public.wish_coins') is not null,
    'has_reward_pools', (
      to_regclass('public.reward_pool_items') is not null
      and to_regclass('public.reward_claims') is not null
    ),
    'has_reward_claim_summary', (
      to_regprocedure('public.get_reward_claim_sync_payload(uuid)') is not null
      and to_regprocedure('public.get_reward_claim_review_data(uuid,date,date)') is not null
      and to_regclass('public.wish_threads') is not null
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

revoke all on function public.get_reward_claim_sync_payload(uuid) from public;
revoke all on function public.get_reward_claim_review_data(uuid, date, date) from public;
revoke all on function public.get_app_capabilities() from public;
grant execute on function public.get_reward_claim_sync_payload(uuid) to authenticated;
grant execute on function public.get_reward_claim_review_data(uuid, date, date) to authenticated;
grant execute on function public.get_app_capabilities() to authenticated;
