<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { getThreadEventKindLabel } from '../shared/statusSemantics'
import { buildVisibleStarCoinLedger, type StarCoinWaterfallKind } from '../shared/starCoinLedger'
import { useAuthStore } from '../stores/auth'
import { useWishStore, type RewardClaimKind, type WishRecord, type WishThreadEntry } from '../stores/wishes'

const authStore = useAuthStore()
const wishStore = useWishStore()

const BEIJING_TIME_OFFSET_MS = 8 * 60 * 60 * 1000

const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']
const WEEK_CHART_HEIGHT_REM = 8.2
const WEEK_CHART_AXIS_SPACE_REM = 1.64

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
  rewardClaimKind?: RewardClaimKind
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
  claims: number
  completed: number
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
  wishId: string
  wishTitle: string
  wishOwnerName: string
}

type ProgressUsageEvent = {
  id: string
  dateKey: string
  ownerId: string
  wishId: string
  category: string
  title: string
  units: number
}

type ProgressUsageWishRow = {
  wishId: string
  title: string
  category: string
  units: number
}

type CoinUsageWishRow = {
  wishId: string
  title: string
  category: string
  units: number
}

type UsagePalette = 'ocean' | 'candy' | 'sunset' | 'aurora' | 'neon' | 'tropical' | 'macaron'

type ClaimStatRow = {
  claimCount: number
  key: string
  label: string
  latestAt: string
  spending: number
}

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

const activeMetric = ref<ReviewMetric>('progress')
const activeScope = ref<ReviewScope>('me')
const activeRange = ref<ReviewRange>('week')
const anchorDateKey = ref(getBeijingDateKey())
const bubbleDateKey = ref<string | null>(null)
const isCompletedListExpanded = ref(false)
const isMessageListExpanded = ref(false)
const rewardClaimHeatKinds = new Set<RewardClaimKind>(['count_reward', 'step_reward', 'wish_reward', 'premium_redeem'])

const usagePaletteOptions: Array<{ value: UsagePalette; label: string }> = [
  { value: 'ocean', label: '海风蓝' },
  { value: 'candy', label: '糖果霓虹' },
  { value: 'sunset', label: '落日汽水' },
  { value: 'aurora', label: '极光薄荷' },
  { value: 'neon', label: '电光果冻' },
  { value: 'tropical', label: '热带拼色' },
  { value: 'macaron', label: '马卡龙雾彩' },
]

