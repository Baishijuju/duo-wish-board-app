import { describe, expect, it } from 'vitest'
import { getWishCoinCycle } from '../../../src/modules/wishes/wish.coins'

describe('wish.coins', () => {
  it('changes cycle key across Beijing boundary', () => {
    const before = getWishCoinCycle('2026-01-09T11:59:59.000Z')
    const after = getWishCoinCycle('2026-01-09T12:00:01.000Z')

    expect(before.key).not.toBe(after.key)
  })

  it('always returns an ordered cycle window', () => {
    const cycle = getWishCoinCycle('2026-02-01T00:00:00.000Z')

    expect(new Date(cycle.startsAt).getTime()).toBeLessThan(new Date(cycle.endsAt).getTime())
  })
})
