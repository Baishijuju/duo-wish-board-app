import { describe, expect, it } from 'vitest'
import { buildDerivedWishThreadEntries } from '../../../src/modules/journal/journal.projection.local'

describe('journal.projection.local', () => {
  function createWish(overrides: Partial<Parameters<typeof buildDerivedWishThreadEntries>[0][number]> = {}) {
    return {
      id: 'wish-1',
      title: '读完一本小说',
      category: '阅读',
      note: '',
      ownerId: 'member-a',
      scope: 'shared' as const,
      status: 'active' as const,
      starred: false,
      progressMode: 'count' as const,
      progressCurrent: 0,
      progressTarget: 300,
      progressUnit: '页',
      progressStarCoinValue: 0.1,
      completionStarCoinBonus: 1,
      completedAt: null,
      steps: [],
      comments: [],
      images: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:10:00.000Z',
      ...overrides,
    }
  }

  it('creates publish and comment entries for a new wish', () => {
    const threads = buildDerivedWishThreadEntries(
      [
        createWish({
          title: '一起旅行',
          category: '旅行',
          progressMode: 'none',
          comments: [
            { id: 'comment-1', authorId: 'member-b', message: '先记一下', images: [], createdAt: '2026-01-01T00:10:00.000Z' },
          ],
        }),
      ],
      [],
      [],
    )

    expect(threads.some((thread) => thread.eventKind === 'wish_published')).toBe(true)
    expect(threads.some((thread) => thread.eventKind === 'comment')).toBe(true)
  })

  it('merges same-day count star coin claims and hides automatic count comments', () => {
    const threads = buildDerivedWishThreadEntries(
      [
        createWish({
          comments: [
            { id: 'auto-comment-1', authorId: 'member-a', message: '数字进度往前推进了 1 点（现在 121/300 页）。', images: [], createdAt: '2026-01-02T01:00:00.000Z' },
            { id: 'comment-2', authorId: 'member-b', message: '这一段很好看', images: [], createdAt: '2026-01-02T01:20:00.000Z' },
          ],
        }),
      ],
      [
        {
          id: 'claim-1',
          ownerId: 'member-a',
          rewardItemId: null,
          sourceWishId: 'wish-1',
          sourceStepId: null,
          claimKind: 'count_star_coin',
          quantity: 1,
          titleSnapshot: '0.1 星星币',
          noteSnapshot: '',
          starCoinDelta: 0.1,
          createdAt: '2026-01-02T01:00:00.000Z',
        },
        {
          id: 'claim-2',
          ownerId: 'member-a',
          rewardItemId: null,
          sourceWishId: 'wish-1',
          sourceStepId: null,
          claimKind: 'count_star_coin',
          quantity: 2,
          titleSnapshot: '0.2 星星币',
          noteSnapshot: '',
          starCoinDelta: 0.2,
          createdAt: '2026-01-02T08:00:00.000Z',
        },
      ],
      [],
    )

    expect(threads.some((thread) => thread.id === 'auto-comment-1')).toBe(false)
    expect(threads.some((thread) => thread.id === 'comment-2' && thread.eventKind === 'comment')).toBe(true)

    const countThread = threads.find((thread) => thread.id.startsWith('thread-count-star-coin-'))
    expect(countThread?.eventKind).toBe('reward_claimed')
    expect(countThread?.messageText).toBe('往前推进了 3 步，并获得了 0.3 颗星星。')
    expect(countThread?.meta).toMatchObject({
      claimKind: 'count_star_coin',
      quantity: 3,
      sourceWishId: 'wish-1',
      starCoinDelta: 0.30000000000000004,
      wishTitle: '读完一本小说',
    })
  })
})