const usagePaletteCycle: UsagePalette[] = ['ocean', 'candy', 'sunset', 'aurora', 'neon', 'tropical', 'macaron']
const activeUsagePalette = computed<UsagePalette>(() => {
  const { year, month, day } = parseDateKey(todayDateKey.value)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const mondayFirstIndex = (weekday + 6) % 7
  return usagePaletteCycle[mondayFirstIndex]
})
const activeUsagePaletteLabel = computed(() => {
  return usagePaletteOptions.find((option) => option.value === activeUsagePalette.value)?.label ?? '海风蓝'
})

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
const currentYear = computed(() => parseDateKey(anchorDateKey.value).year)
const periodEvents = computed(() => reviewEvents.value.filter((event) => activePeriodDateSet.value.has(event.dateKey) && matchesMemberScope(event)))
const metricPeriodEvents = computed(() => {
  return periodEvents.value.filter((event) => getEventScore(event, activeMetric.value) > 0)
})
const currentPeriodRewardClaims = computed(() => wishStore.rewardClaims.filter((claim) => {
  return activePeriodDateSet.value.has(getBeijingDateKey(claim.createdAt)) && activeLedgerMemberIdSet.value.has(claim.ownerId)
}))
const countProgressStarCoinValueByWishId = computed(() => {
  const map = new Map<string, number>()

  wishStore.wishes.forEach((wish) => {
    map.set(wish.id, Math.max(0, wish.progressStarCoinValue))
  })

  return map
})
const resolveClaimStarCoinDelta = (claim: { claimKind: RewardClaimKind; sourceWishId: string | null; quantity: number; starCoinDelta: number }) => {
  if (claim.claimKind !== 'count_star_coin' || !claim.sourceWishId) {
    return claim.starCoinDelta
  }

  const perUnitValue = countProgressStarCoinValueByWishId.value.get(claim.sourceWishId)

  if (perUnitValue === undefined) {
    return claim.starCoinDelta
  }

  return Math.max(0, claim.quantity) * Math.max(0, perUnitValue)
}
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
        wishId: wish.id,
        wishTitle: wish.title,
        wishOwnerName: getMemberName(wish.ownerId),
      })))
    .filter((entry) => {
      if (activeScope.value === 'me') return entry.authorName === currentMember.value.displayName
      if (activeScope.value === 'partner') return entry.authorName === (partnerMember.value?.displayName ?? '')
      return true
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
})
const starCoinLedger = computed(() => buildVisibleStarCoinLedger({
  claims: wishStore.rewardClaims,
  endDateKey: periodEndDateKey.value,
  getDateKey: getBeijingDateKey,
  memberIds: activeLedgerMemberIds.value,
  sourceKinds: starCoinWaterfallKinds.map((source) => source.kind),
  startDateKey: periodStartDateKey.value,
  wishCountStarCoinValueByWishId: countProgressStarCoinValueByWishId.value,
}))
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
        progressScore: 1,
        coinScore: 0,
        coinDelta: 0,
      })
    }

    wish.images.forEach((image) => {
      events.push(createImageEvent(`wish-image-${wish.id}-${image.id}`, image.createdAt, image.createdBy, wish, '给愿望加了照片'))
    })
  })

  wishStore.rewardClaims.forEach((claim) => {
    const resolvedCoinDelta = resolveClaimStarCoinDelta(claim)
    const amount = Math.abs(resolvedCoinDelta)
    const isRewardClaimEvent = rewardClaimHeatKinds.has(claim.claimKind)
    const countProgressUnits = Math.max(0, claim.quantity)

    if (claim.claimKind === 'count_star_coin' && countProgressUnits > 0) {
      events.push({
        id: `count-progress-claim-${claim.id}`,
        kind: 'count_progress',
        createdAt: claim.createdAt,
        dateKey: getBeijingDateKey(claim.createdAt),
        memberId: claim.ownerId,
        memberName: getMemberName(claim.ownerId),
        wishId: claim.sourceWishId,
        wishTitle: getWishTitle(claim.sourceWishId),
        title: '推进了数字进度',
        detail: `+${formatNumber(countProgressUnits)} 点`,
        messageText: '',
        activityScore: Math.min(8, countProgressUnits),
        messageScore: 0,
        progressScore: countProgressUnits,
        coinScore: 0,
        coinDelta: 0,
      })
    }

    if (!amount && !isRewardClaimEvent) return

    events.push({
      id: `coin-${claim.id}`,
      kind: resolvedCoinDelta >= 0 ? 'coin_income' : 'coin_spending',
      rewardClaimKind: claim.claimKind,
      createdAt: claim.createdAt,
      dateKey: getBeijingDateKey(claim.createdAt),
      memberId: claim.ownerId,
      memberName: getMemberName(claim.ownerId),
      wishId: claim.sourceWishId,
      wishTitle: getWishTitle(claim.sourceWishId),
      title: claim.claimKind === 'premium_redeem'
        ? '兑换了奖励'
        : isRewardClaimEvent
          ? '接住了奖励'
          : resolvedCoinDelta >= 0
            ? '获得星币'
            : '使用星币',
      detail: isRewardClaimEvent
        ? (claim.titleSnapshot.trim() || getRewardClaimKindLabel(claim.claimKind))
        : `${getRewardClaimKindLabel(claim.claimKind)} ${resolvedCoinDelta >= 0 ? '+' : '-'}${formatNumber(amount)}`,
      messageText: '',
      activityScore: Math.min(5, Math.ceil(amount / 2)),
      messageScore: 0,
      progressScore: 0,
      coinScore: amount,
      coinDelta: resolvedCoinDelta,
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
      claims: events.reduce((total, event) => total + getEventClaimScore(event), 0),
      completed: events.reduce((total, event) => total + getEventCompletedScore(event), 0),
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

  const yearGroups = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const monthKey = `${currentYear.value}-${`${month}`.padStart(2, '0')}`
    const monthCells = activeHeatCells.value.filter((cell) => cell.dateKey.startsWith(monthKey))
    const monthScore = monthCells.reduce((sum, cell) => sum + cell.score, 0)

    return {
      id: monthKey,
      label: `${month}月`,
      cells: withCalendarWeekdayBlanks(monthCells),
      monthScore,
    }
  })

  return yearGroups
    .filter((group) => group.monthScore > 0)
    .map(({ monthScore: _monthScore, ...group }) => group)
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
const compactInsightLine = computed(() => {
  const activeDaysLabel = `${activeDayCount.value} / ${activePeriodDateKeys.value.length} 天亮起`

  if (!peakCell.value || peakCell.value.score <= 0) {
    if (activeMetric.value === 'completed') {
      return `${activePeriodLabel.value}还没有完本记录。`
    }

    if (activeMetric.value === 'messages') {
      return `${activePeriodLabel.value}留言偏少（${activeDaysLabel}）。`
    }

    if (activeMetric.value === 'claims') {
      return `${activePeriodLabel.value}还没有领奖发生。`
    }

    if (activeMetric.value === 'coins') {
      return `${activePeriodLabel.value}还没有明显的星币变化。`
    }

    return `${activePeriodLabel.value}整体偏安静（${activeDaysLabel}）。`
  }

  return `${heatSummary.value} ${activeDaysLabel}`
})
const starCoinWaterfallChart = computed<StarCoinWaterfallChart>(() => {
  let runningTotal = periodStarCoinStartBalance.value
  const progressStarCoinSignedAmount =
    (starCoinLedger.value.sourceTotals.get('count_star_coin') ?? 0)
    + (starCoinLedger.value.sourceTotals.get('step_star_coin') ?? 0)

  const changeStepSources = [
    { key: 'progress_star_coin', label: '推进星币', signedAmount: progressStarCoinSignedAmount },
    { key: 'wish_completion_bonus', label: '完成愿望', signedAmount: starCoinLedger.value.sourceTotals.get('wish_completion_bonus') ?? 0 },
    { key: 'reward_deposit', label: '存入奖励', signedAmount: starCoinLedger.value.sourceTotals.get('reward_deposit') ?? 0 },
  ]

  const changeSteps = changeStepSources.map((source) => {
    const signedAmount = source.signedAmount
    const start = runningTotal
    const end = runningTotal + signedAmount
    runningTotal = end

    return { key: source.key, label: source.label, amount: Math.abs(signedAmount), end, signedAmount, start, tone: signedAmount > 0 ? 'income' as const : signedAmount < 0 ? 'spending' as const : 'empty' as const }
  })

  const balancePoints = [periodStarCoinStartBalance.value, ...changeSteps.map((step) => step.end), periodStarCoinEndBalance.value]
  const positionedSteps = [
    { key: 'period-start', label: '期初', amount: Math.abs(periodStarCoinStartBalance.value), end: periodStarCoinStartBalance.value, signedAmount: periodStarCoinStartBalance.value, start: periodStarCoinStartBalance.value, tone: 'balance' as const },
    ...changeSteps,
    { key: 'period-end', label: '期末', amount: Math.abs(periodStarCoinEndBalance.value), end: periodStarCoinEndBalance.value, signedAmount: periodStarCoinEndBalance.value, start: periodStarCoinEndBalance.value, tone: 'balance' as const },
  ]

  const rawMinValue = Math.min(0, ...balancePoints)
  const rawMaxValue = Math.max(0, ...balancePoints)
  const rawSpan = Math.max(1, rawMaxValue - rawMinValue)
  // Keep a dynamic domain but reserve headroom/footroom so endpoints do not visually stick to chart edges.
  const dynamicPadding = Math.max(1, rawSpan * 0.1)
  const minValue = rawMinValue - dynamicPadding
  const maxValue = rawMaxValue + dynamicPadding
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
const coinUsageEvents = computed<ProgressUsageEvent[]>(() => {
  const events: ProgressUsageEvent[] = []

  currentPeriodRewardClaims.value.forEach((claim) => {
    const resolvedCoinDelta = resolveClaimStarCoinDelta(claim)
    if (!claim.sourceWishId || resolvedCoinDelta <= 0) return

    const wish = wishStore.findById(claim.sourceWishId)
    if (!wish) return

    events.push({
      id: `coin-income-${claim.id}`,
      dateKey: getBeijingDateKey(claim.createdAt),
      ownerId: claim.ownerId,
      wishId: wish.id,
      category: wish.category || '未分类',
      title: wish.title,
      units: resolvedCoinDelta,
    })
  })

  return events.sort((left, right) => right.dateKey.localeCompare(left.dateKey))
})
const previousCoinIncomeEvents = computed<ProgressUsageEvent[]>(() => {
  const events: ProgressUsageEvent[] = []

  wishStore.rewardClaims.forEach((claim) => {
    const resolvedCoinDelta = resolveClaimStarCoinDelta(claim)
    if (!claim.sourceWishId || resolvedCoinDelta <= 0) return
    if (!previousProgressDateSet.value.has(getBeijingDateKey(claim.createdAt))) return
    if (!activeLedgerMemberIdSet.value.has(claim.ownerId)) return

    const wish = wishStore.findById(claim.sourceWishId)
    if (!wish) return

    events.push({
      id: `previous-coin-income-${claim.id}`,
      dateKey: getBeijingDateKey(claim.createdAt),
      ownerId: claim.ownerId,
      wishId: wish.id,
      category: wish.category || '未分类',
      title: wish.title,
      units: resolvedCoinDelta,
    })
  })

  return events
})
const coinUsageTotalUnits = computed(() => coinUsageEvents.value.reduce((sum, event) => sum + event.units, 0))
const previousCoinUsageTotalUnits = computed(() => previousCoinIncomeEvents.value.reduce((sum, event) => sum + event.units, 0))
const coinUsageDailyAverage = computed(() => coinUsageTotalUnits.value / Math.max(1, activePeriodDateKeys.value.length))
const previousCoinUsageDailyAverage = computed(() => {
  const previousDateSet = new Set(previousComparableProgressDateKeys.value)
  const previousComparableCount = Math.max(1, previousComparableProgressDateKeys.value.length)
  const total = wishStore.rewardClaims.reduce((sum, claim) => {
    const resolvedCoinDelta = resolveClaimStarCoinDelta(claim)
    if (!claim.sourceWishId || resolvedCoinDelta <= 0) return sum
    if (!previousDateSet.has(getBeijingDateKey(claim.createdAt))) return sum
    if (!activeLedgerMemberIdSet.value.has(claim.ownerId)) return sum
    return sum + resolvedCoinDelta
  }, 0)

  return total / previousComparableCount
})
const coinUsageSelectedDateKey = ref<string | null>(null)
const coinUsageSummaryLabel = computed(() => coinUsageSelectedDateKey.value ? formatDateLabel(coinUsageSelectedDateKey.value) : activePeriodLabel.value)
const coinUsageFocusedEvents = computed(() => {
  if (!coinUsageSelectedDateKey.value) return coinUsageEvents.value
  return coinUsageEvents.value.filter((event) => event.dateKey === coinUsageSelectedDateKey.value)
})
const coinUsageFocusedTotalUnits = computed(() => coinUsageFocusedEvents.value.reduce((sum, event) => sum + event.units, 0))
const coinUsageCompareLine = computed(() => {
  const diff = coinUsageTotalUnits.value - previousCoinUsageTotalUnits.value
  if (Math.abs(diff) < 0.05) return '与上一周期持平'
  const prefix = diff > 0 ? '比上一周期多' : '比上一周期少'
  const amount = Math.abs(diff)
  if (previousCoinUsageTotalUnits.value <= 0) return `${prefix} 入账 ${formatNumber(amount)} 星币`
  const ratio = Math.round((amount / previousCoinUsageTotalUnits.value) * 100)
  return `${prefix} 入账 ${formatNumber(amount)} 星币（${ratio}%）`
})
const coinUsageAverageLine = computed(() => `日均入账 ${formatNumber(coinUsageDailyAverage.value)} 星币`)
const coinUsageAverageCompareLine = computed(() => {
  const currentAverage = coinUsageDailyAverage.value
  const previousAverage = previousCoinUsageDailyAverage.value
  const averageDiff = currentAverage - previousAverage

  if (previousAverage <= 0) {
    return averageDiff > 0 ? '日均入账较上一周期有提升' : '日均入账较上一周期回落'
  }

  const ratio = Math.round((Math.abs(averageDiff) / previousAverage) * 100)
  if (ratio < 5) return '日均入账与上一周期基本持平'

  const direction = averageDiff > 0 ? '多' : '少'
  return `日均入账比上一周期${direction} ${ratio}%`
})
const coinUsageCategorySummary = computed(() => {
  const grouped = new Map<string, number>()
  coinUsageFocusedEvents.value.forEach((event) => {
    grouped.set(event.category, (grouped.get(event.category) ?? 0) + event.units)
  })
  const total = coinUsageFocusedTotalUnits.value
  return [...grouped.entries()]
    .map(([category, units]) => ({ category, units, percent: total ? Math.round((units / total) * 100) : 0 }))
    .sort((left, right) => right.units - left.units)
})
const coinUsageTopCategories = computed(() => coinUsageCategorySummary.value.slice(0, 5).map((row) => row.category))
const coinUsageLegend = computed(() => {
  const base = coinUsageTopCategories.value.map((label, index) => ({ label, className: `review-usage-dot-${index}` }))
  if (coinUsageCategorySummary.value.length > coinUsageTopCategories.value.length) {
    base.push({ label: '其他', className: 'review-usage-dot-other' })
  }
  return base
})
const coinUsageBars = computed(() => {
  const grouped = new Map<string, { total: number; categories: Map<string, number> }>()
  progressUsageChartDateKeys.value.forEach((dateKey) => grouped.set(dateKey, { total: 0, categories: new Map<string, number>() }))
  coinUsageEvents.value.forEach((event) => {
    const row = grouped.get(event.dateKey)
    if (!row) return
    row.total += event.units
    row.categories.set(event.category, (row.categories.get(event.category) ?? 0) + event.units)
  })
  const max = Math.max(1, ...[...grouped.values()].map((row) => row.total))
  return progressUsageChartDateKeys.value.map((dateKey) => {
    const row = grouped.get(dateKey) ?? { total: 0, categories: new Map<string, number>() }
    return {
      dateKey,
      total: row.total,
      weekdayLabel: weekdayLabels[getMondayBasedWeekdayIndex(dateKey)] ?? '-',
      dayLabel: `${parseDateKey(dateKey).day}`,
      hasValue: row.total > 0,
      active: coinUsageSelectedDateKey.value === dateKey,
      layers: buildCoinUsageLayers(row.categories, max),
    }
  })
})
const coinUsageAverageAxis = computed(() => {
  const max = Math.max(1, ...coinUsageBars.value.map((row) => row.total))
  const ratio = Math.min(100, (coinUsageDailyAverage.value / max) * 100)
  return { bottom: `${WEEK_CHART_AXIS_SPACE_REM + (ratio / 100) * (WEEK_CHART_HEIGHT_REM - WEEK_CHART_AXIS_SPACE_REM)}rem`, label: '平均' }
})
const coinUsageAxisTicks = computed(() => {
  const max = Math.max(1, ...coinUsageBars.value.map((row) => row.total))
  const mid = max / 2
  const levels = [max, mid, 0]
  return levels.map((value, index) => ({
    key: `${value}-${index}`,
    label: formatNumber(value),
    bottom: `${WEEK_CHART_AXIS_SPACE_REM + ((value / max) * (WEEK_CHART_HEIGHT_REM - WEEK_CHART_AXIS_SPACE_REM))}rem`,
  }))
})
const coinUsageWishRows = computed<CoinUsageWishRow[]>(() => {
  const grouped = new Map<string, CoinUsageWishRow>()
  coinUsageFocusedEvents.value.forEach((event) => {
    const current = grouped.get(event.wishId) ?? { wishId: event.wishId, title: event.title, category: event.category, units: 0 }
    current.units += event.units
    grouped.set(event.wishId, current)
  })
  return [...grouped.values()].sort((left, right) => right.units - left.units)
})
const coinUsageMaxWishUnits = computed(() => Math.max(1, ...coinUsageWishRows.value.map((row) => row.units)))
const showCoinUsageCopy = computed(() => activeMetric.value === 'coins' && activeRange.value !== 'year')
const progressUsageEvents = computed<ProgressUsageEvent[]>(() => {
  const events: ProgressUsageEvent[] = []

  wishStore.rewardClaims.forEach((claim) => {
    if (claim.claimKind !== 'count_star_coin' || !claim.sourceWishId) return
    if (!activePeriodDateSet.value.has(getBeijingDateKey(claim.createdAt))) return
    if (!activeLedgerMemberIdSet.value.has(claim.ownerId)) return

    const wish = wishStore.findById(claim.sourceWishId)
    if (!wish) return

    const units = Math.max(0, claim.quantity)
    if (!units) return

    events.push({
      id: `count-${claim.id}`,
      dateKey: getBeijingDateKey(claim.createdAt),
      ownerId: claim.ownerId,
      wishId: wish.id,
      category: wish.category || '未分类',
      title: wish.title,
      units,
    })
  })

  wishStore.wishes.forEach((wish) => {
    if (!activeLedgerMemberIdSet.value.has(wish.ownerId)) return

    wish.steps.forEach((step) => {
      const dateKey = getBeijingDateKey(step.updatedAt)
      if (!step.isDone || !activePeriodDateSet.value.has(dateKey)) return
      events.push({
        id: `step-${step.id}`,
        dateKey,
        ownerId: wish.ownerId,
        wishId: wish.id,
        category: wish.category || '未分类',
        title: wish.title,
        units: 1,
      })
    })

    if (wish.completedAt) {
      const dateKey = getBeijingDateKey(wish.completedAt)
      if (activePeriodDateSet.value.has(dateKey)) {
        events.push({
          id: `complete-${wish.id}`,
          dateKey,
          ownerId: wish.ownerId,
          wishId: wish.id,
          category: wish.category || '未分类',
          title: wish.title,
          units: 1,
        })
      }
    }
  })

  return events.sort((left, right) => right.dateKey.localeCompare(left.dateKey))
})
const previousProgressDateKeys = computed(() => {
  if (activeRange.value === 'week') return buildPeriodDateKeys('week', addDaysToDateKey(anchorDateKey.value, -7))
  if (activeRange.value === 'month') return buildPeriodDateKeys('month', addMonthsToDateKey(anchorDateKey.value, -1))
  return []
})
const previousComparableProgressDateKeys = computed(() => {
  const comparableCount = Math.max(1, activePeriodDateKeys.value.length)
  return previousProgressDateKeys.value.slice(0, comparableCount)
})
const previousProgressDateSet = computed(() => new Set(previousProgressDateKeys.value.filter((dateKey) => dateKey <= todayDateKey.value)))
const previousProgressUnits = computed(() => {
  let total = 0

  wishStore.rewardClaims.forEach((claim) => {
    if (claim.claimKind !== 'count_star_coin' || !claim.sourceWishId) return
    if (!previousProgressDateSet.value.has(getBeijingDateKey(claim.createdAt))) return
    if (!activeLedgerMemberIdSet.value.has(claim.ownerId)) return
    total += Math.max(0, claim.quantity)
  })

  wishStore.wishes.forEach((wish) => {
    if (!activeLedgerMemberIdSet.value.has(wish.ownerId)) return
    total += wish.steps.filter((step) => step.isDone && previousProgressDateSet.value.has(getBeijingDateKey(step.updatedAt))).length
    if (wish.completedAt && previousProgressDateSet.value.has(getBeijingDateKey(wish.completedAt))) total += 1
  })

  return total
})
const progressUsageTotalUnits = computed(() => progressUsageEvents.value.reduce((sum, event) => sum + event.units, 0))
const progressUsageDailyAverage = computed(() => progressUsageTotalUnits.value / Math.max(1, activePeriodDateKeys.value.length))
const previousProgressDailyAverage = computed(() => {
  const previousDateSet = new Set(previousComparableProgressDateKeys.value)
  const previousComparableCount = Math.max(1, previousComparableProgressDateKeys.value.length)
  let total = 0

  wishStore.rewardClaims.forEach((claim) => {
    if (claim.claimKind !== 'count_star_coin' || !claim.sourceWishId) return
    if (!previousDateSet.has(getBeijingDateKey(claim.createdAt))) return
    if (!activeLedgerMemberIdSet.value.has(claim.ownerId)) return
    total += Math.max(0, claim.quantity)
  })

  wishStore.wishes.forEach((wish) => {
    if (!activeLedgerMemberIdSet.value.has(wish.ownerId)) return
    total += wish.steps.filter((step) => step.isDone && previousDateSet.has(getBeijingDateKey(step.updatedAt))).length
    if (wish.completedAt && previousDateSet.has(getBeijingDateKey(wish.completedAt))) total += 1
  })

  return total / previousComparableCount
})
const progressUsageSelectedDateKey = ref<string | null>(null)
const progressUsageSummaryLabel = computed(() => progressUsageSelectedDateKey.value ? formatDateLabel(progressUsageSelectedDateKey.value) : activePeriodLabel.value)
const progressUsageFocusedEvents = computed(() => {
  if (!progressUsageSelectedDateKey.value) return progressUsageEvents.value
  return progressUsageEvents.value.filter((event) => event.dateKey === progressUsageSelectedDateKey.value)
})
const progressUsageFocusedTotalUnits = computed(() => progressUsageFocusedEvents.value.reduce((sum, event) => sum + event.units, 0))
const progressUsageCompareLine = computed(() => {
  const diff = progressUsageTotalUnits.value - previousProgressUnits.value
  if (!diff) return '与上一周期持平'
  const prefix = diff > 0 ? '比上一周期多' : '比上一周期少'
  const amount = Math.abs(diff)
  if (previousProgressUnits.value <= 0) return `${prefix} ${formatNumber(amount)} 次`
  const ratio = Math.round((amount / previousProgressUnits.value) * 100)
  return `${prefix} ${formatNumber(amount)} 次（${ratio}%）`
})
const progressUsageAverageLine = computed(() => `日均 ${progressUsageDailyAverage.value.toFixed(1)} 次`)
const progressUsageAverageCompareLine = computed(() => {
  const currentAverage = progressUsageDailyAverage.value
  const previousAverage = previousProgressDailyAverage.value
  const averageDiff = currentAverage - previousAverage

  if (previousAverage <= 0) {
    return averageDiff > 0 ? '日均较上一周期有提升' : '日均较上一周期回落'
  }

  const ratio = Math.round((Math.abs(averageDiff) / previousAverage) * 100)
  if (ratio < 5) {
    return '日均与上一周期基本持平'
  }

  const direction = averageDiff > 0 ? '多' : '少'
  return `日均比上一周期${direction} ${ratio}%`
})
const progressUsageCategorySummary = computed(() => {
  const grouped = new Map<string, number>()
  progressUsageFocusedEvents.value.forEach((event) => {
    grouped.set(event.category, (grouped.get(event.category) ?? 0) + event.units)
  })
  const total = progressUsageFocusedTotalUnits.value
  return [...grouped.entries()]
    .map(([category, units]) => ({ category, units, percent: total ? Math.round((units / total) * 100) : 0 }))
    .sort((left, right) => right.units - left.units)
})
const progressUsageTopCategories = computed(() => progressUsageCategorySummary.value.slice(0, 5).map((row) => row.category))
const progressUsageLegend = computed(() => {
  const base = progressUsageTopCategories.value.map((label, index) => ({ label, className: `review-usage-dot-${index}` }))
  if (progressUsageCategorySummary.value.length > progressUsageTopCategories.value.length) {
    base.push({ label: '其他', className: 'review-usage-dot-other' })
  }
  return base
})
const progressUsageChartDateKeys = computed(() => {
  if (activeRange.value === 'week' || activeRange.value === 'month') {
    return buildPeriodDateKeys(activeRange.value, anchorDateKey.value)
  }

  return activePeriodDateKeys.value
})
function buildProgressUsageLayers(categoryUnits: Map<string, number>, maxUnits: number) {
  if (!maxUnits) return [] as Array<{ key: string; className: string; ratio: number }>

  const layers = progressUsageTopCategories.value.map((category, index) => ({
    key: category,
    className: `review-usage-layer-${index}`,
    ratio: ((categoryUnits.get(category) ?? 0) / maxUnits) * 100,
  }))
  const others = [...categoryUnits.entries()]
    .filter(([category]) => !progressUsageTopCategories.value.includes(category))
    .reduce((sum, [, units]) => sum + units, 0)
  if (others > 0) layers.push({ key: '其他', className: 'review-usage-layer-other', ratio: (others / maxUnits) * 100 })
  return layers.filter((layer) => layer.ratio > 0)
}
function buildCoinUsageLayers(categoryUnits: Map<string, number>, maxUnits: number) {
  if (!maxUnits) return [] as Array<{ key: string; className: string; ratio: number }>

  const layers = coinUsageTopCategories.value.map((category, index) => ({
    key: category,
    className: `review-usage-layer-${index}`,
    ratio: ((categoryUnits.get(category) ?? 0) / maxUnits) * 100,
  }))
  const others = [...categoryUnits.entries()]
    .filter(([category]) => !coinUsageTopCategories.value.includes(category))
    .reduce((sum, [, units]) => sum + units, 0)
  if (others > 0) layers.push({ key: '其他', className: 'review-usage-layer-other', ratio: (others / maxUnits) * 100 })
  return layers.filter((layer) => layer.ratio > 0)
}
const progressUsageBars = computed(() => {
  const grouped = new Map<string, { total: number; categories: Map<string, number> }>()
  progressUsageChartDateKeys.value.forEach((dateKey) => grouped.set(dateKey, { total: 0, categories: new Map<string, number>() }))
  progressUsageEvents.value.forEach((event) => {
    const row = grouped.get(event.dateKey)
    if (!row) return
    row.total += event.units
    row.categories.set(event.category, (row.categories.get(event.category) ?? 0) + event.units)
  })
  const max = Math.max(1, ...[...grouped.values()].map((row) => row.total))
  return progressUsageChartDateKeys.value.map((dateKey) => {
    const row = grouped.get(dateKey) ?? { total: 0, categories: new Map<string, number>() }
    return {
      dateKey,
      total: row.total,
      weekdayLabel: weekdayLabels[getMondayBasedWeekdayIndex(dateKey)] ?? '-',
      dayLabel: `${parseDateKey(dateKey).day}`,
      hasValue: row.total > 0,
      active: progressUsageSelectedDateKey.value === dateKey,
      layers: buildProgressUsageLayers(row.categories, max),
    }
  })
})
const progressUsageAverageAxis = computed(() => {
  const max = Math.max(1, ...progressUsageBars.value.map((row) => row.total))
  const ratio = Math.min(100, (progressUsageTotalUnits.value / Math.max(1, activePeriodDateKeys.value.length) / max) * 100)
  return { bottom: `${WEEK_CHART_AXIS_SPACE_REM + (ratio / 100) * (WEEK_CHART_HEIGHT_REM - WEEK_CHART_AXIS_SPACE_REM)}rem`, label: '平均' }
})
const progressUsageAxisTicks = computed(() => {
  const max = Math.max(1, ...progressUsageBars.value.map((row) => row.total))
  const mid = Math.round(max / 2)
  const levels = [max, mid, 0]
  return levels.map((value, index) => ({
    key: `${value}-${index}`,
    label: `${value}`,
    bottom: `${WEEK_CHART_AXIS_SPACE_REM + ((value / max) * (WEEK_CHART_HEIGHT_REM - WEEK_CHART_AXIS_SPACE_REM))}rem`,
  }))
})
const progressUsageWishRows = computed<ProgressUsageWishRow[]>(() => {
  const grouped = new Map<string, ProgressUsageWishRow>()
  progressUsageFocusedEvents.value.forEach((event) => {
    const current = grouped.get(event.wishId) ?? { wishId: event.wishId, title: event.title, category: event.category, units: 0 }
    current.units += event.units
    grouped.set(event.wishId, current)
  })
  return [...grouped.values()].sort((left, right) => right.units - left.units)
})
const progressUsageMaxWishUnits = computed(() => Math.max(1, ...progressUsageWishRows.value.map((row) => row.units)))
const showProgressUsageCopy = computed(() => activeMetric.value === 'progress' && activeRange.value !== 'year')
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

    if (rewardClaimHeatKinds.has(claim.claimKind)) {
      existingRow.claimCount += 1
    }

    if (claim.claimKind === 'reward_deposit') {
      existingRow.spending += Math.abs(Math.min(0, resolveClaimStarCoinDelta(claim)))
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
const claimStatsMaxCount = computed(() => Math.max(1, ...claimStatsRows.value.map((row) => row.claimCount)))
const claimStatsMaxSpending = computed(() => Math.max(1, ...claimStatsRows.value.map((row) => row.spending)))
const claimCountRows = computed(() => claimStatsRows.value.filter((row) => row.claimCount > 0).sort((left, right) => right.claimCount - left.claimCount || right.spending - left.spending))
const claimSpendingRows = computed(() => claimStatsRows.value.filter((row) => row.spending > 0).sort((left, right) => right.spending - left.spending || right.claimCount - left.claimCount))
const claimTotalCount = computed(() => claimStatsRows.value.reduce((sum, row) => sum + row.claimCount, 0))
const claimTotalSpending = computed(() => claimStatsRows.value.reduce((sum, row) => sum + row.spending, 0))

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

const messageBookEntries = computed(() => activeRange.value === 'year' ? [] : currentPeriodComments.value.slice(0, 8))
const visibleMessageBookEntries = computed(() => {
  return isMessageListExpanded.value ? messageBookEntries.value : messageBookEntries.value.slice(0, 4)
})
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
  isCompletedListExpanded.value = false
  isMessageListExpanded.value = false
  progressUsageSelectedDateKey.value = null
  coinUsageSelectedDateKey.value = null
})

function toggleProgressUsageDate(dateKey: string) {
  progressUsageSelectedDateKey.value = progressUsageSelectedDateKey.value === dateKey ? null : dateKey
}

function toggleCoinUsageDate(dateKey: string) {
  coinUsageSelectedDateKey.value = coinUsageSelectedDateKey.value === dateKey ? null : dateKey
}

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

function getEventClaimScore(event: ReviewEvent) {
  return event.rewardClaimKind && rewardClaimHeatKinds.has(event.rewardClaimKind) ? 1 : 0
}

function getEventCompletedScore(event: ReviewEvent) {
  return event.kind === 'wish_complete' ? 1 : 0
}

function getEventScore(event: ReviewEvent, metric: ReviewMetric) {
  if (metric === 'messages') return event.messageScore
  if (metric === 'progress') return event.progressScore
  if (metric === 'coins') return event.coinScore
  if (metric === 'claims') return getEventClaimScore(event)
  return getEventCompletedScore(event)
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
  if (activeMetric.value === 'claims') return `${formatNumber(cell.claims)} 次领奖`
  if (activeMetric.value === 'completed') return `${formatNumber(cell.completed)} 条完结`
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
    claims: 0,
    completed: 0,
    income: 0,
    spending: 0,
    events: [],
  }))
  return [...blanks, ...cells]
}

