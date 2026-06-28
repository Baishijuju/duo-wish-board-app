<script setup lang="ts">
import { computed, ref } from 'vue'

const WISH_BOTTLE_STAR_PATH = 'M0,-10 L2.9,-3.2 L10,-3.1 L4.2,1.4 L6.1,8.8 L0,4.7 L-6.1,8.8 L-4.2,1.4 L-10,-3.1 L-2.9,-3.2 Z'
const WISH_BOTTLE_MAX_DISPLAY_STARS = 30

type StarGrade = 'single' | 'ten' | 'hundred' | 'thousand' | 'myriad'
type WishBottleColorTier = 'blue' | 'green' | 'orange' | 'gold' | 'rainbow'

interface DemoStar {
  delay: string
  duration: string
  grade: StarGrade
  rotate: number
  scale: number
  value: number
  x: number
  y: number
}

const completedTaskUnits = ref(1800)
const totalTaskUnits = ref(2000)
const activeWishCount = ref(3)
const trackedWishCount = ref(3)
const normalizedStarCount = computed(() => Math.max(0, Math.floor(Number(completedTaskUnits.value) || 0)))
const normalizedTotalTaskUnits = computed(() => Math.max(0, Math.floor(Number(totalTaskUnits.value) || 0)))
const normalizedActiveWishCount = computed(() => Math.max(0, Math.floor(Number(activeWishCount.value) || 0)))
const normalizedTrackedWishCount = computed(() => Math.max(0, Math.floor(Number(trackedWishCount.value) || 0)))
const demoDisplayStarCount = computed(() => {
  if (!normalizedActiveWishCount.value || !normalizedTrackedWishCount.value || !normalizedTotalTaskUnits.value) {
    return 0
  }

  return normalizedStarCount.value
})
const displayStars = computed(() => buildDisplayStars(demoDisplayStarCount.value))
const demoOverallPercent = computed(() => {
  if (!normalizedActiveWishCount.value || !normalizedTrackedWishCount.value || !normalizedTotalTaskUnits.value) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((normalizedStarCount.value / normalizedTotalTaskUnits.value) * 100)))
})
const demoColorTier = computed(() => getWishBottleColorTier(demoOverallPercent.value))
const demoRevealHeight = computed(() => getWishBottleRevealHeight())
const demoDreamfieldOpacity = computed(() => getWishBottleDreamfieldOpacity())
const demoProgressHazeOpacity = computed(() => demoRevealHeight.value ? Math.min(0.72, 0.18 + demoDreamfieldOpacity.value) : 0)
const isDemoRainbowGlow = computed(() => demoOverallPercent.value > 80)
const representedTotal = computed(() => displayStars.value.reduce((total, star) => total + star.value, 0))
const hiddenStars = computed(() => Math.max(0, demoDisplayStarCount.value - representedTotal.value))

const starGradeSpecs: Array<{ grade: StarGrade; label: string; value: string; description: string }> = [
  { grade: 'single', label: '小星', value: '1', description: '基础星星，保持轻巧，不加轨道。' },
  { grade: 'ten', label: '黄金星', value: '10', description: '温润黄金材质，描边会跟着愿望瓶颜色变化。' },
  { grade: 'hundred', label: '铂金星', value: '100', description: '冷白铂金材质，比黄金星更高一阶。' },
  { grade: 'thousand', label: '双轨黄金星', value: '1,000', description: '黄金星体配两条联动轨道，像一枚小纪念章。' },
  { grade: 'myriad', label: '双轨铂金星', value: '10,000', description: '铂金星体配两条联动轨道，等级感最高。' },
]

function buildDisplayStars(totalStars: number) {
  const values: Array<{ grade: StarGrade; value: number }> = [
    { grade: 'myriad', value: 10000 },
    { grade: 'thousand', value: 1000 },
    { grade: 'hundred', value: 100 },
    { grade: 'ten', value: 10 },
    { grade: 'single', value: 1 },
  ]

  const stars: Array<{ grade: StarGrade; value: number }> = []
  let remainingStars = totalStars

  for (const item of values) {
    const count = Math.floor(remainingStars / item.value)
    for (let index = 0; index < count; index += 1) {
      stars.push(item)
    }
    remainingStars %= item.value
  }

  while (stars.length > WISH_BOTTLE_MAX_DISPLAY_STARS) {
    const lastStar = stars.pop()
    if (!lastStar) {
      break
    }
  }

  return layoutStars(stars)
}

