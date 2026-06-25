import { computed } from 'vue'
import { useWishDetailState } from './useWishDetailState'

export function useWishDetailPageState() {
  const detailState = useWishDetailState()
  const {
    authStore,
    currentMemberStarCoins,
    progressSnapshot,
    selectedWish,
    wishJournalEntries,
    wishRewardClaim,
  } = detailState

  const viewerName = computed(() => authStore.currentMember?.displayName ?? '我们')
  const coverImageUrl = computed(() => selectedWish.value?.images[0]?.url ?? '')
  const dueDateLabel = computed(() => {
    if (!selectedWish.value?.dueDate?.trim()) {
      return '还没有定日子'
    }

    return `${selectedWish.value.dueDate} 前`
  })
  const summaryCards = computed(() => {
    return [
      {
        label: '手账记录',
        note: '留言、推进和完成痕迹，都会顺着这一页留下。',
        value: `${wishJournalEntries.value.length} 条`,
      },
      {
        label: '图片与纪念',
        note: coverImageUrl.value ? '首图会先替这一页把记忆翻开。' : '还没上传图片，也可以先把过程写下来。',
        value: `${selectedWish.value?.images.length ?? 0} 张`,
      },
      {
        label: '星星币',
        note: wishRewardClaim.value ? `已经把「${wishRewardClaim.value.titleSnapshot}」接住了` : '完成时会在这里接住奖励。',
        value: `${currentMemberStarCoins.value}`,
      },
    ]
  })
  const progressLead = computed(() => {
    if (!progressSnapshot.value || progressSnapshot.value.mode === 'none') {
      return '这条愿望还没决定要怎么记进度，也没关系，先挑一种顺手的记法就能继续往前。'
    }

    if (progressSnapshot.value.mode === 'count') {
      return '数字进度适合那些一点点累起来的靠近，页数、公里和次数，都能在这里慢慢记下。'
    }

    return '步骤进度适合那些要一件件推进的靠近，每做完一步，这一页都会替你记住。'
  })
  const rewardHeadline = computed(() => {
    if (wishRewardClaim.value) {
      return `这条愿望完成时，已经把「${wishRewardClaim.value.titleSnapshot}」好好接住了`
    }

    return '推进、留言和领奖，会在这里慢慢长成同一页手账。'
  })

  return {
    ...detailState,
    coverImageUrl,
    dueDateLabel,
    progressLead,
    rewardHeadline,
    summaryCards,
    viewerName,
  }
}