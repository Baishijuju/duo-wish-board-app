<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import CopyFold from '../components/CopyFold.vue'
import ActionCard from '../components/page/ActionCard.vue'
import { WISH_STATUS_FILTER_LABELS } from '../shared/statusSemantics'
import type { WishRecord } from '../stores/wishes'
import { useListWishBoardState } from '../composables/useListWishBoardState'

const {
  authStore,
  canCurrentMemberProgressWish,
  filterStore,
  filteredWishes,
  getWishListPrimaryValue,
  getWishListSecondaryValue,
  getWishListSideStatus,
  listWorkbenchStats,
} = useListWishBoardState()

const sortLabels = {
  updated: '最近更新',
  progress: '进度',
  starCoins: '星星币',
  age: '按创建时间',
} as const

const viewerName = computed(() => authStore.currentMember?.displayName ?? '我们')
const selectedSortDirectionLabel = computed(() => filterStore.sortDirection === 'desc' ? '倒序' : '正序')
const isFilterPanelOpen = ref(false)
const filterPanelId = 'list-board-filter-panel'
const visibilityTabRefs = ref<HTMLElement[]>([])
const statusTabRefs = ref<HTMLElement[]>([])
const visibilityPillRef = ref<HTMLElement | null>(null)
const statusPillRef = ref<HTMLElement | null>(null)
const visibilityValues = ['all', 'mine', 'others'] as const
const statusValues = ['active', 'done', 'all'] as const
type SlidingTabGroup = 'visibility' | 'status'
const boardHeading = computed(() => {
  const query = filterStore.search.trim()

  if (query) {
    return `和「${query}」有关的小愿望，先在这里聚一聚。`
  }

  if (filterStore.status === 'done') {
    if (filterStore.visibility === 'mine') {
      return '你已经做到的这些，真的可以小小得意一下。'
    }

    if (filterStore.visibility === 'others') {
      return '对方做到的那些，也值得被好好看见。'
    }

    return '已经实现的小愿望，都是日子给我们的回信。'
  }

  if (filterStore.status === 'all') {
    if (filterStore.visibility === 'mine') {
      return '这些小愿望，都是你认真收好的念头。'
    }

    if (filterStore.visibility === 'others') {
      return '对方心里放着的好日子，也在慢慢长大。'
    }

    return '这些小小的梦，正在陪我们把日子过好。'
  }

  if (filterStore.visibility === 'mine') {
    return '今天先照顾一个小愿望，让日子偷偷亮一点。'
  }

  if (filterStore.visibility === 'others') {
    return '看看对方的小愿望，也给这段日子添点光。'
  }

  return '慢慢来，我们还在把日子往喜欢的方向推。'
})
const heroSummary = computed(() => {
  const stats = listWorkbenchStats.value

  if (filterStore.status === 'done') {
    if (filterStore.visibility === 'mine') {
      return `已完成 ${filteredWishes.value.length} 条`
    }

    if (filterStore.visibility === 'others') {
      return `对方已完成 ${filteredWishes.value.length} 条`
    }

    return `已完成 ${filteredWishes.value.length} 条`
  }

  if (filterStore.status === 'all') {
    if (filterStore.visibility === 'mine') {
      return `我这边共 ${filteredWishes.value.length} 条 · 可得 ${stats.currentMemberRemainingStarCoins} 星星币`
    }

    if (filterStore.visibility === 'others') {
      return `对方共 ${filteredWishes.value.length} 条 · 可得 ${stats.otherMemberRemainingStarCoins} 星星币`
    }

    return `共 ${filteredWishes.value.length} 条 · 可得 ${stats.remainingStarCoins} 星星币`
  }

  if (filterStore.visibility === 'mine') {
    return `我在推进 ${stats.currentMemberActiveCount} 条 · 可得 ${stats.currentMemberRemainingStarCoins} 星星币`
  }

  if (filterStore.visibility === 'others') {
    return `对方在推进 ${stats.otherMemberActiveCount} 条 · 可得 ${stats.otherMemberRemainingStarCoins} 星星币`
  }

  return `正在推进 ${stats.activeCount} 条 · 可得 ${stats.remainingStarCoins} 星星币`
})
function getWishOwnerClass(wish: WishRecord) {
  return canCurrentMemberProgressWish(wish) ? 'is-personal-owner' : 'is-assist-owner'
}

function getSortButtonLabel(sortMode: keyof typeof sortLabels) {
  if (filterStore.sortMode !== sortMode) {
    return sortLabels[sortMode]
  }

  return `${sortLabels[sortMode]}${selectedSortDirectionLabel.value}`
}

function setSlidingTabRef(group: SlidingTabGroup, index: number, element: HTMLElement | null) {
  const refs = group === 'visibility' ? visibilityTabRefs.value : statusTabRefs.value

  if (element) {
    refs[index] = element
  } else {
    delete refs[index]
  }
}

function syncSlidingPill(group: SlidingTabGroup, animate = true) {
  const refs = group === 'visibility' ? visibilityTabRefs.value : statusTabRefs.value
  const pill = group === 'visibility' ? visibilityPillRef.value : statusPillRef.value
  const activeIndex = group === 'visibility'
    ? visibilityValues.indexOf(filterStore.visibility)
    : statusValues.indexOf(filterStore.status)
  const activeTab = refs[activeIndex]

  if (!pill || !activeTab) {
    return
  }

  if (!animate) {
    pill.style.transition = 'none'
  }

  pill.style.transform = `translateX(${activeTab.offsetLeft}px)`
  pill.style.width = `${activeTab.offsetWidth}px`

  if (!animate) {
    void pill.offsetHeight
    pill.style.transition = ''
  }
}

async function syncAllSlidingPills(animate = true) {
  if (!isFilterPanelOpen.value) {
    return
  }

  await nextTick()
  syncSlidingPill('visibility', animate)
  syncSlidingPill('status', animate)
}

function handleSlidingTabsResize() {
  void syncAllSlidingPills(false)
}

watch(() => filterStore.visibility, () => {
  void syncAllSlidingPills(true)
})

