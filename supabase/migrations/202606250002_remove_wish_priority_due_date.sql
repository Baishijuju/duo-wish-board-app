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

drop index if exists public.idx_wishes_status_due;

alter table public.wishes
  drop column if exists priority,
  drop column if exists due_date;

do $$
begin
  if exists (
    select 1
    from pg_type
    where typnamespace = 'public'::regnamespace
      and typname = 'wish_priority'
  ) and not exists (
    select 1
    from pg_depend
    where refobjid = 'public.wish_priority'::regtype::oid
      and deptype in ('n', 'a')
  ) then
    drop type public.wish_priority;
  end if;
end
$$;
