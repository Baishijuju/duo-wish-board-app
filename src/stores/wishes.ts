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
  redeemPremiumRewardWrite,
  updateRewardPoolItemWrite,
} from '../modules/rewards/reward.write'
import {
  buildCountRewardClaimedUnitsByWish,
  buildRewardClaimByStepId,
  buildRewardClaimByWishId,
  buildRewardClaimCountsByItem,
  buildStarCoinBalanceByMember,
} from '../modules/rewards/reward.rules'
import {
  createWishCoinRecord as createWishCoinRecordModule,
  createWishComment as createWishCommentModule,
  createWishRecord as createWishRecordModule,
  createWishStep as createWishStepModule,
} from '../modules/wishes/wish.factories'
import { addCommentWrite, deleteCommentWrite, updateCommentWrite } from '../modules/wishes/wish.comments.write'
import {
  addWishStepWrite,
  castWishCoinWrite,
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
import { getWishCoinCycle as getWishCoinCycleModule } from '../modules/wishes/wish.coins'
import {
  getBrowserStorage as getBrowserStorageModule,
  hydrateWishState as hydrateWishStateModule,
  STORAGE_KEY as STORAGE_KEY_MODULE,
  touchWish as touchWishModule,
} from '../modules/wishes/wish.local'
import { createId as createIdModule } from '../shared/ids'
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

const STORAGE_KEY = STORAGE_KEY_MODULE
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

interface PersistedWishState {
  version: 6
  monthlyJournalSnapshots: MonthlyJournalSnapshotRecord[]
  rewardClaims: RewardClaimRecord[]
  rewardPoolItems: RewardPoolItem[]
  threadReactions: ThreadReactionRecord[]
  wishes: WishRecord[]
  coins: WishCoinRecord[]
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

function createWishCoinRecord(
  partial: Partial<WishCoinRecord> & Pick<WishCoinRecord, 'wishId' | 'voterId' | 'cycleKey'>,
): WishCoinRecord {
  return createWishCoinRecordModule(partial)
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
  coins: WishCoinRecord[],
  rewardClaims: RewardClaimRecord[],
  reactions: ThreadReactionRecord[],
) {
  return buildDerivedWishThreadEntriesModule(wishes, coins, rewardClaims, reactions)
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

function getWishCoinCycle(dateValue: Date | number | string = new Date()) {
  return getWishCoinCycleModule(dateValue)
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

  const realtimeSyncController = createRealtimeSyncControllerState()

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
    return buildRewardClaimCountsByItem(rewardClaims.value)
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

  function handleCommentRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const visibleWishIds = new Set(wishes.value.map((wish) => wish.id))

    if (shouldSyncForWishRealtimeEvent(payload, visibleWishIds)) {
      scheduleRealtimeSync('留言')
    }
  }

  function handleImageRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
    const visibleWishIds = new Set(wishes.value.map((wish) => wish.id))

    if (shouldSyncForWishRealtimeEvent(payload, visibleWishIds)) {
      scheduleRealtimeSync('图片')
    }
  }

  function handleCommentImageRealtimeEvent(payload: { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null }) {
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
          onEvent: () => {
            scheduleRealtimeSync('愿望')
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
          onEvent: () => {
            scheduleRealtimeSync('表情回应')
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
          table: 'wish_images',
          onEvent: (payload) => {
            if (payload) {
              handleImageRealtimeEvent(payload)
            }
          },
        },
        {
          table: 'wish_coins',
          filter: `space_id=eq.${spaceId}`,
          capabilityKey: 'hasWishCoins',
          onEvent: () => {
            scheduleRealtimeSync('愿望币')
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
      wishCoins.value = composed.wishCoins
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

  function replaceWish(nextWish: WishRecord) {
    wishes.value = wishes.value.map((entry) => entry.id === nextWish.id ? nextWish : entry)
  }

  function cloneWishRecord(wish: WishRecord): WishRecord {
    return {
      ...wish,
      steps: wish.steps.map((step) => ({ ...step })),
      comments: wish.comments.map((comment) => ({
        ...comment,
        images: comment.images.map((image) => ({ ...image })),
      })),
      images: wish.images.map((image) => ({ ...image })),
    }
  }

  async function addWish(draft: WishDraft, initialStepTitles: string[] = []) {
    const normalizedStepTitles = draft.progressMode === 'steps'
      ? initialStepTitles.map((title) => title.trim()).filter((title) => !!title)
      : []

    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage && (draft.progressMode !== 'none' || normalizedStepTitles.length)) {
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
        initialStepTitles: normalizedStepTitles,
        onLoadingChange: (value) => {
          isLoading.value = value
        },
        onSyncMessage: (message) => {
          syncMessage.value = message
        },
        syncFromSupabase,
      })
    }

    const created = addWishLocal(draft, normalizedStepTitles)
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
        due_date: draft.dueDate || null,
        note: draft.note.trim(),
        owner_id: existingWish.ownerId,
        priority: draft.priority,
        scope: draft.scope,
        title: draft.title.trim(),
        ...(!isCapabilityKnownMissing('hasWishProgress')
          ? {
              progress_current: draft.progressCurrent,
              progress_mode: draft.progressMode,
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
      )
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
      )
    }

    wishes.value = deleteWishLocal(id, wishes.value)
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
    const rewardCapabilityMessage = getKnownCapabilityMessage('hasRewardPools')

    if (rewardCapabilityMessage) {
      return rewardResult(false, rewardCapabilityMessage)
    }

    const result = await completeWishWithRewardWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(wishId),
      wishId,
      memberId: getCurrentMemberId(),
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
      return result.result
    }

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
      return result.result
    }

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
      return result.result
    }

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
      currentBalance: memberId ? getMemberStarCoinBalance(memberId) : 0,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onResult: (result) => rewardResult(result.ok, result.message),
      syncFromSupabase,
    })

    if ('localClaim' in result) {
      rewardClaims.value.unshift(result.localClaim)
      return result.result
    }

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

  async function castWishCoin(id: string) {
    const wishCoinCapabilityMessage = getKnownCapabilityMessage('hasWishCoins')

    if (wishCoinCapabilityMessage) {
      syncMessage.value = wishCoinCapabilityMessage
      return false
    }

    const result = await castWishCoinWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      currentSpaceId: authStore.currentSpaceId,
      wish: findById(id),
      wishId: id,
      memberId: authStore.currentMemberId || authStore.currentMember?.id,
      currentMemberRemainingCoins: currentMemberRemainingCoins.value,
      currentWishCoinCycleKey: currentWishCoinCycle.value.key,
      allowsLegacyCapabilityFallback: !authStore.hasKnownCapabilities,
      onLoadingChange: (value) => {
        isLoading.value = value
      },
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
      syncFromSupabase,
    })

    if (result && typeof result === 'object' && 'localCoin' in result) {
      wishCoins.value.unshift(result.localCoin)
      wishes.value = wishes.value.map((wish) => wish.id === id ? result.localWish : wish)
      syncMessage.value = result.message
      return true
    }

    return result
  }

  async function toggleStar(id: string) {
    return castWishCoin(id)
  }

  async function setWishCountProgress(id: string, nextCurrent: number) {
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    const wish = findById(id)
    const normalizedCurrent = wish ? Math.min(normalizeProgressNumber(nextCurrent), Math.max(1, wish.progressTarget)) : 0

    if (wish && wish.progressMode === 'count' && normalizedCurrent !== wish.progressCurrent && supabase && isUsingCloudWishes.value) {
      const previousWish = cloneWishRecord(wish)
      replaceWish({
        ...wish,
        progressCurrent: normalizedCurrent,
        updatedAt: new Date().toISOString(),
      })
      syncMessage.value = '进度已先更新，正在同步云端。'

      const synced = await setWishCountProgressWrite({
        supabase,
        isUsingCloudWishes: true,
        wish,
        wishId: id,
        normalizedCurrent,
        runCloudMutation,
        onSyncMessage: (value) => {
          syncMessage.value = value
        },
      })

      if (!synced) {
        replaceWish(previousWish)
      }

      return synced
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
      wishes.value = wishes.value.map((entry) => entry.id === id ? result.localWish : entry)
      syncMessage.value = result.message
      return true
    }

    return result
  }

  async function incrementWishCountProgress(id: string, delta = 1) {
    const wish = findById(id)

    if (!wish || wish.progressMode !== 'count') {
      return false
    }

    return setWishCountProgress(id, wish.progressCurrent + delta)
  }

  async function addWishStep(wishId: string, title: string) {
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    const result = await addWishStepWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      wish: findById(wishId),
      wishId,
      normalizedTitle: title.trim(),
      runCloudMutation,
      onSyncMessage: (value) => {
        syncMessage.value = value
      },
    })

    if (result && typeof result === 'object' && 'localWish' in result) {
      wishes.value = wishes.value.map((wish) => wish.id === wishId ? result.localWish : wish)
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

    if (wish && step && wish.progressMode === 'steps' && supabase && isUsingCloudWishes.value) {
      const previousWish = cloneWishRecord(wish)
      const nextDone = !step.isDone
      replaceWish({
        ...wish,
        steps: wish.steps.map((entry) => entry.id === stepId ? { ...entry, isDone: nextDone, updatedAt: new Date().toISOString() } : entry),
        updatedAt: new Date().toISOString(),
      })
      syncMessage.value = nextDone ? '步骤已先标记完成，正在同步云端。' : '步骤已先放回路上，正在同步云端。'

      const synced = await toggleWishStepWrite({
        supabase,
        isUsingCloudWishes: true,
        wish,
        wishId,
        stepId,
        step,
        runCloudMutation,
      })

      if (!synced) {
        replaceWish(previousWish)
      }

      return synced
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
      wishes.value = wishes.value.map((entry) => entry.id === wishId ? result.localWish : entry)
      syncMessage.value = result.message
      return true
    }

    return result
  }

  async function deleteWishStep(wishId: string, stepId: string) {
    const progressCapabilityMessage = getKnownCapabilityMessage('hasWishProgress')

    if (progressCapabilityMessage) {
      syncMessage.value = progressCapabilityMessage
      return false
    }

    const result = await deleteWishStepWrite({
      supabase,
      isUsingCloudWishes: isUsingCloudWishes.value,
      wish: findById(wishId),
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

    if ('deletedCommentId' in result) {
      const wish = findById(wishId)

      if (wish) {
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
    return uploadWishImagesWrite({
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
