-- Baseline v2 phase 1: core enums and tables.
-- This file is intended for new environment bootstrap consolidation.
-- Keep historical migrations for audit and rollback.

begin;

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'space_role') then
    create type public.space_role as enum ('owner', 'member');
  end if;

  if not exists (select 1 from pg_type where typname = 'wish_scope') then
    create type public.wish_scope as enum ('shared', 'private');
  end if;

  if not exists (select 1 from pg_type where typname = 'wish_status') then
    create type public.wish_status as enum ('active', 'done');
  end if;

  if not exists (select 1 from pg_type where typname = 'wish_progress_mode') then
    create type public.wish_progress_mode as enum ('none', 'count', 'steps');
  end if;

  if not exists (select 1 from pg_type where typname = 'reward_tier') then
    create type public.reward_tier as enum ('daily', 'premium');
  end if;

  if not exists (select 1 from pg_type where typname = 'reward_claim_kind') then
    create type public.reward_claim_kind as enum (
      'step_reward',
      'wish_reward',
      'star_coin',
      'premium_redeem',
      'count_reward',
      'reward_deposit',
      'step_star_coin',
      'count_star_coin',
      'wish_completion_bonus'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'wish_thread_event_kind') then
    create type public.wish_thread_event_kind as enum (
      'comment',
      'wish_published',
      'wish_step_completed',
      'wish_coin_cast',
      'reward_claimed',
      'wish_completed',
      'weekly_welfare_issued',
      'dragon_ball_reached',
      'premium_redeem'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'monthly_journal_snapshot_status') then
    create type public.monthly_journal_snapshot_status as enum ('ready');
  end if;
end
$$;

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  invite_code text not null unique check (char_length(trim(invite_code)) between 6 and 32),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.space_members (
  space_id uuid not null references public.spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 50),
  role public.space_role not null default 'member'::public.space_role,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (space_id, user_id)
);

create table if not exists public.space_email_bindings (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  email text not null check (
    char_length(trim(email)) between 5 and 320
    and position('@' in trim(email)) > 1
  ),
  normalized_email text unique,
  display_name text check (
    display_name is null
    or char_length(trim(display_name)) between 1 and 50
  ),
  role public.space_role not null default 'member'::public.space_role,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  category text not null default ''::text,
  note text not null default ''::text,
  scope public.wish_scope not null default 'shared'::public.wish_scope,
  status public.wish_status not null default 'active'::public.wish_status,
  is_starred boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  progress_mode public.wish_progress_mode not null default 'none'::public.wish_progress_mode,
  progress_current integer not null default 0 check (progress_current >= 0),
  progress_target integer not null default 0 check (progress_target >= 0),
  progress_unit text not null default ''::text check (char_length(trim(progress_unit)) <= 12),
  completed_at timestamptz,
  progress_star_coin_value numeric not null default 0 check (progress_star_coin_value >= 0::numeric),
  completion_star_coin_bonus numeric not null default 0 check (completion_star_coin_bonus >= 0::numeric),
  check (progress_mode <> 'count'::public.wish_progress_mode or progress_target > 0),
  check (progress_mode <> 'count'::public.wish_progress_mode or progress_current <= progress_target)
);

create table if not exists public.wish_steps (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  is_done boolean not null default false,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  star_coin_value numeric not null default 1 check (star_coin_value >= 0::numeric)
);

create table if not exists public.wish_comments (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wish_images (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (char_length(trim(storage_path)) between 1 and 512),
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text not null check (char_length(trim(mime_type)) between 1 and 120),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  note text not null default ''::text check (char_length(note) <= 240)
);

create table if not exists public.wish_comment_images (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.wish_comments(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (char_length(trim(storage_path)) between 1 and 512),
  file_name text not null check (char_length(trim(file_name)) between 1 and 255),
  mime_type text not null check (char_length(trim(mime_type)) between 1 and 120),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reward_pool_items (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  tier public.reward_tier not null,
  title text not null check (char_length(trim(title)) between 1 and 120),
  note text not null default ''::text,
  star_coin_cost integer not null default 0 check (star_coin_cost >= 0),
  is_archived boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  reward_scope text not null default 'personal'::text check (reward_scope = any(array['personal'::text, 'shared'::text]))
);

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  reward_item_id uuid references public.reward_pool_items(id) on delete set null,
  source_wish_id uuid references public.wishes(id) on delete set null,
  source_step_id uuid references public.wish_steps(id) on delete set null,
  claim_kind public.reward_claim_kind not null,
  title_snapshot text not null check (char_length(trim(title_snapshot)) between 1 and 120),
  note_snapshot text not null default ''::text,
  star_coin_delta numeric not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  quantity integer not null default 1 check (quantity > 0)
);

create table if not exists public.wish_threads (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  wish_id uuid references public.wishes(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_kind public.wish_thread_event_kind not null,
  message_text text not null check (char_length(trim(message_text)) between 1 and 5000),
  meta jsonb not null default '{}'::jsonb,
  source_table text,
  source_id uuid,
  dedupe_key text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check ((source_table is null and source_id is null) or (source_table is not null and source_id is not null))
);

create table if not exists public.wish_thread_images (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.wish_threads(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.thread_reactions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  target_thread_id text not null,
  actor_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null check (char_length(trim(emoji)) between 1 and 16),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monthly_journal_snapshots (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces(id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  snapshot_status public.monthly_journal_snapshot_status not null default 'ready'::public.monthly_journal_snapshot_status,
  cover_title text not null check (char_length(trim(cover_title)) between 1 and 120),
  cover_subtitle text not null default ''::text,
  narrative_blocks jsonb not null default '[]'::jsonb,
  metrics_snapshot jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users(id) on delete set null
);

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

create unique index if not exists idx_thread_reactions_unique
on public.thread_reactions (space_id, target_thread_id, actor_id, emoji);

create unique index if not exists idx_monthly_journal_snapshots_space_month
on public.monthly_journal_snapshots (space_id, month_key);

create unique index if not exists idx_reward_claims_unique_step_source
on public.reward_claims (source_step_id)
where source_step_id is not null;

create unique index if not exists idx_reward_claims_unique_wish_source
on public.reward_claims (source_wish_id)
where source_wish_id is not null
  and claim_kind = 'wish_reward'::public.reward_claim_kind;

create unique index if not exists idx_reward_claims_unique_wish_completion_bonus
on public.reward_claims (source_wish_id)
where source_wish_id is not null
  and claim_kind = 'wish_completion_bonus'::public.reward_claim_kind;

commit;
