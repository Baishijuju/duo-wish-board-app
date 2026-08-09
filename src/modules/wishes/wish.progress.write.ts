import type { SupabaseClient } from '@supabase/supabase-js'
import { REWARD_CLAIM_EDGE_COPY } from '../../shared/statusSemantics'
import type { RewardPoolItem, WishRecord, WishStep } from '../../stores/wishes'
import { createRewardClaimRecord } from '../rewards/reward.factories'
import { createWishStep } from './wish.factories'

export async function completeWishWithRewardWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  memberId: string | null
  rewardItem: RewardPoolItem | undefined
  rewardItemId: string
  hasWishRewardClaim: boolean
  onLoadingChange: (value: boolean) => void
  onResult: (ok: boolean, message: string) => { ok: boolean; message: string }
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  if (!options.wish || !options.memberId) {
    return options.onResult(false, '当前没有可完成的愿望。')
  }

  if (options.wish.status === 'done') {
    return options.onResult(false, '这个愿望已经完成了。')
  }

  if (options.hasWishRewardClaim) {
    return options.onResult(false, '这条愿望的完成奖励已经领过了。')
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)
    try {
      const { error } = await options.supabase.rpc('complete_wish_with_reward', {
        target_reward_item_id: options.rewardItemId || null,
        target_wish_id: options.wishId,
      })

      if (error) {
        return options.onResult(false, `愿望领奖失败：${error.message}`)
      }

      await options.syncFromSupabase(options.currentSpaceId)
      return options.onResult(true, `这条愿望已经完成，${options.wish.completionStarCoinBonus} 枚星星币已经自动到账。`)
    } finally {
      options.onLoadingChange(false)
    }
  }

  const now = new Date().toISOString()
  return {
    localWish: {
      ...options.wish,
      status: 'done' as const,
      completedAt: now,
      updatedAt: now,
    },
    localClaim: createRewardClaimRecord({
      claimKind: 'wish_completion_bonus',
      createdAt: now,
      noteSnapshot: `完成「${options.wish.title}」时自动获得的额外星星币。`,
      ownerId: options.memberId,
      rewardItemId: null,
      sourceWishId: options.wishId,
      starCoinDelta: options.wish.completionStarCoinBonus,
      titleSnapshot: `${options.wish.completionStarCoinBonus} 星星币`,
    }),
    result: options.onResult(true, `这条愿望已经完成，${options.wish.completionStarCoinBonus} 枚星星币已经自动到账。`),
  }
}

export async function claimCompletedStepRewardWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  stepId: string
  step: WishRecord['steps'][number] | undefined
  memberId: string | null
  claimStarCoin: boolean
  rewardItem: RewardPoolItem | null
  hasStepRewardClaim: boolean
  stepCompletionStarCoinReward: number
  onLoadingChange: (value: boolean) => void
  onResult: (ok: boolean, message: string) => { ok: boolean; message: string }
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  if (!options.wish || !options.step || options.wish.progressMode !== 'steps' || !options.memberId) {
    return options.onResult(false, REWARD_CLAIM_EDGE_COPY.noPendingSmallReward)
  }

  if (!options.step.isDone) {
    return options.onResult(false, '先把这个步骤完成，再来空间页领奖。')
  }

  if (options.hasStepRewardClaim) {
    return options.onResult(false, '这个步骤的小奖励已经领过了。')
  }

  if (!options.claimStarCoin && (!options.rewardItem || options.rewardItem.ownerId !== options.memberId || options.rewardItem.tier !== 'daily' || options.rewardItem.isArchived)) {
    return options.onResult(false, '请从你自己的日常奖励池里挑一个奖励，或者改存星星币。')
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)
    try {
      const { error } = await options.supabase.rpc('claim_completed_step_reward', {
        claim_star_coin: options.claimStarCoin,
        target_reward_item_id: options.rewardItem?.id ?? null,
        target_step_id: options.stepId,
        target_wish_id: options.wishId,
      })

      if (error) {
        return options.onResult(false, `步骤领奖失败：${error.message}`)
      }

      await options.syncFromSupabase(options.currentSpaceId)
      return options.onResult(
        true,
        options.claimStarCoin
          ? `这个步骤的小奖励已经存成 ${options.stepCompletionStarCoinReward} 枚星星币。`
          : `这个步骤的小奖励已经接住「${options.rewardItem?.title ?? ''}」。`,
      )
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    localClaim: createRewardClaimRecord({
      claimKind: options.claimStarCoin ? 'star_coin' : 'step_reward',
      noteSnapshot: options.claimStarCoin ? '完成一个小步骤后，在空间页把这次奖励存成了 1 枚星星币。' : options.rewardItem?.note ?? '',
      ownerId: options.memberId,
      quantity: 1,
      rewardItemId: options.claimStarCoin ? null : options.rewardItem?.id ?? null,
      sourceStepId: options.stepId,
      sourceWishId: options.wishId,
      starCoinDelta: options.claimStarCoin ? options.stepCompletionStarCoinReward : 0,
      titleSnapshot: options.claimStarCoin ? `${options.stepCompletionStarCoinReward} 枚星星币` : options.rewardItem?.title ?? '',
    }),
    result: options.onResult(
      true,
      options.claimStarCoin
        ? `这个步骤的小奖励已经存成 ${options.stepCompletionStarCoinReward} 枚星星币。`
        : `这个步骤的小奖励已经接住「${options.rewardItem?.title ?? ''}」。`,
    ),
  }
}

