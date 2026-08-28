-- Targeted cleanup for traces left by deleting a test wish.
-- Scope: current owner + current space only.

with deleted_claims as (
  delete from public.reward_claims
  where owner_id = '0734cf0a-57b8-4909-9c6b-3bedc6ebb4b8'::uuid
    and source_wish_id is null
    and claim_kind = 'count_star_coin'::public.reward_claim_kind
    and title_snapshot = '1 星星币'
    and note_snapshot = '数字进度推进后自动获得星星币。'
    and created_at >= now() - interval '3 days'
  returning id
),
deleted_orphan_daily as (
  delete from public.wish_count_progress_daily daily
  where daily.owner_id = '0734cf0a-57b8-4909-9c6b-3bedc6ebb4b8'::uuid
    and not exists (
      select 1
      from public.wishes wish
      where wish.id = daily.wish_id
    )
  returning id
),
deleted_snapshots as (
  delete from public.monthly_journal_snapshots
  where space_id = '83fa4725-309c-4e46-b5af-9231a279d104'::uuid
  returning id
)
select
  (select count(*) from deleted_claims) as deleted_claim_count,
  (select count(*) from deleted_orphan_daily) as deleted_orphan_daily_count,
  (select count(*) from deleted_snapshots) as deleted_snapshot_count;