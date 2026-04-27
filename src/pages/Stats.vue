<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useWishStore } from '../stores/wishes'

const authStore = useAuthStore()
const wishStore = useWishStore()

const storageSummary = computed(() => wishStore.imageStorageSummary)

const estimatedRemainingImageCount = computed(() => {
  if (!wishStore.stats.totalImages || !storageSummary.value.usedBytes) {
    return null
  }

  const averageImageBytes = storageSummary.value.usedBytes / wishStore.stats.totalImages
  return averageImageBytes > 0 ? Math.floor(storageSummary.value.remainingBytes / averageImageBytes) : null
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

const perMemberStats = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return authStore.members.map((member) => {
    const mine = wishStore.wishes.filter((wish) => wish.ownerId === member.id)
    const imageCount = mine.reduce((count, wish) => count + wish.images.length, 0)
    const imageBytes = mine.reduce((count, wish) => count + wish.images.reduce((imageCount, image) => imageCount + image.sizeBytes, 0), 0)

    return {
      active: mine.filter((wish) => wish.status === 'active').length,
      comments: mine.reduce((count, wish) => count + wish.comments.length, 0),
      done: mine.filter((wish) => wish.status === 'done').length,
      imageBytes,
      imageCount,
      member,
      overdue: mine.filter((wish) => {
        const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
        return wish.status === 'active' && dueTimestamp !== null && dueTimestamp < today.getTime()
      }).length,
      privateCount: mine.filter((wish) => wish.scope === 'private').length,
      sharedCount: mine.filter((wish) => wish.scope === 'shared').length,
      total: mine.length,
    }
  })
})
</script>

<template>
  <section class="page-stack stats-page">
    <article class="page-card stats-story-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Space Ledger</p>
          <h2 class="section-title">看见这段时间共同生活的密度</h2>
        </div>
        <div class="badge-row">
          <span class="badge">留言 {{ wishStore.stats.comments }}</span>
          <span class="badge">共同 {{ wishStore.stats.shared }}</span>
          <span class="badge">点亮 {{ wishStore.stats.starred }}</span>
        </div>
      </div>

      <p class="section-copy stats-story-copy">
        这页不只是数字汇总，它更像你们这段时间共同生活的账本：推进了多少事、完成了多少事、哪些目标在临近，图片又大概占了多少长期空间。
      </p>

      <div class="summary-grid stats-summary-grid">
        <article class="summary-card accent-sunrise">
          <p>总愿望数</p>
          <strong>{{ wishStore.stats.total }}</strong>
          <span>{{ wishStore.stats.active }} 项仍在推进</span>
        </article>
        <article class="summary-card accent-coral">
          <p>近期截止</p>
          <strong>{{ wishStore.stats.dueSoon }}</strong>
          <span>{{ wishStore.stats.overdue }} 项已逾期</span>
        </article>
        <article class="summary-card accent-aurora">
          <p>完成率</p>
          <strong>{{ wishStore.stats.completionRate }}%</strong>
          <span>{{ wishStore.stats.done }} 项已经完成</span>
        </article>
        <article class="summary-card accent-golden">
          <p>图片与记忆</p>
          <strong>{{ wishStore.stats.totalImages }}</strong>
          <span>约 {{ formatStorageBytes(wishStore.stats.totalImageBytes) }}</span>
        </article>
      </div>

      <div class="story-footer">
        <p class="muted stats-story-note">
          现在的统计已经把留言、图片和逾期信息都纳进来了，所以这里看到的不是“清单数量”，而是整个空间当前的活跃度。
        </p>
        <div class="badge-row">
          <span class="badge">已完成 {{ wishStore.stats.done }}</span>
          <span class="badge">进行中 {{ wishStore.stats.active }}</span>
        </div>
      </div>
    </article>

    <div class="split-grid stats-main-grid">
      <article class="page-card storage-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Storage</p>
            <h2 class="section-title">图片容量估算</h2>
          </div>
          <span class="badge">已使用 {{ storageSummary.usagePercent }}%</span>
        </div>

        <div class="two-up-grid storage-grid">
          <article class="stack-item storage-brief">
            <span class="muted">已使用</span>
            <strong>{{ formatStorageBytes(storageSummary.usedBytes) }}</strong>
            <p>当前按 Supabase 免费版 1 GB file storage 估算。</p>
          </article>
          <article class="stack-item storage-brief">
            <span class="muted">还可用</span>
            <strong>{{ formatStorageBytes(storageSummary.remainingBytes) }}</strong>
            <p>
              {{ estimatedRemainingImageCount === null ? '等你再多传几张图后，这里会按平均图片大小估算还能放多少张。' : `按当前平均图片大小，大约还能放 ${estimatedRemainingImageCount} 张。` }}
            </p>
          </article>
        </div>

        <div class="storage-meter" :aria-label="`图片空间已使用 ${storageSummary.usagePercent}%`">
          <div :class="['storage-meter-fill', { warning: storageSummary.nearingLimit, danger: storageSummary.overSoftLimit }]" :style="{ width: `${storageSummary.usagePercent}%` }"></div>
        </div>

        <div class="storage-notes">
          <article class="stack-item storage-brief">
            <h3>为什么主要盯图片</h3>
            <p>免费版当前是 1 GB 文件存储和 500 MB 数据库。真正吃空间的是图片；愿望、留言和备注这些文本数据通常非常小。</p>
          </article>
          <article class="stack-item storage-brief">
            <h3>当前上传策略</h3>
            <p>前端单张图片上限还是 10 MB，但上传前会自动做温和压缩：最长边约 2048px，目标通常落在 1 到 2 MB 左右，优先保证手机端看图清楚。</p>
          </article>
        </div>
      </article>

      <article class="page-card member-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">By Member</p>
            <h2 class="section-title">成员维度</h2>
          </div>
          <p class="section-note">这里更适合看每个人各自的推进节奏、私密与共同愿望的占比，以及图片与留言分布。</p>
        </div>

        <div class="member-grid">
          <article v-for="item in perMemberStats" :key="item.member.id" class="stack-item member-surface">
            <div class="member-head">
              <h3>{{ item.member.displayName }}</h3>
              <span class="badge">总计 {{ item.total }}</span>
            </div>

            <div class="member-metrics">
              <div class="member-line">
                <span>进行中</span>
                <strong>{{ item.active }}</strong>
              </div>
              <div class="member-line">
                <span>已完成</span>
                <strong>{{ item.done }}</strong>
              </div>
              <div class="member-line">
                <span>共同 / 私密</span>
                <strong>{{ item.sharedCount }} / {{ item.privateCount }}</strong>
              </div>
              <div class="member-line">
                <span>留言 / 图片</span>
                <strong>{{ item.comments }} / {{ item.imageCount }}</strong>
              </div>
            </div>

            <p class="muted member-note">已逾期 {{ item.overdue }} 项，图片约占 {{ formatStorageBytes(item.imageBytes) }}。</p>
          </article>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: 1rem;
}

