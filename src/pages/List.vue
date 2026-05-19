<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { WishRecord } from '../stores/wishes'
import { useListWishBoardState } from '../composables/useListWishBoardState'

const {
  authStore,
  filterStore,
  filteredWishes,
  formatDateLabel,
  getCoverImageUrl,
  getMemberName,
  getRelativeDueLabel,
  getWishCoinHint,
  getWishCoinSummary,
  getWishMood,
  getWishProgress,
  getWishProgressHint,
  openMoreWishId,
  priorityLabels,
  scopeLabels,
  toggleMoreMenu,
  wishStore,
} = useListWishBoardState()

type ListActionKind = 'coin' | 'done' | 'delete'
type ListFeedbackTone = 'success' | 'danger' | 'info'

const visibilityLabels = {
  all: '全部愿望',
  shared: '我们一起',
  mine: '只属于我',
} as const

const statusLabels = {
  all: '全部状态',
  active: '正在推进',
  done: '已经实现',
} as const

const viewerName = computed(() => authStore.currentMember?.displayName ?? '我们')
const selectedVisibilityLabel = computed(() => visibilityLabels[filterStore.visibility])
const selectedStatusLabel = computed(() => statusLabels[filterStore.status])
const archiveSummary = computed(() => {
  if (filterStore.visibility === 'mine') {
    if (filterStore.status === 'done') {
      return `这里只看 ${viewerName.value} 已经实现的私藏愿望。`
    }

    if (filterStore.status === 'all') {
      return `这里只看 ${viewerName.value} 写下的私藏愿望。`
    }

    return `这里只看 ${viewerName.value} 还在路上的私藏愿望。`
  }

  if (filterStore.status === 'done') {
    return wishStore.stats.done
      ? `现在只看已经实现的愿望，共 ${wishStore.stats.done} 条。`
      : '这里会收下已经实现的愿望。'
  }

  if (filterStore.status === 'all') {
    return wishStore.stats.done
      ? `现在把不同状态放在一起看，已完成 ${wishStore.stats.done} 条。`
      : '现在会把不同状态一起显示。'
  }

  return wishStore.stats.done
    ? `已完成 ${wishStore.stats.done} 条，继续收进回顾页。`
    : '这里只放还在推进的愿望。'
})
const searchSummary = computed(() => {
  const query = filterStore.search.trim()

  if (!query) {
    return archiveSummary.value
  }

  return `正在搜「${query}」· 找到 ${filteredWishes.value.length} 条。`
})
const boardHeading = computed(() => {
  const query = filterStore.search.trim()

  if (query) {
    return `和「${query}」有关的愿望`
  }

  if (filterStore.status === 'done') {
    if (filterStore.visibility === 'shared') {
      return '已经一起实现的愿望'
    }

    if (filterStore.visibility === 'mine') {
      return `${viewerName.value} 已经实现的私藏愿望`
    }

    return '已经实现的愿望'
  }

  if (filterStore.status === 'all') {
    if (filterStore.visibility === 'shared') {
      return '一起写下的全部愿望'
    }

    if (filterStore.visibility === 'mine') {
      return `${viewerName.value} 只留给自己的愿望`
    }

    return '这一阵子的全部愿望'
  }

  if (filterStore.visibility === 'shared') {
    return '一起推进的愿望'
  }

  if (filterStore.visibility === 'mine') {
    return `${viewerName.value} 想自己慢慢靠近的事`
  }

  return '今天继续往前的愿望'
})
const pendingWishAction = ref<{ wishId: string; kind: ListActionKind } | null>(null)
const pendingDeleteWishId = ref<string | null>(null)
const pageFeedback = ref<{ tone: ListFeedbackTone; text: string } | null>(null)

function getWishCaption(wish: WishRecord) {
  return [wish.category || '还没有分类', priorityLabels[wish.priority]].join(' · ')
}

function getProgressCopy(wish: WishRecord) {
  const progress = getWishProgress(wish)

  if (progress.mode === 'count') {
    return progress.label
  }

  if (progress.mode === 'steps') {
    return progress.target ? progress.label : '还没有写第一个步骤'
  }

  return '先把愿望本身写清楚'
}

function closeMoreMenu() {
  openMoreWishId.value = null
  pendingDeleteWishId.value = null
}

