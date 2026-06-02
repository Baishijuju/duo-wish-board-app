<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import WishBottlePreviewCard from '../components/WishBottlePreviewCard.vue'
import { useAuthStore } from '../stores/auth'
import { useWishStore, type WishRecord, type WishThreadEntry } from '../stores/wishes'
import { formatBeijingDateTime } from '../utils/datetime'

type RecentMoment = {
  id: string
  actor: string
  excerpt: string
  headline: string
  timeLabel: string
  wishId: string | null
}

const authStore = useAuthStore()
const wishStore = useWishStore()

const viewerName = computed(() => authStore.currentMember?.displayName ?? '你')
const focusWish = computed(() => {
  return wishStore.nearestDueWishes[0] ?? wishStore.dragonBallWishes[0] ?? wishStore.wishes[0] ?? null
})
const focusWishLink = computed(() => {
  return focusWish.value
    ? { name: 'wish-detail', params: { id: focusWish.value.id } }
    : { name: 'preview-compose' }
})
const focusWishActionLabel = computed(() => {
  return focusWish.value ? '打开这条愿望' : '去写下一条愿望'
})
const priorityLane = computed(() => buildUniqueWishList([
  wishStore.nearestDueWishes,
  wishStore.dragonBallWishes,
  wishStore.wishes,
], 3))
const bottleLane = computed(() => buildUniqueWishList([
  wishStore.dragonBallWishes,
  wishStore.nearestDueWishes,
  wishStore.wishes,
], 3))
const recentMoments = computed<RecentMoment[]>(() => {
  return [...wishStore.wishThreads]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 3)
    .map((thread) => ({
      id: thread.id,
      actor: getMemberName(thread.actorId),
      excerpt: truncateText(thread.messageText || '留下一句轻轻的回应。', 58),
      headline: getThreadHeadline(thread),
      timeLabel: formatMomentTime(thread.createdAt),
      wishId: thread.wishId,
    }))
})
const focusStats = computed(() => {
  const snapshot = wishStore.wishBottleSnapshot
  const totalStars = snapshot.completedStepStarCount + snapshot.completedCountUnits

  return [
    { label: '在路上', value: `${snapshot.activeWishCount} 条` },
    { label: '已点亮', value: `${totalStars} 颗` },
    { label: '愿望币', value: `${wishStore.currentMemberRemainingCoins} 枚` },
  ]
})

function buildUniqueWishList(sources: WishRecord[][], limit: number) {
  const uniqueWishes = new Map<string, WishRecord>()

  for (const source of sources) {
    for (const wish of source) {
      if (!uniqueWishes.has(wish.id)) {
        uniqueWishes.set(wish.id, wish)
      }
    }
  }

  return [...uniqueWishes.values()].slice(0, limit)
}

function truncateText(value: string, maxLength: number) {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return '留下一句很短的话，也会让这页更像被认真看过。'
  }

  return trimmedValue.length > maxLength ? `${trimmedValue.slice(0, maxLength).trim()}…` : trimmedValue
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
    return '还没定日期'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDifference = Math.round((dueTimestamp - today.getTime()) / (24 * 60 * 60 * 1000))

  if (dayDifference < 0) {
    return `已经过了 ${Math.abs(dayDifference)} 天`
  }

  if (dayDifference === 0) {
    return '就定在今天'
  }

  if (dayDifference === 1) {
    return '还有 1 天'
  }

  return `还有 ${dayDifference} 天`
}

function formatMomentTime(value: string) {
  const dateTime = formatBeijingDateTime(value, '')

  if (!dateTime) {
    return '刚刚'
  }

  return dateTime.slice(5).replace(' ', ' · ')
}

function getMemberName(memberId: string | null) {
  if (!memberId) {
    return '共同空间'
  }

  return authStore.members.find((member) => member.id === memberId)?.displayName ?? '共同空间'
}

function getThreadHeadline(thread: WishThreadEntry) {
  const targetWish = thread.wishId ? wishStore.findById(thread.wishId) : null

  if (targetWish) {
    return targetWish.title
  }

  return '刚刚有一条新回应'
}

