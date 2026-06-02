import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export type WishStatus = 'active' | 'done'
export type WishPriority = 'high' | 'medium' | 'low'
export type WishScope = 'shared' | 'private'
export type WishProgressMode = 'none' | 'count' | 'steps'
export type RewardTier = 'daily' | 'premium'
export type RewardClaimKind = 'step_reward' | 'wish_reward' | 'count_reward' | 'star_coin' | 'premium_redeem'
export type WishBottleColorTier = 'blue' | 'green' | 'orange' | 'gold' | 'rainbow'
export type WishThreadEventKind =
  | 'comment'
  | 'wish_published'
  | 'wish_step_completed'
  | 'wish_coin_cast'
  | 'reward_claimed'
  | 'wish_completed'
  | 'weekly_welfare_issued'
  | 'dragon_ball_reached'
  | 'premium_redeem'
export type MonthlyJournalSnapshotStatus = 'ready'

const STORAGE_KEY = 'duo-wish-board-app:v3'
const LEGACY_STORAGE_KEYS = ['duo-wish-board-app:v2'] as const
const WISH_IMAGE_BUCKET = 'wish-images'
const WISH_COMMENT_IMAGE_BUCKET = 'wish-comment-images'
const WISH_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const WISH_IMAGE_SOURCE_MAX_BYTES = 25 * 1024 * 1024
const WISH_IMAGE_COMPRESS_MAX_EDGE = 2048
const WISH_IMAGE_COMPRESS_TARGET_BYTES = 1800 * 1024
const DUE_SOON_WINDOW_DAYS = 14
const RECENTLY_COMPLETED_WINDOW_DAYS = 30
const SUPABASE_FREE_FILE_STORAGE_BYTES = 1024 * 1024 * 1024
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000
const BEIJING_TIME_OFFSET_MS = 8 * 60 * 60 * 1000
const WISH_COIN_CYCLE_BOUNDARY_DAY = 5
const WISH_COIN_CYCLE_BOUNDARY_HOUR = 20
const WISH_IMAGE_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const WISH_IMAGE_COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const WISH_IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const WISH_IMAGE_COMPRESS_QUALITY_STEPS = [0.92, 0.88, 0.84, 0.8]

export const WISH_COIN_BUDGET_PER_CYCLE = 3
export const DRAGON_BALL_COIN_TARGET = 7
export const STEP_COMPLETION_STAR_COIN_REWARD = 1

export interface WishDraft {
  title: string
  category: string
  priority: WishPriority
  dueDate: string
  note: string
  ownerId: string
  scope: WishScope
  progressMode: WishProgressMode
  progressCurrent: number
  progressTarget: number
  progressUnit: string
}

export interface WishComment {
  id: string
  authorId: string
  message: string
  images: WishImage[]
  createdAt: string
}

