import { describe, expect, it } from 'vitest'
import {
  createRewardClaimFromRow,
  createRewardPoolItemFromRow,
  createWishRecordFromRow,
} from '../../../src/modules/wishes/wish.mapping.cloud'

describe('wish.mapping.cloud', () => {
  it('maps wish rows into full wish records', () => {
    const wish = createWishRecordFromRow(
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
        due_date: '2026-01-10',
        progress_mode: 'steps',
        progress_current: 0,
        progress_target: 0,
        progress_unit: '',
        completed_at: null,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-02T00:00:00.000Z',
      },
      [{ wish_id: 'wish-1' }],
      [{ id: 'comment-1', wish_id: 'wish-1', author_id: 'member-b', body: '留言', created_at: '2026-01-02T00:00:00.000Z' }],
      [{ id: 'img-comment-1', comment_id: 'comment-1', created_by: 'member-b', storage_path: 'comment/1', file_name: 'c.jpg', mime_type: 'image/jpeg', size_bytes: 12, sort_order: 1, created_at: '2026-01-02T00:00:00.000Z' }],
      [{ id: 'img-1', wish_id: 'wish-1', created_by: 'member-a', storage_path: 'wish/1', file_name: 'w.jpg', mime_type: 'image/jpeg', note: '封面', size_bytes: 13, sort_order: 1, created_at: '2026-01-01T00:00:00.000Z' }],
      [{ id: 'step-1', wish_id: 'wish-1', title: '第一步', is_done: false, sort_order: 1, created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z' }],
      new Map([['wish/1', 'https://example.com/w.jpg']]),
      new Map([['comment/1', 'https://example.com/c.jpg']]),
    )

    expect(wish.starred).toBe(true)
    expect(wish.steps[0]?.title).toBe('第一步')
    expect(wish.comments[0]?.message).toBe('留言')
    expect(wish.comments[0]?.images[0]?.url).toBe('https://example.com/c.jpg')
    expect(wish.images[0]?.note).toBe('封面')
  })

  it('maps reward pool item rows', () => {
    const item = createRewardPoolItemFromRow({
      id: 'reward-1',
      owner_id: 'member-a',
      tier: 'premium',
      title: '大奖励',
      note: '说明',
      star_coin_cost: 8,
      is_archived: false,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-02T00:00:00.000Z',
    })

    expect(item.title).toBe('大奖励')
    expect(item.starCoinCost).toBe(8)
    expect(item.tier).toBe('premium')
  })

  it('maps reward claim rows', () => {
    const claim = createRewardClaimFromRow({
      id: 'claim-1',
      owner_id: 'member-a',
      reward_item_id: 'reward-1',
      source_wish_id: 'wish-1',
      source_step_id: null,
      claim_kind: 'wish_reward',
      quantity: 2,
      title_snapshot: '奖励快照',
      note_snapshot: '备注',
      star_coin_delta: 0,
      created_at: '2026-01-02T00:00:00.000Z',
    })

    expect(claim.quantity).toBe(2)
    expect(claim.titleSnapshot).toBe('奖励快照')
    expect(claim.sourceWishId).toBe('wish-1')
  })
})