export async function claimCountProgressRewardWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  memberId: string | null
  claimStarCoin: boolean
  rewardItem: RewardPoolItem | null
  quantity: number
  claimedUnits: number
  onLoadingChange: (value: boolean) => void
  onResult: (ok: boolean, message: string) => { ok: boolean; message: string }
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  const target = options.wish ? Math.max(1, options.wish.progressTarget) : 0
  const current = options.wish ? Math.min(options.wish.progressCurrent, target) : 0
  const pendingUnits = Math.max(current - options.claimedUnits, 0)

  if (!options.wish || options.wish.progressMode !== 'count' || !options.memberId) {
    return options.onResult(false, REWARD_CLAIM_EDGE_COPY.noCountPending)
  }

  if (pendingUnits <= 0) {
    return options.onResult(false, REWARD_CLAIM_EDGE_COPY.noPendingUnits)
  }

  if (options.quantity > pendingUnits) {
    return options.onResult(false, `这条数字进度现在只剩 ${pendingUnits} 点待领取。`)
  }

  if (!options.claimStarCoin && (!options.rewardItem || options.rewardItem.ownerId !== options.memberId || options.rewardItem.tier !== 'daily' || options.rewardItem.isArchived)) {
    return options.onResult(false, '请从你自己的日常奖励池里挑一个奖励，或者改存星星币。')
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)
    try {
      const { error } = await options.supabase.rpc('claim_count_progress_reward', {
        claim_quantity: options.quantity,
        claim_star_coin: options.claimStarCoin,
        target_reward_item_id: options.rewardItem?.id ?? null,
        target_wish_id: options.wishId,
      })

      if (error) {
        return options.onResult(false, `数字进度领奖失败：${error.message}`)
      }

      await options.syncFromSupabase(options.currentSpaceId)
      return options.onResult(
        true,
        options.claimStarCoin
          ? `这 ${options.quantity} 点数字进度已经存成 ${options.quantity} 枚星星币。`
          : `这 ${options.quantity} 点数字进度已经接住「${options.rewardItem?.title ?? ''}」。`,
      )
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    localClaim: createRewardClaimRecord({
      claimKind: options.claimStarCoin ? 'star_coin' : 'count_reward',
      noteSnapshot: options.claimStarCoin ? `数字进度往前推进了 ${options.quantity} 点，在空间页把这次奖励存成了 ${options.quantity} 枚星星币。` : options.rewardItem?.note ?? '',
      ownerId: options.memberId,
      quantity: options.quantity,
      rewardItemId: options.claimStarCoin ? null : options.rewardItem?.id ?? null,
      sourceWishId: options.wishId,
      starCoinDelta: options.claimStarCoin ? options.quantity : 0,
      titleSnapshot: options.claimStarCoin ? `${options.quantity} 枚星星币` : options.rewardItem?.title ?? '',
    }),
    result: options.onResult(
      true,
      options.claimStarCoin
        ? `这 ${options.quantity} 点数字进度已经存成 ${options.quantity} 枚星星币。`
        : `这 ${options.quantity} 点数字进度已经接住「${options.rewardItem?.title ?? ''}」。`,
    ),
  }
}