export interface WishImage {
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

export interface WishCoinRecord {
  id: string
  wishId: string
  voterId: string
  cycleKey: string
  amount: number
  createdAt: string
}

export interface WishCoinMemberSummary {
  memberId: string
  displayName: string
  total: number
}

export interface WishCoinSnapshot {
  currentCycleTotal: number
  isDragonBallReady: boolean
  memberTotals: WishCoinMemberSummary[]
  remainingToDragonBall: number
  total: number
}

export interface WishBottleSnapshot {
  activeWishCount: number
  colorTier: WishBottleColorTier
  completedCountUnits: number
  completedStepStarCount: number
  completedTrackedUnits: number
  isRainbowGlow: boolean
  overallPercent: number
  progressedCountWishCount: number
  progressedWishCount: number
  totalCountUnits: number
  totalTrackedUnits: number
  trackedWishCount: number
}

export interface RewardPoolItem {
  id: string
  ownerId: string
  tier: RewardTier
  title: string
  note: string
  starCoinCost: number
  isArchived: boolean
  createdAt: string
  updatedAt: string
}

export interface RewardClaimRecord {
  id: string
  ownerId: string
  rewardItemId: string | null
  sourceWishId: string | null
  sourceStepId: string | null
  claimKind: RewardClaimKind
  quantity: number
  titleSnapshot: string
  noteSnapshot: string
  starCoinDelta: number
  createdAt: string
}

export interface PendingStepRewardEntry {
  completedAt: string
  stepId: string
  stepTitle: string
  wishId: string
  wishTitle: string
}

export interface PendingCountRewardSummary {
  pendingUnits: number
  progressCurrent: number
  progressTarget: number
  progressUnit: string
  updatedAt: string
  wishId: string
  wishTitle: string
}

export interface ThreadReactionSummary {
  emoji: string
  count: number
  memberIds: string[]
}

export interface ThreadReactionRecord {
  id: string
  spaceId: string | null
  targetThreadId: string
  actorId: string
  emoji: string
  createdAt: string
}

export interface WishThreadEntry {
  id: string
  spaceId: string | null
  wishId: string | null
  actorId: string | null
  eventKind: WishThreadEventKind
  messageText: string
  images: WishImage[]
  reactions: ThreadReactionSummary[]
  meta: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface MonthlyJournalSnapshotRecord {
  id: string
  spaceId: string | null
  monthKey: string
  snapshotStatus: MonthlyJournalSnapshotStatus
  coverTitle: string
  coverSubtitle: string
  narrativeBlocks: Array<Record<string, unknown>>
  metricsSnapshot: Record<string, unknown>
  sourceRefs: Array<Record<string, unknown>>
  createdAt: string
  createdBy: string | null
}

export interface WishStep {
  id: string
  title: string
  isDone: boolean
  createdAt: string
  updatedAt: string
}

export interface WishProgressSnapshot {
  mode: WishProgressMode
  current: number
  target: number
  percent: number
  label: string
  pendingStepTitles: string[]
  isReady: boolean
}

export interface WishRecord {
  id: string
  title: string
  category: string
  priority: WishPriority
  dueDate: string
  note: string
  ownerId: string
  scope: WishScope
  status: WishStatus
  starred: boolean
  progressMode: WishProgressMode
  progressCurrent: number
  progressTarget: number
  progressUnit: string
  completedAt: string | null
  steps: WishStep[]
  comments: WishComment[]
  images: WishImage[]
  createdAt: string
  updatedAt: string
}

export interface WishBackupPayload {
  version: 6
  exportedAt: string
  space: {
    dataMode: 'mock' | 'supabase'
    id: string | null
    inviteCode: string
    memberCount: number
    name: string
  }
  coins: WishCoinRecord[]
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
  rewardClaims: RewardClaimRecord[]
  rewardPoolItems: RewardPoolItem[]
  threadReactions: ThreadReactionRecord[]
  threads: WishThreadEntry[]
  wishes: WishRecord[]
}

export interface WishActionResult {
  ok: boolean
  message: string
}

export interface RewardActionResult {
  ok: boolean
  message: string
}

interface WishRow {
  id: string
  space_id: string
  owner_id: string
  title: string
  category: string
  note: string
  priority: WishPriority
  scope: WishScope
  status: WishStatus
  is_starred: boolean
  due_date: string | null
  progress_mode: WishProgressMode | null
  progress_current: number | null
  progress_target: number | null
  progress_unit: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface PersistedWishState {
  version: 6
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
  rewardClaims: RewardClaimRecord[]
  rewardPoolItems: RewardPoolItem[]
  threadReactions: ThreadReactionRecord[]
  wishes: WishRecord[]
  coins: WishCoinRecord[]
}

interface WishCommentRow {
  id: string
  wish_id: string
  author_id: string
  body: string
  created_at: string
}

interface WishCommentImageRow {
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

interface WishImageRow {
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

interface WishStepRow {
  id: string
  wish_id: string
  title: string
  is_done: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface WishCoinRow {
  id: string
  space_id: string
  wish_id: string
  voter_id: string
  cycle_key: string
  amount: number
  created_at: string
}

interface RewardPoolItemRow {
  id: string
  space_id: string
  owner_id: string
  tier: RewardTier
  title: string
  note: string
  star_coin_cost: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

interface RewardClaimRow {
  id: string
  space_id: string
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

interface WishThreadRow {
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

interface WishThreadImageRow {
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

interface ThreadReactionRow {
  id: string
  space_id: string
  target_thread_id: string
  actor_id: string
  emoji: string
  created_at: string
}

interface MonthlyJournalSnapshotRow {
  id: string
  space_id: string
  month_key: string
  snapshot_status: MonthlyJournalSnapshotStatus
  cover_title: string
  cover_subtitle: string
  narrative_blocks: unknown
  metrics_snapshot: unknown
  source_refs: unknown
  created_at: string
  created_by: string | null
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `wish-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createWishComment(partial: Partial<WishComment> & Pick<WishComment, 'authorId' | 'message'>): WishComment {
  return {
    id: partial.id ?? createId(),
    authorId: partial.authorId,
    message: partial.message.trim(),
    images: Array.isArray(partial.images) ? partial.images.map((image) => createWishImage(image)) : [],
    createdAt: partial.createdAt ?? new Date().toISOString(),
  }
}

function createWishImage(partial: Partial<WishImage> & Pick<WishImage, 'fileName' | 'mimeType' | 'sizeBytes' | 'storagePath'>): WishImage {
  return {
    id: partial.id ?? createId(),
    createdAt: partial.createdAt ?? new Date().toISOString(),
    createdBy: partial.createdBy ?? '',
    fileName: partial.fileName.trim(),
    mimeType: partial.mimeType.trim(),
    note: partial.note?.trim() ?? '',
    sizeBytes: partial.sizeBytes,
    storagePath: partial.storagePath.trim(),
    url: partial.url ?? '',
  }
}

function createWishStep(partial: Partial<WishStep> & Pick<WishStep, 'title'>): WishStep {
  const createdAt = partial.createdAt ?? new Date().toISOString()

  return {
    id: partial.id ?? createId(),
    title: partial.title.trim(),
    isDone: partial.isDone ?? false,
    createdAt,
    updatedAt: partial.updatedAt ?? createdAt,
  }
}

function createWishCoinRecord(
  partial: Partial<WishCoinRecord> & Pick<WishCoinRecord, 'wishId' | 'voterId' | 'cycleKey'>,
): WishCoinRecord {
  const normalizedAmount = Math.max(1, Math.round(Number(partial.amount ?? 1) || 1))

  return {
    id: partial.id ?? createId(),
    wishId: partial.wishId,
    voterId: partial.voterId,
    cycleKey: partial.cycleKey.trim(),
    amount: normalizedAmount,
    createdAt: partial.createdAt ?? new Date().toISOString(),
  }
}

function createRewardPoolItem(
  partial: Partial<RewardPoolItem> & Pick<RewardPoolItem, 'ownerId' | 'tier' | 'title'>,
): RewardPoolItem {
  const createdAt = partial.createdAt ?? new Date().toISOString()

  return {
    id: partial.id ?? createId(),
    ownerId: partial.ownerId,
    tier: partial.tier,
    title: partial.title.trim(),
    note: partial.note?.trim() ?? '',
    starCoinCost: Math.max(0, Math.round(Number(partial.starCoinCost ?? 0) || 0)),
    isArchived: partial.isArchived ?? false,
    createdAt,
    updatedAt: partial.updatedAt ?? createdAt,
  }
}

function createRewardClaimRecord(
  partial: Partial<RewardClaimRecord> & Pick<RewardClaimRecord, 'ownerId' | 'claimKind' | 'titleSnapshot'>,
): RewardClaimRecord {
  return {
    id: partial.id ?? createId(),
    ownerId: partial.ownerId,
    rewardItemId: partial.rewardItemId ?? null,
    sourceWishId: partial.sourceWishId ?? null,
    sourceStepId: partial.sourceStepId ?? null,
    claimKind: partial.claimKind,
    quantity: Math.max(1, Math.trunc(Number(partial.quantity ?? 1) || 1)),
    titleSnapshot: partial.titleSnapshot.trim(),
    noteSnapshot: partial.noteSnapshot?.trim() ?? '',
    starCoinDelta: Math.trunc(Number(partial.starCoinDelta ?? 0) || 0),
    createdAt: partial.createdAt ?? new Date().toISOString(),
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function createThreadReactionRecord(
  partial: Partial<ThreadReactionRecord> & Pick<ThreadReactionRecord, 'targetThreadId' | 'actorId' | 'emoji'>,
): ThreadReactionRecord {
  return {
    id: partial.id ?? createId(),
    spaceId: partial.spaceId ?? null,
    targetThreadId: partial.targetThreadId,
    actorId: partial.actorId,
    emoji: partial.emoji.trim(),
    createdAt: partial.createdAt ?? new Date().toISOString(),
  }
}

function createWishThreadEntry(
  partial: Partial<WishThreadEntry> & Pick<WishThreadEntry, 'eventKind' | 'messageText'>,
): WishThreadEntry {
  const createdAt = partial.createdAt ?? new Date().toISOString()

  return {
    id: partial.id ?? createId(),
    spaceId: partial.spaceId ?? null,
    wishId: partial.wishId ?? null,
    actorId: partial.actorId ?? null,
    eventKind: partial.eventKind,
    messageText: partial.messageText.trim(),
    images: Array.isArray(partial.images) ? partial.images.map((image) => createWishImage(image)) : [],
    reactions: Array.isArray(partial.reactions)
      ? partial.reactions
        .filter((reaction): reaction is ThreadReactionSummary => !!reaction && typeof reaction.emoji === 'string')
        .map((reaction) => ({
          count: Math.max(1, Math.round(Number(reaction.count) || 1)),
          emoji: reaction.emoji.trim(),
          memberIds: Array.isArray(reaction.memberIds)
            ? reaction.memberIds.filter((memberId): memberId is string => typeof memberId === 'string' && !!memberId)
            : [],
        }))
      : [],
    meta: isPlainRecord(partial.meta) ? { ...partial.meta } : {},
    createdAt,
    updatedAt: partial.updatedAt ?? createdAt,
  }
}

function createMonthlyJournalSnapshotRecord(
  partial: Partial<MonthlyJournalSnapshotRecord> & Pick<MonthlyJournalSnapshotRecord, 'monthKey' | 'coverTitle'>,
): MonthlyJournalSnapshotRecord {
  return {
    id: partial.id ?? createId(),
    spaceId: partial.spaceId ?? null,
    monthKey: partial.monthKey,
    snapshotStatus: partial.snapshotStatus ?? 'ready',
    coverTitle: partial.coverTitle.trim(),
    coverSubtitle: partial.coverSubtitle?.trim() ?? '',
    narrativeBlocks: Array.isArray(partial.narrativeBlocks)
      ? partial.narrativeBlocks.filter(isPlainRecord).map((block) => ({ ...block }))
      : [],
    metricsSnapshot: isPlainRecord(partial.metricsSnapshot) ? { ...partial.metricsSnapshot } : {},
    sourceRefs: Array.isArray(partial.sourceRefs)
      ? partial.sourceRefs.filter(isPlainRecord).map((sourceRef) => ({ ...sourceRef }))
      : [],
    createdAt: partial.createdAt ?? new Date().toISOString(),
    createdBy: partial.createdBy ?? null,
  }
}

function compareIsoAscending(leftDateValue: string, rightDateValue: string) {
  return new Date(leftDateValue).getTime() - new Date(rightDateValue).getTime()
}

function getBeijingMonthKey(dateValue: Date | number | string = new Date()) {
  const rawTimestamp = dateValue instanceof Date
    ? dateValue.getTime()
    : typeof dateValue === 'number'
      ? dateValue
      : new Date(dateValue).getTime()
  const baseTimestamp = Number.isNaN(rawTimestamp) ? Date.now() : rawTimestamp
  const shiftedDate = new Date(baseTimestamp + BEIJING_TIME_OFFSET_MS)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')

  return `${year}-${month}`
}

function formatMonthCoverTitle(monthKey: string) {
  const [year = '', month = ''] = monthKey.split('-')
  return `${year}年${month}月 月刊`
}

function buildThreadReactionSummaryMap(reactions: ThreadReactionRecord[]) {
  const threadMap = new Map<string, Map<string, ThreadReactionSummary>>()

  for (const reaction of [...reactions].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt))) {
    const emojiMap = threadMap.get(reaction.targetThreadId) ?? new Map<string, ThreadReactionSummary>()
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

function buildWishThreadEntriesFromRows(
  threadRows: WishThreadRow[],
  threadImageRows: WishThreadImageRow[],
  reactions: ThreadReactionRecord[],
  imageUrlMap: Map<string, string>,
) {
  const imagesByThreadId = new Map<string, WishImage[]>()

  for (const image of [...threadImageRows].sort((left, right) => left.sort_order - right.sort_order || compareIsoAscending(left.created_at, right.created_at))) {
    const threadImages = imagesByThreadId.get(image.thread_id) ?? []

    threadImages.push(
      createWishImage({
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

  return attachThreadReactions(baseEntries, reactions)
}

function buildCommentRowsFromThreadEntries(threadEntries: WishThreadEntry[]): WishCommentRow[] {
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

function buildDerivedWishThreadEntries(
  wishes: WishRecord[],
  coins: WishCoinRecord[],
  rewardClaims: RewardClaimRecord[],
  reactions: ThreadReactionRecord[],
) {
  const wishMap = new Map(wishes.map((wish) => [wish.id, wish]))
  const stepMap = new Map(
    wishes.flatMap((wish) => wish.steps.map((step) => [step.id, { step, wish }] as const)),
  )
  const threadEntries: WishThreadEntry[] = []

  for (const wish of wishes) {
    threadEntries.push(
      createWishThreadEntry({
        actorId: wish.ownerId,
        createdAt: wish.createdAt,
        eventKind: 'wish_published',
        id: `thread-wish-published-${wish.id}`,
        messageText: `认真写下了「${wish.title}」。`,
        meta: {
          priority: wish.priority,
          scope: wish.scope,
          status: wish.status,
        },
        updatedAt: wish.createdAt,
        wishId: wish.id,
      }),
    )

    if (wish.status === 'done') {
      const completedAt = wish.completedAt ?? wish.updatedAt

      threadEntries.push(
        createWishThreadEntry({
          actorId: wish.ownerId,
          createdAt: completedAt,
          eventKind: 'wish_completed',
          id: `thread-wish-completed-${wish.id}`,
          messageText: `把「${wish.title}」收进了回忆里。`,
          meta: {
            completedAt,
            status: wish.status,
          },
          updatedAt: completedAt,
          wishId: wish.id,
        }),
      )
    }

    for (const step of wish.steps.filter((item) => item.isDone)) {
      threadEntries.push(
        createWishThreadEntry({
          actorId: wish.ownerId,
          createdAt: step.updatedAt,
          eventKind: 'wish_step_completed',
          id: `thread-wish-step-${step.id}`,
          messageText: `走完了小步骤「${step.title}」。`,
          meta: {
            stepId: step.id,
            stepTitle: step.title,
            wishTitle: wish.title,
          },
          updatedAt: step.updatedAt,
          wishId: wish.id,
        }),
      )
    }

    for (const comment of wish.comments) {
      threadEntries.push(
        createWishThreadEntry({
          actorId: comment.authorId,
          createdAt: comment.createdAt,
          eventKind: 'comment',
          id: comment.id,
          images: comment.images,
          messageText: comment.message,
          updatedAt: comment.createdAt,
          wishId: wish.id,
        }),
      )
    }
  }

  const coinTotals = new Map<string, number>()
  const dragonBallCompletedWishIds = new Set<string>()

  for (const coin of [...coins].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt) || left.id.localeCompare(right.id))) {
    const wish = wishMap.get(coin.wishId)

    if (!wish) {
      continue
    }

    threadEntries.push(
      createWishThreadEntry({
        actorId: coin.voterId,
        createdAt: coin.createdAt,
        eventKind: 'wish_coin_cast',
        id: `thread-wish-coin-${coin.id}`,
        messageText: `给「${wish.title}」轻轻投下了 1 枚愿望币。`,
        meta: {
          amount: coin.amount,
          cycleKey: coin.cycleKey,
          wishTitle: wish.title,
        },
        updatedAt: coin.createdAt,
        wishId: coin.wishId,
      }),
    )

    const nextCoinTotal = (coinTotals.get(coin.wishId) ?? 0) + coin.amount
    coinTotals.set(coin.wishId, nextCoinTotal)

    if (!dragonBallCompletedWishIds.has(coin.wishId) && nextCoinTotal >= DRAGON_BALL_COIN_TARGET) {
      dragonBallCompletedWishIds.add(coin.wishId)

      threadEntries.push(
        createWishThreadEntry({
          actorId: coin.voterId,
          createdAt: coin.createdAt,
          eventKind: 'dragon_ball_reached',
          id: `thread-dragon-ball-${coin.wishId}`,
          messageText: `「${wish.title}」集齐了七龙珠，神龙开始认真听见这份心愿。`,
          meta: {
            cycleKey: coin.cycleKey,
            totalCoins: nextCoinTotal,
            wishTitle: wish.title,
          },
          updatedAt: coin.createdAt,
          wishId: coin.wishId,
        }),
      )
    }
  }

  for (const claim of rewardClaims) {
    const relatedWish = claim.sourceWishId ? wishMap.get(claim.sourceWishId) ?? null : null
    const relatedStep = claim.sourceStepId ? stepMap.get(claim.sourceStepId)?.step ?? null : null
    const eventKind: WishThreadEventKind = claim.claimKind === 'premium_redeem' ? 'premium_redeem' : 'reward_claimed'
    const countUnitLabel = `${claim.quantity} 点`
    const messageText = claim.claimKind === 'step_reward'
      ? `走完了小步骤「${relatedStep?.title ?? '这个小步骤'}」，也接住了「${claim.titleSnapshot}」。`
      : claim.claimKind === 'count_reward'
        ? `把「${relatedWish?.title ?? '这个数字愿望'}」往前推进了 ${countUnitLabel}，也接住了「${claim.titleSnapshot}」。`
      : claim.claimKind === 'wish_reward'
        ? `把「${relatedWish?.title ?? claim.titleSnapshot}」认真完成，也接住了「${claim.titleSnapshot}」。`
        : claim.claimKind === 'star_coin'
          ? claim.sourceStepId
            ? `完成了小步骤「${relatedStep?.title ?? '这个小步骤'}」，把这次奖励存成了 ${Math.abs(claim.starCoinDelta)} 枚星星币。`
            : `把「${relatedWish?.title ?? '这个数字愿望'}」往前推进了 ${countUnitLabel}，并存下了 ${Math.abs(claim.starCoinDelta)} 枚星星币。`
          : `用 ${Math.abs(claim.starCoinDelta)} 枚星星币换来了「${claim.titleSnapshot}」。`

    threadEntries.push(
      createWishThreadEntry({
        actorId: claim.ownerId,
        createdAt: claim.createdAt,
        eventKind,
        id: `thread-reward-claim-${claim.id}`,
        messageText,
        meta: {
          claimKind: claim.claimKind,
          noteSnapshot: claim.noteSnapshot,
          quantity: claim.quantity,
          rewardItemId: claim.rewardItemId,
          sourceStepId: claim.sourceStepId,
          sourceWishId: claim.sourceWishId,
          starCoinDelta: claim.starCoinDelta,
          stepTitle: relatedStep?.title ?? null,
          titleSnapshot: claim.titleSnapshot,
          wishTitle: relatedWish?.title ?? null,
        },
        updatedAt: claim.createdAt,
        wishId: claim.sourceWishId,
      }),
    )
  }

  return attachThreadReactions(threadEntries, reactions)
}

function reorderImagesByIds(images: WishImage[], orderedImageIds: string[]) {
  const imageMap = new Map(images.map((image) => [image.id, image]))
  const reorderedImages = orderedImageIds
    .map((imageId) => imageMap.get(imageId))
    .filter((image): image is WishImage => !!image)

  return reorderedImages.length === images.length ? reorderedImages : null
}

function getWishImageExtension(fileName: string, mimeType: string) {
  const trimmedName = fileName.trim()
  const dotIndex = trimmedName.lastIndexOf('.')

  if (dotIndex >= 0 && dotIndex < trimmedName.length - 1) {
    return trimmedName.slice(dotIndex + 1).toLowerCase()
  }

  return WISH_IMAGE_EXTENSION_BY_TYPE[mimeType] ?? 'bin'
}

function createWishImageStoragePath(wishId: string, uploaderId: string, fileName: string, mimeType: string) {
  return `${wishId}/${uploaderId}/${createId()}.${getWishImageExtension(fileName, mimeType)}`
}

function createWishCommentImageStoragePath(commentId: string, uploaderId: string, fileName: string, mimeType: string) {
  return `${commentId}/${uploaderId}/${createId()}.${getWishImageExtension(fileName, mimeType)}`
}

function createWishImageFileName(fileName: string, mimeType: string) {
  const trimmedName = fileName.trim()
  const dotIndex = trimmedName.lastIndexOf('.')
  const baseName = dotIndex > 0 ? trimmedName.slice(0, dotIndex) : trimmedName || 'image'

  return `${baseName}.${WISH_IMAGE_EXTENSION_BY_TYPE[mimeType] ?? 'bin'}`
}

function getWishImageUploadMimeType(mimeType: string) {
  return mimeType === 'image/png' ? 'image/webp' : mimeType
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality?: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality)
  })
}

function loadWishImageFile(file: File) {
  if (typeof URL === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve<HTMLImageElement | null>(null)
  }

  const objectUrl = URL.createObjectURL(file)

  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(null)
    }

    image.src = objectUrl
  })
}

async function createCompressedWishImageBlob(canvas: HTMLCanvasElement, mimeType: string) {
  if (mimeType === 'image/png') {
    return canvasToBlob(canvas, mimeType)
  }

  for (const quality of WISH_IMAGE_COMPRESS_QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, mimeType, quality)

    if (blob && (blob.size <= WISH_IMAGE_COMPRESS_TARGET_BYTES || quality === WISH_IMAGE_COMPRESS_QUALITY_STEPS.at(-1))) {
      return blob
    }
  }

  return null
}

async function prepareWishImageUpload(file: File) {
  const normalizedType = file.type.trim().toLowerCase()

  if (!WISH_IMAGE_COMPRESSIBLE_TYPES.has(normalizedType) || typeof document === 'undefined') {
    return { compressed: false, file }
  }

  const image = await loadWishImageFile(file)

  if (!image) {
    return { compressed: false, file }
  }

  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height
  const longestEdge = Math.max(sourceWidth, sourceHeight)
  const needsResize = longestEdge > WISH_IMAGE_COMPRESS_MAX_EDGE
  const needsCompress = file.size > WISH_IMAGE_COMPRESS_TARGET_BYTES

  if (!needsResize && !needsCompress) {
    return { compressed: false, file }
  }

  const scale = needsResize ? WISH_IMAGE_COMPRESS_MAX_EDGE / longestEdge : 1
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale))
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    return { compressed: false, file }
  }

  canvas.width = targetWidth
  canvas.height = targetHeight
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  let outputType = getWishImageUploadMimeType(normalizedType)
  let blob = await createCompressedWishImageBlob(canvas, outputType)

  if (!blob && outputType !== normalizedType) {
    outputType = normalizedType
    blob = await createCompressedWishImageBlob(canvas, outputType)
  }

  if (!blob) {
    return { compressed: false, file }
  }

  if (blob.size >= file.size && !needsResize) {
    return { compressed: false, file }
  }

  const nextFile = new File([blob], createWishImageFileName(file.name, outputType), {
    lastModified: file.lastModified,
    type: outputType,
  })

  return {
    compressed: nextFile.size < file.size || outputType !== normalizedType || needsResize,
    file: nextFile,
  }
}

function getLocalDateTimestamp(dateValue: string) {
  const trimmedValue = dateValue.trim()

  if (!trimmedValue) {
    return null
  }

  const [yearText, monthText, dayText] = trimmedValue.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  const timestamp = new Date(year, month - 1, day).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

function getTodayStartTimestamp() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today.getTime()
}

function formatCycleBoundaryKey(shiftedTimestamp: number) {
  const shiftedDate = new Date(shiftedTimestamp)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${shiftedDate.getUTCDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}T20:00:00+08:00`
}

function getWishCoinCycle(dateValue: Date | number | string = new Date()) {
  const rawTimestamp = dateValue instanceof Date
    ? dateValue.getTime()
    : typeof dateValue === 'number'
      ? dateValue
      : new Date(dateValue).getTime()
  const baseTimestamp = Number.isNaN(rawTimestamp) ? Date.now() : rawTimestamp
  const shiftedTimestamp = baseTimestamp + BEIJING_TIME_OFFSET_MS
  const shiftedDate = new Date(shiftedTimestamp)
  const currentWeekMilliseconds = (
    ((shiftedDate.getUTCDay() * 24 + shiftedDate.getUTCHours()) * 60 + shiftedDate.getUTCMinutes()) * 60
    + shiftedDate.getUTCSeconds()
  ) * 1000 + shiftedDate.getUTCMilliseconds()
  const boundaryWeekMilliseconds = ((WISH_COIN_CYCLE_BOUNDARY_DAY * 24 + WISH_COIN_CYCLE_BOUNDARY_HOUR) * 60 * 60) * 1000
  let elapsedSinceBoundary = currentWeekMilliseconds - boundaryWeekMilliseconds

  if (elapsedSinceBoundary < 0) {
    elapsedSinceBoundary += 7 * MILLISECONDS_PER_DAY
  }

  const cycleStartShiftedTimestamp = shiftedTimestamp - elapsedSinceBoundary
  const cycleEndShiftedTimestamp = cycleStartShiftedTimestamp + 7 * MILLISECONDS_PER_DAY

  return {
    endsAt: new Date(cycleEndShiftedTimestamp - BEIJING_TIME_OFFSET_MS).toISOString(),
    key: formatCycleBoundaryKey(cycleStartShiftedTimestamp),
    startsAt: new Date(cycleStartShiftedTimestamp - BEIJING_TIME_OFFSET_MS).toISOString(),
  }
}

function normalizeProgressNumber(value: number | null | undefined) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.max(0, Math.round(numericValue))
}

function normalizeProgressMode(
  progressMode: WishProgressMode | null | undefined,
  steps: WishStep[],
  progressTarget: number,
  progressCurrent: number,
  progressUnit: string,
): WishProgressMode {
  if (progressMode === 'count' || progressMode === 'steps' || progressMode === 'none') {
    return progressMode
  }

  if (steps.length) {
    return 'steps'
  }

  if (progressTarget > 0 || progressCurrent > 0 || progressUnit) {
    return 'count'
  }

  return 'none'
}

function getWishCompletionTimestamp(wish: Pick<WishRecord, 'status' | 'completedAt' | 'updatedAt'>) {
  if (wish.status !== 'done') {
    return null
  }

  const timestamp = new Date(wish.completedAt ?? wish.updatedAt).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

function getWishProgressSnapshot(wish: Pick<WishRecord, 'progressMode' | 'progressCurrent' | 'progressTarget' | 'progressUnit' | 'steps'>): WishProgressSnapshot {
  if (wish.progressMode === 'count') {
    const target = Math.max(1, normalizeProgressNumber(wish.progressTarget))
    const current = Math.min(normalizeProgressNumber(wish.progressCurrent), target)
    const unit = wish.progressUnit.trim()

    return {
      mode: 'count',
      current,
      target,
      percent: Math.round((current / target) * 100),
      label: `${current}/${target}${unit ? ` ${unit}` : ''}`,
      pendingStepTitles: [],
      isReady: current >= target,
    }
  }

  if (wish.progressMode === 'steps') {
    const target = wish.steps.length
    const current = wish.steps.filter((step) => step.isDone).length

    return {
      mode: 'steps',
      current,
      target,
      percent: target ? Math.round((current / target) * 100) : 0,
      label: `${current}/${target} steps`,
      pendingStepTitles: wish.steps.filter((step) => !step.isDone).map((step) => step.title),
      isReady: target > 0 && current >= target,
    }
  }

  return {
    mode: 'none',
    current: 0,
    target: 0,
    percent: 0,
    label: '',
    pendingStepTitles: [],
    isReady: false,
  }
}

function getWishBottleColorTier(percent: number): WishBottleColorTier {
  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent)))

  if (normalizedPercent <= 20) {
    return 'blue'
  }

  if (normalizedPercent <= 40) {
    return 'green'
  }

  if (normalizedPercent <= 60) {
    return 'orange'
  }

  if (normalizedPercent <= 80) {
    return 'gold'
  }

