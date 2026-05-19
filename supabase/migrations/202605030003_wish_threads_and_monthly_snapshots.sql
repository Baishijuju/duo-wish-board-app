do $$
begin
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

create table if not exists public.wish_threads (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  wish_id uuid references public.wishes (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
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
  thread_id uuid not null references public.wish_threads (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0),
  sort_order integer not null default 1,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.thread_reactions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  target_thread_id uuid not null references public.wish_threads (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  emoji text not null check (char_length(trim(emoji)) between 1 and 16),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.monthly_journal_snapshots (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  snapshot_status public.monthly_journal_snapshot_status not null default 'ready',
  cover_title text not null check (char_length(trim(cover_title)) between 1 and 120),
  cover_subtitle text not null default '',
  narrative_blocks jsonb not null default '[]'::jsonb,
  metrics_snapshot jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_wish_threads_space_created
on public.wish_threads (space_id, created_at desc);

create index if not exists idx_wish_threads_wish_created
on public.wish_threads (wish_id, created_at asc);

create index if not exists idx_wish_threads_event_created
on public.wish_threads (event_kind, created_at desc);

create index if not exists idx_wish_thread_images_thread_order
on public.wish_thread_images (thread_id, sort_order, created_at);

create unique index if not exists idx_thread_reactions_unique
on public.thread_reactions (space_id, target_thread_id, actor_id, emoji);

create index if not exists idx_thread_reactions_thread_created
on public.thread_reactions (target_thread_id, created_at desc);

create unique index if not exists idx_monthly_journal_snapshots_space_month
on public.monthly_journal_snapshots (space_id, month_key);

drop trigger if exists trg_wish_threads_updated_at on public.wish_threads;
create trigger trg_wish_threads_updated_at
before update on public.wish_threads
for each row
execute function public.set_updated_at();

alter table public.wish_threads enable row level security;
alter table public.wish_thread_images enable row level security;
alter table public.thread_reactions enable row level security;
alter table public.monthly_journal_snapshots enable row level security;

create or replace function public.get_space_member_display_name(target_space_id uuid, target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select member.display_name
      from public.space_members member
      where member.space_id = target_space_id
        and member.user_id = target_user_id
      limit 1
    ),
    '未命名成员'
  );
$$;

create or replace function public.get_month_key_for_timestamp(timestamp_value timestamptz)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select to_char(timezone('Asia/Shanghai', timestamp_value), 'YYYY-MM');
$$;

create or replace function public.can_access_thread(target_thread_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wish_threads thread
    where thread.id = target_thread_id
      and public.is_space_member(thread.space_id)
      and (thread.wish_id is null or public.can_access_wish(thread.wish_id))
  );
$$;

create or replace function public.upsert_wish_thread(
  entry_id uuid,
  entry_space_id uuid,
  entry_wish_id uuid,
  entry_actor_id uuid,
  entry_event_kind public.wish_thread_event_kind,
  entry_message_text text,
  entry_meta jsonb default '{}'::jsonb,
  entry_source_table text default null,
  entry_source_id uuid default null,
  entry_dedupe_key text default null,
  entry_created_at timestamptz default timezone('utc', now()),
  entry_updated_at timestamptz default timezone('utc', now())
)
returns public.wish_threads
language plpgsql
security definer
set search_path = public
as $$
declare
  upserted_thread public.wish_threads;
begin
  insert into public.wish_threads (
    id,
    space_id,
    wish_id,
    actor_id,
    event_kind,
    message_text,
    meta,
    source_table,
    source_id,
    dedupe_key,
    created_at,
    updated_at
  )
  values (
    coalesce(entry_id, gen_random_uuid()),
    entry_space_id,
    entry_wish_id,
    entry_actor_id,
    entry_event_kind,
    entry_message_text,
    coalesce(entry_meta, '{}'::jsonb),
    entry_source_table,
    entry_source_id,
    entry_dedupe_key,
    entry_created_at,
    entry_updated_at
  )
  on conflict (dedupe_key)
  do update set
    space_id = excluded.space_id,
    wish_id = excluded.wish_id,
    actor_id = excluded.actor_id,
    event_kind = excluded.event_kind,
    message_text = excluded.message_text,
    meta = excluded.meta,
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    created_at = excluded.created_at,
    updated_at = excluded.updated_at
  returning * into upserted_thread;

  return upserted_thread;
end;
$$;

drop policy if exists "wish_threads_select_visible" on public.wish_threads;
create policy "wish_threads_select_visible"
on public.wish_threads
for select
to authenticated
using (public.can_access_thread(id));

drop policy if exists "wish_threads_insert_comment_self" on public.wish_threads;
create policy "wish_threads_insert_comment_self"
on public.wish_threads
for insert
to authenticated
with check (
  event_kind = 'comment'
  and actor_id = auth.uid()
  and public.is_space_member(space_id)
  and wish_id is not null
  and public.can_access_wish(wish_id)
);

drop policy if exists "wish_threads_update_comment_self" on public.wish_threads;
create policy "wish_threads_update_comment_self"
on public.wish_threads
for update
to authenticated
using (
  event_kind = 'comment'
  and actor_id = auth.uid()
  and public.can_access_thread(id)
)
with check (
  event_kind = 'comment'
  and actor_id = auth.uid()
  and public.can_access_thread(id)
);

drop policy if exists "wish_threads_delete_comment_self" on public.wish_threads;
create policy "wish_threads_delete_comment_self"
on public.wish_threads
for delete
to authenticated
using (
  event_kind = 'comment'
  and actor_id = auth.uid()
  and public.can_access_thread(id)
);

drop policy if exists "wish_thread_images_select_visible" on public.wish_thread_images;
create policy "wish_thread_images_select_visible"
on public.wish_thread_images
for select
to authenticated
using (public.can_access_thread(thread_id));

drop policy if exists "wish_thread_images_insert_comment_owner" on public.wish_thread_images;
create policy "wish_thread_images_insert_comment_owner"
on public.wish_thread_images
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.can_access_thread(thread_id)
  and exists (
    select 1
    from public.wish_threads thread
    where thread.id = thread_id
      and thread.event_kind = 'comment'
      and thread.actor_id = auth.uid()
  )
);

drop policy if exists "wish_thread_images_update_comment_owner" on public.wish_thread_images;
create policy "wish_thread_images_update_comment_owner"
on public.wish_thread_images
for update
to authenticated
using (
  created_by = auth.uid()
  and public.can_access_thread(thread_id)
)
with check (
  created_by = auth.uid()
  and public.can_access_thread(thread_id)
);

drop policy if exists "wish_thread_images_delete_comment_owner" on public.wish_thread_images;
create policy "wish_thread_images_delete_comment_owner"
on public.wish_thread_images
for delete
to authenticated
using (
  created_by = auth.uid()
  and public.can_access_thread(thread_id)
);

drop policy if exists "thread_reactions_select_visible" on public.thread_reactions;
create policy "thread_reactions_select_visible"
on public.thread_reactions
for select
to authenticated
using (public.can_access_thread(target_thread_id));

drop policy if exists "thread_reactions_insert_self" on public.thread_reactions;
create policy "thread_reactions_insert_self"
on public.thread_reactions
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.can_access_thread(target_thread_id)
  and public.is_space_member(space_id)
);

drop policy if exists "thread_reactions_delete_self" on public.thread_reactions;
create policy "thread_reactions_delete_self"
on public.thread_reactions
for delete
to authenticated
using (
  actor_id = auth.uid()
  and public.can_access_thread(target_thread_id)
);

drop policy if exists "monthly_journal_snapshots_select_member" on public.monthly_journal_snapshots;
create policy "monthly_journal_snapshots_select_member"
on public.monthly_journal_snapshots
for select
to authenticated
using (public.is_space_member(space_id));

grant select, insert, update, delete on table public.wish_threads to authenticated;
grant select, insert, update, delete on table public.wish_thread_images to authenticated;
grant select, insert, delete on table public.thread_reactions to authenticated;
grant select on table public.monthly_journal_snapshots to authenticated;

create or replace function public.sync_wish_comment_to_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
begin
  if tg_op = 'DELETE' then
    delete from public.wish_threads
    where dedupe_key = 'wish_comments:' || old.id::text;

    return old;
  end if;

  select *
  into target_wish
  from public.wishes wish
  where wish.id = new.wish_id;

  if target_wish.id is null then
    return new;
  end if;

  perform public.upsert_wish_thread(
    new.id,
    target_wish.space_id,
    new.wish_id,
    new.author_id,
    'comment',
    new.body,
    '{}'::jsonb,
    'wish_comments',
    new.id,
    'wish_comments:' || new.id::text,
    new.created_at,
    timezone('utc', now())
  );

  return new;
end;
$$;

drop trigger if exists trg_wish_comments_sync_thread on public.wish_comments;
create trigger trg_wish_comments_sync_thread
after insert or update or delete on public.wish_comments
for each row
execute function public.sync_wish_comment_to_thread();

create or replace function public.sync_wish_comment_image_to_thread_image()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.wish_thread_images
    where id = old.id;

    return old;
  end if;

  insert into public.wish_thread_images (
    id,
    thread_id,
    created_by,
    storage_path,
    file_name,
    mime_type,
    size_bytes,
    sort_order,
    created_at
  )
  values (
    new.id,
    new.comment_id,
    new.created_by,
    new.storage_path,
    new.file_name,
    new.mime_type,
    new.size_bytes,
    new.sort_order,
    new.created_at
  )
  on conflict (id)
  do update set
    thread_id = excluded.thread_id,
    created_by = excluded.created_by,
    storage_path = excluded.storage_path,
    file_name = excluded.file_name,
    mime_type = excluded.mime_type,
    size_bytes = excluded.size_bytes,
    sort_order = excluded.sort_order,
    created_at = excluded.created_at;

  return new;
end;
$$;

drop trigger if exists trg_wish_comment_images_sync_thread_images on public.wish_comment_images;
create trigger trg_wish_comment_images_sync_thread_images
after insert or update or delete on public.wish_comment_images
for each row
execute function public.sync_wish_comment_image_to_thread_image();

create or replace function public.sync_wish_publish_to_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
begin
  actor_name := public.get_space_member_display_name(new.space_id, new.owner_id);

  perform public.upsert_wish_thread(
    null,
    new.space_id,
    new.id,
    new.owner_id,
    'wish_published',
    actor_name || ' 写下了新的愿望「' || new.title || '」。',
    jsonb_build_object(
      'priority', new.priority,
      'scope', new.scope,
      'status', new.status
    ),
    'wishes',
    new.id,
    'wish_published:' || new.id::text,
    new.created_at,
    new.created_at
  );

  return new;
end;
$$;

drop trigger if exists trg_wishes_publish_thread on public.wishes;
create trigger trg_wishes_publish_thread
after insert on public.wishes
for each row
execute function public.sync_wish_publish_to_thread();

create or replace function public.sync_wish_completion_to_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  completion_actor_id uuid;
begin
  if new.status <> 'done' or old.status = 'done' then
    return new;
  end if;

  completion_actor_id := coalesce(auth.uid(), new.owner_id);
  actor_name := public.get_space_member_display_name(new.space_id, completion_actor_id);

  perform public.upsert_wish_thread(
    null,
    new.space_id,
    new.id,
    completion_actor_id,
    'wish_completed',
    actor_name || ' 把「' || new.title || '」收进了回忆里。',
    jsonb_build_object(
      'completedAt', new.completed_at,
      'status', new.status
    ),
    'wishes',
    new.id,
    'wish_completed:' || new.id::text,
    coalesce(new.completed_at, timezone('utc', now())),
    timezone('utc', now())
  );

  return new;
end;
$$;

drop trigger if exists trg_wishes_completed_thread on public.wishes;
create trigger trg_wishes_completed_thread
after update of status, completed_at on public.wishes
for each row
execute function public.sync_wish_completion_to_thread();

create or replace function public.sync_wish_step_completion_to_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  completion_actor_id uuid;
  actor_name text;
begin
  if new.is_done is not true or old.is_done is true then
    return new;
  end if;

  select *
  into target_wish
  from public.wishes wish
  where wish.id = new.wish_id;

  if target_wish.id is null then
    return new;
  end if;

  completion_actor_id := coalesce(auth.uid(), target_wish.owner_id);
  actor_name := public.get_space_member_display_name(target_wish.space_id, completion_actor_id);

  perform public.upsert_wish_thread(
    null,
    target_wish.space_id,
    new.wish_id,
    completion_actor_id,
    'wish_step_completed',
    actor_name || ' 完成了小步骤「' || new.title || '」。',
    jsonb_build_object(
      'stepId', new.id,
      'stepTitle', new.title,
      'wishTitle', target_wish.title
    ),
    'wish_steps',
    new.id,
    'wish_step_completed:' || new.id::text,
    coalesce(new.updated_at, timezone('utc', now())),
    timezone('utc', now())
  );

  return new;
end;
$$;

drop trigger if exists trg_wish_steps_completed_thread on public.wish_steps;
create trigger trg_wish_steps_completed_thread
after update of is_done on public.wish_steps
for each row
execute function public.sync_wish_step_completion_to_thread();

create or replace function public.sync_wish_coin_to_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  actor_name text;
  total_coin_count integer;
begin
  select *
  into target_wish
  from public.wishes wish
  where wish.id = new.wish_id;

  if target_wish.id is null then
    return new;
  end if;

  actor_name := public.get_space_member_display_name(target_wish.space_id, new.voter_id);

  perform public.upsert_wish_thread(
    null,
    target_wish.space_id,
    target_wish.id,
    new.voter_id,
    'wish_coin_cast',
    actor_name || ' 给「' || target_wish.title || '」投下了 1 枚愿望币。',
    jsonb_build_object(
      'amount', new.amount,
      'cycleKey', new.cycle_key,
      'wishTitle', target_wish.title
    ),
    'wish_coins',
    new.id,
    'wish_coin_cast:' || new.id::text,
    new.created_at,
    new.created_at
  );

  select coalesce(sum(coin.amount), 0)
  into total_coin_count
  from public.wish_coins coin
  where coin.wish_id = new.wish_id;

  if total_coin_count >= 7 then
    perform public.upsert_wish_thread(
      null,
      target_wish.space_id,
      target_wish.id,
      new.voter_id,
      'dragon_ball_reached',
      '「' || target_wish.title || '」集齐了七龙珠，神龙开始认真听见这份心愿。',
      jsonb_build_object(
        'wishTitle', target_wish.title,
        'totalCoins', total_coin_count,
        'cycleKey', new.cycle_key
      ),
      'wish_coins',
      new.id,
      'dragon_ball_reached:' || target_wish.id::text,
      new.created_at,
      new.created_at
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_wish_coins_thread on public.wish_coins;
create trigger trg_wish_coins_thread
after insert on public.wish_coins
for each row
execute function public.sync_wish_coin_to_thread();

create or replace function public.sync_reward_claim_to_thread()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_wish public.wishes;
  target_step public.wish_steps;
  actor_name text;
  target_event_kind public.wish_thread_event_kind;
  thread_message text;
  target_wish_id uuid;
begin
  if new.source_wish_id is not null then
    select *
    into target_wish
    from public.wishes wish
    where wish.id = new.source_wish_id;
  end if;

  if new.source_step_id is not null then
    select *
    into target_step
    from public.wish_steps step
    where step.id = new.source_step_id;
  end if;

  actor_name := public.get_space_member_display_name(new.space_id, new.owner_id);
  target_event_kind := case
    when new.claim_kind = 'premium_redeem' then 'premium_redeem'::public.wish_thread_event_kind
    else 'reward_claimed'::public.wish_thread_event_kind
  end;
  target_wish_id := coalesce(new.source_wish_id, null);

  thread_message := case new.claim_kind
    when 'step_reward' then actor_name || ' 完成了小步骤「' || coalesce(target_step.title, '这个小步骤') || '」，并领取了「' || new.title_snapshot || '」。'
    when 'wish_reward' then actor_name || ' 完成了「' || coalesce(target_wish.title, new.title_snapshot) || '」，并领取了「' || new.title_snapshot || '」。'
    when 'star_coin' then actor_name || ' 完成了小步骤「' || coalesce(target_step.title, '这个小步骤') || '」，把这次奖励存成了 ' || abs(new.star_coin_delta)::text || ' 枚星星币。'
    else actor_name || ' 用 ' || abs(new.star_coin_delta)::text || ' 枚星星币兑换了「' || new.title_snapshot || '」。'
  end;

  perform public.upsert_wish_thread(
    null,
    new.space_id,
    target_wish_id,
    new.owner_id,
    target_event_kind,
    thread_message,
    jsonb_build_object(
      'claimKind', new.claim_kind,
      'rewardItemId', new.reward_item_id,
      'sourceWishId', new.source_wish_id,
      'sourceStepId', new.source_step_id,
      'starCoinDelta', new.star_coin_delta,
      'titleSnapshot', new.title_snapshot,
      'noteSnapshot', new.note_snapshot,
      'wishTitle', coalesce(target_wish.title, null),
      'stepTitle', coalesce(target_step.title, null)
    ),
    'reward_claims',
    new.id,
    'reward_claim:' || new.id::text,
    new.created_at,
    new.created_at
  );

  return new;
end;
$$;

drop trigger if exists trg_reward_claims_thread on public.reward_claims;
create trigger trg_reward_claims_thread
after insert on public.reward_claims
for each row
execute function public.sync_reward_claim_to_thread();

insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  comment.id,
  wish.space_id,
  comment.wish_id,
  comment.author_id,
  'comment'::public.wish_thread_event_kind,
  comment.body,
  '{}'::jsonb,
  'wish_comments',
  comment.id,
  'wish_comments:' || comment.id::text,
  comment.created_at,
  comment.created_at
from public.wish_comments comment
join public.wishes wish
  on wish.id = comment.wish_id
on conflict (id) do nothing;

insert into public.wish_thread_images (
  id,
  thread_id,
  created_by,
  storage_path,
  file_name,
  mime_type,
  size_bytes,
  sort_order,
  created_at
)
select
  image.id,
  image.comment_id,
  image.created_by,
  image.storage_path,
  image.file_name,
  image.mime_type,
  image.size_bytes,
  image.sort_order,
  image.created_at
from public.wish_comment_images image
on conflict (id) do nothing;

insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  wish.space_id,
  wish.id,
  wish.owner_id,
  'wish_published'::public.wish_thread_event_kind,
  public.get_space_member_display_name(wish.space_id, wish.owner_id) || ' 写下了新的愿望「' || wish.title || '」。',
  jsonb_build_object(
    'priority', wish.priority,
    'scope', wish.scope,
    'status', wish.status
  ),
  'wishes',
  wish.id,
  'wish_published:' || wish.id::text,
  wish.created_at,
  wish.created_at
from public.wishes wish
on conflict (dedupe_key) do nothing;

insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  wish.space_id,
  wish.id,
  wish.owner_id,
  'wish_completed'::public.wish_thread_event_kind,
  public.get_space_member_display_name(wish.space_id, wish.owner_id) || ' 把「' || wish.title || '」收进了回忆里。',
  jsonb_build_object(
    'completedAt', wish.completed_at,
    'status', wish.status
  ),
  'wishes',
  wish.id,
  'wish_completed:' || wish.id::text,
  coalesce(wish.completed_at, wish.updated_at),
  coalesce(wish.completed_at, wish.updated_at)
from public.wishes wish
where wish.status = 'done'
on conflict (dedupe_key) do nothing;

insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  wish.space_id,
  step.wish_id,
  wish.owner_id,
  'wish_step_completed'::public.wish_thread_event_kind,
  public.get_space_member_display_name(wish.space_id, wish.owner_id) || ' 完成了小步骤「' || step.title || '」。',
  jsonb_build_object(
    'stepId', step.id,
    'stepTitle', step.title,
    'wishTitle', wish.title
  ),
  'wish_steps',
  step.id,
  'wish_step_completed:' || step.id::text,
  step.updated_at,
  step.updated_at
from public.wish_steps step
join public.wishes wish
  on wish.id = step.wish_id
where step.is_done = true
on conflict (dedupe_key) do nothing;

insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  coin.space_id,
  coin.wish_id,
  coin.voter_id,
  'wish_coin_cast'::public.wish_thread_event_kind,
  public.get_space_member_display_name(coin.space_id, coin.voter_id) || ' 给「' || wish.title || '」投下了 1 枚愿望币。',
  jsonb_build_object(
    'amount', coin.amount,
    'cycleKey', coin.cycle_key,
    'wishTitle', wish.title
  ),
  'wish_coins',
  coin.id,
  'wish_coin_cast:' || coin.id::text,
  coin.created_at,
  coin.created_at
from public.wish_coins coin
join public.wishes wish
  on wish.id = coin.wish_id
on conflict (dedupe_key) do nothing;

with coin_progress as (
  select
    coin.id,
    coin.space_id,
    coin.wish_id,
    coin.voter_id,
    coin.cycle_key,
    coin.created_at,
    sum(coin.amount) over (partition by coin.wish_id order by coin.created_at asc, coin.id asc) as total_coin_count
  from public.wish_coins coin
),
first_dragon_coin as (
  select distinct on (progress.wish_id)
    progress.*
  from coin_progress progress
  where progress.total_coin_count >= 7
  order by progress.wish_id, progress.created_at asc, progress.id asc
)
insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  dragon.space_id,
  dragon.wish_id,
  dragon.voter_id,
  'dragon_ball_reached'::public.wish_thread_event_kind,
  '「' || wish.title || '」集齐了七龙珠，神龙开始认真听见这份心愿。',
  jsonb_build_object(
    'cycleKey', dragon.cycle_key,
    'totalCoins', dragon.total_coin_count,
    'wishTitle', wish.title
  ),
  'wish_coins',
  dragon.id,
  'dragon_ball_reached:' || dragon.wish_id::text,
  dragon.created_at,
  dragon.created_at
from first_dragon_coin dragon
join public.wishes wish
  on wish.id = dragon.wish_id
on conflict (dedupe_key) do nothing;

insert into public.wish_threads (
  id,
  space_id,
  wish_id,
  actor_id,
  event_kind,
  message_text,
  meta,
  source_table,
  source_id,
  dedupe_key,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  claim.space_id,
  claim.source_wish_id,
  claim.owner_id,
  case
    when claim.claim_kind = 'premium_redeem' then 'premium_redeem'::public.wish_thread_event_kind
    else 'reward_claimed'::public.wish_thread_event_kind
  end,
  case claim.claim_kind
    when 'step_reward' then public.get_space_member_display_name(claim.space_id, claim.owner_id) || ' 完成了小步骤「' || coalesce(step.title, '这个小步骤') || '」，并领取了「' || claim.title_snapshot || '」。'
    when 'wish_reward' then public.get_space_member_display_name(claim.space_id, claim.owner_id) || ' 完成了「' || coalesce(wish.title, claim.title_snapshot) || '」，并领取了「' || claim.title_snapshot || '」。'
    when 'star_coin' then public.get_space_member_display_name(claim.space_id, claim.owner_id) || ' 完成了小步骤「' || coalesce(step.title, '这个小步骤') || '」，把这次奖励存成了 ' || abs(claim.star_coin_delta)::text || ' 枚星星币。'
    else public.get_space_member_display_name(claim.space_id, claim.owner_id) || ' 用 ' || abs(claim.star_coin_delta)::text || ' 枚星星币兑换了「' || claim.title_snapshot || '」。'
  end,
  jsonb_build_object(
    'claimKind', claim.claim_kind,
    'rewardItemId', claim.reward_item_id,
    'sourceWishId', claim.source_wish_id,
    'sourceStepId', claim.source_step_id,
    'starCoinDelta', claim.star_coin_delta,
    'titleSnapshot', claim.title_snapshot,
    'noteSnapshot', claim.note_snapshot,
    'wishTitle', coalesce(wish.title, null),
    'stepTitle', coalesce(step.title, null)
  ),
  'reward_claims',
  claim.id,
  'reward_claim:' || claim.id::text,
  claim.created_at,
  claim.created_at
from public.reward_claims claim
left join public.wishes wish
  on wish.id = claim.source_wish_id
left join public.wish_steps step
  on step.id = claim.source_step_id
on conflict (dedupe_key) do nothing;

create or replace function public.freeze_monthly_journal_snapshot(target_space_id uuid, target_month_key text)
returns public.monthly_journal_snapshots
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month_key text;
  existing_snapshot public.monthly_journal_snapshots;
  space_row public.spaces;
  snapshot_row public.monthly_journal_snapshots;
  cover_title_value text;
  cover_subtitle_value text;
  narrative_blocks_value jsonb;
  metrics_snapshot_value jsonb;
  source_refs_value jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_space_member(target_space_id) then
    raise exception '当前成员暂时不能冻结这个月刊';
  end if;

  if target_month_key !~ '^[0-9]{4}-[0-9]{2}$' then
    raise exception 'Invalid month key';
  end if;

  current_month_key := public.get_month_key_for_timestamp(timezone('utc', now()));

  if target_month_key >= current_month_key then
    raise exception '当前月份还不能冻结成月刊';
  end if;

  select *
  into existing_snapshot
  from public.monthly_journal_snapshots snapshot
  where snapshot.space_id = target_space_id
    and snapshot.month_key = target_month_key;

  if existing_snapshot.id is not null then
    return existing_snapshot;
  end if;

  select *
  into space_row
  from public.spaces space
  where space.id = target_space_id;

  if space_row.id is null then
    raise exception 'Space not found';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'threadId', thread.id,
        'wishId', thread.wish_id,
        'eventKind', thread.event_kind,
        'messageText', thread.message_text,
        'createdAt', thread.created_at,
        'updatedAt', thread.updated_at,
        'actorId', thread.actor_id,
        'actorName', case when thread.actor_id is null then '系统' else public.get_space_member_display_name(thread.space_id, thread.actor_id) end,
        'meta', thread.meta,
        'images', coalesce(images.image_list, '[]'::jsonb),
        'reactions', coalesce(reactions.reaction_list, '[]'::jsonb)
      )
      order by thread.created_at asc, thread.id asc
    ),
    '[]'::jsonb
  )
  into narrative_blocks_value
  from public.wish_threads thread
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', image.id,
        'storagePath', image.storage_path,
        'fileName', image.file_name,
        'mimeType', image.mime_type,
        'sizeBytes', image.size_bytes,
        'sortOrder', image.sort_order,
        'createdAt', image.created_at,
        'createdBy', image.created_by
      )
      order by image.sort_order asc, image.created_at asc
    ) as image_list
    from public.wish_thread_images image
    where image.thread_id = thread.id
  ) images on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'emoji', reaction.emoji,
        'count', reaction.count_value,
        'memberIds', reaction.member_ids
      )
      order by reaction.emoji asc
    ) as reaction_list
    from (
      select
        item.emoji,
        count(*) as count_value,
        jsonb_agg(item.actor_id order by item.created_at asc) as member_ids
      from public.thread_reactions item
      where item.target_thread_id = thread.id
      group by item.emoji
    ) reaction
  ) reactions on true
  where thread.space_id = target_space_id
    and public.get_month_key_for_timestamp(thread.created_at) = target_month_key;

  if jsonb_array_length(narrative_blocks_value) = 0 then
    raise exception '这个月份还没有可冻结的记录';
  end if;

  select jsonb_build_object(
    'threadCount', count(*),
    'commentCount', count(*) filter (where thread.event_kind = 'comment'),
    'coinEventCount', count(*) filter (where thread.event_kind = 'wish_coin_cast'),
    'rewardEventCount', count(*) filter (where thread.event_kind in ('reward_claimed', 'premium_redeem')),
    'completedWishCount', count(*) filter (where thread.event_kind = 'wish_completed'),
    'dragonBallCount', count(*) filter (where thread.event_kind = 'dragon_ball_reached'),
    'wishCount', count(distinct thread.wish_id),
    'reactionCount', coalesce((
      select count(*)
      from public.thread_reactions reaction
      join public.wish_threads source_thread
        on source_thread.id = reaction.target_thread_id
      where source_thread.space_id = target_space_id
        and public.get_month_key_for_timestamp(source_thread.created_at) = target_month_key
    ), 0)
  )
  into metrics_snapshot_value
  from public.wish_threads thread
  where thread.space_id = target_space_id
    and public.get_month_key_for_timestamp(thread.created_at) = target_month_key;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'threadId', thread.id,
        'wishId', thread.wish_id,
        'eventKind', thread.event_kind,
        'createdAt', thread.created_at,
        'sourceTable', thread.source_table,
        'sourceId', thread.source_id
      )
      order by thread.created_at asc, thread.id asc
    ),
    '[]'::jsonb
  )
  into source_refs_value
  from public.wish_threads thread
  where thread.space_id = target_space_id
    and public.get_month_key_for_timestamp(thread.created_at) = target_month_key;

  cover_title_value := to_char(to_date(target_month_key || '-01', 'YYYY-MM-DD'), 'YYYY"年"MM"月"') || ' 月刊';
  cover_subtitle_value := space_row.name || ' 的固定版本回顾';

  insert into public.monthly_journal_snapshots (
    space_id,
    month_key,
    snapshot_status,
    cover_title,
    cover_subtitle,
    narrative_blocks,
    metrics_snapshot,
    source_refs,
    created_at,
    created_by
  )
  values (
    target_space_id,
    target_month_key,
    'ready',
    cover_title_value,
    cover_subtitle_value,
    narrative_blocks_value,
    metrics_snapshot_value,
    source_refs_value,
    timezone('utc', now()),
    auth.uid()
  )
  returning * into snapshot_row;

  return snapshot_row;