function getWishMeta(wish: WishRecord) {
  if (wish.dueDate) {
    return getRelativeDueLabel(wish.dueDate)
  }

  const coinSummary = wishStore.getWishCoinSummary(wish)

  if (coinSummary.total > 0) {
    return `已有 ${coinSummary.total} 枚愿望币`
  }

  const ownerName = authStore.members.find((member) => member.id === wish.ownerId)?.displayName ?? '我们'
  return wish.scope === 'shared' ? `${ownerName} 一起看见` : `${ownerName} 先留给自己`
}

function getWishLead(wish: WishRecord) {
  const progressSnapshot = wishStore.getWishProgressSnapshot(wish)

  if (wish.status === 'done') {
    return '这条愿望已经落进完成区，可以只留一个很短的回看句子。'
  }

  if (progressSnapshot.mode !== 'none') {
    return progressSnapshot.label
  }

  return truncateText(wish.note, 56)
}

function getBottleWishSignal(wish: WishRecord) {
  const coinSummary = wishStore.getWishCoinSummary(wish)

  if (coinSummary.total > 0) {
    return `${coinSummary.total} 枚愿望币`
  }

  const progressSnapshot = wishStore.getWishProgressSnapshot(wish)

  if (progressSnapshot.mode !== 'none') {
    return progressSnapshot.label
  }

  return getWishMeta(wish)
}
</script>

<template>
  <section class="home-preview-page">
    <div class="preview-page-head">
      <RouterLink class="preview-page-link" :to="{ name: 'preview-lab' }">返回 Preview Lab</RouterLink>
      <RouterLink class="preview-page-link subtle" :to="{ name: 'home' }">查看正式首页</RouterLink>
    </div>

    <article class="home-preview-hero page-card">
      <div class="home-preview-copy">
        <p class="eyebrow">Home Preview</p>
        <h1>{{ viewerName }}，首页先看见愿望瓶，再看今天最值得推进的那一件。</h1>
        <p class="home-preview-lead">
          这版不再把首页压得过空，而是把你最喜欢的愿望瓶提回主位，再把今天清单和最近回应收在周围。
        </p>

        <div class="home-preview-actions">
          <RouterLink class="home-preview-primary" :to="focusWishLink">{{ focusWishActionLabel }}</RouterLink>
          <RouterLink class="home-preview-secondary" :to="{ name: 'preview-compose' }">去写下页预览</RouterLink>
        </div>
      </div>

      <aside class="home-preview-focus">
        <p class="home-preview-focus-label">今天先看</p>
        <strong class="home-preview-focus-title">
          {{ focusWish ? focusWish.title : '写下一条想一起完成的事' }}
        </strong>
        <p class="home-preview-focus-meta">
          {{ focusWish ? getWishMeta(focusWish) : '当还没有内容时，就先给首页一个清楚的入口。' }}
        </p>
        <p class="home-preview-focus-note">
          {{ focusWish ? getWishLead(focusWish) : '首页会先保住愿望瓶，再把空状态收成一句邀请。' }}
        </p>

        <dl class="home-preview-focus-stats">
          <div v-for="item in focusStats" :key="item.label">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </aside>
    </article>

    <WishBottlePreviewCard />

    <section class="home-preview-grid">
      <article class="home-preview-panel">
        <header class="home-preview-panel-head">
          <div>
            <p class="eyebrow">Today Lane</p>
            <h2>今天要推进的三件以内</h2>
          </div>
          <span class="home-preview-panel-meta">先抓住最近要碰的事</span>
        </header>

        <ul v-if="priorityLane.length" class="home-preview-wish-list">
          <li v-for="wish in priorityLane" :key="wish.id">
            <div class="home-preview-wish-topline">
              <RouterLink class="home-preview-wish-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">
                {{ wish.title }}
              </RouterLink>
              <span>{{ getWishMeta(wish) }}</span>
            </div>
            <p>{{ getWishLead(wish) }}</p>
          </li>
        </ul>

        <p v-else class="home-preview-empty">
          这里会留一条短清单，让首页有方向感，但不再用很多同样的卡片把页面拉长。
        </p>
      </article>

      <article class="home-preview-panel home-preview-panel-warm">
        <header class="home-preview-panel-head">
          <div>
            <p class="eyebrow">Bottle Picks</p>
            <h2>愿望瓶里现在最亮的几件</h2>
          </div>
          <span class="home-preview-panel-meta">把瓶子的温度继续往下展开</span>
        </header>

        <ul v-if="bottleLane.length" class="home-preview-wish-list">
          <li v-for="wish in bottleLane" :key="wish.id">
            <div class="home-preview-wish-topline">
              <RouterLink class="home-preview-wish-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">
                {{ wish.title }}
              </RouterLink>
              <span>{{ getBottleWishSignal(wish) }}</span>
            </div>
            <p>{{ getWishLead(wish) }}</p>
          </li>
        </ul>

        <p v-else class="home-preview-empty">
          当还没有内容时，这里会保持成瓶内回声区，而不是直接空掉首页中段。
        </p>
      </article>

      <article class="home-preview-panel home-preview-timeline">
        <header class="home-preview-panel-head">
          <div>
            <p class="eyebrow">Recent Echo</p>
            <h2>最近几句回应</h2>
          </div>
          <span class="home-preview-panel-meta">把动态读成时间线</span>
        </header>

        <ol v-if="recentMoments.length" class="home-preview-moment-list">
          <li v-for="moment in recentMoments" :key="moment.id">
            <div class="home-preview-moment-topline">
              <RouterLink
                v-if="moment.wishId"
                class="home-preview-moment-link"
                :to="{ name: 'wish-detail', params: { id: moment.wishId } }"
              >
                {{ moment.headline }}
              </RouterLink>
              <span v-else class="home-preview-moment-link static">{{ moment.headline }}</span>
              <span>{{ moment.timeLabel }}</span>
            </div>
            <p>{{ moment.excerpt }}</p>
            <span class="home-preview-moment-actor">{{ moment.actor }}</span>
          </li>
        </ol>

        <p v-else class="home-preview-empty">
          暂时还没有新动态时，这块会保持轻一点，但仍然会作为愿望瓶旁边的一段回声存在。
        </p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.home-preview-page {
  display: grid;
  gap: 1rem;
}

