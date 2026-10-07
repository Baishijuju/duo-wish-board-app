export interface RealtimeChangePayload {
  eventType?: unknown
  new?: Record<string, unknown> | null
  old?: Record<string, unknown> | null
}

export function isCountProgressRewardClaimEcho(
  payload: RealtimeChangePayload,
  wishId: string,
  ownerId: string,
) {
  const claim = payload.new

  return payload.eventType === 'INSERT'
    && claim?.owner_id === ownerId
    && claim?.source_wish_id === wishId
    && claim?.claim_kind === 'count_star_coin'
    && claim?.source_step_id == null
}

export function isCountProgressWishThreadEcho(
  payload: RealtimeChangePayload,
  wishId: string,
  ownerId: string,
) {
  const thread = payload.new
  const meta = thread?.meta

  return payload.eventType === 'INSERT'
    && thread?.actor_id === ownerId
    && thread?.wish_id === wishId
    && thread?.event_kind === 'reward_claimed'
    && !!meta
    && typeof meta === 'object'
    && 'claimKind' in meta
    && meta.claimKind === 'count_star_coin'
}

export function shouldSyncForWishRealtimeEvent(
  payload: RealtimeChangePayload,
  visibleWishIds: Set<string>,
) {
  const nextWishId = typeof payload.new?.wish_id === 'string' ? payload.new.wish_id : null
  const previousWishId = typeof payload.old?.wish_id === 'string' ? payload.old.wish_id : null

  if (!nextWishId && !previousWishId) {
    return true
  }

  return Boolean((nextWishId && visibleWishIds.has(nextWishId)) || (previousWishId && visibleWishIds.has(previousWishId)))
}

export function shouldSyncForCommentImageRealtimeEvent(
  payload: RealtimeChangePayload,
  visibleCommentIds: Set<string>,
) {
  const nextCommentId = typeof payload.new?.comment_id === 'string' ? payload.new.comment_id : null
  const previousCommentId = typeof payload.old?.comment_id === 'string' ? payload.old.comment_id : null

  if (!nextCommentId && !previousCommentId) {
    return true
  }

  return Boolean((nextCommentId && visibleCommentIds.has(nextCommentId)) || (previousCommentId && visibleCommentIds.has(previousCommentId)))
}

export function shouldSyncForThreadImageRealtimeEvent(
  payload: RealtimeChangePayload,
  visibleThreadIds: Set<string>,
) {
  const nextThreadId = typeof payload.new?.thread_id === 'string' ? payload.new.thread_id : null
  const previousThreadId = typeof payload.old?.thread_id === 'string' ? payload.old.thread_id : null

  if (!nextThreadId && !previousThreadId) {
    return true
  }

  return Boolean((nextThreadId && visibleThreadIds.has(nextThreadId)) || (previousThreadId && visibleThreadIds.has(previousThreadId)))
}
