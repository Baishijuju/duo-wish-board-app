import { describe, expect, it, vi } from 'vitest'
import { createThreadImageQueryBatches, fetchRewardClaimsForReview, fetchWishCloudRows, fetchWishThreadRowsForWish, getCurrentMonthThreadStartIso } from '../../../src/modules/sync/wish.cloud.fetch'

describe('wish.cloud.fetch', () => {
  it('batches thread image filters to keep PostgREST URLs bounded', () => {
    const threadIds = Array.from({ length: 205 }, (_, index) => `thread-${index}`)

    expect(createThreadImageQueryBatches(threadIds).map((batch) => batch.length)).toEqual([100, 100, 5])
  })

  it('starts the shared thread window at the current Beijing month', () => {
    expect(getCurrentMonthThreadStartIso(new Date('2026-10-07T02:07:00.000Z'))).toBe('2026-09-30T16:00:00.000Z')
  })

  it('loads claims and opening balances for a selected review date range', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        claims: [{ id: 'claim-1', owner_id: 'member-1', claim_kind: 'count_star_coin', quantity: 3, title_snapshot: '推进', star_coin_delta: 0.6, created_at: '2026-10-06T01:00:00.000Z' }],
        opening_balances: [{ owner_id: 'member-1', balance: 12.4 }],
      },
      error: null,
    })

    const result = await fetchRewardClaimsForReview({ rpc } as never, 'space-1', '2026-10-05', '2026-10-07')

    expect(rpc).toHaveBeenCalledWith('get_reward_claim_review_data', {
      range_end: '2026-10-07',
      range_start: '2026-10-05',
      target_space_id: 'space-1',
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.claims).toHaveLength(1)
      expect(result.data.openingBalances[0]?.balance).toBe(12.4)
    }
  })

  it('uses the reward summary RPC instead of fetching every claim row', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        summary_claims: [{ id: 'summary-1', owner_id: 'member-1', claim_kind: 'count_star_coin', quantity: 12, title_snapshot: '推进', star_coin_delta: 2.4, created_at: '2026-09-30T00:00:00.000Z' }],
        recent_claims: [],
        latest_claims: [],
      },
      error: null,
    })
    const queriedTables: string[] = []
    const supabase = {
      rpc,
      from(table: string) {
        queriedTables.push(table)
        const query = {
          select: () => query,
          eq: () => query,
          order: () => Promise.resolve({ data: [], error: null }),
        }

        return query
      },
    }

    const result = await fetchWishCloudRows(supabase as never, 'space-1', {
      capabilities: {
        hasBoundSpaceMemberships: false,
        hasWishProgress: false,
        hasWishCommentImages: false,
        hasRewardPools: true,
        hasRewardClaimSummary: true,
        hasUnifiedThreads: false,
        hasMonthlySnapshots: false,
        hasWishImageNote: false,
        hasWishImageCover: false,
        hasWishImageOrder: false,
        hasMonthlySnapshotBackfill: false,
      },
      isWishThreadFeatureMissing: () => false,
      onWarningMessage: vi.fn(),
    })

    expect(result.ok).toBe(true)
    expect(rpc).toHaveBeenCalledWith('get_reward_claim_sync_payload', { target_space_id: 'space-1' })
    expect(queriedTables).not.toContain('reward_claims')
    if (result.ok) {
      expect(result.data.rewardClaimSummaryRows).toHaveLength(1)
      expect(result.data.hasRewardClaimSummary).toBe(true)
    }
  })

  it('paginates all records when loading a wish journal', async () => {
    const threadRows = Array.from({ length: 101 }, (_, index) => ({
      id: `thread-${index}`,
      space_id: 'space-1',
      wish_id: 'wish-1',
      actor_id: 'member-1',
      event_kind: 'reward_claimed',
      message_text: `推进 ${index}`,
      meta: {},
      created_at: `2026-10-01T00:${`${index % 60}`.padStart(2, '0')}:00.000Z`,
      updated_at: '2026-10-01T00:00:00.000Z',
    }))
    const ranges: Array<[number, number]> = []
    const supabase = {
      from(table: string) {
        let pageStart = 0
        const query = {
          select: () => query,
          eq: () => query,
          in: () => query,
          order: () => query,
          range: (start: number, end: number) => {
            pageStart = start
            ranges.push([start, end])
            return query
          },
          then: (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
            const data = table === 'wish_threads' ? threadRows.slice(pageStart, pageStart + 100) : []
            return Promise.resolve({ data, error: null }).then(resolve, reject)
          },
        }

        return query
      },
    }

    const result = await fetchWishThreadRowsForWish(supabase as never, 'space-1', 'wish-1', vi.fn())

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.threadRows).toHaveLength(101)
    }
    expect(ranges).toEqual([[0, 99], [100, 199]])
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
        hasRewardClaimSummary: false,
      },
      isWishThreadFeatureMissing: () => false,
      onWarningMessage: vi.fn(),
    })

    expect(select).toHaveBeenCalledWith('id, space_id, owner_id, title, category, note, scope, status, is_starred, completed_at, created_at, updated_at')
  })
})