export async function toggleDoneWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  runCloudMutation: (mutate: () => Promise<{ error: { message: string } | null }>, successMessage: string, options?: { syncAfterWrite?: boolean }) => Promise<boolean>
}) {
  if (!options.wish) {
    return false
  }

  if (options.supabase && options.isUsingCloudWishes) {
    return options.runCloudMutation(
      async () =>
        options.supabase!
          .from('wishes')
          .update({
            completed_at: options.wish!.status === 'done' ? null : new Date().toISOString(),
            status: options.wish!.status === 'done' ? 'active' : 'done',
          })
          .eq('id', options.wishId),
      '愿望状态已同步到 Supabase。',
    )
  }

  const now = new Date().toISOString()
  return {
    localWish: {
      ...options.wish,
      status: options.wish.status === 'done' ? 'active' as const : 'done' as const,
      completedAt: options.wish.status === 'done' ? null : now,
      updatedAt: now,
    },
  }
}

export async function setWishCountProgressWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  wish: WishRecord | undefined
  wishId: string
  normalizedCurrent: number
  runCloudMutation: (mutate: () => Promise<{ error: { message: string } | null }>, successMessage: string, options?: { syncAfterWrite?: boolean }) => Promise<boolean>
  onSyncMessage: (message: string) => void
}) {
  if (!options.wish || options.wish.progressMode !== 'count') {
    return false
  }

  if (options.normalizedCurrent === options.wish.progressCurrent) {
    options.onSyncMessage(options.normalizedCurrent >= Math.max(1, options.wish.progressTarget) ? '已经走到这个阶段的终点了。' : '进度没有变化。')
    return true
  }

  if (options.supabase && options.isUsingCloudWishes) {
    const synced = await options.runCloudMutation(
      async () => {
        const rpcResult = await options.supabase!.rpc('set_wish_count_progress_with_star_coin', {
          next_current: options.normalizedCurrent,
          target_wish_id: options.wishId,
        })

        if (!rpcResult.error) {
          return rpcResult
        }

        const errorMessage = `${rpcResult.error.message || ''} ${rpcResult.error.details || ''} ${rpcResult.error.hint || ''}`
        const canFallbackToDirectProgress = rpcResult.error.code === '42883'
          || /set_wish_count_progress_with_star_coin/i.test(errorMessage)
          || /upsert_wish_thread/i.test(errorMessage)
          || /does not exist|No function matches/i.test(errorMessage)

        if (!canFallbackToDirectProgress) {
          return rpcResult
        }

        const { error: legacyUpdateError } = await options.supabase!
          .from('wishes')
          .update({
            progress_current: options.normalizedCurrent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', options.wishId)

        return { error: legacyUpdateError }
      },
      '进度已同步到 Supabase。',
      { syncAfterWrite: false },
    )

    if (!synced) {
      return false
    }

    return {
      localWish: {
        ...options.wish,
        progressCurrent: options.normalizedCurrent,
        updatedAt: new Date().toISOString(),
      },
      message: '进度已同步到 Supabase。',
      skipLocalClaim: true,
    }
  }

  return {
    localWish: {
      ...options.wish,
      progressCurrent: options.normalizedCurrent,
      updatedAt: new Date().toISOString(),
    },
    message: '已更新当前进度。',
  }
}

export async function addWishStepWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  wish: WishRecord | undefined
  wishId: string
  normalizedTitle: string
  normalizedStarCoinValue: number
  runCloudMutation: (mutate: () => Promise<{ error: { message: string } | null }>, successMessage: string, options?: { syncAfterWrite?: boolean }) => Promise<boolean>
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
}) {
  if (!options.wish || options.wish.progressMode !== 'steps') {
    return false
  }

  if (!options.normalizedTitle) {
    options.onSyncMessage('先写下这个小步骤是什么。')
    return false
  }

  if (options.supabase && options.isUsingCloudWishes) {
    options.onLoadingChange(true)

    try {
      const { data: stepRow, error } = await options.supabase
        .from('wish_steps')
        .insert({
          is_done: false,
          star_coin_value: options.normalizedStarCoinValue,
          title: options.normalizedTitle,
          wish_id: options.wishId,
        })
        .select('id, title, is_done, star_coin_value, created_at, updated_at')
        .single()

      if (error || !stepRow) {
        options.onSyncMessage(`小步骤同步失败：${error?.message ?? '云端没有返回新步骤。'}`)
        return false
      }

      return {
        createdStep: createWishStep({
          id: stepRow.id,
          title: stepRow.title,
          isDone: stepRow.is_done,
          starCoinValue: stepRow.star_coin_value,
          createdAt: stepRow.created_at,
          updatedAt: stepRow.updated_at,
        }),
        message: '小步骤已同步到 Supabase。',
      }
    } finally {
      options.onLoadingChange(false)
    }
  }

  const createdStep: WishStep = createWishStep({ title: options.normalizedTitle, starCoinValue: options.normalizedStarCoinValue })

  return {
    createdStep,
    message: '已添加一个小步骤。',
  }
}