end;
$$;

create or replace function public.ensure_monthly_journal_snapshots(target_space_id uuid)
returns setof public.monthly_journal_snapshots
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month_key text;
  pending_month record;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_space_member(target_space_id) then
    raise exception '当前成员暂时不能检查这个空间的月刊';
  end if;

  current_month_key := public.get_month_key_for_timestamp(timezone('utc', now()));

  for pending_month in
    select distinct public.get_month_key_for_timestamp(thread.created_at) as month_key
    from public.wish_threads thread
    where thread.space_id = target_space_id
      and public.get_month_key_for_timestamp(thread.created_at) < current_month_key
      and not exists (
        select 1
        from public.monthly_journal_snapshots snapshot
        where snapshot.space_id = target_space_id
          and snapshot.month_key = public.get_month_key_for_timestamp(thread.created_at)
      )
    order by month_key asc
  loop
    return next public.freeze_monthly_journal_snapshot(target_space_id, pending_month.month_key);
  end loop;

  return;
end;
$$;

grant execute on function public.freeze_monthly_journal_snapshot(uuid, text) to authenticated;
grant execute on function public.ensure_monthly_journal_snapshots(uuid) to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wish_threads'
  ) then
    alter publication supabase_realtime add table public.wish_threads;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'wish_thread_images'
  ) then
    alter publication supabase_realtime add table public.wish_thread_images;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'thread_reactions'
  ) then
    alter publication supabase_realtime add table public.thread_reactions;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'monthly_journal_snapshots'
  ) then
    alter publication supabase_realtime add table public.monthly_journal_snapshots;
  end if;
end
$$;