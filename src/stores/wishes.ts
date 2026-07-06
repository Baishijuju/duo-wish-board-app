import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import {
  compareIsoAscending as compareIsoAscendingModule,
  createMonthlyJournalSnapshotRecord as createMonthlyJournalSnapshotRecordModule,
  createThreadReactionRecord as createThreadReactionRecordModule,
  createWishThreadEntry as createWishThreadEntryModule,
} from '../modules/journal/journal.factories'
import {
  buildDerivedWishThreadEntries as buildDerivedWishThreadEntriesModule,
  createLocalMonthlyJournalSnapshot as createLocalMonthlyJournalSnapshotModule,
  ensureLocalMonthlySnapshots as ensureLocalMonthlySnapshotsModule,
} from '../modules/journal/journal.projection.local'
import { toggleThreadReactionWrite } from '../modules/journal/journal.reaction.write'
import {
  shouldSyncForCommentImageRealtimeEvent,
  shouldSyncForThreadImageRealtimeEvent,
  shouldSyncForWishRealtimeEvent,
} from '../modules/sync/realtime.filters'
import {
  getKnownAppCapabilityMessage,
  shouldRefreshAppCapabilities,
  isWishThreadFeatureMissing as isWishThreadFeatureMissingModule,
} from '../modules/sync/capabilities'
import {
  buildRealtimeSubscription,
  createRealtimeSyncControllerState,
  scheduleRealtimeSync as scheduleRealtimeSyncModule,
  teardownRealtimeSubscription as teardownRealtimeSubscriptionModule,
} from '../modules/sync/wish.sync.controller'
import { composeWishCloudState } from '../modules/sync/wish.cloud.compose'
import { fetchWishCloudRows } from '../modules/sync/wish.cloud.fetch'
import { createRewardClaimRecord as createRewardClaimRecordModule, createRewardPoolItem as createRewardPoolItemModule } from '../modules/rewards/reward.factories'
import {
  addRewardPoolItemWrite,
  archiveRewardPoolItemWrite,
  depositRewardStarCoinsWrite,
  redeemPremiumRewardWrite,
  updateRewardPoolItemWrite,
} from '../modules/rewards/reward.write'
import {
  buildCountRewardClaimedUnitsByWish,
  buildRewardClaimByStepId,
  buildRewardClaimByWishId,
  buildRewardClaimCountsByItem,
  buildRewardDepositTotalsByItem,
  buildStarCoinBalanceByMember,
} from '../modules/rewards/reward.rules'
import {
  createWishComment as createWishCommentModule,
  createWishRecord as createWishRecordModule,
  createWishStep as createWishStepModule,
} from '../modules/wishes/wish.factories'
import { createMockWishSeedState } from '../modules/wishes/wish.mock-seed'
import { addCommentWrite, deleteCommentWrite, updateCommentWrite } from '../modules/wishes/wish.comments.write'
import {
  addWishStepWrite,
  claimCompletedStepRewardWrite,
  claimCountProgressRewardWrite,
  completeWishWithRewardWrite,
  deleteWishStepWrite,
  setWishCountProgressWrite,
  toggleDoneWrite,
  toggleWishStepWrite,
} from '../modules/wishes/wish.progress.write'
import {
  addWishCloud,
  addWishLocal,
  deleteWishLocal,
  runCloudMutation as runCloudMutationModule,
  updateWishLocal,
} from '../modules/wishes/wish.write'
import {
  deleteWishImageWrite,
  deleteWishImagesWrite,
  reorderWishImagesWrite,
  setWishCoverImageWrite,
  updateWishImageNoteWrite,
  uploadCommentImagesWrite,
  uploadWishImagesWrite,
} from '../modules/wishes/wish.media.write'
import {
  getWishBottleColorTier as getWishBottleColorTierModule,
  getWishCompletionTimestamp as getWishCompletionTimestampModule,
  getWishProgressSnapshot as getWishProgressSnapshotModule,
  normalizeProgressNumber as normalizeProgressNumberModule,
} from '../modules/wishes/wish.progress'
import {
  getBrowserStorage as getBrowserStorageModule,
  hydrateWishState as hydrateWishStateModule,
  STORAGE_KEY as STORAGE_KEY_MODULE,
  touchWish as touchWishModule,
} from '../modules/wishes/wish.local'
import { createId as createIdModule } from '../shared/ids'
import { useAuthStore } from './auth'

export type WishStatus = 'active' | 'done'
export type WishScope = 'shared' | 'private'
export type WishProgressMode = 'none' | 'count' | 'steps'
export type RewardTier = 'daily' | 'premium'
export type RewardScope = 'personal' | 'shared'
export type RewardClaimKind = 'step_reward' | 'wish_reward' | 'count_reward' | 'star_coin' | 'premium_redeem' | 'step_star_coin' | 'count_star_coin' | 'wish_completion_bonus' | 'reward_deposit'
export type WishBottleColorTier = 'blue' | 'green' | 'orange' | 'gold' | 'rainbow'
export type WishThreadEventKind =
  | 'comment'
  | 'wish_published'
  | 'wish_step_completed'
  | 'reward_claimed'
  | 'wish_completed'
  | 'weekly_welfare_issued'
  | 'premium_redeem'
export type MonthlyJournalSnapshotStatus = 'ready'

const STORAGE_KEY = STORAGE_KEY_MODULE
const WISH_IMAGE_BUCKET = 'wish-images'
const WISH_COMMENT_IMAGE_BUCKET = 'wish-comment-images'
const WISH_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const WISH_IMAGE_SOURCE_MAX_BYTES = 25 * 1024 * 1024
const WISH_IMAGE_COMPRESS_MAX_EDGE = 2048
const WISH_IMAGE_COMPRESS_TARGET_BYTES = 1800 * 1024
const RECENTLY_COMPLETED_WINDOW_DAYS = 30
const SUPABASE_FREE_FILE_STORAGE_BYTES = 1024 * 1024 * 1024
const BEIJING_TIME_OFFSET_MS = 8 * 60 * 60 * 1000
const WISH_IMAGE_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const WISH_IMAGE_COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const WISH_IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const WISH_IMAGE_COMPRESS_QUALITY_STEPS = [0.92, 0.88, 0.84, 0.8]
const WISH_MAX_IMAGE_COUNT_PER_WISH = 1
const MAX_THREAD_REACTIONS_PER_MEMBER = 3
const LOCAL_REALTIME_ECHO_TTL_MS = 15_000

export const STEP_COMPLETION_STAR_COIN_REWARD = 1

