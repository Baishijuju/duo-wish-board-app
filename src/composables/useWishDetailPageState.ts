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
  const coverImageUrl = computed(() => {
    const wishCoverUrl = selectedWish.value?.images[0]?.url

    if (wishCoverUrl) {
      return wishCoverUrl
    }

    for (const thread of wishJournalEntries.value) {
      const fallbackThreadImageUrl = thread.images.find((image) => image.url)?.url

      if (fallbackThreadImageUrl) {
        return fallbackThreadImageUrl
      }
    }

    return ''
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
      return '还没定记录方式也没关系，先挑一种顺手的，就能继续往前。'
    }

    if (progressSnapshot.value.mode === 'count') {
      return '每次 +1 都算数，页数、公里和次数都会在这里记下。'
    }

    return '把这一步做完，这一页就会替你记下。'
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
    progressLead,
    rewardHeadline,
    summaryCards,
    viewerName,
  }
}