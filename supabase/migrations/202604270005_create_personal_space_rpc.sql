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
  owner_display_name text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  owner_display_name := coalesce(nullif(trim(display_name_input), ''), split_part(coalesce(auth.jwt() ->> 'email', '成员'), '@', 1));

  insert into public.spaces (name, invite_code, created_by)
  values (trim(space_name_input), upper(trim(invite_code_input)), auth.uid())
  returning * into created_space;

  update public.space_members
  set display_name = owner_display_name
  where space_id = created_space.id
    and user_id = auth.uid();

  return created_space;
end;
$$;

grant execute on function public.create_personal_space(text, text, text) to authenticated;