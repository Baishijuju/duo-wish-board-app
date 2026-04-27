<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFilterStore } from '../stores/filters'
import type { WishDraft, WishPriority, WishRecord, WishScope } from '../stores/wishes'
import { useWishStore } from '../stores/wishes'

const authStore = useAuthStore()
const filterStore = useFilterStore()
const wishStore = useWishStore()

const editingWishId = ref<string | null>(null)
const backupMessage = ref('')
const backupTone = ref<'success' | 'danger'>('success')

const draft = ref<WishDraft>({
  title: '',
  category: '',
  priority: 'medium',
  dueDate: '',
  note: '',
  ownerId: authStore.currentMember?.id ?? authStore.members[0]?.id ?? '',
  scope: 'shared',
})

const priorityLabels: Record<WishPriority, string> = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
}

const scopeLabels: Record<WishScope, string> = {
  private: '私密愿望',
  shared: '共同愿望',
}

watch(
  () => authStore.currentMemberId,
  (memberId) => {
    if (!editingWishId.value && memberId) {
      draft.value.ownerId = memberId
    }
  },
  { immediate: true },
)

const filteredWishes = computed(() => {
  return wishStore.sortedWishes.filter((wish) => {
    const matchStatus = filterStore.status === 'all' || wish.status === filterStore.status
    const matchVisibility =
      filterStore.visibility === 'all'
      || (filterStore.visibility === 'shared' && wish.scope === 'shared')
      || (filterStore.visibility === 'mine' && wish.ownerId === authStore.currentMember?.id)
    const matchSearch = `${wish.title} ${wish.category} ${wish.note}`
      .toLowerCase()
      .includes(filterStore.search.trim().toLowerCase())

    return matchStatus && matchVisibility && matchSearch
  })
})

function getMemberName(memberId: string) {
  return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
}

function getCoverImageUrl(wish: WishRecord) {
  return wish.images[0]?.url ?? ''
}

function resetDraft() {
  draft.value = {
    title: '',
    category: '',
    priority: 'medium',
    dueDate: '',
    note: '',
    ownerId: authStore.currentMember?.id ?? authStore.members[0]?.id ?? '',
    scope: 'shared',
  }
}

function startEditingWish(id: string) {
  const wish = wishStore.findById(id)

  if (!wish) {
    return
  }

  editingWishId.value = id
  draft.value = {
    title: wish.title,
    category: wish.category,
    priority: wish.priority,
    dueDate: wish.dueDate,
    note: wish.note,
    ownerId: wish.ownerId,
    scope: wish.scope,
  }
}

function cancelEditing() {
  editingWishId.value = null
  resetDraft()
}

async function submitWish() {
  if (!draft.value.title.trim()) {
    return
  }

  if (editingWishId.value) {
    await wishStore.updateWish(editingWishId.value, draft.value)
    cancelEditing()
    return
  }

  await wishStore.addWish(draft.value)
  resetDraft()
}

function toFileSafeSegment(value: string) {
  return value.trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'wish-space'
}

function downloadBackup() {
  if (typeof window === 'undefined') {
    backupMessage.value = '当前环境不支持下载备份文件。'
    backupTone.value = 'danger'
    return
  }

  const payload = wishStore.createBackupPayload()
  const fileName = `${toFileSafeSegment(payload.space.name)}-${payload.space.dataMode}-${payload.exportedAt.slice(0, 10)}.json`
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()
  window.URL.revokeObjectURL(url)

  backupMessage.value = '当前空间备份已导出为 JSON。建议你和你老婆后续多端使用前，先各自留一份备份。'
  backupTone.value = 'success'
}
</script>

