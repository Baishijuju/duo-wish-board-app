<script setup lang="ts">
import { computed } from 'vue'
import { WISH_BOTTLE_STATUS_LABELS } from '../shared/statusSemantics'
import { useAuthStore } from '../stores/auth'
import { useWishStore } from '../stores/wishes'

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
const wishBottleUsesTenfoldStars = computed(() => {
  return wishBottleDisplayedStarsPlan.value.usesTenfoldStars
})
const wishBottleHiddenStarCount = computed(() => {
  return wishBottleDisplayedStarsPlan.value.hiddenStars
})
const latestMoment = computed(() => {
  const latestThread = [...wishStore.wishThreads]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0]

  if (!latestThread) {
    return null
  }

  return {
    actorLabel: getThreadActorLabel(latestThread.actorId),
    timeLabel: formatRecentThreadTime(latestThread.createdAt),
  }
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
      label: WISH_BOTTLE_STATUS_LABELS.active,
      note: '今天还在推进中的愿望',
      value: snapshot.activeWishCount ? `${snapshot.activeWishCount} 个` : '等待开始',
    },
    {
      label: WISH_BOTTLE_STATUS_LABELS.done,
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
    `${snapshot.activeWishCount} 个愿望${WISH_BOTTLE_STATUS_LABELS.active}`,
    displayStarCount ? `${WISH_BOTTLE_STATUS_LABELS.done} ${displayStarCount} 颗星星` : `第一颗星星还${WISH_BOTTLE_STATUS_LABELS.active}`,
    `${approachingWishCount} 条愿望正在靠近`,
  ]

  if (wishBottleUsesTenfoldStars.value) {
    chips.push('金描边大星 = 10 颗')
  }

  if (wishBottleHiddenStarCount.value) {
    chips.push(`另有 ${wishBottleHiddenStarCount.value} 颗星星收起`)
  }

  return chips
})

