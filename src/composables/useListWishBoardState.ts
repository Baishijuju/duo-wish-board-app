import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useFilterStore } from '../stores/filters'
import type { WishPriority, WishRecord, WishScope } from '../stores/wishes'
import { useWishStore } from '../stores/wishes'
import { formatBeijingDate } from '../utils/datetime'

const priorityLabels: Record<WishPriority, string> = {
  high: '很想靠近',
  medium: '慢慢靠近',
  low: '先放在这里',
}

const scopeLabels: Record<WishScope, string> = {
  private: '只属于我',
  shared: '我们一起',
}

export function useListWishBoardState() {
  const authStore = useAuthStore()
  const filterStore = useFilterStore()
  const wishStore = useWishStore()

  const filteredWishes = computed(() => {
    const currentMemberId = authStore.currentMember?.id

    const visibleWishes = wishStore.sortedWishes.filter((wish) => {
      const matchStatus = filterStore.status === 'all' || wish.status === filterStore.status
      const matchVisibility =
        filterStore.visibility === 'all'
        || (filterStore.visibility === 'shared' && wish.scope === 'shared')
        || (filterStore.visibility === 'mine' && wish.scope === 'private' && wish.ownerId === currentMemberId)
      const matchSearch = `${wish.title} ${wish.category} ${wish.note}`
        .toLowerCase()
        .includes(filterStore.search.trim().toLowerCase())

      return matchStatus && matchVisibility && matchSearch
    })

    if (filterStore.sortMode === 'progress') {
      return [...visibleWishes].sort((leftWish, rightWish) => {
        const leftProgress = wishStore.getWishProgressSnapshot(leftWish)
        const rightProgress = wishStore.getWishProgressSnapshot(rightWish)
        const progressDifference = rightProgress.percent - leftProgress.percent

        if (progressDifference !== 0) {
          return progressDifference
        }

        return new Date(rightWish.updatedAt).getTime() - new Date(leftWish.updatedAt).getTime()
      })
    }

    return visibleWishes
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
      return '集齐七龙珠'
    }

    if (coinSnapshot.total > 0) {
      return `${coinSnapshot.total} 枚愿望币`
    }

    if (wish.images.length) {
      return '已经留下痕迹'
    }

    return '正在路上'
  }

  function getWishProgress(wish: WishRecord) {
    return wishStore.getWishProgressSnapshot(wish)
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

  return {
    authStore,
    filterStore,
    filteredWishes,
    formatDateLabel,
    getCoverImageUrl,
    getMemberName,
    getRelativeDueLabel,
    getWishMood,
    getWishProgress,
    getWishProgressHint,
    priorityLabels,
    scopeLabels,
    wishStore,
  }
}
