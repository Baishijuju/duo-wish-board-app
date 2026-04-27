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

  if not exists (select 1 from pg_type where typname = 'wish_priority') then
    create type public.wish_priority as enum ('high', 'medium', 'low');
  end if;
end
$$;

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

create table if not exists public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  invite_code text not null unique check (char_length(trim(invite_code)) between 6 and 32),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 50),
  role public.space_role not null default 'member',
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (space_id, user_id)
);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  category text not null default '',
  note text not null default '',
  priority public.wish_priority not null default 'medium',
  scope public.wish_scope not null default 'shared',
  status public.wish_status not null default 'active',
  is_starred boolean not null default false,
  due_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wish_comments (
  id uuid primary key default gen_random_uuid(),
  wish_id uuid not null references public.wishes (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_space_members_user on public.space_members (user_id);
create index if not exists idx_wishes_space on public.wishes (space_id);
create index if not exists idx_wishes_owner on public.wishes (owner_id);
create index if not exists idx_wishes_status_due on public.wishes (status, due_date);
create index if not exists idx_wish_comments_wish on public.wish_comments (wish_id, created_at desc);

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
      and (wish.scope = 'shared' or wish.owner_id = auth.uid())
  );
$$;

create or replace function public.ensure_space_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.space_members (space_id, user_id, display_name, role)
  values (new.id, new.created_by, '空间拥有者', 'owner')
  on conflict (space_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_spaces_owner_membership on public.spaces;
create trigger trg_spaces_owner_membership
after insert on public.spaces
for each row
execute function public.ensure_space_owner_membership();

create or replace function public.join_space_by_invite(invite_code_input text, display_name_input text default null)
returns public.space_members
language plpgsql
security definer
set search_path = public
as $$
declare
  target_space public.spaces;
  joined_member public.space_members;
  fallback_display_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into target_space
  from public.spaces
  where upper(invite_code) = upper(trim(invite_code_input));

  if target_space.id is null then
    raise exception 'Invalid invite code';
  end if;

  fallback_display_name := coalesce(nullif(trim(display_name_input), ''), split_part(coalesce(auth.jwt() ->> 'email', '成员'), '@', 1));

  insert into public.space_members (space_id, user_id, display_name, role)
  values (target_space.id, auth.uid(), fallback_display_name, 'member')
  on conflict (space_id, user_id)
  do update set display_name = excluded.display_name
  returning * into joined_member;

  return joined_member;
end;
$$;

alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.wishes enable row level security;
alter table public.wish_comments enable row level security;

drop policy if exists "spaces_select_member" on public.spaces;
create policy "spaces_select_member"
on public.spaces
for select
to authenticated
using (public.is_space_member(id));

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
using (public.is_space_owner(id))
with check (public.is_space_owner(id));

drop policy if exists "space_members_select_member" on public.space_members;
create policy "space_members_select_member"
on public.space_members
for select
to authenticated
using (public.is_space_member(space_id));

drop policy if exists "space_members_update_owner_or_self" on public.space_members;
create policy "space_members_update_owner_or_self"
on public.space_members
for update
to authenticated
using (public.is_space_owner(space_id) or user_id = auth.uid())
with check (public.is_space_owner(space_id) or user_id = auth.uid());

drop policy if exists "space_members_delete_owner_or_self" on public.space_members;
create policy "space_members_delete_owner_or_self"
on public.space_members
for delete
to authenticated
using (public.is_space_owner(space_id) or user_id = auth.uid());

drop policy if exists "wishes_select_member_visible_scope" on public.wishes;
create policy "wishes_select_member_visible_scope"
on public.wishes
for select
to authenticated
using (
  public.is_space_member(space_id)
  and (scope = 'shared' or owner_id = auth.uid())
);

drop policy if exists "wishes_insert_member_as_owner" on public.wishes;
create policy "wishes_insert_member_as_owner"
on public.wishes
for insert
to authenticated
with check (
  public.is_space_member(space_id)
  and owner_id = auth.uid()
);

drop policy if exists "wishes_update_member_visible_scope" on public.wishes;
create policy "wishes_update_member_visible_scope"
on public.wishes
for update
to authenticated
using (
  public.is_space_member(space_id)
  and (scope = 'shared' or owner_id = auth.uid())
)
with check (
  public.is_space_member(space_id)
  and (scope = 'shared' or owner_id = auth.uid())
);

drop policy if exists "wishes_delete_member_visible_scope" on public.wishes;
create policy "wishes_delete_member_visible_scope"
on public.wishes
for delete
to authenticated
using (
  public.is_space_member(space_id)
  and (scope = 'shared' or owner_id = auth.uid())
);

drop policy if exists "wish_comments_select_visible_wish" on public.wish_comments;
create policy "wish_comments_select_visible_wish"
on public.wish_comments
for select
to authenticated
using (public.can_access_wish(wish_id));

drop policy if exists "wish_comments_insert_visible_wish" on public.wish_comments;
create policy "wish_comments_insert_visible_wish"
on public.wish_comments
for insert
to authenticated
with check (
  author_id = auth.uid()
  and public.can_access_wish(wish_id)
);

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

grant execute on function public.join_space_by_invite(text, text) to authenticated;