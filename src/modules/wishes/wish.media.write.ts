import type { SupabaseClient } from '@supabase/supabase-js'
import type { WishRecord } from '../../stores/wishes'

export async function uploadCommentImagesWrite(options: {
  supabase: SupabaseClient
  imageBucket: string
  commentId: string
  authorId: string
  files: File[]
  createStoragePath: (commentId: string, authorId: string, fileName: string, mimeType: string) => string
  prepareUpload: (file: File) => Promise<{ compressed: boolean; file: File }>
  isAllowedType: (mimeType: string) => boolean
  sourceMaxBytes: number
  uploadMaxBytes: number
}) {
  let uploadedCount = 0
  let compressedCount = 0
  const skippedFiles: string[] = []
  const failedFiles: string[] = []
  let nextSortOrder = 0

  for (const file of options.files) {
    const normalizedType = file.type.trim().toLowerCase()

    if (!options.isAllowedType(normalizedType) || file.size > options.sourceMaxBytes) {
      skippedFiles.push(file.name)
      continue
    }

    const preparedUpload = await options.prepareUpload(file)
    const uploadFile = preparedUpload.file
    const uploadType = uploadFile.type.trim().toLowerCase()

    if (!options.isAllowedType(uploadType) || uploadFile.size > options.uploadMaxBytes) {
      skippedFiles.push(file.name)
      continue
    }

    nextSortOrder += 1
    const storagePath = options.createStoragePath(options.commentId, options.authorId, uploadFile.name, uploadType)

    const { error: uploadError } = await options.supabase.storage.from(options.imageBucket).upload(storagePath, uploadFile, {
      cacheControl: '3600',
      contentType: uploadType,
      upsert: false,
    })

    if (uploadError) {
      nextSortOrder -= 1
      failedFiles.push(file.name)
      continue
    }

    const { error: rowError } = await options.supabase.from('wish_comment_images').insert({
      comment_id: options.commentId,
      created_by: options.authorId,
      file_name: uploadFile.name.trim() || 'image',
      mime_type: uploadType,
      size_bytes: uploadFile.size,
      sort_order: nextSortOrder,
      storage_path: storagePath,
    })

    if (rowError) {
      nextSortOrder -= 1
      failedFiles.push(file.name)
      await options.supabase.storage.from(options.imageBucket).remove([storagePath])
      continue
    }

    uploadedCount += 1

    if (preparedUpload.compressed) {
      compressedCount += 1
    }
  }

  if (!options.files.length) {
    return { summaryMessage: '留言已同步到 Supabase。' }
  }

  if (uploadedCount === options.files.length && !failedFiles.length && !skippedFiles.length) {
    return {
      summaryMessage: compressedCount
        ? `留言和 ${uploadedCount} 张图片已同步到 Supabase，其中 ${compressedCount} 张已自动压缩。`
        : `留言和 ${uploadedCount} 张图片已同步到 Supabase。`,
    }
  }

  return {
    summaryMessage: `这句近况已经送出；${uploadedCount} 张图片上传成功${compressedCount ? `，其中 ${compressedCount} 张已自动压缩` : ''}${failedFiles.length ? `；${failedFiles.length} 张失败` : ''}${skippedFiles.length ? `；${skippedFiles.length} 张因格式或大小限制被跳过` : ''}。`,
  }
}

