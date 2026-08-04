import type { PendingCountRewardSummary, PendingStepRewardEntry, RewardClaimKind, RewardClaimRecord, WishRecord } from '../stores/wishes'

export type StarCoinWaterfallKind = Extract<RewardClaimKind, 'count_star_coin' | 'step_star_coin' | 'wish_completion_bonus' | 'reward_deposit'>

export type StarCoinVisibleLedger = {
  endBalance: number
  income: number
  net: number
  sourceTotals: Map<StarCoinWaterfallKind, number>
  spending: number
  startBalance: number
}

export type WishStarCoinSummary = {
  earned: number
  remaining: number
}

export type PendingRewardOverview = {
  pendingCountRewardUnits: number
  pendingSmallRewardCount: number
}

export function formatStarCoinAmountLabel(value: number) {
  const roundedValue = Math.round(value * 10) / 10
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1)
}

export function getPendingRewardSettledCopy(kind: 'count' | 'step') {
  return kind === 'count'
    ? '这段待领取奖励已经同步收住。'
    : '这一步对应的待领取奖励已经同步收住。'
}

export function buildCurrentStarCoinBalance(params: {
  claims: RewardClaimRecord[]
  memberId: string | null | undefined
  wishes?: WishRecord[]
}) {
  if (!params.memberId) {
    return 0
  }

  const ledger = buildVisibleStarCoinLedger({
    claims: params.claims,
    endDateKey: '9999-12-31',
    getDateKey: getSimpleDateKey,
    memberIds: [params.memberId],
    sourceKinds: ['count_star_coin', 'step_star_coin', 'wish_completion_bonus', 'reward_deposit'],
    startDateKey: '0000-01-01',
    wishCountStarCoinValueByWishId: buildWishCountStarCoinValueMap(params.wishes ?? []),
  })

  return ledger.endBalance
}

export function buildWishStarCoinSummary(params: {
  claims: RewardClaimRecord[]
  pendingCountRewardSummaries: PendingCountRewardSummary[]
  pendingStepRewards: PendingStepRewardEntry[]
  wish: WishRecord | null | undefined
}) : WishStarCoinSummary {
  const wish = params.wish

  if (!wish) {
    return {
      earned: 0,
      remaining: 0,
    }
  }

  const starCoinClaimKinds = new Set<RewardClaimKind>(['step_star_coin', 'count_star_coin', 'wish_completion_bonus'])
  const wishCountStarCoinValueByWishId = buildWishCountStarCoinValueMap([wish])
  const earned = params.claims
    .filter((claim) => claim.sourceWishId === wish.id && starCoinClaimKinds.has(claim.claimKind))
    .reduce((total, claim) => total + Math.max(0, resolveClaimStarCoinDelta(claim, wishCountStarCoinValueByWishId)), 0)

  let remaining = 0

  if (wish.status !== 'done') {
    if (wish.progressMode === 'count') {
      const target = Math.max(1, wish.progressTarget)
      const current = Math.min(Math.max(0, wish.progressCurrent), target)
      remaining = Math.max(target - current, 0) * Math.max(0, wish.progressStarCoinValue)
    }

    if (wish.progressMode === 'steps') {
      remaining = wish.steps
        .filter((step) => !step.isDone)
        .reduce((total, step) => total + Math.max(0, step.starCoinValue), 0)
    }

    remaining += Math.max(0, wish.completionStarCoinBonus)
  }

  return {
    earned,
    remaining,
  }
}

export function buildPendingRewardOverview(params: {
  pendingCountRewardSummaries: PendingCountRewardSummary[]
  pendingStepRewards: PendingStepRewardEntry[]
}) : PendingRewardOverview {
  const pendingCountRewardUnits = params.pendingCountRewardSummaries.reduce((total, item) => total + item.pendingUnits, 0)

  return {
    pendingCountRewardUnits,
    pendingSmallRewardCount: params.pendingStepRewards.length + pendingCountRewardUnits,
  }
}

