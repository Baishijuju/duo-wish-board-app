-- Baseline v2 schema skeleton
-- Purpose: provide a future consolidated baseline for new environments.
-- Status: draft scaffold. Keep historical migrations for audit and rollback.
--
-- Note:
-- - Preferred generation path is `supabase db dump --linked --schema public`.
-- - In this workspace, db dump currently requires Docker Desktop and is blocked.
-- - Therefore this file is upgraded to a contract-accurate scaffold with concrete
--   object inventory, to be expanded into full executable DDL incrementally.

begin;

-- ---------------------------------------------------------------------------
-- 0) Extensions / safety defaults
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1) Core enums (align with current production contract)
-- ---------------------------------------------------------------------------
-- Current enum inventory (verified from linked remote):
--   public.monthly_journal_snapshot_status = ('ready')
--   public.reward_claim_kind = (
--     'step_reward', 'wish_reward', 'star_coin', 'premium_redeem',
--     'count_reward', 'reward_deposit', 'step_star_coin',
--     'count_star_coin', 'wish_completion_bonus'
--   )
--   public.reward_tier = ('daily', 'premium')
--   public.space_role = ('owner', 'member')
--   public.wish_progress_mode = ('none', 'count', 'steps')
--   public.wish_scope = ('shared', 'private')
--   public.wish_status = ('active', 'done')
--   public.wish_thread_event_kind = (
--     'comment', 'wish_published', 'wish_step_completed', 'wish_coin_cast',
--     'reward_claimed', 'wish_completed', 'weekly_welfare_issued',
--     'dragon_ball_reached', 'premium_redeem'
--   )

-- ---------------------------------------------------------------------------
-- 2) Core tables
-- ---------------------------------------------------------------------------
-- Current table inventory (verified from linked remote):
--   monthly_journal_snapshots
--   reward_claims
--   reward_pool_items
--   space_email_bindings
--   space_members
--   spaces
--   thread_reactions
--   wish_comment_images
--   wish_comments
--   wish_count_progress_daily
--   wish_images
--   wish_steps
--   wish_thread_images
--   wish_threads
--   wishes

-- ---------------------------------------------------------------------------
-- 3) Indexes and unique constraints
-- ---------------------------------------------------------------------------
-- TODO: include only effective latest indexes.
-- NOTE: decide daily uniqueness semantics explicitly:
--   option A: unique (wish_id, progress_date)
--   option B: unique (wish_id, progress_date, owner_id)

-- ---------------------------------------------------------------------------
-- 4) Functions / RPC
-- ---------------------------------------------------------------------------
-- Current function inventory (verified from linked remote):
--   bind_email_to_space(uuid, text, space_role, text)
--   can_access_thread(uuid)
--   can_access_thread_reaction(uuid, text)
--   can_access_wish(uuid)
--   claim_completed_step_reward(uuid, uuid, uuid, boolean)
--   claim_count_progress_reward(uuid, uuid, boolean, integer)
--   complete_step_with_reward(uuid, uuid, uuid, boolean)
--   complete_wish_with_reward(uuid, uuid)
--   create_personal_space(text, text, text)
--   deposit_reward_star_coins(uuid, numeric)
--   ensure_bound_space_memberships(text)
--   ensure_monthly_journal_snapshots(uuid)
--   ensure_space_owner_membership()
--   freeze_monthly_journal_snapshot(uuid, text)
--   get_app_capabilities()
--   get_month_key_for_timestamp(timestamptz)
--   get_space_member_display_name(uuid, uuid)
--   is_space_member(uuid)
--   is_space_owner(uuid)
--   join_space_by_invite(text, text)
--   recompute_count_progress_daily_for_wish_date(uuid, date)
--   redeem_premium_reward(uuid)
--   rls_auto_enable()
--   set_updated_at()
--   set_wish_count_progress_with_star_coin(uuid, integer)
--   set_wish_image_cover(uuid, uuid)
--   set_wish_image_order(uuid, uuid[])
--   set_wish_step_done_with_star_coin(uuid, uuid, boolean)
--   sync_count_progress_daily_from_reward_claims()
--   sync_reward_claim_to_thread()
--   sync_wish_comment_image_to_thread_image()
--   sync_wish_comment_to_thread()
--   sync_wish_completion_to_thread()
--   sync_wish_publish_to_thread()
--   sync_wish_step_completion_to_thread()
--   update_wish_image_note(uuid, uuid, text)
--   upsert_wish_thread(uuid, uuid, uuid, uuid, wish_thread_event_kind, text, jsonb, text, uuid, text, timestamptz, timestamptz)

-- TODO: consolidate latest function bodies with hardened search_path and
-- SECURITY DEFINER boundaries exactly as production contract.

-- ---------------------------------------------------------------------------
-- 5) Triggers
-- ---------------------------------------------------------------------------
-- Must include:
--   set_updated_at triggers
--   reward_claims -> wish_threads projection trigger
--   reward_claims -> wish_count_progress_daily sync trigger

-- ---------------------------------------------------------------------------
-- 6) RLS policies and grants
-- ---------------------------------------------------------------------------
-- TODO: ensure every RLS-enabled business table has SELECT policy.
-- Recommended check after apply: run `npm run db:acceptance`.

-- ---------------------------------------------------------------------------
-- 7) Realtime publication
-- ---------------------------------------------------------------------------
-- TODO: add publication membership for required tables.

-- ---------------------------------------------------------------------------
-- 8) Capability contract
-- ---------------------------------------------------------------------------
-- TODO: include public.get_app_capabilities() with current keys.

commit;