function withCalendarWeekdayBlanks(cells: HeatCell[]) {
  const leadingCells = withLeadingWeekdayBlanks(cells)
  if (!leadingCells.length) return []

  const trailingBlankCount = (7 - (leadingCells.length % 7)) % 7
  const leadingFirstCell = leadingCells[0]

  const trailingBlanks: HeatCell[] = Array.from({ length: trailingBlankCount }, (_, index) => ({
    dateKey: `blank-tail-${leadingFirstCell.dateKey}-${index}`,
    day: 0,
    dayLabel: '',
    weekdayLabel: '',
    isToday: false,
    isBlank: true,
    score: 0,
    level: 0,
    messages: 0,
    progress: 0,
    claims: 0,
    completed: 0,
    income: 0,
    spending: 0,
    events: [],
  }))

  return [...leadingCells, ...trailingBlanks]
}

function getPeriodLabel(range: ReviewRange, anchorKey: string) {
  if (range === 'week') {
    const days = buildWeekDays(anchorKey)
    return `${formatDateLabel(days[0])} - ${formatDateLabel(days[6])}`
  }
  if (range === 'year') return `${parseDateKey(anchorKey).year} 年`
  return formatMonthLabel(anchorKey.slice(0, 7))
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
  return getThreadEventKindLabel(eventKind)
}

