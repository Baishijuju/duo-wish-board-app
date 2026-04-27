<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { WishRecord } from '../stores/wishes'
import { useWishStore } from '../stores/wishes'

const authStore = useAuthStore()
const wishStore = useWishStore()

const loginEmail = ref(authStore.sessionEmail || authStore.currentMember?.email || '')
const loginOtp = ref('')
const inviteDraft = ref(authStore.inviteCode)
const loginMessage = ref('')
const loginTone = ref<'success' | 'danger'>('success')
const inviteMessage = ref('')
const inviteTone = ref<'success' | 'danger'>('success')
const isSendingMagicLink = ref(false)
const isVerifyingOtp = ref(false)
const isJoiningSpace = ref(false)
const showOtpForm = computed(() => !authStore.isAuthenticated)
const otpTargetEmail = computed(() => authStore.sessionEmail || loginEmail.value.trim().toLowerCase())
const canCopyInviteCode = computed(() => authStore.usesSupabaseSpace && !!authStore.inviteCode)
const overdueWishes = computed(() => wishStore.overdueWishes.slice(0, 3))
const dueSoonWishes = computed(() => wishStore.dueSoonWishes.slice(0, 3))
const recentlyCompletedWishes = computed(() => wishStore.recentlyCompletedWishes.slice(0, 3))
const storageSummary = computed(() => wishStore.imageStorageSummary)
const hasReminderContent = computed(() => overdueWishes.value.length > 0 || dueSoonWishes.value.length > 0 || recentlyCompletedWishes.value.length > 0)

watch(
  () => authStore.sessionEmail,
  (value) => {
    if (value) {
      loginEmail.value = value
    }
  },
)

watch(
  () => authStore.inviteCode,
  (value) => {
    inviteDraft.value = value
  },
  { immediate: true },
)

async function submitMagicLink() {
  isSendingMagicLink.value = true

  try {
    const result = await authStore.requestMagicLink(loginEmail.value)
    loginMessage.value = result.message
    loginTone.value = result.ok ? 'success' : 'danger'

    if (result.ok) {
      loginOtp.value = ''
    }
  } finally {
    isSendingMagicLink.value = false
  }
}

async function submitEmailOtp() {
  isVerifyingOtp.value = true

  try {
    const result = await authStore.verifyEmailOtp(loginEmail.value, loginOtp.value)
    loginMessage.value = result.message
    loginTone.value = result.ok ? 'success' : 'danger'

    if (result.ok) {
      loginOtp.value = ''
    }
  } finally {
    isVerifyingOtp.value = false
  }
}

async function joinSpace() {
  isJoiningSpace.value = true

  try {
    const result = await authStore.joinSpaceByInvite(inviteDraft.value)
    inviteMessage.value = result.message
    inviteTone.value = result.ok ? 'success' : 'danger'
  } finally {
    isJoiningSpace.value = false
  }
}

