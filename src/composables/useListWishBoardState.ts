import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useFilterStore, type SortFilter } from '../stores/filters'
import type { WishPriority, WishRecord } from '../stores/wishes'
import { useWishStore } from '../stores/wishes'
import { formatBeijingDate } from '../utils/datetime'

const priorityLabels: Record<WishPriority, string> = {
  high: '很想靠近',
  medium: '慢慢靠近',
  low: '先放在这里',
}

const wishStarCoinClaimKinds = new Set(['step_star_coin', 'count_star_coin', 'wish_completion_bonus'])

export function useListWishBoardState() {
  const authStore = useAuthStore()
  const filterStore = useFilterStore()
  const wishStore = useWishStore()

  function getIsoTimestamp(dateValue: string) {
    const timestamp = new Date(dateValue).getTime()
    return Number.isFinite(timestamp) ? timestamp : 0
  }

  function getDaysSince(dateValue: string) {
    const timestamp = getIsoTimestamp(dateValue)

    if (!timestamp) {
      return 0
    }

    return Math.max(Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000)), 0)
  }

  function getWishRemainingStarCoins(wish: WishRecord) {
    if (wish.status === 'done') {
      return 0
    }

    if (wish.progressMode === 'count') {
      const target = Math.max(1, wish.progressTarget)
      const current = Math.min(Math.max(0, wish.progressCurrent), target)
      const remainingUnits = Math.max(target - current, 0)
      return remainingUnits * Math.max(0, wish.progressStarCoinValue) + Math.max(0, wish.completionStarCoinBonus)
    }

    if (wish.progressMode === 'steps') {
      const remainingStepCoins = wish.steps
        .filter((step) => !step.isDone)
        .reduce((total, step) => total + Math.max(0, step.starCoinValue), 0)
      return remainingStepCoins + Math.max(0, wish.completionStarCoinBonus)
    }

    return Math.max(0, wish.completionStarCoinBonus)
  }

  function getWishEarnedStarCoins(wish: WishRecord) {
    return wishStore.rewardClaims
      .filter((claim) => claim.sourceWishId === wish.id && wishStarCoinClaimKinds.has(claim.claimKind))
      .reduce((total, claim) => total + Math.max(0, claim.starCoinDelta), 0)
  }

  function compareWishesBySortMode(sortMode: SortFilter, leftWish: WishRecord, rightWish: WishRecord) {
    const leftProgress = wishStore.getWishProgressSnapshot(leftWish)
    const rightProgress = wishStore.getWishProgressSnapshot(rightWish)
    let comparison = 0

    if (sortMode === 'progress') {
      comparison = rightProgress.percent - leftProgress.percent || getIsoTimestamp(rightWish.updatedAt) - getIsoTimestamp(leftWish.updatedAt)
    }

    if (sortMode === 'starCoins') {
      comparison = getWishRemainingStarCoins(rightWish) - getWishRemainingStarCoins(leftWish)
        || getWishEarnedStarCoins(rightWish) - getWishEarnedStarCoins(leftWish)
        || rightProgress.percent - leftProgress.percent
    }

    if (sortMode === 'age') {
      comparison = getIsoTimestamp(leftWish.createdAt) - getIsoTimestamp(rightWish.createdAt)
    }

    if (sortMode === 'updated') {
      comparison = getIsoTimestamp(rightWish.updatedAt) - getIsoTimestamp(leftWish.updatedAt)
    }

    return filterStore.sortDirection === 'desc' ? comparison : -comparison
  }

  const filteredWishes = computed(() => {
    const currentMemberId = authStore.currentMember?.id

    const visibleWishes = wishStore.sortedWishes.filter((wish) => {
      const matchStatus = filterStore.status === 'all' || wish.status === filterStore.status
      const matchVisibility =
        filterStore.visibility === 'all'
        || (filterStore.visibility === 'mine' && wish.ownerId === currentMemberId)
        || (filterStore.visibility === 'others' && wish.ownerId !== currentMemberId)
      const matchSearch = `${wish.title} ${wish.category} ${wish.note}`
        .toLowerCase()
        .includes(filterStore.search.trim().toLowerCase())

      return matchStatus && matchVisibility && matchSearch
    })

    return [...visibleWishes].sort((leftWish, rightWish) => {
      return compareWishesBySortMode(filterStore.sortMode, leftWish, rightWish)
    })
  })

  const listWorkbenchStats = computed(() => {
    const activeWishes = wishStore.sortedWishes.filter((wish) => wish.status === 'active')
    const currentMemberId = authStore.currentMember?.id
    const recentlyUpdatedWishes = activeWishes.filter((wish) => getDaysSince(wish.updatedAt) <= 7)

    return {
      activeCount: activeWishes.length,
      currentMemberActiveCount: activeWishes.filter((wish) => wish.ownerId === currentMemberId).length,
      nearlyDoneCount: activeWishes.filter((wish) => {
        const progress = wishStore.getWishProgressSnapshot(wish)
        return progress.percent >= 70 || progress.isReady
      }).length,
      recentlyUpdatedCount: recentlyUpdatedWishes.length,
      remainingStarCoins: activeWishes.reduce((total, wish) => total + getWishRemainingStarCoins(wish), 0),
    }
  })

  function getMemberName(memberId: string) {
    return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
  }

  function getCoverImageUrl(wish: WishRecord) {
    return wish.images[0]?.url ?? ''
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
      return '没有设定日期，慢慢来'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayDifference = Math.round((dueTimestamp - today.getTime()) / (24 * 60 * 60 * 1000))

    if (dayDifference < 0) {
        return `这个愿望已经在这里等了我们 ${Math.abs(dayDifference)} 天。`
    }

    if (dayDifference === 0) {
      return '就是今天'
    }

    if (dayDifference === 1) {
      return '明天就到约定的日子'
    }

    return `还剩 ${dayDifference} 天`
  }

  function formatDateLabel(dateValue: string) {
    return formatBeijingDate(dateValue)
  }

  function getWishMood(wish: WishRecord) {
    if (wish.status === 'done') {
      return '已经实现'
    }

    const dueTimestamp = getLocalDateTimestamp(wish.dueDate)

    if (dueTimestamp !== null) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysLeft = Math.round((dueTimestamp - today.getTime()) / (24 * 60 * 60 * 1000))

      if (daysLeft >= 0 && daysLeft <= 3) {
        return '快要靠近了'
      }
    }

    const coinSnapshot = wishStore.getWishCoinSummary(wish)

    if (coinSnapshot.isDragonBallReady) {
      return '靠近完成'
    }

    if (wish.images.length) {
      return '已经留下痕迹'
    }

    return '正在路上'
  }

  function getWishProgress(wish: WishRecord) {
    return wishStore.getWishProgressSnapshot(wish)
  }

  function getWishProgressPercentLabel(wish: WishRecord) {
    return `${getWishProgress(wish).percent}%`
  }

  function getWishAgeLabel(wish: WishRecord) {
    const days = getDaysSince(wish.createdAt)
    return days <= 0 ? '今天加入' : `存在 ${days} 天`
  }

  function getWishUpdatedLabel(wish: WishRecord) {
    const days = getDaysSince(wish.updatedAt)

    if (days <= 0) {
      return '今天更新'
    }

    if (days === 1) {
      return '昨天更新'
    }

    return `${days} 天前更新`
  }

  function getWishRemainingStarCoinLabel(wish: WishRecord) {
    const amount = getWishRemainingStarCoins(wish)
    return amount > 0 ? `还可拿 ${formatStarCoinAmount(amount)} 星星币` : '星星币已拿完'
  }

  function getWishEarnedStarCoinLabel(wish: WishRecord) {
    return `已获得 ${formatStarCoinAmount(getWishEarnedStarCoins(wish))} 星星币`
  }

  function getWishSortContext(wish: WishRecord) {
    const progress = getWishProgress(wish)

    if (filterStore.sortMode === 'progress') {
      return {
        label: '当前进度',
        meta: progress.label,
        progressPercent: progress.percent,
        tone: 'progress',
        value: `${progress.percent}%`,
      } as const
    }

    if (filterStore.sortMode === 'starCoins') {
      return {
        label: '星星币',
        meta: getWishRemainingStarCoinLabel(wish),
        progressPercent: null,
        tone: 'starCoins',
        value: getWishEarnedStarCoinLabel(wish),
      } as const
    }

    if (filterStore.sortMode === 'age') {
      return {
        label: '存在时间',
        meta: `写下于 ${formatDateLabel(wish.createdAt)}`,
        progressPercent: null,
        tone: 'age',
        value: getWishAgeLabel(wish),
      } as const
    }

    return {
      label: '最近更新',
      meta: progress.isReady ? '已经可以确认完成' : getWishProgressHint(wish),
      progressPercent: null,
      tone: 'updated',
      value: getWishUpdatedLabel(wish),
    } as const
  }

  function getWishProgressHint(wish: WishRecord) {
    const progress = getWishProgress(wish)

    if (progress.mode === 'count') {
      if (progress.isReady && wish.status !== 'done') {
        return '数字上已经走满了，等你亲手把它收进回忆里。'
      }

      return '每次往前走一点点，这里都会记住。'
    }

    if (progress.mode === 'steps') {
      if (!progress.target) {
        return '还没有拆成小步骤，可以去详情页慢慢补。'
      }

      if (progress.isReady && wish.status !== 'done') {
        return '这些小步骤都走完了，只差你轻轻确认，把它收进已实现。'
      }

      return progress.pendingStepTitles.slice(0, 2).join('、') || '下一步已经在路上。'
    }

    return wish.note.trim()
      ? '它先被认真写下来了，什么时候开始往前都可以。'
      : '先把它留在清单里，也是一种认真开始。'
  }

  function canCurrentMemberProgressWish(wish: WishRecord) {
    return !!authStore.currentMember?.id && wish.ownerId === authStore.currentMember.id
  }

  function formatStarCoinAmount(value: number) {
    const roundedValue = Math.round(value * 10) / 10
    return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1)
  }

  return {
    authStore,
    filterStore,
    filteredWishes,
    formatDateLabel,
    canCurrentMemberProgressWish,
    getCoverImageUrl,
    getMemberName,
    getRelativeDueLabel,
    getWishMood,
    getWishAgeLabel,
    getWishEarnedStarCoinLabel,
    getWishProgress,
    getWishProgressHint,
    getWishProgressPercentLabel,
    getWishRemainingStarCoinLabel,
    getWishSortContext,
    getWishUpdatedLabel,
    listWorkbenchStats,
    priorityLabels,
    wishStore,
  }
}
