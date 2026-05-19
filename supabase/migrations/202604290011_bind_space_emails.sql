create table if not exists public.space_email_bindings (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  email text not null check (char_length(trim(email)) between 5 and 320 and position('@' in trim(email)) > 1),
  normalized_email text generated always as (lower(trim(email))) stored unique,
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 50),
  role public.space_role not null default 'member',
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_space_email_bindings_space_id on public.space_email_bindings (space_id);

alter table public.space_email_bindings enable row level security;

drop policy if exists "space_email_bindings_select_owner" on public.space_email_bindings;
create policy "space_email_bindings_select_owner"
on public.space_email_bindings
for select
to authenticated
using (public.is_space_owner(space_id));

drop policy if exists "space_email_bindings_insert_owner" on public.space_email_bindings;
create policy "space_email_bindings_insert_owner"
on public.space_email_bindings
for insert
to authenticated
with check (public.is_space_owner(space_id));

drop policy if exists "space_email_bindings_update_owner" on public.space_email_bindings;
create policy "space_email_bindings_update_owner"
on public.space_email_bindings
for update
to authenticated
using (public.is_space_owner(space_id))
with check (public.is_space_owner(space_id));

drop policy if exists "space_email_bindings_delete_owner" on public.space_email_bindings;
create policy "space_email_bindings_delete_owner"
on public.space_email_bindings
for delete
to authenticated
using (public.is_space_owner(space_id));

grant select, insert, update, delete on table public.space_email_bindings to authenticated;

create or replace function public.bind_email_to_space(
  target_space_id uuid,
  email_input text,
  role_input public.space_role default 'member',
  display_name_input text default null
)
returns public.space_email_bindings
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email_input text;
  bound_row public.space_email_bindings;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_space_owner(target_space_id) then
    raise exception 'Only space owners can bind emails for this space';
  end if;

  normalized_email_input := lower(trim(email_input));

  if normalized_email_input = '' or position('@' in normalized_email_input) <= 1 then
    raise exception 'Invalid email';
  end if;

  insert into public.space_email_bindings (space_id, email, display_name, role, created_by)
  values (
    target_space_id,
    normalized_email_input,
    nullif(trim(display_name_input), ''),
    role_input,
    auth.uid()
  )
  on conflict (normalized_email)
  do update set
    space_id = excluded.space_id,
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.space_email_bindings.display_name),
    role = excluded.role,
    created_by = auth.uid()
  returning * into bound_row;

  return bound_row;
end;
$$;

grant execute on function public.bind_email_to_space(uuid, text, public.space_role, text) to authenticated;

create or replace function public.ensure_bound_space_memberships(email_input text default null)
returns setof public.space_members
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email_input text;
  binding_row public.space_email_bindings;
  fallback_display_name text;
  joined_member public.space_members;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  normalized_email_input := lower(trim(coalesce(nullif(email_input, ''), auth.jwt() ->> 'email', '')));

  if normalized_email_input = '' then
    return;
  end if;

  for binding_row in
    select *
    from public.space_email_bindings
    where normalized_email = normalized_email_input
    order by created_at asc
  loop
    fallback_display_name := coalesce(nullif(trim(binding_row.display_name), ''), split_part(normalized_email_input, '@', 1));

    insert into public.space_members (space_id, user_id, display_name, role)
    values (binding_row.space_id, auth.uid(), fallback_display_name, binding_row.role)
    on conflict (space_id, user_id)
    do update set
      display_name = excluded.display_name,
      role = case
        when public.space_members.role = 'owner' or excluded.role = 'owner' then 'owner'::public.space_role
        else excluded.role
      end
    returning * into joined_member;

    return next joined_member;
  end loop;

  return;
end;
$$;

grant execute on function public.ensure_bound_space_memberships(text) to authenticated;