function showPageFeedback(tone: ListFeedbackTone, text: string) {
  pageFeedback.value = { tone, text }
}

function isWishActionPending(wishId: string, kind?: ListActionKind) {
  return pendingWishAction.value?.wishId === wishId && (!kind || pendingWishAction.value.kind === kind)
}

function handleMoreMenuToggle(wishId: string) {
  if (openMoreWishId.value !== wishId) {
    pendingDeleteWishId.value = null
  }

  toggleMoreMenu(wishId)
}

function requestDeleteWish(wishId: string) {
  pendingDeleteWishId.value = wishId
}

function cancelDeleteWish() {
  pendingDeleteWishId.value = null
}

async function handleCastWishCoin(wish: WishRecord) {
  pendingWishAction.value = { wishId: wish.id, kind: 'coin' }

  try {
    const isSuccess = await wishStore.castWishCoin(wish.id)
    showPageFeedback(
      isSuccess ? 'success' : 'danger',
      isSuccess
        ? `已把 1 枚愿望币投给「${wish.title}」。`
        : wishStore.syncMessage || `这次没能把愿望币投给「${wish.title}」。`,
    )
  } finally {
    pendingWishAction.value = null
  }
}

async function handleToggleDone(wish: WishRecord) {
  const nextLabel = wish.status === 'done' ? '放回路上' : '收进已实现'
  pendingWishAction.value = { wishId: wish.id, kind: 'done' }

  try {
    const isSuccess = await wishStore.toggleDone(wish.id)
    showPageFeedback(
      isSuccess ? 'success' : 'danger',
      isSuccess
        ? `「${wish.title}」已经被${nextLabel}。`
        : wishStore.syncMessage || `这次没能更新「${wish.title}」的状态。`,
    )
  } finally {
    pendingWishAction.value = null
  }
}

async function handleDeleteWish(wish: WishRecord) {
  pendingWishAction.value = { wishId: wish.id, kind: 'delete' }

  try {
    const isSuccess = await wishStore.deleteWish(wish.id)
    if (isSuccess) {
      closeMoreMenu()
    }
    showPageFeedback(
      isSuccess ? 'success' : 'danger',
      isSuccess
        ? `「${wish.title}」已经从这张清单里移走了。`
        : wishStore.syncMessage || `这次没能删除「${wish.title}」。`,
    )
  } finally {
    pendingWishAction.value = null
  }
}

function handleWindowClick(event: MouseEvent) {
  const target = event.target instanceof Element ? event.target : null

  if (!target?.closest('.list-board-card-tools') && !target?.closest('.list-board-more-panel')) {
    closeMoreMenu()
  }
}

onMounted(() => {
  window.addEventListener('click', handleWindowClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick)
})
</script>

