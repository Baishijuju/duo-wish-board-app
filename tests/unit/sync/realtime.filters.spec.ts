import { describe, expect, it } from 'vitest'
import {
  shouldSyncForCommentImageRealtimeEvent,
  shouldSyncForThreadImageRealtimeEvent,
  shouldSyncForWishRealtimeEvent,
} from '../../../src/modules/sync/realtime.filters'

describe('realtime.filters', () => {
  it('syncs wish events when payload has no ids', () => {
    expect(shouldSyncForWishRealtimeEvent({}, new Set(['wish-1']))).toBe(true)
  })

  it('syncs wish events only for visible wish ids', () => {
    expect(shouldSyncForWishRealtimeEvent({ new: { wish_id: 'wish-1' } }, new Set(['wish-1']))).toBe(true)
    expect(shouldSyncForWishRealtimeEvent({ new: { wish_id: 'wish-2' } }, new Set(['wish-1']))).toBe(false)
  })

  it('syncs comment-image events only for visible comments', () => {
    expect(shouldSyncForCommentImageRealtimeEvent({ new: { comment_id: 'comment-1' } }, new Set(['comment-1']))).toBe(true)
    expect(shouldSyncForCommentImageRealtimeEvent({ old: { comment_id: 'comment-2' } }, new Set(['comment-1']))).toBe(false)
  })

  it('syncs thread-image events only for visible threads', () => {
    expect(shouldSyncForThreadImageRealtimeEvent({ new: { thread_id: 'thread-1' } }, new Set(['thread-1']))).toBe(true)
    expect(shouldSyncForThreadImageRealtimeEvent({ old: { thread_id: 'thread-2' } }, new Set(['thread-1']))).toBe(false)
  })
})
