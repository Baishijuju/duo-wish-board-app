import type {
  MonthlyJournalSnapshotRecord,
  RewardClaimRecord,
  RewardPoolItem,
  ThreadReactionRecord,
  WishCoinRecord,
  WishThreadEntry,
} from '../../stores/wishes'
import { createMonthlyJournalSnapshotRecord, isPlainRecord } from '../journal/journal.factories'
import { buildDerivedWishThreadEntries } from '../journal/journal.projection.local'
import { buildWishThreadEntriesFromRows, buildCommentRowsFromThreadEntries, mapCommentImageRowsFromThreadImages } from '../journal/journal.mapping.cloud'
import { createWishCoinRecord } from '../wishes/wish.factories'
import {
  createRewardClaimFromRow,
  createRewardPoolItemFromRow,
  createWishRecordFromRow,
  type RewardClaimRowLike,
  type RewardPoolItemRowLike,
  type WishCoinRowLike,
  type WishCommentImageRowLike,
  type WishCommentRowLike,
  type WishRowLike,
} from '../wishes/wish.mapping.cloud'
import type { WishCloudFetchResult } from './wish.cloud.fetch'

export interface WishCloudComposedState {
  rewardPoolItems: RewardPoolItem[]
  rewardClaims: RewardClaimRecord[]
  wishCoins: WishCoinRecord[]
  wishes: ReturnType<typeof createWishRecordFromRow>[]
  threadReactions: ThreadReactionRecord[]
  wishThreads: WishThreadEntry[]
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
}

export function composeWishCloudState(fetchResult: WishCloudFetchResult) {
  const nextRewardPoolItems = fetchResult.rewardPoolItemRows.map((row) => createRewardPoolItemFromRow(row as RewardPoolItemRowLike))
  const nextRewardClaims = fetchResult.rewardClaimRows.map((row) => createRewardClaimFromRow(row as RewardClaimRowLike))
  const nextWishCoins = fetchResult.wishCoinRows.map((coin) =>
    createWishCoinRecord({
      amount: (coin as WishCoinRowLike & { amount: number }).amount,
      createdAt: (coin as WishCoinRowLike & { created_at: string }).created_at,
      cycleKey: (coin as WishCoinRowLike & { cycle_key: string }).cycle_key,
      id: (coin as WishCoinRowLike & { id: string }).id,
      voterId: (coin as WishCoinRowLike & { voter_id: string }).voter_id,
      wishId: (coin as WishCoinRowLike & { wish_id: string }).wish_id,
    }),
  )

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

  const coinRowsByWishId = groupRowsByKey(fetchResult.wishCoinRows, (coin) => coin.wish_id)
  const commentRowsByWishId = groupRowsByKey(commentRows, (comment) => comment.wish_id)
  const commentImageRowsByCommentId = groupRowsByKey(commentImageRows, (image) => image.comment_id)
  const imageRowsByWishId = groupRowsByKey(fetchResult.imageRows, (image) => image.wish_id)
  const stepRowsByWishId = groupRowsByKey(fetchResult.stepRows, (step) => step.wish_id)

  const nextWishes = fetchResult.wishRows.map((wish) =>
    createWishRecordFromRow(
      wish as WishRowLike,
      coinRowsByWishId.get(wish.id) ?? [],
      commentRowsByWishId.get(wish.id) ?? [],
      getCommentImagesForComments(commentRowsByWishId.get(wish.id) ?? [], commentImageRowsByCommentId),
      imageRowsByWishId.get(wish.id) ?? [],
      stepRowsByWishId.get(wish.id) ?? [],
      fetchResult.imageUrlMap,
      fetchResult.commentImageUrlMap,
    ),
  )

  const nextWishThreads = fetchResult.hasUnifiedThreadData
    ? buildWishThreadEntriesFromRows(fetchResult.threadRows, fetchResult.threadImageRows, fetchResult.threadReactionRows, createWishImageRecord, fetchResult.commentImageUrlMap)
    : buildDerivedWishThreadEntries(nextWishes, nextWishCoins, nextRewardClaims, fetchResult.threadReactionRows)

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
    wishCoins: nextWishCoins,
    wishes: nextWishes,
    threadReactions: fetchResult.threadReactionRows,
    wishThreads: nextWishThreads,
    monthlyJournalSnapshots: nextMonthlySnapshots,
  }
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
