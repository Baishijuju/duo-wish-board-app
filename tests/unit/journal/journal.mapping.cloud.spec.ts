import { describe, expect, it } from 'vitest'
import {
  buildCommentRowsFromThreadEntries,
  buildWishThreadEntriesFromRows,
  mapCommentImageRowsFromThreadImages,
} from '../../../src/modules/journal/journal.mapping.cloud'

describe('journal.mapping.cloud', () => {
  it('maps cloud thread rows into unified thread entries', () => {
    const entries = buildWishThreadEntriesFromRows(
      [
        {
          id: 'thread-1',
          space_id: 'space-1',
          wish_id: 'wish-1',
          actor_id: 'member-a',
          event_kind: 'comment',
          message_text: '记下一句',
          meta: null,
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      [],
      [],
      (image) => ({
        ...image,
        note: image.note ?? '',
      }),
      new Map(),
    )

    expect(entries).toHaveLength(1)
    expect(entries[0]?.eventKind).toBe('comment')
    expect(entries[0]?.messageText).toBe('记下一句')
  })

  it('converts thread images into comment-image rows', () => {
    const rows = mapCommentImageRowsFromThreadImages([
      {
        id: 'img-1',
        thread_id: 'thread-1',
        created_by: 'member-a',
        storage_path: 'a/b',
        file_name: 'x.jpg',
        mime_type: 'image/jpeg',
        size_bytes: 12,
        sort_order: 1,
        created_at: '2026-01-01T00:00:00.000Z',
      },
    ])

    expect(rows[0]?.comment_id).toBe('thread-1')
    expect(rows[0]?.file_name).toBe('x.jpg')
  })

  it('builds comment rows from unified entries', () => {
    const rows = buildCommentRowsFromThreadEntries([
      {
        id: 'thread-1',
        spaceId: 'space-1',
        wishId: 'wish-1',
        actorId: 'member-a',
        eventKind: 'comment',
        messageText: '你好',
        images: [],
        reactions: [],
        meta: {},
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    expect(rows[0]?.body).toBe('你好')
    expect(rows[0]?.wish_id).toBe('wish-1')
  })
})