.preview-page-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.preview-page-link {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  padding: 0.55rem 0.86rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-main);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}

.preview-page-link.subtle {
  color: var(--text-soft);
  background: rgba(255, 255, 255, 0.45);
}

.home-preview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(18rem, 0.82fr);
  gap: 1rem;
  padding: clamp(1.15rem, 2vw, 1.45rem);
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 227, 203, 0.88), transparent 28%),
    linear-gradient(160deg, rgba(255, 251, 245, 0.96), rgba(247, 239, 230, 0.92));
}

.home-preview-copy {
  display: grid;
  gap: 0.9rem;
  align-content: start;
}

.home-preview-copy h1 {
  margin: 0;
  max-width: 11ch;
  font-family: var(--font-heading);
  font-size: clamp(2.15rem, 4.8vw, 4rem);
  line-height: 1.02;
  letter-spacing: -0.055em;
}

.home-preview-lead,
.home-preview-focus-meta,
.home-preview-focus-note,
.home-preview-bottle-lead,
.home-preview-wish-list p,
.home-preview-moment-list p,
.home-preview-empty {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.8;
}

.home-preview-actions,
.home-preview-bottle-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.home-preview-primary,
.home-preview-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.74rem 1rem;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
}

.home-preview-primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: #fffaf2;
  box-shadow: 0 14px 28px rgba(191, 101, 66, 0.18);
}

.home-preview-secondary {
  border: 1px solid rgba(95, 74, 55, 0.1);
  background: rgba(255, 255, 255, 0.66);
  color: var(--text-main);
}