<template>
  <section class="list-board-page">
    <article class="page-card list-board-hero-card">
      <div class="list-board-hero-copy">
        <p class="list-board-kicker">愿望清单 <span>Wish Board</span></p>
        <h1>
          <span class="list-board-hero-name">{{ viewerName }}</span>
          <span class="list-board-hero-promise">把正在路上的愿望，排成今天能继续推进的顺序。</span>
        </h1>
        <div class="list-board-hero-actions">
          <RouterLink class="list-board-button is-solid" :to="{ name: 'compose' }">写下新愿望</RouterLink>
          <RouterLink class="list-board-button is-ghost" :to="{ name: 'review' }">打开回顾页</RouterLink>
        </div>
      </div>
    </article>

    <article class="page-card list-board-toolbar-card">
      <div class="list-board-toolbar-copy">
        <p class="list-board-kicker">筛选工作台 <span>Filters</span></p>
        <h2>先把眼前这批愿望理清楚</h2>
        <p>先选范围和状态，再往下看。</p>
      </div>

      <label class="list-board-search-field">
        <span>搜索愿望</span>
        <input v-model="filterStore.search" type="search" placeholder="搜索标题、分类或写下的原因" />
      </label>

      <div class="list-board-toolbar-actions">
        <div class="list-board-filter-stack">
          <div class="list-board-filter-group">
            <span class="list-board-filter-label">按范围看</span>
            <div class="list-board-filter-row">
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.visibility === 'all' }"
                @click="filterStore.visibility = 'all'"
              >
                全部愿望
              </button>
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.visibility === 'shared' }"
                @click="filterStore.visibility = 'shared'"
              >
                我们一起
              </button>
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.visibility === 'mine' }"
                @click="filterStore.visibility = 'mine'"
              >
                只属于我
              </button>
            </div>
          </div>

          <div class="list-board-filter-group">
            <span class="list-board-filter-label">按状态看</span>
            <div class="list-board-filter-row">
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.status === 'active' }"
                @click="filterStore.status = 'active'"
              >
                正在推进
              </button>
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.status === 'done' }"
                @click="filterStore.status = 'done'"
              >
                已经实现
              </button>
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.status === 'all' }"
                @click="filterStore.status = 'all'"
              >
                全部状态
              </button>
            </div>
          </div>
        </div>

        <div class="list-board-toolbar-side">
          <div class="list-board-toolbar-side-copy">
            <span class="list-board-filter-label">当前结果</span>
            <strong>{{ filteredWishes.length }} 条</strong>
            <p>{{ searchSummary }}</p>
          </div>
          <div class="list-board-inline-actions">
            <button class="list-board-side-button" type="button" @click="filterStore.reset()">重置筛选</button>
            <RouterLink class="list-board-side-button" :to="{ name: 'review' }">去回顾页</RouterLink>
          </div>
        </div>
      </div>
    </article>

    <article class="page-card list-board-card">
      <div v-if="pageFeedback" class="list-board-status-banner" :class="`is-${pageFeedback.tone}`" role="status" aria-live="polite">
        <p>{{ pageFeedback.text }}</p>
        <button class="list-board-side-button" type="button" @click="pageFeedback = null">收起</button>
      </div>

      <div class="list-board-head">
        <div>
          <p class="list-board-kicker">今天这批 <span>Wish List</span></p>
          <h2>{{ boardHeading }}</h2>
        </div>

        <div class="list-board-badge-row">
          <span class="list-board-badge">{{ selectedVisibilityLabel }}</span>
          <span class="list-board-badge">{{ selectedStatusLabel }} · {{ filteredWishes.length }} 条</span>
        </div>
      </div>

      <div v-if="filteredWishes.length" class="list-board-grid">
        <article v-for="wish in filteredWishes" :key="wish.id" class="list-board-item">
          <div class="list-board-card-top">
            <div class="list-board-card-overline">
              <span class="list-board-card-scope" :class="wish.scope === 'shared' ? 'is-shared' : 'is-private'">{{ scopeLabels[wish.scope] }}</span>
              <span class="list-board-card-caption">{{ getWishCaption(wish) }}</span>
            </div>

            <div class="list-board-card-tools">
              <span class="list-board-card-mood">{{ getWishMood(wish) }}</span>
              <button
                class="list-board-more-trigger"
                type="button"
                :aria-expanded="openMoreWishId === wish.id"
                :aria-controls="`wish-more-${wish.id}`"
                aria-label="打开更多操作"
                @click.stop="handleMoreMenuToggle(wish.id)"
              >
                <span class="list-board-dot-column" aria-hidden="true">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </button>
            </div>
          </div>

          <div class="list-board-card-body" :class="{ 'has-image': !!getCoverImageUrl(wish) }">
            <div class="list-board-card-copy">
              <h3>{{ wish.title }}</h3>
              <p>{{ wish.note || '还没写下原因。' }}</p>
            </div>

            <img v-if="getCoverImageUrl(wish)" class="list-board-card-image" :src="getCoverImageUrl(wish)" :alt="`${wish.title} 首图`" />
          </div>

          <div class="list-board-card-data">
            <div class="list-board-data-block">
              <span>当前进度</span>
              <strong>{{ getProgressCopy(wish) }}</strong>
              <p>{{ getWishProgressHint(wish) || '还没补进度说明。' }}</p>
            </div>

            <div class="list-board-data-block is-coin">
              <span>愿望币</span>
              <strong>{{ getWishCoinSummary(wish).total }} 枚</strong>
              <p>{{ getWishCoinHint(wish) }}</p>
            </div>
          </div>

          <div class="list-board-card-meta">
            <span>{{ getRelativeDueLabel(wish.dueDate) }}</span>
            <span>{{ getMemberName(wish.ownerId) }} 写下于 {{ formatDateLabel(wish.createdAt) }}</span>
            <span>{{ wish.comments.length }} 条留言</span>
          </div>

          <div class="list-board-card-actions">
            <RouterLink class="list-board-action is-solid is-detail" :to="{ name: 'wish-detail', params: { id: wish.id } }">打开详情继续推进</RouterLink>

            <div class="list-board-card-action-secondary">
              <button
                class="list-board-action is-soft"
                type="button"
                :disabled="wish.status === 'done' || wishStore.currentMemberRemainingCoins <= 0 || isWishActionPending(wish.id)"
                @click="void handleCastWishCoin(wish)"
              >
                {{
                  isWishActionPending(wish.id, 'coin')
                    ? '正在投币...'
                    : wish.status === 'done'
                      ? '愿望已实现'
                      : wishStore.currentMemberRemainingCoins > 0
                        ? '投 1 币'
                        : '本周已投完'
                }}
              </button>
              <button
                class="list-board-action is-ghost"
                type="button"
                :disabled="isWishActionPending(wish.id)"
                @click="void handleToggleDone(wish)"
              >
                {{ isWishActionPending(wish.id, 'done') ? '正在更新...' : wish.status === 'done' ? '放回路上' : '已经实现' }}
              </button>
            </div>
          </div>

          <div v-if="openMoreWishId === wish.id" :id="`wish-more-${wish.id}`" class="list-board-more-panel" @click.stop>
            <RouterLink class="list-board-side-button" :to="{ name: 'compose', query: { edit: wish.id } }" @click="closeMoreMenu">修改愿望</RouterLink>

            <div class="list-board-delete-confirm">
              <template v-if="pendingDeleteWishId === wish.id">
                <p>删除后，这条愿望连同愿望币和相关记录都会一起离开这张清单。</p>
                <div class="list-board-delete-actions">
                  <button class="list-board-side-button" type="button" @click="cancelDeleteWish">先不删</button>
                  <button
                    class="list-board-side-button is-danger"
                    type="button"
                    :disabled="isWishActionPending(wish.id, 'delete')"
                    @click="void handleDeleteWish(wish)"
                  >
                    {{ isWishActionPending(wish.id, 'delete') ? '正在删除...' : '确认删除' }}
                  </button>
                </div>
              </template>

              <button v-else class="list-board-side-button is-danger" type="button" @click="requestDeleteWish(wish.id)">删除愿望</button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="list-board-empty">
        <h3>这次筛选后还没有结果</h3>
        <p>可以先清空筛选，或者写下一条新愿望。</p>
        <div class="list-board-inline-actions">
          <button class="list-board-button is-ghost" type="button" @click="filterStore.reset()">清空筛选</button>
          <RouterLink class="list-board-button is-solid" :to="{ name: 'compose' }">写下新愿望</RouterLink>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.list-board-page {
  --list-display-font: var(--font-display);
  --list-heading-font: var(--font-heading);
  --list-body-font: var(--font-body);
  --list-ink: #2f211b;
  --list-ink-soft: rgba(61, 46, 40, 0.74);
  --list-ink-faint: rgba(76, 59, 50, 0.72);
  --list-line: rgba(126, 96, 76, 0.12);
  --list-line-strong: rgba(126, 96, 76, 0.18);
  --list-paper: rgba(255, 255, 255, 0.68);
  --list-paper-strong: rgba(255, 255, 255, 0.78);
  font-family: var(--list-body-font);
}