function getThreadActorLabel(actorId: string | null) {
  if (!actorId) {
    return '一起'
  }

  return authStore.members.find((member) => member.id === actorId)?.displayName ?? '我们'
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
    return '等新的愿望住进来'
  }

  if (!displayStarCount) {
    return '等第一颗星星落下来'
  }

  return `已经亮起 ${displayStarCount} 颗星星`
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
        <h2 class="wish-bottle-story-title">{{ getWishBottleHeroHeading() }}</h2>
        <strong class="atelier-progress-value atelier-progress-value-story">{{ wishBottleSnapshot.overallPercent }}%</strong>
      </div>
    </div>

    <div class="wish-bottle-progress-bar atelier-stage-progress" aria-hidden="true">
      <span class="wish-bottle-progress-fill" :style="{ width: `${wishBottleSnapshot.overallPercent}%` }"></span>
    </div>

    <div class="wish-bottle-main atelier-bottle-main">
      <div class="wish-bottle-visual">
        <div class="wish-bottle-aura"></div>
        <span class="wish-bottle-sparkle sparkle-one"></span>
        <span class="wish-bottle-sparkle sparkle-two"></span>
        <span class="wish-bottle-sparkle sparkle-three"></span>
        <div class="wish-bottle-shell">
          <svg class="wish-bottle-svg" viewBox="-50 0 316 404" role="img" aria-label="手工细丝带软木塞玻璃愿望瓶">
            <defs>
              <linearGradient id="wish-bottle-glass-fill-preview" x1="22" y1="26" x2="185" y2="386" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff" stop-opacity=".74" />
                <stop offset=".18" stop-color="var(--wish-glass-tint)" stop-opacity=".72" />
                <stop offset=".44" stop-color="#fff" stop-opacity=".18" />
                <stop offset=".72" stop-color="var(--wish-glass-tint)" stop-opacity=".38" />
                <stop offset="1" stop-color="rgba(20,80,130,.12)" stop-opacity=".56" />
              </linearGradient>
              <linearGradient id="wish-bottle-glass-stroke-preview" x1="42" y1="30" x2="168" y2="382" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff" stop-opacity=".92" />
                <stop offset=".2" stop-color="var(--wish-glass-stroke)" stop-opacity=".86" />
                <stop offset=".75" stop-color="var(--wish-glass-strong)" stop-opacity=".92" />
                <stop offset="1" stop-color="#fff" stop-opacity=".78" />
              </linearGradient>
              <linearGradient id="wish-bottle-cork-grad-preview" x1="76" y1="0" x2="140" y2="82" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#f0c78f" />
                <stop offset=".48" stop-color="#d7a66d" />
                <stop offset="1" stop-color="#a9713d" />
              </linearGradient>
              <linearGradient id="wish-bottle-ribbon-grad-preview" x1="45" y1="55" x2="172" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="var(--wish-ribbon-3)" />
                <stop offset=".36" stop-color="var(--wish-ribbon-1)" />
                <stop offset="1" stop-color="var(--wish-ribbon-2)" />
              </linearGradient>
              <linearGradient id="wish-bottle-progress-grad-preview" x1="108" y1="180" x2="108" y2="392" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="rgba(255,255,255,.06)" />
                <stop offset=".24" stop-color="var(--wish-glow)" stop-opacity=".12" />
                <stop offset="1" stop-color="var(--wish-glass-tint)" stop-opacity=".48" />
              </linearGradient>
              <radialGradient id="wish-bottle-bottom-glow-preview" cx="50%" cy="76%" r="55%">
                <stop offset="0" stop-color="#fff" stop-opacity=".55" />
                <stop offset=".52" stop-color="var(--wish-glass-tint)" stop-opacity=".18" />
                <stop offset="1" stop-color="#fff" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="wish-bottle-star-grad-preview" x1="-9" y1="-9" x2="13" y2="15" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="var(--wish-star-1)" />
                <stop offset=".44" stop-color="var(--wish-star-2)" />
                <stop offset="1" stop-color="var(--wish-star-3)" />
              </linearGradient>
              <linearGradient id="wish-bottle-ten-star-fill-preview" x1="-10" y1="-10" x2="12" y2="16" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff9df" />
                <stop offset=".48" stop-color="#ffd36d" />
                <stop offset="1" stop-color="#d88a1f" />
              </linearGradient>
              <linearGradient id="wish-bottle-ten-star-outline-preview" x1="-12" y1="-12" x2="15" y2="17" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff7d2" />
                <stop offset=".34" stop-color="#ffe17c" />
                <stop offset=".68" stop-color="#ffb83f" />
                <stop offset="1" stop-color="#fff2bf" />
              </linearGradient>
              <filter id="wish-bottle-glass-blur-preview" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="0.45" />
              </filter>
              <filter id="wish-bottle-star-glow-preview" x="-80%" y="-80%" width="260%" height="260%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.9" flood-color="var(--wish-star-glow)" flood-opacity=".62" />
                <feDropShadow dx="0" dy="1" stdDeviation="3.6" flood-color="var(--wish-star-glow)" flood-opacity=".18" />
              </filter>
              <filter id="wish-bottle-ten-star-glow-preview" x="-110%" y="-110%" width="320%" height="320%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#ffc94f" flood-opacity=".74" />
                <feDropShadow dx="0" dy="0" stdDeviation="4.4" flood-color="#ffd978" flood-opacity=".26" />
              </filter>
              <filter id="wish-bottle-cork-shadow-preview" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="rgba(70,45,22,.26)" />
              </filter>
              <filter id="wish-bottle-ribbon-shadow-preview" x="-70%" y="-70%" width="240%" height="240%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="rgba(122,45,78,.18)" />
              </filter>
              <path id="wish-bottle-path-preview" d="M87 28 C78 28 74 34 74 45 L74 111 C74 133 63 146 47 158 C25 174 18 198 18 234 L18 338 C18 374 47 392 108 392 C169 392 198 374 198 338 L198 234 C198 198 191 174 169 158 C153 146 142 133 142 111 L142 45 C142 34 138 28 129 28 Z" />
              <clipPath id="wish-bottle-clip-preview">
                <use href="#wish-bottle-path-preview" />
              </clipPath>
            </defs>

            <g filter="url(#wish-bottle-cork-shadow-preview)">
              <path d="M82 3 C82 -2 86 -5 92 -5 L124 -5 C130 -5 134 -2 134 3 L130 52 C129 61 122 66 108 66 C94 66 87 61 86 52 Z" fill="url(#wish-bottle-cork-grad-preview)" />
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

            <use href="#wish-bottle-path-preview" fill="none" stroke="url(#wish-bottle-glass-stroke-preview)" stroke-width="7.2" stroke-linejoin="round" opacity=".95" />
            <use href="#wish-bottle-path-preview" fill="url(#wish-bottle-glass-fill-preview)" stroke="rgba(255,255,255,.58)" stroke-width="1.2" />

            <g clip-path="url(#wish-bottle-clip-preview)">
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
              <ellipse cx="108" cy="350" rx="72" ry="31" fill="url(#wish-bottle-bottom-glow-preview)" />
              <path d="M36 218 C42 244 42 305 39 348" fill="none" stroke="rgba(13,69,115,.18)" stroke-width="16" stroke-linecap="round" filter="url(#wish-bottle-glass-blur-preview)" />
              <path d="M178 196 C170 242 170 306 164 352" fill="none" stroke="rgba(10,48,88,.22)" stroke-width="16" stroke-linecap="round" filter="url(#wish-bottle-glass-blur-preview)" />
              <path d="M55 54 C43 110 43 198 51 315" fill="none" stroke="rgba(255,255,255,.66)" stroke-width="15" stroke-linecap="round" opacity=".76" filter="url(#wish-bottle-glass-blur-preview)" />
              <path d="M74 48 C68 103 70 151 79 182" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="5" stroke-linecap="round" filter="url(#wish-bottle-glass-blur-preview)" />
              <path d="M158 60 C174 132 184 210 171 348" fill="none" stroke="rgba(255,255,255,.27)" stroke-width="7" stroke-linecap="round" opacity=".74" filter="url(#wish-bottle-glass-blur-preview)" />
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
                      <path :d="WISH_BOTTLE_STAR_PATH" fill="url(#wish-bottle-ten-star-fill-preview)" filter="url(#wish-bottle-ten-star-glow-preview)" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-ten-star-outline" />
                    </template>
                    <template v-else>
                      <path :d="WISH_BOTTLE_STAR_PATH" fill="url(#wish-bottle-star-grad-preview)" filter="url(#wish-bottle-star-glow-preview)" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-highlight" />
                    </template>
                  </g>
                </g>
              </g>
              <path d="M17 234 C34 249 59 255 108 255 C157 255 182 249 199 234" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2" opacity=".55" />
              <path d="M35 322 C56 337 80 343 108 343 C136 343 160 337 181 322" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="2.4" opacity=".78" />
              <ellipse cx="108" cy="362" rx="58" ry="15" fill="rgba(30,95,150,.10)" />
            </g>

            <ellipse cx="108" cy="40" rx="39" ry="12" fill="rgba(255,255,255,.40)" stroke="url(#wish-bottle-glass-stroke-preview)" stroke-width="3" />
            <ellipse cx="108" cy="39" rx="25" ry="5.2" fill="rgba(255,255,255,.46)" opacity=".9" />
            <path d="M75 68 C86 75 130 75 141 68" fill="none" stroke="rgba(255,255,255,.50)" stroke-width="2" stroke-linecap="round" opacity=".82" />
            <path d="M75 96 C88 103 128 103 141 96" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="1.8" stroke-linecap="round" opacity=".66" />

            <g class="wish-bottle-ribbon-handmade" filter="url(#wish-bottle-ribbon-shadow-preview)">
              <path d="M73 69 C90 76 126 76 143 69 L142 75 C125 83 91 83 74 75 Z" fill="url(#wish-bottle-ribbon-grad-preview)" opacity=".97" />
              <path d="M77 70 C92 75 124 75 139 70" fill="none" stroke="rgba(255,255,255,.48)" stroke-width="1" />
              <ellipse cx="108" cy="76" rx="5.8" ry="4.8" fill="url(#wish-bottle-ribbon-grad-preview)" stroke="rgba(255,255,255,.35)" stroke-width=".8" />
              <path d="M104 75 C106 77 110 78 113 75" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".8" />
              <path d="M107 76 C92 65 79 66 67 75 C79 79 90 82 104 80 Z" fill="url(#wish-bottle-ribbon-grad-preview)" opacity=".96" />
              <path d="M109 76 C124 65 137 66 149 75 C137 79 126 82 112 80 Z" fill="url(#wish-bottle-ribbon-grad-preview)" opacity=".96" />
              <path d="M73 75 C84 76 94 78 104 79" fill="none" stroke="rgba(255,255,255,.38)" stroke-width=".9" />
              <path d="M143 75 C132 76 122 78 112 79" fill="none" stroke="rgba(255,255,255,.38)" stroke-width=".9" />
              <path d="M103 80 C90 92 74 104 55 110 C36 116 21 119 2 115 L6 124 C28 129 48 124 68 116 C84 109 97 97 107 83 Z" fill="url(#wish-bottle-ribbon-grad-preview)" opacity=".95" />
              <path d="M113 80 C130 92 152 101 178 100 C198 99 217 92 239 99 L235 109 C210 105 193 112 170 111 C146 110 126 99 109 83 Z" fill="url(#wish-bottle-ribbon-grad-preview)" opacity=".95" />
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

          <div class="wish-bottle-progress-bar atelier-stage-progress" aria-hidden="true">
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
</template>