export function buildClaimableEntries<T>(params: {
  entries: T[]
  canRedeem: (entry: T) => boolean
  getRemaining: (entry: T) => number
}) {
  return params.entries
    .filter((entry) => params.canRedeem(entry))
    .sort((left, right) => params.getRemaining(left) - params.getRemaining(right))
}

export function buildVisibleStarCoinLedger(params: {
  claims: RewardClaimRecord[]
  endDateKey: string
  memberIds: string[]
  startDateKey: string
  getDateKey: (createdAt: string) => string
  sourceKinds: StarCoinWaterfallKind[]
  wishCountStarCoinValueByWishId?: Map<string, number>
}): StarCoinVisibleLedger {
  const memberIdSet = new Set(params.memberIds)
  const sourceTotals = new Map<StarCoinWaterfallKind, number>(params.sourceKinds.map((kind) => [kind, 0]))
  const balances = new Map(params.memberIds.map((memberId) => [memberId, 0]))

  const claims = params.claims
    .filter((claim) => memberIdSet.has(claim.ownerId) && params.getDateKey(claim.createdAt) <= params.endDateKey)
    .slice()
    .sort((left, right) => {
      const timeDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      return timeDiff || left.id.localeCompare(right.id)
    })

  let startBalance: number | null = null

  claims.forEach((claim) => {
    const dateKey = params.getDateKey(claim.createdAt)

    if (startBalance === null && dateKey >= params.startDateKey) {
      startBalance = getVisibleBalanceTotal(balances, params.memberIds)
    }

    const beforeBalance = balances.get(claim.ownerId) ?? 0
    const resolvedDelta = resolveClaimStarCoinDelta(claim, params.wishCountStarCoinValueByWishId)
    const afterBalance = Math.max(0, beforeBalance + resolvedDelta)
    balances.set(claim.ownerId, afterBalance)

    if (dateKey < params.startDateKey) {
      return
    }

    if (!isStarCoinWaterfallKind(claim.claimKind, params.sourceKinds)) {
      return
    }

    const visibleDelta = afterBalance - beforeBalance
    sourceTotals.set(claim.claimKind, (sourceTotals.get(claim.claimKind) ?? 0) + visibleDelta)
  })

  const finalStartBalance = startBalance ?? getVisibleBalanceTotal(balances, params.memberIds)
  const endBalance = getVisibleBalanceTotal(balances, params.memberIds)
  const income = [...sourceTotals.values()].reduce((total, amount) => total + Math.max(0, amount), 0)
  const spending = [...sourceTotals.values()].reduce((total, amount) => total + Math.abs(Math.min(0, amount)), 0)

  return {
    endBalance,
    income,
    net: income - spending,
    sourceTotals,
    spending,
    startBalance: finalStartBalance,
  }
}

function isStarCoinWaterfallKind(kind: RewardClaimKind, sourceKinds: StarCoinWaterfallKind[]): kind is StarCoinWaterfallKind {
  return sourceKinds.includes(kind as StarCoinWaterfallKind)
}

function getVisibleBalanceTotal(balances: Map<string, number>, memberIds: string[]) {
  return memberIds.reduce((total, memberId) => total + Math.max(0, balances.get(memberId) ?? 0), 0)
}

function buildWishCountStarCoinValueMap(wishes: WishRecord[]) {
  const map = new Map<string, number>()

  wishes.forEach((wish) => {
    map.set(wish.id, Math.max(0, wish.progressStarCoinValue))
  })

  return map
}

function resolveClaimStarCoinDelta(
  claim: RewardClaimRecord,
  wishCountStarCoinValueByWishId: Map<string, number> | undefined,
) {
  if (claim.claimKind !== 'count_star_coin' || !claim.sourceWishId) {
    return claim.starCoinDelta
  }

  const perUnitValue = wishCountStarCoinValueByWishId?.get(claim.sourceWishId)

  if (perUnitValue === undefined) {
    return claim.starCoinDelta
  }

  return Math.max(0, claim.quantity) * Math.max(0, perUnitValue)
}

function getSimpleDateKey(createdAt: string) {
  return createdAt.slice(0, 10)
}