export async function uploadWishImagesWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  uploaderId: string | null | undefined
  files: File[]
  maxImageCountPerWish: number
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
  createStoragePath: (wishId: string, uploaderId: string, fileName: string, mimeType: string) => string
  prepareUpload: (file: File) => Promise<{ compressed: boolean; file: File }>
  isAllowedType: (mimeType: string) => boolean
  sourceMaxBytes: number
  uploadMaxBytes: number
  imageBucket: string
}) {
  if (!options.wish || !options.files.length) {
    return false
  }

  if (options.wish.images.length >= options.maxImageCountPerWish) {
    options.onSyncMessage('当前详情页只保留 1 张封面图；先删除旧图后再上传新图。')
    return false
  }

  if (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId) {
    options.onSyncMessage('图片上传仅在已连接的 Supabase 云端空间中可用。')
    return false
  }

  if (!options.uploaderId) {
    options.onSyncMessage('当前会话缺少上传身份，请重新登录后再试。')
    return false
  }

  options.onLoadingChange(true)
  let uploadedCount = 0
  let compressedCount = 0
  const skippedFiles: string[] = []
  const failedFiles: string[] = []
  let nextSortOrder = options.wish.images.length

  try {
    for (const file of options.files.slice(0, options.maxImageCountPerWish)) {
      const normalizedType = file.type.trim().toLowerCase()

      if (!options.isAllowedType(normalizedType) || file.size > options.sourceMaxBytes) {
        skippedFiles.push(file.name)
        continue
      }

      const preparedUpload = await options.prepareUpload(file)
      const uploadFile = preparedUpload.file
      const uploadType = uploadFile.type.trim().toLowerCase()

      if (!options.isAllowedType(uploadType) || uploadFile.size > options.uploadMaxBytes) {
        skippedFiles.push(file.name)
        continue
      }

      nextSortOrder += 1
      const storagePath = options.createStoragePath(options.wishId, options.uploaderId, uploadFile.name, uploadType)

      const { error: uploadError } = await options.supabase.storage.from(options.imageBucket).upload(storagePath, uploadFile, {
        cacheControl: '3600',
        contentType: uploadType,
        upsert: false,
      })

      if (uploadError) {
        nextSortOrder -= 1
        failedFiles.push(file.name)
        continue
      }

      const { error: rowError } = await options.supabase.from('wish_images').insert({
        created_by: options.uploaderId,
        file_name: uploadFile.name.trim() || 'image',
        mime_type: uploadType,
        size_bytes: uploadFile.size,
        sort_order: nextSortOrder,
        storage_path: storagePath,
        wish_id: options.wishId,
      })

      if (rowError) {
        nextSortOrder -= 1
        failedFiles.push(file.name)
        await options.supabase.storage.from(options.imageBucket).remove([storagePath])
        continue
      }

      uploadedCount += 1

      if (preparedUpload.compressed) {
        compressedCount += 1
      }
    }

    if (uploadedCount) {
      await options.syncFromSupabase(options.currentSpaceId)
    }

    if (uploadedCount && !failedFiles.length && !skippedFiles.length) {
      options.onSyncMessage(
        compressedCount
          ? `已上传 ${uploadedCount} 张图片到 Supabase，其中 ${compressedCount} 张已自动压缩。`
          : `已上传 ${uploadedCount} 张图片到 Supabase。`,
      )
      return true
    }

    if (uploadedCount) {
      options.onSyncMessage(`已上传 ${uploadedCount} 张图片${compressedCount ? `，其中 ${compressedCount} 张已自动压缩` : ''}；${failedFiles.length} 张失败，${skippedFiles.length} 张因格式或大小限制被跳过。`)
      return true
    }

    options.onSyncMessage(
      failedFiles.length || skippedFiles.length
        ? `没有图片成功上传。${failedFiles.length ? ` 失败 ${failedFiles.length} 张。` : ''}${skippedFiles.length ? ` 跳过 ${skippedFiles.length} 张。` : ''}`
        : '没有检测到可上传的图片。',
    )
    return false
  } finally {
    options.onLoadingChange(false)
  }
}

export async function deleteWishImageWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  imageBucket: string
  image: { id: string; storagePath: string } | undefined
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  if (!options.image) {
    return false
  }

  if (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId) {
    options.onSyncMessage('图片删除仅在已连接的 Supabase 云端空间中可用。')
    return false
  }

  options.onLoadingChange(true)

  try {
    const { error: storageError } = await options.supabase.storage.from(options.imageBucket).remove([options.image.storagePath])

    if (storageError) {
      options.onSyncMessage(`云端图片删除失败：${storageError.message}`)
      return false
    }

    const { error: rowError } = await options.supabase.from('wish_images').delete().eq('id', options.image.id)

    if (rowError) {
      options.onSyncMessage(`图片记录删除失败：${rowError.message}`)
      return false
    }

    await options.syncFromSupabase(options.currentSpaceId)
    options.onSyncMessage('图片已从 Supabase 删除。')
    return true
  } finally {
    options.onLoadingChange(false)
  }
}

export async function deleteWishImagesWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  currentMemberId: string | null | undefined
  imageBucket: string
  wish: WishRecord | undefined
  wishId: string
  imageIds: string[]
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  const uniqueImageIds = [...new Set(options.imageIds)]
  const selectedImages = options.wish?.images.filter((image) => uniqueImageIds.includes(image.id)) ?? []

  if (!options.wish || !selectedImages.length) {
    return false
  }

  if (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId) {
    const selectedIdSet = new Set(uniqueImageIds)
    return {
      localImages: options.wish.images.filter((image) => !selectedIdSet.has(image.id)),
      message: `已删除 ${selectedImages.length} 张图片。`,
    }
  }

  const deletableImages = selectedImages.filter((image) => image.createdBy === options.currentMemberId)
  const blockedCount = selectedImages.length - deletableImages.length

  if (!deletableImages.length) {
    options.onSyncMessage('选中的图片都不是当前账号上传，暂时不能删除。')
    return false
  }

  options.onLoadingChange(true)

  try {
    const { error: storageError } = await options.supabase.storage
      .from(options.imageBucket)
      .remove(deletableImages.map((image) => image.storagePath))

    if (storageError) {
      options.onSyncMessage(`批量删除图片失败：${storageError.message}`)
      return false
    }

    const { error: rowError } = await options.supabase
      .from('wish_images')
      .delete()
      .eq('wish_id', options.wishId)
      .in('id', deletableImages.map((image) => image.id))

    if (rowError) {
      options.onSyncMessage(`批量删除图片记录失败：${rowError.message}`)
      return false
    }

    await options.syncFromSupabase(options.currentSpaceId)
    options.onSyncMessage(blockedCount
      ? `已删除 ${deletableImages.length} 张图片；${blockedCount} 张不是当前账号上传，未删除。`
      : `已删除 ${deletableImages.length} 张图片。`)
    return true
  } finally {
    options.onLoadingChange(false)
  }
}

