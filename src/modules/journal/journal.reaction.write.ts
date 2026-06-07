import type { SupabaseClient } from '@supabase/supabase-js'
import type { ThreadReactionRecord, WishActionResult, WishThreadEntry } from '../../stores/wishes'
import { createThreadReactionRecord } from './journal.factories'

type ToggleThreadReactionWriteResult =
  | WishActionResult
  | {
      ok: true
      message: string
      nextReactions: ThreadReactionRecord[]
      removedReactionId: string | null
    }

export async function toggleThreadReactionWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  thread: WishThreadEntry | undefined
  threadId: string
  memberId: string | null
  normalizedEmoji: string
  existingReaction: ThreadReactionRecord | undefined
  existingMemberReactionCount: number
  maxPerMember: number
  allowsLegacyCapabilityFallback: boolean
  isWishThreadFeatureMissing: (message: string) => boolean
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncAfterWrite?: boolean
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}): Promise<ToggleThreadReactionWriteResult> {
  if (!options.thread || !options.memberId) {
    return { ok: false, message: '当前没有可以回应的手账记录。' } satisfies WishActionResult
  }

  if (!options.normalizedEmoji) {
    return { ok: false, message: '先选一个表情再回应。' } satisfies WishActionResult
  }

  if (!options.existingReaction && options.existingMemberReactionCount >= options.maxPerMember) {
    return { ok: false, message: `同一条记录里，每位成员最多保留 ${options.maxPerMember} 个表情回应。` } satisfies WishActionResult
  }

  const successMessage = options.existingReaction ? '已取消这个表情回应。' : '已留下这个表情回应。'

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)

    try {
      const mutationResult = options.existingReaction
        ? await options.supabase.from('thread_reactions').delete().eq('id', options.existingReaction.id)
        : await options.supabase.from('thread_reactions').insert({
          actor_id: options.memberId,
          emoji: options.normalizedEmoji,
          space_id: options.currentSpaceId,
          target_thread_id: options.threadId,
        }).select('id, created_at').single()

      const error = mutationResult.error

      if (error) {
        const nextMessage = options.allowsLegacyCapabilityFallback && options.isWishThreadFeatureMissing(error.message)
          ? `表情回应失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 手账 migration。`
          : `表情回应失败：${error.message}`

        options.onSyncMessage(nextMessage)
        return { ok: false, message: nextMessage } satisfies WishActionResult
      }

      if (options.syncAfterWrite ?? true) {
        await options.syncFromSupabase(options.currentSpaceId)
      }

      options.onSyncMessage(successMessage)
      return {
        ok: true,
        message: successMessage,
        nextReactions: options.existingReaction
          ? []
          : [
              createThreadReactionRecord({
                id: 'data' in mutationResult && mutationResult.data?.id ? mutationResult.data.id : undefined,
                actorId: options.memberId,
                createdAt: 'data' in mutationResult && mutationResult.data?.created_at ? mutationResult.data.created_at : undefined,
                emoji: options.normalizedEmoji,
                spaceId: options.currentSpaceId,
                targetThreadId: options.threadId,
              }),
            ],
        removedReactionId: options.existingReaction?.id ?? null,
      }
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    ok: true,
    message: successMessage,
    nextReactions: options.existingReaction
      ? []
      : [
          createThreadReactionRecord({
            actorId: options.memberId,
            emoji: options.normalizedEmoji,
            spaceId: options.thread.spaceId,
            targetThreadId: options.threadId,
          }),
        ],
    removedReactionId: options.existingReaction?.id ?? null,
  }
}