.list-board-page,
.list-board-summary-grid,
.list-board-grid,
.list-board-item,
.list-board-card-copy,
.list-board-search-field,
.list-board-empty,
.list-board-delete-confirm,
.list-board-more-panel,
.list-board-card-data,
.list-board-filter-stack,
.list-board-filter-group,
.list-board-hero-side,
.list-board-hero-metrics,
.list-board-hero-focus-card,
.list-board-toolbar-actions,
.list-board-toolbar-side,
.list-board-toolbar-side-copy,
.list-board-data-block {
  display: grid;
  gap: 1rem;
}

.list-board-hero-actions,
.list-board-badge-row,
.list-board-card-top,
.list-board-card-meta,
.list-board-card-actions,
.list-board-inline-actions,
.list-board-delete-actions,
.list-board-card-overline,
.list-board-card-tools,
.list-board-head {
  display: flex;
  gap: 0.64rem;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
}

.list-board-hero-card,
.list-board-toolbar-card,
.list-board-card {
  display: grid;
  position: relative;
  overflow: hidden;
  gap: 1.08rem;
  padding: 1.18rem;
}

.list-board-hero-card {
  grid-template-columns: 1fr;
  gap: 0.94rem;
  background:
    linear-gradient(180deg, rgba(255, 251, 247, 0.95), rgba(247, 237, 229, 0.9)),
    radial-gradient(circle at 10% 10%, rgba(255, 216, 213, 0.42), transparent 26%),
    radial-gradient(circle at 90% 12%, rgba(216, 229, 249, 0.36), transparent 24%),
    radial-gradient(circle at 50% 100%, rgba(231, 238, 224, 0.3), transparent 30%);
}

