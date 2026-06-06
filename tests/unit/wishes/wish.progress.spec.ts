import { describe, expect, it } from 'vitest'
import { getWishProgressSnapshot, normalizeProgressMode, normalizeProgressNumber } from '../../../src/modules/wishes/wish.progress'

describe('wish.progress', () => {
  it('normalizes numbers safely', () => {
    expect(normalizeProgressNumber(undefined)).toBe(0)
    expect(normalizeProgressNumber(-2)).toBe(0)
    expect(normalizeProgressNumber(2.6)).toBe(3)
  })

  it('infers steps mode when steps exist', () => {
    expect(normalizeProgressMode(undefined, [{ id: '1', title: 'a', isDone: false, createdAt: '', updatedAt: '' }], 0, 0, '')).toBe('steps')
  })

  it('infers count mode when numeric target exists', () => {
    expect(normalizeProgressMode(undefined, [], 3, 0, '')).toBe('count')
  })

  it('returns empty snapshot for none mode', () => {
    const snapshot = getWishProgressSnapshot({
      progressMode: 'none',
      progressCurrent: 0,
      progressTarget: 0,
      progressUnit: '',
      steps: [],
    })

    expect(snapshot.mode).toBe('none')
    expect(snapshot.percent).toBe(0)
    expect(snapshot.isReady).toBe(false)
  })

  it('clamps count mode to target', () => {
    const snapshot = getWishProgressSnapshot({
      progressMode: 'count',
      progressCurrent: 8,
      progressTarget: 4,
      progressUnit: '次',
      steps: [],
    })

    expect(snapshot.current).toBe(4)
    expect(snapshot.target).toBe(4)
    expect(snapshot.percent).toBe(100)
    expect(snapshot.isReady).toBe(true)
  })

  it('computes steps mode progress correctly', () => {
    const snapshot = getWishProgressSnapshot({
      progressMode: 'steps',
      progressCurrent: 0,
      progressTarget: 0,
      progressUnit: '',
      steps: [
        { id: '1', title: 'a', isDone: true, createdAt: '', updatedAt: '' },
        { id: '2', title: 'b', isDone: false, createdAt: '', updatedAt: '' },
      ],
    })

    expect(snapshot.current).toBe(1)
    expect(snapshot.target).toBe(2)
    expect(snapshot.percent).toBe(50)
    expect(snapshot.pendingStepTitles).toEqual(['b'])
  })
})
