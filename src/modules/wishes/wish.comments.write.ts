import type { SupabaseClient } from '@supabase/supabase-js'
import type { WishActionResult, WishRecord } from '../../stores/wishes'
import { createWishComment } from './wish.factories'

export async function addCommentWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  authorId: string
  message: string
  files?: File[]
  uploadCommentImages?: (commentId: string, authorId: string, files: File[]) => Promise<{ summaryMessage: string }>
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
        .select('id')
        .single()

      if (commentError || !insertedComment?.id) {
        const nextMessage = `云端写入失败：${commentError?.message ?? '留言创建失败。'}`
        options.onSyncMessage(nextMessage)
        return { ok: false, message: nextMessage || '留言发送失败，请稍后重试。' } satisfies WishActionResult
      }

      let summaryMessage = '留言已同步到 Supabase。'

      if (files.length && options.uploadCommentImages) {
        const uploadResult = await options.uploadCommentImages(insertedComment.id, options.authorId, files)
        summaryMessage = uploadResult.summaryMessage
      }

      await options.syncFromSupabase(options.currentSpaceId)
      options.onSyncMessage(summaryMessage)
      return { ok: true, message: files.length ? '这句近况和图片已经送出。' : '这句近况已经送出。' } satisfies WishActionResult
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

      if (options.currentSpaceId) {
        await options.syncFromSupabase(options.currentSpaceId)
      }
      options.onSyncMessage('留言已更新。')
      return { ok: true, message: '这句留言已经改好了。' } satisfies WishActionResult
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

      if (options.currentSpaceId) {
        await options.syncFromSupabase(options.currentSpaceId)
      }
      options.onSyncMessage('留言已删除。')
      return { ok: true, message: '这句留言已经移走了。' } satisfies WishActionResult
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
