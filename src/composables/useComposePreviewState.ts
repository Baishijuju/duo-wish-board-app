import { computed } from 'vue'
import { useComposeWishForm } from './useComposeWishForm'

export const progressOptions = [
  {
    value: 'count',
    label: '按数字靠近',
    description: '适合次数、公里、章节这类能慢慢累计的目标。',
  },
  {
    value: 'steps',
    label: '按步骤慢慢走',
    description: '先拆成几步，再一小步一小步走完。',
  },
] as const

interface UseComposePreviewStateOptions {
  allowEditing?: boolean
}

export function useComposePreviewState(options: UseComposePreviewStateOptions = {}) {
  const composeForm = useComposeWishForm({ allowEditing: options.allowEditing })
  const {
    categorySuggestions,
    draft,
    editingWish,
    initialStepDrafts,
  } = composeForm

  const viewerName = computed(() => composeForm.authStore.currentMember?.displayName ?? '我们')
  const selectedProgressOption = computed(() => {
    return progressOptions.find((option) => option.value === draft.value.progressMode) ?? progressOptions[0]
  })
  const selectedProgressLabel = computed(() => {
    return selectedProgressOption.value.label
  })
  const selectedProgressDescription = computed(() => {
    return selectedProgressOption.value.description
  })
  const initialStepCount = computed(() => {
    return initialStepDrafts.value.map((step) => step.title.trim()).filter(Boolean).length
  })
  const progressStarCoinTotal = computed(() => {
    if (draft.value.progressMode === 'count') {
      return Math.max(0, draft.value.progressTarget) * Math.max(0, draft.value.progressStarCoinValue)
    }

    if (draft.value.progressMode === 'steps' && !editingWish.value) {
      return initialStepDrafts.value.reduce((total, step) => {
        return step.title.trim() ? total + Math.max(0, Number(step.starCoinValue ?? 0) || 0) : total
      }, 0)
    }

    return 0
  })
  const completionStarCoinBonus = computed(() => Math.max(0, Number(draft.value.completionStarCoinBonus) || 0))
  const starCoinTotalSummary = computed(() => {
    const total = progressStarCoinTotal.value + completionStarCoinBonus.value
    return `${formatStarCoinAmount(progressStarCoinTotal.value)} + ${formatStarCoinAmount(completionStarCoinBonus.value)} = ${formatStarCoinAmount(total)} 星星币`
  })
  const draftTitlePreview = computed(() => {
    return draft.value.title.trim() || '这条愿望还在等名字'
  })
  const draftNotePreview = computed(() => {
    return draft.value.note.trim() || '等你留下一句为什么想实现，它才更像会被回看的那一页。'
  })
  const composerHeadline = computed(() => {
    return editingWish.value ? '把这条愿望整理成它现在最像的样子' : '把一个愿望认真写进今天'
  })
  const composerLead = computed(() => {
    if (editingWish.value) {
      return '这一页只整理基本信息，让标题、范围和进度方式重新对齐。'
    }

    return '把名字、分类和第一步都放好，让这个小愿望一开始就有路可走。'
  })
  const progressSummary = computed(() => {
    if (draft.value.progressMode === 'count') {
      if (draft.value.progressTarget <= 0) {
        return '先等一个目标数'
      }

      const unitText = draft.value.progressUnit.trim() || '次'
      return `现在 ${draft.value.progressCurrent}/${draft.value.progressTarget} ${unitText}，每 ${unitText} ${formatStarCoinAmount(draft.value.progressStarCoinValue)} 星星币`
    }

    if (draft.value.progressMode === 'steps') {
      if (editingWish.value) {
        return '步骤继续留在详情页'
      }

      return initialStepCount.value ? `先拆成 ${initialStepCount.value} 步，共 ${formatStarCoinAmount(progressStarCoinTotal.value)} 星星币` : '还没写起步步骤'
    }

    return '先选一种推进方式'
  })
  const progressDetail = computed(() => {
    if (draft.value.progressMode === 'count') {
      return draft.value.progressTarget > 0
        ? '它会按数字记下每次靠近，后面还能继续改。'
        : '先给它一个大于 0 的目标数。'
    }

    if (draft.value.progressMode === 'steps') {
      return editingWish.value
        ? '这条愿望已经有步骤区了，这里只整理基本信息。'
        : '先写第一批步骤，写下后再去详情页补全和勾选。'
    }

    return '新愿望需要一种推进方式，选步骤或数字都可以。'
  })

  return {
    ...composeForm,
    categorySuggestions,
    composerHeadline,
    composerLead,
    draftNotePreview,
    draftTitlePreview,
    initialStepCount,
    progressDetail,
    progressSummary,
    progressOptions,
    selectedProgressDescription,
    selectedProgressLabel,
    starCoinTotalSummary,
    viewerName,
  }
}

function formatStarCoinAmount(value: number) {
  const roundedValue = Math.round(value * 10) / 10
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1)
}