function getCompletedWishPreviewRows(wishId: string) {
  return wishStore.getWishThreadEntries(wishId).slice(0, 2)
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
  <section :class="['monthly-preview-page', `heat-theme-${activeUsagePalette}`]">
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

      <div v-if="activeRange !== 'year'" class="monthly-weekday-row" aria-hidden="true">
        <span v-for="label in weekdayLabels" :key="label">{{ label }}</span>
      </div>

      <div :class="['monthly-thermometer-groups', `is-${activeRange}`]" :aria-label="`${activePeriodLabel}${activeMetricOption.label}热力图`">
        <article v-for="group in displayHeatGroups" :key="group.id" class="monthly-thermometer-group">
          <span v-if="activeRange === 'year'" class="monthly-month-label">{{ group.label }}</span>
          <div v-if="activeRange === 'year'" class="monthly-weekday-row monthly-weekday-row-mini" aria-hidden="true">
            <span v-for="label in weekdayLabels" :key="`${group.id}-${label}`">{{ label }}</span>
          </div>
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
      <p class="monthly-heat-inline-summary">{{ compactInsightLine }}</p>
    </section>

    <section v-if="showProgressUsageCopy" :class="['review-usage-layout', `theme-${activeUsagePalette}`]">
      <article class="monthly-preview-panel review-usage-panel">
        <div class="review-usage-header">
          <strong>{{ activeRange === 'week' ? '本周推进分布' : '本月推进分布' }}</strong>
          <div class="review-usage-header-summary">
            <span class="review-usage-caption">{{ progressUsageSummaryLabel }} · <strong class="review-usage-caption-strong">{{ progressUsageSelectedDateKey ? progressUsageFocusedTotalUnits : progressUsageTotalUnits }} 次推进</strong></span>
            <p class="review-usage-palette-note">每日自动轮换，今天是 <span class="review-usage-palette-chip">{{ activeUsagePaletteLabel }}</span></p>
          </div>
        </div>
        <div class="review-usage-summary">
          <div v-if="!progressUsageSelectedDateKey" class="review-usage-summary-inline">
            <p class="review-usage-compare">{{ progressUsageCompareLine }}</p>
            <div class="review-usage-avg-row">
              <p class="review-usage-avg">{{ progressUsageAverageLine }}</p>
              <p class="review-usage-avg">{{ progressUsageAverageCompareLine }}</p>
            </div>
          </div>
          <p v-else class="review-usage-avg">点击同一柱可返回{{ activeRange === 'week' ? '本周' : '本月' }}视图</p>
        </div>

        <div class="review-usage-week-panel">
          <div class="review-usage-week-axis" aria-hidden="true">
            <span class="review-usage-week-axis-average" :style="{ bottom: progressUsageAverageAxis.bottom }">{{ progressUsageAverageAxis.label }}</span>
            <span v-for="tick in progressUsageAxisTicks" :key="tick.key" :style="{ bottom: tick.bottom }">{{ tick.label }}</span>
          </div>

          <div class="review-usage-week-chart-wrap">
            <div class="review-usage-average-line" :style="{ bottom: progressUsageAverageAxis.bottom }" aria-hidden="true"></div>
            <div :class="['review-usage-week-chart', { 'has-selection': progressUsageSelectedDateKey !== null, 'is-month': activeRange === 'month' }]" :style="{ gridTemplateColumns: `repeat(${progressUsageBars.length}, minmax(0, 1fr))` }">
              <article
                v-for="bar in progressUsageBars"
                :key="bar.dateKey"
                :class="['review-usage-week-bar', { active: bar.active, empty: !bar.hasValue }]"
                :title="`${formatDateLabel(bar.dateKey)} · ${bar.total} 次`"
                @click="bar.hasValue && toggleProgressUsageDate(bar.dateKey)"
              >
                <i>
                  <b v-for="layer in bar.layers" :key="layer.key" :class="['review-usage-layer', layer.className]" :style="{ height: `${layer.ratio}%` }"></b>
                </i>
                <span v-if="activeRange === 'week'">{{ bar.weekdayLabel }}</span>
                <em v-if="activeRange === 'week'">{{ bar.dayLabel }}</em>
              </article>
            </div>
          </div>
        </div>

        <div class="review-usage-meta">
          <div class="review-usage-legend" aria-hidden="true">
            <span v-for="layer in progressUsageLegend" :key="layer.label"><i :class="layer.className"></i>{{ layer.label }}</span>
          </div>
          <p v-if="progressUsageCategorySummary.length" class="review-usage-category-inline">
            <span v-for="row in progressUsageCategorySummary" :key="row.category">{{ row.category }} {{ formatNumber(row.units) }} 次（{{ row.percent }}%）</span>
          </p>
          <p v-else class="monthly-empty-note">这个范围里还没有推进记录。</p>
        </div>
      </article>

      <article class="monthly-preview-panel review-usage-panel">
        <div class="monthly-section-head">
          <div><h2>愿望明细</h2></div>
          <span>{{ progressUsageWishRows.length }} 个</span>
        </div>
        <div class="review-usage-wish-list">
          <p v-if="!progressUsageWishRows.length" class="monthly-empty-note">这个范围里还没有愿望推进。</p>
          <RouterLink
            v-for="row in progressUsageWishRows"
            :key="row.wishId"
            class="review-usage-wish-row"
            :to="{ name: 'wish-detail', params: { id: row.wishId } }"
          >
            <div class="review-usage-wish-copy">
              <strong>{{ row.title }}</strong>
              <span>{{ row.category }} · {{ formatNumber(row.units) }} 次</span>
            </div>
            <i><b :style="{ width: `${Math.round((row.units / progressUsageMaxWishUnits) * 100)}%` }"></b></i>
          </RouterLink>
        </div>
      </article>
    </section>

    <section v-else-if="activeMetric === 'messages'" class="monthly-fact-layout">
      <article class="monthly-preview-panel monthly-message-panel">
        <div class="monthly-section-head">
          <div><p>留言册</p><h2>{{ activeRange === 'year' ? '年度留言重点' : '本期留言重点' }}</h2></div>
          <span>{{ activeRange === 'year' ? `${yearMessageSummary?.count ?? 0} 条` : `${messageBookEntries.length} 条` }}</span>
        </div>
        <div v-if="activeRange === 'year'" class="monthly-year-message-summary">
          <strong>{{ yearMessageSummary?.label }}</strong>
          <p>年视图先只看高点。</p>
        </div>
        <div v-else class="monthly-message-list">
          <RouterLink
            v-for="entry in visibleMessageBookEntries"
            :key="entry.id"
            class="monthly-message-item monthly-message-link"
            :to="{ name: 'wish-detail', params: { id: entry.wishId } }"
          >
            <div>
              <span>{{ entry.authorName }} · {{ entry.timeLabel }}</span>
              <strong>在 {{ entry.wishOwnerName }} 的愿望「{{ entry.wishTitle }}」留言</strong>
            </div>
            <p>{{ entry.text }}</p>
          </RouterLink>
          <p v-if="!messageBookEntries.length" class="monthly-empty-note">这个范围里还没有留言。</p>
        </div>
        <button v-if="messageBookEntries.length > 4 && activeRange !== 'year'" type="button" class="monthly-progress-more" :aria-expanded="isMessageListExpanded" @click="isMessageListExpanded = !isMessageListExpanded">
          {{ isMessageListExpanded ? '收起留言' : `展开其余 ${messageBookEntries.length - 4} 条留言` }}
        </button>
      </article>
    </section>

    <section v-else-if="activeMetric === 'coins'" class="monthly-fact-layout">
      <section v-if="showCoinUsageCopy" :class="['review-usage-layout', `theme-${activeUsagePalette}`]">
        <article class="monthly-preview-panel review-usage-panel">
          <div class="review-usage-header">
            <strong>{{ activeRange === 'week' ? '本周星币入账分布' : '本月星币入账分布' }}</strong>
            <div class="review-usage-header-summary">
              <span class="review-usage-caption">{{ coinUsageSummaryLabel }} · <strong class="review-usage-caption-strong">{{ formatNumber(coinUsageSelectedDateKey ? coinUsageFocusedTotalUnits : coinUsageTotalUnits) }} 星币入账</strong></span>
              <p class="review-usage-palette-note">每日自动轮换，今天是 <span class="review-usage-palette-chip">{{ activeUsagePaletteLabel }}</span></p>
            </div>
          </div>
          <div class="review-usage-summary">
            <div v-if="!coinUsageSelectedDateKey" class="review-usage-summary-inline">
              <p class="review-usage-compare">{{ coinUsageCompareLine }}</p>
              <div class="review-usage-avg-row">
                <p class="review-usage-avg">{{ coinUsageAverageLine }}</p>
                <p class="review-usage-avg">{{ coinUsageAverageCompareLine }}</p>
              </div>
            </div>
            <p v-else class="review-usage-avg">点击同一柱可返回{{ activeRange === 'week' ? '本周' : '本月' }}视图</p>
          </div>

          <div class="review-usage-week-panel">
            <div class="review-usage-week-axis" aria-hidden="true">
              <span class="review-usage-week-axis-average" :style="{ bottom: coinUsageAverageAxis.bottom }">{{ coinUsageAverageAxis.label }}</span>
              <span v-for="tick in coinUsageAxisTicks" :key="tick.key" :style="{ bottom: tick.bottom }">{{ tick.label }}</span>
            </div>

            <div class="review-usage-week-chart-wrap">
              <div class="review-usage-average-line" :style="{ bottom: coinUsageAverageAxis.bottom }" aria-hidden="true"></div>
              <div :class="['review-usage-week-chart', { 'has-selection': coinUsageSelectedDateKey !== null, 'is-month': activeRange === 'month' }]" :style="{ gridTemplateColumns: `repeat(${coinUsageBars.length}, minmax(0, 1fr))` }">
                <article
                  v-for="bar in coinUsageBars"
                  :key="bar.dateKey"
                  :class="['review-usage-week-bar', { active: bar.active, empty: !bar.hasValue }]"
                  :title="`${formatDateLabel(bar.dateKey)} · ${formatNumber(bar.total)} 星币入账`"
                  @click="bar.hasValue && toggleCoinUsageDate(bar.dateKey)"
                >
                  <i>
                    <b v-for="layer in bar.layers" :key="layer.key" :class="['review-usage-layer', layer.className]" :style="{ height: `${layer.ratio}%` }"></b>
                  </i>
                  <span v-if="activeRange === 'week'">{{ bar.weekdayLabel }}</span>
                  <em v-if="activeRange === 'week'">{{ bar.dayLabel }}</em>
                </article>
              </div>
            </div>
          </div>

          <div class="review-usage-meta">
            <div class="review-usage-legend" aria-hidden="true">
              <span v-for="layer in coinUsageLegend" :key="layer.label"><i :class="layer.className"></i>{{ layer.label }}</span>
            </div>
            <p v-if="coinUsageCategorySummary.length" class="review-usage-category-inline">
              <span v-for="row in coinUsageCategorySummary" :key="row.category">{{ row.category }} {{ formatNumber(row.units) }} 星币（{{ row.percent }}%）</span>
            </p>
            <p v-else class="monthly-empty-note">这个范围里还没有星币入账记录。</p>
          </div>
        </article>

        <article class="monthly-preview-panel review-usage-panel monthly-coin-wish-panel">
          <div class="monthly-section-head">
            <div><h2>星币入账愿望明细</h2></div>
            <span>{{ formatNumber(coinUsageSelectedDateKey ? coinUsageFocusedTotalUnits : coinUsageTotalUnits) }} 星币入账</span>
          </div>
          <div class="review-usage-wish-list">
            <p v-if="!coinUsageWishRows.length" class="monthly-empty-note">这个范围里还没有与愿望关联的星币入账。</p>
            <RouterLink
              v-for="row in coinUsageWishRows"
              v-else
              :key="row.wishId"
              class="review-usage-wish-row"
              :to="{ name: 'wish-detail', params: { id: row.wishId } }"
            >
              <div class="review-usage-wish-copy">
                <strong>{{ row.title }}</strong>
                <span>{{ row.category }} · +{{ formatNumber(row.units) }} 星币</span>
              </div>
              <i><b :style="{ width: `${Math.max(6, Math.round((row.units / coinUsageMaxWishUnits) * 100))}%` }"></b></i>
            </RouterLink>
          </div>
        </article>
      </section>

      <article class="monthly-preview-panel monthly-ledger-panel">
        <div class="monthly-section-head">
          <div>
            <h2>本期入账、支出与结余</h2>
          </div>
        </div>
        <div v-if="hasStarCoinWaterfall" class="monthly-waterfall" aria-label="星币入账与支出文字汇总">
          <div class="monthly-waterfall-stage is-text-only" :style="{ gridTemplateColumns: `repeat(${starCoinWaterfallSteps.length}, minmax(0, 1fr))` }">
            <article
              v-for="step in starCoinWaterfallSteps"
              :key="step.key"
              class="monthly-waterfall-step"
              :class="`is-${step.tone}`"
            >
              <div class="monthly-waterfall-copy">
                <span>{{ step.label }}</span>
                <strong>{{ step.isEndpoint ? formatNumber(step.signedAmount) : `${step.signedAmount > 0 ? '+' : step.signedAmount < 0 ? '-' : ''}${formatNumber(step.amount)}` }}</strong>
              </div>
            </article>
          </div>
        </div>
        <p v-else class="monthly-empty-note">这个范围里还没有星币入账或支出变化。</p>
      </article>
    </section>

    <section v-else-if="activeMetric === 'claims'" class="monthly-fact-layout">
      <section :class="['review-usage-layout', `theme-${activeUsagePalette}`]">
        <article class="monthly-preview-panel review-usage-panel">
          <div class="review-usage-header">
            <strong>{{ activeRange === 'week' ? '本周领奖次数分布' : '本月领奖次数分布' }}</strong>
            <div class="review-usage-header-summary">
              <span class="review-usage-caption">{{ activePeriodLabel }} · <strong class="review-usage-caption-strong">{{ claimTotalCount }} 次</strong></span>
            </div>
          </div>
          <div class="review-usage-wish-list">
            <p v-if="!claimCountRows.length" class="monthly-empty-note">这个范围里还没有领奖次数记录。</p>
            <RouterLink
              v-for="row in claimCountRows"
              v-else
              :key="`count-${row.key}`"
              class="review-usage-wish-row"
              :to="{ name: 'space', hash: '#space-reward-center' }"
            >
              <div class="review-usage-wish-copy">
                <strong :title="row.label">{{ row.label }}</strong>
                <span>{{ row.claimCount }} 次</span>
              </div>
              <i><b :style="{ width: `${Math.max(6, Math.round((row.claimCount / claimStatsMaxCount) * 100))}%` }"></b></i>
            </RouterLink>
          </div>
        </article>

        <article class="monthly-preview-panel review-usage-panel monthly-claims-panel">
          <div class="review-usage-header">
            <strong>{{ activeRange === 'week' ? '本周领奖花费分布' : '本月领奖花费分布' }}</strong>
            <div class="review-usage-header-summary">
              <span class="review-usage-caption">{{ activePeriodLabel }} · <strong class="review-usage-caption-strong">{{ formatNumber(claimTotalSpending) }} 星币</strong></span>
            </div>
          </div>
          <div class="review-usage-wish-list">
            <p v-if="!claimSpendingRows.length" class="monthly-empty-note">这个范围里还没有领奖花费记录。</p>
            <RouterLink
              v-for="row in claimSpendingRows"
              v-else
              :key="`spending-${row.key}`"
              class="review-usage-wish-row"
              :to="{ name: 'space', hash: '#space-reward-center' }"
            >
              <div class="review-usage-wish-copy">
                <strong :title="row.label">{{ row.label }}</strong>
                <span>花费 {{ formatNumber(row.spending) }}</span>
              </div>
              <i><b :style="{ width: `${Math.max(6, Math.round((row.spending / claimStatsMaxSpending) * 100))}%` }"></b></i>
            </RouterLink>
          </div>
        </article>
      </section>
    </section>

    <section v-else class="monthly-fact-layout">
      <article class="monthly-preview-panel monthly-completed-panel">
        <div class="monthly-section-head">
          <div><p>已完本愿望</p><h2>本期完成册页</h2></div>
          <span>{{ completedWishJournals.length }} 本</span>
        </div>
        <div v-if="completedWishJournals.length" class="monthly-completed-list">
          <article v-for="wish in (isCompletedListExpanded ? completedWishJournals : completedWishJournals.slice(0, 3))" :key="wish.id" class="monthly-completed-card">
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
            <RouterLink class="monthly-completed-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">看完整过程</RouterLink>
          </article>
        </div>
        <button v-if="completedWishJournals.length > 3" type="button" class="monthly-progress-more" :aria-expanded="isCompletedListExpanded" @click="isCompletedListExpanded = !isCompletedListExpanded">
          {{ isCompletedListExpanded ? '收起完成册页' : `展开其余 ${completedWishJournals.length - 3} 本` }}
        </button>
        <p v-else class="monthly-empty-note">这一段还没有新增完本。</p>
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
  --heat-today-ring: rgba(126, 96, 76, 0.28);
  --heat-bubble-bg: #241b16;
  --heat-bubble-text: #fff8ee;
  display: grid;
  gap: 0.72rem;
  color: var(--text-main);
}