export interface WishDraft {
  title: string
  category: string
  note: string
  ownerId: string
  scope: WishScope
  progressMode: WishProgressMode
  progressCurrent: number
  progressTarget: number
  progressUnit: string
  progressStarCoinValue: number
  completionStarCoinBonus: number
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
  scope: RewardScope
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

export interface RetryableAction {
  label: string
  retry: () => Promise<unknown>
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
  starCoinValue: number
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
  note: string
  ownerId: string
  scope: WishScope
  status: WishStatus
  starred: boolean
  progressMode: WishProgressMode
  progressCurrent: number
  progressTarget: number
  progressUnit: string
  progressStarCoinValue: number
  completionStarCoinBonus: number
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

interface PersistedWishState {
  version: 6
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
  rewardClaims: RewardClaimRecord[]
  rewardPoolItems: RewardPoolItem[]
  threadReactions: ThreadReactionRecord[]
  wishes: WishRecord[]
}

function createId() {
  return createIdModule()
}

function createWishComment(partial: Partial<WishComment> & Pick<WishComment, 'authorId' | 'message'>): WishComment {
  return createWishCommentModule(partial)
}

function createWishStep(partial: Partial<WishStep> & Pick<WishStep, 'title'>): WishStep {
  return createWishStepModule(partial)
}

function createRewardPoolItem(
  partial: Partial<RewardPoolItem> & Pick<RewardPoolItem, 'ownerId' | 'tier' | 'title'>,
): RewardPoolItem {
  return createRewardPoolItemModule(partial)
}

function createRewardClaimRecord(
  partial: Partial<RewardClaimRecord> & Pick<RewardClaimRecord, 'ownerId' | 'claimKind' | 'titleSnapshot'>,
): RewardClaimRecord {
  return createRewardClaimRecordModule(partial)
}

function createThreadReactionRecord(
  partial: Partial<ThreadReactionRecord> & Pick<ThreadReactionRecord, 'targetThreadId' | 'actorId' | 'emoji'>,
): ThreadReactionRecord {
  return createThreadReactionRecordModule(partial)
}

function createWishThreadEntry(
  partial: Partial<WishThreadEntry> & Pick<WishThreadEntry, 'eventKind' | 'messageText'>,
): WishThreadEntry {
  return createWishThreadEntryModule(partial)
}

function createMonthlyJournalSnapshotRecord(
  partial: Partial<MonthlyJournalSnapshotRecord> & Pick<MonthlyJournalSnapshotRecord, 'monthKey' | 'coverTitle'>,
): MonthlyJournalSnapshotRecord {
  return createMonthlyJournalSnapshotRecordModule(partial)
}

function compareIsoAscending(leftDateValue: string, rightDateValue: string) {
  return compareIsoAscendingModule(leftDateValue, rightDateValue)
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

function buildDerivedWishThreadEntries(
  wishes: WishRecord[],
  rewardClaims: RewardClaimRecord[],
  reactions: ThreadReactionRecord[],
) {
  return buildDerivedWishThreadEntriesModule(wishes, rewardClaims, reactions)
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

function normalizeProgressNumber(value: number | null | undefined) {
  return normalizeProgressNumberModule(value)
}

function getWishCompletionTimestamp(wish: Pick<WishRecord, 'status' | 'completedAt' | 'updatedAt'>) {
  return getWishCompletionTimestampModule(wish)
}

function getWishProgressSnapshot(wish: Pick<WishRecord, 'progressMode' | 'progressCurrent' | 'progressTarget' | 'progressUnit' | 'steps'>): WishProgressSnapshot {
  return getWishProgressSnapshotModule(wish)
}

function getWishBottleColorTier(percent: number): WishBottleColorTier {
  return getWishBottleColorTierModule(percent)
}

function createWishRecord(partial: Partial<WishRecord> & WishDraft): WishRecord {
  return createWishRecordModule(partial)
}

const seedWishes: WishRecord[] = [
  createWishRecord({
    id: 'wish-shared-trip',
    title: '一起完成一次 10 天长途旅行',
    category: '旅行',
    note: '先把预算、时间窗和三个候选目的地列出来，再决定路线。',
    ownerId: 'member-a',
    scope: 'shared',
    status: 'active',
    starred: true,
    progressMode: 'steps',
    progressCurrent: 0,
    progressStarCoinValue: 0,
    progressTarget: 0,
    progressUnit: '',
    completionStarCoinBonus: 3,
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
    note: '每周完成两个模块，月底做一次模拟题回顾。',
    ownerId: 'member-a',
    scope: 'private',
    status: 'active',
    progressMode: 'count',
    progressCurrent: 3,
    progressStarCoinValue: 0.5,
    progressTarget: 12,
    progressUnit: '模块',
    completionStarCoinBonus: 2,
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
    note: '每周至少跑两次，先把出门频率养稳，再慢慢拉长距离。',
    ownerId: 'member-b',
    scope: 'shared',
    status: 'active',
    progressMode: 'count',
    progressCurrent: 5,
    progressStarCoinValue: 0.5,
    progressTarget: 12,
    progressUnit: '次',
    completionStarCoinBonus: 2,
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
    note: '先挑一盏落地灯和一条薄毯，再把零散线材、边桌和投影位收顺。',
    ownerId: 'member-b',
    scope: 'shared',
    status: 'active',
    progressMode: 'none',
    progressCurrent: 0,
    progressStarCoinValue: 0,
    progressTarget: 0,
    progressUnit: '',
    completionStarCoinBonus: 1,
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
    note: '糖醋排骨、烤鸡和一道甜点，先完成菜单和食材清单。',
    ownerId: 'member-b',
    scope: 'private',
    status: 'done',
    progressMode: 'count',
    progressCurrent: 3,
    progressStarCoinValue: 1,
    progressTarget: 3,
    progressUnit: '道',
    completionStarCoinBonus: 2,
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

const seedRewardPoolItems: RewardPoolItem[] = [
  createRewardPoolItem({
    id: 'reward-morning-coffee-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '上班路上买一杯拿铁',
    note: '不用纠结价格，今天就喝喜欢的那一杯。',
    starCoinCost: 2,
    createdAt: '2026-04-20T08:10:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-fresh-flowers-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '给书桌换一小束鲜花',
    note: '让这周的房间先亮起来一点。',
    starCoinCost: 3,
    createdAt: '2026-04-20T08:20:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-window-breakfast-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '找一家窗边早餐店',
    note: '慢慢吃一顿不赶时间的早餐。',
    starCoinCost: 4,
    createdAt: '2026-04-20T08:30:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-stationery-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '挑一本新的手账本',
    note: '给接下来的计划换一个更顺手的地方。',
    starCoinCost: 5,
    createdAt: '2026-04-20T08:40:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-dessert-box-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '带一盒小甜点回家',
    note: '选两个口味，留一个明天再吃。',
    starCoinCost: 6,
    createdAt: '2026-04-20T08:50:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-bookstore-hour-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '在书店待满一小时',
    note: '不带任务，只允许自己慢慢翻。',
    starCoinCost: 7,
    createdAt: '2026-04-20T09:00:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-cinema-night-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '看一场工作日夜场电影',
    note: '买好爆米花，手机静音。',
    starCoinCost: 8,
    createdAt: '2026-04-20T09:10:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-bath-set-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '买一套喜欢的沐浴用品',
    note: '让睡前洗澡变成真正放松的一段。',
    starCoinCost: 10,
    createdAt: '2026-04-20T09:20:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-gallery-afternoon-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '去看一个小展览',
    note: '看完顺路喝杯茶，把喜欢的作品记下来。',
    starCoinCost: 12,
    createdAt: '2026-04-20T09:30:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-slow-dinner-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '订一家想吃很久的餐厅',
    note: '认真点一道招牌菜，不急着走。',
    starCoinCost: 15,
    createdAt: '2026-04-20T09:40:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-massage-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '做一次肩颈放松',
    note: '把紧绷的肩膀交给专业的人处理。',
    starCoinCost: 18,
    createdAt: '2026-04-20T09:50:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-table-lamp-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '换一盏舒服的床头灯',
    note: '让夜晚阅读不用再凑合。',
    starCoinCost: 22,
    createdAt: '2026-04-20T10:00:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-weekend-workshop-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '报名一次周末手作课',
    note: '陶艺、银饰或香薰，选一个真正想试的。',
    starCoinCost: 26,
    createdAt: '2026-04-20T10:10:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-hotel-stay-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '住一晚城市里的舒服酒店',
    note: '不出远门，也给自己换一个安静空间。',
    starCoinCost: 32,
    createdAt: '2026-04-20T10:20:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-short-trip-a',
    ownerId: 'member-a',
    tier: 'premium',
    title: '安排一次两天一夜短途旅行',
    note: '选一个能慢慢散步、吃好饭的小城。',
    starCoinCost: 40,
    createdAt: '2026-04-20T10:30:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-evening-walk-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '下班后买一杯冰饮散步',
    note: '绕一条不赶路的路线回家。',
    starCoinCost: 2,
    createdAt: '2026-04-20T11:10:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-breakfast-noodles-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '周末早上吃一碗热汤面',
    note: '不用外卖，去店里慢慢吃。',
    starCoinCost: 3,
    createdAt: '2026-04-20T11:20:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-game-night-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '留一个晚上安心打游戏',
    note: '提前收拾好杂事，玩的时候不内疚。',
    starCoinCost: 4,
    createdAt: '2026-04-20T11:30:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-new-socks-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '买几双舒服的新袜子',
    note: '把那些松掉的旧袜子正式换掉。',
    starCoinCost: 5,
    createdAt: '2026-04-20T11:40:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-night-market-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '去夜市随便吃三样小吃',
    note: '只负责开心，不负责算热量。',
    starCoinCost: 6,
    createdAt: '2026-04-20T11:50:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-record-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '买一张喜欢的黑胶或专辑',
    note: '给最近反复听的歌一个实体位置。',
    starCoinCost: 8,
    createdAt: '2026-04-20T12:00:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-barber-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '认真剪一次头发',
    note: '预约喜欢的发型师，不临时将就。',
    starCoinCost: 10,
    createdAt: '2026-04-20T12:10:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-cookware-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '添一件顺手的厨房小工具',
    note: '比如削皮刀、温度计或好用的锅铲。',
    starCoinCost: 12,
    createdAt: '2026-04-20T12:20:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-sports-shirt-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '买一件透气运动 T 恤',
    note: '让下一次出门运动少一点阻力。',
    starCoinCost: 15,
    createdAt: '2026-04-20T12:30:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-speaker-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '升级一个小音箱',
    note: '做饭和收拾屋子时都能放喜欢的歌。',
    starCoinCost: 18,
    createdAt: '2026-04-20T12:40:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-camping-chair-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '买一把折叠露营椅',
    note: '公园、天台和短途出门都能用上。',
    starCoinCost: 22,
    createdAt: '2026-04-20T12:50:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-foot-spa-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '做一次足部护理',
    note: '走了很多路之后，认真照顾一下自己。',
    starCoinCost: 26,
    createdAt: '2026-04-20T13:00:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-bike-day-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '租车骑一下午河边路线',
    note: '找一条风景舒服、坡度不狠的路线。',
    starCoinCost: 30,
    createdAt: '2026-04-20T13:10:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-weekend-brunch-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '吃一次周末早午餐',
    note: '点一份平时不会点的主菜。',
    starCoinCost: 34,
    createdAt: '2026-04-20T13:20:00.000Z',
  }),
  createRewardPoolItem({
    id: 'reward-new-headphones-b',
    ownerId: 'member-b',
    tier: 'premium',
    title: '换一副通勤耳机',
    note: '让路上的音乐和播客都更舒服。',
    starCoinCost: 40,
    createdAt: '2026-04-20T13:30:00.000Z',
  }),
]

function createSeedWishState() {
  const mockSeed = createMockWishSeedState()
  const hasMockSeed = mockSeed.wishes.length > 0

  return {
    monthlyJournalSnapshots: hasMockSeed ? mockSeed.monthlyJournalSnapshots.map((snapshot) => createMonthlyJournalSnapshotRecord(snapshot)) : [] as MonthlyJournalSnapshotRecord[],
    rewardClaims: mockSeed.rewardClaims.map((claim) => createRewardClaimRecord(claim)),
    rewardPoolItems: hasMockSeed ? mockSeed.rewardPoolItems.map((item) => createRewardPoolItem(item)) : seedRewardPoolItems.map((item) => createRewardPoolItem(item)),
    threadReactions: hasMockSeed ? mockSeed.threadReactions.map((reaction) => createThreadReactionRecord(reaction)) : seedThreadReactions.map((reaction) => createThreadReactionRecord(reaction)),
    wishes: hasMockSeed ? mockSeed.wishes.map((wish) => createWishRecord(wish)) : seedWishes.map((wish) => createWishRecord(wish)),
  }
}

function getBrowserStorage() {
  return getBrowserStorageModule()
}

function hydrateWishState() {
  return hydrateWishStateModule(createSeedWishState)
}

function touchWish(wish: WishRecord) {
  return touchWishModule(wish)
}

export const useWishStore = defineStore('wishes', () => {
  const authStore = useAuthStore()
  const hydratedState = hydrateWishState()
  const wishes = ref<WishRecord[]>(hydratedState.wishes)
  const threadReactions = ref<ThreadReactionRecord[]>(hydratedState.threadReactions)
  const wishThreads = ref<WishThreadEntry[]>(
    buildDerivedWishThreadEntries(hydratedState.wishes, hydratedState.rewardClaims, hydratedState.threadReactions),
  )
  const monthlyJournalSnapshots = ref<MonthlyJournalSnapshotRecord[]>(hydratedState.monthlyJournalSnapshots)
  const rewardPoolItems = ref<RewardPoolItem[]>(hydratedState.rewardPoolItems)
  const rewardClaims = ref<RewardClaimRecord[]>(hydratedState.rewardClaims)
  const missingSeedRewardPoolItems = seedRewardPoolItems.filter((seedItem) => !rewardPoolItems.value.some((item) => item.id === seedItem.id))

  if (missingSeedRewardPoolItems.length) {
    rewardPoolItems.value = [
      ...rewardPoolItems.value,
      ...missingSeedRewardPoolItems.map((item) => createRewardPoolItem(item)),
    ]
  }

  const isLoading = ref(false)
  const syncMessage = ref('当前使用本地演示数据。')
  const lastLoadedSpaceId = ref<string | null>(null)
  const lastFailedAction = ref<RetryableAction | null>(null)
  const isRetryingLastFailedAction = ref(false)
  const realtimeStatus = ref<'idle' | 'connecting' | 'subscribed' | 'error'>('idle')
  const recentLocalWishDeletes = new Map<string, number>()
  const recentLocalWishUpdates = new Map<string, number>()
  const recentLocalCommentDeletes = new Map<string, number>()
  const recentLocalReactionDeletes = new Map<string, number>()

  const isUsingCloudWishes = computed(() => authStore.usesSupabaseSpace && !!authStore.currentSpaceId)
  const hasRetryableAction = computed(() => !!lastFailedAction.value)
  const lastFailedActionLabel = computed(() => lastFailedAction.value?.label ?? '')
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

  const realtimeSyncController = createRealtimeSyncControllerState()

  const rewardClaimCountsByItem = computed(() => {
    return buildRewardClaimCountsByItem(rewardClaims.value)
  })

  const rewardDepositTotalsByItem = computed(() => {
    return buildRewardDepositTotalsByItem(rewardClaims.value)
  })

  const rewardClaimByWishId = computed(() => {
    return buildRewardClaimByWishId(rewardClaims.value)
  })

  const rewardClaimByStepId = computed(() => {
    return buildRewardClaimByStepId(rewardClaims.value)
  })

  const starCoinBalanceByMember = computed(() => {
    return buildStarCoinBalanceByMember(rewardClaims.value)
  })

  const currentMemberStarCoinBalance = computed(() => {
    const memberId = authStore.currentMemberId || authStore.currentMember?.id

    if (!memberId) {
      return 0
    }

    return Math.max(0, starCoinBalanceByMember.value.get(memberId) ?? 0)
  })

  const countRewardClaimedUnitsByWish = computed(() => {
    return buildCountRewardClaimedUnitsByWish(rewardClaims.value)
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

  const stats = computed(() => {
    const activeWishes = wishes.value.filter((wish) => wish.status === 'active')
    const doneWishes = wishes.value.filter((wish) => wish.status === 'done')
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
      done,
      dueSoon: 0,
      overdue: 0,
      shared,
      starred: wishes.value.filter((wish) => wish.starred).length,
      totalCountTarget,
      total,
      totalImageBytes,
      totalImages,
      totalStepCount,
      tracked,
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
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  })

  const sortedWishes = computed(() => {
    return [...wishes.value].sort((left, right) => {
      if (left.status !== right.status) {
        return left.status === 'done' ? 1 : -1
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
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

  function getRewardPoolItems(memberId: string, tier?: RewardTier, includeArchived = false) {
    return rewardPoolItems.value
      .filter((item) => item.ownerId === memberId)
      .filter((item) => item.scope !== 'shared')
      .filter((item) => (tier ? item.tier === tier : true))
      .filter((item) => (includeArchived ? true : !item.isArchived))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }

  function getSharedRewardPoolItems(tier?: RewardTier, includeArchived = false) {
    return rewardPoolItems.value
      .filter((item) => item.scope === 'shared')
      .filter((item) => (tier ? item.tier === tier : true))
      .filter((item) => (includeArchived ? true : !item.isArchived))
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
  }

  function getRewardItemClaimCount(target: string | Pick<RewardPoolItem, 'id'>) {
    const itemId = typeof target === 'string' ? target : target.id
    return rewardClaimCountsByItem.value.get(itemId) ?? 0
  }

  function getRewardItemDepositedStarCoins(target: string | Pick<RewardPoolItem, 'id'>) {
    const itemId = typeof target === 'string' ? target : target.id
    return Math.max(0, rewardDepositTotalsByItem.value.get(itemId) ?? 0)
  }

  function getRewardItemRemainingStarCoins(target: Pick<RewardPoolItem, 'id' | 'starCoinCost'>) {
    return Math.max(target.starCoinCost - getRewardItemDepositedStarCoins(target), 0)
  }

  function getRewardItemAvailableDepositedStarCoins(target: Pick<RewardPoolItem, 'id' | 'starCoinCost'>) {
    const redeemedAmount = getRewardItemClaimCount(target) * Math.max(target.starCoinCost, 0)
    return Math.max(getRewardItemDepositedStarCoins(target) - redeemedAmount, 0)
  }

  function getRewardItemRemainingDepositStarCoins(target: Pick<RewardPoolItem, 'id' | 'starCoinCost'>) {
    return Math.max(target.starCoinCost - getRewardItemAvailableDepositedStarCoins(target), 0)
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

  function isCurrentMemberWishOwner(wish: Pick<WishRecord, 'ownerId'> | undefined | null) {
    const memberId = getCurrentMemberId()
    return !!wish && !!memberId && wish.ownerId === memberId
  }

  function formatStarCoinAmount(value: number) {
    const roundedValue = Math.round(value * 10) / 10
    return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1)
  }

  function createAutomaticStarCoinClaim(options: {
    claimKind: Extract<RewardClaimKind, 'step_star_coin' | 'count_star_coin' | 'wish_completion_bonus'>
    ownerId: string
    quantity?: number
    sourceStepId?: string | null
    sourceWishId: string
    starCoinDelta: number
    titleSnapshot: string
    noteSnapshot: string
  }) {
    return createRewardClaimRecord({
      claimKind: options.claimKind,
      noteSnapshot: options.noteSnapshot,
      ownerId: options.ownerId,
      quantity: options.quantity ?? 1,
      rewardItemId: null,
      sourceStepId: options.sourceStepId ?? null,
      sourceWishId: options.sourceWishId,
      starCoinDelta: options.starCoinDelta,
      titleSnapshot: options.titleSnapshot,
    })
  }

  function getMemberDisplayName(memberId: string | null) {
    if (!memberId) {
      return '系统'
    }

    return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
  }

  function createLocalMonthlyJournalSnapshot(monthKey: string, sourceThreads: WishThreadEntry[]) {
    return createLocalMonthlyJournalSnapshotModule(
      monthKey,
      sourceThreads,
      authStore.currentSpaceId || null,
      authStore.spaceName,
      getCurrentMemberId(),
      getMemberDisplayName,
    )
  }

  function ensureLocalMonthlySnapshots(nextThreads: WishThreadEntry[]) {
    monthlyJournalSnapshots.value = ensureLocalMonthlySnapshotsModule(
      nextThreads,
      monthlyJournalSnapshots.value,
      getBeijingMonthKey(),
      (monthKey, sourceThreads) => createLocalMonthlyJournalSnapshot(monthKey, sourceThreads),
    )
  }

  function refreshLocalActivityState() {
    const nextThreads = buildDerivedWishThreadEntries(wishes.value, rewardClaims.value, threadReactions.value)
    wishThreads.value = nextThreads
    ensureLocalMonthlySnapshots(nextThreads)
  }

  function getWishThreadEntries(wishId: string) {
    return wishThreads.value
      .filter((thread) => thread.wishId === wishId)
      .sort((left, right) => compareIsoAscending(right.createdAt, left.createdAt) || left.id.localeCompare(right.id))
  }

  function patchCommentImages(commentId: string, images: WishImage[]) {
    const nextImages = images.map((image) => ({ ...image }))

    wishes.value.forEach((wish) => {
      const comment = wish.comments.find((entry) => entry.id === commentId)

      if (comment) {
        comment.images = nextImages.map((image) => ({ ...image }))
        wish.updatedAt = new Date().toISOString()
      }
    })

    wishThreads.value = wishThreads.value.map((thread) => thread.id === commentId
      ? { ...thread, images: nextImages.map((image) => ({ ...image })), updatedAt: new Date().toISOString() }
      : thread)
  }

  function rewardResult(ok: boolean, message: string): RewardActionResult {
    syncMessage.value = message
    return { ok, message }
  }

  function hasCapability(key: Parameters<typeof authStore.hasCapability>[0]) {
    return authStore.hasCapability(key)
  }

  function isCapabilityKnownMissing(key: Parameters<typeof authStore.isCapabilityKnownMissing>[0]) {
    return authStore.isCapabilityKnownMissing(key)
  }

  function getCapabilityHint(key: Parameters<typeof authStore.getCapabilityHint>[0]) {
    return authStore.getCapabilityHint(key)
  }

  const capabilityAccess = {
    get hasKnownCapabilities() {
      return authStore.hasKnownCapabilities
    },
    hasCapability,
    getCapabilityHint,
  }

  function isWishThreadFeatureMissing(message: string) {
    return isWishThreadFeatureMissingModule(message)
  }

  function getKnownCapabilityMessage(key: Parameters<typeof authStore.getCapabilityHint>[0]) {
    return getKnownAppCapabilityMessage(capabilityAccess, key)
  }

  function scheduleRealtimeSync(reason: string) {
    scheduleRealtimeSyncModule(realtimeSyncController, {
      isUsingCloudSpace: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      reason,
      onSyncMessage: (message) => {
        syncMessage.value = message
      },
      runSync: (spaceId) => syncFromSupabase(spaceId),
    })
  }

  function getRealtimeEventType(payload: { eventType?: unknown }) {
    return typeof payload.eventType === 'string' ? payload.eventType : ''
  }

  function hasLocalComment(commentId: string) {
    return wishes.value.some((wish) => wish.comments.some((comment) => comment.id === commentId))
  }

  function hasLocalCommentBody(commentId: string, message: string | null) {
    return wishes.value.some((wish) => wish.comments.some((comment) => comment.id === commentId && (!message || comment.message === message)))
  }

  function hasLocalWishImage(imageId: string | null, storagePath: string | null) {
    return wishes.value.some((wish) => wish.images.some((image) => (
      (imageId && image.id === imageId) || (storagePath && image.storagePath === storagePath)
    )))
  }

  function pruneLocalWishEchoTombstones() {
    const now = Date.now()

    recentLocalWishDeletes.forEach((expiresAt, key) => {
      if (expiresAt <= now) {
        recentLocalWishDeletes.delete(key)
      }
    })

    recentLocalWishUpdates.forEach((expiresAt, key) => {
      if (expiresAt <= now) {
        recentLocalWishUpdates.delete(key)
      }
    })
  }

  function markLocalWishUpdate(wishId: string) {
    recentLocalWishUpdates.set(wishId, Date.now() + LOCAL_REALTIME_ECHO_TTL_MS)
  }

  function markLocalWishDelete(wishId: string) {
    recentLocalWishDeletes.set(wishId, Date.now() + LOCAL_REALTIME_ECHO_TTL_MS)
  }

  function wasLocalWishUpdate(wishId: string | null) {
    if (!wishId) {
      return false
    }

    pruneLocalWishEchoTombstones()
    return recentLocalWishUpdates.has(wishId)
  }

  function wasLocalWishDelete(wishId: string | null) {
    if (!wishId) {
      return false
    }

    pruneLocalWishEchoTombstones()
    return recentLocalWishDeletes.has(wishId)
  }

  function hasLocalCommentImage(imageId: string | null, storagePath: string | null) {
    return wishes.value.some((wish) => wish.comments.some((comment) => comment.images.some((image) => (
      (imageId && image.id === imageId) || (storagePath && image.storagePath === storagePath)
    ))))
  }

  function getReactionEchoKey(reaction: { actor_id?: unknown; actorId?: unknown; emoji?: unknown; target_thread_id?: unknown; targetThreadId?: unknown }) {
    const actorId = typeof reaction.actor_id === 'string' ? reaction.actor_id : typeof reaction.actorId === 'string' ? reaction.actorId : ''
    const emoji = typeof reaction.emoji === 'string' ? reaction.emoji : ''
    const targetThreadId = typeof reaction.target_thread_id === 'string'
      ? reaction.target_thread_id
      : typeof reaction.targetThreadId === 'string'
        ? reaction.targetThreadId
        : ''

    return actorId && emoji && targetThreadId ? `${targetThreadId}:${actorId}:${emoji}` : ''
  }

  function pruneLocalReactionEchoTombstones() {
    const now = Date.now()

    recentLocalReactionDeletes.forEach((expiresAt, key) => {
      if (expiresAt <= now) {
        recentLocalReactionDeletes.delete(key)
      }
    })
  }

  function pruneLocalCommentEchoTombstones() {
    const now = Date.now()

    recentLocalCommentDeletes.forEach((expiresAt, key) => {
      if (expiresAt <= now) {
        recentLocalCommentDeletes.delete(key)
      }
    })
  }

  function markLocalCommentDelete(commentId: string) {
    recentLocalCommentDeletes.set(commentId, Date.now() + LOCAL_REALTIME_ECHO_TTL_MS)
  }

  function wasLocalCommentDelete(commentId: string | null) {
    if (!commentId) {
      return false
    }

    pruneLocalCommentEchoTombstones()
    return recentLocalCommentDeletes.has(commentId)
  }

  function markLocalReactionDelete(reaction: ThreadReactionRecord) {
    const expiresAt = Date.now() + LOCAL_REALTIME_ECHO_TTL_MS

    recentLocalReactionDeletes.set(reaction.id, expiresAt)
    recentLocalReactionDeletes.set(getReactionEchoKey(reaction), expiresAt)
  }

  function hasLocalReactionEcho(reaction: Record<string, unknown> | null | undefined) {
    if (!reaction) {
      return false
    }

    const reactionId = typeof reaction.id === 'string' ? reaction.id : ''
    const echoKey = getReactionEchoKey(reaction)

    return threadReactions.value.some((entry) => (
      (reactionId && entry.id === reactionId) || (echoKey && getReactionEchoKey(entry) === echoKey)
    ))
  }

  function wasLocalReactionDelete(reaction: Record<string, unknown> | null | undefined) {
    if (!reaction) {
      return false
    }

    pruneLocalReactionEchoTombstones()

    const reactionId = typeof reaction.id === 'string' ? reaction.id : ''
    const echoKey = getReactionEchoKey(reaction)

    return Boolean((reactionId && recentLocalReactionDeletes.has(reactionId)) || (echoKey && recentLocalReactionDeletes.has(echoKey)))
  }

  function handleCommentRealtimeEvent(payload: { eventType?: unknown; new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const eventType = getRealtimeEventType(payload)
    const nextCommentId = typeof payload.new?.id === 'string' ? payload.new.id : null
    const nextCommentBody = typeof payload.new?.body === 'string' ? payload.new.body : null
    const previousCommentId = typeof payload.old?.id === 'string' ? payload.old.id : null

    if (
      (eventType === 'INSERT' && nextCommentId && hasLocalComment(nextCommentId))
      || (eventType === 'UPDATE' && nextCommentId && hasLocalCommentBody(nextCommentId, nextCommentBody))
      || (eventType === 'DELETE' && wasLocalCommentDelete(previousCommentId))
    ) {
      return
    }

    const visibleWishIds = new Set(wishes.value.map((wish) => wish.id))

    if (shouldSyncForWishRealtimeEvent(payload, visibleWishIds)) {
      scheduleRealtimeSync('留言')
    }
  }

  function handleWishRealtimeEvent(payload: { eventType?: unknown; new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const eventType = getRealtimeEventType(payload)
    const nextWishId = typeof payload.new?.id === 'string' ? payload.new.id : null
    const previousWishId = typeof payload.old?.id === 'string' ? payload.old.id : null

    if ((eventType === 'UPDATE' && wasLocalWishUpdate(nextWishId)) || (eventType === 'DELETE' && wasLocalWishDelete(previousWishId))) {
      return
    }

    scheduleRealtimeSync('愿望')
  }

  function handleWishStepRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const visibleWishIds = new Set(wishes.value.map((wish) => wish.id))

    if (shouldSyncForWishRealtimeEvent(payload, visibleWishIds)) {
      scheduleRealtimeSync('小步骤')
    }
  }

  function handleImageRealtimeEvent(payload: { eventType?: unknown; new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const nextImageId = typeof payload.new?.id === 'string' ? payload.new.id : null
    const nextStoragePath = typeof payload.new?.storage_path === 'string' ? payload.new.storage_path : null

    if (getRealtimeEventType(payload) === 'INSERT' && hasLocalWishImage(nextImageId, nextStoragePath)) {
      return
    }

    const visibleWishIds = new Set(wishes.value.map((wish) => wish.id))

    if (shouldSyncForWishRealtimeEvent(payload, visibleWishIds)) {
      scheduleRealtimeSync('图片')
    }
  }

  function handleCommentImageRealtimeEvent(payload: { eventType?: unknown; new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const nextImageId = typeof payload.new?.id === 'string' ? payload.new.id : null
    const nextStoragePath = typeof payload.new?.storage_path === 'string' ? payload.new.storage_path : null

    if (getRealtimeEventType(payload) === 'INSERT' && hasLocalCommentImage(nextImageId, nextStoragePath)) {
      return
    }

    const visibleCommentIds = new Set(
      wishes.value.flatMap((wish) => wish.comments.map((comment) => comment.id)),
    )

    if (shouldSyncForCommentImageRealtimeEvent(payload, visibleCommentIds)) {
      scheduleRealtimeSync('留言图片')
    }
  }

  function handleThreadImageRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const visibleThreadIds = new Set(wishThreads.value.map((thread) => thread.id))

    if (shouldSyncForThreadImageRealtimeEvent(payload, visibleThreadIds)) {
      scheduleRealtimeSync('手账图片')
    }
  }

  function handleThreadReactionRealtimeEvent(payload: { eventType?: unknown; new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const eventType = getRealtimeEventType(payload)

    if ((eventType === 'INSERT' && hasLocalReactionEcho(payload.new)) || (eventType === 'DELETE' && wasLocalReactionDelete(payload.old))) {
      return
    }

    scheduleRealtimeSync('表情回应')
  }

  function teardownRealtimeSubscription() {
    void teardownRealtimeSubscriptionModule(realtimeSyncController, {
      supabase,
      onStatusChange: (status) => {
        realtimeStatus.value = status
      },
    })
  }

  function setupRealtimeSubscription(spaceId: string) {
    if (!supabase) {
      return
    }

    if (realtimeSyncController.channel && realtimeSyncController.subscribedSpaceId === spaceId) {
      return
    }

    teardownRealtimeSubscription()
    buildRealtimeSubscription(realtimeSyncController, {
      supabase,
      spaceId,
      capabilityAccess,
      bindings: [
        {
          table: 'wishes',
          filter: `space_id=eq.${spaceId}`,
          onEvent: (payload) => {
            if (payload) {
              handleWishRealtimeEvent(payload)
            }
          },
        },
        {
          table: 'wish_threads',
          filter: `space_id=eq.${spaceId}`,
          capabilityKey: 'hasUnifiedThreads',
          onEvent: () => {
            scheduleRealtimeSync('愿望手账')
          },
        },
        {
          table: 'wish_thread_images',
          capabilityKey: 'hasUnifiedThreads',
          onEvent: (payload) => {
            if (payload) {
              handleThreadImageRealtimeEvent(payload)
            }
          },
        },
        {
          table: 'thread_reactions',
          filter: `space_id=eq.${spaceId}`,
          capabilityKey: 'hasUnifiedThreads',
          onEvent: (payload) => {
            if (payload) {
              handleThreadReactionRealtimeEvent(payload)
            }
          },
        },
        {
          table: 'wish_comments',
          onEvent: (payload) => {
            if (payload) {
              handleCommentRealtimeEvent(payload)
            }
          },
        },
        {
          table: 'wish_steps',
          capabilityKey: 'hasWishProgress',
          onEvent: (payload) => {
            if (payload) {
              handleWishStepRealtimeEvent(payload)
            }
          },
        },
        {
          table: 'wish_images',
          onEvent: (payload) => {
            if (payload) {
              handleImageRealtimeEvent(payload)
            }
          },
        },
        {
          table: 'reward_pool_items',
          filter: `space_id=eq.${spaceId}`,
          capabilityKey: 'hasRewardPools',
          onEvent: () => {
            scheduleRealtimeSync('奖励池')
          },
        },
        {
          table: 'reward_claims',
          filter: `space_id=eq.${spaceId}`,
          capabilityKey: 'hasRewardPools',
          onEvent: () => {
            scheduleRealtimeSync('领奖记录')
          },
        },
        {
          table: 'monthly_journal_snapshots',
          filter: `space_id=eq.${spaceId}`,
          capabilityKey: 'hasMonthlySnapshots',
          onEvent: () => {
            scheduleRealtimeSync('月刊快照')
          },
        },
        {
          table: 'wish_comment_images',
          capabilityKey: 'hasWishCommentImages',
          onEvent: (payload) => {
            if (payload) {
              handleCommentImageRealtimeEvent(payload)
            }
          },
        },
      ],
      onStatusChange: (status) => {
        realtimeStatus.value = status
      },
    })
  }

  async function syncFromSupabase(spaceId = authStore.currentSpaceId) {
    if (!supabase || !spaceId) {
      return false
    }

    if (shouldRefreshAppCapabilities(authStore.appCapabilitiesStatus)) {
      await authStore.refreshAppCapabilities()
    }

    isLoading.value = true

    try {
      const fetched = await fetchWishCloudRows(supabase, spaceId, {
        capabilities: authStore.hasKnownCapabilities ? authStore.appCapabilities : null,
        isWishThreadFeatureMissing,
        onWarningMessage: (message) => {
          syncMessage.value = message
        },
      })

      if (!fetched.ok) {
        syncMessage.value = fetched.message
        return false
      }

      const composed = composeWishCloudState(fetched.data)

      rewardPoolItems.value = composed.rewardPoolItems
      rewardClaims.value = composed.rewardClaims
      wishes.value = composed.wishes
      threadReactions.value = composed.threadReactions
      wishThreads.value = composed.wishThreads
      monthlyJournalSnapshots.value = composed.monthlyJournalSnapshots
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
    options: { syncAfterWrite?: boolean } = {},
  ) {
    return runCloudMutationModule({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (message) => {
        syncMessage.value = message
      },
      mutate,
      successMessage,
      syncAfterWrite: options.syncAfterWrite,
      syncFromSupabase,
    })
  }

  function isActionResult(value: unknown): value is { ok: boolean } {
    return typeof value === 'object' && value !== null && 'ok' in value && typeof (value as { ok: unknown }).ok === 'boolean'
  }

  function getActionMessage(value: unknown) {
    if (typeof value !== 'object' || value === null || !('message' in value)) {
      return ''
    }

    const message = (value as { message?: unknown }).message
    return typeof message === 'string' ? message : ''
  }

  function isTransientFailure(value: unknown) {
    if (!isActionResult(value) || value.ok) {
      return false
    }

    const message = getActionMessage(value)

    if (!message) {
      return false
    }

    return /(失败|异常|超时|网络|稍后|重试|同步)/.test(message)
  }

  function isActionSuccessful(value: unknown) {
    if (typeof value === 'boolean') {
      return value
    }

    if (isActionResult(value)) {
      return value.ok
    }

    return !!value
  }

  function setRetryableAction(label: string, retry: () => Promise<unknown>) {
    lastFailedAction.value = { label, retry }
  }

  function clearRetryableAction() {
    lastFailedAction.value = null
  }

  function trackRetryableActionResult(result: unknown, label: string, retry: () => Promise<unknown>) {
    if (!isUsingCloudWishes.value) {
      return
    }

    if (isActionSuccessful(result)) {
      clearRetryableAction()
      return
    }

    if (!isTransientFailure(result)) {
      clearRetryableAction()
      return
    }

    setRetryableAction(label, retry)
  }

  async function retryLastFailedAction() {
    if (!lastFailedAction.value || isRetryingLastFailedAction.value) {
      return false
    }

    const action = lastFailedAction.value
    isRetryingLastFailedAction.value = true

    try {
      const result = await action.retry()
      const ok = isActionSuccessful(result)

      if (ok || !isTransientFailure(result)) {
        clearRetryableAction()
      }

      return ok
    } finally {
      isRetryingLastFailedAction.value = false
    }
  }

  function removeWishLocally(id: string) {
    wishes.value = deleteWishLocal(id, wishes.value)
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
  }

  async function addWish(draft: WishDraft, initialSteps: Array<{ title: string; starCoinValue: number }> = []) {
    const normalizedSteps = draft.progressMode === 'steps'
      ? initialSteps
          .map((step) => ({
            starCoinValue: Math.max(0, Number(step.starCoinValue) || 0),
            title: step.title.trim(),
          }))
          .filter((step) => !!step.title)
      : []

    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage && (draft.progressMode !== 'none' || normalizedSteps.length)) {
      syncMessage.value = progressCapabilityMessage
      return null
    }

    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const ownerId = authStore.currentMemberId || authStore.currentMember?.id || draft.ownerId
      return addWishCloud({
        supabase,
        currentSpaceId: authStore.currentSpaceId,
        ownerId,
        includeProgressFields: !isCapabilityKnownMissing('hasWishProgress'),
        draft,
        initialSteps: normalizedSteps,
        onLoadingChange: (value) => {
          isLoading.value = value
        },
        onSyncMessage: (message) => {
          syncMessage.value = message
        },
        syncFromSupabase,
      })
    }

    const created = addWishLocal(draft, normalizedSteps)
    wishes.value.unshift(created.wish)
    syncMessage.value = created.message
    return created.wish.id
  }

  async function updateWish(id: string, draft: WishDraft) {
    const existingWish = findById(id)

    if (!existingWish) {
      return false
    }

    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage && (draft.progressMode !== 'none' || existingWish.progressMode !== 'none')) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase
      const updatePayload = {
        category: draft.category.trim(),
        note: draft.note.trim(),
        owner_id: existingWish.ownerId,
        scope: draft.scope,
        title: draft.title.trim(),
        ...(!isCapabilityKnownMissing('hasWishProgress')
          ? {
              completion_star_coin_bonus: draft.completionStarCoinBonus,
              progress_current: draft.progressCurrent,
              progress_mode: draft.progressMode,
              progress_star_coin_value: draft.progressStarCoinValue,
              progress_target: draft.progressTarget,
              progress_unit: draft.progressUnit.trim(),
            }
          : {}),
      }

      return runCloudMutation(
        async () =>
          client
            .from('wishes')
            .update(updatePayload)
            .eq('id', id),
        '愿望修改已同步到 Supabase。',
        { syncAfterWrite: false },
      ).then((ok) => {
        if (ok) {
          wishes.value = wishes.value.map((wish) => wish.id === id ? updateWishLocal(wish, draft, touchWish) : wish)
          markLocalWishUpdate(id)
          syncMessage.value = '愿望修改已同步到 Supabase。'
        }

        return ok
      })
    }

    wishes.value = wishes.value.map((wish) => {
      if (wish.id !== id) {
        return wish
      }

      return updateWishLocal(wish, draft, touchWish)
    })

    return true
  }

  async function deleteWish(id: string) {
    if (supabase && isUsingCloudWishes.value) {
      const client = supabase

      return runCloudMutation(
        async () => client.from('wishes').delete().eq('id', id),
        '愿望已从 Supabase 删除。',
        { syncAfterWrite: false },
      ).then((ok) => {
        if (ok) {
          markLocalWishDelete(id)
          removeWishLocally(id)
          syncMessage.value = '愿望已从 Supabase 删除。'
        }

        return ok
      })
    }

    removeWishLocally(id)
    return true
  }

  async function addRewardPoolItem(input: {
    scope?: RewardScope
    tier: RewardTier
    title: string
    note?: string
    starCoinCost?: number
  }): Promise<RewardActionResult> {
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    const result = await addRewardPoolItemWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      memberId: getCurrentMemberId(),
      input,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: (result) => rewardResult(result.ok, result.message),
      syncFromSupabase,
    })

    if ('localItem' in result) {
      rewardPoolItems.value.unshift(result.localItem)
      return result.result
    }

    return result
  }

  async function updateRewardPoolItem(
    itemId: string,
    updates: {
      title?: string
      note?: string
      scope?: RewardScope
      starCoinCost?: number
    },
  ): Promise<RewardActionResult> {
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    if (progressCapabilityMessage) {
      return rewardResult(false, progressCapabilityMessage)
    }

    const result = await updateRewardPoolItemWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      memberId: getCurrentMemberId(),
      item: rewardPoolItems.value.find((entry) => entry.id === itemId),
      itemId,
      updates,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: (result) => rewardResult(result.ok, result.message),
      syncFromSupabase,
    })

    if ('nextItem' in result) {
      rewardPoolItems.value = rewardPoolItems.value.map((entry) => entry.id === itemId ? result.nextItem : entry)
      return result.result
    }

    return result
  }

  async function archiveRewardPoolItem(itemId: string): Promise<RewardActionResult> {
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    const result = await archiveRewardPoolItemWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      memberId: getCurrentMemberId(),
      item: rewardPoolItems.value.find((entry) => entry.id === itemId),
      itemId,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: (result) => rewardResult(result.ok, result.message),
      syncFromSupabase,
    })

    if ('nextItem' in result) {
      rewardPoolItems.value = rewardPoolItems.value.map((entry) => entry.id === itemId ? result.nextItem : entry)
      return result.result
    }

    return result
  }

  async function completeWishWithReward(wishId: string, rewardItemId: string): Promise<RewardActionResult> {
    const wish = findById(wishId)
    const memberId = getCurrentMemberId()

    if (!wish || !memberId) {
      return rewardResult(false, '当前没有可完成的愿望。')
    }

    if (!isCurrentMemberWishOwner(wish)) {
      return rewardResult(false, '只有这条愿望的归属人可以推进和完成它。')
    }

    if (wish.status === 'done') {
      return rewardResult(false, '这个愿望已经完成了。')
    }

    if (hasWishRewardClaim(wishId)) {
      return rewardResult(false, '这条愿望的完成星星币已经发过了。')
    }

    if (!supabase || !isUsingCloudWishes.value) {
      const now = new Date().toISOString()
      const bonus = Math.max(0, wish.completionStarCoinBonus)
      const localWish = {
        ...wish,
        completedAt: now,
        status: 'done' as const,
        updatedAt: now,
      }
      wishes.value = wishes.value.map((entry) => entry.id === wishId ? localWish : entry)
      rewardClaims.value.unshift(createAutomaticStarCoinClaim({
        claimKind: 'wish_completion_bonus',
        noteSnapshot: `完成「${wish.title}」时自动获得的额外星星币。`,
        ownerId: wish.ownerId,
        sourceWishId: wishId,
        starCoinDelta: bonus,
        titleSnapshot: `${formatStarCoinAmount(bonus)} 星星币`,
      }))
      clearRetryableAction()
      return rewardResult(true, `这条愿望已经完成，${formatStarCoinAmount(bonus)} 枚星星币已经自动到账。`)
    }

    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    const result = await completeWishWithRewardWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish,
      wishId,
      memberId,
      rewardItem: rewardPoolItems.value.find((item) => item.id === rewardItemId),
      rewardItemId,
      hasWishRewardClaim: hasWishRewardClaim(wishId),
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: rewardResult,
      syncFromSupabase,
    })

    if (result && typeof result === 'object' && 'localWish' in result) {
      wishes.value = wishes.value.map((wish) => wish.id === wishId ? result.localWish : wish)
      rewardClaims.value.unshift(result.localClaim)
      clearRetryableAction()
      return result.result
    }

    trackRetryableActionResult(result, '重试完成愿望', () => completeWishWithReward(wishId, rewardItemId))

    return result
  }

  async function claimCompletedStepReward(
    wishId: string,
    stepId: string,
    selection: {
      rewardItemId?: string | null
      claimStarCoin?: boolean
    },
  ): Promise<RewardActionResult> {
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    if (progressCapabilityMessage) {
      return rewardResult(false, progressCapabilityMessage)
    }

    const wish = findById(wishId)
    const result = await claimCompletedStepRewardWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish,
      wishId,
      stepId,
      step: wish?.steps.find((item) => item.id === stepId),
      memberId: getCurrentMemberId(),
      claimStarCoin: selection.claimStarCoin === true,
      rewardItem: selection.rewardItemId ? rewardPoolItems.value.find((item) => item.id === selection.rewardItemId) ?? null : null,
      hasStepRewardClaim: hasStepRewardClaim(stepId),
      stepCompletionStarCoinReward: STEP_COMPLETION_STAR_COIN_REWARD,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: rewardResult,
      syncFromSupabase,
    })

    if (result && typeof result === 'object' && 'localClaim' in result) {
      rewardClaims.value.unshift(result.localClaim)
      clearRetryableAction()
      return result.result
    }

    trackRetryableActionResult(
      result,
      '重试领取步骤奖励',
      () => claimCompletedStepReward(wishId, stepId, selection),
    )

    return result
  }

  async function claimCountProgressReward(
    wishId: string,
    selection: {
      quantity: number
      rewardItemId?: string | null
      claimStarCoin?: boolean
    },
  ): Promise<RewardActionResult> {
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    const result = await claimCountProgressRewardWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(wishId),
      wishId,
      memberId: getCurrentMemberId(),
      claimStarCoin: selection.claimStarCoin === true,
      rewardItem: selection.rewardItemId ? rewardPoolItems.value.find((item) => item.id === selection.rewardItemId) ?? null : null,
      quantity: Math.max(1, Math.trunc(Number(selection.quantity) || 0)),
      claimedUnits: countRewardClaimedUnitsByWish.value.get(wishId) ?? 0,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: rewardResult,
      syncFromSupabase,
    })

    if (result && typeof result === 'object' && 'localClaim' in result) {
      rewardClaims.value.unshift(result.localClaim)
      clearRetryableAction()
      return result.result
    }

    trackRetryableActionResult(
      result,
      '重试领取进度奖励',
      () => claimCountProgressReward(wishId, selection),
    )

    return result
  }

  async function redeemPremiumReward(rewardItemId: string): Promise<RewardActionResult> {
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    const memberId = getCurrentMemberId()
    const rewardItem = rewardPoolItems.value.find((item) => item.id === rewardItemId)
    const result = await redeemPremiumRewardWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      memberId,
      rewardItem,
      rewardItemId,
      depositedAmount: rewardItem ? getRewardItemAvailableDepositedStarCoins(rewardItem) : 0,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: (result) => rewardResult(result.ok, result.message),
      syncFromSupabase,
    })

    if ('localClaim' in result) {
      rewardClaims.value.unshift(result.localClaim)
      clearRetryableAction()
      return result.result
    }

    trackRetryableActionResult(result, '重试兑换奖励', () => redeemPremiumReward(rewardItemId))

    return result
  }

