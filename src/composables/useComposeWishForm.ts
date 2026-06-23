import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { WishDraft } from '../stores/wishes'
import { useWishStore } from '../stores/wishes'

interface UseComposeWishFormOptions {
  allowEditing?: boolean
}

export interface InitialStepDraft {
  title: string
  starCoinValue: number | null
}

function createEmptyInitialStepDraft(): InitialStepDraft {
  return {
    title: '',
    starCoinValue: null,
  }
}

export function useComposeWishForm(options: UseComposeWishFormOptions = {}) {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const wishStore = useWishStore()
  const allowEditing = options.allowEditing ?? true

  const feedbackMessage = ref('')
  const feedbackTone = ref<'success' | 'danger'>('success')
  const initialStepDrafts = ref<InitialStepDraft[]>([createEmptyInitialStepDraft(), createEmptyInitialStepDraft()])
  const categorySuggestions = ['旅行', '生活', '成长', '健康', '家', '纪念']

  function createEmptyDraft(): WishDraft {
    return {
      title: '',
      category: '',
      priority: 'medium',
      dueDate: '',
      note: '',
      ownerId: authStore.currentMember?.id ?? authStore.members[0]?.id ?? '',
      scope: 'shared',
      progressMode: 'none',
      progressCurrent: 0,
      progressTarget: 0,
      progressUnit: '',
      progressStarCoinValue: 0,
      completionStarCoinBonus: 0,
    }
  }

  const draft = ref<WishDraft>(createEmptyDraft())
  const editingWish = computed(() => {
    if (!allowEditing) {
      return null
    }

    const wishId = String(route.query.edit ?? '')
    return wishId ? wishStore.findById(wishId) ?? null : null
  })
  const formRouteName = computed(() => {
    return typeof route.name === 'string' ? route.name : 'compose'
  })

  watch(
    () => authStore.currentMemberId,
    (memberId) => {
      if (!editingWish.value && memberId) {
        draft.value.ownerId = memberId
      }
    },
    { immediate: true },
  )

  watch(
    () => editingWish.value?.id ?? '',
    (wishId) => {
      if (!wishId || !editingWish.value) {
        resetDraft()
        return
      }

      draft.value = {
        title: editingWish.value.title,
        category: editingWish.value.category,
        priority: editingWish.value.priority,
        dueDate: editingWish.value.dueDate,
        note: editingWish.value.note,
        ownerId: editingWish.value.ownerId,
        scope: editingWish.value.scope,
        progressMode: editingWish.value.progressMode,
        progressCurrent: editingWish.value.progressCurrent,
        progressTarget: editingWish.value.progressTarget,
        progressUnit: editingWish.value.progressUnit,
        progressStarCoinValue: editingWish.value.progressStarCoinValue,
        completionStarCoinBonus: editingWish.value.completionStarCoinBonus,
      }
    },
    { immediate: true },
  )

  function resetDraft() {
    draft.value = createEmptyDraft()
    initialStepDrafts.value = [createEmptyInitialStepDraft(), createEmptyInitialStepDraft()]
  }

  function applyCategory(category: string) {
    draft.value.category = category
  }

  function addInitialStepField() {
    initialStepDrafts.value = [...initialStepDrafts.value, createEmptyInitialStepDraft()]
  }

  function removeInitialStepField(index: number) {
    if (initialStepDrafts.value.length <= 1) {
      initialStepDrafts.value = [createEmptyInitialStepDraft()]
      return
    }

    initialStepDrafts.value = initialStepDrafts.value.filter((_, stepIndex) => stepIndex !== index)
  }

  function getNormalizedInitialSteps() {
    return initialStepDrafts.value
      .map((step) => ({
        starCoinValue: Number(step.starCoinValue ?? 0),
        title: step.title.trim(),
      }))
      .filter((step) => !!step.title)
  }

  async function submitWish() {
    if (!draft.value.title.trim()) {
      feedbackMessage.value = '先写下这条愿望是什么。'
      feedbackTone.value = 'danger'
      return
    }

    if (draft.value.progressMode === 'count' && draft.value.progressTarget <= 0) {
      feedbackMessage.value = '如果想按数字记进度，先写一个大于 0 的目标值。'
      feedbackTone.value = 'danger'
      return
    }

    if (draft.value.completionStarCoinBonus < 0) {
      feedbackMessage.value = '最终完成额外星星币不能是负数。'
      feedbackTone.value = 'danger'
      return
    }

    if (draft.value.progressMode === 'count') {
      if (draft.value.progressStarCoinValue <= 0) {
        feedbackMessage.value = '按数字记进度时，每单位星星币价格必须大于 0。'
        feedbackTone.value = 'danger'
        return
      }

      if (!editingWish.value) {
        // 新建 count 愿望时固定从 0 开始，避免创建时带入已完成量。
        draft.value.progressCurrent = 0
      }

      draft.value.progressCurrent = Math.max(0, Math.min(draft.value.progressCurrent, draft.value.progressTarget))
    }

    if (draft.value.progressMode === 'steps' && !editingWish.value) {
      const initialSteps = getNormalizedInitialSteps()

      if (!initialSteps.length) {
        feedbackMessage.value = '按步骤走的时候，至少先写一个起步步骤。'
        feedbackTone.value = 'danger'
        return
      }

      if (initialSteps.some((step) => step.starCoinValue <= 0)) {
        feedbackMessage.value = '每个步骤都需要写一个大于 0 的星星币价格。'
        feedbackTone.value = 'danger'
        return
      }
    }

    if (editingWish.value) {
      await wishStore.updateWish(editingWish.value.id, draft.value)
      await router.replace({ name: formRouteName.value })
      feedbackMessage.value = '这条愿望已经按现在的样子改好了。'
      feedbackTone.value = 'success'
      return
    }

    const initialSteps = draft.value.progressMode === 'steps' ? getNormalizedInitialSteps() : []
    const createdWishId = await wishStore.addWish(draft.value, initialSteps)

    if (!createdWishId) {
      feedbackMessage.value = wishStore.syncMessage || '这个愿望暂时还没写进去。'
      feedbackTone.value = 'danger'
      return
    }

    feedbackMessage.value = draft.value.progressMode === 'steps'
      ? (initialSteps.length ? `这条愿望和 ${initialSteps.length} 个起步步骤已经放进清单了。` : '这条愿望已经放进清单了，步骤后面还可以慢慢补。')
      : '这条愿望已经放进清单了。'
    feedbackTone.value = 'success'
    resetDraft()
  }

  function cancelEditing() {
    void router.replace({ name: formRouteName.value })
    feedbackMessage.value = ''
    resetDraft()
  }

  return {
    applyCategory,
    addInitialStepField,
    authStore,
    cancelEditing,
    categorySuggestions,
    draft,
    editingWish,
    feedbackMessage,
    feedbackTone,
    initialStepDrafts,
    removeInitialStepField,
    resetDraft,
    submitWish,
    wishStore,
  }
}