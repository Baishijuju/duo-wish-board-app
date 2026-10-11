import type { SupabaseClient } from '@supabase/supabase-js'
import type { AppCapabilities } from './capabilities'
import type { ThreadReactionRecord } from '../../stores/wishes'
import { createThreadReactionRecord } from '../journal/journal.factories'
import type {
  RewardClaimRowLike,
  RewardPoolItemRowLike,
  WishCommentImageRowLike,
  WishCommentRowLike,
  WishImageRowLike,
  WishRowLike,
  WishStepRowLike,
} from '../wishes/wish.mapping.cloud'
import type { WishThreadImageRowLike, WishThreadRowLike } from '../journal/journal.mapping.cloud'

const SIGNED_URL_TTL_SECONDS = 60 * 60
const SIGNED_URL_CACHE_TTL_MS = 55 * 60 * 1000
const THREAD_IMAGE_QUERY_BATCH_SIZE = 100
const DETAIL_THREAD_PAGE_SIZE = 100
const BEIJING_TIME_OFFSET_MS = 8 * 60 * 60 * 1000

interface SignedUrlCacheEntry {
  expiresAt: number
  signedUrl: string
}

const signedUrlCache = new Map<string, SignedUrlCacheEntry>()

export function createThreadImageQueryBatches(threadIds: string[]) {
  const batches: string[][] = []

  for (let index = 0; index < threadIds.length; index += THREAD_IMAGE_QUERY_BATCH_SIZE) {
    batches.push(threadIds.slice(index, index + THREAD_IMAGE_QUERY_BATCH_SIZE))
  }

  return batches
}

export function getCurrentMonthThreadStartIso(now = new Date()) {
  const beijingNow = new Date(now.getTime() + BEIJING_TIME_OFFSET_MS)
  const beijingTodayStartUtc = Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth(),
    1,
  ) - BEIJING_TIME_OFFSET_MS

  return new Date(beijingTodayStartUtc).toISOString()
}

export async function fetchRewardClaimsForReview(
  supabase: SupabaseClient,
  spaceId: string,
  rangeStart: string,
  rangeEnd: string,
) {
  const { data, error } = await supabase.rpc('get_reward_claim_review_data', {
    range_end: rangeEnd,
    range_start: rangeStart,
    target_space_id: spaceId,
  })

  if (error) {
    return { ok: false as const, message: `回顾流水读取失败：${error.message}` }
  }

  const payload = data && typeof data === 'object' && !Array.isArray(data)
    ? data as { claims?: unknown; opening_balances?: unknown }
    : {}
  const openingBalances = Array.isArray(payload.opening_balances)
    ? payload.opening_balances as Array<{ owner_id: string; balance: number }>
    : []

  return {
    ok: true as const,
    data: {
      claims: Array.isArray(payload.claims) ? payload.claims as RewardClaimRowLike[] : [],
      openingBalances,
    },
  }
}

/**
 * 按需拉取月刊快照（回顾页专用）。
 *
 * 从主同步中移出的两件事：
 *   1. monthly_journal_snapshots 查询本身 —— 单次实测 1,053 KB / 2,820 ms，
 *      而消费方只有回顾页（useReviewPageState → Stats.vue）。
 *   2. ensure_monthly_journal_snapshots 补冻结 RPC —— 实测 372 ms 却只返回 2 字节，
 *      且它的作用同样只体现在月刊快照上。
 *
 * 现在只有真正打开回顾页时才会付出这两项开销。
 */