  async function depositRewardStarCoins(rewardItemId: string, amount: number): Promise<RewardActionResult> {
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    const memberId = getCurrentMemberId()
    const rewardItem = rewardPoolItems.value.find((item) => item.id === rewardItemId)
    const result = await depositRewardStarCoinsWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      memberId,
      rewardItem,
      rewardItemId,
      amount,
      currentBalance: memberId ? getMemberStarCoinBalance(memberId) : 0,
      depositedAmount: rewardItem ? getRewardItemAvailableDepositedStarCoins(rewardItem) : 0,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: (result) => rewardResult(result.ok, result.message),
      syncFromSupabase,
    })

    if ('localClaim' in result) {
      rewardClaims.value.unshift(result.localClaim)
      clearRetryableAction()
      return result.result
    }

    trackRetryableActionResult(result, '重试存入星星币', () => depositRewardStarCoins(rewardItemId, amount))

    return result
  }

  async function toggleDone(id: string) {
    const result = await toggleDoneWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(id),
      wishId: id,
      runCloudMutation,
    })

    if (result && typeof result === 'object' && 'localWish' in result) {
      wishes.value = wishes.value.map((wish) => wish.id === id ? result.localWish : wish)
      return true
    }

    return result
  }

  async function toggleStar(id: string) {
    const wish = findById(id)

    if (!wish) {
      return false
    }

    const nextStarred = !wish.starred
    const now = new Date().toISOString()
    wishes.value = wishes.value.map((entry) => entry.id === id ? { ...entry, starred: nextStarred, updatedAt: now } : entry)
    syncMessage.value = nextStarred ? '已标记为重点愿望。' : '已取消重点标记。'
    return true
  }

  async function setWishCountProgress(id: string, nextCurrent: number) {
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    const wish = findById(id)
    const normalizedCurrent = wish ? Math.min(normalizeProgressNumber(nextCurrent), Math.max(1, wish.progressTarget)) : 0

    if (wish && !isCurrentMemberWishOwner(wish)) {
      syncMessage.value = '只有这条愿望的归属人可以推进它。'
      return false
    }

    const result = await setWishCountProgressWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      wish,
      wishId: id,
      normalizedCurrent,
      runCloudMutation,
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
    })

    if (result && typeof result === 'object' && 'localWish' in result) {
      const previousCurrent = wish?.progressCurrent ?? 0
      const gainedUnits = Math.max(result.localWish.progressCurrent - previousCurrent, 0)
      wishes.value = wishes.value.map((entry) => entry.id === id ? result.localWish : entry)
      if (wish && gainedUnits > 0) {
        const starCoinDelta = gainedUnits * Math.max(0, wish.progressStarCoinValue)
        rewardClaims.value.unshift(createAutomaticStarCoinClaim({
          claimKind: 'count_star_coin',
          noteSnapshot: `「${wish.title}」数字进度新增 ${gainedUnits} ${wish.progressUnit || '点'}，自动获得星星币。`,
          ownerId: wish.ownerId,
          quantity: gainedUnits,
          sourceWishId: id,
          starCoinDelta,
          titleSnapshot: `${formatStarCoinAmount(starCoinDelta)} 星星币`,
        }))
      }
      syncMessage.value = result.message
      clearRetryableAction()
      return true
    }

    trackRetryableActionResult(result, '重试推进数字进度', () => setWishCountProgress(id, nextCurrent))

    return result
  }

  async function incrementWishCountProgress(id: string, delta = 1) {
    const wish = findById(id)

    if (!wish || wish.progressMode !== 'count') {
      return false
    }

    return setWishCountProgress(id, wish.progressCurrent + delta)
  }

  async function addWishStep(wishId: string, title: string, starCoinValue = 1) {
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    const wish = findById(wishId)

    if (wish && !isCurrentMemberWishOwner(wish)) {
      syncMessage.value = '只有这条愿望的归属人可以整理步骤。'
      return false
    }

    const result = await addWishStepWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      wish,
      wishId,
      normalizedTitle: title.trim(),
      normalizedStarCoinValue: Math.max(0, Math.round((Number(starCoinValue) || 0) * 10) / 10),
      runCloudMutation,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
    })

    if (result && typeof result === 'object' && 'createdStep' in result) {
      const now = new Date().toISOString()

      wishes.value = wishes.value.map((wish) => {
        if (wish.id !== wishId || wish.progressMode !== 'steps') {
          return wish
        }

        const stepsById = new Map(wish.steps.map((step) => [step.id, step]))
        stepsById.set(result.createdStep.id, result.createdStep)

        return {
          ...wish,
          steps: Array.from(stepsById.values()).sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()),
          updatedAt: now,
        }
      })
      syncMessage.value = result.message
      return true
    }

    return result
  }

  async function toggleWishStep(wishId: string, stepId: string) {
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    const wish = findById(wishId)
    const step = wish?.steps.find((item) => item.id === stepId)

    if (wish && !isCurrentMemberWishOwner(wish)) {
      syncMessage.value = '只有这条愿望的归属人可以推进它。'
      return false
    }

    const result = await toggleWishStepWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      wish,
      wishId,
      stepId,
      step,
      runCloudMutation,
    })

    if (result && typeof result === 'object' && 'localWish' in result) {
      const nextStep = result.localWish.steps.find((item) => item.id === stepId)
      wishes.value = wishes.value.map((entry) => entry.id === wishId ? result.localWish : entry)
      if (wish && step && nextStep?.isDone && !step.isDone && !hasStepRewardClaim(stepId)) {
        const starCoinDelta = Math.max(0, step.starCoinValue)
        rewardClaims.value.unshift(createAutomaticStarCoinClaim({
          claimKind: 'step_star_coin',
          noteSnapshot: `完成「${wish.title}」里的步骤「${step.title}」时自动获得星星币。`,
          ownerId: wish.ownerId,
          sourceStepId: stepId,
          sourceWishId: wishId,
          starCoinDelta,
          titleSnapshot: `${formatStarCoinAmount(starCoinDelta)} 星星币`,
        }))
      }
      syncMessage.value = result.message
      clearRetryableAction()
      return true
    }

    trackRetryableActionResult(result, '重试更新步骤状态', () => toggleWishStep(wishId, stepId))

    return result
  }

  async function deleteWishStep(wishId: string, stepId: string) {
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    const wish = findById(wishId)

    if (wish && !isCurrentMemberWishOwner(wish)) {
      syncMessage.value = '只有这条愿望的归属人可以整理步骤。'
      return false
    }

    const result = await deleteWishStepWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      wish,
      wishId,
      stepId,
      runCloudMutation,
    })

    if (result && typeof result === 'object' && 'localWish' in result) {
      wishes.value = wishes.value.map((entry) => entry.id === wishId ? result.localWish : entry)
      syncMessage.value = result.message
      return true
    }

    return result
  }

  async function addComment(wishId: string, authorId: string, message: string, files: File[] = []): Promise<WishActionResult> {
    const activeSupabase = supabase

    if (files.length) {
      const commentImageCapabilityMessage = getKnownCapabilityMessage('hasWishCommentImages')

      if (commentImageCapabilityMessage) {
        syncMessage.value = commentImageCapabilityMessage
        return { ok: false, message: commentImageCapabilityMessage }
      }
    }

    const result = await addCommentWrite({
      supabase: activeSupabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(wishId),
      wishId,
      authorId: authStore.currentMemberId || authorId,
      message,
      files,
      uploadCommentImages: (commentId, nextAuthorId, nextFiles) =>
        uploadCommentImagesWrite({
          supabase: activeSupabase!,
          imageBucket: WISH_COMMENT_IMAGE_BUCKET,
          commentId,
          authorId: nextAuthorId,
          files: nextFiles,
          createStoragePath: createWishCommentImageStoragePath,
          prepareUpload: prepareWishImageUpload,
          isAllowedType: (mimeType) => WISH_IMAGE_ALLOWED_TYPES.has(mimeType),
          sourceMaxBytes: WISH_IMAGE_SOURCE_MAX_BYTES,
          uploadMaxBytes: WISH_IMAGE_MAX_BYTES,
        }),
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })

    if ('localComment' in result) {
      const wish = findById(wishId)

      if (wish && result.localComment) {
        wish.comments.unshift(result.localComment)
        wish.updatedAt = new Date().toISOString()
        syncMessage.value = '留言已保存到本地。'
      }
    }

    if ('cloudComment' in result) {
      const wish = findById(wishId)

      if (wish && result.cloudComment) {
        wish.comments = [
          result.cloudComment,
          ...wish.comments.filter((comment) => comment.id !== result.cloudComment.id),
        ]
        wish.updatedAt = result.cloudComment.createdAt

        const nextThread = createWishThreadEntry({
          actorId: result.cloudComment.authorId,
          createdAt: result.cloudComment.createdAt,
          eventKind: 'comment',
          id: result.cloudComment.id,
          images: result.cloudComment.images,
          messageText: result.cloudComment.message,
          reactions: [],
          spaceId: authStore.currentSpaceId || null,
          updatedAt: result.cloudComment.createdAt,
          wishId,
        })

        wishThreads.value = [
          ...wishThreads.value.filter((thread) => thread.id !== nextThread.id),
          nextThread,
        ].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt) || left.id.localeCompare(right.id))
      }

      if ('pendingCommentImageUpload' in result && result.pendingCommentImageUpload) {
        void result.pendingCommentImageUpload.promise
          .then((uploadResult) => {
            patchCommentImages(result.pendingCommentImageUpload!.commentId, uploadResult.uploadedImages)
            syncMessage.value = uploadResult.summaryMessage
          })
          .catch((error: unknown) => {
            patchCommentImages(result.pendingCommentImageUpload!.commentId, [])
            syncMessage.value = `图片上传失败：${error instanceof Error ? error.message : '请稍后重试。'}`
          })
      }
    }

    return result
  }

  async function updateComment(wishId: string, commentId: string, nextMessage: string): Promise<WishActionResult> {
    const result = await updateCommentWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wishId,
      commentId,
      currentMemberId: getCurrentMemberId(),
      wish: findById(wishId),
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
      nextMessage,
    })

    if ('updatedMessage' in result) {
      const wish = findById(wishId)
      const comment = wish?.comments.find((entry) => entry.id === commentId)

      if (wish && comment && result.updatedMessage) {
        comment.message = result.updatedMessage
        wish.updatedAt = new Date().toISOString()
        syncMessage.value = '留言已更新。'
      }
    }

    return result
  }

  async function deleteComment(wishId: string, commentId: string): Promise<WishActionResult> {
    const result = await deleteCommentWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wishId,
      commentId,
      currentMemberId: getCurrentMemberId(),
      wish: findById(wishId),
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })

    if ('deletedCommentId' in result && result.deletedCommentId) {
      const wish = findById(wishId)

      if (wish) {
        markLocalCommentDelete(result.deletedCommentId)
        wish.comments = wish.comments.filter((entry) => entry.id !== result.deletedCommentId)
        wish.updatedAt = new Date().toISOString()
        syncMessage.value = '留言已删除。'
      }
    }

    return result
  }

  async function toggleThreadReaction(threadId: string, emoji: string): Promise<WishActionResult> {
    const threadCapabilityMessage = getKnownCapabilityMessage('hasUnifiedThreads')

    if (threadCapabilityMessage) {
      syncMessage.value = threadCapabilityMessage
      return { ok: false, message: threadCapabilityMessage }
    }

    const thread = wishThreads.value.find((entry) => entry.id === threadId)
    const memberId = getCurrentMemberId()
    const normalizedEmoji = emoji.trim()

    const existingReaction = threadReactions.value.find(
      (reaction) => reaction.targetThreadId === threadId && reaction.actorId === memberId && reaction.emoji === normalizedEmoji,
    )
    const existingMemberReactionCount = threadReactions.value.filter(
      (reaction) => reaction.targetThreadId === threadId && reaction.actorId === memberId,
    ).length

    if (
      supabase
      && isUsingCloudWishes.value
      && authStore.currentSpaceId
      && thread
      && memberId
      && normalizedEmoji
      && (existingReaction || existingMemberReactionCount < MAX_THREAD_REACTIONS_PER_MEMBER)
    ) {
      const previousReactions = threadReactions.value
      const optimisticReaction = existingReaction
        ? null
        : createThreadReactionRecord({
            actorId: memberId,
            emoji: normalizedEmoji,
            spaceId: authStore.currentSpaceId,
            targetThreadId: threadId,
          })

      if (existingReaction) {
        markLocalReactionDelete(existingReaction)
      }

      threadReactions.value = existingReaction
        ? threadReactions.value.filter((reaction) => reaction.id !== existingReaction.id)
        : [optimisticReaction!, ...threadReactions.value]
      refreshLocalActivityState()
      syncMessage.value = existingReaction ? '表情回应已先收起，正在同步云端。' : '表情回应已先留下，正在同步云端。'

      const result = await toggleThreadReactionWrite({
        supabase,
        isUsingCloudWishes: true,
        currentSpaceId: authStore.currentSpaceId,
        thread,
        threadId,
        memberId,
        normalizedEmoji,
        existingReaction,
        existingMemberReactionCount,
        maxPerMember: MAX_THREAD_REACTIONS_PER_MEMBER,
        allowsLegacyCapabilityFallback: !authStore.hasKnownCapabilities,
        isWishThreadFeatureMissing,
        onLoadingChange: (value) => {
          isLoading.value = value
        },
        onSyncMessage: (value) => {
          syncMessage.value = value
        },
        syncAfterWrite: false,
        syncFromSupabase,
      })

      if (!result.ok) {
        threadReactions.value = previousReactions
        refreshLocalActivityState()
        return result
      }

      if ('nextReactions' in result && optimisticReaction && result.nextReactions[0]) {
        threadReactions.value = threadReactions.value.map((reaction) => reaction.id === optimisticReaction.id ? result.nextReactions[0]! : reaction)
        refreshLocalActivityState()
      }

      return result
    }

    const result = await toggleThreadReactionWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      thread,
      threadId,
      memberId,
      normalizedEmoji,
      existingReaction,
      existingMemberReactionCount,
      maxPerMember: MAX_THREAD_REACTIONS_PER_MEMBER,
      allowsLegacyCapabilityFallback: !authStore.hasKnownCapabilities,
      isWishThreadFeatureMissing,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })

    if ('nextReactions' in result) {
      threadReactions.value = result.removedReactionId
        ? threadReactions.value.filter((reaction) => reaction.id !== result.removedReactionId)
        : [...result.nextReactions, ...threadReactions.value]

      refreshLocalActivityState()
      syncMessage.value = result.message
    }

    return result
  }

  async function uploadWishImages(wishId: string, files: File[]) {
    const result = await uploadWishImagesWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(wishId),
      wishId,
      uploaderId: authStore.currentMemberId || authStore.currentMember?.id,
      files,
      maxImageCountPerWish: WISH_MAX_IMAGE_COUNT_PER_WISH,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
      createStoragePath: createWishImageStoragePath,
      prepareUpload: prepareWishImageUpload,
      isAllowedType: (mimeType) => WISH_IMAGE_ALLOWED_TYPES.has(mimeType),
      sourceMaxBytes: WISH_IMAGE_SOURCE_MAX_BYTES,
      uploadMaxBytes: WISH_IMAGE_MAX_BYTES,
      imageBucket: WISH_IMAGE_BUCKET,
    })

    if (result && typeof result === 'object' && 'uploadedImages' in result && result.uploadedImages.length) {
      const wish = findById(wishId)

      if (wish) {
        wish.images = [
          ...wish.images,
          ...result.uploadedImages,
        ].slice(0, WISH_MAX_IMAGE_COUNT_PER_WISH)
        wish.updatedAt = new Date().toISOString()
      }
    }

    return result
  }

  async function deleteWishImage(wishId: string, imageId: string) {
    const wish = findById(wishId)
    return deleteWishImageWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      imageBucket: WISH_IMAGE_BUCKET,
      image: wish?.images.find((item) => item.id === imageId),
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })
  }

  async function deleteWishImages(wishId: string, imageIds: string[]) {
    const result = await deleteWishImagesWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      currentMemberId: authStore.currentMemberId,
      imageBucket: WISH_IMAGE_BUCKET,
      wish: findById(wishId),
      wishId,
      imageIds,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })

    if (result && typeof result === 'object' && 'localImages' in result) {
      const wish = findById(wishId)
      if (wish) {
        wish.images = result.localImages
        wish.updatedAt = new Date().toISOString()
        syncMessage.value = result.message
      }
      return true
    }

    return result
  }

  async function updateWishImageNote(wishId: string, imageId: string, nextNote: string) {
    const imageNoteCapabilityMessage = getKnownCapabilityMessage('hasWishImageNote')

    if (imageNoteCapabilityMessage) {
      syncMessage.value = imageNoteCapabilityMessage
      return false
    }

    const result = await updateWishImageNoteWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(wishId),
      imageId,
      nextNote,
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      runCloudMutation,
    })

    if (result && typeof result === 'object' && 'localNote' in result) {
      const wish = findById(wishId)
      const image = wish?.images.find((item) => item.id === imageId)
      if (wish && image) {
        image.note = result.localNote
        wish.updatedAt = new Date().toISOString()
        syncMessage.value = result.message
      }
      return true
    }

    return result
  }

  async function setWishCoverImage(wishId: string, imageId: string) {
    const imageCoverCapabilityMessage = getKnownCapabilityMessage('hasWishImageCover')

    if (imageCoverCapabilityMessage) {
      syncMessage.value = imageCoverCapabilityMessage
      return false
    }

    const result = await setWishCoverImageWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(wishId),
      imageId,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })

    if (result && typeof result === 'object' && 'localImages' in result) {
      const wish = findById(wishId)
      if (wish) {
        wish.images = result.localImages
        wish.updatedAt = new Date().toISOString()
        syncMessage.value = result.message
      }
      return true
    }

    return result
  }

  async function reorderWishImages(wishId: string, orderedImageIds: string[]) {
    const imageOrderCapabilityMessage = getKnownCapabilityMessage('hasWishImageOrder')

    if (imageOrderCapabilityMessage) {
      syncMessage.value = imageOrderCapabilityMessage
      return false
    }

    const result = await reorderWishImagesWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(wishId),
      wishId,
      orderedImageIds,
      reorderImagesByIds,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })

    if (result && typeof result === 'object' && 'localImages' in result) {
      const wish = findById(wishId)
      if (wish) {
        wish.images = result.localImages
        wish.updatedAt = new Date().toISOString()
        syncMessage.value = result.message
      }
      return true
    }

    return result
  }

  function resetToSeed() {
    if (isUsingCloudWishes.value) {
      syncMessage.value = '云端模式下不支持恢复本地示例数据。'
      return
    }

    const seedState = createSeedWishState()
    wishes.value = seedState.wishes
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
      monthlyJournalSnapshots: monthlyJournalSnapshots.value.map((snapshot) => createMonthlyJournalSnapshotRecord(snapshot)),
      rewardClaims: rewardClaims.value.map((claim) => createRewardClaimRecord(claim)),
      rewardPoolItems: rewardPoolItems.value.map((item) => createRewardPoolItem(item)),
      threadReactions: threadReactions.value.map((reaction) => createThreadReactionRecord(reaction)),
      threads: wishThreads.value.map((thread) => createWishThreadEntry(thread)),
      wishes: wishes.value.map((wish) => createWishRecord(wish)),
    }
  }

  function snapshotLocalPersistedState(): PersistedWishState {
    return {
      version: 6,
      monthlyJournalSnapshots: monthlyJournalSnapshots.value.map((snapshot) => createMonthlyJournalSnapshotRecord(snapshot)),
      rewardClaims: rewardClaims.value.map((claim) => createRewardClaimRecord(claim)),
      rewardPoolItems: rewardPoolItems.value.map((item) => createRewardPoolItem(item)),
      threadReactions: threadReactions.value.map((reaction) => createThreadReactionRecord(reaction)),
      wishes: wishes.value.map((wish) => createWishRecord(wish)),
    }
  }

  const localMockStateSnapshot = ref<PersistedWishState>(snapshotLocalPersistedState())

  watch(
    [wishes, rewardClaims, threadReactions],
    () => {
      if (isUsingCloudWishes.value) {
        return
      }

      localMockStateSnapshot.value = snapshotLocalPersistedState()
      refreshLocalActivityState()
    },
    { deep: true, immediate: true },
  )

  const storage = getBrowserStorage()

  if (storage) {
    watch(
      [wishes, rewardPoolItems, rewardClaims, threadReactions, monthlyJournalSnapshots, isUsingCloudWishes],
      () => {
        if (isUsingCloudWishes.value) {
          return
        }

        const nextState = snapshotLocalPersistedState()
        storage.setItem(STORAGE_KEY, JSON.stringify(nextState))
      },
      { deep: true },
    )
  }

  watch(
    [() => authStore.usesSupabaseSpace, () => authStore.currentSpaceId],
    ([usesCloudSpace, spaceId], [previousUsesCloudSpace]) => {
      if (usesCloudSpace && spaceId) {
        if (!previousUsesCloudSpace) {
          localMockStateSnapshot.value = snapshotLocalPersistedState()
        }

        setupRealtimeSubscription(spaceId)

        if (lastLoadedSpaceId.value !== spaceId) {
          void syncFromSupabase(spaceId)
        }

        return
      }

      teardownRealtimeSubscription()

      if (lastLoadedSpaceId.value) {
        const localState = localMockStateSnapshot.value
        wishes.value = localState.wishes
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
    depositRewardStarCoins,
    deleteWishStep,
    findById,
    getMemberStarCoinBalance,
    getRewardItemClaimCount,
    getRewardItemAvailableDepositedStarCoins,
    getRewardItemDepositedStarCoins,
    getRewardItemRemainingDepositStarCoins,
    getRewardItemRemainingStarCoins,
    getRewardPoolItems,
    getSharedRewardPoolItems,
    getStepRewardClaim,
    getWishThreadEntries,
    getWishProgressSnapshot,
    getWishRewardClaim,
    hasStepRewardClaim,
    hasWishRewardClaim,
    incrementWishCountProgress,
    imageStorageSummary,
    isRetryingLastFailedAction,
    isLoading,
    isUsingCloudWishes,
    hasRetryableAction,
    lastFailedActionLabel,
    latestComments,
    latestRewardClaims,
    monthlyJournalSnapshots,
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
    retryLastFailedAction,
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
    wishThreads,
    wishes,
  }
})
