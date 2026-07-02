import type { SupabaseClient } from '@supabase/supabase-js'
import type { WishDraft, WishRecord } from '../../stores/wishes'
import { createWishRecord, createWishStep } from './wish.factories'

export interface InitialWishStepInput {
  title: string
  starCoinValue: number
}

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
    initialSteps: InitialWishStepInput[]
    onLoadingChange: (isLoading: boolean) => void
    onSyncMessage: (message: string) => void
    syncFromSupabase: (spaceId: string) => Promise<boolean>
  },
) {
  options.onLoadingChange(true)

  try {
    const insertPayload = {
      category: options.draft.category.trim(),
      note: options.draft.note.trim(),
      owner_id: options.ownerId,
      scope: options.draft.scope,
      space_id: options.currentSpaceId,
      title: options.draft.title.trim(),
      ...(options.includeProgressFields
        ? {
            completion_star_coin_bonus: options.draft.completionStarCoinBonus,
            progress_current: options.draft.progressCurrent,
            progress_mode: options.draft.progressMode,
            progress_star_coin_value: options.draft.progressStarCoinValue,
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

    let successMessage = options.initialSteps.length
      ? `愿望和 ${options.initialSteps.length} 个初始步骤已写入 Supabase。`
      : '愿望已写入 Supabase。'

    if (data?.id && options.initialSteps.length) {
      const { error: stepError } = await options.supabase.from('wish_steps').insert(
        options.initialSteps.map((step) => ({
          is_done: false,
          star_coin_value: step.starCoinValue,
          title: step.title,
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

export function addWishLocal(draft: WishDraft, initialSteps: InitialWishStepInput[]) {
  const createdWish = createWishRecord({
    ...draft,
    steps: initialSteps.map((step) => createWishStep(step)),
  })

  return {
    message: initialSteps.length
      ? `愿望和 ${initialSteps.length} 个初始步骤已保存到本地。`
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