watch(() => filterStore.status, () => {
  void syncAllSlidingPills(true)
})

watch(isFilterPanelOpen, (isOpen) => {
  if (isOpen) {
    void syncAllSlidingPills(false)
  }
})

onMounted(() => {
  window.addEventListener('resize', handleSlidingTabsResize)
  void syncAllSlidingPills(false)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleSlidingTabsResize)
})

</script>

<template>
  <section class="list-board-page">
    <ActionCard class="list-board-hero-card list-board-workbench-hero" :title="''">
      <div class="list-board-hero-copy list-board-workbench-copy">
        <h1>{{ viewerName }}，选 1 件推进</h1>
        <CopyFold
          as="p"
          layer="secondary"
          page="list"
          target="hero-summary"
          :text="heroSummary"
        />
      </div>
    </ActionCard>

    <article class="page-card list-board-toolbar-card">
      <div class="list-board-search-row">
        <label class="list-board-search-field">
          <input v-model="filterStore.search" type="search" placeholder="搜索愿望" />
        </label>

        <button
          class="list-board-filter-toggle"
          type="button"
          :aria-controls="filterPanelId"
          :aria-expanded="isFilterPanelOpen"
          :aria-label="isFilterPanelOpen ? '收起筛选和排序' : '展开筛选和排序'"
          :class="{ 'is-active': isFilterPanelOpen }"
          @click="isFilterPanelOpen = !isFilterPanelOpen"
        >
          <span class="list-board-filter-toggle-icon-swap" :data-state="isFilterPanelOpen ? 'close' : 'filter'" aria-hidden="true">
            <span class="list-board-filter-toggle-icon" data-icon="filter">
              <i></i>
              <i></i>
              <i></i>
            </span>
            <span class="list-board-filter-toggle-close" data-icon="close">
              <i></i>
              <i></i>
            </span>
          </span>
        </button>
      </div>

      <div v-if="isFilterPanelOpen" :id="filterPanelId" class="list-board-toolbar-actions">
        <div class="list-board-filter-stack">
          <div class="list-board-filter-group">
            <span class="list-board-filter-label">归属</span>
            <div class="list-board-filter-row is-sliding-tabs" role="tablist" aria-label="愿望归属筛选">
              <span ref="visibilityPillRef" class="list-board-filter-slider" aria-hidden="true"></span>
              <button
                class="list-board-filter-pill"
                :ref="(element) => setSlidingTabRef('visibility', 0, element as HTMLElement | null)"
                role="tab"
                type="button"
                :aria-selected="filterStore.visibility === 'all'"
                :class="{ 'is-active': filterStore.visibility === 'all' }"
                @click="filterStore.visibility = 'all'"
              >
                全部愿望
              </button>
              <button
                class="list-board-filter-pill"
                :ref="(element) => setSlidingTabRef('visibility', 1, element as HTMLElement | null)"
                role="tab"
                type="button"
                :aria-selected="filterStore.visibility === 'mine'"
                :class="{ 'is-active': filterStore.visibility === 'mine' }"
                @click="filterStore.visibility = 'mine'"
              >
                我的愿望
              </button>
              <button
                class="list-board-filter-pill"
                :ref="(element) => setSlidingTabRef('visibility', 2, element as HTMLElement | null)"
                role="tab"
                type="button"
                :aria-selected="filterStore.visibility === 'others'"
                :class="{ 'is-active': filterStore.visibility === 'others' }"
                @click="filterStore.visibility = 'others'"
              >
                对方愿望
              </button>
            </div>
          </div>

          <div class="list-board-filter-group">
            <span class="list-board-filter-label">状态</span>
            <div class="list-board-filter-row is-sliding-tabs" role="tablist" aria-label="愿望状态筛选">
              <span ref="statusPillRef" class="list-board-filter-slider" aria-hidden="true"></span>
              <button
                class="list-board-filter-pill"
                :ref="(element) => setSlidingTabRef('status', 0, element as HTMLElement | null)"
                role="tab"
                type="button"
                :aria-selected="filterStore.status === 'active'"
                :class="{ 'is-active': filterStore.status === 'active' }"
                @click="filterStore.status = 'active'"
              >
                {{ WISH_STATUS_FILTER_LABELS.active }}
              </button>
              <button
                class="list-board-filter-pill"
                :ref="(element) => setSlidingTabRef('status', 1, element as HTMLElement | null)"
                role="tab"
                type="button"
                :aria-selected="filterStore.status === 'done'"
                :class="{ 'is-active': filterStore.status === 'done' }"
                @click="filterStore.status = 'done'"
              >
                {{ WISH_STATUS_FILTER_LABELS.done }}
              </button>
              <button
                class="list-board-filter-pill"
                :ref="(element) => setSlidingTabRef('status', 2, element as HTMLElement | null)"
                role="tab"
                type="button"
                :aria-selected="filterStore.status === 'all'"
                :class="{ 'is-active': filterStore.status === 'all' }"
                @click="filterStore.status = 'all'"
              >
                {{ WISH_STATUS_FILTER_LABELS.all }}
              </button>
            </div>
          </div>

          <div class="list-board-filter-group">
            <span class="list-board-filter-label">排序</span>
            <div class="list-board-filter-row is-sort-row list-board-filter-row-wide">
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.sortMode === 'progress' }"
                @click="filterStore.setSortMode('progress')"
              >
                <span class="list-board-sort-pill-icon is-progress" aria-hidden="true"></span>
                <span>{{ getSortButtonLabel('progress') }}</span>
              </button>
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.sortMode === 'starCoins' }"
                @click="filterStore.setSortMode('starCoins')"
              >
                <span class="list-board-sort-pill-icon is-star-coins" aria-hidden="true"></span>
                <span>{{ getSortButtonLabel('starCoins') }}</span>
              </button>
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.sortMode === 'age' }"
                @click="filterStore.setSortMode('age')"
              >
                <span class="list-board-sort-pill-icon is-age" aria-hidden="true"></span>
                <span>{{ getSortButtonLabel('age') }}</span>
              </button>
              <button
                class="list-board-filter-pill"
                type="button"
                :class="{ 'is-active': filterStore.sortMode === 'updated' }"
                @click="filterStore.setSortMode('updated')"
              >
                <span class="list-board-sort-pill-icon is-updated" aria-hidden="true"></span>
                <span>{{ getSortButtonLabel('updated') }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </article>

    <article class="page-card list-board-card">
      <div class="list-board-head">
        <div>
          <h2>{{ boardHeading }}</h2>
        </div>
      </div>

      <div v-if="filteredWishes.length" class="list-board-grid">
        <article v-for="wish in filteredWishes" :key="wish.id" class="list-board-item" :class="getWishOwnerClass(wish)">
          <span class="list-board-owner-dot" aria-hidden="true"></span>

          <div class="list-board-main">
            <div class="list-board-card-body">
              <div class="list-board-card-copy">
                <h3>{{ wish.title }}</h3>
              </div>
            </div>

            <div class="list-board-card-data">
              <RouterLink class="list-board-data-block list-board-progress-link list-board-sort-context" :to="{ name: 'wish-detail', params: { id: wish.id }, hash: '#progress' }" aria-label="打开详情页进度区域">
                <strong>{{ getWishListPrimaryValue(wish) }}</strong>
                <em>{{ getWishListSecondaryValue(wish) }}</em>
              </RouterLink>
            </div>
          </div>

          <div class="list-board-star-ring-shell">
            <div
              class="list-board-side-stat is-side-status"
              :class="`is-${getWishListSideStatus(wish).tone}`"
              :aria-label="getWishListSideStatus(wish).ariaLabel"
            >
              <span class="list-board-side-glyph" aria-hidden="true"></span>
              <strong class="list-board-side-label">{{ getWishListSideStatus(wish).label }}</strong>
            </div>
          </div>

        </article>
      </div>

      <div v-else class="list-board-empty">
        <h3>当前筛选下暂无愿望</h3>
        <CopyFold
          as="p"
          layer="supporting"
          page="list"
          target="list-empty-note"
          text="清空筛选，或写下一条新的愿望。"
        />
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
  --list-ink: var(--text-main);
  --list-ink-soft: var(--text-muted);
  --list-ink-faint: var(--text-soft);
  --list-line: var(--warm-border);
  --list-line-strong: var(--warm-border-strong);
  --list-paper: var(--surface-card);
  --list-paper-strong: var(--surface-raised);
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
.list-board-data-block {
  display: grid;
  gap: 1rem;
}

.list-board-hero-actions,
.list-board-badge-row,
.list-board-card-top,
.list-board-card-meta,
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

.list-board-card-overline,
.list-board-card-tools {
  align-items: center;
}

.list-board-hero-card,
.list-board-toolbar-card,
.list-board-card {
  display: grid;
  position: relative;
  overflow: hidden;
  gap: 1.08rem;
  padding: 0.96rem;
}

.list-board-hero-card {
  grid-template-columns: 1fr;
  gap: 0.94rem;
  background:
    linear-gradient(180deg, var(--surface-card), var(--surface-soft)),
    radial-gradient(circle at 10% 10%, var(--danger-panel), transparent 26%),
    radial-gradient(circle at 90% 12%, var(--cool-glow), transparent 24%),
    radial-gradient(circle at 50% 100%, var(--sage-glow), transparent 30%);
}

.list-board-workbench-hero {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.72rem;
  padding: 0.74rem 0.86rem;
  background: linear-gradient(135deg, rgba(255, 252, 246, 0.94), rgba(249, 241, 231, 0.78));
}

.list-board-workbench-copy {
  gap: 0.2rem;
}

.list-board-workbench-copy h1 {
  max-width: none;
  font-family: var(--list-heading-font);
  font-size: var(--type-l4-size);
  font-weight: 700;
  line-height: var(--type-l4-line);
  letter-spacing: 0;
}

.list-board-workbench-copy p:last-child {
  margin: 0;
  color: var(--list-ink-soft);
  font-family: var(--list-body-font);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.list-board-workbench-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.48rem;
}

.list-board-workbench-stat {
  display: grid;
  gap: 0.1rem;
  min-height: 3.3rem;
  align-content: center;
  padding: 0.48rem 0.56rem;
  border: 1px solid rgba(126, 96, 76, 0.1);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.54);
}

