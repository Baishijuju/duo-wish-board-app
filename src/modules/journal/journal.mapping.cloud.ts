import type { ThreadReactionRecord, WishThreadEntry, WishThreadEventKind } from '../../stores/wishes'
import { compareIsoAscending, createWishThreadEntry, isPlainRecord } from './journal.factories'

export interface WishThreadRowLike {
  id: string
  space_id: string
  wish_id: string | null
  actor_id: string | null
  event_kind: WishThreadEventKind
  message_text: string
  meta: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface WishThreadImageRowLike {
  id: string
  thread_id: string
  created_by: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  sort_order: number
  created_at: string
}

export interface WishCommentRowLike {
  id: string
  wish_id: string
  author_id: string
  body: string
  created_at: string
}

export interface WishCommentImageRowLike {
  id: string
  comment_id: string
  created_by: string
  storage_path: string
  file_name: string
  mime_type: string
  size_bytes: number
  sort_order: number
  created_at: string
}

export interface WishImageLike {
  id: string
  createdAt: string
  createdBy: string
  fileName: string
  mimeType: string
  note: string
  sizeBytes: number
  storagePath: string
  url: string
}

export function buildWishThreadEntriesFromRows(
  threadRows: WishThreadRowLike[],
  threadImageRows: WishThreadImageRowLike[],
  reactions: ThreadReactionRecord[],
  imageFactory: (input: Omit<WishImageLike, 'note'> & { note?: string }) => WishImageLike,
  imageUrlMap: Map<string, string>,
) {
  const imagesByThreadId = new Map<string, WishImageLike[]>()

  for (const image of [...threadImageRows].sort((left, right) => left.sort_order - right.sort_order || compareIsoAscending(left.created_at, right.created_at))) {
    const threadImages = imagesByThreadId.get(image.thread_id) ?? []

    threadImages.push(
      imageFactory({
        id: image.id,
        createdAt: image.created_at,
        createdBy: image.created_by,
        fileName: image.file_name,
        mimeType: image.mime_type,
        sizeBytes: image.size_bytes,
        storagePath: image.storage_path,
        url: imageUrlMap.get(image.storage_path) ?? '',
      }),
    )

    imagesByThreadId.set(image.thread_id, threadImages)
  }

  const baseEntries = threadRows.map((thread) =>
    createWishThreadEntry({
      actorId: thread.actor_id,
      createdAt: thread.created_at,
      eventKind: thread.event_kind,
      id: thread.id,
      images: imagesByThreadId.get(thread.id) ?? [],
      messageText: thread.message_text,
      meta: isPlainRecord(thread.meta) ? thread.meta : {},
      spaceId: thread.space_id,
      updatedAt: thread.updated_at,
      wishId: thread.wish_id,
    }),
  )

  const normalizedEntries = mergeCountStarCoinThreadEntries(baseEntries)

  return attachThreadReactions(normalizedEntries, reactions)
}

export function buildCommentRowsFromThreadEntries(threadEntries: WishThreadEntry[]): WishCommentRowLike[] {
  return threadEntries
    .filter((thread) => thread.eventKind === 'comment' && !!thread.wishId)
    .map((thread) => ({
      author_id: thread.actorId ?? '',
      body: thread.messageText,
      created_at: thread.createdAt,
      id: thread.id,
      wish_id: thread.wishId ?? '',
    }))
}

export function mapCommentImageRowsFromThreadImages(threadImageRows: WishThreadImageRowLike[]): WishCommentImageRowLike[] {
  return threadImageRows.map((image) => ({
    comment_id: image.thread_id,
    created_at: image.created_at,
    created_by: image.created_by,
    file_name: image.file_name,
    id: image.id,
    mime_type: image.mime_type,
    size_bytes: image.size_bytes,
    sort_order: image.sort_order,
    storage_path: image.storage_path,
  }))
}

function buildThreadReactionSummaryMap(reactions: ThreadReactionRecord[]) {
  const threadMap = new Map<string, Map<string, { emoji: string; count: number; memberIds: string[] }>>()

  for (const reaction of [...reactions].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt))) {
    const emojiMap = threadMap.get(reaction.targetThreadId) ?? new Map<string, { emoji: string; count: number; memberIds: string[] }>()
    const existingSummary = emojiMap.get(reaction.emoji)

    if (existingSummary) {
      existingSummary.count += 1

      if (!existingSummary.memberIds.includes(reaction.actorId)) {
        existingSummary.memberIds.push(reaction.actorId)
      }
    } else {
      emojiMap.set(reaction.emoji, {
        count: 1,
        emoji: reaction.emoji,
        memberIds: [reaction.actorId],
      })
    }

    threadMap.set(reaction.targetThreadId, emojiMap)
  }

  return new Map(
    [...threadMap.entries()].map(([threadId, emojiMap]) => [
      threadId,
      [...emojiMap.values()].sort((left, right) => right.count - left.count || left.emoji.localeCompare(right.emoji)),
    ]),
  )
}