.list-board-toolbar-card {
  background:
    linear-gradient(180deg, rgba(255, 252, 246, 0.92), rgba(250, 243, 236, 0.82)),
    radial-gradient(circle at 4% 10%, rgba(241, 214, 202, 0.34), transparent 26%),
    radial-gradient(circle at 100% 0%, rgba(220, 233, 230, 0.26), transparent 30%);
}

.list-board-hero-copy {
  display: grid;
  gap: 0.78rem;
  align-content: start;
  max-width: 42rem;
}

.list-board-kicker {
  margin: 0;
  display: inline-flex;
  align-items: baseline;
  gap: 0.46rem;
  font-family: var(--list-body-font);
  color: rgba(70, 53, 45, 0.66);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.08em;
  text-transform: none;
}

.list-board-kicker span {
  color: rgba(70, 53, 45, 0.42);
  font-size: var(--type-kicker-sub-size);
  letter-spacing: var(--type-kicker-sub-spacing);
  text-transform: uppercase;
}

.list-board-summary-card > span,
.list-board-hero-focus-card > span,
.list-board-search-field > span,
.list-board-data-block > span {
  margin: 0;
  font-family: var(--list-body-font);
  color: rgba(70, 53, 45, 0.68);
  font-size: var(--type-supporting-size);
  font-weight: 600;
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.list-board-card-meta span,
.list-board-card-caption,
.list-board-card-mood,
.list-board-filter-label {
  font-family: var(--list-body-font);
  color: rgba(76, 59, 50, 0.78);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.list-board-button,
.list-board-side-button,
.list-board-filter-pill,
.list-board-action,
.list-board-mini-link,
.list-board-more-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: 999px;
  font-family: var(--list-body-font);
  font-size: var(--type-body-size);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: var(--type-button-tracking);
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.list-board-button.is-ghost,
.list-board-side-button,
.list-board-filter-pill,
.list-board-action.is-ghost,
.list-board-action.is-soft,
.list-board-more-trigger {
  padding: 0.55rem 0.9rem;
  border: 1px solid rgba(126, 96, 76, 0.14);
  background: rgba(255, 255, 255, 0.74);
  color: #362720;
}

.list-board-button,
.list-board-action.is-solid {
  padding: 0.68rem 1.12rem;
}

.list-board-button.is-solid,
.list-board-action.is-solid {
  border: 0;
  background: linear-gradient(135deg, #c97c61, #9f5d50);
  color: #fffaf5;
  box-shadow: 0 16px 30px rgba(163, 91, 73, 0.24);
}

.list-board-filter-pill.is-active,
.list-board-action.is-soft {
  background: rgba(210, 121, 87, 0.12);
  border-color: rgba(210, 121, 87, 0.22);
}

.list-board-button:hover,
.list-board-side-button:hover,
.list-board-filter-pill:hover,
.list-board-action:hover,
.list-board-mini-link:hover,
.list-board-more-trigger:hover {
  transform: translateY(-1px);
}

.list-board-button:active,
.list-board-side-button:active,
.list-board-filter-pill:active,
.list-board-action:active,
.list-board-more-trigger:active {
  transform: translateY(0) scale(0.985);
}

.list-board-button:focus-visible,
.list-board-side-button:focus-visible,
.list-board-filter-pill:focus-visible,
.list-board-action:focus-visible,
.list-board-mini-link:focus-visible,
.list-board-more-trigger:focus-visible {
  outline: none;
  border-color: rgba(201, 124, 97, 0.24);
  box-shadow: 0 0 0 4px rgba(201, 124, 97, 0.12);
}

.list-board-action:disabled {
  transform: none;
  background: rgba(244, 237, 230, 0.9);
  color: rgba(106, 84, 72, 0.58);
  border-color: rgba(126, 96, 76, 0.08);
  box-shadow: none;
}

.list-board-mini-link {
  min-height: auto;
  padding: 0.2rem 0;
  border-radius: 0;
  color: rgba(86, 63, 52, 0.82);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
  justify-content: flex-start;
  text-decoration: none;
}

.list-board-hero-card h1,
.list-board-toolbar-copy h2,
.list-board-head h2,
.list-board-item h3,
.list-board-empty h3 {
  margin: 0;
}

.list-board-hero-card h1 {
  font-family: var(--list-display-font);
  font-weight: 400;
  letter-spacing: -0.032em;
}

.list-board-toolbar-copy h2,
.list-board-head h2,
.list-board-item h3,
.list-board-empty h3 {
  font-family: var(--list-heading-font);
  font-weight: 600;
  letter-spacing: -0.024em;
}

.list-board-hero-card h1 {
  display: grid;
  gap: 0.52rem;
  max-width: 11ch;
  font-size: var(--type-page-title-size);
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
  text-wrap: balance;
}

.list-board-hero-name,
.list-board-hero-promise {
  display: block;
}

.list-board-hero-name {
  max-width: 7ch;
  color: rgba(47, 33, 27, 0.86);
  font-family: var(--list-heading-font);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.list-board-hero-promise {
  max-width: 10ch;
}

.list-board-toolbar-copy h2,
.list-board-head h2 {
  font-size: var(--type-section-title-size);
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.list-board-item h3,
.list-board-empty h3 {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.list-board-summary-card p,
.list-board-toolbar-copy p,
.list-board-item p,
.list-board-empty p,
.list-board-data-block p,
.list-board-toolbar-side p {
  margin: 0;
  font-family: var(--list-body-font);
  color: var(--list-ink-soft);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.list-board-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.list-board-hero-focus-card strong,
.list-board-toolbar-side-copy strong {
  color: var(--list-ink);
  font-family: var(--list-heading-font);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.list-board-summary-grid > .list-board-summary-card:first-child {
  grid-column: 1 / -1;
}

.list-board-summary-card,
.list-board-item,
.list-board-empty,
.list-board-data-block {
  border: 1px solid var(--list-line);
  border-radius: 24px;
  background: var(--list-paper);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
}

.list-board-summary-card {
  display: grid;
  gap: 0.34rem;
  padding: 0.98rem;
}

.list-board-summary-card-compact {
  padding: 0.88rem 0.94rem;
}

.list-board-summary-card-compact,
.list-board-toolbar-side,
.list-board-filter-group {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 250, 244, 0.62));
}

.list-board-summary-card strong,
.list-board-data-block strong {
  color: var(--list-ink);
  font-family: var(--list-heading-font);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.list-board-card-image {
  width: 100%;
  max-width: 176px;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 14px 24px rgba(92, 63, 47, 0.08);
}

.list-board-card-copy p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.list-board-data-block p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.list-board-card-meta {
  gap: 0.48rem 0.56rem;
  color: var(--list-ink-faint);
}

.list-board-card-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.36rem 0.66rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.1);
  background: rgba(255, 255, 255, 0.7);
}

.list-board-head {
  align-items: end;
}

.list-board-search-field {
  gap: 0.46rem;
  max-width: 34rem;
  padding: 0.92rem 0.96rem;
  border-radius: 22px;
  border: 1px solid var(--list-line);
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.56);
}

.list-board-search-field input {
  min-height: 52px;
  padding-block: 0.92rem;
  font-family: var(--list-body-font);
  font-size: var(--type-body-size);
  background: rgba(255, 255, 255, 0.9);
}

.list-board-toolbar-card {
  grid-template-columns: minmax(0, 1fr) minmax(300px, 0.82fr);
  gap: 0.94rem 1.08rem;
  background: rgba(255, 252, 246, 0.84);
}

.list-board-toolbar-copy {
  display: grid;
  gap: 0.36rem;
  max-width: 34rem;
}

.list-board-toolbar-copy p {
  max-width: 33ch;
}

.list-board-toolbar-actions {
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  align-items: start;
  gap: 1rem 1.08rem;
  padding-top: 0.42rem;
  border-top: 1px solid rgba(126, 96, 76, 0.12);
}

.list-board-filter-stack {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.9rem;
}

.list-board-filter-group {
  gap: 0.62rem;
  padding: 0.92rem 0.96rem;
  border-radius: 22px;
  border: 1px solid var(--list-line);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
}

.list-board-filter-label {
  color: rgba(93, 72, 61, 0.78);
  font-weight: 600;
}

.list-board-filter-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.58rem;
}

.list-board-filter-pill {
  width: 100%;
  min-height: 48px;
  padding: 0.68rem 0.86rem;
  border-radius: 20px;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.48);
}

.list-board-filter-pill.is-active {
  background: linear-gradient(135deg, rgba(210, 121, 87, 0.2), rgba(255, 247, 241, 0.96));
  border-color: rgba(185, 108, 79, 0.28);
  color: #2e211b;
  box-shadow: 0 12px 22px rgba(185, 108, 79, 0.12);
}

.list-board-toolbar-side {
  gap: 0.74rem;
  justify-items: start;
  padding: 0.94rem 0.98rem;
  border-radius: 22px;
  border: 1px solid var(--list-line);
  background: rgba(255, 255, 255, 0.54);
}

.list-board-toolbar-side-copy {
  gap: 0.28rem;
  max-width: 28ch;
}

.list-board-toolbar-side p {
  max-width: 26ch;
}

.list-board-card {
  background: rgba(255, 252, 246, 0.84);
}

.list-board-badge {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0.48rem 0.82rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.76);
  color: rgba(61, 46, 40, 0.74);
  font-family: var(--list-body-font);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.list-board-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.list-board-item {
  position: relative;
  gap: 0.88rem;
  padding: 1rem 1rem 1.04rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 249, 243, 0.7)),
    radial-gradient(circle at top right, rgba(241, 214, 202, 0.18), transparent 28%);
}

