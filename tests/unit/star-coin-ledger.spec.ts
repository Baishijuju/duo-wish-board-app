import { describe, expect, it } from 'vitest'
import { buildVisibleStarCoinLedger } from '../../src/shared/starCoinLedger'
import type { RewardClaimRecord } from '../../src/stores/wishes'

describe('starCoinLedger', () => {
  it('uses the supplied opening balance for a partial claim range', () => {
    const claims: RewardClaimRecord[] = [
      {
        id: 'income',
        ownerId: 'member-1',
        rewardItemId: null,
        sourceWishId: 'wish-1',
        sourceStepId: null,
        claimKind: 'count_star_coin',
        quantity: 3,
        titleSnapshot: '推进奖励',
        noteSnapshot: '',
        starCoinDelta: 3,
        createdAt: '2026-10-06T01:00:00.000Z',
      },
      {
        id: 'spending',
        ownerId: 'member-1',
        rewardItemId: 'reward-1',
        sourceWishId: null,
        sourceStepId: null,
        claimKind: 'reward_deposit',
        quantity: 2,
        titleSnapshot: '存入奖励',
        noteSnapshot: '',
        starCoinDelta: -2,
        createdAt: '2026-10-06T02:00:00.000Z',
      },
    ]

    const ledger = buildVisibleStarCoinLedger({
      claims,
      endDateKey: '2026-10-06',
      getDateKey: (createdAt) => createdAt.slice(0, 10),
      memberIds: ['member-1'],
      openingBalancesByMember: new Map([['member-1', 4]]),
      sourceKinds: ['count_star_coin', 'step_star_coin', 'wish_completion_bonus', 'reward_deposit'],
      startDateKey: '2026-10-06',
    })

    expect(ledger.startBalance).toBe(4)
    expect(ledger.endBalance).toBe(5)
    expect(ledger.sourceTotals.get('count_star_coin')).toBe(3)
    expect(ledger.sourceTotals.get('reward_deposit')).toBe(-2)
  })
})