.monthly-preview-page.heat-theme-ocean { --heat-1: #deebf7; --heat-2: #c5def1; --heat-3: #a8cee8; --heat-4: #6ba8d4; --heat-5: #447cae; --heat-today-ring: rgba(68, 124, 174, 0.34); --heat-bubble-bg: #447cae; --heat-bubble-text: #f7fbff; }
.monthly-preview-page.heat-theme-candy { --heat-1: #ffe0b8; --heat-2: #ffd166; --heat-3: #35c7c0; --heat-4: #6b79ff; --heat-5: #ff4f87; --heat-today-ring: rgba(255, 79, 135, 0.34); --heat-bubble-bg: #ff4f87; --heat-bubble-text: #fff8fd; }
.monthly-preview-page.heat-theme-sunset { --heat-1: #ffe3c2; --heat-2: #ffd9a8; --heat-3: #ffd166; --heat-4: #ff9f43; --heat-5: #ff6d3a; --heat-today-ring: rgba(255, 109, 58, 0.34); --heat-bubble-bg: #ff6d3a; --heat-bubble-text: #fff9f4; }
.monthly-preview-page.heat-theme-aurora { --heat-1: #d8f4e5; --heat-2: #b7f1ce; --heat-3: #9ee467; --heat-4: #49cc7e; --heat-5: #1ca8a1; --heat-today-ring: rgba(28, 168, 161, 0.34); --heat-bubble-bg: #1ca8a1; --heat-bubble-text: #f4fffd; }
.monthly-preview-page.heat-theme-neon { --heat-1: #ffe4a8; --heat-2: #ffbf3c; --heat-3: #00e0b8; --heat-4: #00c2ff; --heat-5: #7a3cff; --heat-today-ring: rgba(122, 60, 255, 0.34); --heat-bubble-bg: #7a3cff; --heat-bubble-text: #faf7ff; }
.monthly-preview-page.heat-theme-tropical { --heat-1: #e2f5c5; --heat-2: #b6e880; --heat-3: #ffd15a; --heat-4: #00b7c7; --heat-5: #1f9f7a; --heat-today-ring: rgba(31, 159, 122, 0.34); --heat-bubble-bg: #1f9f7a; --heat-bubble-text: #f6fff9; }
.monthly-preview-page.heat-theme-macaron { --heat-1: #f5e6c6; --heat-2: #f0d8a8; --heat-3: #c8deaf; --heat-4: #93bfd4; --heat-5: #8b8fd8; --heat-today-ring: rgba(139, 143, 216, 0.34); --heat-bubble-bg: #8b8fd8; --heat-bubble-text: #fbfbff; }

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
  font-size: var(--type-page-title-size);
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
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
  font-size: 0.78rem;
  line-height: 1.42;
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
  padding: 0.66rem;
  border-radius: 16px;
}

.monthly-switch-panel {
  padding: 0.58rem;
}

.monthly-summary-card {
  display: grid;
  gap: 0.14rem;
}

.monthly-progress-metrics strong,
.monthly-summary-card strong,
.monthly-year-message-summary strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 1.04rem;
  font-weight: 700;
  line-height: 1.05;
}

.monthly-switch-row,
.monthly-fact-layout,
.monthly-progress-metrics {
  display: grid;
  gap: 0.44rem;
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
  display: block;
  color: var(--text-soft);
  font-size: 0.66rem;
  line-height: 1;
  text-align: center;
}

.monthly-weekday-row-mini {
  gap: 0.1rem;
}

.monthly-weekday-row-mini span {
  color: color-mix(in srgb, var(--text-soft) 88%, white);
  font-size: 0.58rem;
  line-height: 1;
}

.monthly-thermometer-groups {
  display: grid;
  gap: 0.48rem;
}

.monthly-thermometer-groups.is-year {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.34rem;
  align-items: start;
}

.monthly-thermometer-group {
  display: grid;
  align-content: start;
  gap: 0.16rem;
  min-width: 0;
}

.monthly-thermometer-groups.is-year .monthly-thermometer-group {
  gap: 0.12rem;
}

.monthly-month-label {
  display: block;
  color: var(--text-soft);
  font-size: 0.68rem;
  line-height: 1;
}

.monthly-thermometer-groups.is-year .monthly-month-label {
  font-weight: 600;
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
  outline: 2px solid var(--heat-today-ring);
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
  background: var(--heat-bubble-bg);
  color: var(--heat-bubble-text);
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

.monthly-heat-inline-summary {
  margin: 0;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: 0.78rem;
  line-height: 1.42;
}

.review-usage-layout {
  display: grid;
  gap: 0.88rem;
}

.review-usage-panel {
  --usage-accent: #5f8b62;
  --usage-accent-soft: #91b875;
  --usage-accent-pale: #c8dba5;
  --usage-accent-deep: #365f4f;
  --usage-layer-0: var(--usage-accent);
  --usage-layer-1: var(--usage-accent-soft);
  --usage-layer-2: var(--usage-accent-pale);
  --usage-layer-3: color-mix(in srgb, var(--usage-accent-soft) 72%, white);
  --usage-layer-4: color-mix(in srgb, var(--usage-accent-pale) 58%, white);
  --usage-layer-other: #b9bcc3;
  --usage-muted: #7f927f;
  --usage-track: color-mix(in srgb, var(--usage-accent-pale) 42%, white);
  display: grid;
  gap: 0.56rem;
}

.review-usage-layout.theme-ocean .review-usage-panel {
  --usage-accent: #447cae;
  --usage-accent-soft: #6ba8d4;
  --usage-accent-pale: #a8cee8;
  --usage-accent-deep: #2f5f8f;
  --usage-layer-0: #447cae;
  --usage-layer-1: #6ba8d4;
  --usage-layer-2: #a8cee8;
  --usage-layer-3: #c5def1;
  --usage-layer-4: #deebf7;
  --usage-muted: #6f849e;
}

.review-usage-layout.theme-candy .review-usage-panel {
  --usage-accent: #ff4f87;
  --usage-accent-soft: #6b79ff;
  --usage-accent-pale: #35c7c0;
  --usage-accent-deep: #9f2f61;
  --usage-layer-0: #ff4f87;
  --usage-layer-1: #6b79ff;
  --usage-layer-2: #35c7c0;
  --usage-layer-3: #ff9d3d;
  --usage-layer-4: #ffd166;
  --usage-muted: #7a6282;
}

.review-usage-layout.theme-sunset .review-usage-panel {
  --usage-accent: #ff6d3a;
  --usage-accent-soft: #ff9f43;
  --usage-accent-pale: #ffd166;
  --usage-accent-deep: #b84f2f;
  --usage-layer-0: #ff6d3a;
  --usage-layer-1: #ff9f43;
  --usage-layer-2: #ffd166;
  --usage-layer-3: #ff8aa1;
  --usage-layer-4: #ffd9a8;
  --usage-muted: #8f6d5f;
}

.review-usage-layout.theme-aurora .review-usage-panel {
  --usage-accent: #1ca8a1;
  --usage-accent-soft: #49cc7e;
  --usage-accent-pale: #9ee467;
  --usage-accent-deep: #176f76;
  --usage-layer-0: #1ca8a1;
  --usage-layer-1: #49cc7e;
  --usage-layer-2: #9ee467;
  --usage-layer-3: #5f8bff;
  --usage-layer-4: #b7f1ce;
  --usage-muted: #5f7f78;
}

.review-usage-layout.theme-neon .review-usage-panel {
  --usage-accent: #7a3cff;
  --usage-accent-soft: #00c2ff;
  --usage-accent-pale: #00e0b8;
  --usage-accent-deep: #4f2bb0;
  --usage-layer-0: #7a3cff;
  --usage-layer-1: #00c2ff;
  --usage-layer-2: #00e0b8;
  --usage-layer-3: #ff5e6c;
  --usage-layer-4: #ffbf3c;
  --usage-muted: #6f6698;
}

.review-usage-layout.theme-tropical .review-usage-panel {
  --usage-accent: #1f9f7a;
  --usage-accent-soft: #00b7c7;
  --usage-accent-pale: #ffd15a;
  --usage-accent-deep: #1a6f65;
  --usage-layer-0: #1f9f7a;
  --usage-layer-1: #00b7c7;
  --usage-layer-2: #ffd15a;
  --usage-layer-3: #ff7b54;
  --usage-layer-4: #b6e880;
  --usage-muted: #607f78;
}

.review-usage-layout.theme-macaron .review-usage-panel {
  --usage-accent: #8b8fd8;
  --usage-accent-soft: #93bfd4;
  --usage-accent-pale: #c8deaf;
  --usage-accent-deep: #6569b1;
  --usage-layer-0: #8b8fd8;
  --usage-layer-1: #93bfd4;
  --usage-layer-2: #c8deaf;
  --usage-layer-3: #d3a4b8;
  --usage-layer-4: #f0d8a8;
  --usage-muted: #7f8198;
}

.review-usage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  color: var(--text-main);
}

.review-usage-header strong {
  font-family: var(--font-heading);
  font-size: 1rem;
  line-height: 1.2;
}

.review-usage-header-summary {
  display: grid;
  justify-items: end;
  gap: 0.2rem;
}

.review-usage-palette-note {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  color: color-mix(in srgb, var(--text-soft) 88%, white);
  font-size: 0.62rem;
  line-height: 1.2;
}

.review-usage-palette-chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid color-mix(in srgb, var(--usage-accent-deep) 30%, white);
  border-radius: 999px;
  background: color-mix(in srgb, var(--usage-accent) 14%, white);
  color: var(--usage-accent-deep);
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.01em;
  padding: 0.14rem 0.42rem;
}

.review-usage-caption {
  color: var(--text-soft);
  font-size: 0.76rem;
  line-height: 1.35;
}

.review-usage-caption-strong {
  color: var(--text-main);
  font-weight: 700;
}

.review-usage-summary-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.review-usage-avg-row {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: nowrap;
}

.review-usage-compare,
.review-usage-avg {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.35;
}

.review-usage-compare {
  color: var(--usage-accent);
}

.review-usage-avg {
  color: var(--text-soft);
}

.review-usage-week-panel {
  display: grid;
  grid-template-columns: 1.8rem minmax(0, 1fr);
  gap: 0.38rem;
  align-items: stretch;
}

.review-usage-week-axis {
  position: relative;
  height: 8.2rem;
}

.review-usage-week-axis span {
  position: absolute;
  right: 0;
  transform: translateY(50%);
  color: color-mix(in srgb, var(--usage-accent-deep) 40%, white);
  font-size: 0.66rem;
  line-height: 1;
}

.review-usage-week-axis span.review-usage-week-axis-average {
  color: #be5f86;
  font-size: 0.68rem;
  font-weight: 600;
}

.review-usage-week-chart-wrap {
  position: relative;
}

.review-usage-average-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 1px;
  background-image: repeating-linear-gradient(to right, color-mix(in srgb, #d9799a 74%, transparent) 0 10px, transparent 10px 18px);
  z-index: 3;
  pointer-events: none;
}

.review-usage-week-chart {
  display: grid;
  gap: 0.28rem;
  height: 8.2rem;
  align-items: end;
  justify-items: stretch;
}

.review-usage-week-chart.is-month {
  justify-items: center;
}

.review-usage-week-bar {
  display: grid;
  grid-template-rows: 1fr auto auto;
  gap: 0.18rem;
  justify-items: center;
  position: relative;
  z-index: 1;
  height: 100%;
  cursor: pointer;
  transition: opacity 180ms ease, transform 180ms ease;
}

.review-usage-week-chart.is-month .review-usage-week-bar {
  width: min(100%, 0.96rem);
}

.review-usage-week-bar.empty {
  cursor: default;
}

.review-usage-week-bar i {
  display: flex;
  flex-direction: column-reverse;
  justify-content: flex-start;
  align-self: stretch;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 0.3rem;
  transition: box-shadow 180ms ease, filter 180ms ease;
}

.review-usage-week-chart.has-selection .review-usage-week-bar:not(.active) {
  opacity: 0.34;
}

.review-usage-week-bar.active {
  transform: translateY(-1px);
}

.review-usage-week-bar.active i {
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--usage-accent) 28%, transparent);
  filter: brightness(1.1);
}

.review-usage-layer {
  display: block;
  width: 100%;
}

.review-usage-layer:first-child {
  border-bottom-left-radius: 0.3rem;
  border-bottom-right-radius: 0.3rem;
}

.review-usage-layer:last-child {
  border-top-left-radius: 0.3rem;
  border-top-right-radius: 0.3rem;
}

.review-usage-layer-0,
.review-usage-dot-0 { background: var(--usage-layer-0); }

.review-usage-layer-1,
.review-usage-dot-1 { background: var(--usage-layer-1); }

.review-usage-layer-2,
.review-usage-dot-2 { background: var(--usage-layer-2); }

.review-usage-layer-3,
.review-usage-dot-3 { background: var(--usage-layer-3); }

.review-usage-layer-4,
.review-usage-dot-4 { background: var(--usage-layer-4); }

.review-usage-layer-other,
.review-usage-dot-other { background: var(--usage-layer-other); }

.review-usage-week-bar span,
.review-usage-week-bar em {
  font-size: 0.64rem;
  color: var(--usage-muted);
  font-style: normal;
  line-height: 1;
  transition: color 180ms ease, font-weight 180ms ease;
}

.review-usage-week-bar.active span,
.review-usage-week-bar.active em {
  color: var(--usage-accent-deep);
  font-weight: 600;
}

.review-usage-week-bar.empty span,
.review-usage-week-bar.empty em {
  color: color-mix(in srgb, var(--usage-muted) 65%, white);
}

.review-usage-meta {
  display: grid;
  gap: 0.24rem;
}

.review-usage-legend {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, max-content));
  justify-content: start;
  gap: 0.34rem 0.72rem;
  color: var(--usage-muted);
  font-size: 0.68rem;
}

.review-usage-legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.24rem;
  min-width: 0;
}