.list-board-card-top {
  gap: 0.48rem 0.68rem;
}

.list-board-card-tools {
  align-items: center;
}

.list-board-card-caption {
  max-width: 32ch;
}

.list-board-card-scope {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.36rem 0.68rem;
  border-radius: 999px;
  font-family: var(--list-body-font);
  color: rgba(61, 46, 40, 0.86);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.list-board-card-scope.is-shared {
  border: 1px solid rgba(110, 151, 120, 0.18);
  background: rgba(218, 234, 223, 0.8);
}

.list-board-card-scope.is-private {
  border: 1px solid rgba(201, 124, 97, 0.16);
  background: rgba(243, 222, 210, 0.72);
}

.list-board-card-mood {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0.38rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.7);
}

.list-board-more-trigger {
  width: 42px;
  min-width: 42px;
  padding: 0;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
}

.list-board-dot-column {
  display: grid;
  gap: 3px;
}

.list-board-dot-column span {
  display: block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(84, 61, 48, 0.68);
}

.list-board-card-body {
  display: grid;
  gap: 0.82rem;
}

.list-board-card-body.has-image {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.list-board-card-copy {
  gap: 0.38rem;
  max-width: 34ch;
}

.list-board-item h3 {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
  text-wrap: balance;
}

.list-board-card-data {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.76rem;
  margin-top: 0.04rem;
}

.list-board-data-block {
  gap: 0.42rem;
  padding: 0.88rem 0.92rem 0.94rem;
}

.list-board-data-block.is-coin {
  background: rgba(241, 232, 200, 0.26);
}

.list-board-card-action-primary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.58rem;
  width: 100%;
}

