import { computed } from 'vue'
import { useWishDetailState } from './useWishDetailState'

export function useWishDetailPageState() {
  const detailState = useWishDetailState()
  const {
    authStore,
    coinSnapshot,
    currentMemberStarCoins,
    getCoinStatusLabel,
    progressSnapshot,
    selectedWish,
    wishJournalEntries,
    wishRewardClaim,
    wishStore,
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
        note: '留言、投币和完成痕迹，都会顺着这一页留下。',
        value: `${wishJournalEntries.value.length} 条`,
      },
      {
        label: '图片与纪念',
        note: coverImageUrl.value ? '首图会先替这一页把记忆翻开。' : '还没上传图片，也可以先把过程写下来。',
        value: `${selectedWish.value?.images.length ?? 0} 张`,
      },
      {
        label: '愿望币',
        note: getCoinStatusLabel(),
        value: `${coinSnapshot.value?.total ?? 0} 枚`,
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
  const coinLead = computed(() => {
    if (!coinSnapshot.value) {
      return '愿望币会在这里慢慢把偏爱、鼓励和推进感攒起来。'
    }

    return coinSnapshot.value.isDragonBallReady
      ? '七龙珠已经集齐，这条愿望会继续留在更该先靠近的位置。'
      : `再投 ${coinSnapshot.value.remainingToDragonBall} 枚，这条愿望就能把七龙珠集齐，也会更靠近最前面。`
  })
  const rewardHeadline = computed(() => {
    if (wishRewardClaim.value) {
      return `这条愿望完成时，已经把「${wishRewardClaim.value.titleSnapshot}」好好接住了`
    }

    return wishStore.currentMemberRemainingCoins > 0
      ? '推进、投币、留言和领奖，会在这里慢慢长成同一页手账。'
      : '这周的愿望币已经投完，但这一页还会继续替你收住过程。'
  })

  return {
    ...detailState,
    coinLead,
    coverImageUrl,
    dueDateLabel,
    progressLead,
    rewardHeadline,
    summaryCards,
    viewerName,
  }
}