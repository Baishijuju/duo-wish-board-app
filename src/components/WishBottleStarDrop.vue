<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const WISH_BOTTLE_STAR_PATH = 'M0,-10 L2.9,-3.2 L10,-3.1 L4.2,1.4 L6.1,8.8 L0,4.7 L-6.1,8.8 L-4.2,1.4 L-10,-3.1 L-2.9,-3.2 Z'
const WISH_BOTTLE_MAX_DISPLAY_STARS = 30

type WishBottleDisplayStarKind = 'single' | 'ten' | 'hundred' | 'thousand' | 'myriad'

interface WishBottleDisplayStar {
  kind: WishBottleDisplayStarKind
  representedStars: number
  rotate: number
  scale: number
  x: number
  y: number
}

const props = withDefaults(defineProps<{
  active: boolean
  colorTier?: string
  durationMs?: number
  isRainbowGlow?: boolean
  totalStars?: number
}>(), {
  colorTier: 'pink',
  durationMs: 3000,
  isRainbowGlow: false,
  totalStars: 0,
})

const emit = defineEmits<{
  finished: []
}>()

const isVisible = ref(false)
let finishTimerId = 0

const displayedStars = computed(() => buildWishBottleDisplayedStars(Math.max(0, Math.round(props.totalStars))).slice(-18))
const visibleStarCountLabel = computed(() => `${Math.max(0, Math.round(props.totalStars))} 颗`)
const bottleClasses = computed(() => [
  `tier-${props.colorTier}`,
  {
    'is-empty-bottle': props.totalStars <= 0,
    'is-rainbow-glow': props.isRainbowGlow,
  },
])

watch(() => props.active, (active) => {
  if (active) {
    startAnimation()
  } else {
    stopAnimation(false)
  }
})

onBeforeUnmount(() => {
  stopAnimation(false)
})

function startAnimation() {
  stopAnimation(false)
  isVisible.value = true

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  finishTimerId = window.setTimeout(
    () => stopAnimation(true),
    prefersReducedMotion ? 900 : props.durationMs,
  )
}

function stopAnimation(shouldEmit: boolean) {
  if (finishTimerId) {
    window.clearTimeout(finishTimerId)
    finishTimerId = 0
  }

  if (isVisible.value) {
    isVisible.value = false
  }

  if (shouldEmit) {
    emit('finished')
  }
}

function compactWishBottleStarKinds(totalStars: number) {
  const values: Array<{ kind: WishBottleDisplayStarKind; representedStars: number }> = [
    { kind: 'myriad', representedStars: 10000 },
    { kind: 'thousand', representedStars: 1000 },
    { kind: 'hundred', representedStars: 100 },
    { kind: 'ten', representedStars: 10 },
    { kind: 'single', representedStars: 1 },
  ]

  if (totalStars <= 0) {
    return [] as Array<{ kind: WishBottleDisplayStarKind; representedStars: number }>
  }

  const stars: Array<{ kind: WishBottleDisplayStarKind; representedStars: number }> = []
  let remainingStars = totalStars

  for (const item of values) {
    const count = Math.floor(remainingStars / item.representedStars)

    for (let index = 0; index < count; index += 1) {
      stars.push(item)
    }

    remainingStars %= item.representedStars
  }

  while (stars.length > WISH_BOTTLE_MAX_DISPLAY_STARS) {
    const lastStar = stars.pop()
    if (!lastStar) {
      break
    }
  }

  return stars
}