<template>
  <section class="page-stack list-page">
    <article class="page-card list-story-card">
      <div class="list-story-head">
        <div>
          <p class="eyebrow">Wish Composer</p>
          <h2 class="section-title">把今天想靠近的事写进清单</h2>
        </div>
        <div class="button-row">
          <button class="button-subtle" type="button" @click="downloadBackup">导出 JSON 备份</button>
          <button v-if="editingWishId" class="button-subtle" @click="cancelEditing">取消编辑</button>
          <button v-if="!wishStore.isUsingCloudWishes" class="button-subtle" @click="wishStore.resetToSeed">恢复示例</button>
        </div>
      </div>

      <p class="section-copy list-story-copy">
        共同愿望和私密愿望都从这里进入同一个空间。布局上保留第一版那种轻盈感，但底层已经接上登录、权限、图片和云端同步。
      </p>
      <p class="muted">{{ wishStore.syncMessage }}</p>
      <p v-if="backupMessage" :class="['backup-message', backupTone]">{{ backupMessage }}</p>
    </article>

    <article class="page-card composer-card">
      <div class="section-heading composer-heading">
        <div>
          <p class="eyebrow">Composer</p>
          <h2 class="section-title">{{ editingWishId ? '编辑愿望' : '新增愿望' }}</h2>
        </div>
        <p class="section-note">先写标题，再决定它是共同愿望还是私密愿望；图片、留言和更多记录可以在详情里慢慢补。</p>
      </div>

      <form class="composer-form" @submit.prevent="submitWish">
        <label v-if="!wishStore.isUsingCloudWishes">
          <span class="muted">归属成员</span>
          <select v-model="draft.ownerId">
            <option v-for="member in authStore.members" :key="member.id" :value="member.id">
              {{ member.displayName }}
            </option>
          </select>
        </label>
        <div v-else class="stack-item compact-owner-card">
          <span class="muted">当前创建人</span>
          <strong>{{ authStore.currentMember?.displayName || '当前成员' }}</strong>
        </div>
        <label>
          <span class="muted">可见性</span>
          <select v-model="draft.scope">
            <option value="shared">共同愿望</option>
            <option value="private">私密愿望</option>
          </select>
        </label>
        <label>
          <span class="muted">愿望标题</span>
          <input v-model="draft.title" type="text" maxlength="60" placeholder="例如：一起去看一次极光" />
        </label>
        <label>
          <span class="muted">分类</span>
          <input v-model="draft.category" type="text" maxlength="20" placeholder="旅行 / 成长 / 生活" />
        </label>
        <label>
          <span class="muted">目标日期</span>
          <input v-model="draft.dueDate" type="date" />
        </label>
        <label>
          <span class="muted">优先级</span>
          <select v-model="draft.priority">
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </select>
        </label>
        <label class="composer-message-field">
          <span class="muted">备注</span>
          <textarea v-model="draft.note" rows="4" maxlength="180" placeholder="写下为什么想做、下一步是什么"></textarea>
        </label>
        <div class="button-row composer-actions">
          <button class="button-solid" type="submit">{{ editingWishId ? '保存修改' : '加入清单' }}</button>
        </div>
      </form>
    </article>

    <article class="page-card control-bar-card">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Control Bar</p>
          <h2 class="section-title">筛选与搜索</h2>
        </div>
        <p class="section-note">搜索会同时匹配标题、分类和备注，让长清单也能很快回到最近最想推进的那几件事。</p>
      </div>

      <div class="control-layout">
        <label class="search-field">
          <span class="muted">搜索</span>
          <input v-model="filterStore.search" type="search" placeholder="搜索标题、分类或备注" />
        </label>
        <div class="filter-groups">
          <div class="pill-row">
            <button class="pill filter-button" type="button" :class="{ active: filterStore.visibility === 'all' }" @click="filterStore.visibility = 'all'">全部</button>
            <button class="pill filter-button" type="button" :class="{ active: filterStore.visibility === 'shared' }" @click="filterStore.visibility = 'shared'">共同</button>
            <button class="pill filter-button" type="button" :class="{ active: filterStore.visibility === 'mine' }" @click="filterStore.visibility = 'mine'">只看我</button>
          </div>
          <div class="pill-row">
            <button class="pill filter-button" type="button" :class="{ active: filterStore.status === 'all' }" @click="filterStore.status = 'all'">全部状态</button>
            <button class="pill filter-button" type="button" :class="{ active: filterStore.status === 'active' }" @click="filterStore.status = 'active'">进行中</button>
            <button class="pill filter-button" type="button" :class="{ active: filterStore.status === 'done' }" @click="filterStore.status = 'done'">已完成</button>
          </div>
        </div>
      </div>
    </article>

    <article class="page-card wish-board-card">
      <div class="wish-board-heading">
        <div>
          <p class="eyebrow">Wish Board</p>
          <h2 class="section-title">愿望列表</h2>
        </div>
        <div class="badge-row">
          <span class="badge">结果 {{ filteredWishes.length }}</span>
          <span class="badge">已点亮 {{ wishStore.stats.starred }}</span>
          <span class="badge">共同 {{ wishStore.stats.shared }}</span>
        </div>
      </div>

      <div v-if="filteredWishes.length" class="list-grid">
        <article v-for="wish in filteredWishes" :key="wish.id" class="wish-card-surface">
          <div class="badge-row">
            <span class="badge">{{ scopeLabels[wish.scope] }}</span>
            <span class="badge">{{ wish.category }}</span>
            <span class="badge">{{ priorityLabels[wish.priority] }}</span>
            <span class="badge">{{ wish.starred ? '已点亮' : '未点亮' }}</span>
            <span v-if="wish.images.length" class="badge">图片 {{ wish.images.length }}</span>
          </div>

          <div class="wish-card-layout" :class="{ 'has-cover-image': !!getCoverImageUrl(wish) }">
            <img v-if="getCoverImageUrl(wish)" class="wish-cover-image" :src="getCoverImageUrl(wish)" :alt="`${wish.title} 首图`" />
            <div class="wish-card-copy">
              <h3>{{ wish.title }}</h3>
              <p>{{ wish.note }}</p>
              <div class="wish-meta-row muted">
                <span>归属：{{ getMemberName(wish.ownerId) }}</span>
                <span>留言：{{ wish.comments.length }}</span>
                <span>截止：{{ wish.dueDate || '未设置' }}</span>
              </div>
            </div>
          </div>

          <div class="button-row wish-card-actions">
            <RouterLink class="button-link" :to="{ name: 'wish-detail', params: { id: wish.id } }">详情 / 留言</RouterLink>
            <button class="button-subtle" type="button" @click="startEditingWish(wish.id)">编辑</button>
            <button class="button-subtle" type="button" @click="void wishStore.toggleStar(wish.id)">
              {{ wish.starred ? '取消点亮' : '点亮' }}
            </button>
            <button class="button-subtle" type="button" @click="void wishStore.toggleDone(wish.id)">
              {{ wish.status === 'done' ? '标记进行中' : '标记完成' }}
            </button>
            <button class="button-subtle danger-button" type="button" @click="void wishStore.deleteWish(wish.id)">删除</button>
          </div>
        </article>
      </div>

      <div v-else class="stack-item empty-board-card">
        <h3>这一组筛选下暂时没有愿望</h3>
        <p>可以换一个筛选条件，或者直接新增一条愿望，让这张生活地图重新热闹起来。</p>
      </div>
    </article>
  </section>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: 1rem;
}