.list-board-workbench-stat span {
  color: var(--text-soft);
  font-family: var(--list-body-font);
  font-size: var(--type-eyebrow-size);
  font-weight: 700;
  line-height: 1.15;
}

.list-board-workbench-stat strong {
  color: var(--list-ink);
  font-family: var(--list-heading-font);
  font-size: var(--type-meta-size);
  font-weight: 800;
  line-height: 1.15;
}

.list-board-workbench-actions {
  justify-content: flex-end;
  flex-wrap: nowrap;
}

.list-board-workbench-actions .list-board-button {
  min-height: 2.28rem;
  padding: 0.46rem 0.72rem;
  font-size: var(--type-meta-size);
}

.list-board-toolbar-card {
  grid-template-columns: minmax(0, 1fr);
    gap: 0.46rem;
    padding: 0.48rem;
    border-radius: 14px;
    box-shadow: none;
  background:
    linear-gradient(180deg, rgba(255, 252, 246, 0.82), rgba(249, 241, 231, 0.72)),
    radial-gradient(circle at 100% 0%, rgba(226, 239, 237, 0.58), transparent 28%);
}

.list-board-hero-copy {
  display: grid;
  gap: 0.78rem;
  align-content: start;
  max-width: 42rem;
}

.list-board-summary-card > span,
.list-board-hero-focus-card > span,
.list-board-search-field > span,
.list-board-data-block > span {
  margin: 0;
  font-family: var(--list-body-font);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  font-weight: 600;
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.list-board-card-meta span,
.list-board-card-mood,
.list-board-filter-label {
  font-family: var(--list-body-font);
  color: var(--text-muted);
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
  border: 1px solid var(--list-line);
  background: var(--warm-panel-strong);
  color: var(--list-ink);
}

.list-board-button,
.list-board-action.is-solid {
  padding: 0.68rem 1.12rem;
}

.list-board-button.is-solid,
.list-board-action.is-solid {
  border: 0;
  background: linear-gradient(135deg, var(--accent-sun), var(--accent-dark));
  color: var(--accent-contrast);
  box-shadow: 0 16px 30px var(--accent-shadow);
}

.list-board-filter-pill.is-active,
.list-board-action.is-soft {
  background: var(--accent-ring);
  border-color: var(--accent-border);
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
  border-color: var(--accent-border);
  box-shadow: 0 0 0 4px var(--accent-ring);
}

.list-board-action:disabled {
  transform: none;
  background: var(--surface-soft);
  color: var(--text-faint);
  border-color: var(--line-soft);
  box-shadow: none;
}

.list-board-mini-link {
  min-height: auto;
  padding: 0.2rem 0;
  border-radius: 0;
  color: var(--text-muted);
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
  max-width: 22ch;
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
  max-width: 14ch;
  color: rgba(47, 33, 27, 0.86);
  font-family: var(--list-heading-font);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.list-board-hero-promise {
  max-width: 18ch;
}

.list-board-toolbar-copy h2,
.list-board-head h2 {
  font-family: var(--list-body-font);
  font-size: var(--type-section-title-size);
  font-weight: 700;
  line-height: var(--type-section-title-line);
  letter-spacing: 0;
}

.list-board-head h2 {
  max-width: 25ch;
  color: rgba(36, 27, 22, 0.86);
  font-family: var(--list-heading-font);
  font-size: 1.45rem;
  font-weight: 500;
  line-height: 1.42;
}

.list-board-item h3,
.list-board-empty h3 {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.list-board-summary-card p,
.list-board-toolbar-copy p,
.list-board-empty p,
.list-board-data-block p {
  margin: 0;
  font-family: var(--list-body-font);
  color: var(--list-ink-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.list-board-item p {
  margin: 0;
  font-family: var(--list-body-font);
  color: rgba(76, 59, 50, 0.7);
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
  letter-spacing: var(--type-l6-spacing);
}

.list-board-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.list-board-hero-focus-card strong {
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
  border-radius: var(--radius-xl);
  background: var(--list-paper);
  box-shadow: var(--shadow-card);
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
.list-board-filter-group {
  background: var(--surface-soft);
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
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 1px solid var(--list-line);
  box-shadow: none;
}

.list-board-card-copy p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
}

.list-board-data-block p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.list-board-progress-summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.56rem;
}

.list-board-progress-summary strong {
  font-size: var(--type-l4-size);
  line-height: var(--type-l4-line);
}

.list-board-progress-summary em {
  color: var(--text-soft);
  font-family: var(--list-body-font);
  font-size: var(--type-meta-size);
  font-style: normal;
  font-weight: 700;
  line-height: var(--type-meta-line);
}

.list-board-progress-track {
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--card-border-soft) 72%, transparent);
}

.list-board-progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--owner-progress-start), var(--owner-progress-end));
}