function buildWishBottleDisplayedStars(totalStars: number) {
  const stars = compactWishBottleStarKinds(totalStars)
  const displayStarCount = stars.length

  if (!displayStarCount) {
    return [] as WishBottleDisplayStar[]
  }

  const gradeBands: Record<WishBottleDisplayStarKind, { minY: number; maxY: number; minX: number; maxX: number }> = {
    myriad: { minX: 82, maxX: 134, minY: 175, maxY: 215 },
    thousand: { minX: 58, maxX: 158, minY: 205, maxY: 255 },
    hundred: { minX: 48, maxX: 168, minY: 245, maxY: 298 },
    ten: { minX: 42, maxX: 174, minY: 288, maxY: 338 },
    single: { minX: 45, maxX: 171, minY: 320, maxY: 356 },
  }

  const groupedStars = stars.reduce<Record<WishBottleDisplayStarKind, Array<{ kind: WishBottleDisplayStarKind; representedStars: number }>>>((groups, star) => {
    groups[star.kind].push(star)
    return groups
  }, { single: [], ten: [], hundred: [], thousand: [], myriad: [] })

  const orderedKinds: WishBottleDisplayStarKind[] = ['myriad', 'thousand', 'hundred', 'ten', 'single']
  const result: WishBottleDisplayStar[] = []

  orderedKinds.forEach((kind) => {
    const kindStars = groupedStars[kind]
    const band = gradeBands[kind]
    const columns = Math.min(kindStars.length, kind === 'single' || kind === 'ten' ? 6 : 4)
    const rows = Math.max(1, Math.ceil(kindStars.length / Math.max(1, columns)))
    const columnGap = columns > 1 ? (band.maxX - band.minX) / (columns - 1) : 0
    const rowGap = rows > 1 ? (band.maxY - band.minY) / (rows - 1) : 0

    kindStars.forEach((star, index) => {
      const row = Math.floor(index / Math.max(1, columns))
      const column = index % Math.max(1, columns)
      const jitterX = Math.sin(index * 1.9 + star.representedStars) * 3
      const jitterY = Math.cos(index * 1.4 + star.representedStars) * 3

      result.push({
        kind: star.kind,
        representedStars: star.representedStars,
        rotate: (index * 47 + star.representedStars) % 360,
        scale: getWishBottleStarScale(star.kind),
        x: band.minX + column * columnGap + (row % 2 ? Math.min(8, columnGap * 0.4) : 0) + jitterX,
        y: band.maxY - row * rowGap + jitterY,
      })
    })
  })

  return result
}

function getWishBottleStarScale(kind: WishBottleDisplayStarKind) {
  if (kind === 'myriad') return 1.34
  if (kind === 'thousand') return 1.24
  if (kind === 'hundred') return 1.08
  if (kind === 'ten') return 0.98
  return 0.82
}
</script>

