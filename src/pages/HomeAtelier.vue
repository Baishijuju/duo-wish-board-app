<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { WishRecord } from '../stores/wishes'
import { DRAGON_BALL_COIN_TARGET, useWishStore } from '../stores/wishes'

const authStore = useAuthStore()
const wishStore = useWishStore()

const WISH_BOTTLE_STAR_PATH = 'M0,-10 L2.9,-3.2 L10,-3.1 L4.2,1.4 L6.1,8.8 L0,4.7 L-6.1,8.8 L-4.2,1.4 L-10,-3.1 L-2.9,-3.2 Z'
const WISH_BOTTLE_MAX_DISPLAY_STARS = 30
const WISH_BOTTLE_TEN_STAR_VALUE = 10

type WishBottleDisplayStarKind = 'single' | 'tenfold'

type WishBottleDisplayStar = {
  delay: string
  duration: string
  kind: WishBottleDisplayStarKind
  representedStars: number
  rotate: number
  scale: number
  x: number
  y: number
}

function buildWishBottleStarKinds(tenfoldCount: number, singleCount: number) {
  const totalCount = tenfoldCount + singleCount

  if (!totalCount) {
    return [] as WishBottleDisplayStarKind[]
  }

  const kinds: WishBottleDisplayStarKind[] = []
  let flowCarry = 0
  let remainingSingleCount = singleCount
  let remainingTenfoldCount = tenfoldCount

  for (let index = 0; index < totalCount; index += 1) {
    if (!remainingSingleCount) {
      kinds.push('tenfold')
      remainingTenfoldCount -= 1
      continue
    }

    if (!remainingTenfoldCount) {
      kinds.push('single')
      remainingSingleCount -= 1
      continue
    }

    flowCarry += tenfoldCount

    if (flowCarry >= totalCount) {
      kinds.push('tenfold')
      flowCarry -= totalCount
      remainingTenfoldCount -= 1
      continue
    }

    kinds.push('single')
    remainingSingleCount -= 1
  }

  return kinds
}

function compactWishBottleStarKinds(totalStars: number) {
  if (totalStars <= 0) {
    return {
      hiddenStars: 0,
      kinds: [] as WishBottleDisplayStarKind[],
    }
  }

  if (totalStars <= WISH_BOTTLE_MAX_DISPLAY_STARS) {
    return {
      hiddenStars: 0,
      kinds: Array.from({ length: totalStars }, () => 'single' as const),
    }
  }

  const maxTenfoldCount = Math.min(Math.floor(totalStars / WISH_BOTTLE_TEN_STAR_VALUE), WISH_BOTTLE_MAX_DISPLAY_STARS)

  for (let tenfoldCount = maxTenfoldCount; tenfoldCount >= 1; tenfoldCount -= 1) {
    const singleCount = totalStars - tenfoldCount * WISH_BOTTLE_TEN_STAR_VALUE

    if (singleCount >= 0 && tenfoldCount + singleCount <= WISH_BOTTLE_MAX_DISPLAY_STARS) {
      return {
        hiddenStars: 0,
        kinds: buildWishBottleStarKinds(tenfoldCount, singleCount),
      }
    }
  }

  const representedTenfoldCount = Math.min(WISH_BOTTLE_MAX_DISPLAY_STARS, Math.floor(totalStars / WISH_BOTTLE_TEN_STAR_VALUE))
  const representedStars = representedTenfoldCount * WISH_BOTTLE_TEN_STAR_VALUE

  return {
    hiddenStars: Math.max(0, totalStars - representedStars),
    kinds: Array.from({ length: representedTenfoldCount }, () => 'tenfold' as const),
  }
}

function buildWishBottleStarLayout(displayStarCount: number) {
  if (displayStarCount <= 0) {
    return []
  }

  const columns = displayStarCount > 20 ? 6 : 5
  const rows = Math.ceil(displayStarCount / columns)
  const minX = 45
  const maxX = 171
  const minY = 174
  const maxY = 350
  const columnGap = columns > 1 ? (maxX - minX) / (columns - 1) : 0
  const rowGap = rows > 1 ? Math.min(28, (maxY - minY) / Math.max(1, rows - 1)) : 0
  const densityScale = Math.max(0.46, Math.min(1, rows > 1 ? 7 / rows : 1))

  return Array.from({ length: displayStarCount }, (_, index) => {
    const row = Math.floor(index / columns)
    const column = index % columns
    const x = minX + column * columnGap + (row % 2 ? Math.min(10, columnGap * 0.42) : 0) + Math.sin(index * 1.83) * Math.min(4, columnGap * 0.16)
    const y = maxY - row * rowGap + Math.cos(index * 1.42) * Math.min(5, rowGap ? rowGap * 0.24 : 4)

    return {
      delay: `${index * 42}ms`,
      duration: `${4.8 + (index % 5) * 0.36}s`,
      rotate: (index * 43 + 12) % 360,
      scale: Number((densityScale * (0.82 + ((index * 17) % 38) / 100)).toFixed(2)),
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    }
  })
}

function buildWishBottleDisplayedStars(totalStars: number) {
  const compactedStars = compactWishBottleStarKinds(totalStars)
  const positionedStars = buildWishBottleStarLayout(compactedStars.kinds.length)

  const stars: WishBottleDisplayStar[] = positionedStars.map((star, index) => {
    const kind = compactedStars.kinds[index]
    const representedStars = kind === 'tenfold' ? WISH_BOTTLE_TEN_STAR_VALUE : 1
    const scaleMultiplier = kind === 'tenfold' ? 1.22 : 1

    return {
      ...star,
      kind,
      representedStars,
      scale: Number((star.scale * scaleMultiplier).toFixed(2)),
    }
  })

  return {
    hiddenStars: compactedStars.hiddenStars,
    stars,
    usesTenfoldStars: compactedStars.kinds.includes('tenfold'),
  }
}

type HomeThreadSummary = {
  actorId: string | null
  actorLabel: string
  detailText: string
  headlineText: string
  id: string
  timeLabel: string
}

const viewerName = computed(() => authStore.currentMember?.displayName ?? '我们')
const nearestDueWishes = computed(() => wishStore.nearestDueWishes.slice(0, 3))
const dragonBallWishes = computed(() => wishStore.dragonBallWishes.slice(0, 3))
const wishBottleSnapshot = computed(() => wishStore.wishBottleSnapshot)
const wishBottleCountStarCount = computed(() => {
  return wishBottleSnapshot.value.completedCountUnits
})
const wishBottleDisplayStarCount = computed(() => {
  return wishBottleSnapshot.value.completedStepStarCount + wishBottleCountStarCount.value
})
const wishBottleDisplayedStarsPlan = computed(() => {
  return buildWishBottleDisplayedStars(wishBottleDisplayStarCount.value)
})
const visibleWishBottleStars = computed(() => {
  return wishBottleDisplayedStarsPlan.value.stars
})
const RECENT_THREAD_WINDOW_DAYS = 14
const wishBottleUsesTenfoldStars = computed(() => {
  return wishBottleDisplayedStarsPlan.value.usesTenfoldStars
})
const wishBottleHiddenStarCount = computed(() => {
  return wishBottleDisplayedStarsPlan.value.hiddenStars
})
const memberDisplayNameMap = computed(() => {
  return new Map(authStore.members.map((member) => [member.id, member.displayName]))
})
const latestHomeThreads = computed<HomeThreadSummary[]>(() => {
  const wishTitleMap = new Map(wishStore.wishes.map((wish) => [wish.id, wish.title]))
  const now = Date.now()
  const recentWindowStart = now - RECENT_THREAD_WINDOW_DAYS * 24 * 60 * 60 * 1000

  return [...wishStore.wishThreads]
    .filter((thread) => {
      const createdAtTime = new Date(thread.createdAt).getTime()
      return Number.isFinite(createdAtTime) && createdAtTime >= recentWindowStart
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 5)
    .map((thread) => ({
      actorId: thread.actorId,
      actorLabel: getThreadActorLabel(thread.actorId),
      detailText: getHomeThreadDetail(thread, wishTitleMap),
      headlineText: getHomeThreadHeadline(thread, wishTitleMap),
      id: thread.id,
      timeLabel: formatRecentThreadTime(thread.createdAt),
    }))
})
const latestMoment = computed(() => latestHomeThreads.value[0] ?? null)
const recentMemberCards = computed(() => {
  return authStore.members.slice(0, 2).map((member, index) => {
    const memberThreads = latestHomeThreads.value.filter((thread) => thread.actorId === member.id).slice(0, 2)
    const highlight = memberThreads[0] ?? null
    const isViewer = authStore.currentMember?.id === member.id

    return {
      followUp: memberThreads[1] ?? null,
      highlight,
      memberId: member.id,
      memberName: member.displayName,
      roleLabel: isViewer ? '你刚刚捎来一句' : '对方刚刚捎来一句',
      toneClass: index % 2 === 0 ? 'is-rose' : 'is-sage',
    }
  })
})
const sharedLatestMoment = computed(() => latestHomeThreads.value.find((thread) => thread.actorId === null) ?? null)
const heroPrimaryWish = computed(() => {
  return nearestDueWishes.value[0] ?? dragonBallWishes.value[0] ?? wishStore.wishes[0] ?? null
})
const heroLead = computed(() => {
  if (!heroPrimaryWish.value) {
    return '先写下一条愿望，今天最该关心的事就会先出现在这里。'
  }

  return '先把今天最该推进的一条放到眼前，再去看清单、愿望瓶和最近的变化。'
})
const heroPrimaryWishCaption = computed(() => {
  if (!heroPrimaryWish.value) {
    return '先写下一条愿望，让今天先有一件值得关心的事。'
  }

  if (nearestDueWishes.value[0]?.id === heroPrimaryWish.value.id) {
    return getRelativeDueLabel(heroPrimaryWish.value.dueDate)
  }

  return getWishCoinHint(heroPrimaryWish.value)
})
const homePrimaryActionTo = computed(() => {
  return wishStore.wishes.length ? '/list' : '/compose'
})
const homePrimaryActionLabel = computed(() => {
  return wishStore.wishes.length ? '去清单继续推进' : '写下第一条愿望'
})
const heroPrimaryActionTo = computed(() => {
  if (!heroPrimaryWish.value) {
    return '/compose'
  }

  return {
    name: 'wish-detail',
    params: {
      id: heroPrimaryWish.value.id,
    },
  }
})
const heroPrimaryActionLabel = computed(() => {
  return heroPrimaryWish.value ? '打开这条愿望' : '写下第一条愿望'
})
const stageMetrics = computed(() => {
  const snapshot = wishBottleSnapshot.value
  const displayStarCount = wishBottleDisplayStarCount.value
  const starNote = wishBottleHiddenStarCount.value
    ? `金描边大星按 10 颗计，另有 ${wishBottleHiddenStarCount.value} 颗收起`
    : wishBottleUsesTenfoldStars.value
      ? '金描边大星按 10 颗计'
      : '数字推进和完成步骤都会落成星星'

  return [
    {
      label: '在路上',
      note: '今天还在推进中的愿望',
      value: snapshot.activeWishCount ? `${snapshot.activeWishCount} 个` : '等待开始',
    },
    {
      label: '已点亮',
      note: starNote,
      value: displayStarCount ? `${displayStarCount} 颗` : '等待第一颗',
    },
    {
      label: '最近更新',
      note: latestMoment.value
        ? `${latestMoment.value.actorLabel} 刚留下了一笔新记录`
        : '下一次推进会留在这里',
      value: latestMoment.value ? latestMoment.value.timeLabel : '等待更新',
    },
  ]
})
const bottleMoodChips = computed(() => {
  const snapshot = wishBottleSnapshot.value
  const displayStarCount = wishBottleDisplayStarCount.value

  if (!snapshot.activeWishCount) {
    return ['下一条愿望会住进来', '第一颗星星会在这里亮起', '先从一件小事开始']
  }

  const approachingWishCount =
    snapshot.progressedWishCount || snapshot.trackedWishCount || snapshot.activeWishCount

  const chips = [
    `${snapshot.activeWishCount} 个愿望在路上`,
    displayStarCount ? `已点亮 ${displayStarCount} 颗星星` : '第一颗星星还在路上',
    `${approachingWishCount} 条愿望正在靠近`,
  ]

  if (wishBottleHiddenStarCount.value) {
    chips.push(`另有 ${wishBottleHiddenStarCount.value} 颗星星收起`) 
  }

  return chips
})

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
    return `已经过了约定的日子 ${Math.abs(dayDifference)} 天`
  }

  if (dayDifference === 0) {
    return '就是今天'
  }

  if (dayDifference === 1) {
    return '明天就到约定的日子'
  }

  return `离希望完成的日子还有 ${dayDifference} 天`
}

