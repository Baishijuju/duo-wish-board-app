<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWishStore, type RewardClaimKind, type WishRecord, type WishThreadEntry } from '../stores/wishes'

const authStore = useAuthStore()
const wishStore = useWishStore()

const BEIJING_TIME_OFFSET_MS = 8 * 60 * 60 * 1000

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

type ReviewMetric = 'messages' | 'progress' | 'coins' | 'claims' | 'completed'
type ReviewScope = 'all' | 'me' | 'partner'
type ReviewRange = 'week' | 'month' | 'year'
type ReviewEventKind = 'message' | 'step' | 'count_progress' | 'wish_complete' | 'coin_income' | 'coin_spending' | 'image'

type SwitchOption<T extends string> = {
  value: T
  label: string
  note: string
}

type ReviewEvent = {
  id: string
  kind: ReviewEventKind
  createdAt: string
  dateKey: string
  memberId: string
  memberName: string
  wishId: string | null
  wishTitle: string
  title: string
  detail: string
  messageText: string
  activityScore: number
  messageScore: number
  progressScore: number
  coinScore: number
  coinDelta: number
}

type HeatCell = {
  dateKey: string
  day: number
  dayLabel: string
  weekdayLabel: string
  isToday: boolean
  isBlank: boolean
  score: number
  level: number
  messages: number
  progress: number
  income: number
  spending: number
  events: ReviewEvent[]
}

type HeatGroup = {
  id: string
  label: string
  cells: HeatCell[]
}

type MessageEntry = {
  id: string
  authorName: string
  createdAt: string
  dateKey: string
  text: string
  timeLabel: string
  wishTitle: string
}

type ProgressRow = {
  id: string
  category: string
  commentCount: number
  doneSteps: number
  label: string
  numericProgressAmount: number
  percent: number
  progressAmount: number
  title: string
}

type ProgressCategoryRow = {
  category: string
  commentCount: number
  percent: number
  progressAmount: number
  touchedCount: number
  wishRows: ProgressRow[]
}

type ClaimStatRow = {
  claimCount: number
  key: string
  label: string
  latestAt: string
  spending: number
}

type StarCoinWaterfallKind = Extract<RewardClaimKind, 'count_star_coin' | 'step_star_coin' | 'wish_completion_bonus' | 'reward_deposit'>

type StarCoinWaterfallStep = {
  amount: number
  bottom: string
  end: number
  height: string
  isEndpoint: boolean
  isLast: boolean
  key: string
  label: string
  markerBottom: string
  signedAmount: number
  start: number
  tone: 'balance' | 'income' | 'spending' | 'empty'
}

type StarCoinWaterfallChart = {
  steps: StarCoinWaterfallStep[]
}

type StarCoinVisibleLedger = {
  endBalance: number
  income: number
  net: number
  sourceTotals: Map<StarCoinWaterfallKind, number>
  spending: number
  startBalance: number
}

const activeMetric = ref<ReviewMetric>('progress')
const activeScope = ref<ReviewScope>('all')
const activeRange = ref<ReviewRange>('month')
const anchorDateKey = ref(getBeijingDateKey())
const bubbleDateKey = ref<string | null>(null)
const isProgressListExpanded = ref(false)

const metricOptions: SwitchOption<ReviewMetric>[] = [
  { value: 'messages', label: '留言', note: '看人写下的话' },
  { value: 'progress', label: '推进', note: '看愿望往前走' },
  { value: 'coins', label: '星币', note: '看收入与兑换' },
  { value: 'claims', label: '领奖', note: '看领奖次数和花费' },
  { value: 'completed', label: '完结', note: '看已经完本的愿望' },
]

const rangeOptions: SwitchOption<ReviewRange>[] = [
  { value: 'week', label: '周', note: '一周' },
  { value: 'month', label: '月', note: '一月' },
  { value: 'year', label: '年', note: '一年' },
]

const starCoinWaterfallKinds: Array<{ kind: StarCoinWaterfallKind; label: string }> = [
  { kind: 'count_star_coin', label: '数字进度' },
  { kind: 'step_star_coin', label: '步骤星星' },
  { kind: 'wish_completion_bonus', label: '完成愿望' },
  { kind: 'reward_deposit', label: '存入奖励' },
]

const progressTouchEventKinds = new Set<ReviewEventKind>(['message', 'step', 'count_progress'])
const trueProgressEventKinds = new Set<ReviewEventKind>(['step', 'count_progress'])

function isStarCoinWaterfallKind(kind: RewardClaimKind): kind is StarCoinWaterfallKind {
  return starCoinWaterfallKinds.some((source) => source.kind === kind)
}

function isProgressTouchEvent(event: ReviewEvent) {
  return progressTouchEventKinds.has(event.kind)
}

function isTrueProgressEvent(event: ReviewEvent) {
  return trueProgressEventKinds.has(event.kind)
}

const currentMember = computed(() => authStore.currentMember)
const partnerMember = computed(() => authStore.members.find((member) => member.id !== currentMember.value.id) ?? null)
const scopeOptions = computed<SwitchOption<ReviewScope>[]>(() => [
  { value: 'all', label: '全部', note: '所有记录' },
  { value: 'me', label: currentMember.value.displayName, note: '当前成员' },
  { value: 'partner', label: partnerMember.value?.displayName ?? '对方', note: '另一位成员' },
])
const activeLedgerMemberIds = computed(() => {
  if (activeScope.value === 'me') return [currentMember.value.id]
  if (activeScope.value === 'partner') return partnerMember.value ? [partnerMember.value.id] : []
  return authStore.members.map((member) => member.id)
})
const activeLedgerMemberIdSet = computed(() => new Set(activeLedgerMemberIds.value))