<template>
  <div v-if="isVisible" class="wish-bottle-star-drop" :class="bottleClasses" aria-hidden="true">
    <div class="wish-bottle-star-drop-scene">
      <svg class="wish-bottle-star-drop-star is-main" viewBox="-14 -14 28 28">
        <path :d="WISH_BOTTLE_STAR_PATH" />
      </svg>
      <svg class="wish-bottle-star-drop-star is-small is-left" viewBox="-14 -14 28 28">
        <path :d="WISH_BOTTLE_STAR_PATH" />
      </svg>
      <svg class="wish-bottle-star-drop-star is-small is-right" viewBox="-14 -14 28 28">
        <path :d="WISH_BOTTLE_STAR_PATH" />
      </svg>

      <svg class="wish-bottle-star-drop-bottle" viewBox="0 0 216 404" role="img">
        <defs>
          <linearGradient id="wish-bottle-star-drop-glass" x1="22" x2="185" y1="26" y2="386" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.72" />
            <stop offset="0.18" stop-color="var(--wish-glass-tint)" stop-opacity="0.64" />
            <stop offset="0.44" stop-color="#ffffff" stop-opacity="0.18" />
            <stop offset="0.72" stop-color="var(--wish-glass-tint)" stop-opacity="0.34" />
            <stop offset="1" stop-color="rgba(20,80,130,.12)" stop-opacity="0.54" />
          </linearGradient>
          <linearGradient id="wish-bottle-star-drop-stroke" x1="42" x2="168" y1="30" y2="382" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.9" />
            <stop offset="0.22" stop-color="var(--wish-glass-stroke)" stop-opacity="0.78" />
            <stop offset="0.74" stop-color="var(--wish-glass-strong)" stop-opacity="0.72" />
            <stop offset="1" stop-color="#ffffff" stop-opacity="0.76" />
          </linearGradient>
          <linearGradient id="wish-bottle-star-drop-fill" x1="108" x2="108" y1="210" y2="392" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="rgba(255,255,255,.08)" />
            <stop offset="0.32" stop-color="var(--wish-star-2)" stop-opacity="0.16" />
            <stop offset="1" stop-color="var(--wish-glass-strong)" stop-opacity="0.42" />
          </linearGradient>
          <linearGradient id="wish-bottle-star-drop-cork" x1="76" x2="140" y1="0" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#f0c78f" />
            <stop offset="0.48" stop-color="#d7a66d" />
            <stop offset="1" stop-color="#a9713d" />
          </linearGradient>
          <linearGradient id="wish-bottle-star-drop-ribbon" x1="45" x2="172" y1="55" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="var(--wish-ribbon-1)" />
            <stop offset="0.38" stop-color="var(--wish-ribbon-2)" />
            <stop offset="1" stop-color="var(--wish-ribbon-3)" />
          </linearGradient>
          <linearGradient id="wish-bottle-star-drop-star-fill" x1="-9" x2="13" y1="-9" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="var(--wish-star-1)" />
            <stop offset="0.44" stop-color="var(--wish-star-2)" />
            <stop offset="1" stop-color="var(--wish-star-3)" />
          </linearGradient>
          <linearGradient id="wish-bottle-star-drop-ten-fill" x1="-10" x2="12" y1="-10" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#fff9df" />
            <stop offset="0.48" stop-color="#ffd36d" />
            <stop offset="1" stop-color="#d88a1f" />
          </linearGradient>
          <linearGradient id="wish-bottle-star-drop-platinum-fill" x1="-12" x2="14" y1="-12" y2="16" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#ffffff" />
            <stop offset="0.26" stop-color="#f2f6fb" />
            <stop offset="0.52" stop-color="#b8c4cf" />
            <stop offset="0.74" stop-color="#fffdf7" />
            <stop offset="1" stop-color="#8fa0ae" />
          </linearGradient>
          <filter id="wish-bottle-star-drop-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.9" flood-color="var(--wish-star-glow)" flood-opacity="0.62" />
            <feDropShadow dx="0" dy="1" stdDeviation="3.6" flood-color="var(--wish-star-glow)" flood-opacity="0.18" />
          </filter>
          <path id="wish-bottle-star-drop-path" d="M87 28 C78 28 74 34 74 45 L74 111 C74 133 63 146 47 158 C25 174 18 198 18 234 L18 338 C18 374 47 392 108 392 C169 392 198 374 198 338 L198 234 C198 174 191 174 169 158 C153 146 142 133 142 111 L142 45 C142 34 138 28 129 28 Z" />
          <clipPath id="wish-bottle-star-drop-clip">
            <use href="#wish-bottle-star-drop-path" />
          </clipPath>
        </defs>
        <g class="wish-bottle-star-drop-cork">
          <path d="M82 3 C82 -2 86 -5 92 -5 L124 -5 C130 -5 134 -2 134 3 L130 52 C129 61 122 66 108 66 C94 66 87 61 86 52 Z" />
          <ellipse cx="108" cy="3" rx="27" ry="9" />
        </g>
        <use href="#wish-bottle-star-drop-path" class="wish-bottle-star-drop-outline" />
        <use href="#wish-bottle-star-drop-path" class="wish-bottle-star-drop-glass" />
        <g clip-path="url(#wish-bottle-star-drop-clip)">
          <rect class="wish-bottle-star-drop-fill" x="18" y="255" width="180" height="137" />
          <ellipse class="wish-bottle-star-drop-haze" cx="108" cy="336" rx="72" ry="31" />
          <path class="wish-bottle-star-drop-shadow" d="M36 218 C42 244 42 305 39 348" />
          <path class="wish-bottle-star-drop-shine" d="M55 54 C43 110 43 198 51 315" />
          <g class="wish-bottle-star-drop-stars-layer">
            <g
              v-for="(star, index) in displayedStars"
              :key="`wish-bottle-star-drop-stored-${index}`"
              class="wish-bottle-star-drop-stored-star"
              :class="[`is-${star.kind}-star`, { 'is-new-star': index === displayedStars.length - 1 }]"
              :transform="`translate(${star.x} ${star.y}) rotate(${star.rotate}) scale(${star.scale})`"
            >
              <template v-if="star.kind === 'myriad'">
                <ellipse class="wish-bottle-star-drop-orbit is-platinum-outer" cx="0" cy="0" rx="17" ry="9" />
                <ellipse class="wish-bottle-star-drop-orbit is-platinum-inner" cx="0" cy="0" rx="11" ry="6" />
                <circle class="wish-bottle-star-drop-orbit-dot" cx="15" cy="0" r="1.45" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-platinum-fill" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-material-shine" />
              </template>
              <template v-else-if="star.kind === 'thousand'">
                <ellipse class="wish-bottle-star-drop-orbit is-gold-outer" cx="0" cy="0" rx="16" ry="8" />
                <ellipse class="wish-bottle-star-drop-orbit is-gold-inner" cx="0" cy="0" rx="10" ry="5.4" />
                <circle class="wish-bottle-star-drop-orbit-dot" cx="16" cy="0" r="1.2" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-gold-fill" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-material-shine" />
              </template>
              <template v-else-if="star.kind === 'hundred'">
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-platinum-fill" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-material-shine" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-tier-outline" />
                <circle class="wish-bottle-star-drop-tier-particle" r="1.15">
                  <animateMotion :path="WISH_BOTTLE_STAR_PATH" dur="4.4s" repeatCount="indefinite" />
                </circle>
              </template>
              <template v-else-if="star.kind === 'ten'">
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-gold-fill" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-material-shine" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-tier-outline" />
                <circle class="wish-bottle-star-drop-tier-particle" r="1">
                  <animateMotion :path="WISH_BOTTLE_STAR_PATH" dur="3.8s" repeatCount="indefinite" />
                </circle>
              </template>
              <template v-else>
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-single-fill" />
                <path :d="WISH_BOTTLE_STAR_PATH" class="wish-bottle-star-drop-star-highlight" />
              </template>
            </g>
          </g>
          <text class="wish-bottle-star-drop-count" x="108" y="235" text-anchor="middle">{{ visibleStarCountLabel }}</text>
        </g>
        <ellipse class="wish-bottle-star-drop-mouth" cx="108" cy="40" rx="39" ry="12" />
        <path class="wish-bottle-star-drop-ribbon" d="M73 69 C90 76 126 76 143 69 L142 75 C125 83 91 83 74 75 Z" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.wish-bottle-star-drop {
  --wish-glass-tint: rgba(255, 178, 205, 0.16);
  --wish-glass-stroke: rgba(216, 95, 147, 0.48);
  --wish-glass-strong: rgba(190, 95, 134, 0.68);
  --wish-glow: rgba(216, 95, 147, 0.28);
  --wish-star-1: #fff6fb;
  --wish-star-2: #ff9ec1;
  --wish-star-3: #d85f93;
  --wish-star-glow: rgba(216, 95, 147, 0.52);
  --wish-star-outline: rgba(216, 95, 147, 0.82);
  --wish-orbit-strong: rgba(216, 95, 147, 0.82);
  --wish-orbit-soft: rgba(255, 158, 193, 0.62);
  --wish-orbit-dot: #fff6fb;
  --wish-ribbon-1: #f7a8c4;
  --wish-ribbon-2: #d85f93;
  --wish-ribbon-3: #fff2f7;
  position: fixed;
  inset: 0;
  z-index: 70;
  pointer-events: none;
}