export async function fetchMonthlyJournalSnapshots(
  supabase: SupabaseClient,
  spaceId: string,
  onWarningMessage: (message: string) => void = () => {},
) {
  const { error: ensureError } = await supabase.rpc('ensure_monthly_journal_snapshots', {
    target_space_id: spaceId,
  })

  // 函数不存在时不打扰用户（旧环境可能没执行对应 migration）
  if (ensureError && ensureError.code !== '42883' && !/ensure_monthly_journal_snapshots/i.test(ensureError.message)) {
    onWarningMessage(`云端月刊补冻结失败：${ensureError.message}`)
  }

  const { data, error } = await supabase
    .from('monthly_journal_snapshots')
    .select('id, space_id, month_key, snapshot_status, cover_title, cover_subtitle, narrative_blocks, metrics_snapshot, source_refs, created_at, created_by')
    .eq('space_id', spaceId)
    .order('month_key', { ascending: false })

  if (error) {
    return { ok: false as const, message: `云端月刊同步失败：${error.message}` }
  }

  return {
    ok: true as const,
    data: (data ?? []) as MonthlyJournalSnapshotRowLike[],
  }
}

export async function fetchWishThreadRowsForWish(
  supabase: SupabaseClient,
  spaceId: string,
  wishId: string,
  onWarningMessage: (message: string) => void,
) {
  const threadRows: WishThreadRowLike[] = []

  for (let offset = 0; ; offset += DETAIL_THREAD_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('wish_threads')
      .select('id, space_id, wish_id, actor_id, event_kind, message_text, meta, created_at, updated_at')
      .eq('space_id', spaceId)
      .eq('wish_id', wishId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + DETAIL_THREAD_PAGE_SIZE - 1)

    if (error) {
      return { ok: false as const, message: `愿望手账读取失败：${error.message}` }
    }

    const pageRows = (data ?? []) as WishThreadRowLike[]
    threadRows.push(...pageRows)

    if (pageRows.length < DETAIL_THREAD_PAGE_SIZE) {
      break
    }
  }

  const threadImageRows: WishThreadImageRowLike[] = []
  const threadReactionRows: ThreadReactionRecord[] = []
  const threadIds = threadRows.map((thread) => thread.id)

  for (const threadIdBatch of createThreadImageQueryBatches(threadIds)) {
    const [imageResult, reactionResult] = await Promise.all([
      supabase
        .from('wish_thread_images')
        .select('id, thread_id, created_by, storage_path, file_name, mime_type, size_bytes, sort_order, created_at')
        .in('thread_id', threadIdBatch)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('thread_reactions')
        .select('id, space_id, target_thread_id, actor_id, emoji, created_at')
        .eq('space_id', spaceId)
        .in('target_thread_id', threadIdBatch)
        .order('created_at', { ascending: true }),
    ])

    if (imageResult.error) {
      return { ok: false as const, message: `愿望手账图片读取失败：${imageResult.error.message}` }
    }

    if (reactionResult.error) {
      return { ok: false as const, message: `愿望手账回应读取失败：${reactionResult.error.message}` }
    }

    threadImageRows.push(...((imageResult.data ?? []) as WishThreadImageRowLike[]))
    threadReactionRows.push(...((reactionResult.data ?? []) as Array<{
      id: string
      space_id: string
      target_thread_id: string
      actor_id: string
      emoji: string
      created_at: string
    }>).map((reaction) => createThreadReactionRecord({
      actorId: reaction.actor_id,
      createdAt: reaction.created_at,
      emoji: reaction.emoji,
      id: reaction.id,
      spaceId: reaction.space_id,
      targetThreadId: reaction.target_thread_id,
    })))
  }

  const imageUrlMap = threadImageRows.length
    ? await createCachedSignedUrlMap(
      supabase,
      'wish-comment-images',
      threadImageRows.map((image) => image.storage_path),
      onWarningMessage,
      '云端手账图片链接生成失败',
    )
    : new Map<string, string>()

  return {
    ok: true as const,
    data: { imageUrlMap, threadImageRows, threadReactionRows, threadRows },
  }
}

