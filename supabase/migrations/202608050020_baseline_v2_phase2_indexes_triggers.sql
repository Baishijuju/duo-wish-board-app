-- Baseline v2 phase 2: performance indexes and runtime triggers.
-- Idempotent and compatibility-safe.

begin;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_space_members_user
on public.space_members (user_id);

create index if not exists idx_space_email_bindings_space_id
on public.space_email_bindings (space_id);

create unique index if not exists idx_space_email_bindings_normalized_email
on public.space_email_bindings (normalized_email);

create index if not exists idx_wishes_owner
on public.wishes (owner_id);

create index if not exists idx_wishes_space
on public.wishes (space_id);

create index if not exists idx_wish_steps_wish
on public.wish_steps (wish_id, sort_order, created_at);

create index if not exists idx_wish_comments_wish
on public.wish_comments (wish_id, created_at desc);

create index if not exists idx_wish_images_wish
on public.wish_images (wish_id, sort_order, created_at);

create index if not exists idx_wish_comment_images_comment
on public.wish_comment_images (comment_id, sort_order, created_at);

create index if not exists idx_reward_pool_items_space_owner_tier
on public.reward_pool_items (space_id, owner_id, tier, updated_at desc);

create index if not exists idx_reward_pool_items_space_scope_tier
on public.reward_pool_items (space_id, reward_scope, tier, updated_at desc);

create index if not exists idx_reward_claims_space_owner_created
on public.reward_claims (space_id, owner_id, created_at desc);

create index if not exists idx_wish_threads_space_created
on public.wish_threads (space_id, created_at desc);

create index if not exists idx_wish_threads_wish_created
on public.wish_threads (wish_id, created_at);

create index if not exists idx_wish_threads_event_created
on public.wish_threads (event_kind, created_at desc);

create index if not exists idx_wish_thread_images_thread_order
on public.wish_thread_images (thread_id, sort_order, created_at);

create index if not exists idx_thread_reactions_thread_created
on public.thread_reactions (target_thread_id, created_at desc);

create index if not exists idx_wish_count_progress_daily_owner_date
on public.wish_count_progress_daily (owner_id, progress_date desc);

-- ---------------------------------------------------------------------------
-- Triggers (guarded by function existence)
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    drop trigger if exists trg_spaces_updated_at on public.spaces;
    create trigger trg_spaces_updated_at
    before update on public.spaces
    for each row
    execute function public.set_updated_at();

    drop trigger if exists trg_wishes_updated_at on public.wishes;
    create trigger trg_wishes_updated_at
    before update on public.wishes
    for each row
    execute function public.set_updated_at();

    drop trigger if exists trg_wish_steps_updated_at on public.wish_steps;
    create trigger trg_wish_steps_updated_at
    before update on public.wish_steps
    for each row
    execute function public.set_updated_at();

    drop trigger if exists trg_reward_pool_items_updated_at on public.reward_pool_items;
    create trigger trg_reward_pool_items_updated_at
    before update on public.reward_pool_items
    for each row
    execute function public.set_updated_at();

    drop trigger if exists trg_wish_threads_updated_at on public.wish_threads;
    create trigger trg_wish_threads_updated_at
    before update on public.wish_threads
    for each row
    execute function public.set_updated_at();
  end if;
end
$$;

do $$
begin
  if to_regprocedure('public.ensure_space_owner_membership()') is not null then
    drop trigger if exists trg_spaces_owner_membership on public.spaces;
    create trigger trg_spaces_owner_membership
    after insert on public.spaces
    for each row
    execute function public.ensure_space_owner_membership();
  end if;
end
$$;

do $$
begin
  if to_regprocedure('public.sync_wish_publish_to_thread()') is not null then
    drop trigger if exists trg_wishes_publish_thread on public.wishes;
    create trigger trg_wishes_publish_thread
    after insert on public.wishes
    for each row
    execute function public.sync_wish_publish_to_thread();
  end if;

  if to_regprocedure('public.sync_wish_completion_to_thread()') is not null then
    drop trigger if exists trg_wishes_completed_thread on public.wishes;
    create trigger trg_wishes_completed_thread
    after update of status, completed_at on public.wishes
    for each row
    execute function public.sync_wish_completion_to_thread();
  end if;

  if to_regprocedure('public.sync_wish_step_completion_to_thread()') is not null then
    drop trigger if exists trg_wish_steps_completed_thread on public.wish_steps;
    create trigger trg_wish_steps_completed_thread
    after update of is_done on public.wish_steps
    for each row
    execute function public.sync_wish_step_completion_to_thread();
  end if;

  if to_regprocedure('public.sync_wish_comment_to_thread()') is not null then
    drop trigger if exists trg_wish_comments_sync_thread on public.wish_comments;
    create trigger trg_wish_comments_sync_thread
    after insert or update or delete on public.wish_comments
    for each row
    execute function public.sync_wish_comment_to_thread();
  end if;

  if to_regprocedure('public.sync_wish_comment_image_to_thread_image()') is not null then
    drop trigger if exists trg_wish_comment_images_sync_thread_images on public.wish_comment_images;
    create trigger trg_wish_comment_images_sync_thread_images
    after insert or update or delete on public.wish_comment_images
    for each row
    execute function public.sync_wish_comment_image_to_thread_image();
  end if;

  if to_regprocedure('public.sync_reward_claim_to_thread()') is not null then
    drop trigger if exists trg_reward_claims_thread on public.reward_claims;
    create trigger trg_reward_claims_thread
    after insert on public.reward_claims
    for each row
    execute function public.sync_reward_claim_to_thread();
  end if;

  if to_regprocedure('public.sync_count_progress_daily_from_reward_claims()') is not null then
    drop trigger if exists trg_reward_claims_sync_count_progress_daily on public.reward_claims;
    create trigger trg_reward_claims_sync_count_progress_daily
    after insert or update or delete on public.reward_claims
    for each row
    execute function public.sync_count_progress_daily_from_reward_claims();
  end if;
end
$$;

commit;