.wish-bottle-star-drop.tier-green {
  --wish-glass-tint: rgba(72, 196, 128, 0.13);
  --wish-glass-stroke: rgba(51, 177, 112, 0.52);
  --wish-glass-strong: rgba(22, 135, 86, 0.74);
  --wish-glow: rgba(51, 177, 112, 0.3);
  --wish-star-1: #effff6;
  --wish-star-2: #64d994;
  --wish-star-3: #158c5d;
  --wish-star-glow: rgba(51, 177, 112, 0.52);
  --wish-star-outline: rgba(51, 177, 112, 0.9);
  --wish-orbit-strong: rgba(51, 177, 112, 0.88);
  --wish-orbit-soft: rgba(155, 231, 180, 0.64);
  --wish-orbit-dot: #effff6;
  --wish-ribbon-1: #9be7b4;
  --wish-ribbon-2: #2aa56a;
  --wish-ribbon-3: #f1fff6;
}

.wish-bottle-star-drop.tier-orange {
  --wish-glass-tint: rgba(255, 142, 72, 0.14);
  --wish-glass-stroke: rgba(236, 119, 55, 0.54);
  --wish-glass-strong: rgba(193, 78, 30, 0.74);
  --wish-glow: rgba(236, 119, 55, 0.34);
  --wish-star-1: #fff1e7;
  --wish-star-2: #ff9b4a;
  --wish-star-3: #cf5520;
  --wish-star-glow: rgba(236, 119, 55, 0.56);
  --wish-star-outline: rgba(236, 119, 55, 0.9);
  --wish-orbit-strong: rgba(236, 119, 55, 0.88);
  --wish-orbit-soft: rgba(255, 189, 154, 0.66);
  --wish-orbit-dot: #fff1df;
  --wish-ribbon-1: #ffbd9a;
  --wish-ribbon-2: #d9673d;
  --wish-ribbon-3: #fff1df;
}

