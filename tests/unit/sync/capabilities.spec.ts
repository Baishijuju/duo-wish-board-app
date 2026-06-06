import { describe, expect, it } from 'vitest'
import { isRewardFeatureMissing, isWishThreadFeatureMissing } from '../../../src/modules/sync/capabilities'

describe('sync.capabilities', () => {
  it('detects reward capability messages', () => {
    expect(isRewardFeatureMissing('missing reward_pool_items table')).toBe(true)
    expect(isRewardFeatureMissing('other failure')).toBe(false)
  })

  it('detects wish thread capability messages', () => {
    expect(isWishThreadFeatureMissing('missing wish_threads table')).toBe(true)
    expect(isWishThreadFeatureMissing('other failure')).toBe(false)
  })
})