const todayDateKey = computed(() => getBeijingDateKey())
const activePeriodDateKeys = computed(() => {
  const periodDateKeys = buildPeriodDateKeys(activeRange.value, anchorDateKey.value)
  const happenedDateKeys = periodDateKeys.filter((dateKey) => dateKey <= todayDateKey.value)
  return happenedDateKeys.length ? happenedDateKeys : [todayDateKey.value]
})
const activePeriodDateSet = computed(() => new Set(activePeriodDateKeys.value))
const periodStartDateKey = computed(() => activePeriodDateKeys.value[0] ?? anchorDateKey.value)
const periodEndDateKey = computed(() => activePeriodDateKeys.value.at(-1) ?? anchorDateKey.value)
const activePeriodLabel = computed(() => getPeriodLabel(activeRange.value, anchorDateKey.value))
const currentMonthKey = computed(() => getBeijingMonthKey(anchorDateKey.value))
const currentYear = computed(() => parseDateKey(anchorDateKey.value).year)
const periodEvents = computed(() => reviewEvents.value.filter((event) => activePeriodDateSet.value.has(event.dateKey) && matchesMemberScope(event)))
const metricPeriodEvents = computed(() => {
  return periodEvents.value.filter((event) => getEventScore(event, activeMetric.value) > 0)
})
const currentPeriodRewardClaims = computed(() => wishStore.rewardClaims.filter((claim) => {
  return activePeriodDateSet.value.has(getBeijingDateKey(claim.createdAt)) && activeLedgerMemberIdSet.value.has(claim.ownerId)
}))
const currentPeriodComments = computed<MessageEntry[]>(() => {
  return wishStore.wishes
    .flatMap((wish) => wish.comments
      .filter((comment) => activePeriodDateSet.value.has(getBeijingDateKey(comment.createdAt)) && comment.message.trim())
      .map((comment) => ({
        id: comment.id,
        authorName: getMemberName(comment.authorId),
        createdAt: comment.createdAt,
        dateKey: getBeijingDateKey(comment.createdAt),
        text: comment.message.trim(),
        timeLabel: formatDateTimeLabel(comment.createdAt),
        wishTitle: wish.title,
      })))
    .filter((entry) => {
      if (activeScope.value === 'me') return entry.authorName === currentMember.value.displayName
      if (activeScope.value === 'partner') return entry.authorName === (partnerMember.value?.displayName ?? '')
      return true
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
})
const periodTouchedWishes = computed(() => {
  const touchedWishIds = new Set<string>()

  periodEvents.value.forEach((event) => {
    if (event.wishId && isProgressTouchEvent(event)) touchedWishIds.add(event.wishId)
  })

  return [...touchedWishIds]
    .map((wishId) => wishStore.findById(wishId))
    .filter((wish): wish is WishRecord => !!wish)
})
const periodProgressedWishes = computed(() => {
  const progressedWishIds = new Set<string>()

  periodEvents.value.forEach((event) => {
    if (event.wishId && isTrueProgressEvent(event)) progressedWishIds.add(event.wishId)
  })

  return [...progressedWishIds]
    .map((wishId) => wishStore.findById(wishId))
    .filter((wish): wish is WishRecord => !!wish)
})
const periodCompletedSteps = computed(() => {
  return wishStore.wishes.flatMap((wish) => wish.steps
    .filter((step) => step.isDone && activePeriodDateSet.value.has(getBeijingDateKey(step.updatedAt)))
    .map((step) => ({ ...step, wishId: wish.id, wishTitle: wish.title })))
})
const starCoinLedger = computed(() => buildVisibleStarCoinLedger(periodStartDateKey.value, periodEndDateKey.value, activeLedgerMemberIds.value))
const periodStarCoinIncome = computed(() => starCoinLedger.value.income)
const periodStarCoinSpending = computed(() => starCoinLedger.value.spending)
const periodStarCoinNet = computed(() => starCoinLedger.value.net)
const periodStarCoinEndBalance = computed(() => starCoinLedger.value.endBalance)
const periodStarCoinStartBalance = computed(() => starCoinLedger.value.startBalance)
const reviewEvents = computed<ReviewEvent[]>(() => {
  const events: ReviewEvent[] = []

  wishStore.wishes.forEach((wish) => {
    wish.comments.forEach((comment) => {
      const messageText = comment.message.trim()
      if (messageText) {
        events.push({
          id: `message-${wish.id}-${comment.id}`,
          kind: 'message',
          createdAt: comment.createdAt,
          dateKey: getBeijingDateKey(comment.createdAt),
          memberId: comment.authorId,
          memberName: getMemberName(comment.authorId),
          wishId: wish.id,
          wishTitle: wish.title,
          title: '写了一条留言',
          detail: wish.title,
          messageText,
          activityScore: 3,
          messageScore: 1,
          progressScore: 0,
          coinScore: 0,
          coinDelta: 0,
        })
      }

      comment.images.forEach((image) => {
        events.push(createImageEvent(`comment-image-${wish.id}-${comment.id}-${image.id}`, image.createdAt, image.createdBy, wish, '补了一张照片'))
      })
    })

    wish.steps.forEach((step) => {
      if (!step.isDone) return

      events.push({
        id: `step-${wish.id}-${step.id}`,
        kind: 'step',
        createdAt: step.updatedAt,
        dateKey: getBeijingDateKey(step.updatedAt),
        memberId: wish.ownerId,
        memberName: getMemberName(wish.ownerId),
        wishId: wish.id,
        wishTitle: wish.title,
        title: '完成了一个步骤',
        detail: step.title,
        messageText: '',
        activityScore: 2,
        messageScore: 0,
        progressScore: 1,
        coinScore: 0,
        coinDelta: 0,
      })
    })

    if (wish.progressMode === 'count' && wish.progressCurrent > 0) {
      const progressUnits = Math.min(Math.max(1, wish.progressCurrent), Math.max(1, wish.progressTarget))

      events.push({
        id: `count-progress-${wish.id}`,
        kind: 'count_progress',
        createdAt: wish.updatedAt,
        dateKey: getBeijingDateKey(wish.updatedAt),
        memberId: wish.ownerId,
        memberName: getMemberName(wish.ownerId),
        wishId: wish.id,
        wishTitle: wish.title,
        title: '更新了数字进度',
        detail: `${formatNumber(wish.progressCurrent)} / ${formatNumber(wish.progressTarget)} ${wish.progressUnit}`,
        messageText: '',
        activityScore: 2,
        messageScore: 0,
        progressScore: Math.min(8, progressUnits),
        coinScore: 0,
        coinDelta: 0,
      })
    }

    if (wish.completedAt) {
      events.push({
        id: `wish-complete-${wish.id}`,
        kind: 'wish_complete',
        createdAt: wish.completedAt,
        dateKey: getBeijingDateKey(wish.completedAt),
        memberId: wish.ownerId,
        memberName: getMemberName(wish.ownerId),
        wishId: wish.id,
        wishTitle: wish.title,
        title: '完成了愿望',
        detail: wish.title,
        messageText: '',
        activityScore: 6,
        messageScore: 0,
        progressScore: 4,
        coinScore: 0,
        coinDelta: 0,
      })
    }

    wish.images.forEach((image) => {
      events.push(createImageEvent(`wish-image-${wish.id}-${image.id}`, image.createdAt, image.createdBy, wish, '给愿望加了照片'))
    })
  })

  wishStore.rewardClaims.forEach((claim) => {
    const amount = Math.abs(claim.starCoinDelta)
    if (!amount) return

    events.push({
      id: `coin-${claim.id}`,
      kind: claim.starCoinDelta >= 0 ? 'coin_income' : 'coin_spending',
      createdAt: claim.createdAt,
      dateKey: getBeijingDateKey(claim.createdAt),
      memberId: claim.ownerId,
      memberName: getMemberName(claim.ownerId),
      wishId: claim.sourceWishId,
      wishTitle: getWishTitle(claim.sourceWishId),
      title: claim.starCoinDelta >= 0 ? '获得星币' : '使用星币',
      detail: `${getRewardClaimKindLabel(claim.claimKind)} ${claim.starCoinDelta >= 0 ? '+' : '-'}${formatNumber(amount)}`,
      messageText: '',
      activityScore: Math.min(5, Math.ceil(amount / 2)),
      messageScore: 0,
      progressScore: 0,
      coinScore: amount,
      coinDelta: claim.starCoinDelta,
    })
  })

  return events.sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
})
const activeHeatCells = computed<HeatCell[]>(() => {
  const eventsByDate = new Map<string, ReviewEvent[]>()
  metricPeriodEvents.value.forEach((event) => {
    const bucket = eventsByDate.get(event.dateKey) ?? []
    bucket.push(event)
    eventsByDate.set(event.dateKey, bucket)
  })

  const cells = activePeriodDateKeys.value.map((dateKey) => {
    const events = eventsByDate.get(dateKey) ?? []
    const parsedDate = parseDateKey(dateKey)
    const score = events.reduce((total, event) => total + getEventScore(event, activeMetric.value), 0)

    return {
      dateKey,
      day: parsedDate.day,
      dayLabel: `${parsedDate.day}`,
      weekdayLabel: getWeekdayLabel(dateKey),
      isToday: dateKey === todayDateKey.value,
      isBlank: false,
      score,
      level: 0,
      messages: events.reduce((total, event) => total + event.messageScore, 0),
      progress: events.reduce((total, event) => total + event.progressScore, 0),
      income: events.reduce((total, event) => total + Math.max(0, event.coinDelta), 0),
      spending: events.reduce((total, event) => total + Math.abs(Math.min(0, event.coinDelta)), 0),
      events,
    }
  })
  const maxScore = Math.max(1, ...cells.map((cell) => cell.score))

  return cells.map((cell) => ({ ...cell, level: getHeatLevel(cell.score, maxScore) }))
})
const displayHeatGroups = computed<HeatGroup[]>(() => {
  if (activeRange.value === 'week') {
    return [{ id: 'week', label: activePeriodLabel.value, cells: activeHeatCells.value }]
  }

  if (activeRange.value === 'month') {
    return [{ id: 'month', label: activePeriodLabel.value, cells: withLeadingWeekdayBlanks(activeHeatCells.value) }]
  }

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const monthKey = `${currentYear.value}-${`${month}`.padStart(2, '0')}`
    const monthCells = activeHeatCells.value.filter((cell) => cell.dateKey.startsWith(monthKey))

    return {
      id: monthKey,
      label: `${month}月`,
      cells: withLeadingWeekdayBlanks(monthCells),
    }
  })
})
const activeDayCount = computed(() => activeHeatCells.value.filter((cell) => cell.score > 0).length)
const peakCell = computed(() => activeHeatCells.value.reduce<HeatCell | null>((peak, cell) => !peak || cell.score > peak.score ? cell : peak, null))
const activeMetricOption = computed(() => metricOptions.find((option) => option.value === activeMetric.value) ?? metricOptions[0])
const activeScopeOption = computed(() => scopeOptions.value.find((option) => option.value === activeScope.value) ?? scopeOptions.value[0])
const activeRangeOption = computed(() => rangeOptions.find((option) => option.value === activeRange.value) ?? rangeOptions[1])
const metricSwitchSliderStyle = computed(() => getSlidingTabStyle(metricOptions.findIndex((option) => option.value === activeMetric.value), metricOptions.length))
const rangeSwitchSliderStyle = computed(() => getSlidingTabStyle(rangeOptions.findIndex((option) => option.value === activeRange.value), rangeOptions.length))
const scopeSwitchSliderStyle = computed(() => getSlidingTabStyle(scopeOptions.value.findIndex((option) => option.value === activeScope.value), scopeOptions.value.length))
const heatSummary = computed(() => {
  if (!peakCell.value || peakCell.value.score <= 0) return `${activePeriodLabel.value}还没有明显亮起的日子。`

  return `${formatDateLabel(peakCell.value.dateKey)}最亮，${getMetricSummary(peakCell.value)}。`
})
const periodSummaryCards = computed(() => [
  {
    label: '星币流动',
    value: `${periodStarCoinNet.value >= 0 ? '+' : ''}${formatNumber(periodStarCoinNet.value)}`,
    note: `收入 ${formatNumber(periodStarCoinIncome.value)} / 花出 ${formatNumber(periodStarCoinSpending.value)}`,
  },
  {
    label: '被摸过的愿望',
    value: `${periodTouchedWishes.value.length} 个`,
    note: `${periodCompletedSteps.value.length} 步 · ${periodProgressedWishes.value.length} 个真实推进`,
  },
  {
    label: '峰值日',
    value: peakCell.value?.score ? formatDateLabel(peakCell.value.dateKey) : '暂无',
    note: peakCell.value?.score ? getMetricSummary(peakCell.value) : '这段时间还很安静',
  },
])
const starCoinWaterfallChart = computed<StarCoinWaterfallChart>(() => {
  let runningTotal = periodStarCoinStartBalance.value
  const changeSteps = starCoinWaterfallKinds.map((source) => {
    const signedAmount = starCoinLedger.value.sourceTotals.get(source.kind) ?? 0
    const start = runningTotal
    const end = runningTotal + signedAmount
    runningTotal = end

    return { key: source.kind, label: source.label, amount: Math.abs(signedAmount), end, signedAmount, start, tone: signedAmount > 0 ? 'income' as const : signedAmount < 0 ? 'spending' as const : 'empty' as const }
  })

  const balancePoints = [periodStarCoinStartBalance.value, ...changeSteps.map((step) => step.end), periodStarCoinEndBalance.value]
  const positionedSteps = [
    { key: 'period-start', label: '期初', amount: Math.abs(periodStarCoinStartBalance.value), end: periodStarCoinStartBalance.value, signedAmount: periodStarCoinStartBalance.value, start: periodStarCoinStartBalance.value, tone: 'balance' as const },
    ...changeSteps,
    { key: 'period-end', label: '期末', amount: Math.abs(periodStarCoinEndBalance.value), end: periodStarCoinEndBalance.value, signedAmount: periodStarCoinEndBalance.value, start: periodStarCoinEndBalance.value, tone: 'balance' as const },
  ]

  const minValue = Math.min(0, ...balancePoints)
  const maxValue = Math.max(0, ...balancePoints)
  const valueSpan = Math.max(1, maxValue - minValue)
  const valueToPercent = (value: number) => formatWaterfallPercent((value - minValue) / valueSpan)

  const steps = positionedSteps.map((step, index) => {
    const isEndpoint = step.tone === 'balance'
    const floor = Math.min(step.start, step.end)
    const heightRatio = step.amount / valueSpan
    const bottomRatio = (floor - minValue) / valueSpan

    return {
      amount: step.amount,
      bottom: formatWaterfallPercent(bottomRatio),
      end: step.end,
      height: isEndpoint ? '0%' : formatWaterfallPercent(heightRatio),
      isEndpoint,
      isLast: index === positionedSteps.length - 1,
      key: step.key,
      label: step.label,
      markerBottom: valueToPercent(step.end),
      signedAmount: step.signedAmount,
      start: step.start,
      tone: step.tone,
    }
  })

  return { steps }
})
const starCoinWaterfallSteps = computed(() => starCoinWaterfallChart.value.steps)
const hasStarCoinWaterfall = computed(() => starCoinWaterfallSteps.value.some((step) => step.amount > 0) || currentPeriodRewardClaims.value.length > 0)
const allProgressRows = computed<ProgressRow[]>(() => {
  return periodTouchedWishes.value
    .map((wish) => {
      const snapshot = wishStore.getWishProgressSnapshot(wish)
      const doneSteps = wish.steps.filter((step) => step.isDone && activePeriodDateSet.value.has(getBeijingDateKey(step.updatedAt))).length
      const commentCount = wish.comments.filter((comment) => activePeriodDateSet.value.has(getBeijingDateKey(comment.createdAt)) && comment.message.trim()).length
      const numericProgressAmount = wish.progressMode === 'count' && activePeriodDateSet.value.has(getBeijingDateKey(wish.updatedAt))
        ? Math.min(Math.max(0, wish.progressCurrent), Math.max(1, wish.progressTarget))
        : 0
      const progressAmount = doneSteps + numericProgressAmount

      return {
        id: wish.id,
        category: wish.category || '未分类',
        commentCount,
        doneSteps,
        label: snapshot.label,
        numericProgressAmount,
        percent: snapshot.percent,
        progressAmount,
        title: wish.title,
      }
    })
    .sort((left, right) => right.progressAmount - left.progressAmount || right.doneSteps - left.doneSteps || right.numericProgressAmount - left.numericProgressAmount || right.commentCount - left.commentCount)
})
const progressCategoryRows = computed<ProgressCategoryRow[]>(() => {
  const categoryMap = new Map<string, Omit<ProgressCategoryRow, 'percent'>>()
  const totalProgressAmount = allProgressRows.value.reduce((total, row) => total + row.progressAmount, 0)

  for (const row of allProgressRows.value) {
    const current = categoryMap.get(row.category) ?? {
      category: row.category,
      commentCount: 0,
      progressAmount: 0,
      touchedCount: 0,
      wishRows: [],
    }

    current.commentCount += row.commentCount
    current.progressAmount += row.progressAmount
    current.touchedCount += 1
    current.wishRows.push(row)
    categoryMap.set(row.category, current)
  }

  return Array.from(categoryMap.values())
    .map((row) => ({
      ...row,
      percent: totalProgressAmount ? Math.round((row.progressAmount / totalProgressAmount) * 100) : Math.round((row.touchedCount / Math.max(1, allProgressRows.value.length)) * 100),
    }))
    .sort((left, right) => right.progressAmount - left.progressAmount || right.touchedCount - left.touchedCount || right.commentCount - left.commentCount)
})
const hottestProgressCategory = computed(() => progressCategoryRows.value[0] ?? null)
const quietProgressCategory = computed(() => progressCategoryRows.value.length > 1 ? progressCategoryRows.value[progressCategoryRows.value.length - 1] : null)
const categoryProgressShare = computed(() => hottestProgressCategory.value?.percent ?? 0)
const completedWishJournals = computed(() => {
  return [...wishStore.wishes]
    .filter((wish) => {
      if (wish.status !== 'done') return false
      if (!activeLedgerMemberIdSet.value.has(wish.ownerId)) return false
      return activePeriodDateSet.value.has(getBeijingDateKey(wish.completedAt ?? wish.updatedAt))
    })
    .sort((left, right) => new Date(right.completedAt ?? right.updatedAt).getTime() - new Date(left.completedAt ?? left.updatedAt).getTime())
})
const claimStatsRows = computed<ClaimStatRow[]>(() => {
  const claimKinds = new Set<RewardClaimKind>(['count_reward', 'step_reward', 'wish_reward', 'premium_redeem'])
  const groupedRows = new Map<string, ClaimStatRow>()

  for (const claim of currentPeriodRewardClaims.value) {
    const claimKey = claim.rewardItemId ? `item:${claim.rewardItemId}` : `fallback:${claim.claimKind}:${claim.titleSnapshot}`
    const fallbackLabel = claim.titleSnapshot.trim() || getRewardClaimKindLabel(claim.claimKind)
    const existingRow = groupedRows.get(claimKey) ?? {
      claimCount: 0,
      key: claimKey,
      label: fallbackLabel,
      latestAt: claim.createdAt,
      spending: 0,
    }

    if (claimKinds.has(claim.claimKind)) {
      existingRow.claimCount += 1
    }

    if (claim.claimKind === 'reward_deposit') {
      existingRow.spending += Math.abs(Math.min(0, claim.starCoinDelta))
    }

    if (new Date(claim.createdAt).getTime() > new Date(existingRow.latestAt).getTime()) {
      existingRow.latestAt = claim.createdAt
    }

    groupedRows.set(claimKey, existingRow)
  }

  return [...groupedRows.values()]
    .filter((row) => row.claimCount > 0 || row.spending > 0)
    .sort((left, right) => right.claimCount - left.claimCount || right.spending - left.spending || new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime() || left.label.localeCompare(right.label, 'zh-CN'))
})
const claimStatsMaxSpending = computed(() => Math.max(1, ...claimStatsRows.value.map((row) => row.spending)))