async function copyInviteCode() {
  if (!canCopyInviteCode.value || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    inviteMessage.value = '当前环境无法直接复制邀请码，请手动复制右侧这串编码。'
    inviteTone.value = 'danger'
    return
  }

  await navigator.clipboard.writeText(authStore.inviteCode)
  inviteMessage.value = '邀请码已复制。把它发给对方后，对方先完成邮箱登录，再在这里输入邀请码即可加入同一个空间。'
  inviteTone.value = 'success'
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

function formatStorageBytes(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`
  }

  return `${sizeBytes} B`
}

function formatDateLabel(dateValue: string) {
  if (!dateValue) {
    return '未设置日期'
  }

  return dateValue.replace('T', ' ').slice(0, 10)
}

function getRelativeDueLabel(dueDate: string) {
  const dueTimestamp = getLocalDateTimestamp(dueDate)

  if (dueTimestamp === null) {
    return '未设置截止日期'
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayDifference = Math.round((dueTimestamp - today.getTime()) / (24 * 60 * 60 * 1000))

  if (dayDifference < 0) {
    return `已逾期 ${Math.abs(dayDifference)} 天`
  }

  if (dayDifference === 0) {
    return '今天截止'
  }

  if (dayDifference === 1) {
    return '明天截止'
  }

  return `${dayDifference} 天后截止`
}
</script>

<template>
  <section class="page-stack home-page">
    <article class="page-card home-story-card">
      <div class="home-story-copy">
        <p class="eyebrow">Shared Horizon</p>
        <h2 class="section-title">把最近想一起靠近的事，安静地排进生活里</h2>
        <p class="section-copy home-story-lead">
          首页先把最值得注意的变化挑出来：逾期、临近截止、最近完成，以及当前云端图片空间的使用情况。
        </p>
      </div>

      <div class="summary-grid home-summary-grid">
        <article class="summary-card accent-sunrise">
          <p>总愿望数</p>
          <strong>{{ wishStore.stats.total }}</strong>
          <span>{{ wishStore.stats.active }} 项正在推进</span>
        </article>
        <article class="summary-card accent-coral">
          <p>14 天内到期</p>
          <strong>{{ wishStore.stats.dueSoon }}</strong>
          <span>{{ wishStore.stats.overdue }} 项已经逾期</span>
        </article>
        <article class="summary-card accent-aurora">
          <p>已完成</p>
          <strong>{{ wishStore.stats.done }}</strong>
          <span>当前完成率 {{ wishStore.stats.completionRate }}%</span>
        </article>
        <article class="summary-card accent-golden">
          <p>图片空间</p>
          <strong>{{ storageSummary.usagePercent }}%</strong>
          <span>{{ formatStorageBytes(storageSummary.usedBytes) }} / {{ formatStorageBytes(storageSummary.quotaBytes) }}</span>
        </article>
      </div>

      <div class="story-footer">
        <p :class="['story-storage-note', 'muted', { warning: storageSummary.nearingLimit }]">
          {{ wishStore.isUsingCloudWishes
            ? `当前图片约占 ${formatStorageBytes(storageSummary.usedBytes)} / ${formatStorageBytes(storageSummary.quotaBytes)} 免费空间；上传前已经会自动做温和压缩，尽量兼顾清晰度和长期可用性。`
            : '当前还是本地演示空间；连接 Supabase 后，这里会显示云端图片容量估算。' }}
        </p>
        <div class="button-row">
          <RouterLink class="button-link" :to="{ name: 'list' }">去整理清单</RouterLink>
          <RouterLink class="button-subtle" :to="{ name: 'stats' }">看完整统计</RouterLink>
        </div>
      </div>
    </article>

    <div class="split-grid home-main-grid">
      <article class="page-card reminder-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Spotlight</p>
            <h2 class="section-title">近期重点</h2>
          </div>
          <p class="section-note">不必每天都翻完整张清单，先把最需要推进或回看的那几件事留在首页。</p>
        </div>

        <div v-if="hasReminderContent" class="reminder-board">
          <section v-if="overdueWishes.length" class="stack-item reminder-block tone-danger">
            <div class="reminder-heading-row">
              <h3>已逾期</h3>
              <span class="badge">{{ wishStore.stats.overdue }} 条</span>
            </div>
            <div class="reminder-list">
              <div v-for="wish in overdueWishes" :key="wish.id" class="reminder-row">
                <div class="reminder-copy">
                  <strong>{{ wish.title }}</strong>
                  <p>{{ getRelativeDueLabel(wish.dueDate) }}</p>
                </div>
                <RouterLink class="button-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">详情</RouterLink>
              </div>
            </div>
          </section>

          <section v-if="dueSoonWishes.length" class="stack-item reminder-block tone-warm">
            <div class="reminder-heading-row">
              <h3>14 天内到期</h3>
              <span class="badge">{{ wishStore.stats.dueSoon }} 条</span>
            </div>
            <div class="reminder-list">
              <div v-for="wish in dueSoonWishes" :key="wish.id" class="reminder-row">
                <div class="reminder-copy wish-preview-layout" :class="{ 'has-cover-image': !!getCoverImageUrl(wish) }">
                  <img v-if="getCoverImageUrl(wish)" class="wish-preview-image" :src="getCoverImageUrl(wish)" :alt="`${wish.title} 首图`" />
                  <div class="wish-preview-copy">
                    <div class="badge-row">
                      <span class="badge">{{ wish.scope === 'shared' ? '共同愿望' : '个人愿望' }}</span>
                      <span class="badge">{{ wish.category }}</span>
                    </div>
                    <strong>{{ wish.title }}</strong>
                    <p>{{ getRelativeDueLabel(wish.dueDate) }}</p>
                  </div>
                </div>
                <RouterLink class="button-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">详情</RouterLink>
              </div>
            </div>
          </section>

          <section v-if="recentlyCompletedWishes.length" class="stack-item reminder-block tone-success">
            <div class="reminder-heading-row">
              <h3>最近完成</h3>
              <span class="badge">30 天内</span>
            </div>
            <div class="reminder-list">
              <div v-for="wish in recentlyCompletedWishes" :key="wish.id" class="reminder-row">
                <div class="reminder-copy">
                  <strong>{{ wish.title }}</strong>
                  <p>完成时间：{{ formatDateLabel(wish.updatedAt) }}</p>
                </div>
                <RouterLink class="button-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">回看</RouterLink>
              </div>
            </div>
          </section>
        </div>

        <div v-else class="stack-item empty-state-card">
          <h3>提醒区目前很安静</h3>
          <p>现在没有逾期、即将到期或最近完成的愿望。你可以继续创建带截止日期的愿望，首页会自动开始提醒。</p>
          <div class="button-row">
            <RouterLink class="button-link" :to="{ name: 'list' }">去新建愿望</RouterLink>
          </div>
        </div>
      </article>

      <div class="home-side-stack">
        <article class="page-card access-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Access</p>
              <h2 class="section-title access-title">邮箱验证码登录</h2>
            </div>
            <span class="badge">{{ authStore.isAuthenticated ? '已登录' : '未登录' }}</span>
          </div>

          <form class="access-form" @submit.prevent="submitMagicLink">
            <label>
              <span class="muted">邮箱</span>
              <input v-model="loginEmail" type="email" placeholder="chenguang@example.com" />
            </label>
            <div class="button-row">
              <button class="button-solid" :disabled="isSendingMagicLink" type="submit">
                {{ isSendingMagicLink ? '发送中...' : '发送登录邮件' }}
              </button>
            </div>
          </form>

          <form v-if="showOtpForm" class="access-form" @submit.prevent="submitEmailOtp">
            <label>
              <span class="muted">收到验证码后填在这里，不是邀请码</span>
            </label>
            <label>
              <span class="muted">邮箱验证码</span>
              <input v-model="loginOtp" type="text" inputmode="numeric" placeholder="输入邮件里的验证码" />
            </label>
            <p v-if="otpTargetEmail" class="muted">当前会按 {{ otpTargetEmail }} 校验；如果刚换了邮箱，请先重新发送验证码。</p>
            <div class="button-row">
              <button class="button-subtle" :disabled="isVerifyingOtp" type="submit">
                {{ isVerifyingOtp ? '校验中...' : '验证邮箱验证码' }}
              </button>
            </div>
          </form>

          <p v-if="showOtpForm" class="muted">
            如果邮箱里的登录链接经常一打开就失效，通常是邮箱安全扫描提前访问了一次性 magic link；改用邮件里的验证码会更稳。
          </p>
          <p v-if="loginMessage" :class="['access-message', loginTone]">{{ loginMessage }}</p>
        </article>

        <article class="page-card access-card">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Invite</p>
              <h2 class="section-title access-title">邀请码加入空间</h2>
            </div>
            <button v-if="canCopyInviteCode" class="button-subtle" type="button" @click="copyInviteCode">
              复制邀请码
            </button>
          </div>

          <form class="access-form" @submit.prevent="joinSpace">
            <label>
              <span class="muted">邀请码</span>
              <input v-model="inviteDraft" type="text" placeholder="WISH-2026" />
            </label>
            <div class="button-row">
              <button class="button-subtle" :disabled="isJoiningSpace" type="submit">
                {{ isJoiningSpace ? '加入中...' : '校验并加入' }}
              </button>
            </div>
          </form>

          <div class="stack-item space-identity-card">
            <h3>{{ authStore.spaceName }}</h3>
            <p>邀请码：{{ authStore.inviteCode }}</p>
            <p class="muted">对方先完成邮箱登录，再把邀请码填在上面的输入框里，就会加入这个空间。</p>
            <div class="badge-row">
              <span v-for="member in authStore.members" :key="member.id" class="badge">
                {{ member.displayName }} / {{ member.role }}
              </span>
            </div>
          </div>

          <p v-if="inviteMessage" :class="['access-message', inviteTone]">{{ inviteMessage }}</p>
          <p class="muted">
            {{ authStore.usesSupabaseSpace ? '当前空间已经连接到 Supabase；首次登录时如果没有空间，会自动创建一个个人空间。' : '未登录时仍会回退到本地演示空间。' }}
          </p>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: 1rem;
}

.home-story-card,
.reminder-panel,
.home-side-stack,
.access-card,
.access-form {
  display: grid;
  gap: 1rem;
}

.home-story-card {
  background:
    linear-gradient(135deg, rgba(255, 247, 237, 0.94), rgba(255, 242, 227, 0.78)),
    linear-gradient(160deg, rgba(241, 166, 97, 0.22), transparent 54%);
}

.home-story-lead {
  max-width: 60ch;
  margin: 0;
  line-height: 1.8;
}

.home-summary-grid {
  margin: 0;
}

.story-footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.story-storage-note {
  max-width: 44rem;
  margin: 0;
  line-height: 1.7;
}

.story-storage-note.warning {
  color: var(--danger);
}

.home-main-grid {
  align-items: start;
}

.reminder-board,
.reminder-list {
  display: grid;
  gap: 0.85rem;
}

.reminder-block {
  gap: 0.85rem;
}

.reminder-block.tone-danger {
  background: rgba(197, 106, 77, 0.08);
}

.reminder-block.tone-warm {
  background: rgba(213, 176, 110, 0.12);
}

.reminder-block.tone-success {
  background: rgba(47, 138, 128, 0.08);
}

.reminder-heading-row,
.reminder-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.reminder-copy {
  display: grid;
  gap: 0.35rem;
}

.reminder-copy strong,
.reminder-copy p,
.space-identity-card p {
  margin: 0;
}

.reminder-copy p {
  color: var(--text-soft);
}

.home-side-stack {
  align-content: start;
}

.access-title {
  font-size: clamp(1.65rem, 2.6vw, 2rem);
}

.access-form label {
  display: grid;
  gap: 0.55rem;
}

.access-message {
  margin: 0;
  line-height: 1.7;
}

.access-message.success {
  color: var(--success);
}

.access-message.danger {
  color: var(--danger);
}

.space-identity-card {
  gap: 0.8rem;
}

.space-identity-card h3 {
  margin: 0;
  font-size: 1.2rem;
}

.empty-state-card {
  align-content: start;
}

.wish-preview-layout {
  display: grid;
  gap: 0.9rem;
}

.wish-preview-layout.has-cover-image {
  grid-template-columns: minmax(0, 112px) minmax(0, 1fr);
  align-items: start;
}

.wish-preview-copy {
  display: grid;
  gap: 0.8rem;
}

.wish-preview-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
}

@media (max-width: 720px) {
  .story-footer,
  .reminder-heading-row,
  .reminder-row {
    flex-direction: column;
  }

  .wish-preview-layout.has-cover-image {
    grid-template-columns: 1fr;
  }
}
</style>