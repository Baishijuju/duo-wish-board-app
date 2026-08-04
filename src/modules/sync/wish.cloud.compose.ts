import type {
  MonthlyJournalSnapshotRecord,
  RewardClaimRecord,
  RewardPoolItem,
  ThreadReactionRecord,
  WishThreadEntry,
} from '../../stores/wishes'
import { createMonthlyJournalSnapshotRecord, isPlainRecord } from '../journal/journal.factories'
import { buildDerivedWishThreadEntries } from '../journal/journal.projection.local'
import {
  buildWishThreadEntriesFromRows,
  buildCommentRowsFromThreadEntries,
  mapCommentImageRowsFromThreadImages,
  type WishCountProgressDailyRowLike,
} from '../journal/journal.mapping.cloud'
import {
  createRewardClaimFromRow,
  createRewardPoolItemFromRow,
  createWishRecordFromRow,
  type RewardClaimRowLike,
  type RewardPoolItemRowLike,
  type WishCommentImageRowLike,
  type WishCommentRowLike,
  type WishRowLike,
} from '../wishes/wish.mapping.cloud'
import type { WishCloudFetchResult } from './wish.cloud.fetch'

export interface WishCloudComposedState {
  rewardPoolItems: RewardPoolItem[]
  rewardClaims: RewardClaimRecord[]
  wishes: ReturnType<typeof createWishRecordFromRow>[]
  threadReactions: ThreadReactionRecord[]
  wishThreads: WishThreadEntry[]
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
}

export function composeWishCloudState(fetchResult: WishCloudFetchResult) {
  const nextRewardPoolItems = fetchResult.rewardPoolItemRows.map((row) => createRewardPoolItemFromRow(row as RewardPoolItemRowLike))
  const nextRewardClaims = fetchResult.rewardClaimRows.map((row) => createRewardClaimFromRow(row as RewardClaimRowLike))

  const commentRows = fetchResult.hasUnifiedThreadData
    ? buildCommentRowsFromThreadEntries(
      fetchResult.threadRows.map((thread) => ({
        actorId: thread.actor_id,
        createdAt: thread.created_at,
        eventKind: thread.event_kind,
        id: thread.id,
        messageText: thread.message_text,
        meta: isPlainRecord(thread.meta) ? thread.meta : {},
        spaceId: thread.space_id,
        updatedAt: thread.updated_at,
        wishId: thread.wish_id,
        images: [],
        reactions: [],
      })),
    )
    : fetchResult.commentRows

  const commentImageRows = fetchResult.hasUnifiedThreadData
    ? mapCommentImageRowsFromThreadImages(fetchResult.threadImageRows)
    : fetchResult.commentImageRows

  const commentRowsByWishId = groupRowsByKey(commentRows, (comment) => comment.wish_id)
  const commentImageRowsByCommentId = groupRowsByKey(commentImageRows, (image) => image.comment_id)
  const imageRowsByWishId = groupRowsByKey(fetchResult.imageRows, (image) => image.wish_id)
  const stepRowsByWishId = groupRowsByKey(fetchResult.stepRows, (step) => step.wish_id)

  const nextWishes = fetchResult.wishRows.map((wish) =>
    createWishRecordFromRow(
      wish as WishRowLike,
      commentRowsByWishId.get(wish.id) ?? [],
      getCommentImagesForComments(commentRowsByWishId.get(wish.id) ?? [], commentImageRowsByCommentId),
      imageRowsByWishId.get(wish.id) ?? [],
      stepRowsByWishId.get(wish.id) ?? [],
      fetchResult.imageUrlMap,
      fetchResult.commentImageUrlMap,
    ),
  )

  const resolvedCountProgressDailyRows = resolveCountProgressDailyRows(
    fetchResult.countProgressDailyRows,
    fetchResult.rewardClaimRows,
  )
  const countProgressStarCoinValueByWishId = new Map(
    fetchResult.wishRows.map((row) => [
      row.id,
      typeof row.progress_star_coin_value === 'number' && Number.isFinite(row.progress_star_coin_value)
        ? Math.max(0, row.progress_star_coin_value)
        : 0,
    ]),
  )

  const nextWishThreads = fetchResult.hasUnifiedThreadData
    ? buildWishThreadEntriesFromRows(
      fetchResult.threadRows,
      fetchResult.threadImageRows,
      fetchResult.threadReactionRows,
      createWishImageRecord,
      fetchResult.commentImageUrlMap,
      resolvedCountProgressDailyRows,
      countProgressStarCoinValueByWishId,
    )
    : buildDerivedWishThreadEntries(nextWishes, nextRewardClaims, fetchResult.threadReactionRows)

  const nextMonthlySnapshots = fetchResult.monthlySnapshotRows.map((snapshot) =>
    createMonthlyJournalSnapshotRecord({
      coverSubtitle: snapshot.cover_subtitle,
      coverTitle: snapshot.cover_title,
      createdAt: snapshot.created_at,
      createdBy: snapshot.created_by,
      id: snapshot.id,
      metricsSnapshot: isPlainRecord(snapshot.metrics_snapshot) ? snapshot.metrics_snapshot : {},
      monthKey: snapshot.month_key,
      narrativeBlocks: Array.isArray(snapshot.narrative_blocks)
        ? snapshot.narrative_blocks.filter(isPlainRecord)
        : [],
      snapshotStatus: snapshot.snapshot_status,
      sourceRefs: Array.isArray(snapshot.source_refs)
        ? snapshot.source_refs.filter(isPlainRecord)
        : [],
      spaceId: snapshot.space_id,
    }),
  )

  return {
    rewardPoolItems: nextRewardPoolItems,
    rewardClaims: nextRewardClaims,
    wishes: nextWishes,
    threadReactions: fetchResult.threadReactionRows,
    wishThreads: nextWishThreads,
    monthlyJournalSnapshots: nextMonthlySnapshots,
  }
}

