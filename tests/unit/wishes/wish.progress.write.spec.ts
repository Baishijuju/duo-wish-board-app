import { describe, expect, it, vi } from 'vitest'
import {
  addWishStepWrite,
  castWishCoinWrite,
  claimCompletedStepRewardWrite,
  claimCountProgressRewardWrite,
  completeWishWithRewardWrite,
  deleteWishStepWrite,
  setWishCountProgressWrite,
  toggleDoneWrite,
  toggleWishStepWrite,
} from '../../../src/modules/wishes/wish.progress.write'

describe('wish.progress.write', () => {
  it('creates local completion reward result', async () => {
    const result = await completeWishWithRewardWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: { id: 'wish-1', status: 'active', completedAt: null, updatedAt: '', progressTarget: 0, progressCurrent: 0, progressMode: 'none' } as never,
      wishId: 'wish-1',
      memberId: 'member-a',
      rewardItem: { id: 'reward-1', ownerId: 'member-a', tier: 'premium', title: '大奖励', note: '', isArchived: false } as never,
      rewardItemId: 'reward-1',
      hasWishRewardClaim: false,
      onLoadingChange: vi.fn(),
      onResult: (ok, message) => ({ ok, message }),
      syncFromSupabase: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localWish' in result).toBe(true)
  })

  it('creates local step reward result', async () => {
    const result = await claimCompletedStepRewardWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: { id: 'wish-1', progressMode: 'steps' } as never,
      wishId: 'wish-1',
      stepId: 'step-1',
      step: { id: 'step-1', isDone: true } as never,
      memberId: 'member-a',
      claimStarCoin: false,
      rewardItem: { id: 'reward-1', ownerId: 'member-a', tier: 'daily', title: '奶茶', note: '', isArchived: false } as never,
      hasStepRewardClaim: false,
      stepCompletionStarCoinReward: 1,
      onLoadingChange: vi.fn(),
      onResult: (ok, message) => ({ ok, message }),
      syncFromSupabase: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localClaim' in result).toBe(true)
  })

  it('creates local count reward result', async () => {
    const result = await claimCountProgressRewardWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: { id: 'wish-1', progressMode: 'count', progressTarget: 5, progressCurrent: 3 } as never,
      wishId: 'wish-1',
      memberId: 'member-a',
      claimStarCoin: false,
      rewardItem: { id: 'reward-1', ownerId: 'member-a', tier: 'daily', title: '奶茶', note: '', isArchived: false } as never,
      quantity: 1,
      claimedUnits: 0,
      onLoadingChange: vi.fn(),
      onResult: (ok, message) => ({ ok, message }),
      syncFromSupabase: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localClaim' in result).toBe(true)
  })

  it('toggles local done state', async () => {
    const result = await toggleDoneWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: { id: 'wish-1', status: 'active', completedAt: null } as never,
      wishId: 'wish-1',
      runCloudMutation: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localWish' in result).toBe(true)
  })

  it('casts a local wish coin', async () => {
    const result = await castWishCoinWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: { id: 'wish-1', status: 'active', starred: false } as never,
      wishId: 'wish-1',
      memberId: 'member-a',
      currentMemberRemainingCoins: 2,
      currentWishCoinCycleKey: 'cycle-1',
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localCoin' in result).toBe(true)
  })

  it('updates local count progress', async () => {
    const result = await setWishCountProgressWrite({
      supabase: null,
      isUsingCloudWishes: false,
      wish: { id: 'wish-1', progressMode: 'count', progressTarget: 5, progressCurrent: 1 } as never,
      wishId: 'wish-1',
      normalizedCurrent: 3,
      runCloudMutation: vi.fn(),
      onSyncMessage: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localWish' in result).toBe(true)
  })

  it('updates cloud count progress without forcing an immediate full refresh', async () => {
    const runCloudMutation = vi.fn().mockResolvedValue(true)

    const result = await setWishCountProgressWrite({
      supabase: {} as never,
      isUsingCloudWishes: true,
      wish: { id: 'wish-1', progressMode: 'count', progressTarget: 5, progressCurrent: 1 } as never,
      wishId: 'wish-1',
      normalizedCurrent: 3,
      runCloudMutation,
      onSyncMessage: vi.fn(),
    })

    expect(result).toBe(true)
    expect(runCloudMutation).toHaveBeenCalledWith(expect.any(Function), '进度已同步到 Supabase。', { syncAfterWrite: false })
  })

  it('adds, toggles and deletes local steps', async () => {
    const baseWish = {
      id: 'wish-1',
      progressMode: 'steps',
      steps: [{ id: 'step-1', isDone: false }],
      updatedAt: '',
    } as never

    const addResult = await addWishStepWrite({
      supabase: null,
      isUsingCloudWishes: false,
      wish: baseWish,
      wishId: 'wish-1',
      normalizedTitle: '第二步',
      runCloudMutation: vi.fn(),
      onSyncMessage: vi.fn(),
    })
    expect(addResult && typeof addResult === 'object' && 'createdStep' in addResult).toBe(true)

    if (addResult && typeof addResult === 'object' && 'createdStep' in addResult) {
      expect(addResult.createdStep.title).toBe('第二步')
    }

    const toggleResult = await toggleWishStepWrite({
      supabase: null,
      isUsingCloudWishes: false,
      wish: baseWish,
      wishId: 'wish-1',
      stepId: 'step-1',
      step: { id: 'step-1', isDone: false } as never,
      runCloudMutation: vi.fn(),
    })
    expect(toggleResult && typeof toggleResult === 'object' && 'localWish' in toggleResult).toBe(true)

    const deleteResult = await deleteWishStepWrite({
      supabase: null,
      isUsingCloudWishes: false,
      wish: { ...baseWish, steps: [{ id: 'step-1' }] } as never,
      wishId: 'wish-1',
      stepId: 'step-1',
      runCloudMutation: vi.fn(),
    })
    expect(deleteResult && typeof deleteResult === 'object' && 'localWish' in deleteResult).toBe(true)
  })

  it('toggles cloud steps without forcing an immediate full refresh', async () => {
    const runCloudMutation = vi.fn().mockResolvedValue(true)

    const result = await toggleWishStepWrite({
      supabase: {} as never,
      isUsingCloudWishes: true,
      wish: { id: 'wish-1', progressMode: 'steps', steps: [{ id: 'step-1', isDone: false }] } as never,
      wishId: 'wish-1',
      stepId: 'step-1',
      step: { id: 'step-1', isDone: false } as never,
      runCloudMutation,
    })

    expect(result).toBe(true)
    expect(runCloudMutation).toHaveBeenCalledWith(expect.any(Function), '已完成一个小步骤。', { syncAfterWrite: false })
  })
})
