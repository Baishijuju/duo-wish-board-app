import type { SupabaseClient } from '@supabase/supabase-js'
import type { ThreadReactionRecord } from '../../stores/wishes'
import { createThreadReactionRecord } from '../journal/journal.factories'
import type {
  RewardClaimRowLike,
  RewardPoolItemRowLike,
  WishCoinRowLike,
  WishCommentImageRowLike,
  WishCommentRowLike,
  WishImageRowLike,
  WishRowLike,
  WishStepRowLike,
} from '../wishes/wish.mapping.cloud'
import type { WishThreadImageRowLike, WishThreadRowLike } from '../journal/journal.mapping.cloud'

export interface WishCloudFetchResult {
  wishRows: WishRowLike[]
  wishCoinRows: WishCoinRowLike[]
  rewardPoolItemRows: RewardPoolItemRowLike[]
  rewardClaimRows: RewardClaimRowLike[]
  commentRows: WishCommentRowLike[]
  commentImageRows: WishCommentImageRowLike[]
  threadRows: WishThreadRowLike[]
  threadImageRows: WishThreadImageRowLike[]
  threadReactionRows: ThreadReactionRecord[]
  monthlySnapshotRows: MonthlyJournalSnapshotRowLike[]
  hasUnifiedThreadData: boolean
  imageRows: WishImageRowLike[]
  stepRows: WishStepRowLike[]
  imageUrlMap: Map<string, string>
  commentImageUrlMap: Map<string, string>
  snapshotWarningMessage: string
}

export interface MonthlyJournalSnapshotRowLike {
  id: string
  space_id: string
  month_key: string
  snapshot_status: 'ready'
  cover_title: string
  cover_subtitle: string
  narrative_blocks: unknown
  metrics_snapshot: unknown
  source_refs: unknown
  created_at: string
  created_by: string | null
}