function formatWaterfallPercent(ratio: number) {
  return `${Number((ratio * 100).toFixed(4))}%`
}

function getSlidingTabStyle(activeIndex: number, optionCount: number) {
  const count = Math.max(1, optionCount)
  const index = Math.min(Math.max(0, activeIndex), count - 1)

  return {
    transform: `translateX(${index * 100}%)`,
    width: `calc((100% - 6px) / ${count})`,
  }
}

function buildVisibleStarCoinLedger(startDateKey: string, endDateKey: string, memberIds: string[]): StarCoinVisibleLedger {
  const memberIdSet = new Set(memberIds)
  const sourceTotals = new Map<StarCoinWaterfallKind, number>(starCoinWaterfallKinds.map((source) => [source.kind, 0]))
  const balances = new Map(memberIds.map((memberId) => [memberId, 0]))

  const claims = wishStore.rewardClaims
    .filter((claim) => memberIdSet.has(claim.ownerId) && getBeijingDateKey(claim.createdAt) <= endDateKey)
    .slice()
    .sort((left, right) => {
      const timeDiff = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
      return timeDiff || left.id.localeCompare(right.id)
    })

  let startBalance: number | null = null

  claims.forEach((claim) => {
    const dateKey = getBeijingDateKey(claim.createdAt)
    if (startBalance === null && dateKey >= startDateKey) {
      startBalance = getVisibleBalanceTotal(balances, memberIds)
    }

    const beforeBalance = balances.get(claim.ownerId) ?? 0
    const afterBalance = Math.max(0, beforeBalance + claim.starCoinDelta)
    balances.set(claim.ownerId, afterBalance)

    if (dateKey < startDateKey || !isStarCoinWaterfallKind(claim.claimKind)) return

    const visibleDelta = afterBalance - beforeBalance
    sourceTotals.set(claim.claimKind, (sourceTotals.get(claim.claimKind) ?? 0) + visibleDelta)
  })

  const finalStartBalance = startBalance ?? getVisibleBalanceTotal(balances, memberIds)
  const endBalance = getVisibleBalanceTotal(balances, memberIds)
  const income = [...sourceTotals.values()].reduce((total, amount) => total + Math.max(0, amount), 0)
  const spending = [...sourceTotals.values()].reduce((total, amount) => total + Math.abs(Math.min(0, amount)), 0)

  return {
    endBalance,
    income,
    net: income - spending,
    sourceTotals,
    spending,
    startBalance: finalStartBalance,
  }
}