.review-usage-legend i {
  display: inline-block;
  width: 0.42rem;
  height: 0.42rem;
  flex: 0 0 auto;
  border-radius: 999px;
}

.review-usage-category-inline {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.6;
}

.review-usage-category-inline span + span::before {
  content: ' · ';
  color: color-mix(in srgb, var(--usage-muted) 65%, white);
}

.review-usage-wish-list {
  display: grid;
  gap: 0.52rem;
}

.review-usage-wish-row {
  display: grid;
  gap: 0.24rem;
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.52);
  color: inherit;
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.review-usage-wish-row:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--usage-accent) 24%, rgba(79, 49, 35, 0.12));
  background: color-mix(in srgb, var(--usage-accent-pale) 10%, rgba(255, 255, 255, 0.88));
}

.review-usage-wish-copy {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.7rem;
}

.review-usage-wish-copy strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: 0.88rem;
  line-height: 1.2;
}

.review-usage-wish-copy span {
  color: var(--text-soft);
  font-size: 0.74rem;
}

.review-usage-wish-row i {
  display: block;
  width: 100%;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--usage-track);
  overflow: hidden;
}

.review-usage-wish-row b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--usage-accent-soft), var(--usage-accent-deep));
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
  padding: 0.5rem;
  border-radius: 12px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.52);
}

