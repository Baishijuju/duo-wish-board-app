-- Baseline v2 phase 3: access helpers, RLS, and policy guardrails.
-- Aligns with currently active production policies.

begin;

-- ---------------------------------------------------------------------------
-- Core access helper functions
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_space_member(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members member
    where member.space_id = target_space_id
      and member.user_id = auth.uid()
  );
$$;

create or replace function public.is_space_owner(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_members member
    where member.space_id = target_space_id
      and member.user_id = auth.uid()
      and member.role = 'owner'
  );
$$;

create or replace function public.can_access_wish(target_wish_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.wishes wish
    where wish.id = target_wish_id
      and public.is_space_member(wish.space_id)
      and (wish.scope = 'shared'::public.wish_scope or wish.owner_id = auth.uid())
  );
$$;

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

create or replace function public.can_access_thread_reaction(target_space_id uuid, target_thread_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_space_member(target_space_id)
    and (
      exists (
        select 1
        from public.wish_threads thread
        where thread.id::text = target_thread_key
          and thread.space_id = target_space_id
          and (thread.wish_id is null or public.can_access_wish(thread.wish_id))
      )
      or target_thread_key like 'thread-%'
    );
$$;

-- ---------------------------------------------------------------------------
-- RLS enable
-- ---------------------------------------------------------------------------
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_email_bindings enable row level security;
alter table public.wishes enable row level security;
alter table public.wish_steps enable row level security;
alter table public.wish_comments enable row level security;
alter table public.wish_images enable row level security;
alter table public.wish_comment_images enable row level security;
alter table public.reward_pool_items enable row level security;
alter table public.reward_claims enable row level security;
alter table public.wish_threads enable row level security;
alter table public.wish_thread_images enable row level security;
alter table public.thread_reactions enable row level security;
alter table public.monthly_journal_snapshots enable row level security;
alter table public.wish_count_progress_daily enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- spaces
 drop policy if exists "spaces_select_member" on public.spaces;
create policy "spaces_select_member"
on public.spaces
for select
to authenticated
using (is_space_member(id));

 drop policy if exists "spaces_insert_authenticated" on public.spaces;
create policy "spaces_insert_authenticated"
on public.spaces
for insert
to authenticated
with check (created_by = auth.uid());

 drop policy if exists "spaces_update_owner" on public.spaces;
create policy "spaces_update_owner"
on public.spaces
for update
to authenticated
using (is_space_owner(id))
with check (is_space_owner(id));

-- space_members
 drop policy if exists "space_members_select_member" on public.space_members;
create policy "space_members_select_member"
on public.space_members
for select
to authenticated
using (is_space_member(space_id));

 drop policy if exists "space_members_update_owner_or_self" on public.space_members;
create policy "space_members_update_owner_or_self"
on public.space_members
for update
to authenticated
using (is_space_owner(space_id) or user_id = auth.uid())
with check (is_space_owner(space_id) or user_id = auth.uid());

 drop policy if exists "space_members_delete_owner_or_self" on public.space_members;
create policy "space_members_delete_owner_or_self"
on public.space_members
for delete
to authenticated
using (is_space_owner(space_id) or user_id = auth.uid());

-- space_email_bindings
 drop policy if exists "space_email_bindings_select_owner" on public.space_email_bindings;
create policy "space_email_bindings_select_owner"
on public.space_email_bindings
for select
to authenticated
using (is_space_owner(space_id));

 drop policy if exists "space_email_bindings_insert_owner" on public.space_email_bindings;
create policy "space_email_bindings_insert_owner"
on public.space_email_bindings
for insert
to authenticated
with check (is_space_owner(space_id));

 drop policy if exists "space_email_bindings_update_owner" on public.space_email_bindings;
create policy "space_email_bindings_update_owner"
on public.space_email_bindings
for update
to authenticated
using (is_space_owner(space_id))
with check (is_space_owner(space_id));

 drop policy if exists "space_email_bindings_delete_owner" on public.space_email_bindings;
create policy "space_email_bindings_delete_owner"
on public.space_email_bindings
for delete
to authenticated
using (is_space_owner(space_id));

-- wishes
 drop policy if exists "wishes_select_member_visible_scope" on public.wishes;
create policy "wishes_select_member_visible_scope"
on public.wishes
for select
to authenticated
using (is_space_member(space_id) and (scope = 'shared'::wish_scope or owner_id = auth.uid()));

 drop policy if exists "wishes_insert_member_as_owner" on public.wishes;
create policy "wishes_insert_member_as_owner"
on public.wishes
for insert
to authenticated
with check (is_space_member(space_id) and owner_id = auth.uid());

 drop policy if exists "wishes_update_member_visible_scope" on public.wishes;
create policy "wishes_update_member_visible_scope"
on public.wishes
for update
to authenticated
using (is_space_member(space_id) and (scope = 'shared'::wish_scope or owner_id = auth.uid()))
with check (is_space_member(space_id) and (scope = 'shared'::wish_scope or owner_id = auth.uid()));

 drop policy if exists "wishes_delete_member_visible_scope" on public.wishes;
create policy "wishes_delete_member_visible_scope"
on public.wishes
for delete
to authenticated
using (is_space_member(space_id) and (scope = 'shared'::wish_scope or owner_id = auth.uid()));

-- wish_steps
 drop policy if exists "wish_steps_select_visible_wish" on public.wish_steps;
create policy "wish_steps_select_visible_wish"
on public.wish_steps
for select
to authenticated
using (can_access_wish(wish_id));

 drop policy if exists "wish_steps_insert_visible_wish" on public.wish_steps;
create policy "wish_steps_insert_visible_wish"
on public.wish_steps
for insert
to authenticated
with check (can_access_wish(wish_id));

 drop policy if exists "wish_steps_update_visible_wish" on public.wish_steps;
create policy "wish_steps_update_visible_wish"
on public.wish_steps
for update
to authenticated
using (can_access_wish(wish_id))
with check (can_access_wish(wish_id));

 drop policy if exists "wish_steps_delete_visible_wish" on public.wish_steps;
create policy "wish_steps_delete_visible_wish"
on public.wish_steps
for delete
to authenticated
using (can_access_wish(wish_id));

-- wish_comments
 drop policy if exists "wish_comments_select_visible_wish" on public.wish_comments;
create policy "wish_comments_select_visible_wish"
on public.wish_comments
for select
to authenticated
using (can_access_wish(wish_id));

 drop policy if exists "wish_comments_insert_visible_wish" on public.wish_comments;
create policy "wish_comments_insert_visible_wish"
on public.wish_comments
for insert
to authenticated
with check (author_id = auth.uid() and can_access_wish(wish_id));

 drop policy if exists "wish_comments_update_author_only" on public.wish_comments;
create policy "wish_comments_update_author_only"
on public.wish_comments
for update
to authenticated
using (author_id = auth.uid())
with check (author_id = auth.uid());

 drop policy if exists "wish_comments_delete_author_only" on public.wish_comments;
create policy "wish_comments_delete_author_only"
on public.wish_comments
for delete
to authenticated
using (author_id = auth.uid());

-- wish_images
 drop policy if exists "wish_images_select_visible_wish" on public.wish_images;
create policy "wish_images_select_visible_wish"
on public.wish_images
for select
to authenticated
using (can_access_wish(wish_id));

 drop policy if exists "wish_images_insert_visible_wish" on public.wish_images;
create policy "wish_images_insert_visible_wish"
on public.wish_images
for insert
to authenticated
with check (created_by = auth.uid() and can_access_wish(wish_id));

 drop policy if exists "wish_images_delete_creator_only" on public.wish_images;
create policy "wish_images_delete_creator_only"
on public.wish_images
for delete
to authenticated
using (created_by = auth.uid());

-- wish_comment_images
 drop policy if exists "wish_comment_images_select_visible_comment" on public.wish_comment_images;
create policy "wish_comment_images_select_visible_comment"
on public.wish_comment_images
for select
to authenticated
using (
  exists (
    select 1
    from public.wish_comments comment
    where comment.id = wish_comment_images.comment_id
      and can_access_wish(comment.wish_id)
  )
);

 drop policy if exists "wish_comment_images_insert_visible_comment" on public.wish_comment_images;
create policy "wish_comment_images_insert_visible_comment"
on public.wish_comment_images
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.wish_comments comment
    where comment.id = wish_comment_images.comment_id
      and can_access_wish(comment.wish_id)
  )
);

 drop policy if exists "wish_comment_images_delete_creator_only" on public.wish_comment_images;