function layoutStars(stars: Array<{ grade: StarGrade; value: number }>) {
  const gradeBands: Record<StarGrade, { minY: number; maxY: number; minX: number; maxX: number }> = {
    myriad: { minX: 82, maxX: 134, minY: 175, maxY: 215 },
    thousand: { minX: 58, maxX: 158, minY: 205, maxY: 255 },
    hundred: { minX: 48, maxX: 168, minY: 245, maxY: 298 },
    ten: { minX: 42, maxX: 174, minY: 288, maxY: 338 },
    single: { minX: 45, maxX: 171, minY: 320, maxY: 356 },
  }

  const groupedStars = stars.reduce<Record<StarGrade, Array<{ grade: StarGrade; value: number }>>>((groups, star) => {
    groups[star.grade].push(star)
    return groups
  }, { single: [], ten: [], hundred: [], thousand: [], myriad: [] })

  const orderedGrades: StarGrade[] = ['myriad', 'thousand', 'hundred', 'ten', 'single']
  const result: DemoStar[] = []

  orderedGrades.forEach((grade) => {
    const gradeStars = groupedStars[grade]
    const band = gradeBands[grade]
    const columns = Math.min(gradeStars.length, grade === 'single' || grade === 'ten' ? 6 : 4)
    const rows = Math.max(1, Math.ceil(gradeStars.length / Math.max(1, columns)))
    const columnGap = columns > 1 ? (band.maxX - band.minX) / (columns - 1) : 0
    const rowGap = rows > 1 ? (band.maxY - band.minY) / (rows - 1) : 0

    gradeStars.forEach((star, index) => {
      const row = Math.floor(index / Math.max(1, columns))
      const column = index % Math.max(1, columns)
      const jitterX = Math.sin(index * 1.9 + star.value) * 3
      const jitterY = Math.cos(index * 1.4 + star.value) * 3

      result.push({
        grade: star.grade,
        delay: `${result.length * 42}ms`,
        duration: `${getGradeMotionDuration(star.grade) + (result.length % 3) * 0.4}s`,
        rotate: (index * 47 + star.value) % 360,
        scale: getGradeScale(star.grade),
        value: star.value,
        x: band.minX + column * columnGap + (row % 2 ? Math.min(8, columnGap * 0.4) : 0) + jitterX,
        y: band.maxY - row * rowGap + jitterY,
      })
    })
  })

  return result
}

function getGradeScale(grade: StarGrade) {
  if (grade === 'myriad') return 1.34
  if (grade === 'thousand') return 1.24
  if (grade === 'hundred') return 1.08
  if (grade === 'ten') return 0.98
  return 0.82
}

function getGradeMotionDuration(grade: StarGrade) {
  if (grade === 'myriad') return 14
  if (grade === 'thousand') return 12
  if (grade === 'hundred') return 10
  if (grade === 'ten') return 8
  return 5.6
}

function getWishBottleColorTier(percent: number): WishBottleColorTier {
  const normalizedPercent = Math.max(0, Math.min(100, Math.round(percent)))

  if (normalizedPercent <= 20) {
    return 'blue'
  }

  if (normalizedPercent <= 40) {
    return 'green'
  }

  if (normalizedPercent <= 60) {
    return 'orange'
  }

  if (normalizedPercent <= 80) {
    return 'gold'
  }

  return 'rainbow'
}

function getWishBottleRevealHeight() {
  if (!normalizedActiveWishCount.value || !normalizedTrackedWishCount.value || demoOverallPercent.value <= 0) {
    return 0
  }

  return Math.max(48, Math.min(188, Math.round(demoOverallPercent.value * 1.42)))
}

function getWishBottleDreamfieldOpacity() {
  if (!normalizedActiveWishCount.value || !normalizedTrackedWishCount.value) {
    return 0
  }

  return Math.min(0.88, Math.max(0.14, demoOverallPercent.value / 135))
}
</script>