.stats-story-card,
.storage-card,
.member-panel,
.storage-grid,
.storage-notes {
  display: grid;
  gap: 1rem;
}

.stats-story-card {
  background:
    linear-gradient(135deg, rgba(255, 247, 237, 0.95), rgba(255, 242, 227, 0.8)),
    linear-gradient(155deg, rgba(46, 142, 131, 0.14), transparent 52%);
}

.section-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.stats-story-copy,
.stats-story-note,
.storage-brief p,
.member-note {
  margin: 0;
  line-height: 1.75;
}

.stats-story-copy {
  max-width: 62ch;
}

.story-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.stats-story-note {
  max-width: 42rem;
}

.storage-grid,
.member-grid,
.member-metrics {
  display: grid;
  gap: 1rem;
}

.storage-brief {
  gap: 0.55rem;
}

.storage-brief h3,
.member-head h3 {
  margin: 0;
}

.storage-brief strong {
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-family: 'Cormorant Garamond', serif;
}

.stats-main-grid {
  align-items: start;
}

.storage-meter {
  position: relative;
  height: 14px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(79, 49, 35, 0.08);
}

.storage-meter-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(47, 138, 128, 0.9), rgba(213, 176, 110, 0.9));
}

.storage-meter-fill.warning {
  background: linear-gradient(135deg, rgba(213, 176, 110, 0.9), rgba(197, 106, 77, 0.9));
}

.storage-meter-fill.danger {
  background: linear-gradient(135deg, rgba(197, 106, 77, 0.95), rgba(142, 60, 49, 0.95));
}

.member-grid {
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}

.member-surface {
  gap: 0.9rem;
}

.member-head,
.member-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
}

.member-line span {
  color: var(--text-soft);
}

.member-line strong {
  font-size: 1.4rem;
  font-family: 'Cormorant Garamond', serif;
}

@media (max-width: 720px) {
  .section-heading,
  .story-footer,
  .member-head,
  .member-line {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>