.monthly-progress-list,
.monthly-category-list,
.monthly-completed-list,
.monthly-message-list {
  display: grid;
  gap: 0.34rem;
}

.monthly-message-link {
  color: inherit;
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease;
}

.monthly-message-link:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--heat-4) 24%, rgba(79, 49, 35, 0.12));
  background: color-mix(in srgb, var(--heat-1) 28%, rgba(255, 255, 255, 0.88));
}

.monthly-claims-chart-shell {
  display: grid;
  gap: 0.52rem;
}

.monthly-claims-chart {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.38rem;
  align-items: stretch;
  padding: 0.42rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.46);
}

.monthly-claims-item {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) minmax(0, 1.25fr);
  align-items: start;
  gap: 0.34rem;
  min-width: 0;
  padding: 0.32rem 0.38rem;
  border-radius: 10px;
  border: 1px solid var(--line-soft);
  background: rgba(255, 255, 255, 0.62);
}

.monthly-claims-compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;
  min-width: 0;
}

.monthly-claims-metric-block {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
}

.monthly-claims-metric-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.42rem;
  color: var(--text-soft);
  font-size: 0.66rem;
  line-height: 1.2;
}

.monthly-claims-metric-head strong {
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
}

.monthly-claims-bars {
  display: block;
  min-height: 0.62rem;
  padding: 0.28rem;
  border-radius: 10px;
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

.monthly-claims-bars i.is-count,
.monthly-claims-legend i.is-count {
  background: linear-gradient(90deg, #f1c27a, #c98237);
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
  gap: 0.42rem;
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
  border-top: 1px solid color-mix(in srgb, var(--heat-4) 28%, rgba(79, 49, 35, 0.1));
}

.monthly-completed-preview p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.74rem;
  line-height: 1.42;
}

.monthly-completed-preview span {
  margin-right: 0.32rem;
  color: color-mix(in srgb, var(--heat-5) 88%, var(--text-main));
}

.monthly-completed-link {
  justify-self: start;
  min-height: 1.9rem;
  padding: 0.32rem 0.68rem;
  border: 1px solid color-mix(in srgb, var(--heat-4) 26%, rgba(79, 49, 35, 0.12));
  border-radius: 999px;
  background: color-mix(in srgb, var(--heat-1) 34%, rgba(255, 255, 255, 0.82));
  color: color-mix(in srgb, var(--heat-5) 72%, var(--text-main));
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

.monthly-waterfall-stage.is-text-only {
  min-height: auto;
  padding: 0.2rem 0.24rem 0;
  border: 0;
  background: transparent;
}

.monthly-waterfall-stage.is-text-only .monthly-waterfall-step {
  grid-template-rows: auto;
  gap: 0;
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
  gap: 0.28rem;
}

.monthly-progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--heat-2), var(--heat-5));
}

.monthly-progress-more {
  min-height: 2rem;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.48);
  color: var(--text-main);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 700;
}

.monthly-progress-more:hover,
.monthly-progress-more:focus-visible {
  border-color: color-mix(in srgb, var(--heat-4) 36%, rgba(79, 49, 35, 0.14));
  background: color-mix(in srgb, var(--heat-1) 48%, rgba(255, 255, 255, 0.58));
}

.monthly-empty-note {
  margin: 0;
  padding: 0.56rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.44);
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.38;
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

  .monthly-claims-compare-grid {
    grid-template-columns: 1fr;
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