function getVisibleBalanceTotal(balances: Map<string, number>, memberIds: string[]) {
  return memberIds.reduce((total, memberId) => total + Math.max(0, balances.get(memberId) ?? 0), 0)
}

const messageBookEntries = computed(() => activeRange.value === 'year' ? [] : currentPeriodComments.value.slice(0, 8))
const yearMessageSummary = computed(() => {
  if (activeRange.value !== 'year') return null

  const messageCountByMonth = new Map<string, number>()
  currentPeriodComments.value.forEach((entry) => {
    const monthKey = entry.dateKey.slice(0, 7)
    messageCountByMonth.set(monthKey, (messageCountByMonth.get(monthKey) ?? 0) + 1)
  })
  const topMonth = [...messageCountByMonth.entries()].sort((left, right) => right[1] - left[1])[0] ?? null

  return {
    count: currentPeriodComments.value.length,
    label: topMonth ? `${Number(topMonth[0].slice(5, 7))} 月最多，${topMonth[1]} 条` : '全年还没有留言',
  }
})

watch([activeMetric, activeScope, activeRange, anchorDateKey], () => {
  bubbleDateKey.value = null
})

function createImageEvent(id: string, createdAt: string, memberId: string, wish: WishRecord, title: string): ReviewEvent {
  return {
    id,
    kind: 'image',
    createdAt,
    dateKey: getBeijingDateKey(createdAt),
    memberId,
    memberName: getMemberName(memberId),
    wishId: wish.id,
    wishTitle: wish.title,
    title,
    detail: wish.title,
    messageText: '',
    activityScore: 2,
    messageScore: 0,
    progressScore: 0,
    coinScore: 0,
    coinDelta: 0,
  }
}

function matchesMemberScope(event: ReviewEvent) {
  if (activeScope.value === 'me') return event.memberId === currentMember.value.id
  if (activeScope.value === 'partner') return !!partnerMember.value && event.memberId === partnerMember.value.id
  return true
}

function getEventScore(event: ReviewEvent, metric: ReviewMetric) {
  if (metric === 'messages') return event.messageScore
  if (metric === 'progress') return event.progressScore
  return event.coinScore
}

function showBubble(dateKey: string) {
  bubbleDateKey.value = bubbleDateKey.value === dateKey ? null : dateKey
}

function shiftPeriod(direction: -1 | 1) {
  let nextAnchorDateKey: string

  if (activeRange.value === 'week') {
    nextAnchorDateKey = addDaysToDateKey(anchorDateKey.value, direction * 7)
  } else if (activeRange.value === 'month') {
    nextAnchorDateKey = addMonthsToDateKey(anchorDateKey.value, direction)
  } else {
    nextAnchorDateKey = addYearsToDateKey(anchorDateKey.value, direction)
  }

  anchorDateKey.value = nextAnchorDateKey > todayDateKey.value ? todayDateKey.value : nextAnchorDateKey
}

function resetPeriod() {
  anchorDateKey.value = getBeijingDateKey()
}

function getMetricSummary(cell: HeatCell) {
  if (activeMetric.value === 'messages') return `${formatNumber(cell.messages)} 条留言`
  if (activeMetric.value === 'progress') return `${formatNumber(cell.progress)} 份推进`
  return `收入 ${formatNumber(cell.income)} / 花出 ${formatNumber(cell.spending)}`
}

function getWishTitle(wishId: string | null) {
  if (!wishId) return '星币账本'
  return wishStore.findById(wishId)?.title ?? '已归档愿望'
}

function buildPeriodDateKeys(range: ReviewRange, anchorKey: string) {
  if (range === 'week') return buildWeekDays(anchorKey)
  if (range === 'year') return buildYearDays(parseDateKey(anchorKey).year)
  return buildMonthDays(anchorKey.slice(0, 7))
}

function buildWeekDays(anchorKey: string) {
  const mondayKey = addDaysToDateKey(anchorKey, -getMondayBasedWeekdayIndex(anchorKey))
  return Array.from({ length: 7 }, (_, index) => addDaysToDateKey(mondayKey, index))
}

function buildMonthDays(monthKey: string) {
  const [yearText, monthText] = monthKey.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return Array.from({ length: dayCount }, (_, index) => `${yearText}-${monthText}-${`${index + 1}`.padStart(2, '0')}`)
}

function buildYearDays(year: number) {
  return Array.from({ length: 12 }, (_, index) => buildMonthDays(`${year}-${`${index + 1}`.padStart(2, '0')}`)).flat()
}