  return 'rainbow'
}

function createWishRecord(partial: Partial<WishRecord> & WishDraft): WishRecord {
  const normalizedSteps = Array.isArray(partial.steps)
    ? partial.steps.map((step) => createWishStep(step)).filter((step) => !!step.title)
    : []
  const rawProgressCurrent = normalizeProgressNumber(partial.progressCurrent)
  const rawProgressTarget = normalizeProgressNumber(partial.progressTarget)
  const rawProgressUnit = partial.progressUnit?.trim() ?? ''
  const progressMode = normalizeProgressMode(partial.progressMode, normalizedSteps, rawProgressTarget, rawProgressCurrent, rawProgressUnit)
  const progressTarget = progressMode === 'count' ? Math.max(1, rawProgressTarget) : rawProgressTarget
  const progressCurrent = progressMode === 'count' ? Math.min(rawProgressCurrent, progressTarget) : rawProgressCurrent
  const createdAt = partial.createdAt ?? new Date().toISOString()
  const updatedAt = partial.updatedAt ?? createdAt
  const status = partial.status ?? 'active'
  const normalizedCompletedAt = typeof partial.completedAt === 'string' && partial.completedAt.trim() ? partial.completedAt : null

  return {
    id: partial.id ?? createId(),
    title: partial.title.trim(),
    category: partial.category.trim(),
    priority: partial.priority,
    dueDate: partial.dueDate,
    note: partial.note.trim(),
    ownerId: partial.ownerId,
    scope: partial.scope,
    status,
    starred: partial.starred ?? false,
    progressMode,
    progressCurrent,
    progressTarget,
    progressUnit: rawProgressUnit,
    completedAt: status === 'done' ? normalizedCompletedAt ?? updatedAt : null,
    steps: normalizedSteps,
    comments: Array.isArray(partial.comments) ? partial.comments.map((comment) => createWishComment(comment)) : [],
    images: Array.isArray(partial.images) ? partial.images.map((image) => createWishImage(image)) : [],
    createdAt,
    updatedAt,
  }
}

const currentSeedCoinCycle = getWishCoinCycle()
const previousSeedCoinCycle = getWishCoinCycle(Date.now() - 7 * MILLISECONDS_PER_DAY)

const seedWishes: WishRecord[] = [
  createWishRecord({
    id: 'wish-shared-trip',
    title: '一起完成一次 10 天长途旅行',
    category: '旅行',
    priority: 'high',
    dueDate: '2026-10-01',
    note: '先把预算、时间窗和三个候选目的地列出来，再决定路线。',
    ownerId: 'member-a',
    scope: 'shared',
    status: 'active',
    starred: true,
    progressMode: 'steps',
    progressCurrent: 0,
    progressTarget: 0,
    progressUnit: '',
    steps: [
      createWishStep({
        id: 'wish-shared-trip-step-budget',
        title: '列出预算和时间窗',
        isDone: true,
        createdAt: '2026-04-21T09:00:00.000Z',
        updatedAt: '2026-04-22T09:00:00.000Z',
      }),
      createWishStep({
        id: 'wish-shared-trip-step-city',
        title: '确定 3 个候选目的地',
        createdAt: '2026-04-22T09:00:00.000Z',
      }),
      createWishStep({
        id: 'wish-shared-trip-step-ticket',
        title: '等行程确认后再订票',
        createdAt: '2026-04-22T09:10:00.000Z',
      }),
    ],
    comments: [
      createWishComment({
        id: 'comment-trip-member-a',
        authorId: 'member-a',
        message: '这条在正式版里就是愿望详情下留言的最小形态。',
        createdAt: '2026-04-24T11:20:00.000Z',
      }),
      createWishComment({
        id: 'comment-trip-member-b',
        authorId: 'member-b',
        message: '后面接 Supabase Realtime 时，这里可以直接替换成云端订阅。',
        createdAt: '2026-04-24T12:05:00.000Z',
      }),
    ],
    createdAt: '2026-04-20T08:00:00.000Z',
    updatedAt: '2026-04-24T12:05:00.000Z',
  }),
  createWishRecord({
    id: 'wish-cert',
    title: '拿下数据分析证书',
    category: '成长',
    priority: 'medium',
    dueDate: '2026-08-15',
    note: '每周完成两个模块，月底做一次模拟题回顾。',
    ownerId: 'member-a',
    scope: 'private',
    status: 'active',
    progressMode: 'count',
    progressCurrent: 3,
    progressTarget: 12,
    progressUnit: '模块',
    steps: [],
    comments: [
      createWishComment({
        id: 'comment-cert-member-a',
        authorId: 'member-a',
        message: '私密愿望在后续会接 RLS 隔离。',
        createdAt: '2026-04-24T09:10:00.000Z',
      }),
    ],
    createdAt: '2026-04-18T07:30:00.000Z',
    updatedAt: '2026-04-24T09:10:00.000Z',
  }),
  createWishRecord({
    id: 'wish-health-run',
    title: '在夏天前累计完成 12 次慢跑',
    category: '健康',
    priority: 'medium',
    dueDate: '2026-07-20',
    note: '每周至少跑两次，先把出门频率养稳，再慢慢拉长距离。',
    ownerId: 'member-b',
    scope: 'shared',
    status: 'active',
    progressMode: 'count',
    progressCurrent: 5,
    progressTarget: 12,
    progressUnit: '次',
    steps: [],
    comments: [
      createWishComment({
        id: 'comment-health-member-a',
        authorId: 'member-a',
        message: '这条会在首页里展示成数字型进度愿望。',
        createdAt: '2026-04-23T18:10:00.000Z',
      }),
    ],
    createdAt: '2026-04-16T09:20:00.000Z',
    updatedAt: '2026-04-23T18:10:00.000Z',
  }),
  createWishRecord({
    id: 'wish-home-corner',
    title: '把客厅整理成周末电影角',
    category: '居家',
    priority: 'low',
    dueDate: '2026-06-18',
    note: '先挑一盏落地灯和一条薄毯，再把零散线材、边桌和投影位收顺。',
    ownerId: 'member-b',
    scope: 'shared',
    status: 'active',
    progressMode: 'none',
    progressCurrent: 0,
    progressTarget: 0,
    progressUnit: '',
    steps: [],
    comments: [
      createWishComment({
        id: 'comment-home-member-b',
        authorId: 'member-b',
        message: '这条故意不设进度，保留成只写下来的轻愿望。',
        createdAt: '2026-04-25T12:30:00.000Z',
      }),
    ],
    createdAt: '2026-04-19T10:10:00.000Z',
    updatedAt: '2026-04-25T12:30:00.000Z',
  }),
  createWishRecord({
    id: 'wish-dinner',
    title: '学会做三道拿手宴客菜',
    category: '生活',
    priority: 'low',
    dueDate: '2026-06-30',
    note: '糖醋排骨、烤鸡和一道甜点，先完成菜单和食材清单。',
    ownerId: 'member-b',
    scope: 'private',
    status: 'done',
    progressMode: 'count',
    progressCurrent: 3,
    progressTarget: 3,
    progressUnit: '道',
    completedAt: '2026-04-22T10:00:00.000Z',
    steps: [],
    comments: [
      createWishComment({
        id: 'comment-dinner-member-b',
        authorId: 'member-b',
        message: '终于能把这三道菜顺着做完一轮了，下次可以直接请你吃。',
        createdAt: '2026-04-22T10:08:00.000Z',
      }),
      createWishComment({
        id: 'comment-dinner-member-a',
        authorId: 'member-a',
        message: '这条会保留成软件里默认的“已完成愿望”示例。',
        createdAt: '2026-04-22T10:16:00.000Z',
      }),
    ],
    createdAt: '2026-04-12T11:00:00.000Z',
    updatedAt: '2026-04-22T10:00:00.000Z',
  }),
]

const seedWishCoins: WishCoinRecord[] = [
  createWishCoinRecord({
    id: 'coin-trip-prev-a-1',
    wishId: 'wish-shared-trip',
    voterId: 'member-a',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-trip-prev-a-2',
    wishId: 'wish-shared-trip',
    voterId: 'member-a',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-trip-prev-b-1',
    wishId: 'wish-shared-trip',
    voterId: 'member-b',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-trip-prev-b-2',
    wishId: 'wish-shared-trip',
    voterId: 'member-b',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-trip-prev-b-3',
    wishId: 'wish-shared-trip',
    voterId: 'member-b',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-trip-current-a-1',
    wishId: 'wish-shared-trip',
    voterId: 'member-a',
    cycleKey: currentSeedCoinCycle.key,
    amount: 1,
    createdAt: currentSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-trip-current-b-1',
    wishId: 'wish-shared-trip',
    voterId: 'member-b',
    cycleKey: currentSeedCoinCycle.key,
    amount: 1,
    createdAt: currentSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-cert-prev-a-1',
    wishId: 'wish-cert',
    voterId: 'member-a',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-cert-prev-a-2',
    wishId: 'wish-cert',
    voterId: 'member-a',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-cert-prev-b-1',
    wishId: 'wish-cert',
    voterId: 'member-b',
    cycleKey: previousSeedCoinCycle.key,
    amount: 1,
    createdAt: previousSeedCoinCycle.startsAt,
  }),
  createWishCoinRecord({
    id: 'coin-cert-current-a-1',
    wishId: 'wish-cert',
    voterId: 'member-a',
    cycleKey: currentSeedCoinCycle.key,
    amount: 1,
    createdAt: currentSeedCoinCycle.startsAt,
  }),
]

const seedThreadReactions: ThreadReactionRecord[] = [
  createThreadReactionRecord({
    id: 'reaction-trip-comment-heart-b',
    targetThreadId: 'comment-trip-member-a',
    actorId: 'member-b',
    emoji: '❤️',
    createdAt: '2026-04-24T11:40:00.000Z',
  }),
  createThreadReactionRecord({
    id: 'reaction-trip-comment-sparkle-a',
    targetThreadId: 'comment-trip-member-b',
    actorId: 'member-a',
    emoji: '✨',
    createdAt: '2026-04-24T12:10:00.000Z',
  }),
  createThreadReactionRecord({
    id: 'reaction-trip-coin-fire-b',
    targetThreadId: 'thread-wish-coin-coin-trip-current-a-1',
    actorId: 'member-b',
    emoji: '🔥',
    createdAt: currentSeedCoinCycle.startsAt,
  }),
  createThreadReactionRecord({
    id: 'reaction-cert-comment-muscle-b',
    targetThreadId: 'comment-cert-member-a',
    actorId: 'member-b',
    emoji: '💪',
    createdAt: '2026-04-24T09:20:00.000Z',
  }),
  createThreadReactionRecord({
    id: 'reaction-home-comment-hand-a',
    targetThreadId: 'comment-home-member-b',
    actorId: 'member-a',
    emoji: '🫶',
    createdAt: '2026-04-25T12:45:00.000Z',
  }),
  createThreadReactionRecord({
    id: 'reaction-dinner-complete-party-a',
    targetThreadId: 'thread-wish-completed-wish-dinner',
    actorId: 'member-a',
    emoji: '🎉',
    createdAt: '2026-04-22T10:10:00.000Z',
  }),
  createThreadReactionRecord({
    id: 'reaction-dinner-comment-love-b',
    targetThreadId: 'comment-dinner-member-a',
    actorId: 'member-b',
    emoji: '🥰',
    createdAt: '2026-04-22T10:18:00.000Z',
  }),
]

function createSeedWishState() {
  return {
    coins: seedWishCoins.map((coin) => createWishCoinRecord(coin)),
    monthlyJournalSnapshots: [] as MonthlyJournalSnapshotRecord[],
    rewardClaims: [] as RewardClaimRecord[],
    rewardPoolItems: [] as RewardPoolItem[],
    threadReactions: seedThreadReactions.map((reaction) => createThreadReactionRecord(reaction)),
    wishes: seedWishes.map((wish) => createWishRecord(wish)),
  }
}

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function clearLegacyWishStorage(storage: Storage) {
  for (const legacyStorageKey of LEGACY_STORAGE_KEYS) {
    storage.removeItem(legacyStorageKey)
  }
}

function hydrateWishState() {
  const storage = getBrowserStorage()

  if (!storage) {
    return createSeedWishState()
  }

  clearLegacyWishStorage(storage)

  const raw = storage.getItem(STORAGE_KEY)

  if (!raw) {
    return createSeedWishState()
  }

  try {
    const parsed = JSON.parse(raw)

    if (Array.isArray(parsed)) {
      return {
        coins: [],
        monthlyJournalSnapshots: [],
        rewardClaims: [],
        rewardPoolItems: [],
        threadReactions: [],
        wishes: parsed.map((wish) => createWishRecord(wish)),
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      return createSeedWishState()
    }

    const parsedWishes = Array.isArray((parsed as { wishes?: unknown }).wishes)
      ? (parsed as { wishes: WishRecord[] }).wishes.map((wish) => createWishRecord(wish))
      : null
    const parsedCoins = Array.isArray((parsed as { coins?: unknown }).coins)
      ? (parsed as { coins: WishCoinRecord[] }).coins.map((coin) => createWishCoinRecord(coin))
      : []
    const parsedRewardPoolItems = Array.isArray((parsed as { rewardPoolItems?: unknown }).rewardPoolItems)
      ? (parsed as { rewardPoolItems: RewardPoolItem[] }).rewardPoolItems.map((item) => createRewardPoolItem(item))
      : []
    const parsedRewardClaims = Array.isArray((parsed as { rewardClaims?: unknown }).rewardClaims)
      ? (parsed as { rewardClaims: RewardClaimRecord[] }).rewardClaims.map((claim) => createRewardClaimRecord(claim))
      : []
    const parsedThreadReactions = Array.isArray((parsed as { threadReactions?: unknown }).threadReactions)
      ? (parsed as { threadReactions: ThreadReactionRecord[] }).threadReactions.map((reaction) => createThreadReactionRecord(reaction))
      : []
    const parsedMonthlyJournalSnapshots = Array.isArray((parsed as { monthlyJournalSnapshots?: unknown }).monthlyJournalSnapshots)
      ? (parsed as { monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[] }).monthlyJournalSnapshots.map((snapshot) => createMonthlyJournalSnapshotRecord(snapshot))
      : []

    if (!parsedWishes) {
      return createSeedWishState()
    }

    return {
      coins: parsedCoins,
      monthlyJournalSnapshots: parsedMonthlyJournalSnapshots,
      rewardClaims: parsedRewardClaims,
      rewardPoolItems: parsedRewardPoolItems,
      threadReactions: parsedThreadReactions,
      wishes: parsedWishes,
    }
  } catch {
    return createSeedWishState()
  }
}

function touchWish(wish: WishRecord) {
  return {
    ...wish,
    updatedAt: new Date().toISOString(),
  }
}

function createWishRecordFromRow(
  row: WishRow,
  coinRows: WishCoinRow[],
  commentRows: WishCommentRow[],
  commentImageRows: WishCommentImageRow[],
  imageRows: WishImageRow[],
  stepRows: WishStepRow[],
  imageUrlMap: Map<string, string>,
  commentImageUrlMap: Map<string, string>,
) {
  return createWishRecord({
    id: row.id,
    title: row.title,
    category: row.category,
    priority: row.priority,
    dueDate: row.due_date ?? '',
    note: row.note,
    ownerId: row.owner_id,
    scope: row.scope,
    status: row.status,
    starred: row.is_starred || coinRows.some((coin) => coin.wish_id === row.id),
    progressMode: row.progress_mode ?? 'none',
    progressCurrent: row.progress_current ?? 0,
    progressTarget: row.progress_target ?? 0,
    progressUnit: row.progress_unit ?? '',
    completedAt: row.completed_at,
    steps: stepRows
      .filter((step) => step.wish_id === row.id)
      .sort((left, right) => left.sort_order - right.sort_order || new Date(left.created_at).getTime() - new Date(right.created_at).getTime())
      .map((step) =>
        createWishStep({
          id: step.id,
          title: step.title,
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

function createRewardPoolItemFromRow(row: RewardPoolItemRow) {
  return createRewardPoolItem({
    createdAt: row.created_at,
    id: row.id,
    isArchived: row.is_archived,
    note: row.note,
    ownerId: row.owner_id,
    starCoinCost: row.star_coin_cost,
    tier: row.tier,
    title: row.title,
    updatedAt: row.updated_at,
  })
}

function createRewardClaimFromRow(row: RewardClaimRow) {
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

export const useWishStore = defineStore('wishes', () => {
  const authStore = useAuthStore()
  const hydratedState = hydrateWishState()
  const wishes = ref<WishRecord[]>(hydratedState.wishes)
  const wishCoins = ref<WishCoinRecord[]>(hydratedState.coins)
  const threadReactions = ref<ThreadReactionRecord[]>(hydratedState.threadReactions)
  const wishThreads = ref<WishThreadEntry[]>(
    buildDerivedWishThreadEntries(hydratedState.wishes, hydratedState.coins, hydratedState.rewardClaims, hydratedState.threadReactions),
  )
  const monthlyJournalSnapshots = ref<MonthlyJournalSnapshotRecord[]>(hydratedState.monthlyJournalSnapshots)
  const rewardPoolItems = ref<RewardPoolItem[]>(hydratedState.rewardPoolItems)
  const rewardClaims = ref<RewardClaimRecord[]>(hydratedState.rewardClaims)
  const isLoading = ref(false)
  const syncMessage = ref('当前使用本地演示数据。')
  const lastLoadedSpaceId = ref<string | null>(null)
  const realtimeStatus = ref<'idle' | 'connecting' | 'subscribed' | 'error'>('idle')

  const isUsingCloudWishes = computed(() => authStore.usesSupabaseSpace && !!authStore.currentSpaceId)
  const realtimeMessage = computed(() => {
    if (!isUsingCloudWishes.value) {
      return 'Realtime 未启用，当前显示本地演示数据。'
    }

    if (realtimeStatus.value === 'connecting') {
      return 'Realtime 连接中，当前空间的变更很快会自动刷新。'
    }

    if (realtimeStatus.value === 'subscribed') {
      return 'Realtime 已连接，当前空间的愿望和留言会自动刷新。'
    }

    if (realtimeStatus.value === 'error') {
      return 'Realtime 连接异常，当前仍会在写入后自动重新拉取云端数据。'
    }

    return 'Realtime 当前未连接。'
  })

  let realtimeChannel: RealtimeChannel | null = null
  let subscribedSpaceId: string | null = null
  let realtimeSyncTimer: ReturnType<typeof setTimeout> | null = null

  const priorityScore: Record<WishPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  }

  const currentWishCoinCycle = computed(() => getWishCoinCycle())

  const currentCycleWishCoins = computed(() => {
    const currentCycleKey = currentWishCoinCycle.value.key
    return wishCoins.value.filter((coin) => coin.cycleKey === currentCycleKey)
  })

  const currentCycleCoinUsageByMember = computed(() => {
    const usageMap = new Map<string, number>()

    for (const coin of currentCycleWishCoins.value) {
      usageMap.set(coin.voterId, (usageMap.get(coin.voterId) ?? 0) + coin.amount)
    }

    return usageMap
  })

  const wishCoinTotals = computed(() => {
    const totals = new Map<string, number>()

    for (const coin of wishCoins.value) {
      totals.set(coin.wishId, (totals.get(coin.wishId) ?? 0) + coin.amount)
    }

    return totals
  })

  const currentMemberRemainingCoins = computed(() => {
    const memberId = authStore.currentMemberId || authStore.currentMember?.id

    if (!memberId) {
      return 0
    }

    return Math.max(0, WISH_COIN_BUDGET_PER_CYCLE - (currentCycleCoinUsageByMember.value.get(memberId) ?? 0))
  })

  const currentMemberUsedCoins = computed(() => Math.max(0, WISH_COIN_BUDGET_PER_CYCLE - currentMemberRemainingCoins.value))

  const rewardClaimCountsByItem = computed(() => {
    const counts = new Map<string, number>()

    for (const claim of rewardClaims.value) {
      if (!claim.rewardItemId) {
        continue
      }

      counts.set(claim.rewardItemId, (counts.get(claim.rewardItemId) ?? 0) + claim.quantity)
    }

    return counts
  })

  const rewardClaimByWishId = computed(() => {
    const claimMap = new Map<string, RewardClaimRecord>()

    for (const claim of rewardClaims.value) {
      if (claim.sourceWishId && claim.claimKind === 'wish_reward') {
        claimMap.set(claim.sourceWishId, claim)
      }
    }

    return claimMap
  })

  const rewardClaimByStepId = computed(() => {
    const claimMap = new Map<string, RewardClaimRecord>()

    for (const claim of rewardClaims.value) {
      if (claim.sourceStepId) {
        claimMap.set(claim.sourceStepId, claim)
      }
    }

    return claimMap
  })

  const starCoinBalanceByMember = computed(() => {
    const balanceMap = new Map<string, number>()

    for (const claim of rewardClaims.value) {
      balanceMap.set(claim.ownerId, (balanceMap.get(claim.ownerId) ?? 0) + claim.starCoinDelta)
    }

    return balanceMap
  })

  const currentMemberStarCoinBalance = computed(() => {
    const memberId = authStore.currentMemberId || authStore.currentMember?.id

    if (!memberId) {
      return 0
    }

    return Math.max(0, starCoinBalanceByMember.value.get(memberId) ?? 0)
  })

  const countRewardClaimedUnitsByWish = computed(() => {
    const claimMap = new Map<string, number>()

    for (const claim of rewardClaims.value) {
      if (!claim.sourceWishId || claim.sourceStepId) {
        continue
      }

      if (claim.claimKind !== 'count_reward' && claim.claimKind !== 'star_coin') {
        continue
      }

      claimMap.set(claim.sourceWishId, (claimMap.get(claim.sourceWishId) ?? 0) + claim.quantity)
    }

    return claimMap
  })

  const pendingStepRewards = computed<PendingStepRewardEntry[]>(() => {
    return wishes.value
      .flatMap((wish) => {
        return wish.steps
          .filter((step) => step.isDone && !rewardClaimByStepId.value.has(step.id))
          .map((step) => ({
            completedAt: step.updatedAt,
            stepId: step.id,
            stepTitle: step.title,
            wishId: wish.id,
            wishTitle: wish.title,
          }))
      })
      .sort((left, right) => compareIsoAscending(right.completedAt, left.completedAt) || left.stepId.localeCompare(right.stepId))
  })

  const pendingCountRewardSummaries = computed<PendingCountRewardSummary[]>(() => {
    return wishes.value
      .filter((wish) => wish.progressMode === 'count')
      .map((wish) => {
        const target = Math.max(1, wish.progressTarget)
        const current = Math.min(wish.progressCurrent, target)
        const claimedUnits = countRewardClaimedUnitsByWish.value.get(wish.id) ?? 0
        const pendingUnits = Math.max(current - claimedUnits, 0)

        return {
          pendingUnits,
          progressCurrent: current,
          progressTarget: target,
          progressUnit: wish.progressUnit,
          updatedAt: wish.updatedAt,
          wishId: wish.id,
          wishTitle: wish.title,
        }
      })
      .filter((item) => item.pendingUnits > 0)
      .sort((left, right) => compareIsoAscending(right.updatedAt, left.updatedAt) || left.wishId.localeCompare(right.wishId))
  })

  const pendingSmallRewardCount = computed(() => {
    return pendingStepRewards.value.length + pendingCountRewardSummaries.value.reduce((total, item) => total + item.pendingUnits, 0)
  })

  const latestRewardClaims = computed(() => {
    return [...rewardClaims.value]
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 8)
  })

  const nearestDueWishes = computed(() => {
    return [...wishes.value]
      .filter((wish) => wish.status === 'active' && getLocalDateTimestamp(wish.dueDate) !== null)
      .sort((left, right) => {
        const leftDate = getLocalDateTimestamp(left.dueDate) ?? Number.MAX_SAFE_INTEGER
        const rightDate = getLocalDateTimestamp(right.dueDate) ?? Number.MAX_SAFE_INTEGER

        if (leftDate !== rightDate) {
          return leftDate - rightDate
        }

        return (wishCoinTotals.value.get(right.id) ?? 0) - (wishCoinTotals.value.get(left.id) ?? 0)
      })
  })

  const dragonBallWishes = computed(() => {
    return [...wishes.value]
      .filter((wish) => wish.status === 'active' && (wishCoinTotals.value.get(wish.id) ?? 0) > 0)
      .sort((left, right) => {
        const leftCoins = wishCoinTotals.value.get(left.id) ?? 0
        const rightCoins = wishCoinTotals.value.get(right.id) ?? 0

        if (leftCoins !== rightCoins) {
          return rightCoins - leftCoins
        }

        const leftDate = getLocalDateTimestamp(left.dueDate) ?? Number.MAX_SAFE_INTEGER
        const rightDate = getLocalDateTimestamp(right.dueDate) ?? Number.MAX_SAFE_INTEGER

        if (leftDate !== rightDate) {
          return leftDate - rightDate
        }

        if (priorityScore[left.priority] !== priorityScore[right.priority]) {
          return priorityScore[left.priority] - priorityScore[right.priority]
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      })
  })

  const stats = computed(() => {
    const activeWishes = wishes.value.filter((wish) => wish.status === 'active')
    const doneWishes = wishes.value.filter((wish) => wish.status === 'done')
    const todayStart = getTodayStartTimestamp()
    const dueSoonEnd = todayStart + DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const currentCycleCoinsUsed = currentCycleWishCoins.value.reduce((count, coin) => count + coin.amount, 0)
    const memberCount = Math.max(authStore.members.length, authStore.currentMemberId ? 1 : 0)
    const total = wishes.value.length
    const done = doneWishes.length
    const active = activeWishes.length
    const comments = wishes.value.reduce((count, wish) => count + wish.comments.length, 0)
    const shared = wishes.value.filter((wish) => wish.scope === 'shared').length
    const tracked = wishes.value.filter((wish) => wish.progressMode !== 'none').length
    const totalStepCount = wishes.value.reduce((count, wish) => count + (wish.progressMode === 'steps' ? wish.steps.length : 0), 0)
    const completedStepCount = wishes.value.reduce(
      (count, wish) => count + (wish.progressMode === 'steps' ? wish.steps.filter((step) => step.isDone).length : 0),
      0,
    )
    const totalCountTarget = wishes.value.reduce((count, wish) => count + (wish.progressMode === 'count' ? Math.max(1, wish.progressTarget) : 0), 0)
    const completedCountValue = wishes.value.reduce(
      (count, wish) => count + (wish.progressMode === 'count' ? Math.min(wish.progressCurrent, Math.max(1, wish.progressTarget)) : 0),
      0,
    )
    const overdue = activeWishes.filter((wish) => {
      const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
      return dueTimestamp !== null && dueTimestamp < todayStart
    }).length
    const dueSoon = activeWishes.filter((wish) => {
      const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
      return dueTimestamp !== null && dueTimestamp >= todayStart && dueTimestamp <= dueSoonEnd
    }).length
    const wishesWithCoins = wishes.value.filter((wish) => (wishCoinTotals.value.get(wish.id) ?? 0) > 0).length
    const dragonBallReady = activeWishes.filter((wish) => (wishCoinTotals.value.get(wish.id) ?? 0) >= DRAGON_BALL_COIN_TARGET).length
    const totalWishCoins = wishCoins.value.reduce((count, coin) => count + coin.amount, 0)
    const totalImages = wishes.value.reduce(
      (count, wish) => count + wish.images.length + wish.comments.reduce((commentCount, comment) => commentCount + comment.images.length, 0),
      0,
    )
    const totalImageBytes = wishes.value.reduce(
      (count, wish) =>
        count
        + wish.images.reduce((imageCount, image) => imageCount + image.sizeBytes, 0)
        + wish.comments.reduce(
          (commentCount, comment) => commentCount + comment.images.reduce((imageCount, image) => imageCount + image.sizeBytes, 0),
          0,
        ),
      0,
    )

    return {
      active,
      comments,
      completionRate: total ? Math.round((done / total) * 100) : 0,
      completedCountValue,
      completedStepCount,
      currentCycleCoinsRemaining: Math.max(memberCount * WISH_COIN_BUDGET_PER_CYCLE - currentCycleCoinsUsed, 0),
      currentCycleCoinsUsed,
      currentMemberRemainingCoins: currentMemberRemainingCoins.value,
      currentMemberUsedCoins: currentMemberUsedCoins.value,
      done,
      dragonBallReady,
      dueSoon,
      overdue,
      shared,
      starred: wishesWithCoins,
      topWishCoinCount: dragonBallWishes.value.length ? wishCoinTotals.value.get(dragonBallWishes.value[0].id) ?? 0 : 0,
      totalCountTarget,
      total,
      totalImageBytes,
      totalImages,
      totalStepCount,
      totalWishCoins,
      tracked,
      wishesWithCoins,
    }
  })

  const wishBottleSnapshot = computed<WishBottleSnapshot>(() => {
    const activeWishes = wishes.value.filter((wish) => wish.status === 'active')

    if (!activeWishes.length) {
      return {
        activeWishCount: 0,
        colorTier: 'blue',
        completedCountUnits: 0,
        completedStepStarCount: 0,
        completedTrackedUnits: 0,
        isRainbowGlow: false,
        overallPercent: 0,
        progressedCountWishCount: 0,
        progressedWishCount: 0,
        totalCountUnits: 0,
        totalTrackedUnits: 0,
        trackedWishCount: 0,
      }
    }

    let completedCountUnits = 0
    let completedTrackedUnits = 0
    let completedStepStarCount = 0
    let progressedCountWishCount = 0
    let progressedWishCount = 0
    let totalCountUnits = 0
    let totalTrackedUnits = 0
    let trackedWishCount = 0

    for (const wish of activeWishes) {
      const progressSnapshot = getWishProgressSnapshot(wish)

      if (progressSnapshot.percent > 0) {
        progressedWishCount += 1
      }

      if (wish.progressMode === 'steps') {
        trackedWishCount += 1
        completedStepStarCount += progressSnapshot.current
        completedTrackedUnits += progressSnapshot.current
        totalTrackedUnits += progressSnapshot.target
        continue
      }

      if (wish.progressMode === 'count') {
        trackedWishCount += 1
        completedCountUnits += progressSnapshot.current
        completedTrackedUnits += progressSnapshot.current
        totalCountUnits += progressSnapshot.target
        totalTrackedUnits += progressSnapshot.target

        if (progressSnapshot.current > 0) {
          progressedCountWishCount += 1
        }
      }
    }

    const overallPercent = totalTrackedUnits
      ? Math.max(0, Math.min(100, Math.round((completedTrackedUnits / totalTrackedUnits) * 100)))
      : 0

    return {
      activeWishCount: activeWishes.length,
      colorTier: getWishBottleColorTier(overallPercent),
      completedCountUnits,
      completedStepStarCount,
      completedTrackedUnits,
      isRainbowGlow: overallPercent > 80,
      overallPercent,
      progressedCountWishCount,
      progressedWishCount,
      totalCountUnits,
      totalTrackedUnits,
      trackedWishCount,
    }
  })

  const imageStorageSummary = computed(() => {
    const quotaBytes = SUPABASE_FREE_FILE_STORAGE_BYTES
    const usedBytes = stats.value.totalImageBytes
    const remainingBytes = Math.max(quotaBytes - usedBytes, 0)
    const usagePercent = quotaBytes ? Math.min(100, Math.round((usedBytes / quotaBytes) * 1000) / 10) : 0

    return {
      nearingLimit: usagePercent >= 70,
      overSoftLimit: usagePercent >= 85,
      quotaBytes,
      remainingBytes,
      usagePercent,
      usedBytes,
    }
  })

  const overdueWishes = computed(() => {
    const todayStart = getTodayStartTimestamp()

    return [...wishes.value]
      .filter((wish) => {
        const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
        return wish.status === 'active' && dueTimestamp !== null && dueTimestamp < todayStart
      })
      .sort((left, right) => (getLocalDateTimestamp(left.dueDate) ?? 0) - (getLocalDateTimestamp(right.dueDate) ?? 0))
  })

  const dueSoonWishes = computed(() => {
    const todayStart = getTodayStartTimestamp()
    const dueSoonEnd = todayStart + DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000

    return [...wishes.value]
      .filter((wish) => {
        const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
        return wish.status === 'active' && dueTimestamp !== null && dueTimestamp >= todayStart && dueTimestamp <= dueSoonEnd
      })
      .sort((left, right) => (getLocalDateTimestamp(left.dueDate) ?? Number.MAX_SAFE_INTEGER) - (getLocalDateTimestamp(right.dueDate) ?? Number.MAX_SAFE_INTEGER))
  })

  const recentlyCompletedWishes = computed(() => {
    const completedAfter = Date.now() - RECENTLY_COMPLETED_WINDOW_DAYS * 24 * 60 * 60 * 1000

    return [...wishes.value]
      .filter((wish) => {
        const completionTimestamp = getWishCompletionTimestamp(wish)
        return completionTimestamp !== null && completionTimestamp >= completedAfter
      })
      .sort((left, right) => (getWishCompletionTimestamp(right) ?? 0) - (getWishCompletionTimestamp(left) ?? 0))
  })

  const upcomingWishes = computed(() => {
    return [...wishes.value]
      .filter((wish) => wish.status === 'active')
      .sort((left, right) => {
        const leftDate = getLocalDateTimestamp(left.dueDate) ?? Number.MAX_SAFE_INTEGER
        const rightDate = getLocalDateTimestamp(right.dueDate) ?? Number.MAX_SAFE_INTEGER

        if (leftDate !== rightDate) {
          return leftDate - rightDate
        }

        if (priorityScore[left.priority] !== priorityScore[right.priority]) {
          return priorityScore[left.priority] - priorityScore[right.priority]
        }

        return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
      })
  })

  const sortedWishes = computed(() => {
    return [...wishes.value].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === 'done' ? 1 : -1
      }

      const leftCoins = wishCoinTotals.value.get(left.id) ?? 0
      const rightCoins = wishCoinTotals.value.get(right.id) ?? 0

      if (leftCoins !== rightCoins) {
        return rightCoins - leftCoins
      }

      if (priorityScore[left.priority] !== priorityScore[right.priority]) {
        return priorityScore[left.priority] - priorityScore[right.priority]
      }

      const leftDate = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const rightDate = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER

      return leftDate - rightDate
    })
  })

  const latestComments = computed(() => {
    return wishes.value
      .flatMap((wish) =>
        wish.comments.map((comment) => ({
          ...comment,
          wishId: wish.id,
          wishTitle: wish.title,
        })),
      )
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 5)
  })

  function findById(id: string) {
    return wishes.value.find((wish) => wish.id === id)
  }

  function getWishCoinSummary(target: string | Pick<WishRecord, 'id'>): WishCoinSnapshot {
    const wishId = typeof target === 'string' ? target : target.id
    const currentCycleKey = currentWishCoinCycle.value.key
    const relevantCoins = wishCoins.value.filter((coin) => coin.wishId === wishId)
    const memberTotalsMap = new Map<string, number>()

    for (const coin of relevantCoins) {
      memberTotalsMap.set(coin.voterId, (memberTotalsMap.get(coin.voterId) ?? 0) + coin.amount)
    }

    const total = relevantCoins.reduce((count, coin) => count + coin.amount, 0)

    return {
      currentCycleTotal: relevantCoins
        .filter((coin) => coin.cycleKey === currentCycleKey)
        .reduce((count, coin) => count + coin.amount, 0),
      isDragonBallReady: total >= DRAGON_BALL_COIN_TARGET,
      memberTotals: authStore.members
        .map((member) => ({
          displayName: member.displayName,
          memberId: member.id,
          total: memberTotalsMap.get(member.id) ?? 0,
        }))
        .filter((member) => member.total > 0)
        .sort((left, right) => right.total - left.total),
      remainingToDragonBall: Math.max(DRAGON_BALL_COIN_TARGET - total, 0),
      total,
    }
  }

  function getRewardPoolItems(memberId: string, tier?: RewardTier, includeArchived = false) {
    return rewardPoolItems.value
      .filter((item) => item.ownerId === memberId)
      .filter((item) => (tier ? item.tier === tier : true))
      .filter((item) => (includeArchived ? true : !item.isArchived))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }

  function getRewardItemClaimCount(target: string | Pick<RewardPoolItem, 'id'>) {
    const itemId = typeof target === 'string' ? target : target.id
    return rewardClaimCountsByItem.value.get(itemId) ?? 0
  }

  function getMemberStarCoinBalance(memberId: string) {
    return Math.max(0, starCoinBalanceByMember.value.get(memberId) ?? 0)
  }

  function getWishRewardClaim(target: string | Pick<WishRecord, 'id'>) {
    const wishId = typeof target === 'string' ? target : target.id
    return rewardClaimByWishId.value.get(wishId) ?? null
  }

  function getStepRewardClaim(stepId: string) {
    return rewardClaimByStepId.value.get(stepId) ?? null
  }

  function hasWishRewardClaim(target: string | Pick<WishRecord, 'id'>) {
    return !!getWishRewardClaim(target)
  }

  function hasStepRewardClaim(stepId: string) {
    return !!getStepRewardClaim(stepId)
  }

  function getCurrentMemberId() {
    return authStore.currentMemberId || authStore.currentMember?.id || null
  }

  function getMemberDisplayName(memberId: string | null) {
    if (!memberId) {
      return '系统'
    }

    return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
  }

  function createSnapshotNarrativeBlock(thread: WishThreadEntry) {
    return {
      actorId: thread.actorId,
      actorName: getMemberDisplayName(thread.actorId),
      createdAt: thread.createdAt,
      eventKind: thread.eventKind,
      id: thread.id,
      images: thread.images.map((image) => ({
        createdAt: image.createdAt,
        createdBy: image.createdBy,
        fileName: image.fileName,
        id: image.id,
        mimeType: image.mimeType,
        sizeBytes: image.sizeBytes,
        storagePath: image.storagePath,
        url: image.url,
      })),
      messageText: thread.messageText,
      meta: { ...thread.meta },
      reactions: thread.reactions.map((reaction) => ({
        count: reaction.count,
        emoji: reaction.emoji,
        memberIds: [...reaction.memberIds],
      })),
      updatedAt: thread.updatedAt,
      wishId: thread.wishId,
    }
  }

  function createLocalMonthlyJournalSnapshot(monthKey: string, sourceThreads: WishThreadEntry[]) {
    const orderedThreads = [...sourceThreads].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt) || left.id.localeCompare(right.id))

    return createMonthlyJournalSnapshotRecord({
      coverSubtitle: `${authStore.spaceName || '愿望空间'} 的固定版本回顾`,
      coverTitle: formatMonthCoverTitle(monthKey),
      createdAt: new Date().toISOString(),
      createdBy: getCurrentMemberId(),
      id: `snapshot-${monthKey}`,
      metricsSnapshot: {
        coinEventCount: orderedThreads.filter((thread) => thread.eventKind === 'wish_coin_cast').length,
        commentCount: orderedThreads.filter((thread) => thread.eventKind === 'comment').length,
        completedWishCount: orderedThreads.filter((thread) => thread.eventKind === 'wish_completed').length,
        dragonBallCount: orderedThreads.filter((thread) => thread.eventKind === 'dragon_ball_reached').length,
        reactionCount: orderedThreads.reduce((count, thread) => count + thread.reactions.reduce((total, reaction) => total + reaction.count, 0), 0),
        rewardEventCount: orderedThreads.filter((thread) => thread.eventKind === 'reward_claimed' || thread.eventKind === 'premium_redeem').length,
        threadCount: orderedThreads.length,
        wishCount: new Set(orderedThreads.map((thread) => thread.wishId).filter((wishId): wishId is string => !!wishId)).size,
      },
      monthKey,
      narrativeBlocks: orderedThreads.map((thread) => createSnapshotNarrativeBlock(thread)),
      snapshotStatus: 'ready',
      sourceRefs: orderedThreads.map((thread) => ({
        createdAt: thread.createdAt,
        eventKind: thread.eventKind,
        threadId: thread.id,
        wishId: thread.wishId,
      })),
      spaceId: authStore.currentSpaceId || null,
    })
  }

  function ensureLocalMonthlySnapshots(nextThreads: WishThreadEntry[]) {
    const currentMonthKey = getBeijingMonthKey()
    const existingMonthKeys = new Set(monthlyJournalSnapshots.value.map((snapshot) => snapshot.monthKey))
    const pendingThreadsByMonth = new Map<string, WishThreadEntry[]>()

    for (const thread of nextThreads) {
      const monthKey = getBeijingMonthKey(thread.createdAt)

      if (monthKey >= currentMonthKey || existingMonthKeys.has(monthKey)) {
        continue
      }

      const bucket = pendingThreadsByMonth.get(monthKey) ?? []
      bucket.push(thread)
      pendingThreadsByMonth.set(monthKey, bucket)
    }

    if (!pendingThreadsByMonth.size) {
      monthlyJournalSnapshots.value = [...monthlyJournalSnapshots.value]
        .sort((left, right) => right.monthKey.localeCompare(left.monthKey) || compareIsoAscending(right.createdAt, left.createdAt))
      return
    }

    monthlyJournalSnapshots.value = [
      ...monthlyJournalSnapshots.value,
      ...[...pendingThreadsByMonth.entries()]
        .sort(([leftMonthKey], [rightMonthKey]) => leftMonthKey.localeCompare(rightMonthKey))
        .map(([monthKey, sourceThreads]) => createLocalMonthlyJournalSnapshot(monthKey, sourceThreads)),
    ].sort((left, right) => right.monthKey.localeCompare(left.monthKey) || compareIsoAscending(right.createdAt, left.createdAt))
  }

  function refreshLocalActivityState() {
    const nextThreads = buildDerivedWishThreadEntries(wishes.value, wishCoins.value, rewardClaims.value, threadReactions.value)
    wishThreads.value = nextThreads
    ensureLocalMonthlySnapshots(nextThreads)
  }

  function getWishThreadEntries(wishId: string) {
    return wishThreads.value
      .filter((thread) => thread.wishId === wishId)
      .sort((left, right) => compareIsoAscending(right.createdAt, left.createdAt) || left.id.localeCompare(right.id))
  }

  function rewardResult(ok: boolean, message: string): RewardActionResult {
    syncMessage.value = message
    return { ok, message }
  }

  function isRewardFeatureMissing(message: string) {
    return /reward_pool_items|reward_claims|complete_wish_with_reward|claim_completed_step_reward|claim_count_progress_reward|redeem_premium_reward/i.test(message)
  }

  function isWishThreadFeatureMissing(message: string) {
    return /wish_threads|wish_thread_images|thread_reactions|monthly_journal_snapshots|ensure_monthly_journal_snapshots/i.test(message)
  }

  function clearRealtimeSyncTimer() {
    if (!realtimeSyncTimer) {
      return
    }

    clearTimeout(realtimeSyncTimer)
    realtimeSyncTimer = null
  }

  function scheduleRealtimeSync(reason: string) {
    if (!authStore.currentSpaceId || !isUsingCloudWishes.value) {
      return
    }

    clearRealtimeSyncTimer()
    syncMessage.value = `${reason}有更新，正在刷新云端数据...`

    const targetSpaceId = authStore.currentSpaceId

    realtimeSyncTimer = setTimeout(() => {
      void syncFromSupabase(targetSpaceId)
    }, 180)
  }

  function handleCommentRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const nextWishId = typeof payload.new?.wish_id === 'string' ? payload.new.wish_id : null
    const previousWishId = typeof payload.old?.wish_id === 'string' ? payload.old.wish_id : null
    const visibleWishIds = new Set(wishes.value.map((wish) => wish.id))

    if (!nextWishId && !previousWishId) {
      scheduleRealtimeSync('留言')
      return
    }

    if ((nextWishId && visibleWishIds.has(nextWishId)) || (previousWishId && visibleWishIds.has(previousWishId))) {
      scheduleRealtimeSync('留言')
    }
  }

  function handleImageRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const nextWishId = typeof payload.new?.wish_id === 'string' ? payload.new.wish_id : null
    const previousWishId = typeof payload.old?.wish_id === 'string' ? payload.old.wish_id : null
    const visibleWishIds = new Set(wishes.value.map((wish) => wish.id))

    if (!nextWishId && !previousWishId) {
      scheduleRealtimeSync('图片')
      return
    }

    if ((nextWishId && visibleWishIds.has(nextWishId)) || (previousWishId && visibleWishIds.has(previousWishId))) {
      scheduleRealtimeSync('图片')
    }
  }

  function handleCommentImageRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const nextCommentId = typeof payload.new?.comment_id === 'string' ? payload.new.comment_id : null
    const previousCommentId = typeof payload.old?.comment_id === 'string' ? payload.old.comment_id : null
    const visibleCommentIds = new Set(
      wishes.value.flatMap((wish) => wish.comments.map((comment) => comment.id)),
    )

    if (!nextCommentId && !previousCommentId) {
      scheduleRealtimeSync('留言图片')
      return
    }

    if ((nextCommentId && visibleCommentIds.has(nextCommentId)) || (previousCommentId && visibleCommentIds.has(previousCommentId))) {
      scheduleRealtimeSync('留言图片')
    }
  }

