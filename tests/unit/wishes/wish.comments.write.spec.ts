import { describe, expect, it, vi } from 'vitest'
import { addCommentWrite, deleteCommentWrite, updateCommentWrite } from '../../../src/modules/wishes/wish.comments.write'

describe('wish.comments.write', () => {
  it('creates a local comment when cloud mode is off', async () => {
    const result = await addCommentWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: {
        id: 'wish-1',
        comments: [],
      } as never,
      wishId: 'wish-1',
      authorId: 'member-a',
      message: '记一下',
      files: [],
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
    })

    expect('localComment' in result).toBe(true)
    if ('localComment' in result) {
      expect(result.localComment.message).toBe('记一下')
    }
  })

  it('updates a local comment', async () => {
    const result = await updateCommentWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wishId: 'wish-1',
      commentId: 'comment-1',
      currentMemberId: 'member-a',
      wish: {
        id: 'wish-1',
        comments: [{ id: 'comment-1', authorId: 'member-a', message: '旧内容' }],
      } as never,
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
      nextMessage: '新内容',
    })

    expect('updatedMessage' in result).toBe(true)
    if ('updatedMessage' in result) {
      expect(result.updatedMessage).toBe('新内容')
    }
  })

  it('deletes a local comment', async () => {
    const result = await deleteCommentWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wishId: 'wish-1',
      commentId: 'comment-1',
      currentMemberId: 'member-a',
      wish: {
        id: 'wish-1',
        comments: [{ id: 'comment-1', authorId: 'member-a', message: '旧内容' }],
      } as never,
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
    })

    expect('deletedCommentId' in result).toBe(true)
    if ('deletedCommentId' in result) {
      expect(result.deletedCommentId).toBe('comment-1')
    }
  })
})
