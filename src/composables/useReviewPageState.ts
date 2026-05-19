import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import {
  DRAGON_BALL_COIN_TARGET,
  useWishStore,
  WISH_COIN_BUDGET_PER_CYCLE,
  type MonthlyJournalSnapshotRecord,
  type WishThreadEntry,
} from '../stores/wishes'
import { formatBeijingDate, formatBeijingDateTime } from '../utils/datetime'

export function useReviewPageState() {
  const authStore = useAuthStore()
  const wishStore = useWishStore()

  const reviewTab = ref<'journals' | 'live' | 'snapshots'>('journals')
  const topCoinWish = computed(() => wishStore.dragonBallWishes[0] ?? null)
  const topCoinWishSummary = computed(() => {
    return topCoinWish.value ? wishStore.getWishCoinSummary(topCoinWish.value) : null
  })
  const completedWishJournals = computed(() => {
    return [...wishStore.wishes]
      .filter((wish) => wish.status === 'done')
      .sort((left, right) => new Date(right.completedAt ?? right.updatedAt).getTime() - new Date(left.completedAt ?? left.updatedAt).getTime())
  })
  const currentMonthKey = computed(() => getBeijingMonthKey())
  const currentMonthLabel = computed(() => formatMonthLabel(currentMonthKey.value))
  const liveMonthlyThreads = computed(() => {
    return [...wishStore.wishThreads]
      .filter((thread) => getBeijingMonthKey(thread.createdAt) === currentMonthKey.value)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
  })
  const monthlySnapshots = computed(() => {
    return [...wishStore.monthlyJournalSnapshots].sort((left, right) => right.monthKey.localeCompare(left.monthKey))
  })
  const reviewHighlights = computed(() => {
    return [
      {
        accent: 'accent-sunrise',
        eyebrow: '卷首摘要',
        featured: true,
        key: 'total',
        label: '已经写下',
        note: `${wishStore.stats.active} 个还在继续往前走`,
        value: `${wishStore.stats.total}`,
      },
      {
        accent: 'accent-coral',
        eyebrow: '这一周',
        featured: false,
        key: 'coins',
        label: '已经投出',
        note: `手里还留着 ${wishStore.stats.currentCycleCoinsRemaining} 枚愿望币`,
        value: `${wishStore.stats.currentCycleCoinsUsed}`,
      },
      {
        accent: 'accent-aurora',
        eyebrow: '七龙珠',
        featured: false,
        key: 'dragon',
        label: '已经集齐',
        note: topCoinWish.value && topCoinWishSummary.value
          ? `${topCoinWish.value.title} 现在有 ${topCoinWishSummary.value.total} 枚愿望币`
          : `先集到 ${DRAGON_BALL_COIN_TARGET} 枚愿望币再召唤神龙`,
        value: `${wishStore.stats.dragonBallReady}`,
      },
      {
        accent: 'accent-golden',
        eyebrow: '照片记忆',
        featured: false,
        key: 'images',
        label: '已经存下',
        note: wishStore.stats.totalImages ? '这段时间已经开始有能翻出来看的画面了' : '还在等第一张照片把这一页翻开',
        value: formatStorageBytes(wishStore.stats.totalImageBytes),
      },
    ]
  })
  const reviewHeroTitle = computed(() => {
    if (!wishStore.stats.total) {
      return '先替未来翻开第一期月刊'
    }

    if (!wishStore.stats.done) {
      return '把正在发生的靠近翻成这一期月刊'
    }

    return '把一起走过的日子翻成一册册月刊'
  })
  const reviewHeroLead = computed(() => {
    if (!wishStore.stats.total) {
      return '这里以后不会只是统计，它会慢慢收住你们写下、推进、回应和完成的全部痕迹。'
    }

    return '回顾页不负责催促，它只把已经发生过的靠近、回应和完成整理成一册册可以慢慢翻看的记录。'
  })
  const reviewHeroAside = computed(() => {
    if (topCoinWish.value && topCoinWishSummary.value && !topCoinWishSummary.value.isDragonBallReady) {
      return `这一期里，${topCoinWish.value.title} 暂时最被偏爱，还差 ${topCoinWishSummary.value.remainingToDragonBall} 枚愿望币就能把七龙珠集齐。`
    }

    if (wishStore.stats.done) {
      return `已经完成的 ${wishStore.stats.done} 个愿望会先在这里安静排好，提醒你们这段时间并没有白白过去。`
    }

    return '现在先翻看也好，回清单继续推进也好，这一页都会慢慢替你们把过程接住。'
  })
  const reviewTabOptions = computed(() => {
    return [
      {
        count: `${completedWishJournals.value.length} 本`,
        eyebrow: '已经定稿',
        label: '完成愿望手账',
        note: '已经走完整条路的愿望，会在这里留下更完整的册页。',
        value: 'journals' as const,
      },
      {
        count: `${liveMonthlyThreads.value.length} 条`,
        eyebrow: '这一期正在写',
        label: '本月实时回顾',
        note: `${currentMonthLabel.value} 里正在发生的推进、留言和回应，会先留在这一栏。`,
        value: 'live' as const,
      },
      {
        count: `${monthlySnapshots.value.length} 本`,
        eyebrow: '已经封存',
        label: '冻结月刊',
        note: '月份过去之后，它会在这里变成不再变化的固定月刊。',
        value: 'snapshots' as const,
      },
    ]
  })
  const activeReviewTabOption = computed(() => {
    return reviewTabOptions.value.find((tab) => tab.value === reviewTab.value) ?? reviewTabOptions.value[0]
  })
  const monthlyNote = computed(() => {
    if (!wishStore.stats.total) {
      return '这一册还没有写进愿望。先从一个很小的开始，让未来先有一个可以靠近的方向。'
    }

    if (!wishStore.stats.totalWishCoins) {
      return `这段时间，你们已经写下了 ${wishStore.stats.total} 个愿望。本周的 ${WISH_COIN_BUDGET_PER_CYCLE} 枚愿望币还在等着落下，先挑一个最想先靠近的试试看。`
    }

    if (topCoinWish.value && topCoinWishSummary.value && !topCoinWishSummary.value.isDragonBallReady) {
      return `这段时间，${topCoinWish.value.title} 已经收到 ${topCoinWishSummary.value.total} 枚愿望币，还差 ${topCoinWishSummary.value.remainingToDragonBall} 枚就能集齐七龙珠。`
    }

    if (wishStore.stats.dragonBallReady) {
      return `这段时间，已经有 ${wishStore.stats.dragonBallReady} 个愿望集齐了七龙珠。愿望币还可以继续往上投，谁最想先实现，现在会变得更清楚。`
    }

    if (!wishStore.stats.done) {
      return `这段时间，你们已经写下了 ${wishStore.stats.total} 个愿望。虽然还没有哪一条正式完成，但方向已经在那里，先挑一个最容易开始的，在这个周末做一点点就很好。`
    }

    return `这段时间，你们已经把 ${wishStore.stats.done} 个愿望收进回忆里，还有 ${wishStore.stats.active} 个愿望正在路上。慢慢来，重要的事并没有被日常淹没。`
  })
  const reviewMembers = computed(() => {
    return authStore.members.slice(0, 2).map((member, index) => ({
      memberId: member.id,
      memberName: member.displayName,
      roleLabel: authStore.currentMember?.id === member.id ? '你这边' : '对方这边',
      toneClass: index % 2 === 0 ? 'is-rose' : 'is-sage',
    }))
  })
  const reviewMemberToneMap = computed(() => {
    return new Map(reviewMembers.value.map((member) => [member.memberId, member]))
  })
  const reviewMemberSummaries = computed(() => {
    return reviewMembers.value.map((member) => {
      const completedCount = completedWishJournals.value.filter((wish) => wish.ownerId === member.memberId).length
      const liveCount = liveMonthlyThreads.value.filter((thread) => thread.actorId === member.memberId).length
      const snapshotCount = monthlySnapshots.value.reduce((count, snapshot) => {
        return count + snapshot.narrativeBlocks.filter((block) => typeof block.actorId === 'string' && block.actorId === member.memberId).length
      }, 0)
      const latestLiveThread = liveMonthlyThreads.value.find((thread) => thread.actorId === member.memberId) ?? null

      let countLabel = ''
      let summaryText = ''

      if (reviewTab.value === 'journals') {
        countLabel = `${completedCount} 条完成愿望`
        summaryText = completedCount
          ? `已经有 ${completedCount} 条愿望走完整条路。`
          : '这一栏还在等第一条完成愿望。'
      } else if (reviewTab.value === 'live') {
        countLabel = `${liveCount} 条本月记录`
        summaryText = liveCount
          ? `这期已经留下 ${liveCount} 条近况。`
          : '这期还没有落下新的近况。'
      } else {
        countLabel = `${snapshotCount} 条封存片段`
        summaryText = snapshotCount
          ? `已经有 ${snapshotCount} 条片段被收进月刊。`
          : '这边还没有被封进月刊的片段。'
      }

      return {
        ...member,
        countLabel,
        latestText: latestLiveThread
          ? `${formatDateTimeLabel(latestLiveThread.createdAt)} · ${getThreadEventLabel(latestLiveThread.eventKind)}`
          : '本月还没有新的动作',
        summaryText,
      }
    })
  })

  function getMemberName(memberId: string) {
    return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
  }

  function getMemberToneClass(memberId: string | null) {
    if (!memberId) {
      return 'is-shared'
    }

    return reviewMemberToneMap.value.get(memberId)?.toneClass ?? 'is-shared'
  }

  function getThreadActorName(thread: WishThreadEntry) {
    return thread.actorId ? getMemberName(thread.actorId) : '系统'
  }

  function getThreadEventLabel(eventKind: WishThreadEntry['eventKind']) {
    if (eventKind === 'comment') {
      return '留言'
    }

    if (eventKind === 'wish_published') {
      return '写下愿望'
    }

    if (eventKind === 'wish_step_completed') {
      return '步骤完成'
    }

    if (eventKind === 'wish_coin_cast') {
      return '愿望币'
    }

    if (eventKind === 'dragon_ball_reached') {
      return '七龙珠'
    }

    if (eventKind === 'wish_completed') {
      return '愿望完成'
    }

    if (eventKind === 'premium_redeem') {
      return '兑换奖励'
    }

    if (eventKind === 'weekly_welfare_issued') {
      return '每周发币'
    }

    return '领取奖励'
  }

  function getWishTitle(thread: WishThreadEntry) {
    if (!thread.wishId) {
      return '空间记录'
    }

    return wishStore.findById(thread.wishId)?.title ?? '已经归档的愿望'
  }

  function getWishScopeLabel(scope: string) {
    return scope === 'shared' ? '我们一起' : '只属于我'
  }

  function getWishJournalPreview(wishId: string) {
    return wishStore.getWishThreadEntries(wishId).slice(-3).reverse()
  }

  function getSnapshotMetric(snapshot: MonthlyJournalSnapshotRecord, metricKey: string) {
    const value = snapshot.metricsSnapshot[metricKey]

    if (typeof value === 'number') {
      return value
    }

    const normalizedValue = Number(value ?? 0)
    return Number.isFinite(normalizedValue) ? normalizedValue : 0
  }

  function getSnapshotPreviewBlocks(snapshot: MonthlyJournalSnapshotRecord) {
    return snapshot.narrativeBlocks.slice(0, 3)
  }

  function getSnapshotBlockKey(snapshotId: string, block: Record<string, unknown>, index: number) {
    return typeof block.threadId === 'string' ? `${snapshotId}-${block.threadId}` : `${snapshotId}-${index}`
  }

  function getSnapshotBlockLabel(block: Record<string, unknown>) {
    return typeof block.eventKind === 'string' ? getThreadEventLabel(block.eventKind as WishThreadEntry['eventKind']) : '记录'
  }

  function getSnapshotBlockActor(block: Record<string, unknown>) {
    return typeof block.actorId === 'string' ? getMemberName(block.actorId) : '系统'
  }

  function getSnapshotBlockActorId(block: Record<string, unknown>) {
    return typeof block.actorId === 'string' ? block.actorId : null
  }

  function getSnapshotBlockMessage(block: Record<string, unknown>) {
    return typeof block.messageText === 'string' ? block.messageText : '这页月刊里保存了一条固定记录。'
  }

  function formatDateLabel(dateValue: string) {
    return formatBeijingDate(dateValue)
  }

  function formatDateTimeLabel(dateValue: string) {
    return formatBeijingDateTime(dateValue)
  }

  return {
    activeReviewTabOption,
    completedWishJournals,
    currentMonthLabel,
    formatDateLabel,
    formatDateTimeLabel,
    formatMonthLabel,
    getMemberName,
    getMemberToneClass,
    getSnapshotBlockActor,
    getSnapshotBlockActorId,
    getSnapshotBlockKey,
    getSnapshotBlockLabel,
    getSnapshotBlockMessage,
    getSnapshotMetric,
    getThreadActorName,
    getThreadEventLabel,
    getWishJournalPreview,
    getWishScopeLabel,
    getWishTitle,
    liveMonthlyThreads,
    monthlyNote,
    monthlySnapshots,
    reviewHeroAside,
    reviewHeroLead,
    reviewHeroTitle,
    reviewMemberSummaries,
    reviewHighlights,
    reviewTab,
    reviewTabOptions,
    getSnapshotPreviewBlocks,
  }
}

function formatStorageBytes(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
  }

  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`
  }

  return `${sizeBytes} B`
}

function getBeijingMonthKey(dateValue: string | Date = new Date()) {
  const timestamp = dateValue instanceof Date ? dateValue.getTime() : new Date(dateValue).getTime()
  const shiftedDate = new Date((Number.isNaN(timestamp) ? Date.now() : timestamp) + 8 * 60 * 60 * 1000)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')

  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string) {
  const [year = '', month = ''] = monthKey.split('-')
  return `${year} 年 ${month} 月`
}