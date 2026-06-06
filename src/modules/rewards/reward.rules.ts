import type { RewardClaimRecord } from '../../stores/wishes'

export function buildRewardClaimCountsByItem(claims: RewardClaimRecord[]) {
  const counts = new Map<string, number>()

  for (const claim of claims) {
    if (!claim.rewardItemId) {
      continue
    }

    counts.set(claim.rewardItemId, (counts.get(claim.rewardItemId) ?? 0) + claim.quantity)
  }

  return counts
}

export function buildRewardClaimByWishId(claims: RewardClaimRecord[]) {
  const claimMap = new Map<string, RewardClaimRecord>()

  for (const claim of claims) {
    if (claim.sourceWishId && claim.claimKind === 'wish_reward') {
      claimMap.set(claim.sourceWishId, claim)
    }
  }

  return claimMap
}

export function buildRewardClaimByStepId(claims: RewardClaimRecord[]) {
  const claimMap = new Map<string, RewardClaimRecord>()

  for (const claim of claims) {
    if (claim.sourceStepId) {
      claimMap.set(claim.sourceStepId, claim)
    }
  }

  return claimMap
}

export function buildStarCoinBalanceByMember(claims: RewardClaimRecord[]) {
  const balanceMap = new Map<string, number>()

  for (const claim of claims) {
    balanceMap.set(claim.ownerId, (balanceMap.get(claim.ownerId) ?? 0) + claim.starCoinDelta)
  }

  return balanceMap
}

export function buildCountRewardClaimedUnitsByWish(claims: RewardClaimRecord[]) {
  const claimMap = new Map<string, number>()

  for (const claim of claims) {
    if (!claim.sourceWishId || claim.sourceStepId) {
      continue
    }

    if (claim.claimKind !== 'count_reward' && claim.claimKind !== 'star_coin') {
      continue
    }

    claimMap.set(claim.sourceWishId, (claimMap.get(claim.sourceWishId) ?? 0) + claim.quantity)
  }

  return claimMap
}