.list-story-card,
.composer-card,
.control-bar-card,
.wish-board-card,
.composer-form,
.filters-card {
  display: grid;
  gap: 1rem;
}

.list-story-card {
  background:
    linear-gradient(135deg, rgba(255, 247, 237, 0.95), rgba(255, 242, 227, 0.78)),
    linear-gradient(160deg, rgba(241, 166, 97, 0.2), transparent 54%);
}

.list-story-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.list-story-copy {
  max-width: 60ch;
  margin: 0;
  line-height: 1.8;
}

.composer-heading {
  align-items: start;
}

.composer-form {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.composer-form label {
  display: grid;
  gap: 0.55rem;
}

.composer-message-field {
  grid-column: span 3;
}

.composer-actions {
  justify-content: flex-end;
}

.control-layout,
.filter-groups {
  display: grid;
  gap: 1rem;
}

.control-layout {
  grid-template-columns: minmax(0, 280px) minmax(0, 1fr);
  align-items: start;
}

.search-field {
  display: grid;
  gap: 0.55rem;
}

.filter-button {
  border: 0;
}

.wish-board-heading {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.backup-message {
  margin: 0;
  line-height: 1.7;
}

.backup-message.success {
  color: var(--success);
}

.backup-message.danger {
  color: var(--danger);
}

.list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.wish-card-surface {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 0.85rem;
  padding: 1.05rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(79, 49, 35, 0.08);
  box-shadow: var(--shadow-soft);
}

.wish-card-surface::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(135deg, rgba(219, 107, 87, 0.9), rgba(46, 142, 131, 0.75));
  opacity: 0.72;
}

.wish-card-surface h3,
.wish-card-surface p {
  margin: 0;
}

.wish-card-surface p {
  color: var(--text-soft);
  line-height: 1.7;
}

.wish-card-layout {
  display: grid;
  gap: 0.8rem;
}

.wish-card-layout.has-cover-image {
  grid-template-columns: minmax(0, 140px) minmax(0, 1fr);
  align-items: start;
}

.wish-card-copy {
  display: grid;
  gap: 0.8rem;
}

.wish-card-copy h3 {
  font-size: 1.2rem;
}

.wish-cover-image {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 18px;
  object-fit: cover;
  background: rgba(255, 255, 255, 0.9);
}

.wish-meta-row {
  display: flex;
  gap: 0.9rem;
  flex-wrap: wrap;
}

.wish-card-actions {
  align-items: center;
}

.danger-button {
  color: #8e3c31;
}

.compact-owner-card {
  display: grid;
  gap: 0.4rem;
  align-content: start;
}

.empty-board-card {
  align-content: start;
}

@media (max-width: 720px) {
  .list-story-head,
  .wish-board-heading,
  .composer-heading,
  .composer-form,
  .control-layout {
    grid-template-columns: 1fr;
  }

  .composer-message-field {
    grid-column: auto;
  }

  .wish-card-layout.has-cover-image {
    grid-template-columns: 1fr;
  }

  .wish-meta-row {
    flex-direction: column;
    gap: 0.35rem;
  }
}
</style>