function attachThreadReactions(entries: WishThreadEntry[], reactions: ThreadReactionRecord[]) {
  const reactionSummaryMap = buildThreadReactionSummaryMap(reactions)

  return [...entries]
    .map((entry) =>
      createWishThreadEntry({
        ...entry,
        reactions: reactionSummaryMap.get(entry.id) ?? [],
      }),
    )
    .sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt) || left.id.localeCompare(right.id))
}

function mergeCountStarCoinThreadEntries(entries: WishThreadEntry[]) {
  const groupByKey = new Map<string, { index: number; quantity: number; starCoinDelta: number }>()
  const normalizedEntries: WishThreadEntry[] = []

  for (const entry of [...entries].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt) || left.id.localeCompare(right.id))) {
    if (!isCountStarCoinThreadEntry(entry)) {
      normalizedEntries.push(entry)
      continue
    }

    const groupKey = `${getBeijingDateKey(entry.createdAt)}:${entry.wishId ?? 'no-wish'}:${entry.actorId ?? 'no-actor'}`
    const quantity = Math.max(1, getNumericMetaValue(entry.meta, 'quantity') ?? 1)
    const starCoinDelta = Math.max(0, getNumericMetaValue(entry.meta, 'starCoinDelta') ?? 0)
    const existingGroup = groupByKey.get(groupKey)

    if (!existingGroup) {
      const claimIds = mergeClaimIds([], entry.id, entry.meta)
      normalizedEntries.push(
        createWishThreadEntry({
          ...entry,
          meta: {
            ...entry.meta,
            claimIds,
            claimKind: 'count_star_coin',
            quantity,
            starCoinDelta,
          },
          messageText: mergeCountStarCoinMessage(entry.messageText, quantity, starCoinDelta),
        }),
      )

      groupByKey.set(groupKey, {
        index: normalizedEntries.length - 1,
        quantity,
        starCoinDelta,
      })
      continue
    }

    const mergedQuantity = existingGroup.quantity + quantity
    const mergedStarCoinDelta = existingGroup.starCoinDelta + starCoinDelta
    const currentEntry = normalizedEntries[existingGroup.index]!
    const claimIds = mergeClaimIds(currentEntry.meta.claimIds, entry.id, entry.meta)

    normalizedEntries[existingGroup.index] = createWishThreadEntry({
      ...currentEntry,
      messageText: mergeCountStarCoinMessage(currentEntry.messageText, mergedQuantity, mergedStarCoinDelta),
      meta: {
        ...currentEntry.meta,
        claimIds,
        claimKind: 'count_star_coin',
        quantity: mergedQuantity,
        starCoinDelta: mergedStarCoinDelta,
      },
      updatedAt: compareIsoAscending(currentEntry.updatedAt, entry.updatedAt) < 0 ? entry.updatedAt : currentEntry.updatedAt,
    })

    groupByKey.set(groupKey, {
      index: existingGroup.index,
      quantity: mergedQuantity,
      starCoinDelta: mergedStarCoinDelta,
    })
  }

  return normalizedEntries
}

function isCountStarCoinThreadEntry(entry: WishThreadEntry) {
  if (entry.eventKind !== 'reward_claimed') {
    return false
  }

  const claimKind = entry.meta.claimKind
  return claimKind === 'count_star_coin'
}

function getNumericMetaValue(meta: Record<string, unknown>, key: string) {
  const value = meta[key]

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function mergeClaimIds(existingClaimIds: unknown, threadId: string, meta: Record<string, unknown>) {
  const ids = new Set<string>()

  if (Array.isArray(existingClaimIds)) {
    existingClaimIds.forEach((id) => {
      if (typeof id === 'string' && id.trim()) {
        ids.add(id)
      }
    })
  }

  const metaClaimIds = meta.claimIds
  if (Array.isArray(metaClaimIds)) {
    metaClaimIds.forEach((id) => {
      if (typeof id === 'string' && id.trim()) {
        ids.add(id)
      }
    })
  }

  ids.add(threadId)
  return [...ids]
}

function mergeCountStarCoinMessage(messageText: string, quantity: number, starCoinDelta: number) {
  const quantityText = formatDecimal(quantity)
  const starCoinText = formatDecimal(starCoinDelta)
  const conciseMessage = `今天前进了 ${quantityText} 点，收下 ${starCoinText} 星币。`

  if (/数字进度往前推进了\s*[0-9.]+\s*点，收下了\s*[0-9.]+\s*枚星星币。?/u.test(messageText)) {
    return conciseMessage
  }

  if (/数字进度往前推进了\s*[0-9.]+\s*点，并存下了\s*[0-9.]+\s*枚星星币。?/u.test(messageText)) {
    return conciseMessage
  }

  return conciseMessage
}

function getBeijingDateKey(dateValue: string | Date = new Date()) {
  const timestamp = dateValue instanceof Date ? dateValue.getTime() : new Date(dateValue).getTime()
  const shiftedDate = new Date((Number.isNaN(timestamp) ? Date.now() : timestamp) + 8 * 60 * 60 * 1000)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${shiftedDate.getUTCDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatDecimal(value: number) {
  const roundedValue = Math.round(value * 10) / 10
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1)
}