function withLeadingWeekdayBlanks(cells: HeatCell[]) {
  const firstCell = cells[0]
  if (!firstCell) return []
  const blankCount = getMondayBasedWeekdayIndex(firstCell.dateKey)
  const blanks: HeatCell[] = Array.from({ length: blankCount }, (_, index) => ({
    dateKey: `blank-${firstCell.dateKey}-${index}`,
    day: 0,
    dayLabel: '',
    weekdayLabel: '',
    isToday: false,
    isBlank: true,
    score: 0,
    level: 0,
    messages: 0,
    progress: 0,
    income: 0,
    spending: 0,
    events: [],
  }))
  return [...blanks, ...cells]
}

function getPeriodLabel(range: ReviewRange, anchorKey: string) {
  if (range === 'week') {
    const days = buildWeekDays(anchorKey)
    return `${formatDateLabel(days[0])} - ${formatDateLabel(days[6])}`
  }
  if (range === 'year') return `${parseDateKey(anchorKey).year} 年`
  return formatMonthLabel(anchorKey.slice(0, 7))
}

function getBeijingMonthKey(dateValue: Date | number | string = new Date()) {
  const date = getBeijingDate(dateValue)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  return `${year}-${month}`
}

function getBeijingDateKey(dateValue: Date | number | string = new Date()) {
  const date = getBeijingDate(dateValue)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getBeijingDate(dateValue: Date | number | string) {
  const rawTimestamp = dateValue instanceof Date
    ? dateValue.getTime()
    : typeof dateValue === 'number'
      ? dateValue
      : new Date(dateValue).getTime()
  const timestamp = Number.isNaN(rawTimestamp) ? Date.now() : rawTimestamp
  return new Date(timestamp + BEIJING_TIME_OFFSET_MS)
}

function addDaysToDateKey(dateKey: string, offset: number) {
  const { year, month, day } = parseDateKey(dateKey)
  const date = new Date(Date.UTC(year, month - 1, day + offset))
  return toDateKey(date)
}

function addMonthsToDateKey(dateKey: string, offset: number) {
  const { year, month } = parseDateKey(dateKey)
  const date = new Date(Date.UTC(year, month - 1 + offset, 1))
  return toDateKey(date)
}

function addYearsToDateKey(dateKey: string, offset: number) {
  const { year } = parseDateKey(dateKey)
  return `${year + offset}-01-01`
}

function toDateKey(date: Date) {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [yearText, monthText, dayText] = dateKey.split('-')
  return { year: Number(yearText), month: Number(monthText), day: Number(dayText) }
}

function getMondayBasedWeekdayIndex(dateKey: string) {
  const { year, month, day } = parseDateKey(dateKey)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return (weekday + 6) % 7
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-')
  return `${year} 年 ${Number(month)} 月`
}

function formatDateLabel(dateKey: string) {
  const [, month, day] = dateKey.split('-')
  return `${Number(month)} 月 ${Number(day)} 日`
}

function formatDateTimeLabel(dateValue: string) {
  const date = getBeijingDate(dateValue)
  const month = date.getUTCMonth() + 1
  const day = date.getUTCDate()
  const hour = `${date.getUTCHours()}`.padStart(2, '0')
  const minute = `${date.getUTCMinutes()}`.padStart(2, '0')
  return `${month} 月 ${day} 日 ${hour}:${minute}`
}

function getWeekdayLabel(dateKey: string) {
  const labels = ['一', '二', '三', '四', '五', '六', '日']
  return `周${labels[getMondayBasedWeekdayIndex(dateKey)]}`
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1)
}

function formatCompletedWishDate(wish: WishRecord) {
  return formatDateLabel(getBeijingDateKey(wish.completedAt ?? wish.updatedAt))
}

function getThreadEventLabel(eventKind: WishThreadEntry['eventKind']) {
  if (eventKind === 'comment') return '留言'
  if (eventKind === 'wish_published') return '写下愿望'
  if (eventKind === 'wish_step_completed') return '步骤完成'
  if (eventKind === 'wish_completed') return '愿望完成'
  if (eventKind === 'premium_redeem') return '兑换奖励'
  if (eventKind === 'weekly_welfare_issued') return '系统记录'
  return '领取奖励'
}

function getCompletedWishPreviewRows(wishId: string) {
  return wishStore.getWishThreadEntries(wishId).slice(0, 3)
}

function getThreadPreviewText(thread: WishThreadEntry) {
  const messageText = thread.messageText.trim()
  return messageText || getThreadEventLabel(thread.eventKind)
}

function getHeatLevel(value: number, maxValue: number) {
  if (value <= 0) return 0
  return Math.max(1, Math.ceil((value / Math.max(1, maxValue)) * 5))
}

function getMemberName(memberId: string) {
  return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
}

function getRewardClaimKindLabel(kind: RewardClaimKind) {
  const labels: Record<RewardClaimKind, string> = {
    count_reward: '数字奖励',
    count_star_coin: '数字进度星币',
    premium_redeem: '兑换奖励',
    reward_deposit: '存入奖励',
    star_coin: '星币调整',
    step_reward: '步骤奖励',
    step_star_coin: '步骤星币',
    wish_completion_bonus: '完成愿望奖励',
    wish_reward: '愿望奖励',
  }
  return labels[kind]
}
</script>

