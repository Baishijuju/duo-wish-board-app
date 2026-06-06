import type {
  MonthlyJournalSnapshotRecord,
  ThreadReactionRecord,
  ThreadReactionSummary,
  WishThreadEntry,
} from '../../stores/wishes'
import { createId } from '../../shared/ids'
import { createWishImage } from '../wishes/wish.factories'

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function createThreadReactionRecord(
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

export function createWishThreadEntry(
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

export function createMonthlyJournalSnapshotRecord(
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

export function compareIsoAscending(leftDateValue: string, rightDateValue: string) {
  return new Date(leftDateValue).getTime() - new Date(rightDateValue).getTime()
}
