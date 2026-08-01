-- Fix monthly snapshot aggregation for thread_reactions.target_thread_id text migration.
-- Prevents Postgres error 42883: operator does not exist: text = uuid.

create or replace function public.freeze_monthly_journal_snapshot(target_space_id uuid, target_month_key text)
returns public.monthly_journal_snapshots
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month_key text;
  existing_snapshot public.monthly_journal_snapshots;
  space_row public.spaces;
  snapshot_row public.monthly_journal_snapshots;
  cover_title_value text;
  cover_subtitle_value text;
  narrative_blocks_value jsonb;
  metrics_snapshot_value jsonb;
  source_refs_value jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_space_member(target_space_id) then
    raise exception '当前成员暂时不能冻结这个月刊';
  end if;

  if target_month_key !~ '^[0-9]{4}-[0-9]{2}$' then
    raise exception 'Invalid month key';
  end if;

  current_month_key := public.get_month_key_for_timestamp(timezone('utc', now()));

  if target_month_key >= current_month_key then
    raise exception '当前月份还不能冻结成月刊';
  end if;

  select *
  into existing_snapshot
  from public.monthly_journal_snapshots snapshot
  where snapshot.space_id = target_space_id
    and snapshot.month_key = target_month_key;

  if existing_snapshot.id is not null then
    return existing_snapshot;
  end if;

  select *
  into space_row
  from public.spaces space
  where space.id = target_space_id;

  if space_row.id is null then
    raise exception 'Space not found';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'threadId', thread.id,
        'wishId', thread.wish_id,
        'eventKind', thread.event_kind,
        'messageText', thread.message_text,
        'createdAt', thread.created_at,
        'updatedAt', thread.updated_at,
        'actorId', thread.actor_id,
        'actorName', case when thread.actor_id is null then '系统' else public.get_space_member_display_name(thread.space_id, thread.actor_id) end,
        'meta', thread.meta,
        'images', coalesce(images.image_list, '[]'::jsonb),
        'reactions', coalesce(reactions.reaction_list, '[]'::jsonb)
      )
      order by thread.created_at asc, thread.id asc
    ),
    '[]'::jsonb
  )
  into narrative_blocks_value
  from public.wish_threads thread
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'id', image.id,
        'storagePath', image.storage_path,
        'fileName', image.file_name,
        'mimeType', image.mime_type,
        'sizeBytes', image.size_bytes,
        'sortOrder', image.sort_order,
        'createdAt', image.created_at,
        'createdBy', image.created_by
      )
      order by image.sort_order asc, image.created_at asc
    ) as image_list
    from public.wish_thread_images image
    where image.thread_id = thread.id
  ) images on true
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'emoji', reaction.emoji,
        'count', reaction.count_value,
        'memberIds', reaction.member_ids
      )
      order by reaction.emoji asc
    ) as reaction_list
    from (
      select
        item.emoji,
        count(*) as count_value,
        jsonb_agg(item.actor_id order by item.created_at asc) as member_ids
      from public.thread_reactions item
      where item.target_thread_id = thread.id::text
      group by item.emoji
    ) reaction
  ) reactions on true
  where thread.space_id = target_space_id
    and public.get_month_key_for_timestamp(thread.created_at) = target_month_key;

  if jsonb_array_length(narrative_blocks_value) = 0 then
    raise exception '这个月份还没有可冻结的记录';
  end if;

  select jsonb_build_object(
    'threadCount', count(*),
    'commentCount', count(*) filter (where thread.event_kind = 'comment'),
    'coinEventCount', count(*) filter (where thread.event_kind = 'wish_coin_cast'),
    'rewardEventCount', count(*) filter (where thread.event_kind in ('reward_claimed', 'premium_redeem')),
    'completedWishCount', count(*) filter (where thread.event_kind = 'wish_completed'),
    'dragonBallCount', count(*) filter (where thread.event_kind = 'dragon_ball_reached'),
    'wishCount', count(distinct thread.wish_id),
    'reactionCount', coalesce((
      select count(*)
      from public.thread_reactions reaction
      join public.wish_threads source_thread
        on source_thread.id::text = reaction.target_thread_id
      where source_thread.space_id = target_space_id
        and public.get_month_key_for_timestamp(source_thread.created_at) = target_month_key
    ), 0)
  )
  into metrics_snapshot_value
  from public.wish_threads thread
  where thread.space_id = target_space_id
    and public.get_month_key_for_timestamp(thread.created_at) = target_month_key;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'threadId', thread.id,
        'wishId', thread.wish_id,
        'eventKind', thread.event_kind,
        'createdAt', thread.created_at,
        'sourceTable', thread.source_table,
        'sourceId', thread.source_id
      )
      order by thread.created_at asc, thread.id asc
    ),
    '[]'::jsonb
  )
  into source_refs_value
  from public.wish_threads thread
  where thread.space_id = target_space_id
    and public.get_month_key_for_timestamp(thread.created_at) = target_month_key;

  cover_title_value := to_char(to_date(target_month_key || '-01', 'YYYY-MM-DD'), 'YYYY"年"MM"月"') || ' 月刊';
  cover_subtitle_value := space_row.name || ' 的固定版本回顾';

  insert into public.monthly_journal_snapshots (
    space_id,
    month_key,
    snapshot_status,
    cover_title,
    cover_subtitle,
    narrative_blocks,
    metrics_snapshot,
    source_refs,
    created_at,
    created_by
  )
  values (
    target_space_id,
    target_month_key,
    'ready',
    cover_title_value,
    cover_subtitle_value,
    narrative_blocks_value,
    metrics_snapshot_value,
    source_refs_value,
    timezone('utc', now()),
    auth.uid()
  )
  returning * into snapshot_row;

  return snapshot_row;
end;
$$;

grant execute on function public.freeze_monthly_journal_snapshot(uuid, text) to authenticated;