.list-board-card-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.2rem, 1fr));
  gap: 0.38rem;
  color: var(--list-ink-faint);
}

.list-board-card-meta span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0.3rem 0.52rem;
  border-radius: 999px;
  border: 1px solid var(--card-border-soft);
  background: var(--panel-bg);
  justify-content: center;
  text-align: center;
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.list-board-head {
  align-items: end;
}

.list-board-search-row {
  display: grid;
  grid-template-columns: minmax(12rem, 22rem) 38px;
  gap: 0.36rem;
  align-items: center;
  justify-content: start;
}

.list-board-search-field {
  width: 100%;
  max-width: 22rem;
  min-height: 38px;
  padding: 0;
  border-radius: 10px;
  border: 1px solid var(--list-line);
  background: var(--surface-raised);
  box-shadow: none;
}

.list-board-search-field input {
  width: 100%;
  min-height: 36px;
  padding: 0.42rem 0.66rem;
  border: 0;
  border-radius: inherit;
  font-family: var(--list-body-font);
  font-size: var(--type-body-size);
  background: transparent;
  color: var(--list-ink);
  outline: none;
}

.list-board-search-field:focus-within {
  border-color: var(--accent-border);
  box-shadow: 0 0 0 4px var(--accent-ring);
}

.list-board-toolbar-card {
  grid-template-columns: minmax(0, 1fr);
  gap: 0.46rem;
  padding: 0.48rem;
  border-radius: 14px;
  box-shadow: none;
  background:
    linear-gradient(180deg, rgba(255, 252, 246, 0.82), rgba(249, 241, 231, 0.72)),
    radial-gradient(circle at 100% 0%, rgba(226, 239, 237, 0.58), transparent 28%);
}

.list-board-toolbar-copy {
  display: grid;
  gap: 0.36rem;
  max-width: 34rem;
}

