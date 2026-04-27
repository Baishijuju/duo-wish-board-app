create or replace function public.set_wish_image_order(target_wish_id uuid, ordered_image_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  image_count integer;
  ordered_count integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if not public.can_access_wish(target_wish_id) then
    raise exception 'wish is not accessible';
  end if;

  image_count := (
    select count(*)
    from public.wish_images image
    where image.wish_id = target_wish_id
  );

  ordered_count := coalesce(array_length(ordered_image_ids, 1), 0);

  if image_count <> ordered_count then
    raise exception 'image order length mismatch';
  end if;

  if exists (
    select 1
    from unnest(ordered_image_ids) as ordered(image_id)
    group by ordered.image_id
    having count(*) > 1
  ) then
    raise exception 'duplicate image id in order payload';
  end if;

  if exists (
    select 1
    from unnest(ordered_image_ids) as ordered(image_id)
    left join public.wish_images image
      on image.id = ordered.image_id
     and image.wish_id = target_wish_id
    where image.id is null
  ) then
    raise exception 'order payload contains image outside current wish';
  end if;

  update public.wish_images image
  set sort_order = ordered.next_sort_order
  from (
    select ordered.image_id, ordered.ordinality - 1 as next_sort_order
    from unnest(ordered_image_ids) with ordinality as ordered(image_id, ordinality)
  ) ordered
  where image.id = ordered.image_id
    and image.wish_id = target_wish_id;
end;
$$;

revoke all on function public.set_wish_image_order(uuid, uuid[]) from public;
grant execute on function public.set_wish_image_order(uuid, uuid[]) to authenticated;