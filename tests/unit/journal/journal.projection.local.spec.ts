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
    )

    expect(threads.some((thread) => thread.eventKind === 'wish_published')).toBe(true)
    expect(threads.some((thread) => thread.eventKind === 'comment')).toBe(true)
  })
})