<template>
  <section class="monthly-preview-page palette-sage">
    <section class="monthly-preview-hero">
      <div class="monthly-preview-kicker">月度记录 · 只读热力图</div>
      <div class="monthly-preview-hero-copy">
        <h1>{{ currentMonthKey }} 的月度记录</h1>
        <p>热力图只看强弱。切换周、月、年和成员后，下方用当前范围的统计和留言解释发生了什么。</p>
      </div>
    </section>

    <section class="monthly-switch-panel" aria-label="热力图切换器">
      <div class="monthly-switch-group">
        <span>看什么</span>
        <div class="monthly-segmented-control monthly-sliding-tabs">
          <span class="monthly-switch-slider" aria-hidden="true" :style="metricSwitchSliderStyle"></span>
          <button v-for="option in metricOptions" :key="option.value" type="button" :class="{ 'is-active': activeMetric === option.value }" @click="activeMetric = option.value">
            <strong>{{ option.label }}</strong>
          </button>
        </div>
      </div>

      <div class="monthly-switch-row">
        <div class="monthly-switch-group">
          <span>看多久</span>
          <div class="monthly-compact-control monthly-sliding-tabs">
            <span class="monthly-switch-slider" aria-hidden="true" :style="rangeSwitchSliderStyle"></span>
            <button v-for="option in rangeOptions" :key="option.value" type="button" :class="{ 'is-active': activeRange === option.value }" @click="activeRange = option.value">
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="monthly-switch-group">
          <span>看谁</span>
          <div class="monthly-compact-control monthly-sliding-tabs">
            <span class="monthly-switch-slider" aria-hidden="true" :style="scopeSwitchSliderStyle"></span>
            <button v-for="option in scopeOptions" :key="option.value" type="button" :class="{ 'is-active': activeScope === option.value }" @click="activeScope = option.value">
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="monthly-preview-panel monthly-temperature-panel">
      <div class="monthly-section-head">
        <div>
          <p>{{ activeMetricOption.label }} · {{ activeScopeOption.label }}</p>
          <h2>{{ activePeriodLabel }}</h2>
        </div>
        <div class="monthly-period-actions">
          <button type="button" @click="shiftPeriod(-1)">上一{{ activeRangeOption.label }}</button>
          <button type="button" @click="resetPeriod">回到现在</button>
          <button type="button" @click="shiftPeriod(1)">下一{{ activeRangeOption.label }}</button>
        </div>
      </div>

      <div class="monthly-weekday-row" aria-hidden="true">
        <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
      </div>

      <div :class="['monthly-thermometer-groups', `is-${activeRange}`]" :aria-label="`${activePeriodLabel}${activeMetricOption.label}热力图`">
        <article v-for="group in displayHeatGroups" :key="group.id" class="monthly-thermometer-group">
          <span v-if="activeRange === 'year'" class="monthly-month-label">{{ group.label }}</span>
          <div class="monthly-thermometer-grid">
            <div
              v-for="cell in group.cells"
              :key="cell.dateKey"
              :class="['monthly-heat-cell', `is-level-${cell.level}`, { 'is-blank': cell.isBlank, 'is-today': cell.isToday, 'has-bubble': bubbleDateKey === cell.dateKey }]"
              :title="cell.isBlank ? '' : `${formatDateLabel(cell.dateKey)}：${getMetricSummary(cell)}`"
              @click="!cell.isBlank && showBubble(cell.dateKey)"
            >
              <span v-if="!cell.isBlank && activeRange !== 'year'">{{ activeRange === 'week' ? cell.weekdayLabel : cell.dayLabel }}</span>
              <em v-if="bubbleDateKey === cell.dateKey">{{ formatNumber(cell.score) }}</em>
            </div>
          </div>
        </article>
      </div>

      <div class="monthly-heat-legend">
        <span>少</span>
        <i class="is-level-1"></i>
        <i class="is-level-2"></i>
        <i class="is-level-3"></i>
        <i class="is-level-4"></i>
        <i class="is-level-5"></i>
        <span>多</span>
      </div>
    </section>

    <section v-if="activeMetric === 'progress'" class="monthly-fact-layout">
      <article class="monthly-preview-panel monthly-range-summary">
        <div class="monthly-section-head">
          <div>
            <p>当前范围进展</p>
            <h2>{{ heatSummary }}</h2>
          </div>
          <span>{{ activeDayCount }} / {{ activePeriodDateKeys.length }} 天亮起</span>
        </div>
        <div class="monthly-summary-card-grid">
          <article v-for="card in periodSummaryCards" :key="card.label" class="monthly-summary-card">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <p>{{ card.note }}</p>
          </article>
        </div>
      </article>

      <article class="monthly-preview-panel monthly-progress-panel">
        <div class="monthly-section-head">
          <div><p>分类推进</p><h2>这段时间精力落在哪些愿望方向</h2></div>
          <span>{{ progressCategoryRows.length }} 类</span>
        </div>
        <div class="monthly-progress-metrics">
          <div><strong>{{ hottestProgressCategory?.category ?? '暂无' }}</strong><span>最热分类</span></div>
          <div><strong>{{ categoryProgressShare }}%</strong><span>推进占比</span></div>
          <div><strong>{{ quietProgressCategory?.category ?? '暂无' }}</strong><span>安静分类</span></div>
        </div>
        <div class="monthly-category-list">
          <article v-for="row in progressCategoryRows" :key="row.category" class="monthly-category-row">
            <div class="monthly-category-copy">
              <strong>{{ row.category }}</strong>
              <span>推进 {{ formatNumber(row.progressAmount) }} · {{ row.touchedCount }} 个愿望 · {{ row.commentCount }} 条留言</span>
            </div>
            <div class="monthly-category-meter" aria-hidden="true"><i :style="{ width: `${row.percent}%` }"></i></div>
            <em>{{ row.percent }}%</em>
          </article>
          <p v-if="!progressCategoryRows.length" class="monthly-empty-note">这个范围还没有被摸过的愿望。</p>
        </div>
        <button v-if="allProgressRows.length" type="button" class="monthly-progress-more" :aria-expanded="isProgressListExpanded" @click="isProgressListExpanded = !isProgressListExpanded">
          {{ isProgressListExpanded ? '收起愿望明细' : `展开 ${allProgressRows.length} 个愿望明细` }}
        </button>
        <div v-if="isProgressListExpanded" class="monthly-progress-list">
          <article v-for="row in allProgressRows" :key="row.id" class="monthly-progress-row">
            <div class="monthly-progress-copy">
              <span>{{ row.category }}</span>
              <strong>{{ row.title }}</strong>
              <p>{{ row.label }} · 推进 {{ formatNumber(row.progressAmount) }} · {{ row.doneSteps }} 步 · {{ row.commentCount }} 条留言</p>
            </div>
            <div class="monthly-progress-track" aria-hidden="true"><i :style="{ width: `${row.percent}%` }"></i></div>
          </article>
        </div>
      </article>
    </section>

    <section v-else-if="activeMetric === 'messages'" class="monthly-fact-layout">
      <article class="monthly-preview-panel monthly-message-panel">
        <div class="monthly-section-head">
          <div><p>留言册</p><h2>{{ activeRange === 'year' ? '年度留言摘要' : '按时间留下来的话' }}</h2></div>
          <span>{{ activeRange === 'year' ? `${yearMessageSummary?.count ?? 0} 条` : `${messageBookEntries.length} 条` }}</span>
        </div>
        <div v-if="activeRange === 'year'" class="monthly-year-message-summary">
          <strong>{{ yearMessageSummary?.label }}</strong>
          <p>年视图只保留总量和月份高点，不展开长留言列表。</p>
        </div>
        <div v-else class="monthly-message-list">
          <article v-for="entry in messageBookEntries" :key="entry.id" class="monthly-message-item">
            <div><span>{{ entry.authorName }} · {{ entry.timeLabel }}</span><strong>{{ entry.wishTitle }}</strong></div>
            <p>{{ entry.text }}</p>
          </article>
          <p v-if="!messageBookEntries.length" class="monthly-empty-note">这个范围还没有留言。</p>
        </div>
      </article>
    </section>

    <section v-else-if="activeMetric === 'coins'" class="monthly-fact-layout">
      <article class="monthly-preview-panel monthly-ledger-panel">
        <div class="monthly-section-head">
          <div>
            <p>星币账本</p>
            <h2>收入、兑换和余额</h2>
          </div>
        </div>
        <div v-if="hasStarCoinWaterfall" class="monthly-waterfall" aria-label="星币来源阶梯瀑布图">
          <div class="monthly-waterfall-stage">
            <article
              v-for="step in starCoinWaterfallSteps"
              :key="step.key"
              class="monthly-waterfall-step"
              :class="`is-${step.tone}`"
            >
              <div class="monthly-waterfall-column">
                <span v-if="step.isEndpoint" class="monthly-waterfall-marker" :style="{ bottom: step.markerBottom }"><em></em></span>
                <i v-else :style="{ height: step.height, bottom: step.bottom }"></i>
              </div>
              <div class="monthly-waterfall-copy">
                <span>{{ step.label }}</span>
                <strong>{{ step.isEndpoint ? formatNumber(step.signedAmount) : `${step.signedAmount > 0 ? '+' : step.signedAmount < 0 ? '-' : ''}${formatNumber(step.amount)}` }}</strong>
              </div>
            </article>
          </div>
        </div>
        <p v-else class="monthly-empty-note">这个范围还没有星币流动。</p>
      </article>
    </section>

    <section v-else-if="activeMetric === 'claims'" class="monthly-fact-layout">
      <article class="monthly-preview-panel monthly-claims-panel">
        <div class="monthly-section-head">
          <div><p>领奖统计</p><h2>这段时间你们领了哪些奖励</h2></div>
          <span>{{ claimStatsRows.length }} 项</span>
        </div>
        <div v-if="claimStatsRows.length" class="monthly-claims-chart-shell">
          <div class="monthly-claims-chart" role="img" aria-label="领奖花费星币条形图，按次数排序">
            <article v-for="row in claimStatsRows" :key="row.key" class="monthly-claims-item">
              <strong :title="row.label">{{ row.label }}</strong>
              <div class="monthly-claims-bars" aria-hidden="true">
                <i class="is-spending" :style="{ width: `${row.spending > 0 ? Math.max(4, Math.round((row.spending / claimStatsMaxSpending) * 100)) : 0}%` }"></i>
              </div>
              <div class="monthly-claims-values">
                <span>次数 {{ row.claimCount }}</span>
                <span>花费 {{ formatNumber(row.spending) }}</span>
              </div>
            </article>
          </div>
          <div class="monthly-claims-legend" aria-hidden="true">
            <span><i class="is-spending"></i> 花费</span>
          </div>
        </div>
        <p v-else class="monthly-empty-note">这个范围还没有领奖记录。</p>
      </article>
    </section>

    <section v-else class="monthly-fact-layout">
      <article class="monthly-preview-panel monthly-completed-panel">
        <div class="monthly-section-head">
          <div><p>已完本愿望</p><h2>已经走完整条路的册页</h2></div>
          <span>{{ completedWishJournals.length }} 本</span>
        </div>
        <div v-if="completedWishJournals.length" class="monthly-completed-list">
          <article v-for="wish in completedWishJournals" :key="wish.id" class="monthly-completed-card">
            <div class="monthly-completed-head">
              <span>{{ wish.category || '未分类' }} · {{ getMemberName(wish.ownerId) }}</span>
              <strong>{{ wish.title }}</strong>
              <p>完成于 {{ formatCompletedWishDate(wish) }}</p>
            </div>
            <div v-if="getCompletedWishPreviewRows(wish.id).length" class="monthly-completed-preview">
              <p v-for="entry in getCompletedWishPreviewRows(wish.id)" :key="entry.id">
                <span>{{ getThreadEventLabel(entry.eventKind) }}</span>{{ getThreadPreviewText(entry) }}
              </p>
            </div>
            <RouterLink class="monthly-completed-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">翻完整过程</RouterLink>
          </article>
        </div>
        <p v-else class="monthly-empty-note">还没有愿望完本。等第一条完成后，它会留在这里。</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.monthly-preview-page {
  --heat-0: rgba(89, 62, 42, 0.06);
  --heat-1: #faecd0;
  --heat-2: #f3cf85;
  --heat-3: #de9d4b;
  --heat-4: #b96b3f;
  --heat-5: #7d402f;
  display: grid;
  gap: 0.72rem;
  color: var(--text-main);
}

