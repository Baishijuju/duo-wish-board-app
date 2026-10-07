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
          scope: 'shared',
          status: 'active',
          is_starred: false,
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
      rewardClaimSummaryRows: [{
        id: 'summary-claim-1',
        owner_id: 'member-a',
        reward_item_id: null,
        source_wish_id: 'wish-1',
        source_step_id: null,
        claim_kind: 'count_star_coin',
        quantity: 12,
        title_snapshot: '推进奖励',
        note_snapshot: '',
        star_coin_delta: 2.4,
        created_at: '2026-01-02T00:00:00.000Z',
      }],
      latestRewardClaimRows: [],
      commentRows: [],
      commentImageRows: [],
      threadRows: [],
      threadImageRows: [],
      threadReactionRows: [],
      monthlySnapshotRows: [],
      hasUnifiedThreadData: false,
      imageRows: [],
      stepRows: [],
      countProgressDailyRows: [],
      imageUrlMap: new Map(),
      commentImageUrlMap: new Map(),
      snapshotWarningMessage: '',
    })

    expect(result.wishes).toHaveLength(1)
    expect(result.wishes[0]?.title).toBe('旅行')
    expect(result.wishThreads.some((thread) => thread.eventKind === 'wish_published')).toBe(true)
    expect(result.rewardClaimSummaryRows[0]?.quantity).toBe(12)
  })

  it('retains comments outside the current thread window', () => {
    const result = composeWishCloudState({
      wishRows: [{
        id: 'wish-1',
        space_id: 'space-1',
        owner_id: 'member-a',
        title: '旅行',
        category: '生活',
        note: '',
        scope: 'shared',
        status: 'active',
        is_starred: false,
        progress_mode: 'none',
        progress_current: 0,
        progress_target: 0,
        progress_unit: '',
        completed_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }],
      rewardPoolItemRows: [],
      rewardClaimRows: [],
      rewardClaimSummaryRows: [],
      latestRewardClaimRows: [],
      commentRows: [{
        id: 'comment-old',
        wish_id: 'wish-1',
        author_id: 'member-a',
        body: '仍要显示的旧留言',
        created_at: '2026-01-02T00:00:00.000Z',
      }],
      commentImageRows: [],
      threadRows: [],
      threadImageRows: [],
      threadReactionRows: [],
      monthlySnapshotRows: [],
      hasUnifiedThreadData: true,
      imageRows: [],
      stepRows: [],
      countProgressDailyRows: [],
      imageUrlMap: new Map(),
      commentImageUrlMap: new Map(),
      snapshotWarningMessage: '',
    })

    expect(result.wishes[0]?.comments.map((comment) => comment.id)).toEqual(['comment-old'])
  })
})
