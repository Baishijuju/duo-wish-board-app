import type {
  RewardClaimKind,
  RewardClaimRecord,
  RewardPoolItem,
  RewardTier,
  WishProgressMode,
  WishScope,
  WishStatus,
} from '../../stores/wishes'
import {
  createRewardClaimRecord,
  createRewardPoolItem,
} from '../rewards/reward.factories'
import {
  createWishComment,
  createWishImage,
  createWishRecord,
  createWishStep,
} from './wish.factories'

export interface WishRowLike {
  id: string
  space_id: string
  owner_id: string
  title: string
  category: string
  note: string
  scope: WishScope
  status: WishStatus
  is_starred: boolean
  progress_mode: WishProgressMode | null
  progress_current: number | null
  progress_star_coin_value?: number | null
  progress_target: number | null
  progress_unit: string | null
  completion_star_coin_bonus?: number | null
  completed_at: string | null
  created_at: string
  updated_at: string
  [key: string]: unknown
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

export interface WishImageRowLike {
  id: string
  wish_id: string
  created_by: string
  storage_path: string
  file_name: string
  mime_type: string
  note: string
  size_bytes: number
  sort_order: number
  created_at: string
}

export interface WishStepRowLike {
  id: string
  wish_id: string
  title: string
  is_done: boolean
  star_coin_value?: number | null
  created_at: string
  updated_at: string
}

export interface RewardPoolItemRowLike {
  id: string
  owner_id: string
  reward_scope?: RewardPoolItem['scope'] | null
  tier: RewardTier
  title: string
  note: string
  star_coin_cost: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface RewardClaimRowLike {
  id: string
  owner_id: string
  reward_item_id: string | null
  source_wish_id: string | null
  source_step_id: string | null
  claim_kind: RewardClaimKind
  quantity: number | null
  title_snapshot: string
  note_snapshot: string
  star_coin_delta: number
  created_at: string
}

export function createWishRecordFromRow(
  row: WishRowLike,
  commentRows: WishCommentRowLike[],
  commentImageRows: WishCommentImageRowLike[],
  imageRows: WishImageRowLike[],
  stepRows: WishStepRowLike[],
  imageUrlMap: Map<string, string>,
  commentImageUrlMap: Map<string, string>,
) {
  const normalizedProgressMode = row.progress_mode === 'count' || row.progress_mode === 'steps' || row.progress_mode === 'none'
    ? row.progress_mode
    : 'none'

  return createWishRecord({
    id: row.id,
    title: row.title,
    category: row.category,
    note: row.note,
    ownerId: row.owner_id,
    scope: row.scope,
    status: row.status,
    starred: row.is_starred,
    progressMode: normalizedProgressMode,
    progressCurrent: typeof row.progress_current === 'number' ? row.progress_current : 0,
    progressStarCoinValue: typeof row.progress_star_coin_value === 'number' ? row.progress_star_coin_value : 0,
    progressTarget: typeof row.progress_target === 'number' ? row.progress_target : 0,
    progressUnit: typeof row.progress_unit === 'string' ? row.progress_unit : '',
    completionStarCoinBonus: typeof row.completion_star_coin_bonus === 'number' ? row.completion_star_coin_bonus : 0,
    completedAt: row.completed_at,
    steps: stepRows
      .filter((step) => step.wish_id === row.id)
      .sort((left, right) => new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .map((step) =>
        createWishStep({
          id: step.id,
          title: step.title,
          starCoinValue: typeof step.star_coin_value === 'number' ? step.star_coin_value : 0,
          isDone: step.is_done,
          createdAt: step.created_at,
          updatedAt: step.updated_at,
        }),
      ),
    comments: commentRows
      .filter((comment) => comment.wish_id === row.id)
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .map((comment) =>
        createWishComment({
          id: comment.id,
          authorId: comment.author_id,
          createdAt: comment.created_at,
          images: commentImageRows
            .filter((image) => image.comment_id === comment.id)
            .sort((left, right) => left.sort_order - right.sort_order || new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
            .map((image) =>
              createWishImage({
                id: image.id,
                createdAt: image.created_at,
                createdBy: image.created_by,
                fileName: image.file_name,
                mimeType: image.mime_type,
                sizeBytes: image.size_bytes,
                storagePath: image.storage_path,
                url: commentImageUrlMap.get(image.storage_path) ?? '',
              }),
            ),
          message: comment.body,
        }),
      ),
    images: imageRows
      .filter((image) => image.wish_id === row.id)
      .sort((left, right) => left.sort_order - right.sort_order || new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .map((image) =>
        createWishImage({
          id: image.id,
          createdAt: image.created_at,
          createdBy: image.created_by,
          fileName: image.file_name,
          mimeType: image.mime_type,
          note: image.note,
          sizeBytes: image.size_bytes,
          storagePath: image.storage_path,
          url: imageUrlMap.get(image.storage_path) ?? '',
        }),
      ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  })
}

export function createRewardPoolItemFromRow(row: RewardPoolItemRowLike): RewardPoolItem {
  return createRewardPoolItem({
    createdAt: row.created_at,
    id: row.id,
    isArchived: row.is_archived,
    note: row.note,
    ownerId: row.owner_id,
    scope: row.reward_scope === 'shared' ? 'shared' : 'personal',
    starCoinCost: row.star_coin_cost,
    tier: row.tier,
    title: row.title,
    updatedAt: row.updated_at,
  })
}

export function createRewardClaimFromRow(row: RewardClaimRowLike): RewardClaimRecord {
  return createRewardClaimRecord({
    claimKind: row.claim_kind,
    createdAt: row.created_at,
    id: row.id,
    noteSnapshot: row.note_snapshot,
    ownerId: row.owner_id,
    quantity: row.quantity ?? 1,
    rewardItemId: row.reward_item_id,
    sourceStepId: row.source_step_id,
    sourceWishId: row.source_wish_id,
    starCoinDelta: row.star_coin_delta,
    titleSnapshot: row.title_snapshot,
  })
}