function getWishCoinHint(wish: WishRecord) {
  const coinSnapshot = wishStore.getWishCoinSummary(wish)

  if (coinSnapshot.isDragonBallReady) {
    return `已经集齐七龙珠，现在有 ${coinSnapshot.total} 枚愿望币。`
  }

  if (coinSnapshot.total > 0) {
    return `现在有 ${coinSnapshot.total} 枚愿望币，还差 ${coinSnapshot.remainingToDragonBall} 枚召唤神龙。`
  }

  return `还没有收到愿望币，距离召唤神龙还差 ${DRAGON_BALL_COIN_TARGET} 枚。`
}

function getWishBottleRevealHeight() {
  const snapshot = wishBottleSnapshot.value

  if (!snapshot.activeWishCount || !snapshot.trackedWishCount || snapshot.overallPercent <= 0) {
    return 0
  }

  return Math.max(48, Math.min(188, Math.round(snapshot.overallPercent * 1.42)))
}

function getWishBottleDreamfieldOpacity() {
  const snapshot = wishBottleSnapshot.value

  if (!snapshot.activeWishCount || !snapshot.trackedWishCount) {
    return 0
  }

  return Math.min(0.88, Math.max(0.14, snapshot.overallPercent / 135))
}

function getWishBottleHeroHeading() {
  const snapshot = wishBottleSnapshot.value
  const displayStarCount = wishBottleDisplayStarCount.value

  if (!snapshot.activeWishCount) {
    return '愿望瓶正在等新的愿望住进来'
  }

  if (!displayStarCount) {
    return '愿望瓶正在等第一颗星星落下来'
  }

  return `愿望瓶已经亮起 ${displayStarCount} 颗星星`
}

function getWishBottleHeroSubcopy() {
  const snapshot = wishBottleSnapshot.value

  if (!snapshot.activeWishCount) {
    return '等下一条愿望写下后，这里会先亮起来。'
  }

  return `${snapshot.activeWishCount} 个愿望还在路上。`
}

function getWishBottleDashboardHint() {
  const snapshot = wishBottleSnapshot.value
  const approachingWishCount =
    snapshot.progressedWishCount || snapshot.trackedWishCount || snapshot.activeWishCount

  if (!snapshot.activeWishCount) {
    return '下一次推进会让这里亮起来。'
  }

  return `${approachingWishCount} 个愿望正在靠近。`
}

function getThreadMessageSummary(messageText: string) {
  const normalizedText = messageText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalizedText) {
    return '留下了一条新的记录。'
  }

  const sentenceEndIndex = normalizedText.search(/[。！？!?]/u)

  if (sentenceEndIndex >= 0) {
    return normalizedText.slice(0, sentenceEndIndex + 1)
  }

  return normalizedText
}

