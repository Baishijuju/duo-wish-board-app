import type { SupabaseClient } from '@supabase/supabase-js'
import type { RewardActionResult, RewardPoolItem, RewardTier } from '../../stores/wishes'
import { createRewardClaimRecord, createRewardPoolItem } from './reward.factories'

export async function addRewardPoolItemWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  memberId: string | null
  input: {
    tier: RewardTier
    title: string
    note?: string
    starCoinCost?: number
  }
  onLoadingChange: (value: boolean) => void
  onResult: (result: RewardActionResult) => RewardActionResult
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  const normalizedTitle = options.input.title.trim()
  const normalizedNote = options.input.note?.trim() ?? ''
  const normalizedCost = options.input.tier === 'premium'
    ? Math.max(0, Math.round(Number(options.input.starCoinCost ?? 0) || 0))
    : 0

  if (!options.memberId) {
    return options.onResult({ ok: false, message: '当前会话缺少领奖身份，请先切换到具体成员。' })
  }

  if (!normalizedTitle) {
    return options.onResult({ ok: false, message: '先写下这条奖励是什么。' })
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)

    try {
      const { error } = await options.supabase.from('reward_pool_items').insert({
        is_archived: false,
        note: normalizedNote,
        owner_id: options.memberId,
        space_id: options.currentSpaceId,
        star_coin_cost: normalizedCost,
        tier: options.input.tier,
        title: normalizedTitle,
      })

      if (error) {
        return options.onResult({ ok: false, message: `奖励池写入失败：${error.message}` })
      }

      await options.syncFromSupabase(options.currentSpaceId)
      return options.onResult({
        ok: true,
        message: `已把「${normalizedTitle}」放进你的${options.input.tier === 'premium' ? '高档' : '日常'}奖励池。`,
      })
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    localItem: createRewardPoolItem({
      note: normalizedNote,
      ownerId: options.memberId,
      starCoinCost: normalizedCost,
      tier: options.input.tier,
      title: normalizedTitle,
    }),
    result: options.onResult({
      ok: true,
      message: `已把「${normalizedTitle}」放进你的${options.input.tier === 'premium' ? '高档' : '日常'}奖励池。`,
    }),
  }
}

export async function updateRewardPoolItemWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  memberId: string | null
  item: RewardPoolItem | undefined
  itemId: string
  updates: {
    title?: string
    note?: string
    starCoinCost?: number
  }
  onLoadingChange: (value: boolean) => void
  onResult: (result: RewardActionResult) => RewardActionResult
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  if (!options.memberId || !options.item || options.item.ownerId !== options.memberId) {
    return options.onResult({ ok: false, message: '只能修改你自己的奖励池条目。' })
  }

  const nextTitle = typeof options.updates.title === 'string' ? options.updates.title.trim() : options.item.title
  const nextNote = typeof options.updates.note === 'string' ? options.updates.note.trim() : options.item.note
  const nextCost = options.item.tier === 'premium'
    ? Math.max(0, Math.round(Number(options.updates.starCoinCost ?? options.item.starCoinCost) || 0))
    : 0

  if (!nextTitle) {
    return options.onResult({ ok: false, message: '奖励名称不能为空。' })
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)

    try {
      const { error } = await options.supabase
        .from('reward_pool_items')
        .update({
          note: nextNote,
          star_coin_cost: nextCost,
          title: nextTitle,
        })
        .eq('id', options.itemId)

      if (error) {
        return options.onResult({ ok: false, message: `奖励池更新失败：${error.message}` })
      }

      await options.syncFromSupabase(options.currentSpaceId)
      return options.onResult({ ok: true, message: `已更新「${nextTitle}」。` })
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    nextItem: {
      ...options.item,
      title: nextTitle,
      note: nextNote,
      starCoinCost: nextCost,
      updatedAt: new Date().toISOString(),
    },
    result: options.onResult({ ok: true, message: `已更新「${nextTitle}」。` }),
  }
}

export async function archiveRewardPoolItemWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  memberId: string | null
  item: RewardPoolItem | undefined
  itemId: string
  onLoadingChange: (value: boolean) => void
  onResult: (result: RewardActionResult) => RewardActionResult
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  if (!options.memberId || !options.item || options.item.ownerId !== options.memberId) {
    return options.onResult({ ok: false, message: '只能整理你自己的奖励池条目。' })
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)

    try {
      const { error } = await options.supabase
        .from('reward_pool_items')
        .update({ is_archived: true })
        .eq('id', options.itemId)

      if (error) {
        return options.onResult({ ok: false, message: `奖励池整理失败：${error.message}` })
      }

      await options.syncFromSupabase(options.currentSpaceId)
      return options.onResult({ ok: true, message: `已把「${options.item.title}」收进已领取档案。` })
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    nextItem: {
      ...options.item,
      isArchived: true,
      updatedAt: new Date().toISOString(),
    },
    result: options.onResult({ ok: true, message: `已把「${options.item.title}」收进已领取档案。` }),
  }
}

export async function redeemPremiumRewardWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  memberId: string | null
  rewardItem: RewardPoolItem | undefined
  rewardItemId: string
  currentBalance: number
  onLoadingChange: (value: boolean) => void
  onResult: (result: RewardActionResult) => RewardActionResult
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  if (!options.memberId || !options.rewardItem || options.rewardItem.ownerId !== options.memberId || options.rewardItem.tier !== 'premium' || options.rewardItem.isArchived) {
    return options.onResult({ ok: false, message: '只能兑换你自己的高档奖励。' })
  }

  if (options.rewardItem.starCoinCost <= 0) {
    return options.onResult({ ok: false, message: '这条高档奖励还没有设置星星币价格。' })
  }

  if (options.currentBalance < options.rewardItem.starCoinCost) {
    return options.onResult({ ok: false, message: `还差 ${options.rewardItem.starCoinCost - options.currentBalance} 枚星星币。` })
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)

    try {
      const { error } = await options.supabase.rpc('redeem_premium_reward', {
        target_reward_item_id: options.rewardItemId,
      })

      if (error) {
        return options.onResult({ ok: false, message: `高档奖励兑换失败：${error.message}` })
      }

      await options.syncFromSupabase(options.currentSpaceId)
      return options.onResult({ ok: true, message: `已用 ${options.rewardItem.starCoinCost} 枚星星币兑换「${options.rewardItem.title}」。` })
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    localClaim: createRewardClaimRecord({
      claimKind: 'premium_redeem',
      noteSnapshot: options.rewardItem.note,
      ownerId: options.memberId,
      quantity: 1,
      rewardItemId: options.rewardItem.id,
      starCoinDelta: -options.rewardItem.starCoinCost,
      titleSnapshot: options.rewardItem.title,
    }),
    result: options.onResult({ ok: true, message: `已用 ${options.rewardItem.starCoinCost} 枚星星币兑换「${options.rewardItem.title}」。` }),
  }
}