.home-preview-focus {
  display: grid;
  gap: 0.75rem;
  align-content: start;
  padding: 1rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.home-preview-focus-label,
.home-preview-panel-meta,
.home-preview-track-foot,
.home-preview-moment-actor,
.home-preview-bottle-tier,
.home-preview-bottle-badge {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}

.home-preview-focus-title,
.home-preview-bottle-head h2,
.home-preview-panel-head h2 {
  margin: 0.18rem 0 0;
  font-family: var(--font-heading);
  line-height: 1.12;
  letter-spacing: -0.035em;
}

.home-preview-focus-title {
  font-size: clamp(1.6rem, 3.6vw, 2.2rem);
}

.home-preview-focus-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin: 0;
}

.home-preview-focus-stats div,
.home-preview-bottle-metrics div {
  display: grid;
  gap: 0.22rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
}

.home-preview-focus-stats dt,
.home-preview-bottle-metrics dt {
  color: var(--text-soft);
  font-size: 0.76rem;
}

.home-preview-focus-stats dd,
.home-preview-bottle-metrics dd {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.1rem;
}

.home-preview-bottle-stage {
  display: grid;
  grid-template-columns: minmax(15rem, 0.78fr) minmax(0, 1.22fr);
  gap: 1rem;
  padding: 1.15rem;
  background:
    radial-gradient(circle at 8% 18%, rgba(255, 228, 199, 0.5), transparent 24%),
    radial-gradient(circle at 92% 84%, rgba(216, 231, 220, 0.44), transparent 24%),
    linear-gradient(160deg, rgba(255, 249, 241, 0.98), rgba(245, 238, 228, 0.95));
}

.home-preview-bottle-visual {
  --bottle-glow: rgba(217, 188, 122, 0.3);
  --bottle-fill-start: rgba(245, 208, 117, 0.9);
  --bottle-fill-end: rgba(220, 134, 79, 0.88);
  position: relative;
  min-height: 20rem;
  display: grid;
  place-items: center;
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.74), rgba(255, 247, 236, 0.55));
  overflow: hidden;
}

.home-preview-bottle-visual.tone-blue {
  --bottle-glow: rgba(153, 194, 228, 0.3);
  --bottle-fill-start: rgba(165, 214, 244, 0.9);
  --bottle-fill-end: rgba(103, 164, 219, 0.88);
}

.home-preview-bottle-visual.tone-green {
  --bottle-glow: rgba(167, 212, 181, 0.32);
  --bottle-fill-start: rgba(179, 221, 191, 0.92);
  --bottle-fill-end: rgba(111, 170, 129, 0.88);
}

.home-preview-bottle-visual.tone-orange {
  --bottle-glow: rgba(238, 180, 120, 0.32);
  --bottle-fill-start: rgba(246, 203, 133, 0.92);
  --bottle-fill-end: rgba(221, 132, 76, 0.9);
}

.home-preview-bottle-visual.tone-gold {
  --bottle-glow: rgba(235, 207, 117, 0.34);
  --bottle-fill-start: rgba(243, 224, 156, 0.92);
  --bottle-fill-end: rgba(219, 172, 76, 0.9);
}

.home-preview-bottle-visual.tone-rainbow {
  --bottle-glow: rgba(224, 168, 210, 0.34);
  --bottle-fill-start: rgba(147, 199, 255, 0.92);
  --bottle-fill-end: rgba(255, 159, 151, 0.9);
}

.home-preview-bottle-glow {
  position: absolute;
  inset: auto auto 2.2rem 50%;
  width: 13rem;
  height: 13rem;
  border-radius: 999px;
  background: var(--bottle-glow);
  filter: blur(24px);
  transform: translateX(-50%);
}

.home-preview-bottle-badge,
.home-preview-bottle-tier {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 32px;
  padding: 0.45rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
}

.home-preview-bottle-badge {
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
}