export async function fetchWishCloudRows(
  supabase: SupabaseClient,
  spaceId: string,
  options: {
    isWishThreadFeatureMissing: (message: string) => boolean
    onWarningMessage: (message: string) => void
  },
): Promise<{ ok: true; data: WishCloudFetchResult } | { ok: false; message: string }> {
  const { data: wishRowsData, error: wishError } = await supabase
    .from('wishes')
    .select('id, space_id, owner_id, title, category, note, priority, scope, status, is_starred, due_date, progress_mode, progress_current, progress_target, progress_unit, completed_at, created_at, updated_at')
    .eq('space_id', spaceId)
    .order('updated_at', { ascending: false })

  if (wishError) {
    return { ok: false, message: `云端愿望同步失败：${wishError.message}` }
  }

  const wishRows = ((wishRowsData ?? []) as WishRowLike[])
  const wishIds = wishRows.map((wish) => wish.id)
  let wishCoinRows: WishCoinRowLike[] = []
  let rewardPoolItemRows: RewardPoolItemRowLike[] = []
  let rewardClaimRows: RewardClaimRowLike[] = []
  let commentRows: WishCommentRowLike[] = []
  let commentImageRows: WishCommentImageRowLike[] = []
  let threadRows: WishThreadRowLike[] = []
  let threadImageRows: WishThreadImageRowLike[] = []
  let threadReactionRows: ThreadReactionRecord[] = []
  let monthlySnapshotRows: MonthlyJournalSnapshotRowLike[] = []
  let hasUnifiedThreadData = false
  let imageRows: WishImageRowLike[] = []
  let stepRows: WishStepRowLike[] = []
  let imageUrlMap = new Map<string, string>()
  let commentImageUrlMap = new Map<string, string>()
  let snapshotWarningMessage = ''

  const { data: rewardPoolItemData, error: rewardPoolItemError } = await supabase
    .from('reward_pool_items')
    .select('id, space_id, owner_id, tier, title, note, star_coin_cost, is_archived, created_at, updated_at')
    .eq('space_id', spaceId)
    .order('updated_at', { ascending: false })

  if (rewardPoolItemError) {
    if (rewardPoolItemError.code !== '42P01' && !/reward_pool_items/i.test(rewardPoolItemError.message)) {
      return { ok: false, message: `云端奖励池同步失败：${rewardPoolItemError.message}` }
    }
  } else {
    rewardPoolItemRows = (rewardPoolItemData ?? []) as RewardPoolItemRowLike[]
  }

  const { data: rewardClaimData, error: rewardClaimError } = await supabase
    .from('reward_claims')
    .select('id, space_id, owner_id, reward_item_id, source_wish_id, source_step_id, claim_kind, quantity, title_snapshot, note_snapshot, star_coin_delta, created_at')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: false })

  if (rewardClaimError) {
    if (rewardClaimError.code !== '42P01' && !/reward_claims/i.test(rewardClaimError.message)) {
      return { ok: false, message: `云端领奖记录同步失败：${rewardClaimError.message}` }
    }
  } else {
    rewardClaimRows = (rewardClaimData ?? []) as RewardClaimRowLike[]
  }

  const { error: ensureMonthlySnapshotsError } = await supabase.rpc('ensure_monthly_journal_snapshots', {
    target_space_id: spaceId,
  })

  if (ensureMonthlySnapshotsError && !options.isWishThreadFeatureMissing(ensureMonthlySnapshotsError.message)) {
    snapshotWarningMessage = `云端月刊补冻结失败：${ensureMonthlySnapshotsError.message}`
    options.onWarningMessage(snapshotWarningMessage)
  }

  const { data: threadData, error: threadError } = await supabase
    .from('wish_threads')
    .select('id, space_id, wish_id, actor_id, event_kind, message_text, meta, created_at, updated_at')
    .eq('space_id', spaceId)
    .order('created_at', { ascending: true })

  if (threadError) {
    if (threadError.code !== '42P01' && !/wish_threads/i.test(threadError.message)) {
      return { ok: false, message: `云端手账同步失败：${threadError.message}` }
    }
  } else {
    hasUnifiedThreadData = true
    threadRows = (threadData ?? []) as WishThreadRowLike[]

    const { data: reactionData, error: reactionError } = await supabase
      .from('thread_reactions')
      .select('id, space_id, target_thread_id, actor_id, emoji, created_at')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: true })

    if (reactionError) {
      if (reactionError.code !== '42P01' && !/thread_reactions/i.test(reactionError.message)) {
        return { ok: false, message: `云端表情回应同步失败：${reactionError.message}` }
      }
    } else {
      threadReactionRows = ((reactionData ?? []) as Array<{ id: string; space_id: string; target_thread_id: string; actor_id: string; emoji: string; created_at: string }>).map((reaction) =>
        createThreadReactionRecord({
          actorId: reaction.actor_id,
          createdAt: reaction.created_at,
          emoji: reaction.emoji,
          id: reaction.id,
          spaceId: reaction.space_id,
          targetThreadId: reaction.target_thread_id,
        }),
      )
    }

    const threadIds = threadRows.map((thread) => thread.id)

    if (threadIds.length) {
      const { data: threadImageData, error: threadImageError } = await supabase
        .from('wish_thread_images')
        .select('id, thread_id, created_by, storage_path, file_name, mime_type, size_bytes, sort_order, created_at')
        .in('thread_id', threadIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (threadImageError) {
        if (threadImageError.code !== '42P01' && !/wish_thread_images/i.test(threadImageError.message)) {
          return { ok: false, message: `云端手账图片同步失败：${threadImageError.message}` }
        }
      } else {
        threadImageRows = (threadImageData ?? []) as WishThreadImageRowLike[]

        if (threadImageRows.length) {
          const { data: signedThreadImageUrls, error: signedThreadImageUrlError } = await supabase.storage
            .from('wish-comment-images')
            .createSignedUrls(threadImageRows.map((image) => image.storage_path), 60 * 60)

          if (signedThreadImageUrlError) {
            options.onWarningMessage(`云端手账图片链接生成失败：${signedThreadImageUrlError.message}`)
          } else {
            const commentImageUrlEntries: Array<[string, string]> = []

            for (const item of signedThreadImageUrls ?? []) {
              if (item.path && item.signedUrl) {
                commentImageUrlEntries.push([item.path, item.signedUrl])
              }
            }

            commentImageUrlMap = new Map<string, string>(commentImageUrlEntries)
          }
        }
      }
    }

    const { data: snapshotData, error: snapshotError } = await supabase
      .from('monthly_journal_snapshots')
      .select('id, space_id, month_key, snapshot_status, cover_title, cover_subtitle, narrative_blocks, metrics_snapshot, source_refs, created_at, created_by')
      .eq('space_id', spaceId)
      .order('month_key', { ascending: false })

    if (snapshotError) {
      if (snapshotError.code !== '42P01' && !/monthly_journal_snapshots/i.test(snapshotError.message)) {
        return { ok: false, message: `云端月刊同步失败：${snapshotError.message}` }
      }
    } else {
      monthlySnapshotRows = (snapshotData ?? []) as MonthlyJournalSnapshotRowLike[]
    }
  }

  if (wishIds.length) {
    const { data: wishCoinData, error: wishCoinError } = await supabase
      .from('wish_coins')
      .select('id, space_id, wish_id, voter_id, cycle_key, amount, created_at')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

    if (wishCoinError) {
      if (wishCoinError.code !== '42P01' && !/wish_coins/i.test(wishCoinError.message)) {
        return { ok: false, message: `云端愿望币同步失败：${wishCoinError.message}` }
      }
    } else {
      wishCoinRows = (wishCoinData ?? []) as WishCoinRowLike[]
    }

    if (!hasUnifiedThreadData) {
      const { data, error: commentError } = await supabase
        .from('wish_comments')
        .select('id, wish_id, author_id, body, created_at')
        .in('wish_id', wishIds)
        .order('created_at', { ascending: false })

      if (commentError) {
        return { ok: false, message: `云端留言同步失败：${commentError.message}` }
      }

      commentRows = (data ?? []) as WishCommentRowLike[]

      const commentIds = commentRows.map((comment) => comment.id)

      if (commentIds.length) {
        const { data: commentImageData, error: commentImageError } = await supabase
          .from('wish_comment_images')
          .select('id, comment_id, created_by, storage_path, file_name, mime_type, size_bytes, sort_order, created_at')
          .in('comment_id', commentIds)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })

        if (commentImageError) {
          return { ok: false, message: `云端留言图片同步失败：${commentImageError.message}` }
        }

        commentImageRows = (commentImageData ?? []) as WishCommentImageRowLike[]

        if (commentImageRows.length) {
          const { data: signedCommentImageUrls, error: signedCommentImageUrlError } = await supabase.storage
            .from('wish-comment-images')
            .createSignedUrls(commentImageRows.map((image) => image.storage_path), 60 * 60)

          if (signedCommentImageUrlError) {
            options.onWarningMessage(`云端留言图片链接生成失败：${signedCommentImageUrlError.message}`)
          } else {
            const commentImageUrlEntries: Array<[string, string]> = []

            for (const item of signedCommentImageUrls ?? []) {
              if (item.path && item.signedUrl) {
                commentImageUrlEntries.push([item.path, item.signedUrl])
              }
            }

            commentImageUrlMap = new Map<string, string>(commentImageUrlEntries)
          }
        }
      }
    }

    const { data: stepData, error: stepError } = await supabase
      .from('wish_steps')
      .select('id, wish_id, title, is_done, sort_order, created_at, updated_at')
      .in('wish_id', wishIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (stepError) {
      return { ok: false, message: `云端步骤同步失败：${stepError.message}` }
    }

    stepRows = (stepData ?? []) as WishStepRowLike[]

    const { data: imageData, error: imageError } = await supabase
      .from('wish_images')
      .select('id, wish_id, created_by, storage_path, file_name, mime_type, note, size_bytes, sort_order, created_at')
      .in('wish_id', wishIds)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (imageError) {
      return { ok: false, message: `云端图片同步失败：${imageError.message}` }
    }

    imageRows = (imageData ?? []) as WishImageRowLike[]

    if (imageRows.length) {
      const { data: signedImageUrls, error: signedImageUrlError } = await supabase.storage
        .from('wish-images')
        .createSignedUrls(imageRows.map((image) => image.storage_path), 60 * 60)

      if (signedImageUrlError) {
        options.onWarningMessage(`云端图片链接生成失败：${signedImageUrlError.message}`)
      } else {
        const imageUrlEntries: Array<[string, string]> = []

        for (const item of signedImageUrls ?? []) {
          if (item.path && item.signedUrl) {
            imageUrlEntries.push([item.path, item.signedUrl])
          }
        }

        imageUrlMap = new Map<string, string>(imageUrlEntries)
      }
    }
  }

  return {
    ok: true,
    data: {
      wishRows,
      wishCoinRows,
      rewardPoolItemRows,
      rewardClaimRows,
      commentRows,
      commentImageRows,
      threadRows,
      threadImageRows,
      threadReactionRows,
      monthlySnapshotRows,
      hasUnifiedThreadData,
      imageRows,
      stepRows,
      imageUrlMap,
      commentImageUrlMap,
      snapshotWarningMessage,
    },
  }
}
