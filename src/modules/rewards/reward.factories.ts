import type { RewardClaimRecord, RewardPoolItem } from '../../stores/wishes'
import { createId } from '../../shared/ids'

export function createRewardPoolItem(
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

export function createRewardClaimRecord(
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
