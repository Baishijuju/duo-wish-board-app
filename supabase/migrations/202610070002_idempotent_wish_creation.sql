alter table public.wishes
  add column if not exists creation_request_hash text;

create or replace function public.create_wish_with_initial_steps(
  target_wish_id uuid,
  target_space_id uuid,
  request_payload jsonb,
  initial_steps jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  request_hash text;
  existing_wish public.wishes;
  step_payload jsonb;
  normalized_progress_mode public.wish_progress_mode;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if target_wish_id is null or target_space_id is null or jsonb_typeof(request_payload) <> 'object' then
    raise exception 'Invalid wish creation request';
  end if;

  if not public.is_space_member(target_space_id) then
    raise exception 'Space membership required';
  end if;

  if nullif(btrim(request_payload->>'title'), '') is null
    or nullif(btrim(request_payload->>'category'), '') is null
    or nullif(btrim(request_payload->>'note'), '') is null then
    raise exception 'Wish title, category and note are required';
  end if;

  if (request_payload->>'owner_id')::uuid is distinct from actor_id then
    raise exception 'Wish owner must match the authenticated user';
  end if;

  if jsonb_typeof(coalesce(initial_steps, '[]'::jsonb)) <> 'array' then
    raise exception 'Initial steps must be an array';
  end if;

  normalized_progress_mode := coalesce(nullif(request_payload->>'progress_mode', '')::public.wish_progress_mode, 'none'::public.wish_progress_mode);
  if normalized_progress_mode = 'count'::public.wish_progress_mode
    and coalesce((request_payload->>'progress_target')::integer, 0) <= 0 then
    raise exception 'Count progress target must be positive';
  end if;

  if normalized_progress_mode = 'steps'::public.wish_progress_mode and jsonb_array_length(coalesce(initial_steps, '[]'::jsonb)) = 0 then
    raise exception 'Step progress requires at least one initial step';
  end if;

  request_hash := md5(request_payload::text || '|' || coalesce(initial_steps, '[]'::jsonb)::text);

  insert into public.wishes (
    id,
    creation_request_hash,
    space_id,
    owner_id,
    title,
    category,
    note,
    scope,
    progress_mode,
    progress_current,
    progress_target,
    progress_unit,
    progress_star_coin_value,
    completion_star_coin_bonus
  )
  values (
    target_wish_id,
    request_hash,
    target_space_id,
    actor_id,
    btrim(request_payload->>'title'),
    btrim(request_payload->>'category'),
    btrim(request_payload->>'note'),
    coalesce(nullif(request_payload->>'scope', '')::public.wish_scope, 'shared'::public.wish_scope),
    normalized_progress_mode,
    greatest(coalesce((request_payload->>'progress_current')::integer, 0), 0),
    greatest(coalesce((request_payload->>'progress_target')::integer, 0), 0),
    coalesce(request_payload->>'progress_unit', ''),
    greatest(coalesce((request_payload->>'progress_star_coin_value')::numeric, 0), 0),
    greatest(coalesce((request_payload->>'completion_star_coin_bonus')::numeric, 0), 0)
  )
  on conflict (id) do nothing;

  if not found then
    select *
    into existing_wish
    from public.wishes wish
    where wish.id = target_wish_id
    for update;

    if existing_wish.id is null
      or existing_wish.space_id <> target_space_id
      or existing_wish.owner_id <> actor_id
      or existing_wish.creation_request_hash is distinct from request_hash then
      raise exception 'Wish creation request id was reused with different data';
    end if;

    return existing_wish.id;
  end if;

  for step_payload in
    select value from jsonb_array_elements(coalesce(initial_steps, '[]'::jsonb))
  loop
    if nullif(btrim(step_payload->>'title'), '') is null
      or coalesce((step_payload->>'star_coin_value')::numeric, 0) <= 0 then
      raise exception 'Each initial step requires a title and positive star coin value';
    end if;

    insert into public.wish_steps (wish_id, title, star_coin_value, is_done)
    values (
      target_wish_id,
      btrim(step_payload->>'title'),
      (step_payload->>'star_coin_value')::numeric,
      false
    );
  end loop;

  return target_wish_id;
end;
$$;

revoke all on function public.create_wish_with_initial_steps(uuid, uuid, jsonb, jsonb) from public;
grant execute on function public.create_wish_with_initial_steps(uuid, uuid, jsonb, jsonb) to authenticated;