function getMetaString(meta: Record<string, unknown>, key: string) {
  const value = meta[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function getThreadWishTitle(
  wishId: string | null,
  meta: Record<string, unknown>,
  wishTitleMap: Map<string, string>,
) {
  if (wishId && wishTitleMap.has(wishId)) {
    return wishTitleMap.get(wishId) ?? null
  }

  return getMetaString(meta, 'wishTitle') ?? getMetaString(meta, 'titleSnapshot')
}

function getThreadActorLabel(actorId: string | null) {
  if (!actorId) {
    return '一起'
  }

  return memberDisplayNameMap.value.get(actorId) ?? '我们'
}

function getHomeThreadHeadline(
  thread: {
    eventKind: string
    messageText: string
    meta: Record<string, unknown>
    wishId: string | null
  },
  wishTitleMap: Map<string, string>,
) {
  const wishTitle = getThreadWishTitle(thread.wishId, thread.meta, wishTitleMap)

  if (thread.eventKind === 'comment') {
    return wishTitle ? `在「${wishTitle}」这页，刚好又说到你们了` : '刚好又捎来了一句新的近况'
  }

  if (thread.eventKind === 'wish_completed') {
    return wishTitle ? `「${wishTitle}」这页，终于能笑着合上了` : '刚刚有一条愿望，终于能笑着合上了'
  }

  if (thread.eventKind === 'wish_step_completed') {
    return wishTitle ? `「${wishTitle}」这边，又悄悄往前拱了一点` : '刚刚又把手上的一件事往前拱了一点'
  }

  if (thread.eventKind === 'wish_published') {
    return wishTitle ? `「${wishTitle}」刚被认真写进以后` : '刚刚又把一个新的以后写下来了'
  }

  if (thread.eventKind === 'wish_coin_cast') {
    return wishTitle ? `「${wishTitle}」刚被轻轻推了一把` : '刚刚又替一条愿望轻轻推了一把'
  }

  if (thread.eventKind === 'dragon_ball_reached') {
    return wishTitle ? `「${wishTitle}」已经被摆到最想先实现的位置` : '刚刚有一条愿望，被摆到最想先实现的位置'
  }

  if (thread.eventKind === 'reward_claimed') {
    const rewardTitle = getMetaString(thread.meta, 'titleSnapshot')
    const wishTarget = wishTitle || getMetaString(thread.meta, 'wishTitle') || '这条愿望'
    return rewardTitle ? `「${wishTarget}」推进后，刚领到「${rewardTitle}」` : `「${wishTarget}」推进后，刚接住一份奖励`
  }

  if (thread.eventKind === 'premium_redeem') {
    return '攒下来的星星币，刚刚换成了一份想要的东西'
  }

  if (thread.eventKind === 'weekly_welfare_issued') {
    return '这周新的愿望币，已经先送到手边了'
  }

  if (wishTitle) {
    return `「${wishTitle}」这页，又多了一句可以告诉对方的话`
  }

  return '刚刚又多了一句想让对方先看到的话'
}

function getHomeThreadDetail(
  thread: {
    eventKind: string
    messageText: string
    meta: Record<string, unknown>
    wishId: string | null
  },
  wishTitleMap: Map<string, string>,
) {
  const wishTitle = getThreadWishTitle(thread.wishId, thread.meta, wishTitleMap)
  const messageSummary = getThreadMessageSummary(thread.messageText)
  const stepTitle = getMetaString(thread.meta, 'stepTitle')

  if (thread.eventKind === 'comment') {
    return `这句近况在说：${messageSummary}`
  }

  if (thread.eventKind === 'wish_step_completed') {
    return stepTitle ? `这次先推进了「${stepTitle}」，像是在跟对方报一声平安。` : '这次先往前拱了一点，也够让对方安心一下。'
  }

  if (thread.eventKind === 'wish_completed') {
    return '这一次是真的走到了页尾，可以回头一起笑着看了。'
  }

  if (thread.eventKind === 'wish_published') {
    return wishTitle ? `新的愿望「${wishTitle}」已经住进清单里，也算先和对方打了个招呼。` : '一个新的愿望已经住进清单里，先被轻轻说出口了。'
  }

  if (thread.eventKind === 'wish_coin_cast') {
    return '这一枚愿望币像一句“我记得这件事”，把它往前轻轻推了一下。'
  }

  if (thread.eventKind === 'dragon_ball_reached') {
    return '它已经被放到更靠前的位置，像在提醒彼此：先把这个实现掉。'
  }

  if (thread.eventKind === 'reward_claimed') {
    const rewardTitle = getMetaString(thread.meta, 'titleSnapshot')
    const quantityRaw = Number(thread.meta.quantity)
    const quantity = Number.isFinite(quantityRaw) ? Math.max(1, Math.trunc(quantityRaw)) : 1
    if (rewardTitle) {
      return quantity > 1
        ? `因为这条愿望推进了 ${quantity} 点，这次领到了「${rewardTitle}」共 ${quantity} 份。`
        : `因为这条愿望往前推进了一步，这次领到了「${rewardTitle}」。`
    }

    return quantity > 1
      ? `因为这条愿望推进了 ${quantity} 点，这次接住了 ${quantity} 份奖励。`
      : '因为这条愿望往前推进了一步，这次接住了一份奖励。'
  }

  if (thread.eventKind === 'premium_redeem') {
    return '把慢慢攒下来的星星币，换成了一份想要的奖励，也算给最近的努力一个回应。'
  }

  if (thread.eventKind === 'weekly_welfare_issued') {
    return '这一周又多了新的愿望币，可以继续把偏爱投向更想靠近的方向。'
  }

  return messageSummary
}

function getBeijingDateParts(timestamp: string) {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const formatter = new Intl.DateTimeFormat('zh-CN', {
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'numeric',
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
  })

  const partMap = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    day: partMap.get('day') ?? '',
    hour: partMap.get('hour') ?? '',
    minute: partMap.get('minute') ?? '',
    month: partMap.get('month') ?? '',
    year: partMap.get('year') ?? '',
  }
}

function formatRecentThreadTime(timestamp: string) {
  const target = getBeijingDateParts(timestamp)
  const now = getBeijingDateParts(new Date().toISOString())

  if (!target || !now) {
    return '时间待同步'
  }

  if (target.year === now.year && target.month === now.month && target.day === now.day) {
    return `今天 ${target.hour}:${target.minute}`
  }

  if (target.year === now.year) {
    return `${target.month}月${target.day}日 ${target.hour}:${target.minute}`
  }

  return `${target.year}年${target.month}月${target.day}日 ${target.hour}:${target.minute}`
}
</script>

<template>
  <section class="atelier-home-page">
    <section class="atelier-hero panel">
      <div class="atelier-hero-copy">
        <p class="atelier-kicker">今天先做 <span>Today First</span></p>
        <h1>
          <span class="atelier-hero-name">{{ viewerName }}</span>
          <span class="atelier-hero-promise">
            <span class="atelier-hero-line">今天先把最想推进的一条愿望</span>
            <span class="atelier-hero-line is-tight">摆到眼前。</span>
          </span>
        </h1>
        <p class="atelier-lead">{{ heroLead }}</p>

        <article class="priority-card is-primary-focus">
          <div class="priority-head">
            <div class="section-icon is-quill" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 4l6 6" />
                <path d="M6 18l4-1 10-10-3-3L7 14l-1 4z" />
              </svg>
            </div>
            <span class="priority-label">今天先推进</span>
          </div>

          <div class="priority-body">
            <h2>{{ heroPrimaryWish?.title ?? '先写下一条愿望' }}</h2>
            <p class="priority-copy">{{ heroPrimaryWishCaption }}</p>
          </div>

          <div class="priority-footer">
            <RouterLink class="priority-link" :to="heroPrimaryActionTo">
              {{ heroPrimaryActionLabel }}
            </RouterLink>
          </div>
        </article>

        <div class="atelier-action-row">
          <RouterLink class="atelier-button atelier-button-solid" :to="homePrimaryActionTo">
            {{ homePrimaryActionLabel }}
          </RouterLink>
        </div>
      </div>

      <article
        :class="[
          'wish-bottle-card',
          'atelier-bottle-card',
          `tier-${wishBottleSnapshot.colorTier}`,
          {
            'is-empty-bottle': !wishBottleSnapshot.activeWishCount,
            'is-rainbow-glow': wishBottleSnapshot.isRainbowGlow,
          },
        ]"
      >
        <div class="atelier-stage-note">
          <div class="wish-bottle-story">
            <p class="wish-bottle-story-kicker">愿望瓶 <span>Wish Bottle</span></p>
            <h2 class="wish-bottle-story-title">{{ getWishBottleHeroHeading() }}</h2>
          </div>
        </div>

        <p class="wish-bottle-progress-note atelier-stage-copy">{{ getWishBottleHeroSubcopy() }}</p>

        <div class="wish-bottle-main atelier-bottle-main">
          <div class="wish-bottle-visual">
            <div class="wish-bottle-aura"></div>
            <span class="wish-bottle-sparkle sparkle-one"></span>
            <span class="wish-bottle-sparkle sparkle-two"></span>
            <span class="wish-bottle-sparkle sparkle-three"></span>
            <div class="wish-bottle-shell">
              <svg class="wish-bottle-svg" viewBox="-50 0 316 404" role="img" aria-label="手工细丝带软木塞玻璃愿望瓶">
                <defs>
                  <linearGradient id="wish-bottle-glass-fill-duet" x1="22" y1="26" x2="185" y2="386" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff" stop-opacity=".74" />
                    <stop offset=".18" stop-color="var(--wish-glass-tint)" stop-opacity=".72" />
                    <stop offset=".44" stop-color="#fff" stop-opacity=".18" />
                    <stop offset=".72" stop-color="var(--wish-glass-tint)" stop-opacity=".38" />
                    <stop offset="1" stop-color="rgba(20,80,130,.12)" stop-opacity=".56" />
                  </linearGradient>
                  <linearGradient id="wish-bottle-glass-stroke-duet" x1="42" y1="30" x2="168" y2="382" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff" stop-opacity=".92" />
                    <stop offset=".2" stop-color="var(--wish-glass-stroke)" stop-opacity=".86" />
                    <stop offset=".75" stop-color="var(--wish-glass-strong)" stop-opacity=".92" />
                    <stop offset="1" stop-color="#fff" stop-opacity=".78" />
                  </linearGradient>
                  <linearGradient id="wish-bottle-cork-grad-duet" x1="76" y1="0" x2="140" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#f0c78f" />
                    <stop offset=".48" stop-color="#d7a66d" />
                    <stop offset="1" stop-color="#a9713d" />
                  </linearGradient>
                  <linearGradient id="wish-bottle-ribbon-grad-duet" x1="45" y1="55" x2="172" y2="120" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="var(--wish-ribbon-3)" />
                    <stop offset=".36" stop-color="var(--wish-ribbon-1)" />
                    <stop offset="1" stop-color="var(--wish-ribbon-2)" />
                  </linearGradient>
                  <linearGradient id="wish-bottle-progress-grad-duet" x1="108" y1="180" x2="108" y2="392" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="rgba(255,255,255,.06)" />
                    <stop offset=".24" stop-color="var(--wish-glow)" stop-opacity=".12" />
                    <stop offset="1" stop-color="var(--wish-glass-tint)" stop-opacity=".48" />
                  </linearGradient>
                  <radialGradient id="wish-bottle-bottom-glow-duet" cx="50%" cy="76%" r="55%">
                    <stop offset="0" stop-color="#fff" stop-opacity=".55" />
                    <stop offset=".52" stop-color="var(--wish-glass-tint)" stop-opacity=".18" />
                    <stop offset="1" stop-color="#fff" stop-opacity="0" />
                  </radialGradient>
                  <linearGradient id="wish-bottle-star-grad-duet" x1="-9" y1="-9" x2="13" y2="15" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="var(--wish-star-1)" />
                    <stop offset=".44" stop-color="var(--wish-star-2)" />
                    <stop offset="1" stop-color="var(--wish-star-3)" />
                  </linearGradient>
                  <linearGradient id="wish-bottle-ten-star-fill-duet" x1="-10" y1="-10" x2="12" y2="16" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff9df" />
                    <stop offset=".48" stop-color="#ffd36d" />
                    <stop offset="1" stop-color="#d88a1f" />
                  </linearGradient>
                  <linearGradient id="wish-bottle-ten-star-outline-duet" x1="-12" y1="-12" x2="15" y2="17" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stop-color="#fff7d2" />
                    <stop offset=".34" stop-color="#ffe17c" />
                    <stop offset=".68" stop-color="#ffb83f" />
                    <stop offset="1" stop-color="#fff2bf" />
                  </linearGradient>
                  <filter id="wish-bottle-glass-blur-duet" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="0.45" />
                  </filter>
                  <filter id="wish-bottle-star-glow-duet" x="-80%" y="-80%" width="260%" height="260%">
                    <feDropShadow dx="0" dy="0" stdDeviation="1.9" flood-color="var(--wish-star-glow)" flood-opacity=".62" />
                    <feDropShadow dx="0" dy="1" stdDeviation="3.6" flood-color="var(--wish-star-glow)" flood-opacity=".18" />
                  </filter>
                  <filter id="wish-bottle-ten-star-glow-duet" x="-110%" y="-110%" width="320%" height="320%">
                    <feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#ffc94f" flood-opacity=".74" />
                    <feDropShadow dx="0" dy="0" stdDeviation="4.4" flood-color="#ffd978" flood-opacity=".26" />
                  </filter>
                  <filter id="wish-bottle-cork-shadow-duet" x="-40%" y="-40%" width="180%" height="180%">
                    <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(70,45,22,.26)" />
                  </filter>
                  <filter id="wish-bottle-ribbon-shadow-duet" x="-70%" y="-70%" width="240%" height="240%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="rgba(122,45,78,.18)" />
                  </filter>
                  <path id="wish-bottle-path-duet" d="M87 28 C78 28 74 34 74 45 L74 111 C74 133 63 146 47 158 C25 174 18 198 18 234 L18 338 C18 374 47 392 108 392 C169 392 198 374 198 338 L198 234 C198 198 191 174 169 158 C153 146 142 133 142 111 L142 45 C142 34 138 28 129 28 Z" />
                  <clipPath id="wish-bottle-clip-duet">
                    <use href="#wish-bottle-path-duet" />
                  </clipPath>
                </defs>

                <g filter="url(#wish-bottle-cork-shadow-duet)">
                  <path d="M82 3 C82 -2 86 -5 92 -5 L124 -5 C130 -5 134 -2 134 3 L130 52 C129 61 122 66 108 66 C94 66 87 61 86 52 Z" fill="url(#wish-bottle-cork-grad-duet)" />
                  <ellipse cx="108" cy="3" rx="27" ry="9" fill="#efc991" opacity=".95" />
                  <ellipse cx="108" cy="3" rx="18" ry="4.5" fill="rgba(255,255,255,.22)" />
                  <g opacity=".36" fill="#7b4b24">
                    <circle cx="94" cy="12" r="1.5" />
                    <circle cx="119" cy="15" r="1.2" />
                    <circle cx="105" cy="23" r="1.1" />
                    <circle cx="126" cy="31" r="1.5" />
                    <circle cx="91" cy="35" r="1.2" />
                    <circle cx="112" cy="43" r="1.3" />
                    <circle cx="100" cy="55" r="1.1" />
                    <circle cx="122" cy="54" r="1" />
                  </g>
                  <path d="M88 16 C99 20 116 20 128 16" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1.3" />
                  <path d="M87 48 C99 54 117 54 130 48" fill="none" stroke="rgba(90,52,24,.22)" stroke-width="1.4" />
                </g>

                <use href="#wish-bottle-path-duet" fill="none" stroke="url(#wish-bottle-glass-stroke-duet)" stroke-width="7.2" stroke-linejoin="round" opacity=".95" />
                <use href="#wish-bottle-path-duet" fill="url(#wish-bottle-glass-fill-duet)" stroke="rgba(255,255,255,.58)" stroke-width="1.2" />

                <g clip-path="url(#wish-bottle-clip-duet)">
                  <rect x="18" y="28" width="180" height="364" fill="rgba(255,255,255,.03)" />
                  <rect
                    class="wish-bottle-progress-field"
                    x="18"
                    :y="392 - getWishBottleRevealHeight()"
                    width="180"
                    :height="getWishBottleRevealHeight()"
                  />
                  <ellipse
                    class="wish-bottle-progress-haze"
                    cx="108"
                    :cy="366 - getWishBottleRevealHeight() * 0.24"
                    rx="84"
                    ry="38"
                    :style="{ opacity: `${getWishBottleRevealHeight() ? Math.min(0.72, 0.18 + getWishBottleDreamfieldOpacity()) : 0}` }"
                  />
                  <g class="wish-bottle-dreamfield" :style="{ opacity: `${getWishBottleDreamfieldOpacity()}` }">
                    <circle cx="52" cy="332" r="6" />
                    <circle cx="78" cy="286" r="4.5" />
                    <circle cx="107" cy="314" r="5.5" />
                    <circle cx="138" cy="260" r="4.6" />
                    <circle cx="164" cy="308" r="5" />
                    <circle cx="120" cy="220" r="3.8" />
                  </g>
                  <ellipse cx="108" cy="350" rx="72" ry="31" fill="url(#wish-bottle-bottom-glow-duet)" />
                  <path d="M36 218 C42 244 42 305 39 348" fill="none" stroke="rgba(13,69,115,.18)" stroke-width="16" stroke-linecap="round" filter="url(#wish-bottle-glass-blur-duet)" />
                  <path d="M178 196 C170 242 170 306 164 352" fill="none" stroke="rgba(10,48,88,.22)" stroke-width="16" stroke-linecap="round" filter="url(#wish-bottle-glass-blur-duet)" />
                  <path d="M55 54 C43 110 43 198 51 315" fill="none" stroke="rgba(255,255,255,.66)" stroke-width="15" stroke-linecap="round" opacity=".76" filter="url(#wish-bottle-glass-blur-duet)" />
                  <path d="M74 48 C68 103 70 151 79 182" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="5" stroke-linecap="round" filter="url(#wish-bottle-glass-blur-duet)" />
                  <path d="M158 60 C174 132 184 210 171 348" fill="none" stroke="rgba(255,255,255,.27)" stroke-width="7" stroke-linecap="round" opacity=".74" filter="url(#wish-bottle-glass-blur-duet)" />
                  <g class="wish-bottle-stars-layer">
                    <g
                      v-for="(star, index) in visibleWishBottleStars"
                      :key="`wish-bottle-star-${index}`"
                      :transform="`translate(${star.x} ${star.y})`"
                    >
                      <g
                        class="wish-bottle-svg-star"
                        :class="{ 'is-tenfold-star': star.kind === 'tenfold' }"
                        :style="{
                          '--wish-star-delay': star.delay,
                          '--wish-star-duration': star.duration,
                          '--wish-star-rotate': `${star.rotate}deg`,
                          '--wish-star-scale': star.scale,
                        }"
                      >
                        <template v-if="star.kind === 'tenfold'">
                          <path :d="WISH_BOTTLE_STAR_PATH" fill="url(#wish-bottle-ten-star-fill-duet)" filter="url(#wish-bottle-ten-star-glow-duet)" />
                          <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-ten-star-outline" />
                        </template>
                        <template v-else>
                          <path :d="WISH_BOTTLE_STAR_PATH" fill="url(#wish-bottle-star-grad-duet)" filter="url(#wish-bottle-star-glow-duet)" />
                          <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-highlight" />
                        </template>
                      </g>
                    </g>
                  </g>
                  <path d="M17 234 C34 249 59 255 108 255 C157 255 182 249 199 234" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" opacity=".55" />
                  <path d="M35 322 C56 337 80 343 108 343 C136 343 160 337 181 322" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="2.4" opacity=".78" />
                  <ellipse cx="108" cy="362" rx="58" ry="15" fill="rgba(30,95,150,.10)" />
                </g>

                <ellipse cx="108" cy="40" rx="39" ry="12" fill="rgba(255,255,255,.40)" stroke="url(#wish-bottle-glass-stroke-duet)" stroke-width="3" />
                <ellipse cx="108" cy="39" rx="25" ry="5.2" fill="rgba(255,255,255,.46)" opacity=".9" />
                <path d="M75 68 C86 75 130 75 141 68" fill="none" stroke="rgba(255,255,255,.50)" stroke-width="2" stroke-linecap="round" opacity=".82" />
                <path d="M75 96 C88 103 128 103 141 96" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="1.8" stroke-linecap="round" opacity=".66" />

                <g class="wish-bottle-ribbon-handmade" filter="url(#wish-bottle-ribbon-shadow-duet)">
                  <path d="M73 69 C90 76 126 76 143 69 L142 75 C125 83 91 83 74 75 Z" fill="url(#wish-bottle-ribbon-grad-duet)" opacity=".97" />
                  <path d="M77 70 C92 75 124 75 139 70" fill="none" stroke="rgba(255,255,255,.48)" stroke-width="1" />
                  <ellipse cx="108" cy="76" rx="5.8" ry="4.8" fill="url(#wish-bottle-ribbon-grad-duet)" stroke="rgba(255,255,255,.35)" stroke-width=".8" />
                  <path d="M104 75 C106 77 110 78 113 75" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".8" />
                  <path d="M107 76 C92 65 79 66 67 75 C79 79 90 82 104 80 Z" fill="url(#wish-bottle-ribbon-grad-duet)" opacity=".96" />
                  <path d="M109 76 C124 65 137 66 149 75 C137 79 126 82 112 80 Z" fill="url(#wish-bottle-ribbon-grad-duet)" opacity=".96" />
                  <path d="M73 75 C84 76 94 78 104 79" fill="none" stroke="rgba(255,255,255,.38)" stroke-width=".9" />
                  <path d="M143 75 C132 76 122 78 112 79" fill="none" stroke="rgba(255,255,255,.38)" stroke-width=".9" />
                  <path d="M103 80 C90 92 74 104 55 110 C36 116 21 119 2 115 L6 124 C28 129 48 124 68 116 C84 109 97 97 107 83 Z" fill="url(#wish-bottle-ribbon-grad-duet)" opacity=".95" />
                  <path d="M113 80 C130 92 152 101 178 100 C198 99 217 92 239 99 L235 109 C210 105 193 112 170 111 C146 110 126 99 109 83 Z" fill="url(#wish-bottle-ribbon-grad-duet)" opacity=".95" />
                  <path d="M13 118 C39 121 71 111 101 87" fill="none" stroke="rgba(255,255,255,.34)" stroke-width=".9" stroke-linecap="round" />
                  <path d="M116 88 C149 106 191 107 230 102" fill="none" stroke="rgba(255,255,255,.34)" stroke-width=".9" stroke-linecap="round" />
                  <path d="M2 115 L14 111 L7 124 Z" fill="rgba(255,255,255,.18)" />
                  <path d="M239 99 L226 98 L235 109 Z" fill="rgba(255,255,255,.18)" />
                </g>
              </svg>
              <div class="wish-bottle-shadow"></div>
            </div>
          </div>

          <div class="atelier-stage-metrics">
            <div class="atelier-progress-hero">
              <p class="wish-bottle-dashboard-kicker">现在的愿望瓶 <span>Now in Bottle</span></p>
              <strong class="atelier-progress-value">{{ wishBottleSnapshot.overallPercent }}%</strong>
              <p class="atelier-progress-caption">{{ getWishBottleDashboardHint() }}</p>

              <div class="wish-bottle-progress-bar" aria-hidden="true">
                <span class="wish-bottle-progress-fill" :style="{ width: `${wishBottleSnapshot.overallPercent}%` }"></span>
              </div>
            </div>

            <div class="atelier-metric-grid">
              <article
                v-for="(metric, index) in stageMetrics"
                :key="metric.label"
                :class="['atelier-metric-card', { 'is-wide': index === stageMetrics.length - 1 }]"
              >
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
                <small>{{ metric.note }}</small>
              </article>
            </div>

            <div class="atelier-chip-row atelier-chip-row-inline">
              <span v-for="chip in bottleMoodChips" :key="chip" class="atelier-chip">{{ chip }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="atelier-grid">
      <article class="atelier-journal panel">
        <div class="section-head">
          <div class="section-head-copy">
            <p class="atelier-kicker">最近发生 <span>Recent Journal</span></p>
            <h2>刚刚，你们又先跟彼此说了什么</h2>
            <p>先看看这两句近况，再决定下一步往哪条愿望靠。</p>
          </div>
        </div>

        <div class="atelier-journal-layout" :class="{ 'is-single': recentMemberCards.length === 1 }">
          <article
            v-for="card in recentMemberCards"
            :key="card.memberId"
            :class="['journal-member-card', card.toneClass, { 'is-empty': !card.highlight }]"
          >
            <div class="journal-member-head">
              <div class="journal-member-title">
                <p class="journal-member-role">{{ card.roleLabel }}</p>
                <h3>{{ card.memberName }}</h3>
              </div>
            </div>

            <div v-if="card.highlight" class="journal-member-highlight">
              <p class="journal-feature-meta">{{ card.highlight.timeLabel }}</p>
              <strong>{{ card.highlight.headlineText }}</strong>
              <p>{{ card.highlight.detailText }}</p>
            </div>

            <div v-if="card.followUp" class="journal-member-followup">
              <p class="journal-member-followup-label">再补一句</p>
              <div class="journal-member-followup-copy">
                <strong>{{ card.followUp.headlineText }}</strong>
                <span>{{ card.followUp.timeLabel }}</span>
              </div>
            </div>

            <div v-else-if="!card.highlight" class="journal-member-empty">
              <p class="journal-feature-meta">最近 14 天还没有新的近况</p>
              <h3>等下一次推进发生，这里会先替你们把这句招呼留住。</h3>
              <p>只要有一笔留言、投币或完成步骤，对方就会先从这里看到。</p>
            </div>
          </article>

          <article v-if="sharedLatestMoment" class="journal-shared-strip">
            <p class="journal-shared-kicker">一起捎来</p>
            <strong>{{ sharedLatestMoment.headlineText }}</strong>
            <span>{{ sharedLatestMoment.timeLabel }}</span>
          </article>
        </div>
      </article>

      <article class="atelier-agenda panel">
        <div class="section-head">
          <div class="section-head-copy">
            <p class="atelier-kicker">CLOSER NEXT</p>
            <h2>下一步往哪里靠</h2>
          </div>
        </div>

        <div class="atelier-agenda-layout">
          <section class="atelier-lane atelier-lane-due">
            <div class="lane-head">
              <div class="section-icon is-calendar" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="4" y="5" width="16" height="15" rx="2.5" />
                  <path d="M8 3v4" />
                  <path d="M16 3v4" />
                  <path d="M4 10h16" />
                </svg>
              </div>
              <div class="lane-head-copy">
                <h3>离约定最近</h3>
                <p>先把最靠近日期的几条挑出来。</p>
              </div>
            </div>

            <div v-if="nearestDueWishes.length" class="lane-list">
              <article v-for="wish in nearestDueWishes" :key="wish.id" class="lane-row">
                <div class="lane-row-copy">
                  <strong>{{ wish.title }}</strong>
                  <p>{{ getRelativeDueLabel(wish.dueDate) }}</p>
                </div>
                <RouterLink class="lane-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">
                  查看
                </RouterLink>
              </article>
            </div>

            <div v-else class="lane-empty">
              <h3>这里还没有靠近日期的愿望</h3>
              <p>等你给愿望设下日期，这里就会先放出来。</p>
            </div>
          </section>

          <section class="atelier-lane atelier-lane-coin">
            <div class="lane-head">
              <div class="section-icon is-coin" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 8.2l1.2 2.6 2.8.4-2 2 .5 2.8-2.5-1.4L9.5 16l.5-2.8-2-2 2.8-.4L12 8.2z" />
                </svg>
              </div>
              <div class="lane-head-copy">
                <h3>愿望币先投向哪里</h3>
                <p>先看哪几条最值得把愿望币投进去。</p>
              </div>
            </div>

            <div v-if="dragonBallWishes.length" class="lane-list">
              <article v-for="wish in dragonBallWishes" :key="wish.id" class="lane-row">
                <div class="lane-row-copy">
                  <strong>{{ wish.title }}</strong>
                  <p>{{ getWishCoinHint(wish) }}</p>
                </div>
                <RouterLink class="lane-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">
                  查看
                </RouterLink>
              </article>
            </div>

            <div v-else class="lane-empty">
              <h3>这里还没有被愿望币点亮的愿望</h3>
              <p>等第一枚愿望币落下后，这里就会亮起来。</p>
            </div>
          </section>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.atelier-home-page {
  --atelier-bg: #f7efe4;
  --atelier-paper: rgba(255, 251, 246, 0.9);
  --atelier-paper-strong: rgba(255, 247, 240, 0.96);
  --atelier-line: rgba(124, 98, 78, 0.14);
  --atelier-line-strong: rgba(146, 112, 88, 0.22);
  --atelier-ink: #392a24;
  --atelier-ink-soft: rgba(57, 42, 36, 0.72);
  --atelier-rose: #c97b7e;
  --atelier-rose-deep: #9f575b;
  --atelier-gold: #c39a5d;
  --atelier-sage: #90a889;
  --atelier-sky: #98aec7;
  --atelier-display-font: var(--font-display);
  --atelier-heading-font: var(--font-heading);
  --atelier-body-font: var(--font-body);
  --atelier-space-1: 0.32rem;
  --atelier-space-2: 0.56rem;
  --atelier-space-3: 0.84rem;
  --atelier-space-4: 1rem;
  --atelier-space-5: 1.24rem;
  --atelier-space-6: 1.56rem;
  display: grid;
  gap: 1.12rem;
  color: var(--atelier-ink);
  font-family: var(--atelier-body-font);
}

.atelier-marquee,
.panel {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--atelier-line);
  background:
    linear-gradient(180deg, var(--atelier-paper), rgba(248, 239, 231, 0.88)),
    radial-gradient(circle at top left, rgba(255, 224, 218, 0.48), transparent 32%),
    radial-gradient(circle at top right, rgba(211, 227, 247, 0.38), transparent 28%);
  box-shadow: 0 24px 56px rgba(97, 71, 52, 0.08);
}