.monthly-preview-page.palette-rose { --heat-1: #f8dddd; --heat-2: #ecaeb0; --heat-3: #ce787f; --heat-4: #9b5360; --heat-5: #603345; }
.monthly-preview-page.palette-sage { --heat-1: #e8eedc; --heat-2: #c8dba5; --heat-3: #91b875; --heat-4: #5f8b62; --heat-5: #365f4f; }

.monthly-ledger-panel {
  --heat-1: #f8dddd;
  --heat-2: #ecaeb0;
  --heat-3: #ce787f;
  --heat-4: #9b5360;
  --heat-5: #603345;
}

.monthly-preview-hero,
.monthly-switch-panel,
.monthly-preview-panel {
  border: 1px solid var(--warm-border);
  background: linear-gradient(135deg, rgba(255, 252, 246, 0.96), rgba(247, 240, 228, 0.92));
  box-shadow: var(--shadow-card);
}

.monthly-preview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.36fr);
  gap: 0.8rem;
  min-height: 11rem;
  padding: 1rem;
  border-radius: 22px;
}

.monthly-preview-kicker,
.monthly-switch-group > span,
.monthly-section-head p,
.monthly-source-row span,
.monthly-progress-copy span,
.monthly-message-item span,
.monthly-progress-metrics span,
.monthly-summary-card span {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.04em;
}

.monthly-preview-hero-copy,
.monthly-switch-panel,
.monthly-switch-group,
.monthly-preview-panel,
.monthly-source-list,
.monthly-progress-list,
.monthly-message-list {
  display: grid;
  gap: 0.5rem;
}

.monthly-switch-panel,
.monthly-switch-group {
  gap: 0.36rem;
}

.monthly-preview-hero-copy h1,
.monthly-section-head h2 {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: 0;
}

.monthly-preview-hero-copy h1 {
  max-width: 15ch;
  font-size: clamp(1.85rem, 7vw, 3.2rem);
  line-height: 0.95;
}

.monthly-preview-hero-copy p,
.monthly-empty-note,
.monthly-message-item p,
.monthly-progress-copy p,
.monthly-summary-card p,
.monthly-year-message-summary p {
  margin: 0;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.82rem;
  line-height: 1.5;
}

.monthly-summary-card-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.monthly-summary-card-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.monthly-switch-panel,
.monthly-preview-panel {
  padding: 0.75rem;
  border-radius: 18px;
}

.monthly-switch-panel {
  padding: 0.58rem;
}

.monthly-summary-card {
  display: grid;
  gap: 0.18rem;
}

.monthly-progress-metrics strong,
.monthly-summary-card strong,
.monthly-year-message-summary strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.05;
}

.monthly-switch-row,
.monthly-fact-layout,
.monthly-progress-metrics {
  display: grid;
  gap: 0.5rem;
}

.monthly-switch-row {
  gap: 0.44rem;
}

.monthly-switch-row {
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
}

.monthly-fact-layout {
  grid-template-columns: minmax(0, 1fr);
}

.monthly-segmented-control,
.monthly-compact-control {
  display: flex;
  align-items: stretch;
  gap: 3px;
}

.monthly-sliding-tabs {
  position: relative;
  padding: 2px;
  border: 1px solid rgba(126, 96, 76, 0.08);
  border-radius: 999px;
  background: rgba(120, 94, 74, 0.1);
  isolation: isolate;
  overflow: hidden;
}

.monthly-switch-slider {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  z-index: 0;
  border: 1px solid rgba(126, 96, 76, 0.1);
  border-radius: 999px;
  background: rgba(255, 251, 244, 0.92);
  box-shadow: 0 8px 18px rgba(74, 50, 33, 0.08);
  pointer-events: none;
  transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1), width 250ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, width;
}

.monthly-segmented-control button,
.monthly-compact-control button,
.monthly-period-actions button {
  min-width: 0;
  border: 1px solid var(--line-soft);
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.56);
  color: var(--text-muted);
  font: inherit;
}

.monthly-sliding-tabs button {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  color: rgba(61, 46, 40, 0.66);
  transition: color 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.monthly-segmented-control button {
  display: grid;
  min-height: 2.05rem;
  padding: 0.28rem 0.32rem;
  text-align: center;
}

.monthly-segmented-control strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 0.88rem;
}

.monthly-compact-control button,
.monthly-period-actions button {
  min-height: 1.82rem;
  padding: 0.25rem 0.42rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.monthly-segmented-control button.is-active,
.monthly-compact-control button.is-active {
  color: rgba(36, 27, 22, 0.92);
}

.monthly-sliding-tabs button:hover,
.monthly-sliding-tabs button:active {
  transform: none;
  color: rgba(36, 27, 22, 0.92);
}

.monthly-section-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: start;
}

.monthly-section-head h2 {
  margin-top: 0.16rem;
  font-size: clamp(1.18rem, 4.4vw, 1.8rem);
  line-height: 1.08;
}

.monthly-period-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.32rem;
}

.monthly-weekday-row,
.monthly-thermometer-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.24rem;
}

.monthly-weekday-row span {
  color: var(--text-soft);
  font-size: 0.66rem;
  text-align: center;
}

.monthly-thermometer-groups {
  display: grid;
  gap: 0.48rem;
}

.monthly-thermometer-groups.is-year {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.44rem;
}

.monthly-thermometer-group {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.monthly-month-label {
  color: var(--text-soft);
  font-size: 0.68rem;
  line-height: 1;
}

.monthly-thermometer-groups.is-year .monthly-thermometer-grid {
  gap: 0.1rem;
}

.monthly-heat-cell {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  min-width: 0;
  border: 1px solid rgba(79, 49, 35, 0.07);
  border-radius: 8px;
  background: var(--heat-0);
  color: var(--text-soft);
  cursor: default;
}

.monthly-heat-cell.is-blank {
  visibility: hidden;
}

.monthly-heat-cell span {
  font-size: 0.64rem;
  line-height: 1;
}

.monthly-thermometer-groups.is-year .monthly-heat-cell {
  border-radius: 3px;
}

.monthly-thermometer-groups.is-year .monthly-heat-cell span {
  display: none;
}

.monthly-heat-cell.is-level-1,
.monthly-heat-legend .is-level-1 { background: var(--heat-1); }
.monthly-heat-cell.is-level-2,
.monthly-heat-legend .is-level-2 { background: var(--heat-2); }
.monthly-heat-cell.is-level-3,
.monthly-heat-legend .is-level-3 { background: var(--heat-3); color: #fffaf0; }
.monthly-heat-cell.is-level-4,
.monthly-heat-legend .is-level-4 { background: var(--heat-4); color: #fffaf0; }
.monthly-heat-cell.is-level-5,
.monthly-heat-legend .is-level-5 { background: var(--heat-5); color: #fffaf0; }

.monthly-heat-cell.is-today {
  outline: 2px solid var(--accent-border);
  outline-offset: 1px;
}

.monthly-heat-cell em {
  position: absolute;
  z-index: 2;
  left: 50%;
  bottom: calc(100% + 0.24rem);
  transform: translateX(-50%);
  min-width: 1.45rem;
  padding: 0.18rem 0.36rem;
  border-radius: 999px;
  background: var(--text-main);
  color: var(--warm-panel);
  font-size: 0.66rem;
  font-style: normal;
  line-height: 1.1;
  white-space: nowrap;
}

.monthly-heat-legend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-soft);
  font-size: 0.68rem;
}

.monthly-heat-legend i {
  width: 0.78rem;
  height: 0.78rem;
  border-radius: 4px;
}

.monthly-summary-card,
.monthly-progress-metrics div,
.monthly-category-row,
.monthly-progress-row,
.monthly-completed-card,
.monthly-message-item,
.monthly-year-message-summary {
  padding: 0.62rem;
  border-radius: 14px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.52);
}

.monthly-progress-list,
.monthly-category-list,
.monthly-completed-list,
.monthly-message-list {
  display: grid;
  gap: 0.46rem;
}

.monthly-claims-chart-shell {
  display: grid;
  gap: 0.52rem;
}

.monthly-claims-chart {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.46rem;
  align-items: stretch;
  padding: 0.5rem;
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.46);
}