.list-board-card-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.66rem;
  align-items: start;
  padding-top: 0.82rem;
  border-top: 1px solid rgba(126, 96, 76, 0.12);
}

.list-board-card-action-secondary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.58rem;
  width: 100%;
}

.list-board-action {
  width: 100%;
}

.list-board-card-actions .list-board-action {
  min-height: 44px;
  border-radius: 20px;
}

.list-board-card-actions .list-board-action.is-soft {
  background: rgba(255, 250, 244, 0.92);
}

.list-board-card-actions .list-board-action.is-solid {
  box-shadow: 0 12px 22px rgba(163, 91, 73, 0.18);
}

.list-board-card-actions .list-board-action.is-detail {
  min-height: 48px;
}

.list-board-card-actions .list-board-action.is-ghost {
  background: rgba(255, 255, 255, 0.78);
}

.list-board-more-panel {
  grid-template-columns: 1fr;
  gap: 0.56rem;
  padding-top: 0.76rem;
  border-top: 1px dashed rgba(126, 96, 76, 0.16);
}

.list-board-delete-confirm {
  gap: 0.56rem;
  padding: 0.76rem 0.8rem;
  border-radius: 20px;
  border: 1px solid rgba(142, 91, 73, 0.14);
  background: rgba(142, 91, 73, 0.06);
}