.atelier-marquee {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.95rem 1rem;
  border-radius: 999px;
}

.atelier-marquee p {
  margin: 0;
  color: var(--atelier-ink-soft);
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
}

.atelier-marquee-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.atelier-mini-pill {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0.45rem 0.82rem;
  border-radius: 999px;
  border: 1px solid rgba(144, 117, 94, 0.14);
  background: rgba(255, 255, 255, 0.62);
  color: var(--atelier-ink-soft);
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
  text-decoration: none;
}

.atelier-mini-link {
  color: var(--atelier-ink);
}

.atelier-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(280px, 0.82fr);
  gap: var(--space-5);
  padding: 1.24rem;
  border-radius: var(--radius-xl);
  background:
    linear-gradient(180deg, rgba(255, 251, 247, 0.95), rgba(247, 237, 229, 0.9)),
    radial-gradient(circle at 10% 10%, rgba(255, 216, 213, 0.42), transparent 26%),
    radial-gradient(circle at 90% 12%, rgba(216, 229, 249, 0.36), transparent 24%),
    radial-gradient(circle at 50% 100%, rgba(231, 238, 224, 0.3), transparent 30%);
}

.atelier-hero-copy {
  display: grid;
  gap: var(--space-4);
  align-content: start;
  padding: 0.28rem 0.22rem 0.2rem;
}

