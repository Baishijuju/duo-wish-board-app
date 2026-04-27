import type { RealtimeChannel } from '@supabase/supabase-js'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export type WishStatus = 'active' | 'done'
export type WishPriority = 'high' | 'medium' | 'low'
export type WishScope = 'shared' | 'private'

const STORAGE_KEY = 'duo-wish-board-app:v2'
const WISH_IMAGE_BUCKET = 'wish-images'
const WISH_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const WISH_IMAGE_SOURCE_MAX_BYTES = 25 * 1024 * 1024
const WISH_IMAGE_COMPRESS_MAX_EDGE = 2048
const WISH_IMAGE_COMPRESS_TARGET_BYTES = 1800 * 1024
const DUE_SOON_WINDOW_DAYS = 14
const RECENTLY_COMPLETED_WINDOW_DAYS = 30
const SUPABASE_FREE_FILE_STORAGE_BYTES = 1024 * 1024 * 1024
const WISH_IMAGE_ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const WISH_IMAGE_COMPRESSIBLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const WISH_IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const WISH_IMAGE_COMPRESS_QUALITY_STEPS = [0.92, 0.88, 0.84, 0.8]

export interface WishDraft {
  title: string
  category: string
  priority: WishPriority
  dueDate: string
  note: string
  ownerId: string
  scope: WishScope
}

export interface WishComment {
  id: string
  authorId: string
  message: string
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
  comments: WishComment[]
  images: WishImage[]
  createdAt: string
  updatedAt: string
}

export interface WishBackupPayload {
  version: 1
  exportedAt: string
  space: {
    dataMode: 'mock' | 'supabase'
    id: string | null
    inviteCode: string
    memberCount: number
    name: string
  }
  wishes: WishRecord[]
}

export interface WishActionResult {
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
  created_at: string
  updated_at: string
}