export async function updateWishImageNoteWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  imageId: string
  nextNote: string
  onSyncMessage: (message: string) => void
  runCloudMutation: (mutate: () => Promise<{ error: { message: string } | null }>, successMessage: string) => Promise<boolean>
}) {
  const wish = options.wish
  const image = wish?.images.find((item) => item.id === options.imageId)
  const normalizedNote = options.nextNote.trim()

  if (!wish || !image) {
    return false
  }

  if (normalizedNote.length > 240) {
    options.onSyncMessage('图片备注最多 240 个字。')
    return false
  }

  if (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId) {
    return {
      localNote: normalizedNote,
      message: normalizedNote ? '图片备注已保存。' : '图片备注已清空。',
    }
  }

  return options.runCloudMutation(
    async () =>
      options.supabase!.rpc('update_wish_image_note', {
        next_note: normalizedNote,
        target_image_id: options.imageId,
        target_wish_id: wish.id,
      }),
    normalizedNote ? '图片备注已保存。' : '图片备注已清空。',
  )
}

export async function setWishCoverImageWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  imageId: string
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  const imageIndex = options.wish?.images.findIndex((item) => item.id === options.imageId) ?? -1

  if (!options.wish || imageIndex < 0) {
    return false
  }

  if (imageIndex === 0) {
    options.onSyncMessage('当前图片已经是首图。')
    return true
  }

  if (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId) {
    const nextImages = [...options.wish.images]
    const [coverImage] = nextImages.splice(imageIndex, 1)

    if (!coverImage) {
      return false
    }

    nextImages.unshift(coverImage)
    return {
      localImages: nextImages,
      message: '已将当前图片设为首图。',
    }
  }

  options.onLoadingChange(true)

  try {
    const { error } = await options.supabase.rpc('set_wish_image_cover', {
      target_image_id: options.imageId,
      target_wish_id: options.wish.id,
    })

    if (error) {
      options.onSyncMessage(`首图更新失败：${error.message}`)
      return false
    }

    await options.syncFromSupabase(options.currentSpaceId)
    options.onSyncMessage('已将当前图片设为首图。')
    return true
  } finally {
    options.onLoadingChange(false)
  }
}

export async function reorderWishImagesWrite(options: {
  supabase: SupabaseClient | null
  isUsingCloudWishes: boolean
  currentSpaceId: string | null | undefined
  wish: WishRecord | undefined
  wishId: string
  orderedImageIds: string[]
  reorderImagesByIds: (images: WishRecord['images'], orderedImageIds: string[]) => WishRecord['images'] | null
  onLoadingChange: (value: boolean) => void
  onSyncMessage: (message: string) => void
  syncFromSupabase: (spaceId: string) => Promise<boolean>
}) {
  if (!options.wish || !options.orderedImageIds.length) {
    return false
  }

  const originalImages = [...options.wish.images]
  const reorderedImages = options.reorderImagesByIds(originalImages, options.orderedImageIds)

  if (!reorderedImages) {
    options.onSyncMessage('图片排序失败：排序结果不完整。')
    return false
  }

  const isSameOrder = reorderedImages.every((image, index) => image.id === originalImages[index]?.id)

  if (isSameOrder) {
    return true
  }

  if (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId) {
    return {
      localImages: reorderedImages,
      message: '已更新图片顺序。',
    }
  }

  options.onLoadingChange(true)

  try {
    const { error } = await options.supabase.rpc('set_wish_image_order', {
      ordered_image_ids: options.orderedImageIds,
      target_wish_id: options.wishId,
    })

    if (error) {
      options.onSyncMessage(`图片排序失败：${error.message}`)
      return false
    }

    await options.syncFromSupabase(options.currentSpaceId)
    options.onSyncMessage('已更新图片顺序。')
    return true
  } finally {
    options.onLoadingChange(false)
  }
}
