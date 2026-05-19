create or replace function public.set_wish_image_cover(target_wish_id uuid, target_image_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not public.can_access_wish(target_wish_id) then
    raise exception 'wish is not accessible';
  end if;

  if not exists (
    select 1
    from public.wish_images image
    where image.id = target_image_id
      and image.wish_id = target_wish_id
  ) then
    raise exception 'wish image not found';
  end if;

  with reordered as (
    select
      image.id,
      row_number() over (
        order by
          case when image.id = target_image_id then 0 else 1 end,
          image.sort_order,
          image.created_at,
          image.id
      ) - 1 as next_sort_order
    from public.wish_images image
    where image.wish_id = target_wish_id
  )
  update public.wish_images image
  set sort_order = reordered.next_sort_order
  from reordered
  where image.id = reordered.id;
end;
$$;

revoke all on function public.set_wish_image_cover(uuid, uuid) from public;
grant execute on function public.set_wish_image_cover(uuid, uuid) to authenticated;