.list-board-filter-toggle {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid var(--list-line);
  border-radius: 10px;
  background: var(--surface-raised);
  color: var(--list-ink);
  box-shadow: none;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.list-board-filter-toggle:hover {
  transform: translateY(-1px);
}

.list-board-filter-toggle:active {
  transform: translateY(0) scale(0.985);
}

.list-board-filter-toggle:focus-visible {
  outline: none;
  border-color: var(--accent-border);
  box-shadow: 0 0 0 4px var(--accent-ring);
}

.list-board-filter-toggle.is-active {
  border-color: var(--active-item-border);
  background: linear-gradient(135deg, var(--active-item-bg), var(--card-bg-popover));
}

.list-board-filter-toggle-icon-swap {
  --icon-swap-dur: 250ms;
  --icon-swap-blur: 2px;
  --icon-swap-start-scale: 0.25;
  --icon-swap-ease: ease-in-out;
  position: relative;
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
}

.list-board-filter-toggle-icon,
.list-board-filter-toggle-close {
  grid-area: 1 / 1;
  transition: opacity var(--icon-swap-dur) var(--icon-swap-ease), filter var(--icon-swap-dur) var(--icon-swap-ease), transform var(--icon-swap-dur) var(--icon-swap-ease);
  will-change: opacity, filter, transform;
}

.list-board-filter-toggle-icon {
  display: grid;
  gap: 3px;
  width: 18px;
}

.list-board-filter-toggle-close {
  position: relative;
  display: block;
  width: 17px;
  height: 17px;
}

.list-board-filter-toggle-icon i {
  display: block;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.list-board-filter-toggle-close i {
  position: absolute;
  top: 50%;
  left: 50%;
  display: block;
  width: 17px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.list-board-filter-toggle-close i:first-child {
  transform: translate(-50%, -50%) rotate(45deg);
}

.list-board-filter-toggle-close i:last-child {
  transform: translate(-50%, -50%) rotate(-45deg);
}

.list-board-filter-toggle-icon-swap[data-state="filter"] [data-icon="filter"],
.list-board-filter-toggle-icon-swap[data-state="close"] [data-icon="close"] {
  opacity: 1;
  filter: blur(0);
  transform: scale(1);
}

.list-board-filter-toggle-icon-swap[data-state="filter"] [data-icon="close"],
.list-board-filter-toggle-icon-swap[data-state="close"] [data-icon="filter"] {
  opacity: 0;
  filter: blur(var(--icon-swap-blur));
  transform: scale(var(--icon-swap-start-scale));
}

.list-board-filter-toggle-icon i:nth-child(1) {
  width: 16px;
}

.list-board-filter-toggle-icon i:nth-child(2) {
  width: 11px;
  justify-self: end;
}

.list-board-filter-toggle-icon i:nth-child(3) {
  width: 14px;
}

@media (prefers-reduced-motion: reduce) {
  .list-board-filter-toggle-icon,
  .list-board-filter-toggle-close {
    transition: none !important;
  }
}

.list-board-toolbar-copy p {
  max-width: min(100%, 52ch);
}

.list-board-toolbar-actions {
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 0;
  padding: 0.42rem 0.46rem 0.48rem;
  border: 1px solid rgba(126, 96, 76, 0.08);
  border-radius: var(--radius-lg);
  background: rgba(255, 253, 249, 0.46);
}

.list-board-filter-stack {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.list-board-filter-group {
  gap: 0.34rem;
  padding: 0.12rem 0.38rem;
  border: 0;
  border-right: 1px solid rgba(126, 96, 76, 0.08);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.list-board-filter-group:last-child {
  border-right: 0;
}

.list-board-filter-label {
  color: rgba(95, 80, 72, 0.7);
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
}

.list-board-filter-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.3rem;
}

.list-board-filter-row.is-sliding-tabs {
  position: relative;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border: 1px solid rgba(126, 96, 76, 0.08);
  border-radius: 999px;
  background: rgba(120, 94, 74, 0.1);
  isolation: isolate;
  overflow: hidden;
}

.list-board-filter-slider {
  position: absolute;
  top: 3px;
  left: 0;
  z-index: 0;
  width: 0;
  height: calc(100% - 6px);
  border: 1px solid rgba(126, 96, 76, 0.1);
  border-radius: 999px;
  background: rgba(255, 251, 244, 0.92);
  box-shadow: 0 8px 18px rgba(74, 50, 33, 0.08);
  pointer-events: none;
  transform: translateX(0);
  transition: transform 250ms cubic-bezier(0.22, 1, 0.36, 1), width 250ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, width;
}

.list-board-filter-row.is-sliding-tabs .list-board-filter-pill {
  position: relative;
  z-index: 1;
  flex: 1 1 0;
  min-height: 30px;
  padding: 0.28rem 0.42rem;
  border: 0;
  background: transparent;
  color: rgba(61, 46, 40, 0.66);
  box-shadow: none;
  transition: color 250ms cubic-bezier(0.22, 1, 0.36, 1);
}

.list-board-filter-row.is-sliding-tabs .list-board-filter-pill:hover,
.list-board-filter-row.is-sliding-tabs .list-board-filter-pill:active {
  transform: none;
}

.list-board-filter-row.is-sliding-tabs .list-board-filter-pill.is-active,
.list-board-filter-row.is-sliding-tabs .list-board-filter-pill:hover {
  border-color: transparent;
  background: transparent;
  color: rgba(36, 27, 22, 0.92);
  box-shadow: none;
}

.list-board-filter-row.is-sort-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.18rem;
  margin-inline: 0;
  padding: 0;
  overflow: visible;
  scrollbar-width: auto;
}

.list-board-filter-row-wide {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.list-board-filter-row.is-sort-row .list-board-filter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.18rem;
  width: 100%;
  min-width: 0;
}

.list-board-sort-pill-icon {
  position: relative;
  width: 0.7rem;
  height: 0.7rem;
  flex: 0 0 auto;
  color: color-mix(in srgb, var(--text-muted) 78%, var(--text-main));
}

.list-board-filter-pill.is-active .list-board-sort-pill-icon {
  color: color-mix(in srgb, var(--text-main) 86%, var(--accent-dark));
}

.list-board-sort-pill-icon.is-progress {
  border-radius: 2px;
  background:
    linear-gradient(currentColor, currentColor) left bottom / 2px 4px no-repeat,
    linear-gradient(currentColor, currentColor) center bottom / 2px 6px no-repeat,
    linear-gradient(currentColor, currentColor) right bottom / 2px 8px no-repeat;
}

.list-board-sort-pill-icon.is-star-coins {
  border-radius: 999px;
  border: 1px solid currentColor;
}

.list-board-sort-pill-icon.is-star-coins::before {
  content: '';
  position: absolute;
  inset: 0.22rem;
  border-radius: 999px;
  background: currentColor;
}

.list-board-sort-pill-icon.is-age {
  border-radius: 999px;
  border: 1px solid currentColor;
}

.list-board-sort-pill-icon.is-age::before,
.list-board-sort-pill-icon.is-age::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1px;
  border-radius: 999px;
  background: currentColor;
  transform-origin: bottom center;
}

.list-board-sort-pill-icon.is-age::before {
  height: 0.22rem;
  transform: translate(-50%, -100%) rotate(0deg);
}

.list-board-sort-pill-icon.is-age::after {
  height: 0.18rem;
  transform: translate(-50%, -100%) rotate(55deg);
}

.list-board-sort-pill-icon.is-updated {
  border-radius: 999px;
  border: 1px solid transparent;
  border-top-color: currentColor;
  border-left-color: currentColor;
  transform: rotate(-40deg);
}

.list-board-sort-pill-icon.is-updated::after {
  content: '';
  position: absolute;
  top: -1px;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 3px 0 3px 4px;
  border-color: transparent transparent transparent currentColor;
  transform: rotate(40deg);
}

.list-board-filter-pill {
  width: 100%;
  min-width: 0;
  min-height: 28px;
  padding: 0.3rem 0.32rem;
  border-radius: 8px;
  font-size: 0.74rem;
  justify-content: center;
  text-align: center;
  white-space: nowrap;
  box-shadow: none;
}

.list-board-filter-row.is-sort-row .list-board-filter-pill {
  padding-inline: 0.08rem;
  font-size: 0.68rem;
}

.list-board-filter-pill.is-active {
  background: linear-gradient(135deg, var(--active-item-bg), var(--card-bg-popover));
  border-color: var(--active-item-border);
  color: var(--text-main);
  box-shadow: 0 4px 10px var(--accent-shadow-soft);
}

@media (prefers-reduced-motion: reduce) {
  .list-board-filter-slider,
  .list-board-filter-row.is-sliding-tabs .list-board-filter-pill {
    transition: none !important;
  }

  .list-board-item,
  .list-board-sort-context strong,
  .list-board-sort-context em {
    animation: none !important;
    transition: none !important;
  }
}

.list-board-card {
  background: color-mix(in srgb, var(--panel-bg-strong) 82%, var(--surface-card));
}

.list-board-badge {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.36rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.08);
  background: rgba(255, 255, 255, 0.48);
  color: rgba(61, 46, 40, 0.62);
  font-family: var(--list-body-font);
  font-size: 0.75rem;
  line-height: var(--type-meta-line);
}

.list-board-grid {
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
  border: 1px solid rgba(126, 96, 76, 0.06);
  border-radius: var(--radius-lg);
  background: rgba(255, 253, 249, 0.52);
}

.list-board-item {
  --owner-accent: color-mix(in srgb, var(--accent) 70%, var(--text-muted));
  --owner-row-hover: color-mix(in srgb, var(--owner-accent) 5%, transparent);
  --owner-progress-start: var(--accent-sun);
  --owner-progress-end: var(--accent);
  position: relative;
  grid-template-columns: 0.5rem minmax(0, 1fr) 2.9rem;
  column-gap: 0.58rem;
  row-gap: 0.24rem;
  align-items: start;
  padding: 0.7rem 0.66rem 0.72rem 0.62rem;
  border-bottom: 1px solid rgba(126, 96, 76, 0.055);
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  transition: background 160ms ease;
  animation: list-board-sort-enter 100ms cubic-bezier(0.22, 1, 0.36, 1);
}

.list-board-item:last-child {
  border-bottom: 0;
}

.list-board-item.is-personal-owner {
  --owner-accent: color-mix(in srgb, var(--accent) 64%, var(--text-muted));
  --owner-row-hover: color-mix(in srgb, var(--accent-panel) 52%, transparent);
  --owner-progress-start: color-mix(in srgb, var(--accent-sun) 78%, var(--surface-card));
  --owner-progress-end: color-mix(in srgb, var(--accent) 82%, var(--text-muted));
}

.list-board-item.is-assist-owner {
  --owner-accent: color-mix(in srgb, var(--accent-teal) 72%, var(--text-muted));
  --owner-row-hover: color-mix(in srgb, var(--mist) 48%, transparent);
  --owner-progress-start: color-mix(in srgb, var(--accent-teal) 76%, var(--surface-card));
  --owner-progress-end: color-mix(in srgb, var(--accent-teal) 72%, var(--text-muted));
}

.list-board-item:focus-within {
  background: color-mix(in srgb, var(--owner-row-hover) 58%, transparent);
}

@media (hover: hover) and (pointer: fine) {
  .list-board-item:hover {
    background: color-mix(in srgb, var(--owner-row-hover) 58%, transparent);
  }
}

.list-board-owner-dot {
  grid-column: 1;
  grid-row: 1;
  width: 7px;
  height: 7px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--owner-accent);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--owner-accent) 10%, transparent);
}