<style scoped>
.wish-bottle-card {
  --atelier-ink: #392a24;
  --atelier-ink-soft: rgba(57, 42, 36, 0.72);
  --atelier-display-font: var(--font-display);
  --atelier-heading-font: var(--font-heading);
  --atelier-body-font: var(--font-body);
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
  border-radius: 32px;
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

.atelier-bottle-card {
  align-content: start;
  min-height: 100%;
}

.atelier-stage-note {
  display: grid;
  gap: 0.46rem;
}

.wish-bottle-story {
  display: grid;
  gap: 0.26rem;
}

.wish-bottle-story-kicker,
.wish-bottle-dashboard-kicker {
  display: inline-flex;
  align-items: baseline;
  gap: 0.46rem;
  margin: 0;
  color: var(--atelier-ink-soft);
  font-family: var(--atelier-body-font);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.08em;
  text-transform: none;
}

.wish-bottle-story-kicker span,
.wish-bottle-dashboard-kicker span {
  color: rgba(57, 42, 36, 0.38);
  font-size: var(--type-kicker-sub-size);
  letter-spacing: var(--type-kicker-sub-spacing);
  text-transform: uppercase;
}

.wish-bottle-story-title {
  margin: 0;
  max-width: 15ch;
  font-family: var(--atelier-display-font);
  font-size: var(--type-card-title-size);
  font-weight: 400;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
  text-wrap: balance;
}

.atelier-progress-value-story {
  display: block;
  margin: 0;
  font-size: clamp(1.8rem, 4.2vw, 2.35rem);
  line-height: 0.94;
  letter-spacing: -0.05em;
  text-shadow: 0 5px 14px rgba(70, 165, 235, 0.22);
}

.atelier-stage-copy {
  margin: 0;
  max-width: 25rem;
  color: var(--atelier-ink-soft);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
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
  fill: url(#wish-bottle-progress-grad-preview);
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
  stroke: url(#wish-bottle-ten-star-outline-preview);
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 12 8;
  opacity: 0.94;
  filter: url(#wish-bottle-ten-star-glow-preview);
  animation: bottle-ten-star-outline-flow 3.2s linear infinite;
}

.atelier-stage-metrics {
  display: grid;
  gap: 0.78rem;
  align-content: center;
}

.atelier-progress-hero {
  display: grid;
  gap: 0.3rem;
  padding: 0.88rem 0.94rem 0.96rem;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.54);
  border: 1px solid rgba(144, 117, 94, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

.atelier-stage-progress {
  margin-top: 0.02rem;
}

.atelier-progress-value {
  color: var(--wish-star-2);
  font-family: var(--atelier-display-font);
  font-size: clamp(2.86rem, 5vw, 4.08rem);
  line-height: 0.92;
  letter-spacing: -0.07em;
  text-shadow: 0 6px 16px rgba(70, 165, 235, 0.22);
}

.atelier-progress-caption {
  margin: 0;
  max-width: 27ch;
  color: rgba(57, 42, 36, 0.74);
  font-size: 0.92rem;
  line-height: 1.7;
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

.atelier-metric-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.68rem;
}

.atelier-metric-card {
  display: grid;
  gap: 0.34rem;
  padding: 0.82rem 0.84rem 0.88rem;
  border: 1px solid rgba(124, 98, 78, 0.14);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.atelier-metric-card span,
.atelier-chip {
  color: var(--atelier-ink-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.atelier-metric-card strong {
  color: var(--atelier-ink);
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

@media (max-width: 1140px) {
  .wish-bottle-main {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .wish-bottle-card {
    gap: 1rem;
    padding: 1.18rem 1rem 1.08rem;
    border-radius: 30px;
  }

  .wish-bottle-visual {
    min-height: 248px;
  }

  .atelier-progress-hero {
    padding: 0.96rem;
    border-radius: 24px;
  }

  .atelier-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }

  .atelier-metric-card.is-wide {
    grid-column: 1 / -1;
  }

  .wish-bottle-story-title {
    font-size: var(--type-card-title-size);
  }

  .atelier-progress-value {
    font-size: clamp(2.7rem, 15vw, 3.75rem);
  }

  .wish-bottle-shell {
    width: min(100%, 290px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wish-bottle-aura,
  .wish-bottle-sparkle,
  .wish-bottle-dreamfield,
  .wish-bottle-ribbon-handmade,
  .wish-bottle-svg-star {
    animation: none;
  }
}
</style>