interface WishCommentRow {
  id: string
  wish_id: string
  author_id: string
  body: string
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

function createId() {
  return globalThis.crypto?.randomUUID?.() ?? `wish-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function createWishComment(partial: Partial<WishComment> & Pick<WishComment, 'authorId' | 'message'>): WishComment {
  return {
    id: partial.id ?? createId(),
    authorId: partial.authorId,
    message: partial.message.trim(),
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

function createWishRecord(partial: Partial<WishRecord> & WishDraft): WishRecord {
  return {
    id: partial.id ?? createId(),
    title: partial.title.trim(),
    category: partial.category.trim(),
    priority: partial.priority,
    dueDate: partial.dueDate,
    note: partial.note.trim(),
    ownerId: partial.ownerId,
    scope: partial.scope,
    status: partial.status ?? 'active',
    starred: partial.starred ?? false,
    comments: Array.isArray(partial.comments) ? partial.comments.map((comment) => createWishComment(comment)) : [],
    images: Array.isArray(partial.images) ? partial.images.map((image) => createWishImage(image)) : [],
    createdAt: partial.createdAt ?? new Date().toISOString(),
    updatedAt: partial.updatedAt ?? new Date().toISOString(),
  }
}

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
    comments: [
      createWishComment({
        authorId: 'member-a',
        message: '这条在正式版里就是愿望详情下留言的最小形态。',
        createdAt: '2026-04-24T11:20:00.000Z',
      }),
      createWishComment({
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
    comments: [
      createWishComment({
        authorId: 'member-a',
        message: '私密愿望在后续会接 RLS 隔离。',
        createdAt: '2026-04-24T09:10:00.000Z',
      }),
    ],
    createdAt: '2026-04-18T07:30:00.000Z',
    updatedAt: '2026-04-24T09:10:00.000Z',
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
    comments: [],
    createdAt: '2026-04-12T11:00:00.000Z',
    updatedAt: '2026-04-22T10:00:00.000Z',
  }),
]

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage
}

function hydrateWishes(): WishRecord[] {
  const storage = getBrowserStorage()

  if (!storage) {
    return seedWishes.map((wish) => createWishRecord(wish))
  }

  const raw = storage.getItem(STORAGE_KEY)

  if (!raw) {
    return seedWishes.map((wish) => createWishRecord(wish))
  }

  try {
    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return seedWishes.map((wish) => createWishRecord(wish))
    }

    return parsed.map((wish) => createWishRecord(wish))
  } catch {
    return seedWishes.map((wish) => createWishRecord(wish))
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
  commentRows: WishCommentRow[],
  imageRows: WishImageRow[],
  imageUrlMap: Map<string, string>,
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
    starred: row.is_starred,
    comments: commentRows
      .filter((comment) => comment.wish_id === row.id)
      .map((comment) =>
        createWishComment({
          id: comment.id,
          authorId: comment.author_id,
          createdAt: comment.created_at,
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

export const useWishStore = defineStore('wishes', () => {
  const authStore = useAuthStore()
  const wishes = ref<WishRecord[]>(hydrateWishes())
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

  const stats = computed(() => {
    const activeWishes = wishes.value.filter((wish) => wish.status === 'active')
    const doneWishes = wishes.value.filter((wish) => wish.status === 'done')
    const todayStart = getTodayStartTimestamp()
    const dueSoonEnd = todayStart + DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000
    const total = wishes.value.length
    const done = doneWishes.length
    const active = activeWishes.length
    const comments = wishes.value.reduce((count, wish) => count + wish.comments.length, 0)
    const shared = wishes.value.filter((wish) => wish.scope === 'shared').length
    const overdue = activeWishes.filter((wish) => {
      const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
      return dueTimestamp !== null && dueTimestamp < todayStart
    }).length
    const dueSoon = activeWishes.filter((wish) => {
      const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
      return dueTimestamp !== null && dueTimestamp >= todayStart && dueTimestamp <= dueSoonEnd
    }).length
    const starred = wishes.value.filter((wish) => wish.starred).length
    const totalImages = wishes.value.reduce((count, wish) => count + wish.images.length, 0)
    const totalImageBytes = wishes.value.reduce(
      (count, wish) => count + wish.images.reduce((imageCount, image) => imageCount + image.sizeBytes, 0),
      0,
    )

    return {
      active,
      comments,
      completionRate: total ? Math.round((done / total) * 100) : 0,
      done,
      dueSoon,
      overdue,
      shared,
      starred,
      total,
      totalImageBytes,
      totalImages,
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
      .filter((wish) => wish.status === 'done' && new Date(wish.updatedAt).getTime() >= completedAfter)
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
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

      if (left.starred !== right.starred) {
        return left.starred ? -1 : 1
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_comments' }, (payload) => {
        handleCommentRealtimeEvent(payload as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wish_images' }, (payload) => {
        handleImageRealtimeEvent(payload as { new?: Record<string, unknown> | null; old?: Record<string, unknown> | null })
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
        .select('id, space_id, owner_id, title, category, note, priority, scope, status, is_starred, due_date, created_at, updated_at')
        .eq('space_id', spaceId)
        .order('updated_at', { ascending: false })

      if (wishError) {
        syncMessage.value = `云端愿望同步失败：${wishError.message}`
        return false
      }

      const wishIds = ((wishRows ?? []) as WishRow[]).map((wish) => wish.id)
      let commentRows: WishCommentRow[] = []
      let imageRows: WishImageRow[] = []
      let imageUrlMap = new Map<string, string>()

      if (wishIds.length) {
        const { data, error: commentError } = await supabase
          .from('wish_comments')
          .select('id, wish_id, author_id, body, created_at')
          .in('wish_id', wishIds)
          .order('created_at', { ascending: true })

        if (commentError) {
          syncMessage.value = `云端留言同步失败：${commentError.message}`
          return false
        }

        commentRows = (data ?? []) as WishCommentRow[]

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

      wishes.value = ((wishRows ?? []) as WishRow[]).map((wish) => createWishRecordFromRow(wish, commentRows, imageRows, imageUrlMap))
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

  async function addWish(draft: WishDraft) {
    if (supabase && isUsingCloudWishes.value && authStore.currentSpaceId) {
      const client = supabase
      const ownerId = authStore.currentMemberId || authStore.currentMember?.id || draft.ownerId

      return runCloudMutation(
        async () =>
          client.from('wishes').insert({
            category: draft.category.trim(),
            due_date: draft.dueDate || null,
            note: draft.note.trim(),
            owner_id: ownerId,
            priority: draft.priority,
            scope: draft.scope,
            space_id: authStore.currentSpaceId,
            title: draft.title.trim(),
          }),
        '愿望已写入 Supabase。',
      )
    }

    wishes.value.unshift(createWishRecord(draft))
    return true
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
    return true
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
            .update({ status: wish.status === 'done' ? 'active' : 'done' })
            .eq('id', id),
        '愿望状态已同步到 Supabase。',
      )
    }

    wish.status = wish.status === 'done' ? 'active' : 'done'
    wish.updatedAt = new Date().toISOString()
    return true
  }

  async function toggleStar(id: string) {
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
            .update({ is_starred: !wish.starred })
            .eq('id', id),
        '点亮状态已同步到 Supabase。',
      )
    }

    wish.starred = !wish.starred
    wish.updatedAt = new Date().toISOString()
    return true
  }

  async function addComment(wishId: string, authorId: string, message: string): Promise<WishActionResult> {
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

    if (supabase && isUsingCloudWishes.value) {
      const client = supabase
      const nextAuthorId = authStore.currentMemberId || authorId

      const ok = await runCloudMutation(
        async () =>
          client.from('wish_comments').insert({
            author_id: nextAuthorId,
            body: normalizedMessage,
            wish_id: wishId,
          }),
        '留言已同步到 Supabase。',
      )

      return {
        message: ok ? '留言已发送。' : syncMessage.value || '留言发送失败，请稍后重试。',
        ok,
      }
    }

    wish.comments.push(
      createWishComment({
        authorId,
        message: normalizedMessage,
      }),
    )
    wish.updatedAt = new Date().toISOString()
    syncMessage.value = '留言已保存到本地。'

    return {
      message: '留言已保存。',
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

    wishes.value = seedWishes.map((wish) => createWishRecord(wish))
    syncMessage.value = '已恢复本地示例数据。'
  }

  function createBackupPayload(): WishBackupPayload {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      space: {
        dataMode: authStore.usesSupabaseSpace ? 'supabase' : 'mock',
        id: authStore.currentSpaceId || null,
        inviteCode: authStore.inviteCode,
        memberCount: authStore.members.length,
        name: authStore.spaceName,
      },
      wishes: wishes.value.map((wish) => createWishRecord(wish)),
    }
  }

  const storage = getBrowserStorage()

  if (storage) {
    watch(
      wishes,
      (value) => {
        storage.setItem(STORAGE_KEY, JSON.stringify(value))
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
        wishes.value = hydrateWishes()
        lastLoadedSpaceId.value = null
      }

      syncMessage.value = '当前使用本地演示数据。'
    },
    { immediate: true },
  )

  return {
    addWish,
    addComment,
    createBackupPayload,
    deleteWishImage,
    deleteWishImages,
    deleteWish,
    dueSoonWishes,
    findById,
    imageStorageSummary,
    isLoading,
    isUsingCloudWishes,
    latestComments,
    overdueWishes,
    realtimeMessage,
    realtimeStatus,
    reorderWishImages,
    recentlyCompletedWishes,
    resetToSeed,
    setWishCoverImage,
    syncFromSupabase,
    syncMessage,
    sortedWishes,
    stats,
    toggleDone,
    toggleStar,
    updateWishImageNote,
    uploadWishImages,
    upcomingWishes,
    updateWish,
    wishes,
  }
})