.list-board-main {
  grid-column: 2;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.16rem;
  min-width: 0;
}

.list-board-star-ring-shell {
  grid-column: 3;
  grid-row: 1;
  align-self: start;
  justify-self: end;
  width: 45px;
  display: grid;
  justify-items: end;
  margin-top: 0.04rem;
}

.list-board-side-stat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 45px;
  min-height: 34px;
  gap: 2px;
  padding: 2px 4px;
  border: 1px solid color-mix(in srgb, var(--owner-progress-end) 14%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--owner-row-hover) 34%, white);
  text-align: center;
}

.list-board-side-stat strong {
  color: var(--owner-progress-end);
  font-family: var(--list-body-font);
  font-size: 0.54rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
}

.list-board-side-stat.is-side-status strong {
  font-size: 0.54rem;
  line-height: 1;
}

.list-board-side-stat.is-side-status .list-board-side-label {
  position: static;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  opacity: 1;
  transform: none;
  transition: none;
  white-space: nowrap;
  line-height: 1;
}

.list-board-side-glyph {
  position: relative;
  width: 12px;
  height: 12px;
  flex: 0 0 auto;
  border-radius: 999px;
}

.list-board-side-stat.is-active .list-board-side-glyph {
  border: 1.5px solid color-mix(in srgb, var(--owner-progress-end) 72%, white);
  background: transparent;
}

.list-board-side-stat.is-done .list-board-side-glyph {
  border: 1.5px solid color-mix(in srgb, var(--owner-progress-end) 76%, white);
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--owner-progress-end) 62%, white) 0%,
    color-mix(in srgb, var(--owner-progress-end) 78%, white) 58%,
    color-mix(in srgb, var(--owner-progress-end) 68%, white) 100%
  );
  box-shadow: none;
}