.wish-bottle-star-drop.tier-gold {
  --wish-glass-tint: rgba(246, 199, 79, 0.15);
  --wish-glass-stroke: rgba(234, 179, 64, 0.58);
  --wish-glass-strong: rgba(190, 122, 33, 0.78);
  --wish-glow: rgba(234, 179, 64, 0.38);
  --wish-star-1: #fff9e2;
  --wish-star-2: #f4c64f;
  --wish-star-3: #c9791f;
  --wish-star-glow: rgba(234, 179, 64, 0.62);
  --wish-star-outline: rgba(234, 179, 64, 0.94);
  --wish-orbit-strong: rgba(234, 179, 64, 0.92);
  --wish-orbit-soft: rgba(255, 223, 122, 0.68);
  --wish-orbit-dot: #fff3c4;
  --wish-ribbon-1: #f9c773;
  --wish-ribbon-2: #c97a25;
  --wish-ribbon-3: #fff3c4;
}

.wish-bottle-star-drop.tier-rainbow,
.wish-bottle-star-drop.is-rainbow-glow {
  --wish-glass-tint: rgba(255, 218, 112, 0.16);
  --wish-glass-stroke: rgba(246, 191, 80, 0.62);
  --wish-glass-strong: rgba(214, 145, 48, 0.82);
  --wish-glow: rgba(255, 204, 84, 0.48);
  --wish-star-1: #fffdf2;
  --wish-star-2: #ff9ec1;
  --wish-star-3: #50d7e9;
  --wish-star-glow: rgba(255, 211, 94, 0.78);
  --wish-star-outline: rgba(195, 123, 255, 0.9);
  --wish-orbit-strong: rgba(255, 158, 193, 0.9);
  --wish-orbit-soft: rgba(80, 215, 233, 0.72);
  --wish-orbit-dot: #fff6bf;
  --wish-ribbon-1: #ffd1dc;
  --wish-ribbon-2: #c37bff;
  --wish-ribbon-3: #fff6bf;
}

.wish-bottle-star-drop.is-empty-bottle {
  --wish-glass-tint: rgba(207, 221, 239, 0.11);
  --wish-glass-stroke: rgba(141, 170, 211, 0.34);
  --wish-glass-strong: rgba(121, 151, 194, 0.42);
  --wish-glow: rgba(133, 162, 203, 0.12);
  --wish-star-1: #f6f9fd;
  --wish-star-2: #dce7f3;
  --wish-star-3: #b0c1d6;
  --wish-star-glow: rgba(133, 162, 203, 0.18);
  --wish-star-outline: rgba(141, 170, 211, 0.52);
  --wish-orbit-strong: rgba(141, 170, 211, 0.48);
  --wish-orbit-soft: rgba(207, 221, 239, 0.42);
  --wish-orbit-dot: #f6f9fd;
  --wish-ribbon-1: #ecd7df;
  --wish-ribbon-2: #c39bab;
  --wish-ribbon-3: #fff6f8;
}