<template>
  <section class="star-demo-page">
    <article class="star-demo-intro page-card">
      <div>
        <p class="star-demo-kicker">愿望瓶星等测试</p>
        <h1>看看不同数量会怎样住进瓶子里</h1>
        <p>这里不会改真实数据，只用来调试首页愿望瓶随任务进度变化的样子。</p>
      </div>

      <div class="star-demo-controls">
        <label class="star-demo-control">
          <span>已完成任务单位 / 星星数</span>
          <input v-model.number="completedTaskUnits" type="number" min="0" step="1" />
        </label>
        <label class="star-demo-control">
          <span>总任务单位</span>
          <input v-model.number="totalTaskUnits" type="number" min="0" step="1" />
        </label>
        <label class="star-demo-control">
          <span>活跃愿望数</span>
          <input v-model.number="activeWishCount" type="number" min="0" step="1" />
        </label>
        <label class="star-demo-control">
          <span>被追踪的愿望数</span>
          <input v-model.number="trackedWishCount" type="number" min="0" step="1" />
        </label>
      </div>
    </article>

    <article
      :class="[
        'star-demo-board',
        'page-card',
        `tier-${demoColorTier}`,
        {
          'is-empty-bottle': !normalizedActiveWishCount,
          'is-rainbow-glow': isDemoRainbowGlow,
        },
      ]"
    >
      <div class="star-demo-bottle-panel">
        <div class="star-demo-bottle-visual">
          <div class="star-demo-bottle-aura"></div>
          <span class="star-demo-bottle-sparkle sparkle-one"></span>
          <span class="star-demo-bottle-sparkle sparkle-two"></span>
          <span class="star-demo-bottle-sparkle sparkle-three"></span>
          <div class="wish-bottle-shell">
          <svg class="wish-bottle-svg" viewBox="-50 0 316 404" role="img" aria-label="愿望瓶星等演示">
            <defs>
              <linearGradient id="star-demo-glass-fill" x1="22" y1="26" x2="185" y2="386" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff" stop-opacity=".74" />
                <stop offset=".18" stop-color="var(--wish-glass-tint)" stop-opacity=".72" />
                <stop offset=".44" stop-color="#fff" stop-opacity=".18" />
                <stop offset=".72" stop-color="var(--wish-glass-tint)" stop-opacity=".38" />
                <stop offset="1" stop-color="rgba(20,80,130,.12)" stop-opacity=".56" />
              </linearGradient>
              <linearGradient id="star-demo-glass-stroke" x1="42" y1="30" x2="168" y2="382" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff" stop-opacity=".92" />
                <stop offset=".2" stop-color="var(--wish-glass-stroke)" stop-opacity=".86" />
                <stop offset=".75" stop-color="var(--wish-glass-strong)" stop-opacity=".92" />
                <stop offset="1" stop-color="#fff" stop-opacity=".78" />
              </linearGradient>
              <linearGradient id="star-demo-cork" x1="76" y1="0" x2="140" y2="82" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#f0c78f" />
                <stop offset=".48" stop-color="#d7a66d" />
                <stop offset="1" stop-color="#a9713d" />
              </linearGradient>
              <linearGradient id="star-demo-ribbon" x1="45" y1="55" x2="172" y2="120" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="var(--wish-ribbon-3)" />
                <stop offset=".36" stop-color="var(--wish-ribbon-1)" />
                <stop offset="1" stop-color="var(--wish-ribbon-2)" />
              </linearGradient>
              <linearGradient id="star-demo-field" x1="108" y1="180" x2="108" y2="392" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="rgba(255,255,255,.06)" />
                <stop offset=".24" stop-color="var(--wish-glow)" stop-opacity=".12" />
                <stop offset="1" stop-color="var(--wish-glass-tint)" stop-opacity=".48" />
              </linearGradient>
              <linearGradient id="star-demo-rainbow-sheen" x1="28" y1="160" x2="188" y2="370" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff6bf" stop-opacity="0" />
                <stop offset=".18" stop-color="#ff9ec1" stop-opacity=".5" />
                <stop offset=".42" stop-color="#ffd978" stop-opacity=".44" />
                <stop offset=".66" stop-color="#50d7e9" stop-opacity=".46" />
                <stop offset="1" stop-color="#c37bff" stop-opacity="0" />
              </linearGradient>
              <radialGradient id="star-demo-bottom-glow" cx="50%" cy="76%" r="55%">
                <stop offset="0" stop-color="#fff" stop-opacity=".55" />
                <stop offset=".52" stop-color="var(--wish-glass-tint)" stop-opacity=".18" />
                <stop offset="1" stop-color="#fff" stop-opacity="0" />
              </radialGradient>
              <linearGradient id="star-demo-single" x1="-9" y1="-9" x2="13" y2="15" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="var(--wish-star-1)" />
                <stop offset=".44" stop-color="var(--wish-star-2)" />
                <stop offset="1" stop-color="var(--wish-star-3)" />
              </linearGradient>
              <linearGradient id="star-demo-platinum" x1="-12" y1="-12" x2="14" y2="16" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#ffffff" />
                <stop offset=".26" stop-color="#f2f6fb" />
                <stop offset=".52" stop-color="#b8c4cf" />
                <stop offset=".74" stop-color="#fffdf7" />
                <stop offset="1" stop-color="#8fa0ae" />
              </linearGradient>
              <linearGradient id="star-demo-gold" x1="-12" y1="-12" x2="14" y2="16" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#fff8d7" />
                <stop offset=".3" stop-color="#ffe08a" />
                <stop offset=".58" stop-color="#d79a2f" />
                <stop offset=".78" stop-color="#fff0a8" />
                <stop offset="1" stop-color="#a96214" />
              </linearGradient>
              <filter id="star-demo-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feDropShadow dx="0" dy="0" stdDeviation="2.2" flood-color="#ffd978" flood-opacity=".55" />
                <feDropShadow dx="0" dy="1" stdDeviation="4.2" flood-color="#ff9ec1" flood-opacity=".18" />
              </filter>
              <path id="star-demo-bottle-path" d="M87 28 C78 28 74 34 74 45 L74 111 C74 133 63 146 47 158 C25 174 18 198 18 234 L18 338 C18 374 47 392 108 392 C169 392 198 374 198 338 L198 234 C198 198 191 174 169 158 C153 146 142 133 142 111 L142 45 C142 34 138 28 129 28 Z" />
              <clipPath id="star-demo-bottle-clip">
                <use href="#star-demo-bottle-path" />
              </clipPath>
            </defs>

            <g>
              <path d="M82 3 C82 -2 86 -5 92 -5 L124 -5 C130 -5 134 -2 134 3 L130 52 C129 61 122 66 108 66 C94 66 87 61 86 52 Z" fill="url(#star-demo-cork)" />
              <ellipse cx="108" cy="3" rx="27" ry="9" fill="#efc991" opacity=".95" />
              <g opacity=".34" fill="#7b4b24">
                <circle cx="94" cy="12" r="1.5" />
                <circle cx="119" cy="15" r="1.2" />
                <circle cx="105" cy="23" r="1.1" />
                <circle cx="126" cy="31" r="1.5" />
                <circle cx="91" cy="35" r="1.2" />
                <circle cx="112" cy="43" r="1.3" />
              </g>
            </g>

            <use href="#star-demo-bottle-path" fill="none" stroke="url(#star-demo-glass-stroke)" stroke-width="7.2" stroke-linejoin="round" opacity=".95" />
            <use href="#star-demo-bottle-path" fill="url(#star-demo-glass-fill)" stroke="rgba(255,255,255,.58)" stroke-width="1.2" />

            <g clip-path="url(#star-demo-bottle-clip)">
              <rect x="18" y="28" width="180" height="364" fill="rgba(255,255,255,.03)" />
              <rect class="star-demo-progress-field" x="18" :y="392 - demoRevealHeight" width="180" :height="demoRevealHeight" />
              <ellipse
                class="star-demo-progress-haze"
                cx="108"
                :cy="366 - demoRevealHeight * 0.24"
                rx="84"
                ry="38"
                :style="{ opacity: `${demoProgressHazeOpacity}` }"
              />
              <g class="star-demo-dreamfield" :style="{ opacity: `${demoDreamfieldOpacity}` }">
                <circle cx="52" cy="332" r="6" />
                <circle cx="78" cy="286" r="4.5" />
                <circle cx="107" cy="314" r="5.5" />
                <circle cx="138" cy="260" r="4.6" />
                <circle cx="164" cy="308" r="5" />
                <circle cx="120" cy="220" r="3.8" />
              </g>
              <g class="star-demo-rainbow-sheen">
                <path d="M42 186 C78 154 136 156 176 196 C136 212 90 236 44 282 C34 248 31 216 42 186 Z" />
                <path d="M55 300 C92 272 140 270 176 300 C158 338 111 360 61 340 C53 326 51 312 55 300 Z" />
              </g>
              <ellipse cx="108" cy="350" rx="72" ry="31" fill="url(#star-demo-bottom-glow)" />
              <path d="M36 218 C42 244 42 305 39 348" fill="none" stroke="rgba(13,69,115,.18)" stroke-width="16" stroke-linecap="round" />
              <path d="M55 54 C43 110 43 198 51 315" fill="none" stroke="rgba(255,255,255,.66)" stroke-width="15" stroke-linecap="round" opacity=".76" />

              <g class="star-demo-stars-layer">
                <g
                  v-for="(star, index) in displayStars"
                  :key="`demo-star-${index}`"
                  :transform="`translate(${star.x} ${star.y}) rotate(${star.rotate}) scale(${star.scale})`"
                >
                  <g
                    :class="['star-demo-svg-star', `is-${star.grade}`]"
                    :style="{
                      '--star-demo-delay': star.delay,
                      '--star-demo-duration': star.duration,
                    }"
                  >
                    <template v-if="star.grade === 'myriad'">
                      <ellipse class="star-demo-orbit is-platinum-outer" cx="0" cy="0" rx="17" ry="9" />
                      <ellipse class="star-demo-orbit is-platinum-inner" cx="0" cy="0" rx="11" ry="6" />
                      <circle class="star-demo-orbit-dot is-platinum-dot" cx="15" cy="0" r="1.45" />
                      <path :d="WISH_BOTTLE_STAR_PATH" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
                    </template>
                    <template v-else-if="star.grade === 'thousand'">
                      <ellipse class="star-demo-orbit is-gold-outer" cx="0" cy="0" rx="16" ry="8" />
                      <ellipse class="star-demo-orbit is-gold-inner" cx="0" cy="0" rx="10" ry="5.4" />
                      <circle class="star-demo-orbit-dot is-gold-dot" cx="16" cy="0" r="1.2" />
                      <path :d="WISH_BOTTLE_STAR_PATH" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
                    </template>
                    <template v-else-if="star.grade === 'hundred'">
                      <path :d="WISH_BOTTLE_STAR_PATH" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-tier-outline" />
                      <circle class="star-demo-tier-outline-particle" r="1.15">
                        <animateMotion :path="WISH_BOTTLE_STAR_PATH" dur="4.4s" repeatCount="indefinite" />
                      </circle>
                    </template>
                    <template v-else-if="star.grade === 'ten'">
                      <path :d="WISH_BOTTLE_STAR_PATH" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-tier-outline" />
                      <circle class="star-demo-tier-outline-particle" r="1">
                        <animateMotion :path="WISH_BOTTLE_STAR_PATH" dur="3.8s" repeatCount="indefinite" />
                      </circle>
                    </template>
                    <template v-else>
                      <path :d="WISH_BOTTLE_STAR_PATH" />
                      <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-single-highlight" />
                    </template>
                  </g>
                </g>
              </g>
            </g>

            <ellipse cx="108" cy="40" rx="39" ry="12" fill="rgba(255,255,255,.40)" stroke="url(#star-demo-glass-stroke)" stroke-width="3" />
            <g>
              <path d="M73 69 C90 76 126 76 143 69 L142 75 C125 83 91 83 74 75 Z" fill="url(#star-demo-ribbon)" opacity=".97" />
              <ellipse cx="108" cy="76" rx="5.8" ry="4.8" fill="url(#star-demo-ribbon)" stroke="rgba(255,255,255,.35)" stroke-width=".8" />
              <path d="M107 76 C92 65 79 66 67 75 C79 79 90 82 104 80 Z" fill="url(#star-demo-ribbon)" opacity=".96" />
              <path d="M109 76 C124 65 137 66 149 75 C137 79 126 82 112 80 Z" fill="url(#star-demo-ribbon)" opacity=".96" />
            </g>
          </svg>
          <div class="wish-bottle-shadow"></div>
          </div>
        </div>
      </div>

      <div class="star-demo-info">
        <p class="star-demo-total">{{ demoDisplayStarCount.toLocaleString() }} 颗星星</p>
        <p>首页同款任务进度：{{ demoOverallPercent }}%，瓶内星光高度 {{ demoRevealHeight }}。</p>
        <p>当前颜色等级：{{ demoColorTier }}{{ isDemoRainbowGlow ? '，彩虹光效已开启' : '' }}。</p>
        <p>当前显示 {{ displayStars.length }} 个星体，已代表 {{ representedTotal.toLocaleString() }} 颗。</p>
        <p v-if="hiddenStars">另有 {{ hiddenStars.toLocaleString() }} 颗被收进高等级星光里。</p>
      </div>
    </article>

    <section class="star-demo-grade-grid">
      <article v-for="spec in starGradeSpecs" :key="spec.grade" class="star-demo-grade-card page-card">
        <svg class="star-demo-grade-icon" viewBox="-28 -28 56 56" aria-hidden="true">
          <g :class="['star-demo-svg-star', `is-${spec.grade}`]">
            <template v-if="spec.grade === 'myriad'">
              <ellipse class="star-demo-orbit is-platinum-outer" cx="0" cy="0" rx="18" ry="9" />
              <ellipse class="star-demo-orbit is-platinum-inner" cx="0" cy="0" rx="12" ry="6.2" />
              <circle class="star-demo-orbit-dot is-platinum-dot" cx="18" cy="0" r="1.55" />
              <path :d="WISH_BOTTLE_STAR_PATH" />
              <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
            </template>
            <template v-else-if="spec.grade === 'thousand'">
              <ellipse class="star-demo-orbit is-gold-outer" cx="0" cy="0" rx="18" ry="9" />
              <ellipse class="star-demo-orbit is-gold-inner" cx="0" cy="0" rx="12" ry="6.4" />
              <circle class="star-demo-orbit-dot is-gold-dot" cx="18" cy="0" r="1.35" />
              <path :d="WISH_BOTTLE_STAR_PATH" />
              <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
            </template>
            <template v-else-if="spec.grade === 'hundred'">
              <path :d="WISH_BOTTLE_STAR_PATH" />
              <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
              <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-tier-outline" />
              <circle class="star-demo-tier-outline-particle" r="1.2">
                <animateMotion :path="WISH_BOTTLE_STAR_PATH" dur="4.4s" repeatCount="indefinite" />
              </circle>
            </template>
            <template v-else-if="spec.grade === 'ten'">
              <path :d="WISH_BOTTLE_STAR_PATH" />
              <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-material-shine" />
              <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-tier-outline" />
              <circle class="star-demo-tier-outline-particle" r="1.05">
                <animateMotion :path="WISH_BOTTLE_STAR_PATH" dur="3.8s" repeatCount="indefinite" />
              </circle>
            </template>
            <template v-else>
              <path :d="WISH_BOTTLE_STAR_PATH" />
              <path :d="WISH_BOTTLE_STAR_PATH" class="star-demo-single-highlight" />
            </template>
          </g>
        </svg>
        <div>
          <p class="star-demo-grade-value">{{ spec.value }} 颗</p>
          <h2>{{ spec.label }}</h2>
          <p>{{ spec.description }}</p>
        </div>
      </article>
    </section>
  </section>