.list-board-delete-confirm p,
.list-board-status-banner p {
  margin: 0;
}

.list-board-status-banner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.72rem;
  align-items: start;
  padding: 0.92rem 0.96rem;
  border-radius: 22px;
  border: 1px solid var(--list-line);
  background: rgba(255, 255, 255, 0.7);
}

.list-board-status-banner.is-success {
  border-color: rgba(109, 151, 120, 0.18);
  background: rgba(233, 242, 236, 0.9);
}

.list-board-status-banner.is-danger {
  border-color: rgba(142, 91, 73, 0.18);
  background: rgba(249, 239, 235, 0.94);
}

.list-board-status-banner.is-info {
  border-color: rgba(126, 96, 76, 0.14);
  background: rgba(255, 251, 245, 0.88);
}

.list-board-side-button.is-danger {
  color: var(--danger);
  border-color: rgba(142, 91, 73, 0.18);
}

.list-board-side-button.is-danger:hover {
  background: rgba(142, 91, 73, 0.08);
}

.list-board-empty {
  gap: 0.84rem;
  padding: 1.06rem;
  border-style: dashed;
  background: rgba(255, 255, 255, 0.52);
}

@media (max-width: 1080px) {
  .list-board-hero-card,
  .list-board-toolbar-card,
  .list-board-toolbar-actions,
  .list-board-grid,
  .list-board-card-data {
    grid-template-columns: 1fr;
  }

  .list-board-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-board-filter-stack {
    grid-template-columns: 1fr;
  }

  .list-board-summary-grid > .list-board-summary-card:first-child {
    grid-column: 1 / -1;
  }

  .list-board-toolbar-side {
    justify-items: start;
  }
}

@media (max-width: 760px) {
  .list-board-toolbar-card,
  .list-board-toolbar-actions {
    grid-template-columns: 1fr;
  }

  .list-board-head,
  .list-board-inline-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-board-hero-card h1 {
    max-width: 10ch;
    font-size: clamp(2.18rem, 11vw, 3rem);
  }

  .list-board-card-body.has-image,
  .list-board-summary-grid,
  .list-board-more-panel {
    grid-template-columns: 1fr;
  }

  .list-board-filter-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.46rem;
  }

  .list-board-summary-grid > .list-board-summary-card:first-child {
    grid-column: auto;
  }

  .list-board-filter-group,
  .list-board-toolbar-side,
  .list-board-search-field {
    padding: 0.84rem 0.88rem;
  }

  .list-board-filter-pill {
    min-height: 44px;
    padding: 0.58rem 0.72rem;
    border-radius: 18px;
  }

  .list-board-card-image {
    max-width: none;
  }

  .list-board-card,
  .list-board-item {
    padding: 0.96rem;
  }

  .list-board-item {
    gap: 0.72rem;
  }

  .list-board-card-top {
    gap: 0.42rem 0.56rem;
  }

  .list-board-card-body {
    gap: 0.72rem;
  }

  .list-board-card-meta {
    gap: 0.4rem 0.48rem;
  }

  .list-board-card-actions {
    gap: 0.56rem;
  }

  .list-board-card-action-primary,
  .list-board-card-action-secondary,
  .list-board-delete-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-board-card-actions .list-board-action {
    min-height: 40px;
  }

  .list-board-card-data {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 460px) {
  .list-board-card-action-primary,
  .list-board-card-action-secondary,
  .list-board-delete-actions,
  .list-board-inline-actions {
    grid-template-columns: 1fr;
  }

  .list-board-filter-row {
    gap: 0.4rem;
  }

  .list-board-filter-pill {
    padding-inline: 0.6rem;
    font-size: 0.92rem;
  }

  .list-board-inline-actions {
    display: grid;
    width: 100%;
  }

  .list-board-inline-actions .list-board-side-button {
    width: 100%;
  }
}
</style>