insert into public.space_members (space_id, user_id, display_name, role)
select
  space.id,
  space.created_by,
  left(
    coalesce(
      nullif(split_part(coalesce("user".email, '空间拥有者'), '@', 1), ''),
      '空间拥有者'
    ),
    50
  ) as display_name,
  'owner'::public.space_role as role
from public.spaces as space
left join auth.users as "user"
  on "user".id = space.created_by
on conflict (space_id, user_id)
do update set
  display_name = excluded.display_name,
  role = 'owner';