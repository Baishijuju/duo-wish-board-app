import type {
  WishComment,
  WishDraft,
  WishImage,
  WishRecord,
  WishStep,
} from '../../stores/wishes'
import { createId } from '../../shared/ids'
import { normalizeProgressMode, normalizeProgressNumber } from './wish.progress'

export function createWishComment(partial: Partial<WishComment> & Pick<WishComment, 'authorId' | 'message'>): WishComment {
  return {
    id: partial.id ?? createId(),
    authorId: partial.authorId,
    message: partial.message.trim(),
    images: Array.isArray(partial.images) ? partial.images.map((image) => createWishImage(image)) : [],
    createdAt: partial.createdAt ?? new Date().toISOString(),
  }
}

export function createWishImage(partial: Partial<WishImage> & Pick<WishImage, 'fileName' | 'mimeType' | 'sizeBytes' | 'storagePath'>): WishImage {
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

export function createWishStep(partial: Partial<WishStep> & Pick<WishStep, 'title'>): WishStep {
  const createdAt = partial.createdAt ?? new Date().toISOString()

  return {
    id: partial.id ?? createId(),
    title: partial.title.trim(),
    starCoinValue: normalizeStarCoinValue(partial.starCoinValue),
    isDone: partial.isDone ?? false,
    createdAt,
    updatedAt: partial.updatedAt ?? createdAt,
  }
}

export function normalizeStarCoinValue(value: unknown) {
  const numericValue = Number(value ?? 0)
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0
}

export function createWishRecord(partial: Partial<WishRecord> & WishDraft): WishRecord {
  const normalizedSteps = Array.isArray(partial.steps)
    ? partial.steps.map((step) => createWishStep(step)).filter((step) => !!step.title)
    : []
  const rawProgressCurrent = normalizeProgressNumber(partial.progressCurrent)
  const rawProgressTarget = normalizeProgressNumber(partial.progressTarget)
  const rawProgressUnit = partial.progressUnit?.trim() ?? ''
  const progressMode = normalizeProgressMode(partial.progressMode, normalizedSteps, rawProgressTarget, rawProgressCurrent, rawProgressUnit)
  const progressTarget = progressMode === 'count' ? Math.max(1, rawProgressTarget) : rawProgressTarget
  const progressCurrent = progressMode === 'count' ? Math.min(rawProgressCurrent, progressTarget) : rawProgressCurrent
  const progressStarCoinValue = progressMode === 'count' ? normalizeStarCoinValue(partial.progressStarCoinValue) : 0
  const createdAt = partial.createdAt ?? new Date().toISOString()
  const updatedAt = partial.updatedAt ?? createdAt
  const status = partial.status ?? 'active'
  const normalizedCompletedAt = typeof partial.completedAt === 'string' && partial.completedAt.trim() ? partial.completedAt : null

  return {
    id: partial.id ?? createId(),
    title: partial.title.trim(),
    category: partial.category.trim(),
    note: partial.note.trim(),
    ownerId: partial.ownerId,
    scope: partial.scope,
    status,
    starred: partial.starred ?? false,
    progressMode,
    progressCurrent,
    progressTarget,
    progressUnit: rawProgressUnit,
    progressStarCoinValue,
    completionStarCoinBonus: normalizeStarCoinValue(partial.completionStarCoinBonus),
    completedAt: status === 'done' ? normalizedCompletedAt ?? updatedAt : null,
    steps: normalizedSteps,
    comments: Array.isArray(partial.comments) ? partial.comments.map((comment) => createWishComment(comment)) : [],
    images: Array.isArray(partial.images) ? partial.images.map((image) => createWishImage(image)) : [],
    createdAt,
    updatedAt,
  }
}
