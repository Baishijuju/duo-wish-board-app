import { describe, expect, it } from 'vitest'
import { computeStreak, shiftDateKey } from '../../../cloudflare/daily-digest.js'

const TODAY = '2026-10-22'

describe('shiftDateKey', () => {
  it('往回退一天', () => {
    expect(shiftDateKey(TODAY, -1)).toBe('2026-10-21')
  })

  it('跨月', () => {
    expect(shiftDateKey('2026-11-01', -1)).toBe('2026-10-31')
  })

  it('跨年', () => {
    expect(shiftDateKey('2027-01-01', -1)).toBe('2026-12-31')
  })
})

describe('computeStreak', () => {
  it('今天没推进、昨天推进过 —— 连击仍然活着，不能算成 0', () => {
    const dates = ['2026-10-21', '2026-10-20', '2026-10-19']

    expect(computeStreak(dates, TODAY)).toBe(3)
  })

  it('今天推进过，从今天往回数', () => {
    const dates = ['2026-10-22', '2026-10-21', '2026-10-20']

    expect(computeStreak(dates, TODAY)).toBe(3)
  })

  it('昨天和今天都没推进 —— 连击已断', () => {
    const dates = ['2026-10-20', '2026-10-19']

    expect(computeStreak(dates, TODAY)).toBe(0)
  })

  it('中间断过，只算最近这一段', () => {
    const dates = ['2026-10-22', '2026-10-21', '2026-10-19', '2026-10-18']

    expect(computeStreak(dates, TODAY)).toBe(2)
  })

  it('完全没有记录', () => {
    expect(computeStreak([], TODAY)).toBe(0)
  })

  it('只有今天', () => {
    expect(computeStreak([TODAY], TODAY)).toBe(1)
  })

  it('乱序输入也能正确计算', () => {
    const dates = ['2026-10-19', '2026-10-22', '2026-10-20', '2026-10-21']

    expect(computeStreak(dates, TODAY)).toBe(4)
  })
})