create policy "wish_comment_images_delete_creator_only"
on public.wish_comment_images
for delete
to authenticated
using (created_by = auth.uid());

-- reward_pool_items
 drop policy if exists "reward_pool_items_select_member" on public.reward_pool_items;
create policy "reward_pool_items_select_member"
on public.reward_pool_items
for select
to authenticated
using (is_space_member(space_id));

 drop policy if exists "reward_pool_items_insert_owner" on public.reward_pool_items;
create policy "reward_pool_items_insert_owner"
on public.reward_pool_items
for insert
to authenticated
with check (is_space_member(space_id) and owner_id = auth.uid());

 drop policy if exists "reward_pool_items_update_owner" on public.reward_pool_items;
create policy "reward_pool_items_update_owner"
on public.reward_pool_items
for update
to authenticated
using (is_space_member(space_id) and owner_id = auth.uid())
with check (is_space_member(space_id) and owner_id = auth.uid());

 drop policy if exists "reward_pool_items_delete_owner" on public.reward_pool_items;
create policy "reward_pool_items_delete_owner"
on public.reward_pool_items
for delete
to authenticated
using (is_space_member(space_id) and owner_id = auth.uid());

-- reward_claims
 drop policy if exists "reward_claims_select_member" on public.reward_claims;
create policy "reward_claims_select_member"
on public.reward_claims
for select
to authenticated
using (is_space_member(space_id));

