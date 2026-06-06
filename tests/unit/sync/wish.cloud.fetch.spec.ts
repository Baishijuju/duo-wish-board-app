import { describe, expect, it, vi } from 'vitest'
import { fetchWishCloudRows } from '../../../src/modules/sync/wish.cloud.fetch'

describe('wish.cloud.fetch', () => {
  it('returns a clear error when wish fetch fails', async () => {
    const supabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  order: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
                }
              },
            }
          },
        }
      },
    }

    const result = await fetchWishCloudRows(supabase as never, 'space-1', {
      isWishThreadFeatureMissing: () => false,
      onWarningMessage: vi.fn(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('云端愿望同步失败')
    }
  })
})
