import { describe, expect, it, vi } from 'vitest'
import { createThreadImageQueryBatches, fetchWishCloudRows } from '../../../src/modules/sync/wish.cloud.fetch'

describe('wish.cloud.fetch', () => {
  it('batches thread image filters to keep PostgREST URLs bounded', () => {
    const threadIds = Array.from({ length: 205 }, (_, index) => `thread-${index}`)

    expect(createThreadImageQueryBatches(threadIds).map((batch) => batch.length)).toEqual([100, 100, 5])
  })

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
      capabilities: null,
      isWishThreadFeatureMissing: () => false,
      onWarningMessage: vi.fn(),
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.message).toContain('云端愿望同步失败')
    }
  })

  it('uses reduced wish select when progress capability is known missing', async () => {
    const select = vi.fn().mockReturnValue({
      eq: () => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    })
    const supabase = {
      from: vi.fn(() => ({ select })),
    }

    await fetchWishCloudRows(supabase as never, 'space-1', {
      capabilities: {
        hasBoundSpaceMemberships: false,
        hasMonthlySnapshotBackfill: false,
        hasMonthlySnapshots: false,
        hasRewardPools: false,
        hasUnifiedThreads: false,
        hasWishCommentImages: false,
        hasWishImageCover: false,
        hasWishImageNote: false,
        hasWishImageOrder: false,
        hasWishProgress: false,
      },
      isWishThreadFeatureMissing: () => false,
      onWarningMessage: vi.fn(),
    })

    expect(select).toHaveBeenCalledWith('id, space_id, owner_id, title, category, note, scope, status, is_starred, completed_at, created_at, updated_at')
  })
})