.monthly-claims-item {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) minmax(7.8rem, 0.9fr) auto;
  align-items: center;
  gap: 0.42rem;
  min-width: 0;
  padding: 0.38rem 0.44rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.62);
}

.monthly-claims-bars {
  display: block;
  min-height: 0.62rem;
  padding: 0.34rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.66);
}

.monthly-claims-bars i {
  display: block;
  min-width: 0;
  height: 0.6rem;
  border-radius: 999px;
}

.monthly-claims-bars i.is-spending,
.monthly-claims-legend i.is-spending {
  background: linear-gradient(90deg, #78b9ae, #2f756f);
}

.monthly-claims-values {
  display: grid;
  gap: 0.08rem;
  justify-items: end;
  text-align: right;
  color: var(--text-soft);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.25;
}

.monthly-claims-item strong {
  overflow: hidden;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 0.84rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.monthly-claims-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.46rem;
  color: var(--text-soft);
  font-size: 0.68rem;
  font-weight: 700;
}

.monthly-claims-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;
}

.monthly-claims-legend i {
  width: 0.68rem;
  height: 0.68rem;
  border-radius: 4px;
}

.monthly-completed-card {
  display: grid;
  gap: 0.55rem;
}

.monthly-completed-head,
.monthly-completed-preview {
  display: grid;
  gap: 0.18rem;
}

.monthly-completed-head span,
.monthly-completed-head p,
.monthly-completed-preview span {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.25;
}

.monthly-completed-head strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 0.92rem;
  line-height: 1.2;
}

.monthly-completed-preview {
  padding-top: 0.48rem;
  border-top: 1px solid var(--line-soft);
}

.monthly-completed-preview p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.42;
}

.monthly-completed-preview span {
  margin-right: 0.32rem;
  color: var(--heat-5);
}

.monthly-completed-link {
  justify-self: start;
  min-height: 1.9rem;
  padding: 0.32rem 0.68rem;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-main);
  font-size: 0.72rem;
  font-weight: 700;
  text-decoration: none;
}

.monthly-category-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 3.8rem auto;
  align-items: center;
  gap: 0.5rem;
}

.monthly-category-copy {
  display: grid;
  gap: 0.1rem;
  min-width: 0;
}

.monthly-category-copy strong {
  overflow: hidden;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 0.9rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.monthly-category-copy span,
.monthly-category-row em {
  color: var(--text-soft);
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 700;
  line-height: 1.25;
}

.monthly-category-meter {
  height: 0.52rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(79, 49, 35, 0.08);
}

.monthly-category-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--heat-2), var(--heat-5));
}

.monthly-waterfall {
  display: grid;
  gap: 0.62rem;
}

.monthly-waterfall-stage {
  position: relative;
  display: grid;
  grid-template-columns: 0.92fr repeat(4, 1fr) 0.92fr;
  gap: 0.16rem;
  min-height: 10.8rem;
  padding: 0.82rem 0.42rem 0.66rem;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.42);
}

.monthly-waterfall-step {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-rows: minmax(6.7rem, 1fr) auto;
  gap: 0.38rem;
  min-width: 0;
}

.monthly-waterfall-column {
  position: relative;
  min-height: 6.7rem;
  overflow: visible;
}

.monthly-waterfall-column i {
  position: absolute;
  left: 4%;
  right: 4%;
  display: block;
  border-radius: 11px;
  border: 1px solid rgba(112, 72, 39, 0.13);
  background: linear-gradient(180deg, color-mix(in srgb, var(--heat-4) 92%, white), var(--heat-2));
  box-shadow: 0 12px 24px rgba(188, 105, 42, 0.18), inset 0 1px rgba(255, 255, 255, 0.45);
}

.monthly-waterfall-step.is-spending .monthly-waterfall-column i {
  border-color: rgba(47, 117, 111, 0.16);
  background: linear-gradient(180deg, #78b9ae, #2f756f);
  box-shadow: 0 12px 24px rgba(47, 117, 111, 0.16), inset 0 1px rgba(255, 255, 255, 0.3);
}

.monthly-waterfall-marker {
  position: absolute;
  right: 8%;
  left: 8%;
  height: 0;
  border-top: 2px solid color-mix(in srgb, var(--heat-4) 52%, rgba(79, 49, 35, 0.24));
  pointer-events: none;
}

.monthly-waterfall-marker em {
  position: absolute;
  top: 0;
  left: 50%;
  width: 0.42rem;
  height: 0.42rem;
  display: block;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--heat-4) 48%, rgba(79, 49, 35, 0.18));
  background: color-mix(in srgb, var(--heat-1) 78%, rgba(255, 255, 255, 0.86));
  box-shadow: 0 6px 14px rgba(79, 49, 35, 0.1);
}

.monthly-waterfall-step.is-balance .monthly-waterfall-copy strong {
  color: color-mix(in srgb, var(--heat-5) 54%, var(--text-main));
}

.monthly-waterfall-step.is-empty .monthly-waterfall-column i {
  left: 18%;
  right: 18%;
  border: 0;
  background: rgba(79, 49, 35, 0.16);
  box-shadow: none;
}

.monthly-waterfall-copy {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  text-align: center;
}

.monthly-waterfall-copy span {
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.64rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.monthly-waterfall-copy strong,
.monthly-progress-copy strong,
.monthly-message-item strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 0.88rem;
}

.monthly-progress-track {
  display: block;
  height: 0.46rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(79, 49, 35, 0.08);
}

.monthly-progress-row,
.monthly-message-item {
  display: grid;
  gap: 0.36rem;
}

.monthly-progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--heat-2), var(--heat-5));
}

.monthly-progress-more {
  min-height: 2.35rem;
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.48);
  color: var(--text-main);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
}

.monthly-progress-more:hover,
.monthly-progress-more:focus-visible {
  border-color: color-mix(in srgb, var(--heat-4) 36%, rgba(79, 49, 35, 0.14));
  background: color-mix(in srgb, var(--heat-1) 48%, rgba(255, 255, 255, 0.58));
}

.monthly-empty-note {
  margin: 0;
  padding: 0.68rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.44);
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.45;
}

@media (max-width: 920px) {
  .monthly-preview-hero,
  .monthly-switch-row,
  .monthly-fact-layout,
  .monthly-summary-card-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .monthly-preview-page {
    gap: 0.58rem;
  }

  .monthly-preview-hero,
  .monthly-switch-panel,
  .monthly-preview-panel {
    border-radius: 16px;
    padding: 0.62rem;
  }

  .monthly-section-head {
    flex-direction: column;
  }

  .monthly-segmented-control,
  .monthly-compact-control {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .monthly-claims-item {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .monthly-claims-values {
    justify-items: start;
    text-align: left;
  }

  .monthly-segmented-control button {
    min-height: 1.9rem;
    padding: 0.24rem 0.2rem;
  }

  .monthly-segmented-control strong {
    font-size: 0.8rem;
  }

  .monthly-thermometer-groups.is-year {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