.wish-bottle-star-drop-scene {
  position: absolute;
  top: clamp(11rem, 34vh, 22rem);
  left: 50%;
  width: 12.2rem;
  height: 18rem;
  transform: translateX(-50%);
  animation: wish-bottle-drop-scene 3000ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.wish-bottle-star-drop-bottle {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 10.4rem;
  transform: translateX(-50%);
  filter: drop-shadow(0 18px 24px rgba(74, 50, 33, 0.12));
}

.wish-bottle-star-drop-cork path {
  fill: url(#wish-bottle-star-drop-cork);
}

.wish-bottle-star-drop-cork ellipse {
  fill: #efc991;
  opacity: 0.95;
}

.wish-bottle-star-drop-outline {
  fill: none;
  opacity: 0.95;
  stroke: url(#wish-bottle-star-drop-stroke);
  stroke-linejoin: round;
  stroke-width: 7.2;
}

.wish-bottle-star-drop-glass {
  fill: url(#wish-bottle-star-drop-glass);
  stroke: rgba(255, 255, 255, 0.58);
  stroke-width: 1.2;
}

.wish-bottle-star-drop-fill {
  fill: url(#wish-bottle-star-drop-fill);
  animation: wish-bottle-fill-glow 3000ms ease-out both;
}

.wish-bottle-star-drop-haze {
  fill: rgba(255, 255, 255, 0.3);
}

.wish-bottle-star-drop-shadow {
  fill: none;
  opacity: 0.34;
  stroke: rgba(13, 69, 115, 0.18);
  stroke-linecap: round;
  stroke-width: 16;
}

.wish-bottle-star-drop-shine {
  fill: none;
  opacity: 0.76;
  stroke: rgba(255, 255, 255, 0.66);
  stroke-linecap: round;
  stroke-width: 15;
}

.wish-bottle-star-drop-mouth {
  fill: rgba(255, 255, 255, 0.4);
  stroke: url(#wish-bottle-star-drop-stroke);
  stroke-width: 3;
}

.wish-bottle-star-drop-ribbon {
  fill: url(#wish-bottle-star-drop-ribbon);
  opacity: 0.97;
}

.wish-bottle-star-drop-stored-star {
  filter: url(#wish-bottle-star-drop-glow);
  opacity: 0.86;
}

.wish-bottle-star-drop-single-fill {
  fill: url(#wish-bottle-star-drop-star-fill);
}

.wish-bottle-star-drop-gold-fill {
  fill: url(#wish-bottle-star-drop-ten-fill);
}

.wish-bottle-star-drop-platinum-fill {
  fill: url(#wish-bottle-star-drop-platinum-fill);
}

.wish-bottle-star-drop-stored-star.is-new-star {
  animation: wish-bottle-new-star 3000ms ease-out both;
  transform-box: fill-box;
  transform-origin: center;
}

.wish-bottle-star-drop-material-shine,
.wish-bottle-star-drop-tier-outline {
  fill: none;
  stroke-linejoin: round;
}

.wish-bottle-star-drop-material-shine {
  stroke: rgba(255, 255, 255, 0.62);
  stroke-width: 0.9;
  opacity: 0.66;
}

.wish-bottle-star-drop-tier-outline {
  stroke: var(--wish-star-outline);
  stroke-width: 1.08;
  opacity: 0.84;
  filter: drop-shadow(0 0 4px var(--wish-orbit-soft));
}

.wish-bottle-star-drop-tier-particle {
  fill: var(--wish-orbit-dot);
  filter: drop-shadow(0 0 4px var(--wish-orbit-strong)) drop-shadow(0 0 7px var(--wish-orbit-soft));
  opacity: 0.96;
}

.wish-bottle-star-drop-orbit {
  fill: none;
  stroke-linecap: round;
  transform-box: fill-box;
  transform-origin: center;
}

.wish-bottle-star-drop-orbit.is-platinum-outer,
.wish-bottle-star-drop-orbit.is-gold-outer {
  stroke: var(--wish-orbit-strong);
  stroke-width: 1.05;
  stroke-dasharray: 15 10;
  animation: wish-bottle-star-drop-orbit-flow 12s linear infinite;
}

.wish-bottle-star-drop-orbit.is-platinum-inner,
.wish-bottle-star-drop-orbit.is-gold-inner {
  stroke: var(--wish-orbit-soft);
  stroke-width: 0.86;
  stroke-dasharray: 5 8;
  animation: wish-bottle-star-drop-orbit-flow 9s linear infinite reverse;
}

.wish-bottle-star-drop-orbit-dot {
  fill: var(--wish-orbit-dot);
  filter: drop-shadow(0 0 4px var(--wish-orbit-soft));
  opacity: 0.9;
}

.wish-bottle-star-drop-star-highlight {
  fill: none;
  stroke: var(--wish-star-outline);
  stroke-linejoin: round;
  stroke-width: 1.05;
  opacity: 0.52;
}

.wish-bottle-star-drop-count {
  fill: rgba(61, 46, 40, 0.64);
  font-family: var(--font-body);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.wish-bottle-star-drop-star {
  position: absolute;
  z-index: 2;
  width: 1.2rem;
  height: 1.2rem;
  overflow: visible;
  filter: drop-shadow(0 0 8px rgba(255, 201, 79, 0.58));
}

.wish-bottle-star-drop-star path {
  fill: var(--wish-star-2);
}

.wish-bottle-star-drop-star.is-main {
  top: 0;
  left: 50%;
  width: 1.35rem;
  height: 1.35rem;
  transform: translateX(-50%);
  animation: wish-bottle-main-star 3000ms cubic-bezier(0.2, 0.86, 0.32, 1) both;
}

.wish-bottle-star-drop-star.is-small {
  top: 2.5rem;
  width: 0.82rem;
  height: 0.82rem;
  opacity: 0;
}

.wish-bottle-star-drop-star.is-left {
  left: 1.4rem;
  animation: wish-bottle-spark-left 3000ms ease-out both;
}

.wish-bottle-star-drop-star.is-right {
  right: 1.2rem;
  animation: wish-bottle-spark-right 3000ms ease-out both;
}

@keyframes wish-bottle-main-star {
  0% {
    opacity: 0;
    transform: translate(-50%, -0.8rem) scale(0.72) rotate(-12deg);
  }

  18% {
    opacity: 1;
  }

  62% {
    opacity: 1;
    transform: translate(-50%, 6.75rem) scale(1) rotate(18deg);
  }

  74% {
    opacity: 0;
    transform: translate(-50%, 7.45rem) scale(0.44) rotate(32deg);
  }

  100% {
    opacity: 0;
    transform: translate(-50%, 7.45rem) scale(0.44) rotate(32deg);
  }
}

@keyframes wish-bottle-spark-left {
  28% {
    opacity: 0;
    transform: translate(0, 0) scale(0.7);
  }

  48% {
    opacity: 0.9;
    transform: translate(-0.55rem, -0.55rem) scale(1);
  }

  88%, 100% {
    opacity: 0;
    transform: translate(-0.9rem, -1rem) scale(0.6);
  }
}

@keyframes wish-bottle-spark-right {
  34% {
    opacity: 0;
    transform: translate(0, 0) scale(0.7);
  }

  56% {
    opacity: 0.9;
    transform: translate(0.52rem, -0.42rem) scale(1);
  }

  88%, 100% {
    opacity: 0;
    transform: translate(0.82rem, -0.9rem) scale(0.58);
  }
}

@keyframes wish-bottle-fill-glow {
  0%, 58% {
    opacity: 0.62;
  }

  72% {
    opacity: 0.95;
  }

  100% {
    opacity: 0.62;
  }
}

@keyframes wish-bottle-new-star {
  0%, 62% {
    opacity: 0;
    transform: scale(0.3);
  }

  76% {
    opacity: 1;
    transform: scale(1.35);
  }

  100% {
    opacity: 0.86;
    transform: scale(1);
  }
}

@keyframes wish-bottle-star-drop-orbit-flow {
  0% {
    stroke-dashoffset: 0;
    transform: rotate(0deg);
  }

  100% {
    stroke-dashoffset: -54;
    transform: rotate(360deg);
  }
}

@keyframes wish-bottle-drop-scene {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(0.35rem) scale(0.96);
  }

  12%, 78% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(-0.35rem) scale(0.98);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wish-bottle-star-drop-scene,
  .wish-bottle-star-drop-star,
  .wish-bottle-star-drop-fill,
  .wish-bottle-star-drop-stored-star.is-new-star {
    animation-duration: 900ms;
  }
}
</style>