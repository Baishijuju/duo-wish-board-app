import { describe, expect, it } from 'vitest'
import { clearLegacyWishStorage, touchWish } from '../../../src/modules/wishes/wish.local'

describe('wish.local', () => {
  it('clears legacy storage keys', () => {
    const removed: string[] = []
    const storage = {
      removeItem(key: string) {
        removed.push(key)
      },
    } as unknown as Storage

    clearLegacyWishStorage(storage)
    expect(removed).toContain('duo-wish-board-app:v2')
  })

  it('touchWish only refreshes updatedAt', () => {
    const wish = {
      id: 'wish-1',
      title: '测试',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }

    const touched = touchWish(wish)
    expect(touched.id).toBe('wish-1')
    expect(touched.title).toBe('测试')
    expect(new Date(touched.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(wish.updatedAt).getTime())
  })
})