</template>

<style scoped>
.star-demo-page {
  display: grid;
  gap: 1rem;
  font-family: var(--font-body);
}

.star-demo-intro,
.star-demo-board {
  display: grid;
  gap: 1rem;
}

.star-demo-intro {
  grid-template-columns: minmax(0, 1fr) minmax(13rem, 18rem);
  align-items: end;
}

.star-demo-kicker,
.star-demo-grade-value {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
}

.star-demo-intro h1,
.star-demo-grade-card h2 {
  margin: 0.1rem 0 0;
  font-family: var(--font-heading);
  color: var(--text-main);
}

.star-demo-intro p,
.star-demo-info p,
.star-demo-grade-card p {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.star-demo-controls {
  display: grid;
  gap: 0.75rem;
}

.star-demo-control {
  display: grid;
  gap: 0.4rem;
}

.star-demo-control span {
  color: var(--text-soft);
  font-size: var(--type-meta-size);
}

.star-demo-control input {
  border-radius: 14px;
}

.star-demo-control input[type='range'] {
  accent-color: #d6b35f;
  cursor: pointer;
}

.star-demo-board {
  --wish-glass-tint: rgba(105, 186, 245, 0.18);
  --wish-glass-stroke: rgba(73, 150, 220, 0.62);
  --wish-glass-strong: rgba(35, 105, 180, 0.86);
  --wish-glow: rgba(53, 145, 224, 0.34);
  --wish-star-1: #ffffff;
  --wish-star-2: #8fdcff;
  --wish-star-3: #2b8fe3;
  --wish-star-outline: rgba(73, 150, 220, 0.9);
  --wish-orbit-strong: rgba(73, 150, 220, 0.88);
  --wish-orbit-soft: rgba(143, 220, 255, 0.62);
  --wish-orbit-dot: #d8f4ff;
  --wish-ribbon-1: #f7a8c4;
  --wish-ribbon-2: #d85f93;
  --wish-ribbon-3: #fff2f7;
  grid-template-columns: minmax(248px, 316px) minmax(0, 1fr);
  align-items: center;
}

.star-demo-board.tier-green {
  --wish-glass-tint: rgba(72, 196, 128, 0.13);
  --wish-glass-stroke: rgba(51, 177, 112, 0.52);
  --wish-glass-strong: rgba(22, 135, 86, 0.74);
  --wish-glow: rgba(51, 177, 112, 0.3);
  --wish-star-1: #effff6;
  --wish-star-2: #64d994;
  --wish-star-3: #158c5d;
  --wish-star-outline: rgba(51, 177, 112, 0.9);
  --wish-orbit-strong: rgba(51, 177, 112, 0.88);
  --wish-orbit-soft: rgba(155, 231, 180, 0.64);
  --wish-orbit-dot: #effff6;
  --wish-ribbon-1: #9be7b4;
  --wish-ribbon-2: #2aa56a;
  --wish-ribbon-3: #f1fff6;
}

.star-demo-board.tier-orange {
  --wish-glass-tint: rgba(255, 142, 72, 0.14);
  --wish-glass-stroke: rgba(236, 119, 55, 0.54);
  --wish-glass-strong: rgba(193, 78, 30, 0.74);
  --wish-glow: rgba(236, 119, 55, 0.34);
  --wish-star-1: #fff1e7;
  --wish-star-2: #ff9b4a;
  --wish-star-3: #cf5520;
  --wish-star-outline: rgba(236, 119, 55, 0.9);
  --wish-orbit-strong: rgba(236, 119, 55, 0.88);
  --wish-orbit-soft: rgba(255, 189, 154, 0.66);
  --wish-orbit-dot: #fff1df;
  --wish-ribbon-1: #ffbd9a;
  --wish-ribbon-2: #d9673d;
  --wish-ribbon-3: #fff1df;
}

.star-demo-board.tier-gold {
  --wish-glass-tint: rgba(246, 199, 79, 0.15);
  --wish-glass-stroke: rgba(234, 179, 64, 0.58);
  --wish-glass-strong: rgba(190, 122, 33, 0.78);
  --wish-glow: rgba(234, 179, 64, 0.38);
  --wish-star-1: #fff9e2;
  --wish-star-2: #f4c64f;
  --wish-star-3: #c9791f;
  --wish-star-outline: rgba(234, 179, 64, 0.94);
  --wish-orbit-strong: rgba(234, 179, 64, 0.92);
  --wish-orbit-soft: rgba(255, 223, 122, 0.68);
  --wish-orbit-dot: #fff3c4;
  --wish-ribbon-1: #f9c773;
  --wish-ribbon-2: #c97a25;
  --wish-ribbon-3: #fff3c4;
}

.star-demo-board.tier-rainbow {
  --wish-glass-tint: rgba(255, 218, 112, 0.16);
  --wish-glass-stroke: rgba(246, 191, 80, 0.62);
  --wish-glass-strong: rgba(214, 145, 48, 0.82);
  --wish-glow: rgba(255, 204, 84, 0.48);
  --wish-star-1: #fffdf2;
  --wish-star-2: #ff9ec1;
  --wish-star-3: #50d7e9;
  --wish-star-outline: rgba(195, 123, 255, 0.9);
  --wish-orbit-strong: rgba(255, 158, 193, 0.9);
  --wish-orbit-soft: rgba(80, 215, 233, 0.72);
  --wish-orbit-dot: #fff6bf;
  --wish-ribbon-1: #ffd1dc;
  --wish-ribbon-2: #c37bff;
  --wish-ribbon-3: #fff6bf;
}

.star-demo-board.is-empty-bottle {
  --wish-glass-tint: rgba(207, 221, 239, 0.11);
  --wish-glass-stroke: rgba(141, 170, 211, 0.34);
  --wish-glass-strong: rgba(121, 151, 194, 0.42);
  --wish-glow: rgba(133, 162, 203, 0.12);
  --wish-star-1: #f6f9fd;
  --wish-star-2: #dce7f3;
  --wish-star-3: #b0c1d6;
  --wish-star-outline: rgba(141, 170, 211, 0.52);
  --wish-orbit-strong: rgba(141, 170, 211, 0.48);
  --wish-orbit-soft: rgba(207, 221, 239, 0.42);
  --wish-orbit-dot: #f6f9fd;
  --wish-ribbon-1: #ecd7df;
  --wish-ribbon-2: #c39bab;
  --wish-ribbon-3: #fff6f8;
}

.star-demo-bottle-panel {
  display: grid;
  place-items: center;
}

.star-demo-bottle-visual {
  position: relative;
  display: grid;
  place-items: center;
  width: min(100%, 316px);
  min-height: 404px;
}

.star-demo-bottle-aura {
  position: absolute;
  inset: 10% 6%;
  border-radius: 50%;
  background: radial-gradient(circle, var(--wish-glow), transparent 72%);
  filter: blur(30px);
  opacity: 0.32;
  animation: star-demo-glow-breathe 4.8s ease-in-out infinite;
}

.star-demo-bottle-sparkle {
  position: absolute;
  z-index: 3;
  width: 8px;
  aspect-ratio: 1;
  clip-path: polygon(50% 0%, 62% 34%, 100% 50%, 62% 66%, 50% 100%, 38% 66%, 0% 50%, 38% 34%);
  background: rgba(255, 255, 255, 0.42);
  filter: drop-shadow(0 0 6px var(--wish-glow));
  animation: star-demo-sparkle-twinkle 5.2s ease-in-out infinite;
}

.star-demo-bottle-sparkle.sparkle-one {
  top: 20%;
  left: 1%;
  animation-delay: -0.6s;
}

.star-demo-bottle-sparkle.sparkle-two {
  top: 12%;
  right: 8%;
  width: 7px;
  animation-delay: -2.1s;
}

.star-demo-bottle-sparkle.sparkle-three {
  right: -2%;
  bottom: 16%;
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
  z-index: 1;
  width: 64%;
  height: 24px;
  border-radius: 999px;
  background: radial-gradient(ellipse, rgba(51, 68, 98, 0.12), transparent 68%);
  transform: translateX(-50%);
}

.star-demo-progress-field {
  fill: url(#star-demo-field);
  opacity: 0.82;
}

.star-demo-progress-haze {
  fill: var(--wish-glow);
  filter: blur(22px);
}

.star-demo-dreamfield {
  animation: star-demo-dreamfield-drift 8.2s ease-in-out infinite;
  mix-blend-mode: screen;
}

.star-demo-dreamfield circle {
  fill: rgba(255, 255, 255, 0.24);
}

.star-demo-rainbow-sheen {
  opacity: 0;
  pointer-events: none;
  mix-blend-mode: screen;
  transform-origin: 108px 276px;
}

.star-demo-rainbow-sheen path {
  fill: url(#star-demo-rainbow-sheen);
  filter: blur(0.6px);
}

.star-demo-board.is-rainbow-glow .star-demo-bottle-aura,
.star-demo-board.tier-rainbow .star-demo-bottle-aura {
  background:
    radial-gradient(circle at 50% 52%, rgba(255, 246, 191, 0.46), transparent 48%),
    conic-gradient(from 22deg, rgba(255, 158, 193, 0.34), rgba(255, 217, 120, 0.42), rgba(80, 215, 233, 0.38), rgba(195, 123, 255, 0.32), rgba(255, 158, 193, 0.34));
  filter: blur(24px);
  opacity: 0.48;
  animation-duration: 3.8s;
}

.star-demo-board.is-rainbow-glow .star-demo-rainbow-sheen,
.star-demo-board.tier-rainbow .star-demo-rainbow-sheen {
  opacity: 1;
  animation: star-demo-rainbow-sheen-flow 4.6s ease-in-out infinite;
}

.star-demo-info {
  display: grid;
  gap: 0.4rem;
}

.star-demo-total {
  color: var(--text-main) !important;
  font-family: var(--font-heading);
  font-size: var(--type-section-title-size);
  font-weight: 600;
}

.star-demo-grade-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 0.8rem;
}

.star-demo-grade-card {
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
}

.star-demo-grade-icon {
  width: 3.5rem;
  overflow: visible;
}

.star-demo-svg-star {
  transform-box: fill-box;
  transform-origin: center;
  filter: url(#star-demo-glow);
  opacity: 0;
  animation:
    star-demo-drop 0.68s cubic-bezier(0.18, 1.45, 0.28, 1) forwards,
    star-demo-bob var(--star-demo-duration, 5.2s) ease-in-out infinite,
    star-demo-gloss 2.7s ease-in-out infinite;
  animation-delay:
    var(--star-demo-delay, 0ms),
    calc(var(--star-demo-delay, 0ms) + 0.66s),
    calc(var(--star-demo-delay, 0ms) + 0.25s);
}

.star-demo-grade-icon .star-demo-svg-star {
  opacity: 1;
  animation: star-demo-bob 5.4s ease-in-out infinite, star-demo-gloss 2.8s ease-in-out infinite;
}

.star-demo-svg-star path:not(.star-demo-single-highlight):not(.star-demo-material-shine):not(.star-demo-tier-outline) {
  fill: url(#star-demo-single);
}

.star-demo-svg-star.is-hundred path:not(.star-demo-material-shine):not(.star-demo-tier-outline),
.star-demo-svg-star.is-myriad path:not(.star-demo-material-shine):not(.star-demo-tier-outline) {
  fill: url(#star-demo-platinum);
}

.star-demo-svg-star.is-ten path:not(.star-demo-material-shine):not(.star-demo-tier-outline),
.star-demo-svg-star.is-thousand path:not(.star-demo-material-shine):not(.star-demo-tier-outline) {
  fill: url(#star-demo-gold);
}

.star-demo-single-highlight {
  fill: none;
  stroke: var(--wish-star-outline);
  stroke-linejoin: round;
  stroke-width: 1.05;
  opacity: 0.52;
}

.star-demo-material-shine,
.star-demo-tier-outline {
  fill: none;
  stroke-linejoin: round;
}

.star-demo-material-shine {
  stroke: rgba(255, 255, 255, 0.62);
  stroke-width: 0.9;
  opacity: 0.66;
}

.star-demo-tier-outline {
  stroke: var(--wish-star-outline);
  stroke-width: 1.08;
  opacity: 0.84;
  filter: drop-shadow(0 0 4px var(--wish-orbit-soft));
}

.star-demo-tier-outline-particle {
  fill: var(--wish-orbit-dot);
  filter: drop-shadow(0 0 4px var(--wish-orbit-strong)) drop-shadow(0 0 7px var(--wish-orbit-soft));
  opacity: 0.96;
}

.star-demo-orbit {
  fill: none;
  stroke-linecap: round;
  transform-box: fill-box;
  transform-origin: center;
}

.star-demo-orbit.is-platinum-outer,
.star-demo-orbit.is-gold-outer {
  stroke-width: 1.05;
  stroke-dasharray: 15 10;
  animation: star-demo-orbit-flow 12s linear infinite;
}

.star-demo-orbit.is-platinum-inner,
.star-demo-orbit.is-gold-inner {
  stroke-width: 0.86;
  stroke-dasharray: 5 8;
  animation: star-demo-orbit-flow 9s linear infinite reverse;
}

.star-demo-orbit.is-platinum-outer,
.star-demo-orbit.is-gold-outer {
  stroke: var(--wish-orbit-strong);
}

.star-demo-orbit.is-platinum-inner,
.star-demo-orbit.is-gold-inner {
  stroke: var(--wish-orbit-soft);
}

.star-demo-orbit-dot {
  fill: var(--wish-orbit-dot);
  filter: drop-shadow(0 0 4px var(--wish-orbit-soft));
}

.star-demo-orbit-dot.is-platinum-dot,
.star-demo-orbit-dot.is-gold-dot {
  opacity: 0.88;
}

@keyframes star-demo-drop {
  0% {
    opacity: 0;
    transform: translateY(-70px) scale(0.18) rotate(-110deg);
  }

  68% {
    opacity: 1;
    transform: translateY(0) scale(calc(var(--star-demo-scale, 1) * 1.16)) rotate(calc(var(--star-demo-rotate, 0deg) + 16deg));
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(var(--star-demo-scale, 1)) rotate(var(--star-demo-rotate, 0deg));
  }
}

@keyframes star-demo-bob {
  0%, 100% {
    transform: translateY(0) scale(var(--star-demo-scale, 1)) rotate(var(--star-demo-rotate, 0deg));
  }

  50% {
    transform: translateY(-3px) scale(var(--star-demo-scale, 1)) rotate(calc(var(--star-demo-rotate, 0deg) + 4deg));
  }
}

@keyframes star-demo-gloss {
  0%, 100% {
    filter: url(#star-demo-glow) brightness(1) saturate(1.04);
  }

  50% {
    filter: url(#star-demo-glow) brightness(1.14) saturate(1.1);
  }
}

@keyframes star-demo-orbit-flow {
  0% {
    stroke-dashoffset: 0;
    transform: rotate(0deg);
  }

  100% {
    stroke-dashoffset: -54;
    transform: rotate(360deg);
  }
}

@keyframes star-demo-glow-breathe {
  0%, 100% {
    opacity: 0.28;
    transform: scale(0.985);
  }

  50% {
    opacity: 0.46;
    transform: scale(1.015);
  }
}

@keyframes star-demo-dreamfield-drift {
  0%, 100% {
    transform: translateY(0) translateX(-1.2%);
  }

  50% {
    transform: translateY(-3.5%) translateX(1%);
  }
}

@keyframes star-demo-sparkle-twinkle {
  0%, 100% {
    opacity: 0.18;
    transform: scale(0.82) rotate(0deg);
  }

  50% {
    opacity: 0.62;
    transform: scale(1.02) rotate(12deg);
  }
}

@keyframes star-demo-rainbow-sheen-flow {
  0%, 100% {
    opacity: 0.34;
    transform: translateX(-8px) translateY(4px) rotate(-5deg) scale(0.98);
  }

  50% {
    opacity: 0.78;
    transform: translateX(9px) translateY(-5px) rotate(4deg) scale(1.04);
  }
}

@media (max-width: 760px) {
  .star-demo-intro,
  .star-demo-board {
    grid-template-columns: 1fr;
  }
}
</style>