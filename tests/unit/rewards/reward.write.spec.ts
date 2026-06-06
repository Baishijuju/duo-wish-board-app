import { describe, expect, it, vi } from 'vitest'
import {
  addRewardPoolItemWrite,
  archiveRewardPoolItemWrite,
  redeemPremiumRewardWrite,
  updateRewardPoolItemWrite,
} from '../../../src/modules/rewards/reward.write'

describe('reward.write', () => {
  it('creates a local reward pool item when cloud mode is off', async () => {
    const result = await addRewardPoolItemWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      memberId: 'member-a',
      input: { tier: 'daily', title: '奶茶', note: '小奖励' },
      onLoadingChange: vi.fn(),
      onResult: (value) => value,
      syncFromSupabase: vi.fn(),
    })

    expect('localItem' in result).toBe(true)
    if ('localItem' in result) {
      expect(result.localItem.title).toBe('奶茶')
      expect(result.result.ok).toBe(true)
    }
  })

  it('updates a local reward item', async () => {
    const result = await updateRewardPoolItemWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      memberId: 'member-a',
      itemId: 'reward-1',
      item: {
        id: 'reward-1',
        ownerId: 'member-a',
        tier: 'premium',
        title: '旧奖励',
        note: '',
        starCoinCost: 5,
        isArchived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      updates: { title: '新奖励', starCoinCost: 6 },
      onLoadingChange: vi.fn(),
      onResult: (value) => value,
      syncFromSupabase: vi.fn(),
    })

    expect('nextItem' in result).toBe(true)
    if ('nextItem' in result) {
      expect(result.nextItem.title).toBe('新奖励')
      expect(result.nextItem.starCoinCost).toBe(6)
    }
  })

  it('archives a local reward item', async () => {
    const result = await archiveRewardPoolItemWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      memberId: 'member-a',
      itemId: 'reward-1',
      item: {
        id: 'reward-1',
        ownerId: 'member-a',
        tier: 'daily',
        title: '奖励',
        note: '',
        starCoinCost: 0,
        isArchived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      onLoadingChange: vi.fn(),
      onResult: (value) => value,
      syncFromSupabase: vi.fn(),
    })

    expect('nextItem' in result).toBe(true)
    if ('nextItem' in result) {
      expect(result.nextItem.isArchived).toBe(true)
    }
  })

  it('creates a local premium redeem claim when cloud mode is off', async () => {
    const result = await redeemPremiumRewardWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      memberId: 'member-a',
      rewardItemId: 'reward-1',
      currentBalance: 10,
      rewardItem: {
        id: 'reward-1',
        ownerId: 'member-a',
        tier: 'premium',
        title: '大奖励',
        note: '说明',
        starCoinCost: 8,
        isArchived: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      onLoadingChange: vi.fn(),
      onResult: (value) => value,
      syncFromSupabase: vi.fn(),
    })

    expect('localClaim' in result).toBe(true)
    if ('localClaim' in result) {
      expect(result.localClaim.starCoinDelta).toBe(-8)
      expect(result.result.ok).toBe(true)
    }
  })
})
