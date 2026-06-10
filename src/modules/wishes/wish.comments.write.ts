import type { SupabaseClient } from '@supabase/supabase-js'
import type { WishActionResult, WishImage, WishRecord } from '../../stores/wishes'
import { createWishComment, createWishImage } from './wish.factories'

export interface CommentImageUploadResult {
  summaryMessage: string
  uploadedImages: WishImage[]
}

export interface PendingCommentImageUpload {
  commentId: string
  promise: Promise<CommentImageUploadResult>
}

export async function addCommentWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  authorId: string
  message: string
  files?: File[]
  uploadCommentImages?: (commentId: string, authorId: string, files: File[]) => Promise<CommentImageUploadResult>
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  const normalizedMessage = options.message.trim()
  const files = options.files ?? []

  if (!options.wish) {
    return { ok: false, message: '没有找到对应的愿望，暂时不能发送留言。' } satisfies WishActionResult
  }

  if (!normalizedMessage) {
    return { ok: false, message: '留言内容不能为空。' } satisfies WishActionResult
  }

  if (files.length && (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId)) {
    return { ok: false, message: '留言图片仅在已连接的 Supabase 云端空间中可用。' } satisfies WishActionResult
  }

  if (options.supabase && options.isUsingCloudWishes && options.currentSpaceId) {
    options.onLoadingChange(true)

    try {
      const { data: insertedComment, error: commentError } = await options.supabase
        .from('wish_comments')
        .insert({
          author_id: options.authorId,
          body: normalizedMessage,
          wish_id: options.wishId,
        })
        .select('id, created_at')
        .single()

      if (commentError || !insertedComment?.id) {
        const nextMessage = `云端写入失败：${commentError?.message ?? '留言创建失败。'}`
        options.onSyncMessage(nextMessage)
        return { ok: false, message: nextMessage || '留言发送失败，请稍后重试。' } satisfies WishActionResult
      }

      const createdAt = insertedComment.created_at ?? new Date().toISOString()
      const pendingImages = files.map((file, index) => createWishImage({
        id: `pending-comment-image:${insertedComment.id}:${index}`,
        createdAt,
        createdBy: options.authorId,
        fileName: file.name.trim() || 'image',
        mimeType: file.type.trim().toLowerCase() || 'application/octet-stream',
        sizeBytes: file.size,
        storagePath: `pending-comment-image:${insertedComment.id}:${index}`,
      }))
      const pendingCommentImageUpload = files.length && options.uploadCommentImages
        ? {
            commentId: insertedComment.id,
            promise: options.uploadCommentImages(insertedComment.id, options.authorId, files),
          }
        : null

      options.onSyncMessage(files.length ? '这句近况已经送出，图片正在上传。' : '留言已同步到 Supabase。')
      return {
        ok: true,
        message: files.length ? '这句近况已经送出，图片正在上传。' : '这句近况已经送出。',
        cloudComment: createWishComment({
          id: insertedComment.id,
          authorId: options.authorId,
          createdAt,
          images: pendingImages,
          message: normalizedMessage,
        }),
        pendingCommentImageUpload,
      } satisfies WishActionResult & {
        cloudComment: ReturnType<typeof createWishComment>
        pendingCommentImageUpload: PendingCommentImageUpload | null
      }
    } finally {
      options.onLoadingChange(false)
    }
  }

  const localComment = createWishComment({
    authorId: options.authorId,
    message: normalizedMessage,
  })

  return {
    ok: true,
    message: '这句近况已经记下。',
    localComment,
  }
}

export async function updateCommentWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wishId: string
  commentId: string
  currentMemberId: string | null
  wish: WishRecord | undefined
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
  nextMessage: string
}) {
  const normalizedMessage = options.nextMessage.trim()
  const comment = options.wish?.comments.find((entry) => entry.id === options.commentId)

  if (!options.wish || !comment || !options.currentMemberId) {
    return { ok: false, message: '当前没有可编辑的留言。' } satisfies WishActionResult
  }

  if (comment.authorId !== options.currentMemberId) {
    return { ok: false, message: '只能编辑自己写下的留言。' } satisfies WishActionResult
  }

  if (!normalizedMessage) {
    return { ok: false, message: '留言内容不能为空。' } satisfies WishActionResult
  }

  if (options.supabase && options.isUsingCloudWishes) {
    options.onLoadingChange(true)

    try {
      const { error } = await options.supabase
        .from('wish_comments')
        .update({ body: normalizedMessage })
        .eq('id', options.commentId)
        .eq('wish_id', options.wishId)

      if (error) {
        const message = `留言编辑失败：${error.message}`
        options.onSyncMessage(message)
        return { ok: false, message } satisfies WishActionResult
      }

      options.onSyncMessage('留言已更新。')
      return {
        ok: true,
        message: '这句留言已经改好了。',
        updatedMessage: normalizedMessage,
      } satisfies WishActionResult & { updatedMessage: string }
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    ok: true,
    message: '这句留言已经改好了。',
    updatedMessage: normalizedMessage,
  }
}

export async function deleteCommentWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wishId: string
  commentId: string
  currentMemberId: string | null
  wish: WishRecord | undefined
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  const comment = options.wish?.comments.find((entry) => entry.id === options.commentId)

  if (!options.wish || !comment || !options.currentMemberId) {
    return { ok: false, message: '当前没有可删除的留言。' } satisfies WishActionResult
  }

  if (comment.authorId !== options.currentMemberId) {
    return { ok: false, message: '只能删除自己写下的留言。' } satisfies WishActionResult
  }

  if (options.supabase && options.isUsingCloudWishes) {
    options.onLoadingChange(true)

    try {
      const { error } = await options.supabase
        .from('wish_comments')
        .delete()
        .eq('id', options.commentId)
        .eq('wish_id', options.wishId)

      if (error) {
        const message = `留言删除失败：${error.message}`
        options.onSyncMessage(message)
        return { ok: false, message } satisfies WishActionResult
      }

      options.onSyncMessage('留言已删除。')
      return {
        ok: true,
        message: '这句留言已经移走了。',
        deletedCommentId: options.commentId,
      } satisfies WishActionResult & { deletedCommentId: string }
    } finally {
      options.onLoadingChange(false)
    }
  }

  return {
    ok: true,
    message: '这句留言已经移走了。',
    deletedCommentId: options.commentId,
  }
}
