import { describe, expect, it } from 'vitest'
import { buildDerivedWishThreadEntries } from '../../../src/modules/journal/journal.projection.local'

describe('journal.projection.local', () => {
  it('creates publish and comment entries for a new wish', () => {
    const threads = buildDerivedWishThreadEntries(
      [
        {
          id: 'wish-1',
          title: '一起旅行',
          category: '旅行',
          priority: 'high',
          dueDate: '',
          note: '',
          ownerId: 'member-a',
          scope: 'shared',
          status: 'active',
          starred: false,
          progressMode: 'none',
          progressCurrent: 0,
          progressTarget: 0,
          progressUnit: '',
          completedAt: null,
          steps: [],
          comments: [
            { id: 'comment-1', authorId: 'member-b', message: '先记一下', images: [], createdAt: '2026-01-01T00:10:00.000Z' },
          ],
          images: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:10:00.000Z',
        },
      ],
      [],
      [],
      [],
    )

    expect(threads.some((thread) => thread.eventKind === 'wish_published')).toBe(true)
    expect(threads.some((thread) => thread.eventKind === 'comment')).toBe(true)
  })

  it('creates dragon-ball milestone once when crossing threshold', () => {
    const threads = buildDerivedWishThreadEntries(
      [
        {
          id: 'wish-1',
          title: '一起旅行',
          category: '旅行',
          priority: 'high',
          dueDate: '',
          note: '',
          ownerId: 'member-a',
          scope: 'shared',
          status: 'active',
          starred: false,
          progressMode: 'none',
          progressCurrent: 0,
          progressTarget: 0,
          progressUnit: '',
          completedAt: null,
          steps: [],
          comments: [],
          images: [],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      Array.from({ length: 7 }, (_, index) => ({
        id: `coin-${index}`,
        wishId: 'wish-1',
        voterId: 'member-a',
        cycleKey: 'cycle-1',
        amount: 1,
        createdAt: `2026-01-01T00:0${index}:00.000Z`,
      })),
      [],
      [],
    )

    expect(threads.filter((thread) => thread.eventKind === 'dragon_ball_reached')).toHaveLength(1)
  })
})
