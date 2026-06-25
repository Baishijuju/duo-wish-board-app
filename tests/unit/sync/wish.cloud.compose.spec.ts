import { describe, expect, it } from 'vitest'
import { composeWishCloudState } from '../../../src/modules/sync/wish.cloud.compose'

describe('wish.cloud.compose', () => {
  it('composes cloud rows into store-ready state', () => {
    const result = composeWishCloudState({
      wishRows: [
        {
          id: 'wish-1',
          space_id: 'space-1',
          owner_id: 'member-a',
          title: '旅行',
          category: '生活',
          note: '记一下',
          priority: 'high',
          scope: 'shared',
          status: 'active',
          is_starred: false,
          due_date: '',
          progress_mode: 'none',
          progress_current: 0,
          progress_target: 0,
          progress_unit: '',
          completed_at: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      rewardPoolItemRows: [],
      rewardClaimRows: [],
      commentRows: [],
      commentImageRows: [],
      threadRows: [],
      threadImageRows: [],
      threadReactionRows: [],
      monthlySnapshotRows: [],
      hasUnifiedThreadData: false,
      imageRows: [],
      stepRows: [],
      imageUrlMap: new Map(),
      commentImageUrlMap: new Map(),
      snapshotWarningMessage: '',
    })

    expect(result.wishes).toHaveLength(1)
    expect(result.wishes[0]?.title).toBe('旅行')
    expect(result.wishThreads.some((thread) => thread.eventKind === 'wish_published')).toBe(true)
  })
})