-- wish_threads
 drop policy if exists "wish_threads_select_visible" on public.wish_threads;
create policy "wish_threads_select_visible"
on public.wish_threads
for select
to authenticated
using (can_access_thread(id));

 drop policy if exists "wish_threads_insert_comment_self" on public.wish_threads;
create policy "wish_threads_insert_comment_self"
on public.wish_threads
for insert
to authenticated
with check (
  event_kind = 'comment'::wish_thread_event_kind
  and actor_id = auth.uid()
  and is_space_member(space_id)
  and wish_id is not null
  and can_access_wish(wish_id)
);

 drop policy if exists "wish_threads_update_comment_self" on public.wish_threads;
create policy "wish_threads_update_comment_self"
on public.wish_threads
for update
to authenticated
using (
  event_kind = 'comment'::wish_thread_event_kind
  and actor_id = auth.uid()
  and can_access_thread(id)
)
with check (
  event_kind = 'comment'::wish_thread_event_kind
  and actor_id = auth.uid()
  and can_access_thread(id)
);

 drop policy if exists "wish_threads_delete_comment_self" on public.wish_threads;
create policy "wish_threads_delete_comment_self"
on public.wish_threads
for delete
to authenticated
using (
  event_kind = 'comment'::wish_thread_event_kind
  and actor_id = auth.uid()
  and can_access_thread(id)
);

-- wish_thread_images
 drop policy if exists "wish_thread_images_select_visible" on public.wish_thread_images;
create policy "wish_thread_images_select_visible"
on public.wish_thread_images
for select
to authenticated
using (can_access_thread(thread_id));

 drop policy if exists "wish_thread_images_insert_comment_owner" on public.wish_thread_images;
create policy "wish_thread_images_insert_comment_owner"
on public.wish_thread_images
for insert
to authenticated
with check (
  created_by = auth.uid()
  and can_access_thread(thread_id)
  and exists (
    select 1
    from public.wish_threads thread
    where thread.id = wish_thread_images.thread_id
      and thread.event_kind = 'comment'::wish_thread_event_kind
      and thread.actor_id = auth.uid()
  )
);

 drop policy if exists "wish_thread_images_update_comment_owner" on public.wish_thread_images;
create policy "wish_thread_images_update_comment_owner"
on public.wish_thread_images
for update
to authenticated
using (created_by = auth.uid() and can_access_thread(thread_id))
with check (created_by = auth.uid() and can_access_thread(thread_id));

 drop policy if exists "wish_thread_images_delete_comment_owner" on public.wish_thread_images;
create policy "wish_thread_images_delete_comment_owner"
on public.wish_thread_images
for delete
to authenticated
using (created_by = auth.uid() and can_access_thread(thread_id));

-- thread_reactions
 drop policy if exists "thread_reactions_select_visible" on public.thread_reactions;
create policy "thread_reactions_select_visible"
on public.thread_reactions
for select
to authenticated
using (can_access_thread_reaction(space_id, target_thread_id));

 drop policy if exists "thread_reactions_insert_self" on public.thread_reactions;
create policy "thread_reactions_insert_self"
on public.thread_reactions
for insert
to authenticated
with check (actor_id = auth.uid() and can_access_thread_reaction(space_id, target_thread_id));

 drop policy if exists "thread_reactions_delete_self" on public.thread_reactions;
create policy "thread_reactions_delete_self"
on public.thread_reactions
for delete
to authenticated
using (actor_id = auth.uid() and can_access_thread_reaction(space_id, target_thread_id));

-- monthly_journal_snapshots
 drop policy if exists "monthly_journal_snapshots_select_member" on public.monthly_journal_snapshots;
create policy "monthly_journal_snapshots_select_member"
on public.monthly_journal_snapshots
for select
to authenticated
using (is_space_member(space_id));

-- wish_count_progress_daily
 drop policy if exists "wish_count_progress_daily_select_member" on public.wish_count_progress_daily;
create policy "wish_count_progress_daily_select_member"
on public.wish_count_progress_daily
for select
to authenticated
using (is_space_member(space_id));

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update on table public.spaces to authenticated;
grant select, update, delete on table public.space_members to authenticated;
grant select, insert, update, delete on table public.space_email_bindings to authenticated;
grant select, insert, update, delete on table public.wishes to authenticated;
grant select, insert, update, delete on table public.wish_steps to authenticated;
grant select, insert, update, delete on table public.wish_comments to authenticated;
grant select, insert, delete on table public.wish_images to authenticated;
grant select, insert, delete on table public.wish_comment_images to authenticated;
grant select, insert, update, delete on table public.reward_pool_items to authenticated;
grant select on table public.reward_claims to authenticated;
grant select, insert, update, delete on table public.wish_threads to authenticated;
grant select, insert, update, delete on table public.wish_thread_images to authenticated;
grant select, insert, delete on table public.thread_reactions to authenticated;
grant select on table public.monthly_journal_snapshots to authenticated;
grant select on table public.wish_count_progress_daily to authenticated;

commit;
