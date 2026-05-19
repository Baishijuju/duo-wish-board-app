alter table public.wish_images
add column if not exists note text not null default '' check (char_length(note) <= 240);

create or replace function public.update_wish_image_note(target_wish_id uuid, target_image_id uuid, next_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_note text := btrim(coalesce(next_note, ''));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if char_length(normalized_note) > 240 then
    raise exception 'image note too long';
  end if;

  if not public.can_access_wish(target_wish_id) then
    raise exception 'wish is not accessible';
  end if;

  update public.wish_images image
  set note = normalized_note
  where image.id = target_image_id
    and image.wish_id = target_wish_id;

  if not found then
    raise exception 'wish image not found';
  end if;
end;
$$;

revoke all on function public.update_wish_image_note(uuid, uuid, text) from public;
grant execute on function public.update_wish_image_note(uuid, uuid, text) to authenticated;