  function handleThreadImageRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const nextThreadId = typeof payload.new?.thread_id === 'string' ? payload.new.thread_id : null
    const previousThreadId = typeof payload.old?.thread_id === 'string' ? payload.old.thread_id : null
    const visibleThreadIds = new Set(wishThreads.value.map((thread) => thread.id))

    if (!nextThreadId && !previousThreadId) {
      scheduleRealtimeSync('手账图片')
      return
    }

    if ((nextThreadId && visibleThreadIds.has(nextThreadId)) || (previousThreadId && visibleThreadIds.has(previousThreadId))) {
      scheduleRealtimeSync('手账图片')
    }
  }

  function teardownRealtimeSubscription() {
    clearRealtimeSyncTimer()

    if (supabase && realtimeChannel) {
      void supabase.removeChannel(realtimeChannel)
    }

    realtimeChannel = null
    subscribedSpaceId = null
    realtimeStatus.value = 'idle'
  }

  function setupRealtimeSubscription(spaceId: string) {
    if (!supabase) {
      return
    }

    if (realtimeChannel && subscribedSpaceId === spaceId) {
      return
    }

    teardownRealtimeSubscription()
    realtimeStatus.value = 'connecting'
    subscribedSpaceId = spaceId

    realtimeChannel = supabase
      .channel(`wish-space-${spaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishes', filter: `space_id=eq.${spaceId}` }, () => {
        scheduleRealtimeSync('愿望')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_threads', filter: `space_id=eq.${spaceId}` }, () => {
        scheduleRealtimeSync('愿望手账')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_comments' }, (payload) => {
        handleCommentRealtimeEvent(payload as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_images' }, (payload) => {
        handleImageRealtimeEvent(payload as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_thread_images' }, (payload) => {
        handleThreadImageRealtimeEvent(payload as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_coins', filter: `space_id=eq.${spaceId}` }, () => {
        scheduleRealtimeSync('愿望币')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'thread_reactions', filter: `space_id=eq.${spaceId}` }, () => {
        scheduleRealtimeSync('表情回应')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_pool_items', filter: `space_id=eq.${spaceId}` }, () => {
        scheduleRealtimeSync('奖励池')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reward_claims', filter: `space_id=eq.${spaceId}` }, () => {
        scheduleRealtimeSync('领奖记录')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'monthly_journal_snapshots', filter: `space_id=eq.${spaceId}` }, () => {
        scheduleRealtimeSync('月刊快照')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_comment_images' }, (payload) => {
        handleCommentImageRealtimeEvent(payload as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          realtimeStatus.value = 'subscribed'
          return
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          realtimeStatus.value = 'error'
          return
        }

        if (status === 'CLOSED') {
          realtimeStatus.value = 'idle'
        }
      })
  }

  async function syncFromSupabase(spaceId = authStore.currentSpaceId) {
    if (!supabase || !spaceId) {
      return false
    }

    isLoading.value = true

    try {
      const { data: wishRows, error: wishError } = await supabase
        .from('wishes')
        .select('id, space_id, owner_id, title, category, note, priority, scope, status, is_starred, due_date, progress_mode, progress_current, progress_target, progress_unit, completed_at, created_at, updated_at')
        .eq('space_id', spaceId)
        .order('updated_at', { ascending: false })

      if (wishError) {
        syncMessage.value = `云端愿望同步失败：${wishError.message}`
        return false
      }

      const wishIds = ((wishRows ?? []) as WishRow[]).map((wish) => wish.id)
      let wishCoinRows: WishCoinRow[] = []
      let rewardPoolItemRows: RewardPoolItemRow[] = []
      let rewardClaimRows: RewardClaimRow[] = []
      let commentRows: WishCommentRow[] = []
      let commentImageRows: WishCommentImageRow[] = []
      let threadRows: WishThreadRow[] = []
      let threadImageRows: WishThreadImageRow[] = []
      let threadReactionRows: ThreadReactionRecord[] = []
      let monthlySnapshotRows: MonthlyJournalSnapshotRow[] = []
      let hasUnifiedThreadData = false
      let imageRows: WishImageRow[] = []
      let stepRows: WishStepRow[] = []
      let imageUrlMap = new Map<string, string>()
      let commentImageUrlMap = new Map<string, string>()

      const { data: rewardPoolItemData, error: rewardPoolItemError } = await supabase
        .from('reward_pool_items')
        .select('id, space_id, owner_id, tier, title, note, star_coin_cost, is_archived, created_at, updated_at')
        .eq('space_id', spaceId)
        .order('updated_at', { ascending: false })

      if (rewardPoolItemError) {
        if (rewardPoolItemError.code !== '42P01' && !/reward_pool_items/i.test(rewardPoolItemError.message)) {
          syncMessage.value = `云端奖励池同步失败：${rewardPoolItemError.message}`
          return false
        }
      } else {
        rewardPoolItemRows = (rewardPoolItemData ?? []) as RewardPoolItemRow[]
      }

      const { data: rewardClaimData, error: rewardClaimError } = await supabase
        .from('reward_claims')
          .select('id, space_id, owner_id, reward_item_id, source_wish_id, source_step_id, claim_kind, quantity, title_snapshot, note_snapshot, star_coin_delta, created_at')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: false })

      if (rewardClaimError) {
        if (rewardClaimError.code !== '42P01' && !/reward_claims/i.test(rewardClaimError.message)) {
          syncMessage.value = `云端领奖记录同步失败：${rewardClaimError.message}`
          return false
        }
      } else {
        rewardClaimRows = (rewardClaimData ?? []) as RewardClaimRow[]
      }

      const { error: ensureMonthlySnapshotsError } = await supabase.rpc('ensure_monthly_journal_snapshots', {
        target_space_id: spaceId,
      })

      if (ensureMonthlySnapshotsError && !isWishThreadFeatureMissing(ensureMonthlySnapshotsError.message)) {
        syncMessage.value = `云端月刊补冻结失败：${ensureMonthlySnapshotsError.message}`
      }

      const { data: threadData, error: threadError } = await supabase
        .from('wish_threads')
        .select('id, space_id, wish_id, actor_id, event_kind, message_text, meta, created_at, updated_at')
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true })

      if (threadError) {
        if (threadError.code !== '42P01' && !/wish_threads/i.test(threadError.message)) {
          syncMessage.value = `云端手账同步失败：${threadError.message}`
          return false
        }
      } else {
        hasUnifiedThreadData = true
        threadRows = (threadData ?? []) as WishThreadRow[]

        const { data: reactionData, error: reactionError } = await supabase
          .from('thread_reactions')
          .select('id, space_id, target_thread_id, actor_id, emoji, created_at')
          .eq('space_id', spaceId)
          .order('created_at', { ascending: true })

        if (reactionError) {
          if (reactionError.code !== '42P01' && !/thread_reactions/i.test(reactionError.message)) {
            syncMessage.value = `云端表情回应同步失败：${reactionError.message}`
            return false
          }
        } else {
          threadReactionRows = ((reactionData ?? []) as ThreadReactionRow[]).map((reaction) =>
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
              syncMessage.value = `云端手账图片同步失败：${threadImageError.message}`
              return false
            }
          } else {
            threadImageRows = (threadImageData ?? []) as WishThreadImageRow[]

            if (threadImageRows.length) {
              const { data: signedThreadImageUrls, error: signedThreadImageUrlError } = await supabase.storage
                .from(WISH_COMMENT_IMAGE_BUCKET)
                .createSignedUrls(threadImageRows.map((image) => image.storage_path), 60 * 60)

              if (signedThreadImageUrlError) {
                syncMessage.value = `云端手账图片链接生成失败：${signedThreadImageUrlError.message}`
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
            syncMessage.value = `云端月刊同步失败：${snapshotError.message}`
            return false
          }
        } else {
          monthlySnapshotRows = (snapshotData ?? []) as MonthlyJournalSnapshotRow[]
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
            syncMessage.value = `云端愿望币同步失败：${wishCoinError.message}`
            return false
          }
        } else {
          wishCoinRows = (wishCoinData ?? []) as WishCoinRow[]
        }

        if (hasUnifiedThreadData) {
          commentRows = buildCommentRowsFromThreadEntries(
            threadRows.map((thread) =>
              createWishThreadEntry({
                actorId: thread.actor_id,
                createdAt: thread.created_at,
                eventKind: thread.event_kind,
                id: thread.id,
                messageText: thread.message_text,
                meta: isPlainRecord(thread.meta) ? thread.meta : {},
                spaceId: thread.space_id,
                updatedAt: thread.updated_at,
                wishId: thread.wish_id,
              }),
            ),
          )
          commentImageRows = threadImageRows.map((image) => ({
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
        } else {
          const { data, error: commentError } = await supabase
            .from('wish_comments')
            .select('id, wish_id, author_id, body, created_at')
            .in('wish_id', wishIds)
            .order('created_at', { ascending: false })

          if (commentError) {
            syncMessage.value = `云端留言同步失败：${commentError.message}`
            return false
          }

          commentRows = (data ?? []) as WishCommentRow[]

          const commentIds = commentRows.map((comment) => comment.id)

          if (commentIds.length) {
            const { data: commentImageData, error: commentImageError } = await supabase
              .from('wish_comment_images')
              .select('id, comment_id, created_by, storage_path, file_name, mime_type, size_bytes, sort_order, created_at')
              .in('comment_id', commentIds)
              .order('sort_order', { ascending: true })
              .order('created_at', { ascending: true })

            if (commentImageError) {
              syncMessage.value = `云端留言图片同步失败：${commentImageError.message}`
              return false
            }

            commentImageRows = (commentImageData ?? []) as WishCommentImageRow[]

            if (commentImageRows.length) {
              const { data: signedCommentImageUrls, error: signedCommentImageUrlError } = await supabase.storage
                .from(WISH_COMMENT_IMAGE_BUCKET)
                .createSignedUrls(commentImageRows.map((image) => image.storage_path), 60 * 60)

              if (signedCommentImageUrlError) {
                syncMessage.value = `云端留言图片链接生成失败：${signedCommentImageUrlError.message}`
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
          syncMessage.value = `云端步骤同步失败：${stepError.message}`
          return false
        }

        stepRows = (stepData ?? []) as WishStepRow[]

        const { data: imageData, error: imageError } = await supabase
          .from('wish_images')
          .select('id, wish_id, created_by, storage_path, file_name, mime_type, note, size_bytes, sort_order, created_at')
          .in('wish_id', wishIds)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })

        if (imageError) {
          syncMessage.value = `云端图片同步失败：${imageError.message}`
          return false
        }

        imageRows = (imageData ?? []) as WishImageRow[]

        if (imageRows.length) {
          const { data: signedImageUrls, error: signedImageUrlError } = await supabase.storage
            .from(WISH_IMAGE_BUCKET)
            .createSignedUrls(imageRows.map((image) => image.storage_path), 60 * 60)

          if (signedImageUrlError) {
            syncMessage.value = `云端图片链接生成失败：${signedImageUrlError.message}`
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

      const nextRewardPoolItems = rewardPoolItemRows.map((row) => createRewardPoolItemFromRow(row))
      const nextRewardClaims = rewardClaimRows.map((row) => createRewardClaimFromRow(row))
      const nextWishCoins = wishCoinRows.map((coin) =>
        createWishCoinRecord({
          amount: coin.amount,
          createdAt: coin.created_at,
          cycleKey: coin.cycle_key,
          id: coin.id,
          voterId: coin.voter_id,
          wishId: coin.wish_id,
        }),
      )
      const nextWishes = ((wishRows ?? []) as WishRow[]).map((wish) =>
        createWishRecordFromRow(wish, wishCoinRows, commentRows, commentImageRows, imageRows, stepRows, imageUrlMap, commentImageUrlMap),
      )
      const nextWishThreads = hasUnifiedThreadData
        ? buildWishThreadEntriesFromRows(threadRows, threadImageRows, threadReactionRows, commentImageUrlMap)
        : buildDerivedWishThreadEntries(nextWishes, nextWishCoins, nextRewardClaims, threadReactionRows)
      const nextMonthlySnapshots = monthlySnapshotRows.map((snapshot) =>
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

      rewardPoolItems.value = nextRewardPoolItems
      rewardClaims.value = nextRewardClaims
      wishCoins.value = nextWishCoins
      wishes.value = nextWishes
      threadReactions.value = threadReactionRows
      wishThreads.value = nextWishThreads
      monthlyJournalSnapshots.value = nextMonthlySnapshots
      lastLoadedSpaceId.value = spaceId
      syncMessage.value = '当前显示的是 Supabase 云端愿望数据。'
      return true
    } finally {
      isLoading.value = false
    }
  }

  async function runCloudMutation(
    mutate: () => Promise<{ error: { message: string } | null }>,
    successMessage: string,
  ) {
    if (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId) {
      return false
    }

    isLoading.value = true

    try {
      const { error } = await mutate()

      if (error) {
        syncMessage.value = `云端写入失败：${error.message}`
        return false
      }

      await syncFromSupabase(authStore.currentSpaceId)
      syncMessage.value = successMessage
      return true
    } finally {
      isLoading.value = false
    }
  }

  async function addWish(draft: WishDraft, initialStepTitles: string[] = []) {
    const normalizedStepTitles = draft.progressMode === 'steps'
      ? initialStepTitles.map((title) => title.trim()).filter((title) => !!title)
      : []

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase
      const ownerId = authStore.currentMemberId || authStore.currentMember?.id || draft.ownerId

      isLoading.value = true

      try {
        const { data, error } = await client
          .from('wishes')
          .insert({
            category: draft.category.trim(),
            due_date: draft.dueDate || null,
            note: draft.note.trim(),
            owner_id: ownerId,
            priority: draft.priority,
            progress_current: draft.progressCurrent,
            progress_mode: draft.progressMode,
            progress_target: draft.progressTarget,
            progress_unit: draft.progressUnit.trim(),
            scope: draft.scope,
            space_id: authStore.currentSpaceId,
            title: draft.title.trim(),
          })
          .select('id')
          .single()

        if (error) {
          syncMessage.value = `云端写入失败：${error.message}`
          return null
        }

        let successMessage = normalizedStepTitles.length
          ? `愿望和 ${normalizedStepTitles.length} 个初始步骤已写入 Supabase。`
          : '愿望已写入 Supabase。'

        if (data?.id && normalizedStepTitles.length) {
          const { error: stepError } = await client.from('wish_steps').insert(
            normalizedStepTitles.map((title, index) => ({
              is_done: false,
              sort_order: index + 1,
              title,
              wish_id: data.id,
            })),
          )

          if (stepError) {
            successMessage = `愿望已写入，但初始步骤同步失败：${stepError.message}`
          }
        }

        await syncFromSupabase(authStore.currentSpaceId)
        syncMessage.value = successMessage
        return data?.id ?? null
      } finally {
        isLoading.value = false
      }
    }

    const createdWish = createWishRecord({
      ...draft,
      steps: normalizedStepTitles.map((title) => createWishStep({ title })),
    })
    wishes.value.unshift(createdWish)
    syncMessage.value = normalizedStepTitles.length
      ? `愿望和 ${normalizedStepTitles.length} 个初始步骤已保存到本地。`
      : '愿望已保存到本地。'
    return createdWish.id
  }

  async function updateWish(id: string, draft: WishDraft) {
    const existingWish = findById(id)

    if (!existingWish) {
      return false
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () =>
          client
            .from('wishes')
            .update({
              category: draft.category.trim(),
              due_date: draft.dueDate || null,
              note: draft.note.trim(),
              owner_id: existingWish.ownerId,
              priority: draft.priority,
              progress_current: draft.progressCurrent,
              progress_mode: draft.progressMode,
              progress_target: draft.progressTarget,
              progress_unit: draft.progressUnit.trim(),
              scope: draft.scope,
              title: draft.title.trim(),
            })
            .eq('id', id),
        '愿望修改已同步到 Supabase。',
      )
    }

    wishes.value = wishes.value.map((wish) => {
      if (wish.id !== id) {
        return wish
      }

      return touchWish(
        createWishRecord({
          ...wish,
          ...draft,
        }),
      )
    })

    return true
  }

  async function deleteWish(id: string) {
    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () => client.from('wishes').delete().eq('id', id),
        '愿望已从 Supabase 删除。',
      )
    }

    wishes.value = wishes.value.filter((wish) => wish.id !== id)
    wishCoins.value = wishCoins.value.filter((coin) => coin.wishId !== id)
    rewardClaims.value = rewardClaims.value.map((claim) => {
      if (claim.sourceWishId !== id) {
        return claim
      }

      return {
        ...claim,
        sourceStepId: null,
        sourceWishId: null,
      }
    })
    return true
  }

  async function addRewardPoolItem(input: {
    tier: RewardTier
    title: string
    note?: string
    starCoinCost?: number
  }): Promise<RewardActionResult> {
    const memberId = getCurrentMemberId()
    const normalizedTitle = input.title.trim()
    const normalizedNote = input.note?.trim() ?? ''
    const normalizedCost = input.tier === 'premium'
      ? Math.max(0, Math.round(Number(input.starCoinCost ?? 0) || 0))
      : 0

    if (!memberId) {
      return rewardResult(false, '当前会话缺少领奖身份，请先切换到具体成员。')
    }

    if (!normalizedTitle) {
      return rewardResult(false, '先写下这条奖励是什么。')
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client.from('reward_pool_items').insert({
          is_archived: false,
          note: normalizedNote,
          owner_id: memberId,
          space_id: authStore.currentSpaceId,
          star_coin_cost: normalizedCost,
          tier: input.tier,
          title: normalizedTitle,
        })

        if (error) {
          return rewardResult(
            false,
            isRewardFeatureMissing(error.message)
              ? `奖励池写入失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。`
              : `奖励池写入失败：${error.message}`,
          )
        }

        await syncFromSupabase(authStore.currentSpaceId)
        return rewardResult(true, `已把「${normalizedTitle}」放进你的${input.tier === 'premium' ? '高档' : '日常'}奖励池。`)
      } finally {
        isLoading.value = false
      }
    }

    rewardPoolItems.value.unshift(
      createRewardPoolItem({
        note: normalizedNote,
        ownerId: memberId,
        starCoinCost: normalizedCost,
        tier: input.tier,
        title: normalizedTitle,
      }),
    )

    return rewardResult(true, `已把「${normalizedTitle}」放进你的${input.tier === 'premium' ? '高档' : '日常'}奖励池。`)
  }

  async function updateRewardPoolItem(
    itemId: string,
    updates: {
      title?: string
      note?: string
      starCoinCost?: number
    },
  ): Promise<RewardActionResult> {
    const memberId = getCurrentMemberId()
    const item = rewardPoolItems.value.find((entry) => entry.id === itemId)

    if (!memberId || !item || item.ownerId !== memberId) {
      return rewardResult(false, '只能修改你自己的奖励池条目。')
    }

    const nextTitle = typeof updates.title === 'string' ? updates.title.trim() : item.title
    const nextNote = typeof updates.note === 'string' ? updates.note.trim() : item.note
    const nextCost = item.tier === 'premium'
      ? Math.max(0, Math.round(Number(updates.starCoinCost ?? item.starCoinCost) || 0))
      : 0

    if (!nextTitle) {
      return rewardResult(false, '奖励名称不能为空。')
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client
          .from('reward_pool_items')
          .update({
            note: nextNote,
            star_coin_cost: nextCost,
            title: nextTitle,
          })
          .eq('id', itemId)

        if (error) {
          return rewardResult(
            false,
            isRewardFeatureMissing(error.message)
              ? `奖励池更新失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。`
              : `奖励池更新失败：${error.message}`,
          )
        }

        await syncFromSupabase(authStore.currentSpaceId)
        return rewardResult(true, `已更新「${nextTitle}」。`)
      } finally {
        isLoading.value = false
      }
    }

    item.title = nextTitle
    item.note = nextNote
    item.starCoinCost = nextCost
    item.updatedAt = new Date().toISOString()
    return rewardResult(true, `已更新「${nextTitle}」。`)
  }

  async function archiveRewardPoolItem(itemId: string): Promise<RewardActionResult> {
    const memberId = getCurrentMemberId()
    const item = rewardPoolItems.value.find((entry) => entry.id === itemId)

    if (!memberId || !item || item.ownerId !== memberId) {
      return rewardResult(false, '只能整理你自己的奖励池条目。')
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client
          .from('reward_pool_items')
          .update({ is_archived: true })
          .eq('id', itemId)

        if (error) {
          return rewardResult(
            false,
            isRewardFeatureMissing(error.message)
              ? `奖励池整理失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。`
              : `奖励池整理失败：${error.message}`,
          )
        }

        await syncFromSupabase(authStore.currentSpaceId)
        return rewardResult(true, `已把「${item.title}」收进已领取档案。`)
      } finally {
        isLoading.value = false
      }
    }

    item.isArchived = true
    item.updatedAt = new Date().toISOString()
    return rewardResult(true, `已把「${item.title}」收进已领取档案。`)
  }

  async function completeWishWithReward(wishId: string, rewardItemId: string): Promise<RewardActionResult> {
    const wish = findById(wishId)
    const memberId = getCurrentMemberId()
    const rewardItem = rewardPoolItems.value.find((item) => item.id === rewardItemId)

    if (!wish || !memberId) {
      return rewardResult(false, '当前没有可完成的愿望。')
    }

    if (wish.status === 'done') {
      return rewardResult(false, '这个愿望已经完成了。')
    }

    if (hasWishRewardClaim(wishId)) {
      return rewardResult(false, '这条愿望的完成奖励已经领过了。')
    }

    if (!rewardItem || rewardItem.ownerId !== memberId || rewardItem.tier !== 'premium' || rewardItem.isArchived) {
      return rewardResult(false, '请从你自己的高档奖励池里挑一个奖励。')
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client.rpc('complete_wish_with_reward', {
          target_reward_item_id: rewardItemId,
          target_wish_id: wishId,
        })

        if (error) {
          return rewardResult(
            false,
            isRewardFeatureMissing(error.message)
              ? `愿望领奖失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。`
              : `愿望领奖失败：${error.message}`,
          )
        }

        await syncFromSupabase(authStore.currentSpaceId)
        return rewardResult(true, `这条愿望已经完成，也接住了「${rewardItem.title}」。`)
      } finally {
        isLoading.value = false
      }
    }

    const now = new Date().toISOString()
    wish.status = 'done'
    wish.completedAt = now
    wish.updatedAt = now
    rewardClaims.value.unshift(
      createRewardClaimRecord({
        claimKind: 'wish_reward',
        createdAt: now,
        noteSnapshot: rewardItem.note,
        ownerId: memberId,
        rewardItemId: rewardItem.id,
        sourceWishId: wishId,
        starCoinDelta: 0,
        titleSnapshot: rewardItem.title,
      }),
    )
    return rewardResult(true, `这条愿望已经完成，也接住了「${rewardItem.title}」。`)
  }

  async function claimCompletedStepReward(
    wishId: string,
    stepId: string,
    selection: {
      rewardItemId?: string | null
      claimStarCoin?: boolean
    },
  ): Promise<RewardActionResult> {
    const wish = findById(wishId)
    const step = wish?.steps.find((item) => item.id === stepId)
    const memberId = getCurrentMemberId()
    const claimStarCoin = selection.claimStarCoin === true
    const rewardItem = selection.rewardItemId ? rewardPoolItems.value.find((item) => item.id === selection.rewardItemId) : null

    if (!wish || !step || wish.progressMode !== 'steps' || !memberId) {
      return rewardResult(false, '当前没有可领取的小奖励。')
    }

    if (!step.isDone) {
      return rewardResult(false, '先把这个步骤完成，再来空间页领奖。')
    }

    if (hasStepRewardClaim(stepId)) {
      return rewardResult(false, '这个步骤的小奖励已经领过了。')
    }

    if (!claimStarCoin && (!rewardItem || rewardItem.ownerId !== memberId || rewardItem.tier !== 'daily' || rewardItem.isArchived)) {
      return rewardResult(false, '请从你自己的日常奖励池里挑一个奖励，或者改存星星币。')
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client.rpc('claim_completed_step_reward', {
          claim_star_coin: claimStarCoin,
          target_reward_item_id: rewardItem?.id ?? null,
          target_step_id: stepId,
          target_wish_id: wishId,
        })

        if (error) {
          return rewardResult(
            false,
            isRewardFeatureMissing(error.message)
              ? `步骤领奖失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。`
              : `步骤领奖失败：${error.message}`,
          )
        }

        await syncFromSupabase(authStore.currentSpaceId)
        return rewardResult(
          true,
          claimStarCoin
            ? `这个步骤的小奖励已经存成 ${STEP_COMPLETION_STAR_COIN_REWARD} 枚星星币。`
            : `这个步骤的小奖励已经接住「${rewardItem?.title ?? ''}」。`,
        )
      } finally {
        isLoading.value = false
      }
    }

    rewardClaims.value.unshift(
      createRewardClaimRecord({
        claimKind: claimStarCoin ? 'star_coin' : 'step_reward',
        noteSnapshot: claimStarCoin ? '完成一个小步骤后，在空间页把这次奖励存成了 1 枚星星币。' : rewardItem?.note ?? '',
        ownerId: memberId,
        quantity: 1,
        rewardItemId: claimStarCoin ? null : rewardItem?.id ?? null,
        sourceStepId: stepId,
        sourceWishId: wishId,
        starCoinDelta: claimStarCoin ? STEP_COMPLETION_STAR_COIN_REWARD : 0,
        titleSnapshot: claimStarCoin ? `${STEP_COMPLETION_STAR_COIN_REWARD} 枚星星币` : rewardItem?.title ?? '',
      }),
    )

    return rewardResult(
      true,
      claimStarCoin
        ? `这个步骤的小奖励已经存成 ${STEP_COMPLETION_STAR_COIN_REWARD} 枚星星币。`
        : `这个步骤的小奖励已经接住「${rewardItem?.title ?? ''}」。`,
    )
  }

  async function claimCountProgressReward(
    wishId: string,
    selection: {
      quantity: number
      rewardItemId?: string | null
      claimStarCoin?: boolean
    },
  ): Promise<RewardActionResult> {
    const wish = findById(wishId)
    const memberId = getCurrentMemberId()
    const claimStarCoin = selection.claimStarCoin === true
    const rewardItem = selection.rewardItemId ? rewardPoolItems.value.find((item) => item.id === selection.rewardItemId) : null
    const quantity = Math.max(1, Math.trunc(Number(selection.quantity) || 0))
    const claimedUnits = countRewardClaimedUnitsByWish.value.get(wishId) ?? 0
    const target = wish ? Math.max(1, wish.progressTarget) : 0
    const current = wish ? Math.min(wish.progressCurrent, target) : 0
    const pendingUnits = Math.max(current - claimedUnits, 0)

    if (!wish || wish.progressMode !== 'count' || !memberId) {
      return rewardResult(false, '当前没有可领取的数字进度奖励。')
    }

    if (pendingUnits <= 0) {
      return rewardResult(false, '这条数字进度暂时没有待领取的小奖励。')
    }

    if (quantity > pendingUnits) {
      return rewardResult(false, `这条数字进度现在只剩 ${pendingUnits} 点待领取。`)
    }

    if (!claimStarCoin && (!rewardItem || rewardItem.ownerId !== memberId || rewardItem.tier !== 'daily' || rewardItem.isArchived)) {
      return rewardResult(false, '请从你自己的日常奖励池里挑一个奖励，或者改存星星币。')
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client.rpc('claim_count_progress_reward', {
          claim_quantity: quantity,
          claim_star_coin: claimStarCoin,
          target_reward_item_id: rewardItem?.id ?? null,
          target_wish_id: wishId,
        })

        if (error) {
          return rewardResult(
            false,
            isRewardFeatureMissing(error.message)
              ? `数字进度领奖失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。`
              : `数字进度领奖失败：${error.message}`,
          )
        }

        await syncFromSupabase(authStore.currentSpaceId)
        return rewardResult(
          true,
          claimStarCoin
            ? `这 ${quantity} 点数字进度已经存成 ${quantity} 枚星星币。`
            : `这 ${quantity} 点数字进度已经接住「${rewardItem?.title ?? ''}」。`,
        )
      } finally {
        isLoading.value = false
      }
    }

    rewardClaims.value.unshift(
      createRewardClaimRecord({
        claimKind: claimStarCoin ? 'star_coin' : 'count_reward',
        noteSnapshot: claimStarCoin ? `数字进度往前推进了 ${quantity} 点，在空间页把这次奖励存成了 ${quantity} 枚星星币。` : rewardItem?.note ?? '',
        ownerId: memberId,
        quantity,
        rewardItemId: claimStarCoin ? null : rewardItem?.id ?? null,
        sourceWishId: wishId,
        starCoinDelta: claimStarCoin ? quantity : 0,
        titleSnapshot: claimStarCoin ? `${quantity} 枚星星币` : rewardItem?.title ?? '',
      }),
    )

    return rewardResult(
      true,
      claimStarCoin
        ? `这 ${quantity} 点数字进度已经存成 ${quantity} 枚星星币。`
        : `这 ${quantity} 点数字进度已经接住「${rewardItem?.title ?? ''}」。`,
    )
  }

  async function redeemPremiumReward(rewardItemId: string): Promise<RewardActionResult> {
    const memberId = getCurrentMemberId()
    const rewardItem = rewardPoolItems.value.find((item) => item.id === rewardItemId)

    if (!memberId || !rewardItem || rewardItem.ownerId !== memberId || rewardItem.tier !== 'premium' || rewardItem.isArchived) {
      return rewardResult(false, '只能兑换你自己的高档奖励。')
    }

    if (rewardItem.starCoinCost <= 0) {
      return rewardResult(false, '这条高档奖励还没有设置星星币价格。')
    }

    if (getMemberStarCoinBalance(memberId) < rewardItem.starCoinCost) {
      return rewardResult(false, `还差 ${rewardItem.starCoinCost - getMemberStarCoinBalance(memberId)} 枚星星币。`)
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client.rpc('redeem_premium_reward', {
          target_reward_item_id: rewardItemId,
        })

        if (error) {
          return rewardResult(
            false,
            isRewardFeatureMissing(error.message)
              ? `高档奖励兑换失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 奖励 migration。`
              : `高档奖励兑换失败：${error.message}`,
          )
        }

        await syncFromSupabase(authStore.currentSpaceId)
        return rewardResult(true, `已用 ${rewardItem.starCoinCost} 枚星星币兑换「${rewardItem.title}」。`)
      } finally {
        isLoading.value = false
      }
    }

    rewardClaims.value.unshift(
      createRewardClaimRecord({
        claimKind: 'premium_redeem',
        noteSnapshot: rewardItem.note,
        ownerId: memberId,
        quantity: 1,
        rewardItemId: rewardItem.id,
        starCoinDelta: -rewardItem.starCoinCost,
        titleSnapshot: rewardItem.title,
      }),
    )

    return rewardResult(true, `已用 ${rewardItem.starCoinCost} 枚星星币兑换「${rewardItem.title}」。`)
  }

  async function toggleDone(id: string) {
    const wish = findById(id)

    if (!wish) {
      return false
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () =>
          client
            .from('wishes')
            .update({
              completed_at: wish.status === 'done' ? null : new Date().toISOString(),
              status: wish.status === 'done' ? 'active' : 'done',
            })
            .eq('id', id),
        '愿望状态已同步到 Supabase。',
      )
    }

    const now = new Date().toISOString()
    wish.status = wish.status === 'done' ? 'active' : 'done'
    wish.completedAt = wish.status === 'done' ? now : null
    wish.updatedAt = now
    return true
  }

  async function castWishCoin(id: string) {
    const wish = findById(id)
    const memberId = authStore.currentMemberId || authStore.currentMember?.id

    if (!wish || !memberId) {
      return false
    }

    if (wish.status === 'done') {
      syncMessage.value = '这个愿望已经实现了，不需要再为它投币。'
      return false
    }

    if (currentMemberRemainingCoins.value <= 0) {
      syncMessage.value = '这周分给你的 3 枚愿望币已经投完了。'
      return false
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      isLoading.value = true

      try {
        const { error } = await client.rpc('cast_wish_coin', {
          target_wish_id: id,
        })

        if (error) {
          syncMessage.value = /cast_wish_coin|wish_coins/i.test(error.message)
            ? `投币失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 愿望币 migration。`
            : `投币失败：${error.message}`
          return false
        }

        await syncFromSupabase(authStore.currentSpaceId)
        syncMessage.value = '已为这个愿望投出 1 枚愿望币。'
        return true
      } finally {
        isLoading.value = false
      }
    }

    wishCoins.value.unshift(
      createWishCoinRecord({
        cycleKey: currentWishCoinCycle.value.key,
        voterId: memberId,
        wishId: id,
      }),
    )
    wish.starred = true
    syncMessage.value = currentMemberRemainingCoins.value === 0
      ? '已投出这周最后 1 枚愿望币。'
      : '已为这个愿望投出 1 枚愿望币。'
    return true
  }

  async function toggleStar(id: string) {
    return castWishCoin(id)
  }

  async function setWishCountProgress(id: string, nextCurrent: number) {
    const wish = findById(id)

    if (!wish || wish.progressMode !== 'count') {
      return false
    }

    const normalizedCurrent = Math.min(normalizeProgressNumber(nextCurrent), Math.max(1, wish.progressTarget))

    if (normalizedCurrent === wish.progressCurrent) {
      syncMessage.value = normalizedCurrent >= Math.max(1, wish.progressTarget) ? '已经走到这个阶段的终点了。' : '进度没有变化。'
      return true
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () =>
          client
            .from('wishes')
            .update({ progress_current: normalizedCurrent })
            .eq('id', id),
        '进度已同步到 Supabase。',
      )
    }

    wish.progressCurrent = normalizedCurrent
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = '已更新当前进度。'
    return true
  }

  async function incrementWishCountProgress(id: string, delta = 1) {
    const wish = findById(id)

    if (!wish || wish.progressMode !== 'count') {
      return false
    }

    return setWishCountProgress(id, wish.progressCurrent + delta)
  }

  async function addWishStep(wishId: string, title: string) {
    const wish = findById(wishId)
    const normalizedTitle = title.trim()

    if (!wish || wish.progressMode !== 'steps') {
      return false
    }

    if (!normalizedTitle) {
      syncMessage.value = '先写下这个小步骤是什么。'
      return false
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () =>
          client.from('wish_steps').insert({
            is_done: false,
            sort_order: wish.steps.length + 1,
            title: normalizedTitle,
            wish_id: wishId,
          }),
        '小步骤已同步到 Supabase。',
      )
    }

    wish.steps.push(createWishStep({ title: normalizedTitle }))
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = '已添加一个小步骤。'
    return true
  }

  async function toggleWishStep(wishId: string, stepId: string) {
    const wish = findById(wishId)
    const step = wish?.steps.find((item) => item.id === stepId)

    if (!wish || !step || wish.progressMode !== 'steps') {
      return false
    }

    const nextDone = !step.isDone

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () =>
          client
            .from('wish_steps')
            .update({ is_done: nextDone })
            .eq('id', stepId)
            .eq('wish_id', wishId),
        nextDone ? '已完成一个小步骤。' : '这个步骤已经放回路上。',
      )
    }

    step.isDone = nextDone
    step.updatedAt = new Date().toISOString()
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = nextDone ? '已完成一个小步骤。' : '这个步骤已经放回路上。'
    return true
  }

  async function deleteWishStep(wishId: string, stepId: string) {
    const wish = findById(wishId)
    const nextSteps = wish?.steps.filter((step) => step.id !== stepId) ?? []

    if (!wish || nextSteps.length === wish.steps.length || wish.progressMode !== 'steps') {
      return false
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () =>
          client
            .from('wish_steps')
            .delete()
            .eq('id', stepId)
            .eq('wish_id', wishId),
        '已删除这个小步骤。',
      )
    }

    wish.steps = nextSteps
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = '已删除这个小步骤。'
    return true
  }

  async function addComment(wishId: string, authorId: string, message: string, files: File[] = []): Promise<WishActionResult> {
    const wish = findById(wishId)
    const normalizedMessage = message.trim()

    if (!wish) {
      return {
        message: '没有找到对应的愿望，暂时不能发送留言。',
        ok: false,
      }
    }

    if (!normalizedMessage) {
      return {
        message: '留言内容不能为空。',
        ok: false,
      }
    }

    if (files.length && (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId)) {
      return {
        message: '留言图片仅在已连接的 Supabase 云端空间中可用。',
        ok: false,
      }
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase
      const nextAuthorId = authStore.currentMemberId || authorId

      isLoading.value = true

      try {
        const { data: insertedComment, error: commentError } = await client
          .from('wish_comments')
          .insert({
            author_id: nextAuthorId,
            body: normalizedMessage,
            wish_id: wishId,
          })
          .select('id')
          .single()

        if (commentError || !insertedComment?.id) {
          syncMessage.value = `云端写入失败：${commentError?.message ?? '留言创建失败。'}`

          return {
            message: syncMessage.value || '留言发送失败，请稍后重试。',
            ok: false,
          }
        }

        let uploadedCount = 0
        let compressedCount = 0
        const skippedFiles: string[] = []
        const failedFiles: string[] = []
        let nextSortOrder = 0

        for (const file of files) {
          const normalizedType = file.type.trim().toLowerCase()

          if (!WISH_IMAGE_ALLOWED_TYPES.has(normalizedType) || file.size > WISH_IMAGE_SOURCE_MAX_BYTES) {
            skippedFiles.push(file.name)
            continue
          }

          const preparedUpload = await prepareWishImageUpload(file)
          const uploadFile = preparedUpload.file
          const uploadType = uploadFile.type.trim().toLowerCase()

          if (!WISH_IMAGE_ALLOWED_TYPES.has(uploadType) || uploadFile.size > WISH_IMAGE_MAX_BYTES) {
            skippedFiles.push(file.name)
            continue
          }

          nextSortOrder += 1
          const storagePath = createWishCommentImageStoragePath(insertedComment.id, nextAuthorId, uploadFile.name, uploadType)

          const { error: uploadError } = await client.storage.from(WISH_COMMENT_IMAGE_BUCKET).upload(storagePath, uploadFile, {
            cacheControl: '3600',
            contentType: uploadType,
            upsert: false,
          })

          if (uploadError) {
            nextSortOrder -= 1
            failedFiles.push(file.name)
            continue
          }

          const { error: rowError } = await client.from('wish_comment_images').insert({
            comment_id: insertedComment.id,
            created_by: nextAuthorId,
            file_name: uploadFile.name.trim() || 'image',
            mime_type: uploadType,
            size_bytes: uploadFile.size,
            sort_order: nextSortOrder,
            storage_path: storagePath,
          })

          if (rowError) {
            nextSortOrder -= 1
            failedFiles.push(file.name)
            await client.storage.from(WISH_COMMENT_IMAGE_BUCKET).remove([storagePath])
            continue
          }

          uploadedCount += 1

          if (preparedUpload.compressed) {
            compressedCount += 1
          }
        }

        await syncFromSupabase(authStore.currentSpaceId)

        if (!files.length) {
          syncMessage.value = '留言已同步到 Supabase。'

          return {
            message: '这句近况已经送出。',
            ok: true,
          }
        }

        if (uploadedCount === files.length && !failedFiles.length && !skippedFiles.length) {
          syncMessage.value = compressedCount
            ? `留言和 ${uploadedCount} 张图片已同步到 Supabase，其中 ${compressedCount} 张已自动压缩。`
            : `留言和 ${uploadedCount} 张图片已同步到 Supabase。`

          return {
            message: '这句近况和图片已经送出。',
            ok: true,
          }
        }

        syncMessage.value = `这句近况已经送出；${uploadedCount} 张图片上传成功${compressedCount ? `，其中 ${compressedCount} 张已自动压缩` : ''}${failedFiles.length ? `；${failedFiles.length} 张失败` : ''}${skippedFiles.length ? `；${skippedFiles.length} 张因格式或大小限制被跳过` : ''}。`

        return {
          message: syncMessage.value,
          ok: true,
        }
      } finally {
        isLoading.value = false
      }
    }

    wish.comments.unshift(
      createWishComment({
        authorId,
        message: normalizedMessage,
      }),
    )
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = '留言已保存到本地。'

    return {
      message: '这句近况已经记下。',
      ok: true,
    }
  }

  async function updateComment(wishId: string, commentId: string, nextMessage: string): Promise<WishActionResult> {
    const wish = findById(wishId)
    const normalizedMessage = nextMessage.trim()
    const currentMemberId = getCurrentMemberId()
    const comment = wish?.comments.find((entry) => entry.id === commentId)

    if (!wish || !comment || !currentMemberId) {
      return {
        message: '当前没有可编辑的留言。',
        ok: false,
      }
    }

    if (comment.authorId !== currentMemberId) {
      return {
        message: '只能编辑自己写下的留言。',
        ok: false,
      }
    }

    if (!normalizedMessage) {
      return {
        message: '留言内容不能为空。',
        ok: false,
      }
    }

    if (supabase && isUsingCloudWishes.value) {
      isLoading.value = true

      try {
        const { error } = await supabase
          .from('wish_comments')
          .update({ body: normalizedMessage })
          .eq('id', commentId)
          .eq('wish_id', wishId)

        if (error) {
          const message = `留言编辑失败：${error.message}`
          syncMessage.value = message

          return {
            message,
            ok: false,
          }
        }

        await syncFromSupabase(authStore.currentSpaceId)
        syncMessage.value = '留言已更新。'

        return {
          message: '这句留言已经改好了。',
          ok: true,
        }
      } finally {
        isLoading.value = false
      }
    }

    comment.message = normalizedMessage
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = '留言已更新。'

    return {
      message: '这句留言已经改好了。',
      ok: true,
    }
  }

  async function deleteComment(wishId: string, commentId: string): Promise<WishActionResult> {
    const wish = findById(wishId)
    const currentMemberId = getCurrentMemberId()
    const comment = wish?.comments.find((entry) => entry.id === commentId)

    if (!wish || !comment || !currentMemberId) {
      return {
        message: '当前没有可删除的留言。',
        ok: false,
      }
    }

    if (comment.authorId !== currentMemberId) {
      return {
        message: '只能删除自己写下的留言。',
        ok: false,
      }
    }

    if (supabase && isUsingCloudWishes.value) {
      isLoading.value = true

      try {
        const { error } = await supabase
          .from('wish_comments')
          .delete()
          .eq('id', commentId)
          .eq('wish_id', wishId)

        if (error) {
          const message = `留言删除失败：${error.message}`
          syncMessage.value = message

          return {
            message,
            ok: false,
          }
        }

        await syncFromSupabase(authStore.currentSpaceId)
        syncMessage.value = '留言已删除。'

        return {
          message: '这句留言已经移走了。',
          ok: true,
        }
      } finally {
        isLoading.value = false
      }
    }

    wish.comments = wish.comments.filter((entry) => entry.id !== commentId)
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = '留言已删除。'

    return {
      message: '这句留言已经移走了。',
      ok: true,
    }
  }

  async function toggleThreadReaction(threadId: string, emoji: string): Promise<WishActionResult> {
    const thread = wishThreads.value.find((entry) => entry.id === threadId)
    const memberId = getCurrentMemberId()
    const normalizedEmoji = emoji.trim()

    if (!thread || !memberId) {
      return {
        message: '当前没有可以回应的手账记录。',
        ok: false,
      }
    }

    if (!normalizedEmoji) {
      return {
        message: '先选一个表情再回应。',
        ok: false,
      }
    }

    const existingReaction = threadReactions.value.find(
      (reaction) => reaction.targetThreadId === threadId && reaction.actorId === memberId && reaction.emoji === normalizedEmoji,
    )
    const successMessage = existingReaction ? '已取消这个表情回应。' : '已留下这个表情回应。'

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      isLoading.value = true

      try {
        const { error } = existingReaction
          ? await supabase.from('thread_reactions').delete().eq('id', existingReaction.id)
          : await supabase.from('thread_reactions').insert({
            actor_id: memberId,
            emoji: normalizedEmoji,
            space_id: authStore.currentSpaceId,
            target_thread_id: threadId,
          })

        if (error) {
          const nextMessage = isWishThreadFeatureMissing(error.message)
            ? `表情回应失败：${error.message}。如果你刚更新前端，请先执行新的 Supabase 手账 migration。`
            : `表情回应失败：${error.message}`

          syncMessage.value = nextMessage

          return {
            message: nextMessage,
            ok: false,
          }
        }

        await syncFromSupabase(authStore.currentSpaceId)
        syncMessage.value = successMessage

        return {
          message: successMessage,
          ok: true,
        }
      } finally {
        isLoading.value = false
      }
    }

    threadReactions.value = existingReaction
      ? threadReactions.value.filter((reaction) => reaction.id !== existingReaction.id)
      : [
        createThreadReactionRecord({
          actorId: memberId,
          emoji: normalizedEmoji,
          spaceId: thread.spaceId,
          targetThreadId: threadId,
        }),
        ...threadReactions.value,
      ]

    refreshLocalActivityState()
    syncMessage.value = successMessage

    return {
      message: successMessage,
      ok: true,
    }
  }

  async function uploadWishImages(wishId: string, files: File[]) {
    const wish = findById(wishId)

    if (!wish || !files.length) {
      return false
    }

    if (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId) {
      syncMessage.value = '图片上传仅在已连接的 Supabase 云端空间中可用。'
      return false
    }

    const uploaderId = authStore.currentMemberId || authStore.currentMember?.id

    if (!uploaderId) {
      syncMessage.value = '当前会话缺少上传身份，请重新登录后再试。'
      return false
    }

    isLoading.value = true

    let uploadedCount = 0
    let compressedCount = 0
    const skippedFiles: string[] = []
    const failedFiles: string[] = []
    let nextSortOrder = wish.images.length

    try {
      for (const file of files) {
        const normalizedType = file.type.trim().toLowerCase()

        if (!WISH_IMAGE_ALLOWED_TYPES.has(normalizedType) || file.size > WISH_IMAGE_SOURCE_MAX_BYTES) {
          skippedFiles.push(file.name)
          continue
        }

        const preparedUpload = await prepareWishImageUpload(file)
        const uploadFile = preparedUpload.file
        const uploadType = uploadFile.type.trim().toLowerCase()

        if (!WISH_IMAGE_ALLOWED_TYPES.has(uploadType) || uploadFile.size > WISH_IMAGE_MAX_BYTES) {
          skippedFiles.push(file.name)
          continue
        }

        nextSortOrder += 1
        const storagePath = createWishImageStoragePath(wishId, uploaderId, uploadFile.name, uploadType)

        const { error: uploadError } = await supabase.storage.from(WISH_IMAGE_BUCKET).upload(storagePath, uploadFile, {
          cacheControl: '3600',
          contentType: uploadType,
          upsert: false,
        })

        if (uploadError) {
          nextSortOrder -= 1
          failedFiles.push(file.name)
          continue
        }

        const { error: rowError } = await supabase.from('wish_images').insert({
          created_by: uploaderId,
          file_name: uploadFile.name.trim() || 'image',
          mime_type: uploadType,
          size_bytes: uploadFile.size,
          sort_order: nextSortOrder,
          storage_path: storagePath,
          wish_id: wishId,
        })

        if (rowError) {
          nextSortOrder -= 1
          failedFiles.push(file.name)
          await supabase.storage.from(WISH_IMAGE_BUCKET).remove([storagePath])
          continue
        }

        uploadedCount += 1

        if (preparedUpload.compressed) {
          compressedCount += 1
        }
      }

      if (uploadedCount) {
        await syncFromSupabase(authStore.currentSpaceId)
      }

      if (uploadedCount && !failedFiles.length && !skippedFiles.length) {
        syncMessage.value = compressedCount
          ? `已上传 ${uploadedCount} 张图片到 Supabase，其中 ${compressedCount} 张已自动压缩。`
          : `已上传 ${uploadedCount} 张图片到 Supabase。`
        return true
      }

      if (uploadedCount) {
        syncMessage.value = `已上传 ${uploadedCount} 张图片${compressedCount ? `，其中 ${compressedCount} 张已自动压缩` : ''}；${failedFiles.length} 张失败，${skippedFiles.length} 张因格式或大小限制被跳过。`
        return true
      }

      syncMessage.value = failedFiles.length || skippedFiles.length
        ? `没有图片成功上传。${failedFiles.length ? ` 失败 ${failedFiles.length} 张。` : ''}${skippedFiles.length ? ` 跳过 ${skippedFiles.length} 张。` : ''}`
        : '没有检测到可上传的图片。'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function deleteWishImage(wishId: string, imageId: string) {
    const wish = findById(wishId)
    const image = wish?.images.find((item) => item.id === imageId)

    if (!wish || !image) {
      return false
    }

    if (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId) {
      syncMessage.value = '图片删除仅在已连接的 Supabase 云端空间中可用。'
      return false
    }

    isLoading.value = true

    try {
      const { error: storageError } = await supabase.storage.from(WISH_IMAGE_BUCKET).remove([image.storagePath])

      if (storageError) {
        syncMessage.value = `云端图片删除失败：${storageError.message}`
        return false
      }

      const { error: rowError } = await supabase.from('wish_images').delete().eq('id', imageId)

      if (rowError) {
        syncMessage.value = `图片记录删除失败：${rowError.message}`
        return false
      }

      await syncFromSupabase(authStore.currentSpaceId)
      syncMessage.value = '图片已从 Supabase 删除。'
      return true
    } finally {
      isLoading.value = false
    }
  }

  async function deleteWishImages(wishId: string, imageIds: string[]) {
    const wish = findById(wishId)
    const uniqueImageIds = [...new Set(imageIds)]
    const selectedImages = wish?.images.filter((image) => uniqueImageIds.includes(image.id)) ?? []

    if (!wish || !selectedImages.length) {
      return false
    }

    if (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId) {
      const selectedIdSet = new Set(uniqueImageIds)
      wish.images = wish.images.filter((image) => !selectedIdSet.has(image.id))
      wish.updatedAt = new Date().toISOString()
      syncMessage.value = `已删除 ${selectedImages.length} 张图片。`
      return true
    }

    const currentMemberId = authStore.currentMemberId
    const deletableImages = selectedImages.filter((image) => image.createdBy === currentMemberId)
    const blockedCount = selectedImages.length - deletableImages.length

    if (!deletableImages.length) {
      syncMessage.value = '选中的图片都不是当前账号上传，暂时不能删除。'
      return false
    }

    isLoading.value = true

    try {
      const { error: storageError } = await supabase.storage
        .from(WISH_IMAGE_BUCKET)
        .remove(deletableImages.map((image) => image.storagePath))

      if (storageError) {
        syncMessage.value = `批量删除图片失败：${storageError.message}`
        return false
      }

      const { error: rowError } = await supabase
        .from('wish_images')
        .delete()
        .eq('wish_id', wishId)
        .in('id', deletableImages.map((image) => image.id))

      if (rowError) {
        syncMessage.value = `批量删除图片记录失败：${rowError.message}`
        return false
      }

      await syncFromSupabase(authStore.currentSpaceId)
      syncMessage.value = blockedCount
        ? `已删除 ${deletableImages.length} 张图片；${blockedCount} 张不是当前账号上传，未删除。`
        : `已删除 ${deletableImages.length} 张图片。`
      return true
    } finally {
      isLoading.value = false
    }
  }

  async function updateWishImageNote(wishId: string, imageId: string, nextNote: string) {
    const wish = findById(wishId)
    const image = wish?.images.find((item) => item.id === imageId)
    const normalizedNote = nextNote.trim()

    if (!wish || !image) {
      return false
    }

    if (normalizedNote.length > 240) {
      syncMessage.value = '图片备注最多 240 个字。'
      return false
    }

    if (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId) {
      image.note = normalizedNote
      wish.updatedAt = new Date().toISOString()
      syncMessage.value = normalizedNote ? '图片备注已保存。' : '图片备注已清空。'
      return true
    }

    const client = supabase

    return runCloudMutation(
      async () =>
        client.rpc('update_wish_image_note', {
          next_note: normalizedNote,
          target_image_id: imageId,
          target_wish_id: wishId,
        }),
      normalizedNote ? '图片备注已保存。' : '图片备注已清空。',
    )
  }

  async function setWishCoverImage(wishId: string, imageId: string) {
    const wish = findById(wishId)
    const imageIndex = wish?.images.findIndex((item) => item.id === imageId) ?? -1

    if (!wish || imageIndex < 0) {
      return false
    }

    if (imageIndex === 0) {
      syncMessage.value = '当前图片已经是首图。'
      return true
    }

    if (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId) {
      const [coverImage] = wish.images.splice(imageIndex, 1)

      if (!coverImage) {
        return false
      }

      wish.images.unshift(coverImage)
      wish.updatedAt = new Date().toISOString()
      syncMessage.value = '已将当前图片设为首图。'
      return true
    }

    isLoading.value = true

    try {
      const { error } = await supabase.rpc('set_wish_image_cover', {
        target_image_id: imageId,
        target_wish_id: wishId,
      })

      if (error) {
        syncMessage.value = `首图更新失败：${error.message}`
        return false
      }

      await syncFromSupabase(authStore.currentSpaceId)
      syncMessage.value = '已将当前图片设为首图。'
      return true
    } finally {
      isLoading.value = false
    }
  }

  async function reorderWishImages(wishId: string, orderedImageIds: string[]) {
    const wish = findById(wishId)

    if (!wish || !orderedImageIds.length) {
      return false
    }

    const originalImages = [...wish.images]
    const reorderedImages = reorderImagesByIds(originalImages, orderedImageIds)

    if (!reorderedImages) {
      syncMessage.value = '图片排序失败：排序结果不完整。'
      return false
    }

    const isSameOrder = reorderedImages.every((image, index) => image.id === originalImages[index]?.id)

    if (isSameOrder) {
      return true
    }

    wish.images = reorderedImages

    if (!supabase || !isUsingCloudWishes.value || !authStore.currentSpaceId) {
      wish.updatedAt = new Date().toISOString()
      syncMessage.value = '已更新图片顺序。'
      return true
    }

    isLoading.value = true

    try {
      const { error } = await supabase.rpc('set_wish_image_order', {
        ordered_image_ids: orderedImageIds,
        target_wish_id: wishId,
      })

      if (error) {
        wish.images = originalImages
        syncMessage.value = `图片排序失败：${error.message}`
        return false
      }

      await syncFromSupabase(authStore.currentSpaceId)
      syncMessage.value = '已更新图片顺序。'
      return true
    } finally {
      isLoading.value = false
    }
  }

  function resetToSeed() {
    if (isUsingCloudWishes.value) {
      syncMessage.value = '云端模式下不支持恢复本地示例数据。'
      return
    }

    const seedState = createSeedWishState()
    wishes.value = seedState.wishes
    wishCoins.value = seedState.coins
    threadReactions.value = seedState.threadReactions
    monthlyJournalSnapshots.value = seedState.monthlyJournalSnapshots
    rewardPoolItems.value = seedState.rewardPoolItems
    rewardClaims.value = seedState.rewardClaims
    refreshLocalActivityState()
    syncMessage.value = '已恢复本地示例数据。'
  }

  function createBackupPayload(): WishBackupPayload {
    return {
      version: 6,
      exportedAt: new Date().toISOString(),
      space: {
        dataMode: authStore.usesSupabaseSpace ? 'supabase' : 'mock',
        id: authStore.currentSpaceId || null,
        inviteCode: authStore.inviteCode,
        memberCount: authStore.members.length,
        name: authStore.spaceName,
      },
      coins: wishCoins.value.map((coin) => createWishCoinRecord(coin)),
      monthlyJournalSnapshots: monthlyJournalSnapshots.value.map((snapshot) => createMonthlyJournalSnapshotRecord(snapshot)),
      rewardClaims: rewardClaims.value.map((claim) => createRewardClaimRecord(claim)),
      rewardPoolItems: rewardPoolItems.value.map((item) => createRewardPoolItem(item)),
      threadReactions: threadReactions.value.map((reaction) => createThreadReactionRecord(reaction)),
      threads: wishThreads.value.map((thread) => createWishThreadEntry(thread)),
      wishes: wishes.value.map((wish) => createWishRecord(wish)),
    }
  }

  watch(
    [wishes, wishCoins, rewardClaims, threadReactions],
    () => {
      if (isUsingCloudWishes.value) {
        return
      }

      refreshLocalActivityState()
    },
    { deep: true, immediate: true },
  )

  const storage = getBrowserStorage()

  if (storage) {
    watch(
      [wishes, wishCoins, rewardPoolItems, rewardClaims, threadReactions, monthlyJournalSnapshots],
      ([nextWishes, nextCoins, nextRewardPoolItems, nextRewardClaims, nextThreadReactions, nextMonthlyJournalSnapshots]) => {
        const nextState: PersistedWishState = {
          version: 6,
          coins: nextCoins.map((coin) => createWishCoinRecord(coin)),
          monthlyJournalSnapshots: nextMonthlyJournalSnapshots.map((snapshot) => createMonthlyJournalSnapshotRecord(snapshot)),
          rewardClaims: nextRewardClaims.map((claim) => createRewardClaimRecord(claim)),
          rewardPoolItems: nextRewardPoolItems.map((item) => createRewardPoolItem(item)),
          threadReactions: nextThreadReactions.map((reaction) => createThreadReactionRecord(reaction)),
          wishes: nextWishes.map((wish) => createWishRecord(wish)),
        }

        storage.setItem(STORAGE_KEY, JSON.stringify(nextState))
      },
      { deep: true },
    )
  }

  watch(
    [() => authStore.usesSupabaseSpace, () => authStore.currentSpaceId],
    ([usesCloudSpace, spaceId]) => {
      if (usesCloudSpace && spaceId) {
        setupRealtimeSubscription(spaceId)

        if (lastLoadedSpaceId.value !== spaceId) {
          void syncFromSupabase(spaceId)
        }

        return
      }

      teardownRealtimeSubscription()

      if (lastLoadedSpaceId.value) {
        const localState = hydrateWishState()
        wishes.value = localState.wishes
        wishCoins.value = localState.coins
        threadReactions.value = localState.threadReactions
        monthlyJournalSnapshots.value = localState.monthlyJournalSnapshots
        rewardPoolItems.value = localState.rewardPoolItems
        rewardClaims.value = localState.rewardClaims
        refreshLocalActivityState()
        lastLoadedSpaceId.value = null
      }

      syncMessage.value = '当前使用本地演示数据。'
    },
    { immediate: true },
  )

  return {
    addWish,
    addComment,
    addRewardPoolItem,
    addWishStep,
    archiveRewardPoolItem,
    claimCompletedStepReward,
    claimCountProgressReward,
    completeWishWithReward,
    createBackupPayload,
    currentMemberStarCoinBalance,
    deleteComment,
    deleteWishImage,
    deleteWishImages,
    deleteWish,
    deleteWishStep,
    dragonBallWishes,
    dueSoonWishes,
    findById,
    getMemberStarCoinBalance,
    getRewardItemClaimCount,
    getRewardPoolItems,
    getStepRewardClaim,
    getWishThreadEntries,
    getWishCoinSummary,
    getWishProgressSnapshot,
    getWishRewardClaim,
    hasStepRewardClaim,
    hasWishRewardClaim,
    incrementWishCountProgress,
    imageStorageSummary,
    isLoading,
    isUsingCloudWishes,
    latestComments,
    latestRewardClaims,
    castWishCoin,
    currentMemberRemainingCoins,
    currentMemberUsedCoins,
    currentWishCoinCycle,
    nearestDueWishes,
    monthlyJournalSnapshots,
    overdueWishes,
    pendingCountRewardSummaries,
    pendingSmallRewardCount,
    pendingStepRewards,
    realtimeMessage,
    realtimeStatus,
    reorderWishImages,
    recentlyCompletedWishes,
    resetToSeed,
    redeemPremiumReward,
    rewardClaims,
    rewardPoolItems,
    setWishCoverImage,
    syncFromSupabase,
    syncMessage,
    sortedWishes,
    stats,
    setWishCountProgress,
    threadReactions,
    toggleDone,
    toggleThreadReaction,
    toggleWishStep,
    toggleStar,
    updateComment,
    updateRewardPoolItem,
    updateWishImageNote,
    uploadWishImages,
    upcomingWishes,
    updateWish,
    wishBottleSnapshot,
    wishCoins,
    wishThreads,
    wishes,
  }
})