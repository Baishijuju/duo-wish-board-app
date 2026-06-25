import { describe, expect, it } from 'vitest'
import {
  fetchAppCapabilities,
  isRewardFeatureMissing,
  isWishThreadFeatureMissing,
  normalizeAppCapabilities,
} from '../../../src/modules/sync/capabilities'

describe('sync.capabilities', () => {
  it('detects reward capability messages', () => {
    expect(isRewardFeatureMissing('missing reward_pool_items table')).toBe(true)
    expect(isRewardFeatureMissing('other failure')).toBe(false)
  })

  it('detects wish thread capability messages', () => {
    expect(isWishThreadFeatureMissing('missing wish_threads table')).toBe(true)
    expect(isWishThreadFeatureMissing('other failure')).toBe(false)
  })

  it('normalizes capability payload from snake_case rpc result', () => {
    const result = normalizeAppCapabilities({
      has_bound_space_memberships: true,
      has_reward_pools: true,
      has_unified_threads: false,
      has_wish_progress: true,
    })

    expect(result.hasBoundSpaceMemberships).toBe(true)
    expect(result.hasRewardPools).toBe(true)
    expect(result.hasUnifiedThreads).toBe(false)
    expect(result.hasWishProgress).toBe(true)
  })

  it('treats missing capability rpc as unsupported fallback', async () => {
    const supabase = {
      rpc: () => Promise.resolve({ data: null, error: { code: '42883', message: 'function get_app_capabilities() does not exist' } }),
    }

    const result = await fetchAppCapabilities(supabase as never)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toBe('unsupported')
    }
  })
})