.list-board-side-stat.is-done .list-board-side-glyph::after {
  content: '';
  position: absolute;
  left: 0.19rem;
  top: 0.12rem;
  width: 0.34rem;
  height: 0.2rem;
  border-left: 1px solid rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid rgba(255, 255, 255, 0.94);
  filter: drop-shadow(0 0 0.4px rgba(255, 255, 255, 0.6));
  transform: rotate(-45deg);
}

.list-board-card-top {
  grid-column: 1;
  gap: 0.28rem;
  align-items: center;
}

.list-board-card-tools {
  align-items: center;
}

.list-board-card-scope {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.32rem 0.62rem;
  border-radius: 999px;
  font-family: var(--list-body-font);
  color: rgba(61, 46, 40, 0.86);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.list-board-card-scope.is-mine {
  border: 1px solid rgba(110, 151, 120, 0.18);
  background: rgba(218, 234, 223, 0.8);
}

.list-board-card-scope.is-other {
  border: 1px solid rgba(201, 124, 97, 0.16);
  background: rgba(243, 222, 210, 0.72);
}

.list-board-card-mood {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.34rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: var(--surface-raised);
}

.list-board-more-trigger {
  width: 38px;
  min-width: 38px;
  min-height: 38px;
  padding: 0;
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  box-shadow: none;
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
  grid-column: auto;
  display: grid;
  gap: 0;
}

.list-board-card-body.has-image {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.list-board-card-copy {
  gap: 0;
  max-width: 100%;
}

.list-board-item h3 {
  overflow: hidden;
  color: var(--list-ink);
  font-family: var(--list-heading-font);
  font-size: 0.88rem;
  font-weight: 500;
  line-height: 1.34;
  letter-spacing: 0.01em;
  text-overflow: ellipsis;
  text-wrap: nowrap;
  white-space: nowrap;
}

.list-board-card-data {
  grid-column: auto;
  grid-template-columns: 1fr;
  gap: 0;
  margin-top: 0;
}

.list-board-data-block {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.list-board-sort-context {
  display: grid;
  align-items: start;
  min-width: 0;
  gap: 0.12rem;
}

.list-board-sort-context strong,
.list-board-sort-context em {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-board-sort-context strong {
  font-family: var(--list-body-font);
  font-size: 0.74rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0;
  transition: opacity 160ms ease, transform 160ms ease;
}

.list-board-sort-context em {
  color: rgba(76, 59, 50, 0.54);
  font-family: var(--list-body-font);
  font-size: 0.66rem;
  font-style: normal;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: 0.01em;
  white-space: nowrap;
  transition: opacity 160ms ease, transform 160ms ease;
}

@keyframes list-board-sort-enter {
  from {
    opacity: 0;
    transform: translateY(1px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (hover: none), (pointer: coarse) {
  .list-board-item {
    animation: none;
  }

  .list-board-item:hover {
    background: transparent;
  }

  .list-board-sort-context strong,
  .list-board-sort-context em {
    transition: none;
  }

  .list-board-side-stat.is-side-status .list-board-side-label {
    position: static;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    opacity: 1;
    transform: none;
    white-space: nowrap;
    line-height: 1;
  }
}

.list-board-starcoin-line {
  color: var(--text-muted);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  -webkit-line-clamp: 1;
}

.list-board-data-block.is-coin {
  background: rgba(241, 232, 200, 0.26);
}

.list-board-progress-link {
  color: inherit;
  text-decoration: none;
  border-radius: 6px;
  transition: color 160ms ease, outline-color 160ms ease;
}

.list-board-progress-link:hover,
.list-board-progress-link:focus-visible {
  color: color-mix(in srgb, var(--owner-accent) 38%, var(--list-ink));
}

.list-board-progress-link:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--owner-accent) 18%, transparent);
  outline-offset: 3px;
}

.list-board-action {
  width: 100%;
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

  .list-board-workbench-hero {
    grid-template-columns: 1fr;
  }

  .list-board-workbench-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .list-board-workbench-actions {
    justify-content: flex-start;
  }

  .list-board-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-board-filter-stack {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .list-board-filter-group {
    padding: 0.42rem 0.28rem;
    border-right: 0;
    border-bottom: 1px solid rgba(126, 96, 76, 0.08);
  }

  .list-board-filter-group:last-child {
    border-bottom: 0;
  }

  .list-board-summary-grid > .list-board-summary-card:first-child {
    grid-column: 1 / -1;
  }

}

@media (max-width: 760px) {
  .list-board-toolbar-card,
  .list-board-toolbar-actions {
    grid-template-columns: 1fr;
  }

  .list-board-search-row {
    grid-template-columns: minmax(0, 1fr) 38px;
    justify-content: stretch;
  }

  .list-board-workbench-hero {
    padding: 0.9rem;
  }

  .list-board-workbench-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-board-workbench-stat-wide {
    grid-column: 1 / -1;
  }

  .list-board-workbench-actions {
    flex-wrap: wrap;
  }

  .list-board-workbench-actions .list-board-button {
    flex: 1 1 10rem;
  }

  .list-board-head,
  .list-board-inline-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .list-board-hero-card h1 {
    max-width: 18ch;
    font-size: var(--type-l0-size);
  }

  .list-board-card-body.has-image,
  .list-board-summary-grid,
  .list-board-more-panel {
    grid-template-columns: 1fr;
  }

  .list-board-filter-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.28rem;
  }

  .list-board-filter-row-wide {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .list-board-summary-grid > .list-board-summary-card:first-child {
    grid-column: auto;
  }

  .list-board-search-field {
    max-width: none;
    padding: 0;
  }

  .list-board-filter-pill {
    min-height: 28px;
    padding: 0.3rem 0.3rem;
    border-radius: 8px;
    font-size: 0.72rem;
  }

  .list-board-filter-row.is-sort-row .list-board-filter-pill {
    padding-inline: 0.06rem;
    font-size: 0.66rem;
  }

  .list-board-sort-pill-icon {
    width: calc(0.7rem + 0.5px);
    height: calc(0.7rem + 0.5px);
  }

  .list-board-card-image {
    max-width: none;
  }

  .list-board-card {
    padding: 0.72rem;
  }

  .list-board-item {
    column-gap: 0.54rem;
    row-gap: 0.2rem;
    padding: 0.66rem 0.58rem 0.68rem 0.58rem;
  }

  .list-board-star-ring-shell,
  .list-board-side-stat {
    width: 45px;
  }

  .list-board-side-stat {
    min-height: 34px;
    padding: 2px 4px;
    gap: 2px;
  }

  .list-board-card-top {
    gap: 0.26rem;
  }

  .list-board-card-body {
    gap: 0;
  }

  .list-board-delete-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-board-card-data {
    grid-template-columns: 1fr;
  }

  .list-board-sort-context em {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    white-space: normal;
    line-height: 1.24;
  }
}

@media (max-width: 460px) {
  .list-board-delete-actions,
  .list-board-inline-actions {
    grid-template-columns: 1fr;
  }

  .list-board-card-meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .list-board-filter-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.22rem;
    overflow: visible;
    padding-bottom: 0;
  }

  .list-board-filter-row-wide,
  .list-board-filter-row.is-sort-row {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.14rem;
  }

  .list-board-filter-pill {
    width: 100%;
    min-height: 26px;
    padding: 0.25rem 0.18rem;
    font-size: 0.66rem;
    letter-spacing: 0;
  }

  .list-board-filter-row.is-sort-row .list-board-filter-pill {
    padding-inline: 0.02rem;
    font-size: 0.6rem;
  }

  .list-board-sort-pill-icon {
    width: calc(0.66rem + 0.5px);
    height: calc(0.66rem + 0.5px);
  }

  .list-board-inline-actions {
    display: grid;
    width: 100%;
  }

  .list-board-item {
    grid-template-columns: 0.5rem minmax(0, 1fr) 2.7rem;
  }

  .list-board-star-ring-shell,
  .list-board-side-stat {
    width: 43px;
  }

  .list-board-side-stat {
    min-height: 32px;
    padding: 2px 3px;
  }

  .list-board-inline-actions .list-board-side-button {
    width: 100%;
  }
}

@media (min-width: 1024px) {
  .list-board-item {
    padding: 0.78rem 0.76rem 0.8rem 0.72rem;
    row-gap: 0.26rem;
  }

  .list-board-item h3 {
    font-size: 0.92rem;
    line-height: 1.36;
  }

  .list-board-sort-context strong {
    font-size: 0.76rem;
  }

  .list-board-sort-context em {
    font-size: 0.68rem;
    line-height: 1.32;
  }
}

:global(:root[data-theme='dark']) .list-board-badge {
  border-color: var(--line-soft);
  background: color-mix(in srgb, var(--surface-strong) 86%, transparent);
  color: var(--text-muted);
}

:global(:root[data-theme='dark']) .list-board-grid {
  border-color: var(--line-soft);
  background: color-mix(in srgb, var(--surface-base) 92%, transparent);
}

:global(:root[data-theme='dark']) .list-board-hero-name,
:global(:root[data-theme='dark']) .list-board-head h2,
:global(:root[data-theme='dark']) .list-board-item h3,
:global(:root[data-theme='dark']) .list-board-empty h3 {
  color: var(--text-main) !important;
}

:global(:root[data-theme='dark']) .list-board-item p,
:global(:root[data-theme='dark']) .list-board-toolbar-copy p,
:global(:root[data-theme='dark']) .list-board-summary-card p,
:global(:root[data-theme='dark']) .list-board-data-block p,
:global(:root[data-theme='dark']) .list-board-card-meta span,
:global(:root[data-theme='dark']) .list-board-progress-summary em {
  color: var(--text-soft) !important;
}

:global(:root[data-theme='dark']) .list-board-summary-card > span,
:global(:root[data-theme='dark']) .list-board-hero-focus-card > span,
:global(:root[data-theme='dark']) .list-board-search-field > span,
:global(:root[data-theme='dark']) .list-board-data-block > span {
  color: var(--text-muted) !important;
}

:global(:root[data-theme='dark']) .list-board-sort-context em,
:global(:root[data-theme='dark']) .list-board-starcoin-line {
  color: var(--text-soft) !important;
}

:global(:root[data-theme='dark']) .list-board-sort-context strong {
  color: var(--text-main) !important;
}

:global(:root[data-theme='dark']) .list-board-item {
  border-bottom-color: color-mix(in srgb, var(--line-soft) 88%, transparent);
}

:global(:root[data-theme='dark']) .list-board-side-stat {
  border-color: color-mix(in srgb, var(--owner-progress-end) 38%, var(--line-soft));
  background: color-mix(in srgb, var(--surface-strong) 86%, transparent);
}

:global(:root[data-theme='dark']) .list-board-side-stat strong {
  color: color-mix(in srgb, var(--owner-progress-end) 66%, var(--text-soft));
}

:global(:root[data-theme='dark']) .list-board-side-stat.is-active .list-board-side-glyph {
  border-color: color-mix(in srgb, var(--owner-progress-end) 66%, var(--text-soft));
}

:global(:root[data-theme='dark']) .list-board-side-stat.is-done .list-board-side-glyph {
  border-color: color-mix(in srgb, var(--owner-progress-end) 70%, var(--text-soft));
  background: linear-gradient(
    165deg,
    color-mix(in srgb, var(--owner-progress-end) 68%, var(--surface-strong)) 0%,
    color-mix(in srgb, var(--owner-progress-end) 80%, var(--surface-strong)) 58%,
    color-mix(in srgb, var(--owner-progress-end) 72%, var(--surface-strong)) 100%
  );
}

:global(:root[data-theme='dark']) .list-board-side-stat.is-done .list-board-side-glyph::after {
  border-left-color: rgba(255, 255, 255, 0.84);
  border-bottom-color: rgba(255, 255, 255, 0.84);
  filter: none;
}
</style>
