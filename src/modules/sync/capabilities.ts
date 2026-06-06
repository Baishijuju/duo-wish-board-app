import type { SupabaseClient } from '@supabase/supabase-js'

export interface AppCapabilities {
  hasBoundSpaceMemberships: boolean
  hasWishProgress: boolean
  hasWishCommentImages: boolean
  hasWishCoins: boolean
  hasRewardPools: boolean
  hasUnifiedThreads: boolean
  hasMonthlySnapshots: boolean
  hasWishImageNote: boolean
  hasWishImageCover: boolean
  hasWishImageOrder: boolean
  hasMonthlySnapshotBackfill: boolean
}

export type AppCapabilityKey = keyof AppCapabilities
export type AppCapabilitiesStatus = 'idle' | 'loading' | 'ready' | 'fallback' | 'error'

export interface AppCapabilityAccess {
  hasKnownCapabilities: boolean
  hasCapability: (key: AppCapabilityKey) => boolean
  getCapabilityHint: (key: AppCapabilityKey) => string
}

const DEFAULT_APP_CAPABILITIES: AppCapabilities = {
  hasBoundSpaceMemberships: false,
  hasWishProgress: false,
  hasWishCommentImages: false,
  hasWishCoins: false,
  hasRewardPools: false,
  hasUnifiedThreads: false,
  hasMonthlySnapshots: false,
  hasWishImageNote: false,
  hasWishImageCover: false,
  hasWishImageOrder: false,
  hasMonthlySnapshotBackfill: false,
}

const APP_CAPABILITY_MISSING_MESSAGES: Record<AppCapabilityKey, string> = {
  hasBoundSpaceMemberships: '当前 Supabase 环境还没有固定邮箱绑定能力，请先执行新的空间绑定 migration。',
  hasWishProgress: '当前 Supabase 环境还没有愿望进度能力，请先执行新的进度 migration。',
  hasWishCommentImages: '当前 Supabase 环境还没有留言图片能力，请先执行新的留言图片 migration。',
  hasWishCoins: '当前 Supabase 环境还没有愿望币能力，请先执行新的愿望币 migration。',
  hasRewardPools: '当前 Supabase 环境还没有奖励池能力，请先执行新的奖励 migration。',
  hasUnifiedThreads: '当前 Supabase 环境还没有手账主链能力，请先执行新的手账 migration。',
  hasMonthlySnapshots: '当前 Supabase 环境还没有月刊快照能力，请先执行新的手账 migration。',
  hasWishImageNote: '当前 Supabase 环境还没有图片备注能力，请先执行新的图片备注 migration。',
  hasWishImageCover: '当前 Supabase 环境还没有首图设置能力，请先执行新的图片排序 migration。',
  hasWishImageOrder: '当前 Supabase 环境还没有图片排序能力，请先执行新的图片排序 migration。',
  hasMonthlySnapshotBackfill: '当前 Supabase 环境还没有月刊补冻结能力，请先执行新的手账 migration。',
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function readBoolean(source: Record<string, unknown>, snakeCaseKey: string, camelCaseKey: AppCapabilityKey) {
  return source[snakeCaseKey] === true || source[camelCaseKey] === true
}

export function createDefaultAppCapabilities(): AppCapabilities {
  return { ...DEFAULT_APP_CAPABILITIES }
}

export function normalizeAppCapabilities(value: unknown): AppCapabilities {
  const source = isPlainRecord(value) ? value : {}

  return {
    hasBoundSpaceMemberships: readBoolean(source, 'has_bound_space_memberships', 'hasBoundSpaceMemberships'),
    hasWishProgress: readBoolean(source, 'has_wish_progress', 'hasWishProgress'),
    hasWishCommentImages: readBoolean(source, 'has_wish_comment_images', 'hasWishCommentImages'),
    hasWishCoins: readBoolean(source, 'has_wish_coins', 'hasWishCoins'),
    hasRewardPools: readBoolean(source, 'has_reward_pools', 'hasRewardPools'),
    hasUnifiedThreads: readBoolean(source, 'has_unified_threads', 'hasUnifiedThreads'),
    hasMonthlySnapshots: readBoolean(source, 'has_monthly_snapshots', 'hasMonthlySnapshots'),
    hasWishImageNote: readBoolean(source, 'has_wish_image_note', 'hasWishImageNote'),
    hasWishImageCover: readBoolean(source, 'has_wish_image_cover', 'hasWishImageCover'),
    hasWishImageOrder: readBoolean(source, 'has_wish_image_order', 'hasWishImageOrder'),
    hasMonthlySnapshotBackfill: readBoolean(source, 'has_monthly_snapshot_backfill', 'hasMonthlySnapshotBackfill'),
  }
}

export function getCapabilityMissingMessage(key: AppCapabilityKey) {
  return APP_CAPABILITY_MISSING_MESSAGES[key]
}

export function shouldUseAppCapability(
  access: Pick<AppCapabilityAccess, 'hasKnownCapabilities' | 'hasCapability'>,
  key: AppCapabilityKey,
) {
  return !access.hasKnownCapabilities || access.hasCapability(key)
}

export function getKnownAppCapabilityMessage(access: AppCapabilityAccess, key: AppCapabilityKey) {
  return access.hasKnownCapabilities && !access.hasCapability(key)
    ? access.getCapabilityHint(key)
    : null
}

export function shouldRefreshAppCapabilities(status: AppCapabilitiesStatus) {
  return status === 'idle' || status === 'error'
}

export async function fetchAppCapabilities(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('get_app_capabilities')

  if (error) {
    if (error.code === '42883' || isAppCapabilitiesFunctionMissing(error.message)) {
      return {
        ok: false as const,
        reason: 'unsupported' as const,
        message: '当前环境还没有 get_app_capabilities()，前端会继续使用兼容兜底。',
      }
    }

    return {
      ok: false as const,
      reason: 'error' as const,
      message: `读取应用能力失败：${error.message}`,
    }
  }

  return {
    ok: true as const,
    capabilities: normalizeAppCapabilities(data),
  }
}

export function isAppCapabilitiesFunctionMissing(message: string) {
  return /get_app_capabilities/i.test(message)
}

export function isBoundSpaceMembershipFeatureMissing(message: string) {
  return /ensure_bound_space_memberships|bind_email_to_space|space_email_bindings/i.test(message)
}

export function isRewardFeatureMissing(message: string) {
  return /reward_pool_items|reward_claims|complete_wish_with_reward|claim_completed_step_reward|claim_count_progress_reward|redeem_premium_reward/i.test(message)
}

export function isWishThreadFeatureMissing(message: string) {
  return /wish_threads|wish_thread_images|thread_reactions|monthly_journal_snapshots|ensure_monthly_journal_snapshots/i.test(message)
}

export function isWishCoinFeatureMissing(message: string) {
  return /cast_wish_coin|wish_coins/i.test(message)
}

export function isWishProgressFeatureMissing(message: string) {
  return /progress_mode|progress_current|progress_target|progress_unit|wish_steps|wish_progress_mode/i.test(message)
}

export function isWishCommentImageFeatureMissing(message: string) {
  return /wish_comment_images/i.test(message)
}

export function isWishImageNoteFeatureMissing(message: string) {
  return /wish_images\.note|column .*note.*wish_images|update_wish_image_note/i.test(message)
}
