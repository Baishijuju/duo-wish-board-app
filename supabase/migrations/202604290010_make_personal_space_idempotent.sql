create or replace function public.create_personal_space(
  space_name_input text,
  invite_code_input text,
  display_name_input text default null
)
returns public.spaces
language plpgsql
security definer
set search_path = public
as $$
declare
  created_space public.spaces;
  existing_space public.spaces;
  owner_display_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  owner_display_name := coalesce(nullif(trim(display_name_input), ''), split_part(coalesce(auth.jwt() ->> 'email', '成员'), '@', 1));

  select *
  into existing_space
  from public.spaces
  where created_by = auth.uid()
  order by created_at asc
  limit 1;

  if existing_space.id is not null then
    insert into public.space_members (space_id, user_id, display_name, role)
    values (existing_space.id, auth.uid(), owner_display_name, 'owner')
    on conflict (space_id, user_id)
    do update set display_name = excluded.display_name, role = 'owner';

    return existing_space;
  end if;

  insert into public.spaces (name, invite_code, created_by)
  values (trim(space_name_input), upper(trim(invite_code_input)), auth.uid())
  returning * into created_space;

  insert into public.space_members (space_id, user_id, display_name, role)
  values (created_space.id, auth.uid(), owner_display_name, 'owner')
  on conflict (space_id, user_id)
  do update set display_name = excluded.display_name, role = 'owner';

  return created_space;
end;
$$;

grant execute on function public.create_personal_space(text, text, text) to authenticated;