.home-preview-bottle-neck {
  position: absolute;
  top: 2.55rem;
  width: 4.2rem;
  height: 2.8rem;
  border: 2px solid rgba(130, 96, 73, 0.16);
  border-bottom: none;
  border-radius: 1.5rem 1.5rem 0.6rem 0.6rem;
  background: rgba(255, 255, 255, 0.42);
  backdrop-filter: blur(8px);
}

.home-preview-bottle-shell {
  position: relative;
  width: min(12rem, 72%);
  height: 15.2rem;
  margin-top: 1.8rem;
  border: 2px solid rgba(130, 96, 73, 0.16);
  border-radius: 4rem 4rem 3rem 3rem / 2.7rem 2.7rem 4rem 4rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.14));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65), 0 16px 34px rgba(106, 71, 48, 0.08);
  overflow: hidden;
}

.home-preview-bottle-fill {
  position: absolute;
  left: 0.6rem;
  right: 0.6rem;
  bottom: 0.6rem;
  border-radius: 3rem 3rem 2.2rem 2.2rem / 2.2rem 2.2rem 3rem 3rem;
  background: linear-gradient(180deg, var(--bottle-fill-start), var(--bottle-fill-end));
  box-shadow: inset 0 10px 28px rgba(255, 255, 255, 0.18), 0 0 18px rgba(255, 187, 122, 0.22);
}

.home-preview-bottle-wave {
  position: absolute;
  left: -8%;
  top: -0.85rem;
  width: 116%;
  height: 1.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.24);
}

.home-preview-bottle-spark {
  position: absolute;
  width: 0.8rem;
  height: 0.8rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 10px rgba(255, 255, 255, 0.08);
}

.spark-one {
  left: 18%;
  bottom: 26%;
}

.spark-two {
  right: 20%;
  bottom: 38%;
}

.spark-three {
  left: 44%;
  bottom: 58%;
}

.home-preview-bottle-copy {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.home-preview-bottle-head,
.home-preview-panel-head,
.home-preview-wish-topline,
.home-preview-moment-topline,
.home-preview-track-foot {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
}

.home-preview-bottle-head h2,
.home-preview-panel-head h2 {
  font-size: clamp(1.32rem, 2.8vw, 1.92rem);
}

.home-preview-bottle-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.8rem;
  margin: 0;
}

.home-preview-track {
  position: relative;
  width: 100%;
  height: 14px;
  border-radius: 999px;
  background: rgba(95, 74, 55, 0.08);
  overflow: hidden;
}

.home-preview-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(248, 216, 145, 0.95), var(--accent), #d98556);
  box-shadow: 0 0 18px rgba(201, 111, 74, 0.16);
}

.home-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.home-preview-panel {
  display: grid;
  gap: 1rem;
  padding: 1.05rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 24px;
  background: rgba(255, 250, 244, 0.86);
  box-shadow: 0 12px 28px rgba(80, 58, 40, 0.04);
}

.home-preview-panel-warm {
  background: linear-gradient(160deg, rgba(255, 247, 238, 0.96), rgba(250, 239, 227, 0.92));
}

.home-preview-wish-list,
.home-preview-moment-list {
  display: grid;
  gap: 0.9rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-preview-wish-list li,
.home-preview-moment-list li {
  display: grid;
  gap: 0.42rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
}

.home-preview-wish-link,
.home-preview-moment-link {
  color: var(--text-main);
  font-weight: 600;
  text-decoration: none;
}

.home-preview-moment-link.static {
  font-weight: 600;
}

@media (max-width: 1180px) {
  .home-preview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .home-preview-hero,
  .home-preview-bottle-stage,
  .home-preview-grid {
    grid-template-columns: 1fr;
  }

  .home-preview-copy h1 {
    max-width: none;
  }
}

@media (max-width: 560px) {
  .home-preview-focus-stats,
  .home-preview-bottle-metrics,
  .home-preview-grid {
    grid-template-columns: 1fr;
  }

  .home-preview-bottle-shell {
    width: min(11rem, 70%);
    height: 14rem;
  }
}
</style>