export async function toggleWishStepWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  wish: WishRecord | undefined
  wishId: string
  stepId: string
  step: WishRecord['steps'][number] | undefined
  runCloudMutation: (mutate: () => Promise<{ error: { message: string } | null }>, successMessage: string, options?: { syncAfterWrite?: boolean }) => Promise<boolean>
}) {
  if (!options.wish || !options.step || options.wish.progressMode !== 'steps') {
    return false
  }

  const nextDone = !options.step.isDone

  if (options.supabase && options.isUsingCloudWishes) {
    return options.runCloudMutation(
      async () =>
        options.supabase!.rpc('set_wish_step_done_with_star_coin', {
          next_done: nextDone,
          target_step_id: options.stepId,
          target_wish_id: options.wishId,
        }),
      nextDone ? '步骤和星星币已同步到 Supabase。' : '这个步骤已经放回路上。',
    )
  }

  return {
    localWish: {
      ...options.wish,
      steps: options.wish.steps.map((step) => step.id === options.stepId ? { ...step, isDone: nextDone, updatedAt: new Date().toISOString() } : step),
      updatedAt: new Date().toISOString(),
    },
    message: nextDone ? '已完成一个小步骤。' : '这个步骤已经放回路上。',
  }
}

export async function deleteWishStepWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  wish: WishRecord | undefined
  wishId: string
  stepId: string
  runCloudMutation: (mutate: () => Promise<{ error: { message: string } | null }>, successMessage: string, options?: { syncAfterWrite?: boolean }) => Promise<boolean>
}) {
  const nextSteps = options.wish?.steps.filter((step) => step.id !== options.stepId) ?? []

  if (!options.wish || nextSteps.length === options.wish.steps.length || options.wish.progressMode !== 'steps') {
    return false
  }

  if (options.supabase && options.isUsingCloudWishes) {
    const synced = await options.runCloudMutation(
      async () =>
        options.supabase!
          .from('wish_steps')
          .delete()
          .eq('id', options.stepId)
          .eq('wish_id', options.wishId),
      '已删除这个小步骤。',
      { syncAfterWrite: false },
    )

    if (!synced) {
      return false
    }

    return {
      localWish: {
        ...options.wish,
        steps: nextSteps,
        updatedAt: new Date().toISOString(),
      },
      message: '已删除这个小步骤。',
    }
  }

  return {
    localWish: {
      ...options.wish,
      steps: nextSteps,
      updatedAt: new Date().toISOString(),
    },
    message: '已删除这个小步骤。',
  }
}
