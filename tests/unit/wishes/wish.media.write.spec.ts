import { describe, expect, it, vi } from 'vitest'
import {
  deleteWishImageWrite,
  deleteWishImagesWrite,
  reorderWishImagesWrite,
  setWishCoverImageWrite,
  updateWishImageNoteWrite,
  uploadCommentImagesWrite,
  uploadWishImagesWrite,
} from '../../../src/modules/wishes/wish.media.write'

describe('wish.media.write', () => {
  it('rejects upload when cloud mode is unavailable', async () => {
    const result = await uploadWishImagesWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: { id: 'wish-1', images: [] } as never,
      wishId: 'wish-1',
      uploaderId: 'member-a',
      files: [new File(['x'], 'a.png', { type: 'image/png' })],
      maxImageCountPerWish: 1,
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
      createStoragePath: vi.fn(),
      prepareUpload: vi.fn(),
      isAllowedType: vi.fn(),
      sourceMaxBytes: 1,
      uploadMaxBytes: 1,
      imageBucket: 'wish-images',
    })

    expect(result).toBe(false)
  })

  it('rejects image delete when image is missing', async () => {
    const result = await deleteWishImageWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      imageBucket: 'wish-images',
      image: undefined,
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
    })

    expect(result).toBe(false)
  })

  it('returns local image deletion payload when not using cloud', async () => {
    const result = await deleteWishImagesWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      currentMemberId: 'member-a',
      imageBucket: 'wish-images',
      wish: {
        id: 'wish-1',
        images: [
          { id: 'img-1', createdBy: 'member-a' },
          { id: 'img-2', createdBy: 'member-a' },
        ],
      } as never,
      wishId: 'wish-1',
      imageIds: ['img-1'],
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localImages' in result).toBe(true)
  })

  it('returns local note payload when not using cloud', async () => {
    const result = await updateWishImageNoteWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: {
        id: 'wish-1',
        images: [{ id: 'img-1', note: '' }],
      } as never,
      imageId: 'img-1',
      nextNote: '新的备注',
      onSyncMessage: vi.fn(),
      runCloudMutation: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localNote' in result).toBe(true)
  })

  it('returns local cover payload when not using cloud', async () => {
    const result = await setWishCoverImageWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: {
        id: 'wish-1',
        images: [{ id: 'img-1' }, { id: 'img-2' }],
      } as never,
      imageId: 'img-2',
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localImages' in result).toBe(true)
  })

  it('returns local reordered image payload when not using cloud', async () => {
    const result = await reorderWishImagesWrite({
      supabase: null,
      isUsingCloudWishes: false,
      currentSpaceId: null,
      wish: {
        id: 'wish-1',
        images: [{ id: 'img-1' }, { id: 'img-2' }],
      } as never,
      wishId: 'wish-1',
      orderedImageIds: ['img-2', 'img-1'],
      reorderImagesByIds: (images, orderedIds) => orderedIds.map((id) => images.find((image) => image.id === id)!).filter(Boolean),
      onLoadingChange: vi.fn(),
      onSyncMessage: vi.fn(),
      syncFromSupabase: vi.fn(),
    })

    expect(result && typeof result === 'object' && 'localImages' in result).toBe(true)
  })

  it('returns upload summary for comment images', async () => {
    const supabase = {
      storage: {
        from: () => ({
          upload: vi.fn().mockResolvedValue({ error: null }),
          remove: vi.fn().mockResolvedValue(undefined),
        }),
      },
      from: () => ({
        insert: vi.fn().mockResolvedValue({ error: null }),
      }),
    }

    const result = await uploadCommentImagesWrite({
      supabase: supabase as never,
      imageBucket: 'wish-comment-images',
      commentId: 'comment-1',
      authorId: 'member-a',
      files: [new File(['x'], 'a.png', { type: 'image/png' })],
      createStoragePath: () => 'comment-1/member-a/a.png',
      prepareUpload: async (file) => ({ compressed: false, file }),
      isAllowedType: () => true,
      sourceMaxBytes: 100000,
      uploadMaxBytes: 100000,
    })

    expect(result.summaryMessage).toContain('留言和 1 张图片已同步到 Supabase')
  })
})
