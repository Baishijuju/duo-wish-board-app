import { computed } from 'vue'
import { useComposeWishForm } from './useComposeWishForm'

export const priorityOptions = [
  {
    value: 'high',
    label: '最想先靠近',
    description: '想尽快把它放到最近会去碰的一层。',
  },
  {
    value: 'medium',
    label: '稳稳往前',
    description: '不着急，但希望它一直在往前走。',
  },
  {
    value: 'low',
    label: '先替它留位',
    description: '先认真放进生活里，之后再慢慢把它提近。',
  },
] as const

export const progressOptions = [
  {
    value: 'none',
    label: '先只写下来',
    description: '先把愿望放稳，进度以后再补。',
  },
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
    authStore,
    categorySuggestions,
    draft,
    editingWish,
    initialStepDrafts,
  } = composeForm

  const viewerName = computed(() => authStore.currentMember?.displayName ?? '我们')
  const selectedOwnerLabel = computed(() => {
    return authStore.members.find((member) => member.id === draft.value.ownerId)?.displayName
      ?? authStore.currentMember?.displayName
      ?? '当前成员'
  })
  const selectedPriorityOption = computed(() => {
    return priorityOptions.find((option) => option.value === draft.value.priority) ?? priorityOptions[1]
  })
  const selectedProgressOption = computed(() => {
    return progressOptions.find((option) => option.value === draft.value.progressMode) ?? progressOptions[0]
  })
  const selectedPriorityLabel = computed(() => {
    return selectedPriorityOption.value.label
  })
  const selectedPriorityDescription = computed(() => {
    return selectedPriorityOption.value.description
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
  const dueDateLabel = computed(() => getRelativeDueLabel(draft.value.dueDate))
  const composerHeadline = computed(() => {
    return editingWish.value ? '把这条愿望整理成它现在最像的样子' : '把一个愿望认真写进今天'
  })
  const composerLead = computed(() => {
    if (editingWish.value) {
      return '这一页只整理基本信息，让标题、范围和进度方式重新对齐。'
    }

    return '不用一次写满，先写名字、方向和一点想实现它的心情。'
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

    return '先只写愿望本身'
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

    return '先把愿望本身写稳，进度以后再补。'
  })

  return {
    ...composeForm,
    categorySuggestions,
    composerHeadline,
    composerLead,
    draftNotePreview,
    draftTitlePreview,
    dueDateLabel,
    initialStepCount,
    progressDetail,
    progressSummary,
    progressOptions,
    priorityOptions,
    selectedOwnerLabel,
    selectedPriorityDescription,
    selectedPriorityLabel,
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

function getLocalDateTimestamp(dateValue: string) {
  const trimmedValue = dateValue.trim()

  if (!trimmedValue) {
    return null
  }

  const [yearText, monthText, dayText] = trimmedValue.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }

  const timestamp = new Date(year, month - 1, day).getTime()
  return Number.isNaN(timestamp) ? null : timestamp
}

function getRelativeDueLabel(dueDate: string) {
  const dueTimestamp = getLocalDateTimestamp(dueDate)

  if (dueTimestamp === null) {
    return '还没定下日子'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDifference = Math.round((dueTimestamp - today.getTime()) / (24 * 60 * 60 * 1000))

  if (dayDifference < 0) {
    return `已经过了 ${Math.abs(dayDifference)} 天`
  }

  if (dayDifference === 0) {
    return '就定在今天'
  }

  if (dayDifference === 1) {
    return '还有 1 天'
  }

  return `还有 ${dayDifference} 天`
}