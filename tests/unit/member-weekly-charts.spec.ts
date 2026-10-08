import { describe, expect, it } from 'vitest'
import { buildMemberWeeklyChart, chartDateKey, weeklyChartDates } from '../../src/shared/memberWeeklyCharts'
import type { RewardClaimRecord, WishRecord } from '../../src/stores/wishes'

describe('memberWeeklyCharts', () => {
  it('uses Beijing dates and Monday-based weeks', () => {
    expect(chartDateKey('2026-10-07T17:00:00Z')).toBe('2026-10-08')
    expect(weeklyChartDates('2026-10-08')).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'])
  })

  it('keeps members separate and uses the review progress and income rules', () => {
    const wishes = [{ id: 'wish-1', category: '健康', progressStarCoinValue: 0.2, steps: [], completedAt: null }] as unknown as WishRecord[]
    const claims = [
      { ownerId: 'member-a', sourceWishId: 'wish-1', claimKind: 'count_star_coin', quantity: 42, starCoinDelta: 8.4, createdAt: '2026-10-06T14:00:00Z' },
      { ownerId: 'member-b', sourceWishId: 'wish-1', claimKind: 'count_star_coin', quantity: 8, starCoinDelta: 1.6, createdAt: '2026-10-06T14:00:00Z' },
      { ownerId: 'member-a', sourceWishId: null, claimKind: 'reward_deposit', quantity: 2, starCoinDelta: -2, createdAt: '2026-10-06T14:00:00Z' },
    ] as RewardClaimRecord[]
    const dates = weeklyChartDates('2026-10-08')
    const progress = buildMemberWeeklyChart(wishes, claims, ['member-a', 'member-b'], dates, 'progress')
    expect(progress.days[1]?.members.map((member) => member.total)).toEqual([42, 8])
    expect(progress.max).toBe(42)
    const coins = buildMemberWeeklyChart(wishes, claims, ['member-a', 'member-b'], dates, 'coins')
    expect(coins.days[1]?.members.map((member) => member.total)).toEqual([8.4, 1.6])
  })
})