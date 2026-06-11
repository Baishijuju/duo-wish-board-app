import type { SupabaseClient } from '@supabase/supabase-js'
import type { WishDraft, WishRecord } from '../../stores/wishes'
import { createWishRecord, createWishStep } from './wish.factories'

export async function runCloudMutation(
  options: {
    supabase: SupabaseClient | null
    isUsingCloudWishes: boolean
    currentSpaceId: string | null | undefined
    onLoadingChange: (isLoading: boolean) => void
    onSyncMessage: (message: string) => void
    mutate: () => Promise<{ error: { message: string } | null }>
    successMessage: string
    syncAfterWrite?: boolean
    syncFromSupabase: (spaceId: string) => Promise<boolean>
  },
) {
  if (!options.supabase || !options.isUsingCloudWishes || !options.currentSpaceId) {
    return false
  }

  options.onLoadingChange(true)

  try {
    const { error } = await options.mutate()

    if (error) {
      options.onSyncMessage(`云端写入失败：${error.message}`)
      return false
    }

    if (options.syncAfterWrite ?? true) {
      await options.syncFromSupabase(options.currentSpaceId)
    }

    options.onSyncMessage(options.successMessage)
    return true
  } finally {
    options.onLoadingChange(false)
  }
}

export async function addWishCloud(
  options: {
    supabase: SupabaseClient
    currentSpaceId: string
    ownerId: string
    includeProgressFields: boolean
    draft: WishDraft
    initialStepTitles: string[]
    onLoadingChange: (isLoading: boolean) => void
    onSyncMessage: (message: string) => void
    syncFromSupabase: (spaceId: string) => Promise<boolean>
  },
) {
  options.onLoadingChange(true)

  try {
    const insertPayload = {
      category: options.draft.category.trim(),
      due_date: options.draft.dueDate || null,
      note: options.draft.note.trim(),
      owner_id: options.ownerId,
      priority: options.draft.priority,
      scope: options.draft.scope,
      space_id: options.currentSpaceId,
      title: options.draft.title.trim(),
      ...(options.includeProgressFields
        ? {
            progress_current: options.draft.progressCurrent,
            progress_mode: options.draft.progressMode,
            progress_target: options.draft.progressTarget,
            progress_unit: options.draft.progressUnit.trim(),
          }
        : {}),
    }

    const { data, error } = await options.supabase
      .from('wishes')
      .insert(insertPayload)
      .select('id')
      .single()

    if (error) {
      options.onSyncMessage(`云端写入失败：${error.message}`)
      return null
    }

    let successMessage = options.initialStepTitles.length
      ? `愿望和 ${options.initialStepTitles.length} 个初始步骤已写入 Supabase。`
      : '愿望已写入 Supabase。'

    if (data?.id && options.initialStepTitles.length) {
      const { error: stepError } = await options.supabase.from('wish_steps').insert(
        options.initialStepTitles.map((title) => ({
          is_done: false,
          title,
          wish_id: data.id,
        })),
      )

      if (stepError) {
        successMessage = `愿望已写入，但初始步骤同步失败：${stepError.message}`
      }
    }

    await options.syncFromSupabase(options.currentSpaceId)
    options.onSyncMessage(successMessage)
    return data?.id ?? null
  } finally {
    options.onLoadingChange(false)
  }
}

export function addWishLocal(draft: WishDraft, initialStepTitles: string[]) {
  const createdWish = createWishRecord({
    ...draft,
    steps: initialStepTitles.map((title) => createWishStep({ title })),
  })

  return {
    message: initialStepTitles.length
      ? `愿望和 ${initialStepTitles.length} 个初始步骤已保存到本地。`
      : '愿望已保存到本地。',
    wish: createdWish,
  }
}

export function updateWishLocal(existingWish: WishRecord, draft: WishDraft, touchWish: (wish: WishRecord) => WishRecord) {
  return touchWish(
    createWishRecord({
      ...existingWish,
      ...draft,
    }),
  )
}

export function deleteWishLocal(id: string, wishes: WishRecord[]) {
  return wishes.filter((wish) => wish.id !== id)
}