function resolveCountProgressDailyRows(
  dailyRows: WishCountProgressDailyRowLike[],
  rewardClaimRows: RewardClaimRowLike[],
) {
  const fromClaims = buildCountProgressDailyRowsFromClaims(rewardClaimRows)
  const mergedByKey = new Map<string, WishCountProgressDailyRowLike>()

  for (const row of fromClaims) {
    mergedByKey.set(`${row.progress_date}:${row.wish_id}:${row.owner_id}`, row)
  }

  for (const row of dailyRows) {
    mergedByKey.set(`${row.progress_date}:${row.wish_id}:${row.owner_id}`, row)
  }

  return [...mergedByKey.values()]
}

function buildCountProgressDailyRowsFromClaims(rewardClaimRows: RewardClaimRowLike[]) {
  const grouped = new Map<string, WishCountProgressDailyRowLike>()

  for (const row of rewardClaimRows) {
    if (row.claim_kind !== 'count_star_coin' || !row.source_wish_id || row.source_step_id) {
      continue
    }

    const progressDate = getBeijingDateKey(row.created_at)
    const quantity = Number.isFinite(row.quantity) ? Math.max(0, Math.trunc(row.quantity ?? 0)) : 0
    const key = `${progressDate}:${row.source_wish_id}:${row.owner_id}`
    const existing = grouped.get(key)

    if (existing) {
      existing.progress_units += quantity
    } else {
      grouped.set(key, {
        owner_id: row.owner_id,
        progress_date: progressDate,
        progress_units: quantity,
        wish_id: row.source_wish_id,
      })
    }
  }

  return [...grouped.values()]
}

function getBeijingDateKey(dateValue: string | Date = new Date()) {
  const timestamp = dateValue instanceof Date ? dateValue.getTime() : new Date(dateValue).getTime()
  const shiftedDate = new Date((Number.isNaN(timestamp) ? Date.now() : timestamp) + 8 * 60 * 60 * 1000)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${shiftedDate.getUTCDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function createWishImageRecord(image: {
  id: string
  createdAt: string
  createdBy: string
  fileName: string
  mimeType: string
  sizeBytes: number
  storagePath: string
  url: string
  note?: string
}) {
  return {
    ...image,
    note: image.note ?? '',
  }
}

function groupRowsByKey<T>(rows: T[], getKey: (row: T) => string | null | undefined) {
  const groupedRows = new Map<string, T[]>()

  for (const row of rows) {
    const key = getKey(row)

    if (!key) {
      continue
    }

    const existingRows = groupedRows.get(key)

    if (existingRows) {
      existingRows.push(row)
    } else {
      groupedRows.set(key, [row])
    }
  }

  return groupedRows
}

function getCommentImagesForComments(
  comments: WishCommentRowLike[],
  imagesByCommentId: Map<string, WishCommentImageRowLike[]>,
) {
  return comments.flatMap((comment) => imagesByCommentId.get(comment.id) ?? [])
}
