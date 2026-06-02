import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import type { WishDraft } from '../stores/wishes'
import { progressOptions, priorityOptions, scopeOptions } from './useComposePreviewState'

const categorySuggestions = ['旅行', '学习', '生活', '健康', '仪式']

type PreviewTone = 'info' | 'success' | 'warning'

function createPreviewDraft(ownerId: string): WishDraft {
  return {
    title: '',
    category: '生活',
    priority: 'medium',
    dueDate: '',
    note: '',
    ownerId,
    scope: 'shared',
    progressMode: 'none',
    progressCurrent: 0,
    progressTarget: 1,
    progressUnit: '次',
  }
}

export function useComposePreviewSandbox() {
  const authStore = useAuthStore()
  const fallbackOwnerId = computed(() => {
    return authStore.currentMember?.id ?? authStore.members[0]?.id ?? ''
  })

  const draft = ref<WishDraft>(createPreviewDraft(fallbackOwnerId.value))
  const initialStepDrafts = ref<string[]>(['找一个周末晚上', '把第一步定小一点'])
  const previewMessage = ref('这只是预览，不会真的写入清单。')
  const previewTone = ref<PreviewTone>('info')

  watch(
    fallbackOwnerId,
    (ownerId) => {
      if (ownerId) {
        draft.value.ownerId = ownerId
      }
    },
    { immediate: true },
  )

  const viewerName = computed(() => authStore.currentMember?.displayName ?? '我们')
  const selectedOwnerLabel = computed(() => {
    return authStore.members.find((member) => member.id === draft.value.ownerId)?.displayName
      ?? authStore.currentMember?.displayName
      ?? '当前成员'
  })
  const selectedScopeOption = computed(() => {
    return scopeOptions.find((option) => option.value === draft.value.scope) ?? scopeOptions[0]
  })
  const selectedPriorityOption = computed(() => {
    return priorityOptions.find((option) => option.value === draft.value.priority) ?? priorityOptions[1]
  })
  const selectedProgressOption = computed(() => {
    return progressOptions.find((option) => option.value === draft.value.progressMode) ?? progressOptions[0]
  })
  const selectedScopeLabel = computed(() => selectedScopeOption.value.label)
  const selectedScopeDescription = computed(() => selectedScopeOption.value.description)
  const selectedPriorityLabel = computed(() => selectedPriorityOption.value.label)
  const selectedPriorityDescription = computed(() => selectedPriorityOption.value.description)
  const selectedProgressLabel = computed(() => selectedProgressOption.value.label)
  const selectedProgressDescription = computed(() => selectedProgressOption.value.description)
  const draftTitlePreview = computed(() => draft.value.title.trim() || '这条愿望还在等名字')
  const draftNotePreview = computed(() => {
    return draft.value.note.trim() || '一句很短的原因就够了，剩下的留给以后慢慢长。'
  })
  const dueDateLabel = computed(() => getRelativeDueLabel(draft.value.dueDate))
  const initialStepCount = computed(() => {
    return initialStepDrafts.value.map((step) => step.trim()).filter(Boolean).length
  })
  const stepPreview = computed(() => {
    return initialStepDrafts.value.map((step) => step.trim()).filter(Boolean).slice(0, 4)
  })
  const progressSummary = computed(() => {
    if (draft.value.progressMode === 'count') {
      if (draft.value.progressTarget <= 0) {
        return '先等一个目标数'
      }

      const unitText = draft.value.progressUnit.trim() || '次'
      return `现在 ${draft.value.progressCurrent}/${draft.value.progressTarget} ${unitText}`
    }

    if (draft.value.progressMode === 'steps') {
      return initialStepCount.value ? `先拆成 ${initialStepCount.value} 步` : '还没写起步步骤'
    }

    return '先把愿望本身写稳'
  })
  const progressDetail = computed(() => {
    if (draft.value.progressMode === 'count') {
      return draft.value.progressTarget > 0
        ? '适合次数、里程、章节这类可以慢慢累计的目标。'
        : '目标数需要大于 0。'
    }

    if (draft.value.progressMode === 'steps') {
      return '先写第一批步骤，后面再继续补。'
    }

    return '先留下愿望本身，等它更清楚时再补进度。'
  })

  function applyCategory(category: string) {
    draft.value.category = category
  }

  function addInitialStepField() {
    if (initialStepDrafts.value.length < 5) {
      initialStepDrafts.value.push('')
    }
  }

  function removeInitialStepField(index: number) {
    if (initialStepDrafts.value.length === 1) {
      initialStepDrafts.value[0] = ''
      return
    }

    initialStepDrafts.value.splice(index, 1)
  }

  function resetDraft() {
    draft.value = createPreviewDraft(fallbackOwnerId.value)
    initialStepDrafts.value = ['找一个周末晚上', '把第一步定小一点']
    previewMessage.value = '这只是预览，不会真的写入清单。'
    previewTone.value = 'info'
  }

  function stagePreview() {
    if (!draft.value.title.trim()) {
      previewMessage.value = '先写一个愿望名字，再看这页会怎样收起来。'
      previewTone.value = 'warning'
      return
    }

    previewMessage.value = '已收成预览稿，只用于看结构，不会真的提交。'
    previewTone.value = 'success'
  }

  return {
    applyCategory,
    authStore,
    categorySuggestions,
    draft,
    draftNotePreview,
    draftTitlePreview,
    dueDateLabel,
    initialStepCount,
    initialStepDrafts,
    previewMessage,
    previewTone,
    progressDetail,
    progressOptions,
    progressSummary,
    priorityOptions,
    removeInitialStepField,
    resetDraft,
    scopeOptions,
    selectedOwnerLabel,
    selectedPriorityDescription,
    selectedPriorityLabel,
    selectedProgressDescription,
    selectedProgressLabel,
    selectedScopeDescription,
    selectedScopeLabel,
    stagePreview,
    stepPreview,
    viewerName,
    addInitialStepField,
  }
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