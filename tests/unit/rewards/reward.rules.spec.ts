import { describe, expect, it } from 'vitest'
import {
  buildCountRewardClaimedUnitsByWish,
  buildRewardClaimByStepId,
  buildRewardClaimByWishId,
  buildRewardClaimCountsByItem,
  buildStarCoinBalanceByMember,
} from '../../../src/modules/rewards/reward.rules'

const claims = [
  {
    id: '1',
    ownerId: 'member-a',
    rewardItemId: 'reward-1',
    sourceWishId: 'wish-1',
    sourceStepId: null,
    claimKind: 'wish_reward' as const,
    quantity: 1,
    titleSnapshot: '奖励一',
    noteSnapshot: '',
    starCoinDelta: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    ownerId: 'member-a',
    rewardItemId: 'reward-2',
    sourceWishId: 'wish-2',
    sourceStepId: 'step-2',
    claimKind: 'step_reward' as const,
    quantity: 1,
    titleSnapshot: '奖励二',
    noteSnapshot: '',
    starCoinDelta: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '3',
    ownerId: 'member-a',
    rewardItemId: null,
    sourceWishId: 'wish-3',
    sourceStepId: null,
    claimKind: 'star_coin' as const,
    quantity: 2,
    titleSnapshot: '2 枚星星币',
    noteSnapshot: '',
    starCoinDelta: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '4',
    ownerId: 'member-a',
    rewardItemId: null,
    sourceWishId: 'wish-3',
    sourceStepId: null,
    claimKind: 'count_reward' as const,
    quantity: 3,
    titleSnapshot: '奖励三',
    noteSnapshot: '',
    starCoinDelta: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '5',
    ownerId: 'member-a',
    rewardItemId: 'reward-1',
    sourceWishId: null,
    sourceStepId: null,
    claimKind: 'premium_redeem' as const,
    quantity: 1,
    titleSnapshot: '兑换',
    noteSnapshot: '',
    starCoinDelta: -1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('reward.rules', () => {
  it('builds reward claim counts by item', () => {
    const map = buildRewardClaimCountsByItem(claims)
    expect(map.get('reward-1')).toBe(2)
    expect(map.get('reward-2')).toBe(1)
  })

  it('builds reward claim maps by wish and step', () => {
    expect(buildRewardClaimByWishId(claims).get('wish-1')?.id).toBe('1')
    expect(buildRewardClaimByStepId(claims).get('step-2')?.id).toBe('2')
  })

  it('builds star coin balances', () => {
    expect(buildStarCoinBalanceByMember(claims).get('member-a')).toBe(1)
  })

  it('counts claimed count-progress units correctly', () => {
    expect(buildCountRewardClaimedUnitsByWish(claims).get('wish-3')).toBe(5)
  })
})