.atelier-kicker,
.wish-bottle-story-kicker,
.wish-bottle-dashboard-kicker,
.priority-label {
  margin: 0;
  color: var(--atelier-ink-soft);
  font-family: var(--atelier-body-font);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.atelier-kicker,
.wish-bottle-story-kicker,
.wish-bottle-dashboard-kicker {
  display: inline-flex;
  align-items: baseline;
  gap: 0.46rem;
  letter-spacing: 0.08em;
  text-transform: none;
}

.atelier-kicker span,
.wish-bottle-story-kicker span,
.wish-bottle-dashboard-kicker span {
  color: rgba(57, 42, 36, 0.38);
  font-size: var(--type-kicker-sub-size);
  letter-spacing: var(--type-kicker-sub-spacing);
  text-transform: uppercase;
}

.journal-feature-meta,
.journal-time {
  margin: 0;
  color: rgba(57, 42, 36, 0.76);
  font-family: var(--atelier-body-font);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.atelier-hero-copy h1,
.wish-bottle-story-title {
  margin: 0;
  font-family: var(--atelier-display-font);
  font-weight: 400;
}

.priority-card h2,
.section-head h2,
.journal-feature h3,
.lane-head h3,
.lane-empty h3 {
  margin: 0;
  font-family: var(--atelier-heading-font);
  font-weight: 600;
}

.priority-card h2 {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.atelier-hero-copy h1 {
  display: grid;
  gap: 0.54rem;
  max-width: 18ch;
  font-size: var(--type-page-title-size);
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
  text-wrap: balance;
}

.atelier-hero-name,
.atelier-hero-promise {
  display: block;
}

.atelier-hero-name {
  max-width: 7ch;
  color: rgba(57, 42, 36, 0.88);
  font-family: var(--atelier-heading-font);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.atelier-hero-promise {
  display: grid;
  gap: 0.18rem;
  max-width: 17ch;
  line-height: 1.04;
}

.atelier-hero-line {
  display: block;
}

.atelier-hero-line:first-child {
  max-width: 17ch;
}

.atelier-hero-line.is-tight {
  max-width: 8ch;
  padding-left: 0.28em;
}

.atelier-lead,
.atelier-stage-copy,
.atelier-stage-hint,
.priority-copy,
.lane-head p,
.lane-row p,
.lane-empty p,
.journal-feature p,
.journal-entry p,
.section-head p {
  margin: 0;
  color: var(--atelier-ink-soft);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.atelier-stage-copy,
.atelier-stage-hint,
.lane-head p,
.lane-row p,
.lane-empty p,
.journal-feature p,
.journal-entry p,
.section-head p {
  color: rgba(57, 42, 36, 0.64);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.atelier-lead {
  max-width: 33rem;
  color: rgba(57, 42, 36, 0.84);
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-line);
}

.atelier-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.68rem;
  max-width: 18rem;
}

.atelier-button,
.priority-link,
.lane-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 999px;
  font-family: var(--atelier-body-font);
  font-weight: 500;
  letter-spacing: var(--type-button-tracking);
  text-decoration: none;
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;
}

.atelier-button {
  min-height: 44px;
  padding: 0.66rem 1.06rem;
  border: 1px solid rgba(148, 115, 94, 0.14);
}

.atelier-button-solid {
  background: linear-gradient(135deg, var(--atelier-rose), var(--atelier-rose-deep));
  color: #fffaf6;
  box-shadow: 0 14px 28px rgba(166, 90, 96, 0.24);
}

.atelier-button-ghost,
.priority-link,
.lane-link {
  background: rgba(255, 255, 255, 0.58);
  color: var(--atelier-ink);
  border: 1px solid rgba(148, 115, 94, 0.14);
}

.priority-card,
.atelier-lane,
.journal-feature,
.atelier-metric-card {
  border: 1px solid var(--atelier-line);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.priority-card {
  display: grid;
  gap: 0.9rem;
  padding: 1rem 1rem 1.04rem;
  border-radius: var(--radius-xl);
}

.priority-card.is-primary-focus {
  gap: 1rem;
  padding: 1.18rem;
  border-color: rgba(201, 111, 74, 0.24);
  background:
    linear-gradient(180deg, rgba(255, 253, 249, 0.98), rgba(255, 246, 238, 0.94)),
    radial-gradient(circle at 100% 0%, rgba(238, 196, 188, 0.22), transparent 38%);
  box-shadow: var(--shadow-raised);
}

.priority-head,
.priority-footer,
.lane-row,
.section-head,
.lane-head {
  display: flex;
  justify-content: space-between;
  gap: 0.88rem;
  align-items: flex-start;
}

.section-head-copy,
.lane-head-copy {
  display: grid;
  gap: 0.2rem;
}

.priority-head {
  align-items: center;
}

.priority-body {
  display: grid;
  gap: 0.46rem;
  max-width: 32ch;
}

.priority-card h2 {
  max-width: 16ch;
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
  text-wrap: balance;
}

.priority-copy {
  max-width: 34ch;
  color: rgba(57, 42, 36, 0.7);
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
  letter-spacing: var(--type-l6-spacing);
}

.lane-row strong,
.ritual-row strong,
.journal-entry strong,
.journal-feature h3,
.section-head h2,
.lane-head h3 {
  color: var(--atelier-ink);
}

.priority-footer {
  display: grid;
  gap: 0.48rem;
  justify-items: start;
  align-items: start;
  padding-top: 0.14rem;
  border-top: 1px solid rgba(124, 98, 78, 0.12);
}

.priority-link,
.lane-link {
  flex-shrink: 0;
  min-height: 44px;
  padding: 0.64rem 0.96rem;
}

.priority-link {
  min-height: 40px;
  padding: 0.62rem 1rem;
  background: linear-gradient(135deg, var(--atelier-rose), var(--atelier-rose-deep));
  border-color: transparent;
  color: #fffaf6;
  font-size: var(--type-body-size);
  box-shadow: 0 10px 22px rgba(166, 90, 96, 0.18);
}

.atelier-bottle-card {
  align-content: start;
  min-height: 100%;
  background:
    linear-gradient(180deg, rgba(255, 252, 248, 0.9), rgba(249, 241, 234, 0.72)),
    radial-gradient(circle at 80% 10%, rgba(216, 229, 249, 0.18), transparent 26%);
  box-shadow: var(--shadow-card);
}

.atelier-stage-note {
  display: grid;
  gap: 0.46rem;
}

.atelier-stage-copy {
  max-width: 25rem;
}

.atelier-bottle-main {
  align-items: center;
}

.atelier-stage-metrics {
  display: grid;
  gap: 0.78rem;
  align-content: center;
}

.atelier-progress-hero {
  display: grid;
  gap: 0.42rem;
  padding: 0.88rem 0.94rem 0.96rem;
  border-radius: var(--radius-xl);
  background: var(--surface-soft);
  border: 1px solid var(--atelier-line);
  box-shadow: none;
}

.atelier-progress-value {
  color: var(--wish-star-2);
  font-family: var(--atelier-display-font);
  font-size: var(--type-d0-size);
  line-height: var(--type-d0-line);
  letter-spacing: -0.07em;
  text-shadow: 0 6px 16px rgba(70, 165, 235, 0.22);
}

.atelier-progress-caption {
  margin: 0;
  max-width: 27ch;
  color: rgba(57, 42, 36, 0.62);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.atelier-metric-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.76rem;
}

.atelier-metric-card {
  display: grid;
  gap: 0.24rem;
  padding: 0.84rem 0.9rem 0.92rem;
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: none;
}

.atelier-metric-card.is-wide {
  grid-column: auto;
}

.atelier-metric-card span,
.atelier-chip,
.journal-entry-actor {
  color: var(--atelier-ink-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
}

.atelier-metric-card span,
.journal-entry-actor {
  letter-spacing: var(--type-supporting-spacing);
}

.atelier-metric-card strong {
  font-family: var(--atelier-display-font);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.atelier-metric-card small {
  max-width: 22ch;
  color: var(--atelier-ink-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.atelier-stage-hint {
  font-size: var(--type-supporting-size);
}

.atelier-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.atelier-chip-row-inline {
  margin-top: 0.04rem;
}

.atelier-chip {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0.38rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(144, 117, 94, 0.12);
  background: rgba(255, 255, 255, 0.56);
}

.atelier-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 1.08rem;
}

.atelier-agenda,
.atelier-journal {
  padding: 1.2rem;
  border-radius: var(--radius-xl);
}

.atelier-agenda {
  grid-column: 1 / -1;
  background:
    linear-gradient(180deg, rgba(255, 250, 245, 0.94), rgba(249, 242, 234, 0.9)),
    radial-gradient(circle at 0% 0%, rgba(236, 201, 193, 0.12), transparent 34%);
}

.atelier-journal {
  grid-column: 1 / -1;
  background:
    linear-gradient(180deg, rgba(255, 252, 248, 0.95), rgba(246, 239, 232, 0.9)),
    radial-gradient(circle at 100% 0%, rgba(216, 229, 249, 0.12), transparent 30%);
}

.section-head {
  margin-bottom: 1.12rem;
  padding-bottom: 0.94rem;
  border-bottom: 1px solid rgba(124, 98, 78, 0.12);
}

.section-head h2 {
  font-size: var(--type-section-title-size);
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.section-head .atelier-kicker {
  font-size: var(--type-l7-size);
  letter-spacing: 0.14em;
}

.section-head p {
  max-width: 23rem;
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.atelier-agenda-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.atelier-lane {
  display: grid;
  gap: 1rem;
  align-content: start;
  padding: 1.08rem;
  border-radius: var(--radius-xl);
}

.atelier-lane-due {
  background: linear-gradient(180deg, rgba(255, 238, 233, 0.78), rgba(255, 251, 247, 0.7));
}

.atelier-lane-coin {
  background: linear-gradient(180deg, rgba(243, 233, 214, 0.8), rgba(255, 251, 247, 0.7));
}

.lane-head {
  align-items: flex-start;
}

.lane-head h3 {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.lane-list {
  display: grid;
  gap: 0.76rem;
}

.lane-row {
  align-items: start;
  padding-bottom: 0.88rem;
  border-bottom: 1px solid rgba(124, 98, 78, 0.12);
}

.lane-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.lane-row-copy {
  display: grid;
  gap: 0.28rem;
  max-width: 31ch;
}

.lane-row strong {
  display: block;
  font-size: var(--type-l5-size);
  line-height: 1.48;
}

.lane-row p {
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.lane-empty {
  display: grid;
  gap: 0.42rem;
  max-width: 32ch;
  padding: 0.12rem 0;
}

.lane-empty h3 {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.journal-entry strong {
  display: block;
  margin-bottom: 0;
  font-size: var(--type-l5-size);
  line-height: 1.5;
}

.atelier-journal-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.08rem;
}

.atelier-journal-layout.is-single {
  grid-template-columns: 1fr;
}

.journal-member-card {
  display: grid;
  gap: 0.72rem;
  align-content: start;
  padding: 1rem;
  border-radius: var(--radius-xl);
  background: linear-gradient(180deg, rgba(255, 244, 237, 0.82), rgba(255, 255, 255, 0.64));
  border: 1px solid rgba(146, 112, 88, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.journal-member-card.is-sage {
  background: linear-gradient(180deg, rgba(244, 250, 246, 0.86), rgba(255, 255, 255, 0.68));
  border-color: rgba(132, 161, 145, 0.16);
}

.journal-member-head {
  display: flex;
  justify-content: flex-start;
  gap: 0.7rem;
  align-items: flex-start;
}

.journal-member-title {
  display: grid;
  gap: 0.16rem;
}

.journal-member-role,
.journal-shared-kicker {
  margin: 0;
  color: var(--atelier-ink-soft);
  font-family: var(--atelier-body-font);
  font-size: var(--type-l7-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.journal-member-head h3,
.journal-member-empty h3 {
  margin: 0;
  font-family: var(--atelier-heading-font);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.journal-member-head h3,
.journal-member-empty h3,
.journal-shared-strip strong {
  text-wrap: balance;
}

.journal-member-highlight,
.journal-member-empty {
  display: grid;
  gap: 0.26rem;
}

.journal-member-highlight strong,
.journal-member-entry strong,
.journal-shared-strip strong {
  display: block;
  margin: 0;
  color: var(--atelier-ink);
  font-family: var(--atelier-heading-font);
  font-size: var(--type-l5-size);
  line-height: 1.46;
  letter-spacing: -0.02em;
}

.journal-member-highlight p,
.journal-member-empty p,
.journal-shared-strip span {
  margin: 0;
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.journal-member-empty p {
  color: rgba(57, 42, 36, 0.62);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.journal-member-followup {
  display: grid;
  gap: 0.28rem;
  padding-top: 0.06rem;
  border-top: 1px solid rgba(124, 98, 78, 0.12);
}

.journal-member-followup-label {
  margin: 0;
  color: rgba(70, 53, 45, 0.64);
  font-family: var(--atelier-body-font);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.journal-member-followup-copy {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.28rem 0.7rem;
  align-items: baseline;
}

.journal-member-followup-copy strong {
  max-width: 24ch;
}

.journal-member-followup-copy span,
.journal-shared-strip span {
  color: var(--atelier-ink-soft);
  font-family: var(--atelier-body-font);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.journal-shared-strip {
  display: grid;
  grid-column: 1 / -1;
  gap: 0.18rem;
  padding: 0.8rem 0.92rem;
  border-radius: var(--radius-lg);
  border: 1px dashed rgba(144, 117, 94, 0.18);
  background: rgba(255, 255, 255, 0.48);
}

.section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 16px;
  border: 1px solid rgba(144, 117, 94, 0.14);
  background: rgba(255, 255, 255, 0.72);
  color: var(--atelier-rose-deep);
  flex-shrink: 0;
}

.section-icon svg {
  width: 19px;
  height: 19px;
}

.section-icon :deep(path),
.section-icon :deep(circle),
.section-icon :deep(rect) {
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.section-icon.is-calendar {
  color: #8a6e52;
}

.section-icon.is-coin {
  color: #ab7d39;
}

.section-icon.is-spark {
  color: #9671a1;
}

.section-icon.is-quill {
  color: #a55d6d;
}

.wish-bottle-card {
  --wish-glass-tint: rgba(105, 186, 245, 0.18);
  --wish-glass-stroke: rgba(73, 150, 220, 0.62);
  --wish-glass-strong: rgba(35, 105, 180, 0.86);
  --wish-glow: rgba(53, 145, 224, 0.34);
  --wish-star-1: #ffffff;
  --wish-star-2: #8fdcff;
  --wish-star-3: #2b8fe3;
  --wish-star-glow: rgba(70, 165, 235, 0.55);
  --wish-ribbon-1: #f7a8c4;
  --wish-ribbon-2: #d85f93;
  --wish-ribbon-3: #fff2f7;
  display: grid;
  gap: 1rem;
  padding: 1.28rem 1.18rem 1.12rem;
  border-radius: var(--radius-xl);
  border: 1px solid rgba(217, 203, 187, 0.6);
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.91), rgba(252, 247, 241, 0.84)),
    radial-gradient(circle at 14% 10%, rgba(255, 228, 232, 0.22), transparent 36%),
    radial-gradient(circle at 84% 18%, rgba(214, 233, 255, 0.2), transparent 28%),
    radial-gradient(circle at 48% 100%, rgba(231, 242, 233, 0.2), transparent 42%);
  box-shadow: 0 16px 32px rgba(119, 91, 82, 0.06);
}

.wish-bottle-card.tier-green {
  --wish-glass-tint: rgba(72, 196, 128, 0.13);
  --wish-glass-stroke: rgba(51, 177, 112, 0.52);
  --wish-glass-strong: rgba(22, 135, 86, 0.74);
  --wish-glow: rgba(51, 177, 112, 0.3);
  --wish-star-1: #effff6;
  --wish-star-2: #64d994;
  --wish-star-3: #158c5d;
  --wish-star-glow: rgba(51, 177, 112, 0.52);
  --wish-ribbon-1: #9be7b4;
  --wish-ribbon-2: #2aa56a;
  --wish-ribbon-3: #f1fff6;
}

.wish-bottle-card.tier-orange {
  --wish-glass-tint: rgba(255, 142, 72, 0.14);
  --wish-glass-stroke: rgba(236, 119, 55, 0.54);
  --wish-glass-strong: rgba(193, 78, 30, 0.74);
  --wish-glow: rgba(236, 119, 55, 0.34);
  --wish-star-1: #fff1e7;
  --wish-star-2: #ff9b4a;
  --wish-star-3: #cf5520;
  --wish-star-glow: rgba(236, 119, 55, 0.56);
  --wish-ribbon-1: #ffbd9a;
  --wish-ribbon-2: #d9673d;
  --wish-ribbon-3: #fff1df;
}

.wish-bottle-card.tier-gold {
  --wish-glass-tint: rgba(246, 199, 79, 0.15);
  --wish-glass-stroke: rgba(234, 179, 64, 0.58);
  --wish-glass-strong: rgba(190, 122, 33, 0.78);
  --wish-glow: rgba(234, 179, 64, 0.38);
  --wish-star-1: #fff9e2;
  --wish-star-2: #f4c64f;
  --wish-star-3: #c9791f;
  --wish-star-glow: rgba(234, 179, 64, 0.62);
  --wish-ribbon-1: #f9c773;
  --wish-ribbon-2: #c97a25;
  --wish-ribbon-3: #fff3c4;
}

.wish-bottle-card.tier-rainbow {
  --wish-glass-tint: rgba(255, 218, 112, 0.16);
  --wish-glass-stroke: rgba(246, 191, 80, 0.62);
  --wish-glass-strong: rgba(214, 145, 48, 0.82);
  --wish-glow: rgba(255, 204, 84, 0.48);
  --wish-star-1: #fffdf2;
  --wish-star-2: #ff9ec1;
  --wish-star-3: #50d7e9;
  --wish-star-glow: rgba(255, 211, 94, 0.78);
  --wish-ribbon-1: #ffd1dc;
  --wish-ribbon-2: #c37bff;
  --wish-ribbon-3: #fff6bf;
}

.wish-bottle-card.is-empty-bottle {
  --wish-glass-tint: rgba(207, 221, 239, 0.11);
  --wish-glass-stroke: rgba(141, 170, 211, 0.34);
  --wish-glass-strong: rgba(121, 151, 194, 0.42);
  --wish-glow: rgba(133, 162, 203, 0.12);
  --wish-star-1: #f6f9fd;
  --wish-star-2: #dce7f3;
  --wish-star-3: #b0c1d6;
  --wish-star-glow: rgba(133, 162, 203, 0.18);
  --wish-ribbon-1: #ecd7df;
  --wish-ribbon-2: #c39bab;
  --wish-ribbon-3: #fff6f8;
}

.wish-bottle-story {
  display: grid;
  gap: 0.26rem;
}

.wish-bottle-story-title {
  max-width: 15ch;
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
  text-wrap: balance;
}

.wish-bottle-main {
  display: grid;
  grid-template-columns: minmax(248px, 0.82fr) minmax(0, 1.18fr);
  gap: 1.12rem;
  align-items: center;
}

.wish-bottle-visual {
  position: relative;
  min-height: clamp(292px, 30vw, 356px);
  display: grid;
  place-items: center;
}

.wish-bottle-aura {
  position: absolute;
  inset: 10% 10%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--wish-glow), transparent 72%);
  filter: blur(30px);
  opacity: 0.32;
  animation: bottle-glow-breathe 4.8s ease-in-out infinite;
}

.wish-bottle-sparkle {
  position: absolute;
  width: 8px;
  aspect-ratio: 1;
  clip-path: polygon(50% 0%, 62% 34%, 100% 50%, 62% 66%, 50% 100%, 38% 66%, 0% 50%, 38% 34%);
  background: rgba(255, 255, 255, 0.42);
  filter: drop-shadow(0 0 6px var(--wish-glow));
  animation: bottle-sparkle-twinkle 5.2s ease-in-out infinite;
}

.wish-bottle-sparkle.sparkle-one {
  top: 20%;
  left: 10%;
  animation-delay: -0.6s;
}

.wish-bottle-sparkle.sparkle-two {
  top: 12%;
  right: 16%;
  width: 7px;
  animation-delay: -2.1s;
}

.wish-bottle-sparkle.sparkle-three {
  bottom: 16%;
  right: 6%;
  width: 7px;
  animation-delay: -1.3s;
}

.wish-bottle-shell {
  position: relative;
  width: min(100%, 316px);
  aspect-ratio: 316 / 404;
}

.wish-bottle-svg {
  position: relative;
  z-index: 2;
  width: 100%;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 18px 22px rgba(49, 66, 98, 0.12));
}

.wish-bottle-shadow {
  position: absolute;
  left: 50%;
  bottom: 10px;
  width: 64%;
  height: 24px;
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(ellipse, rgba(51, 68, 98, 0.12), transparent 68%);
  z-index: 1;
}

.wish-bottle-progress-field {
  fill: url(#wish-bottle-progress-grad-duet);
  opacity: 0.82;
}

.wish-bottle-progress-haze {
  fill: var(--wish-glow);
  filter: blur(22px);
}

.wish-bottle-dreamfield {
  animation: bottle-dreamfield-drift 8.2s ease-in-out infinite;
  mix-blend-mode: screen;
}

.wish-bottle-dreamfield circle {
  fill: rgba(255, 255, 255, 0.24);
}

.wish-bottle-ribbon-handmade {
  transform-origin: 108px 73px;
  animation: bottle-ribbon-breathe 4.2s ease-in-out infinite;
}

.wish-bottle-svg-star {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation:
    bottle-star-drop 0.66s cubic-bezier(0.18, 1.45, 0.28, 1) forwards,
    bottle-star-bob var(--wish-star-duration) ease-in-out infinite,
    bottle-star-gloss 2.7s ease-in-out infinite;
  animation-delay:
    var(--wish-star-delay),
    calc(var(--wish-star-delay) + 0.65s),
    calc(var(--wish-star-delay) + 0.25s);
}

.wish-bottle-card.is-rainbow-glow .wish-bottle-svg-star,
.wish-bottle-card.tier-rainbow .wish-bottle-svg-star {
  animation:
    bottle-star-drop 0.66s cubic-bezier(0.18, 1.45, 0.28, 1) forwards,
    bottle-star-bob var(--wish-star-duration) ease-in-out infinite,
    bottle-star-twinkle 1.55s ease-in-out infinite;
  animation-delay:
    var(--wish-star-delay),
    calc(var(--wish-star-delay) + 0.65s),
    calc(var(--wish-star-delay) + 0.35s);
}

.wish-bottle-star-highlight {
  fill: none;
  stroke: rgba(255, 255, 255, 0.24);
  stroke-width: 0.92;
  stroke-linejoin: round;
  opacity: 0.6;
}

.wish-bottle-ten-star-outline {
  fill: none;
  stroke: url(#wish-bottle-ten-star-outline-duet);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 12 8;
  opacity: 0.94;
  filter: url(#wish-bottle-ten-star-glow-duet);
  animation: bottle-ten-star-outline-flow 3.2s linear infinite;
}

.wish-bottle-progress-bar {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: rgba(219, 210, 197, 0.56);
}

.wish-bottle-progress-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.88), var(--wish-glass-strong));
  box-shadow: 0 0 18px rgba(255, 255, 255, 0.28);
}

.wish-bottle-card.is-rainbow-glow .wish-bottle-aura,
.wish-bottle-card.tier-rainbow .wish-bottle-aura {
  animation-duration: 3.8s;
  filter: blur(24px);
}

@keyframes bottle-glow-breathe {
  0%,
  100% {
    opacity: 0.28;
    transform: scale(0.985);
  }

  50% {
    opacity: 0.46;
    transform: scale(1.015);
  }
}

@keyframes bottle-dreamfield-drift {
  0%,
  100% {
    transform: translateY(0) translateX(-1.2%);
  }

  50% {
    transform: translateY(-3.5%) translateX(1%);
  }
}

@keyframes bottle-ribbon-breathe {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }

  50% {
    transform: translateY(-0.5px) rotate(0.14deg);
  }
}

@keyframes bottle-star-drop {
  0% {
    opacity: 0;
    transform: translateY(-70px) scale(0.18) rotate(-110deg);
  }

  68% {
    opacity: 1;
    transform: translateY(0) scale(calc(var(--wish-star-scale) * 1.16)) rotate(calc(var(--wish-star-rotate) + 16deg));
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(var(--wish-star-scale)) rotate(var(--wish-star-rotate));
  }
}

@keyframes bottle-star-bob {
  0%,
  100% {
    transform: translateY(0) scale(var(--wish-star-scale)) rotate(var(--wish-star-rotate));
  }

  50% {
    transform: translateY(-3px) scale(var(--wish-star-scale)) rotate(calc(var(--wish-star-rotate) + 4deg));
  }
}

@keyframes bottle-star-gloss {
  0%,
  100% {
    filter: brightness(1) saturate(1.04);
  }

  50% {
    filter: brightness(1.12) saturate(1.08);
  }
}

@keyframes bottle-star-twinkle {
  0%,
  100% {
    filter: brightness(1) saturate(1.08);
  }

  50% {
    filter: brightness(1.24) saturate(1.18);
  }
}

@keyframes bottle-ten-star-outline-flow {
  0% {
    opacity: 0.78;
    stroke-dashoffset: 0;
  }

  50% {
    opacity: 1;
    stroke-dashoffset: -20;
  }

  100% {
    opacity: 0.82;
    stroke-dashoffset: -40;
  }
}

@keyframes bottle-sparkle-twinkle {
  0%,
  100% {
    opacity: 0.18;
    transform: scale(0.82) rotate(0deg);
  }

  50% {
    opacity: 0.62;
    transform: scale(1.02) rotate(12deg);
  }
}

@media (hover: hover) {
  .atelier-button:hover,
  .priority-link:hover,
  .lane-link:hover,
  .atelier-mini-link:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 1140px) {
  .atelier-hero,
  .atelier-journal-layout,
  .atelier-agenda-layout,
  .atelier-grid,
  .wish-bottle-main {
    grid-template-columns: 1fr;
  }

  .atelier-agenda,
  .atelier-journal {
    grid-column: 1 / -1;
  }

  .atelier-hero-copy h1 {
    max-width: 18ch;
  }

  .atelier-hero-name,
  .atelier-hero-promise {
    max-width: none;
  }

  .atelier-hero-promise {
    line-height: 1.08;
  }

  .atelier-hero-line:first-child,
  .atelier-hero-line.is-tight {
    max-width: none;
    padding-left: 0;
  }
}

@media (max-width: 720px) {
  .atelier-home-page {
    gap: 1rem;
  }

  .atelier-marquee,
  .section-head,
  .priority-head,
  .priority-footer,
  .lane-row,
  .lane-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .atelier-hero,
  .atelier-agenda,
  .atelier-journal {
    padding: 1rem;
    border-radius: var(--radius-xl);
  }

  .wish-bottle-card {
    gap: 1rem;
    padding: 1.18rem 1rem 1.08rem;
    border-radius: var(--radius-xl);
  }

  .wish-bottle-visual {
    min-height: clamp(260px, 72vw, 330px);
  }

  .priority-card,
  .atelier-lane,
  .journal-member-card,
  .atelier-progress-hero {
    padding: 0.96rem;
    border-radius: var(--radius-xl);
  }

  .journal-member-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .journal-shared-strip {
    padding: 0.82rem 0.9rem;
    border-radius: 20px;
  }

  .atelier-action-row,
  .atelier-marquee-actions {
    width: 100%;
  }

  .atelier-button,
  .atelier-mini-pill,
  .priority-link {
    width: 100%;
  }

  .priority-card {
    gap: 0.82rem;
  }

  .priority-body {
    gap: 0.34rem;
  }

  .priority-footer {
    gap: 0.6rem;
    padding-top: 0.24rem;
  }

  .atelier-hero-copy {
    gap: 1rem;
  }

  .atelier-hero-copy h1 {
    gap: 0.48rem;
    max-width: 100%;
    font-size: var(--type-page-title-size);
  }

  .atelier-hero-name {
    font-size: var(--type-card-title-size);
  }

  .atelier-hero-promise {
    gap: 0.14rem;
    max-width: none;
    line-height: 1.1;
  }

  .atelier-hero-line:first-child,
  .atelier-hero-line.is-tight {
    max-width: none;
    padding-left: 0;
  }

  .atelier-lead {
    font-size: var(--type-lead-size);
    line-height: var(--type-lead-line);
  }

  .atelier-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .atelier-metric-card.is-wide {
    grid-column: 1 / -1;
  }

  .atelier-metric-card {
    padding: 0.82rem 0.84rem 0.88rem;
  }

  .atelier-metric-card span {
    font-size: var(--type-supporting-size);
    line-height: var(--type-supporting-line);
    letter-spacing: var(--type-supporting-spacing);
  }

  .atelier-metric-card strong {
    font-size: var(--type-card-title-size);
    line-height: var(--type-card-title-line);
    letter-spacing: var(--type-card-title-tracking);
  }

  .atelier-metric-card small {
    max-width: none;
    font-size: var(--type-supporting-size);
    line-height: var(--type-supporting-line);
    letter-spacing: var(--type-supporting-spacing);
  }

  .wish-bottle-story-title {
    font-size: var(--type-card-title-size);
  }

  .atelier-progress-value {
    font-size: var(--type-d0-size);
  }

  .wish-bottle-visual {
    min-height: clamp(260px, 72vw, 330px);
  }

  .wish-bottle-shell {
    width: min(100%, 290px);
  }

  .journal-entry {
    grid-template-columns: 1fr;
  }

  .journal-time {
    min-width: 0;
    padding-top: 0;
  }

  .journal-entry {
    gap: 0.55rem;
    padding-bottom: 0.8rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .wish-bottle-aura,
  .wish-bottle-sparkle,
  .wish-bottle-dreamfield,
  .wish-bottle-ribbon-handmade,
  .wish-bottle-svg-star {
    animation: none !important;
  }

  .atelier-button,
  .priority-link,
  .lane-link,
  .atelier-mini-link {
    transition: none;
  }
}
</style>