export interface WishCloudFetchResult {
  wishRows: WishRowLike[]
  rewardPoolItemRows: RewardPoolItemRowLike[]
  rewardClaimRows: RewardClaimRowLike[]
  rewardClaimSummaryRows: RewardClaimRowLike[]
  latestRewardClaimRows: RewardClaimRowLike[]
  hasRewardClaimSummary: boolean
  commentRows: WishCommentRowLike[]
  commentImageRows: WishCommentImageRowLike[]
  threadRows: WishThreadRowLike[]
  threadImageRows: WishThreadImageRowLike[]
  threadReactionRows: ThreadReactionRecord[]
  hasUnifiedThreadData: boolean
  imageRows: WishImageRowLike[]
  stepRows: WishStepRowLike[]
  countProgressDailyRows: WishCountProgressDailyRowLike[]
  imageUrlMap: Map<string, string>
  commentImageUrlMap: Map<string, string>
}

export interface WishCountProgressDailyRowLike {
  wish_id: string
  owner_id: string
  progress_date: string
  progress_units: number
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

function getSignedUrlCacheKey(bucketName: string, storagePath: string) {
  return `${bucketName}:${storagePath}`
}

function getCachedSignedUrl(bucketName: string, storagePath: string, now = Date.now()) {
  const cacheKey = getSignedUrlCacheKey(bucketName, storagePath)
  const entry = signedUrlCache.get(cacheKey)

  if (!entry) {
    return null
  }

  if (entry.expiresAt <= now) {
    signedUrlCache.delete(cacheKey)
    return null
  }

  return entry.signedUrl
}

async function createCachedSignedUrlMap(
  supabase: SupabaseClient,
  bucketName: string,
  storagePaths: string[],
  onWarningMessage: (message: string) => void,
  warningPrefix: string,
) {
  const uniqueStoragePaths = Array.from(new Set(storagePaths.filter(Boolean)))
  const signedUrlMap = new Map<string, string>()
  const missingStoragePaths: string[] = []
  const now = Date.now()

  for (const storagePath of uniqueStoragePaths) {
    const cachedUrl = getCachedSignedUrl(bucketName, storagePath, now)

    if (cachedUrl) {
      signedUrlMap.set(storagePath, cachedUrl)
    } else {
      missingStoragePaths.push(storagePath)
    }
  }

  if (!missingStoragePaths.length) {
    return signedUrlMap
  }

  const { data: signedUrls, error: signedUrlError } = await supabase.storage
    .from(bucketName)
    .createSignedUrls(missingStoragePaths, SIGNED_URL_TTL_SECONDS)

  if (signedUrlError) {
    onWarningMessage(`${warningPrefix}：${signedUrlError.message}`)
    return signedUrlMap
  }

  const expiresAt = Date.now() + SIGNED_URL_CACHE_TTL_MS

  for (const item of signedUrls ?? []) {
    if (item.path && item.signedUrl) {
      signedUrlMap.set(item.path, item.signedUrl)
      signedUrlCache.set(getSignedUrlCacheKey(bucketName, item.path), {
        expiresAt,
        signedUrl: item.signedUrl,
      })
    }
  }

  return signedUrlMap
}

export async function fetchWishCloudRows(
  supabase: SupabaseClient,
  spaceId: string,
  options: {
    capabilities: AppCapabilities | null
    isWishThreadFeatureMissing: (message: string) => boolean
    onWarningMessage: (message: string) => void
  },
): Promise<{ ok: true; data: WishCloudFetchResult } | { ok: false; message: string }> {
  const allowsLegacyCapabilityFallback = !options.capabilities

  // ---- 提前发起「只依赖 spaceId」的查询 ----
  //
  // PostgREST 的 builder 是惰性的：只有 then/await 时才真正发请求。
  // 用 Promise.resolve 在这里立即触发，它们就会与下面的 wishes 查询并行在途，
  // 而不是等 wishes 返回后再逐个串行 —— 每省一轮就少等约 200-450ms。
  //
  // 只预发「主路径」的那一次请求；依赖其结果的旧版兼容回退仍保持串行（极少触发）。

  const rewardPoolAttemptPromise = (!options.capabilities || options.capabilities.hasRewardPools)
    ? Promise.resolve(
        supabase
          .from('reward_pool_items')
          .select('id, space_id, owner_id, reward_scope, tier, title, note, star_coin_cost, is_archived, created_at, updated_at')
          .eq('space_id', spaceId)
          .order('updated_at', { ascending: false }),
      )
    : null

  const rewardClaimPayloadPromise = options.capabilities?.hasRewardClaimSummary && (!options.capabilities || options.capabilities.hasRewardPools)
    ? Promise.resolve(
        supabase.rpc('get_reward_claim_sync_payload', { target_space_id: spaceId }),
      )
    : null

  // 能力未知或没有汇总能力时，走的是这条旧版全量查询（实测 398 KB / 530 ms）。
  // 同样提前发起；只有极少数情况（汇总 RPC 意外失败）才会重新发一次。
  const buildLegacyRewardClaimQuery = () =>
    supabase
      .from('reward_claims')
      .select('id, owner_id, reward_item_id, source_wish_id, source_step_id, claim_kind, quantity, title_snapshot, note_snapshot, star_coin_delta, created_at')
      .eq('space_id', spaceId)
      .order('created_at', { ascending: false })

  const rewardClaimLegacyPromise = (!options.capabilities || options.capabilities.hasRewardPools) && !options.capabilities?.hasRewardClaimSummary
    ? Promise.resolve(buildLegacyRewardClaimQuery())
    : null

  const threadRowsPromise = (!options.capabilities || options.capabilities.hasUnifiedThreads)
    ? Promise.all([
        Promise.resolve(
          supabase
            .from('wish_threads')
            .select('id, space_id, wish_id, actor_id, event_kind, message_text, meta, created_at, updated_at')
            .eq('space_id', spaceId)
            .gte('created_at', getCurrentMonthThreadStartIso())
            .order('created_at', { ascending: false }),
        ),
        Promise.resolve(
          supabase
            .from('wish_threads')
            .select('id, space_id, wish_id, actor_id, event_kind, message_text, meta, created_at, updated_at')
            .eq('space_id', spaceId)
            .order('created_at', { ascending: false })
            .limit(1),
        ),
      ])
    : null

  const threadReactionsPromise = (!options.capabilities || options.capabilities.hasUnifiedThreads)
    ? Promise.resolve(
        supabase
          .from('thread_reactions')
          .select('id, space_id, target_thread_id, actor_id, emoji, created_at')
          .eq('space_id', spaceId)
          .order('created_at', { ascending: true }),
      )
    : null

  const wishRowsResult = !options.capabilities || options.capabilities.hasWishProgress
    ? await supabase
      .from('wishes')
      .select('id, space_id, owner_id, title, category, note, scope, status, is_starred, progress_mode, progress_current, progress_target, progress_unit, progress_star_coin_value, completion_star_coin_bonus, completed_at, created_at, updated_at')
      .eq('space_id', spaceId)
      .order('updated_at', { ascending: false })
    : await supabase
      .from('wishes')
      .select('id, space_id, owner_id, title, category, note, scope, status, is_starred, completed_at, created_at, updated_at')
      .eq('space_id', spaceId)
      .order('updated_at', { ascending: false })

  const { data: wishRowsData, error: wishError } = wishRowsResult

  if (wishError) {
    return { ok: false, message: `云端愿望同步失败：${wishError.message}` }
  }

  const wishRows = ((wishRowsData ?? []) as WishRowLike[])
  const wishIds = wishRows.map((wish) => wish.id)
  let rewardPoolItemRows: RewardPoolItemRowLike[] = []
  let rewardClaimRows: RewardClaimRowLike[] = []
  let rewardClaimSummaryRows: RewardClaimRowLike[] = []
  let latestRewardClaimRows: RewardClaimRowLike[] = []
  let hasRewardClaimSummary = false
  let commentRows: WishCommentRowLike[] = []
  let commentImageRows: WishCommentImageRowLike[] = []
  let threadRows: WishThreadRowLike[] = []
  let threadImageRows: WishThreadImageRowLike[] = []
  let threadReactionRows: ThreadReactionRecord[] = []
  let hasUnifiedThreadData = false
  let imageRows: WishImageRowLike[] = []
  let stepRows: WishStepRowLike[] = []
  let countProgressDailyRows: WishCountProgressDailyRowLike[] = []
  let imageUrlMap = new Map<string, string>()
  let commentImageUrlMap = new Map<string, string>()

  if (rewardPoolAttemptPromise) {
    const { data: rewardPoolItemData, error: rewardPoolItemError } = await rewardPoolAttemptPromise

    if (rewardPoolItemError) {
      const isMissingRewardScope = rewardPoolItemError.code === '42703' || /reward_scope/i.test(rewardPoolItemError.message)

      if (isMissingRewardScope) {
        const { data: legacyRewardPoolItemData, error: legacyRewardPoolItemError } = await supabase
          .from('reward_pool_items')
          .select('id, space_id, owner_id, tier, title, note, star_coin_cost, is_archived, created_at, updated_at')
          .eq('space_id', spaceId)
          .order('updated_at', { ascending: false })

        if (legacyRewardPoolItemError) {
          return { ok: false, message: `云端奖励池同步失败：${legacyRewardPoolItemError.message}` }
        }

        rewardPoolItemRows = (legacyRewardPoolItemData ?? []) as RewardPoolItemRowLike[]
      } else if (!allowsLegacyCapabilityFallback || (rewardPoolItemError.code !== '42P01' && !/reward_pool_items/i.test(rewardPoolItemError.message))) {
        return { ok: false, message: `云端奖励池同步失败：${rewardPoolItemError.message}` }
      }
    } else {
      rewardPoolItemRows = (rewardPoolItemData ?? []) as RewardPoolItemRowLike[]
    }
  }

  if (!options.capabilities || options.capabilities.hasRewardPools) {
    let shouldFetchLegacyRewardClaims = !options.capabilities?.hasRewardClaimSummary

    if (rewardClaimPayloadPromise) {
      const { data, error } = await rewardClaimPayloadPromise

      if (error) {
        const summaryRpcMissing = error.code === '42883' || /get_reward_claim_sync_payload/i.test(error.message)

        if (!summaryRpcMissing) {
          return { ok: false, message: `云端奖励流水汇总同步失败：${error.message}` }
        }

        shouldFetchLegacyRewardClaims = true
      } else {
        const payload = data && typeof data === 'object' && !Array.isArray(data)
          ? data as { summary_claims?: unknown; recent_claims?: unknown; latest_claims?: unknown }
          : {}
        rewardClaimSummaryRows = Array.isArray(payload.summary_claims) ? payload.summary_claims as RewardClaimRowLike[] : []
        rewardClaimRows = Array.isArray(payload.recent_claims) ? payload.recent_claims as RewardClaimRowLike[] : []
        latestRewardClaimRows = Array.isArray(payload.latest_claims) ? payload.latest_claims as RewardClaimRowLike[] : []
        hasRewardClaimSummary = true
      }
    }

    if (shouldFetchLegacyRewardClaims) {
      const { data: rewardClaimData, error: rewardClaimError } = await (rewardClaimLegacyPromise ?? buildLegacyRewardClaimQuery())

      if (rewardClaimError) {
        if (!allowsLegacyCapabilityFallback || (rewardClaimError.code !== '42P01' && !/reward_claims/i.test(rewardClaimError.message))) {
          return { ok: false, message: `云端领奖记录同步失败：${rewardClaimError.message}` }
        }
      } else {
        rewardClaimRows = (rewardClaimData ?? []) as RewardClaimRowLike[]
        latestRewardClaimRows = rewardClaimRows.slice(0, 8)
      }
    }
  }

  // 注意：ensure_monthly_journal_snapshots 补冻结 RPC 也已移出主同步，
  // 改由 fetchMonthlyJournalSnapshots() 在回顾页按需执行。

  if (threadRowsPromise && threadReactionsPromise) {
    const [threadResult, latestThreadResult] = await threadRowsPromise
    const threadError = threadResult.error ?? latestThreadResult.error

    if (threadError) {
      if (!allowsLegacyCapabilityFallback || (threadError.code !== '42P01' && !/wish_threads/i.test(threadError.message))) {
        return { ok: false, message: `云端手账同步失败：${threadError.message}` }
      }
    } else {
      hasUnifiedThreadData = true
      const rowsById = new Map<string, WishThreadRowLike>()
      ;[...(threadResult.data ?? []), ...(latestThreadResult.data ?? [])].forEach((thread) => {
        const row = thread as WishThreadRowLike
        rowsById.set(row.id, row)
      })
      threadRows = [...rowsById.values()]
      const threadIds = threadRows.map((thread) => thread.id)

      const fetchThreadImages = async () => {
        const rows: WishThreadImageRowLike[] = []

        for (const threadIdBatch of createThreadImageQueryBatches(threadIds)) {
          const { data, error } = await supabase
            .from('wish_thread_images')
            .select('id, thread_id, created_by, storage_path, file_name, mime_type, size_bytes, sort_order, created_at')
            .in('thread_id', threadIdBatch)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true })

          if (error) {
            return { data: null, error }
          }

          rows.push(...((data ?? []) as WishThreadImageRowLike[]))
        }

        return { data: rows, error: null }
      }

      const [reactionResult, threadImageResult] = await Promise.all([
        threadReactionsPromise,
        fetchThreadImages(),
      ])

      if (reactionResult.error) {
        const reactionError = reactionResult.error

        if (!allowsLegacyCapabilityFallback || (reactionError.code !== '42P01' && !/thread_reactions/i.test(reactionError.message))) {
          return { ok: false, message: `云端表情回应同步失败：${reactionError.message}` }
        }
      } else {
        threadReactionRows = ((reactionResult.data ?? []) as Array<{ id: string; space_id: string; target_thread_id: string; actor_id: string; emoji: string; created_at: string }>).map((reaction) =>
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

      if (threadIds.length) {
        if (threadImageResult.error) {
          const threadImageError = threadImageResult.error

          if (!allowsLegacyCapabilityFallback || (threadImageError.code !== '42P01' && !/wish_thread_images/i.test(threadImageError.message))) {
            return { ok: false, message: `云端手账图片同步失败：${threadImageError.message}` }
          }
        } else {
          threadImageRows = (threadImageResult.data ?? []) as WishThreadImageRowLike[]

          if (threadImageRows.length) {
            commentImageUrlMap = await createCachedSignedUrlMap(
              supabase,
              'wish-comment-images',
              threadImageRows.map((image) => image.storage_path),
              options.onWarningMessage,
              '云端手账图片链接生成失败',
            )
          }
        }
      }
    }
  }

  // 注意：月刊快照（monthly_journal_snapshots）**不在这里拉取**。
  // 它是回顾页专用数据，单次可达 1 MB 以上（实测 1,053 KB / 2,820 ms），
  // 却在每次登录或刷新时被无条件加载，占当时同步总耗时约 31%。
  // 现已改为由回顾页挂载时按需调用 fetchMonthlyJournalSnapshots()。

  if (wishIds.length) {
    const wantsSteps = !options.capabilities || options.capabilities.hasWishProgress

    // 这四个查询彼此独立，只依赖 wishIds。
    // 原先逐个 await 串行执行，每一步都要等上一轮网络往返（实测约 350ms/次）。
    // PostgREST builder 是惰性的（只有 then/await 时才发请求），所以交给
    // Promise.all 即可真正并发在途。
    const [commentResult, stepResult, dailyResult, imageResult] = await Promise.all([
      supabase
        .from('wish_comments')
        .select('id, wish_id, author_id, body, created_at')
        .in('wish_id', wishIds)
        .order('created_at', { ascending: false }),

      wantsSteps
        ? supabase
            .from('wish_steps')
            .select('id, wish_id, title, star_coin_value, is_done, created_at, updated_at')
            .in('wish_id', wishIds)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [] as WishStepRowLike[], error: null }),

      supabase
        .from('wish_count_progress_daily')
        .select('wish_id, owner_id, progress_date, progress_units')
        .in('wish_id', wishIds)
        .eq('space_id', spaceId),

      supabase
        .from('wish_images')
        .select('id, wish_id, created_by, storage_path, file_name, mime_type, note, size_bytes, sort_order, created_at')
        .in('wish_id', wishIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ])

    // ---- 留言 ----
    if (commentResult.error) {
      const allowsMissingLegacyComments = hasUnifiedThreadData
        && (commentResult.error.code === '42P01' || /wish_comments/i.test(commentResult.error.message))

      if (!allowsMissingLegacyComments) {
        return { ok: false, message: `云端留言同步失败：${commentResult.error.message}` }
      }
    } else {
      commentRows = (commentResult.data ?? []) as WishCommentRowLike[]
    }

    // ---- 留言图片（依赖上面的 commentIds，属于第二轮）----
    const commentIds = commentRows.map((comment) => comment.id)

    if (commentIds.length && (!options.capabilities || options.capabilities.hasWishCommentImages)) {
      const { data: commentImageData, error: commentImageError } = await supabase
        .from('wish_comment_images')
        .select('id, comment_id, created_by, storage_path, file_name, mime_type, size_bytes, sort_order, created_at')
        .in('comment_id', commentIds)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (commentImageError) {
        const allowsMissingLegacyCommentImages = hasUnifiedThreadData
          && (commentImageError.code === '42P01' || /wish_comment_images/i.test(commentImageError.message))

        if (!allowsMissingLegacyCommentImages) {
          return { ok: false, message: `云端留言图片同步失败：${commentImageError.message}` }
        }
      } else {
        commentImageRows = (commentImageData ?? []) as WishCommentImageRowLike[]
      }

      if (commentImageRows.length) {
        commentImageUrlMap = await createCachedSignedUrlMap(
          supabase,
          'wish-comment-images',
          commentImageRows.map((image) => image.storage_path),
          options.onWarningMessage,
          '云端留言图片链接生成失败',
        )
      }
    }

    // ---- 步骤 ----
    if (stepResult.error) {
      return { ok: false, message: `云端步骤同步失败：${stepResult.error.message}` }
    }

    stepRows = (stepResult.data ?? []) as WishStepRowLike[]

    // ---- 每日推进投影 ----
    if (dailyResult.error) {
      const allowsMissingDailyTableFallback = allowsLegacyCapabilityFallback || options.capabilities?.hasWishProgress === false

      if (!allowsMissingDailyTableFallback || (dailyResult.error.code !== '42P01' && !/wish_count_progress_daily/i.test(dailyResult.error.message))) {
        return { ok: false, message: `云端每日推进同步失败：${dailyResult.error.message}` }
      }
    } else {
      countProgressDailyRows = (dailyResult.data ?? []) as WishCountProgressDailyRowLike[]
    }

    // ---- 愿望图片 ----
    if (imageResult.error) {
      return { ok: false, message: `云端图片同步失败：${imageResult.error.message}` }
    }

    imageRows = (imageResult.data ?? []) as WishImageRowLike[]

    if (imageRows.length) {
      imageUrlMap = await createCachedSignedUrlMap(
        supabase,
        'wish-images',
        imageRows.map((image) => image.storage_path),
        options.onWarningMessage,
        '云端图片链接生成失败',
      )
    }
  }

  return {
    ok: true,
    data: {
      wishRows,
      rewardPoolItemRows,
      rewardClaimRows,
      rewardClaimSummaryRows,
      latestRewardClaimRows,
      hasRewardClaimSummary,
      commentRows,
      commentImageRows,
      threadRows,
      threadImageRows,
      threadReactionRows,
      hasUnifiedThreadData,
      imageRows,
      stepRows,
      countProgressDailyRows,
      imageUrlMap,
      commentImageUrlMap,
    },
  }
}
