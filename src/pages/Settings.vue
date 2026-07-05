<script setup lang="ts">
import { computed, nextTick, reactive, ref, watchEffect } from 'vue'
import CopyFold from '../components/CopyFold.vue'
import ActionCard from '../components/page/ActionCard.vue'
import ManagePanel from '../components/page/ManagePanel.vue'
import PageModeFrame from '../components/page/PageModeFrame.vue'
import { ENTRY_STATUS_LABELS, REWARD_KEYWORD_STATUS_FILTER_LABELS } from '../shared/statusSemantics'
import { useSpacePageState } from '../composables/useSpacePageState'
import type { RewardPoolItem } from '../stores/wishes'

const space = reactive(useSpacePageState())

type RewardEditorTier = 'daily' | 'premium'
type AccessPanel = 'invite' | 'email' | 'fixedEmail'
type RewardKeywordKind = 'personal' | 'shared' | 'assist'
type RewardKeywordSortMode = 'default' | 'cost' | 'deposited' | 'remaining' | 'popular' | 'newest'
type RewardKeywordOwnerFilter = 'all' | RewardKeywordKind
type RewardKeywordStatusFilter = 'all' | 'claimable' | 'depositable'
type RewardKeywordEntry = {
  item: RewardPoolItem
  kind: RewardKeywordKind
  ownerName: string
}

const selectedRewardKeywordId = ref<string | null>(null)
const rewardKeywordSortMode = ref<RewardKeywordSortMode>('default')
const rewardKeywordOwnerFilter = ref<RewardKeywordOwnerFilter>('personal')
const rewardKeywordStatusFilter = ref<RewardKeywordStatusFilter>('depositable')
const rewardCostMinDraft = ref('')
const rewardCostMaxDraft = ref('')
const rewardDepositedMinDraft = ref('')
const rewardDepositedMaxDraft = ref('')
const isRewardRangeFilterOpen = ref(false)
const isRewardShelfManaging = ref(false)
const isRewardManagePanelOpen = ref(false)
const isRewardFilterPanelOpen = ref(false)
const isRewardKeywordExpanded = ref(false)
const rewardFilterPanelId = 'space-reward-filter-panel'
const activeAccessPanel = ref<AccessPanel>('email')
const REWARD_DEFAULT_VISIBLE_COUNT = 6

const rewardKeywordSortTabs: { label: string; value: RewardKeywordSortMode }[] = [
  { label: '默认', value: 'default' },
  { label: '币数', value: 'cost' },
  { label: '已存', value: 'deposited' },
  { label: '快满', value: 'remaining' },
  { label: '热门', value: 'popular' },
  { label: '上新', value: 'newest' },
]

const rewardKeywordOwnerTabs: { label: string; value: RewardKeywordOwnerFilter }[] = [
  { label: '全部', value: 'all' },
  { label: '我的', value: 'personal' },
  { label: '对方', value: 'assist' },
  { label: '共同', value: 'shared' },
]

const rewardKeywordStatusTabs: { label: string; value: RewardKeywordStatusFilter }[] = [
  { label: REWARD_KEYWORD_STATUS_FILTER_LABELS.all, value: 'all' },
  { label: REWARD_KEYWORD_STATUS_FILTER_LABELS.claimable, value: 'claimable' },
  { label: REWARD_KEYWORD_STATUS_FILTER_LABELS.depositable, value: 'depositable' },
]

const accessPanelTabs = computed(() => {
  return [
    {
      label: '邀请',
      note: space.syncStatusLabel,
      value: 'invite' as const,
    },
    {
      label: '邮箱',
      note: space.authStore.isAuthenticated ? ENTRY_STATUS_LABELS.entered : ENTRY_STATUS_LABELS.notEntered,
      value: 'email' as const,
    },
    ...(space.canBindFixedEmail
      ? [
          {
            label: '记住',
            note: '创建者',
            value: 'fixedEmail' as const,
          },
        ]
      : []),
  ]
})

watchEffect(() => {
  if (activeAccessPanel.value === 'fixedEmail' && !space.canBindFixedEmail) {
    activeAccessPanel.value = 'email'
  }
})

watchEffect(() => {
  if (!isRewardManagePanelOpen.value) {
    isRewardShelfManaging.value = false
  }
})

const rewardPageMode = computed<'action' | 'manage'>({
  get: () => (isRewardManagePanelOpen.value ? 'manage' : 'action'),
  set: (mode) => {
    isRewardManagePanelOpen.value = mode === 'manage'
  },
})

const activeRewardHubTitle = computed(() => {
  return rewardPageMode.value === 'action' ? '领奖与兑换' : '编辑奖励池'
})

const activeRewardHubLead = computed(() => {
  if (rewardPageMode.value === 'action') {
    return '愿望推进得到的星星币，会在这里换成真正想要的奖励。'
  }

  if (space.currentMemberRewardCount) {
    return '写新奖励、改旧奖励、整理奖池，都在这里。'
  }

  return '先写下一条会让自己开心的奖励。'
})

function formatStarCoinAmount(value: number) {
  const roundedValue = Math.round(value * 10) / 10
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1)
}

function createRewardDisplayEntries(rewards: RewardPoolItem[], tier: RewardEditorTier) {
  return rewards.map((item) => ({
    fallbackNote: '这条奖励还没有补充说明。',
    item,
    label: '星币奖励',
    metaLines: [
      item.scope === 'shared' ? '共同奖励' : '个人奖励',
      `已换 ${space.wishStore.getRewardItemClaimCount(item)} 份`,
      item.starCoinCost > 0 ? `${item.starCoinCost} 星星币兑换` : '还没有设置价格',
    ],
    tier,
  }))
}

const currentSpaceMemberId = computed(() => space.authStore.currentMemberId || space.authStore.currentMember?.id || null)

const activeRewardPoolEntries = computed(() => {
  return createRewardDisplayEntries(
    [
      ...space.currentMemberPremiumRewards,
      ...space.sharedPremiumRewards.filter((item) => item.ownerId === currentSpaceMemberId.value),
    ],
    'premium',
  )
})

const activeRewardPoolMemberName = computed(() => {
  return space.authStore.currentMember?.displayName || '我的奖池'
})

const activeRewardPoolEyebrow = computed(() => '我的星币奖励')

const activeRewardPoolEmpty = computed(() => {
  return {
    copy: '你还没有星币奖励。',
    title: '还没有星币奖励',
  }
})

const rewardKeywordEntries = computed<RewardKeywordEntry[]>(() => [
  ...space.rewardTaskEntries,
  ...space.assistRewardEntries,
])

function parseRewardRangeValue(value: string) {
  if (!value.trim()) {
    return null
  }

  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) && normalizedValue >= 0 ? normalizedValue : null
}

function isWithinRewardRange(value: number, minValue: number | null, maxValue: number | null) {
  return (minValue === null || value >= minValue) && (maxValue === null || value <= maxValue)
}

function getRewardCreatedAtTime(entry: RewardKeywordEntry) {
  const timestamp = new Date(entry.item.createdAt).getTime()
  return Number.isFinite(timestamp) ? timestamp : 0
}

function getRewardCreatedDays(entry: RewardKeywordEntry) {
  const timestamp = getRewardCreatedAtTime(entry)

  if (!timestamp) {
    return 0
  }

  return Math.max(Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000)), 0)
}

function getRewardClaimCount(entry: RewardKeywordEntry) {
  return space.wishStore.getRewardItemClaimCount(entry.item)
}

function getRewardDepositedAmount(entry: RewardKeywordEntry) {
  return space.getRewardDepositedStarCoins(entry.item)
}

function getRewardRemainingAmount(entry: RewardKeywordEntry) {
  return space.getRewardRemainingStarCoins(entry.item)
}

function getRewardDepositPercent(entry: RewardKeywordEntry) {
  const starCoinCost = Math.max(entry.item.starCoinCost, 0)

  if (!starCoinCost) {
    return 0
  }

  return Math.min(Math.round((getRewardDepositedAmount(entry) / starCoinCost) * 1000) / 10, 100)
}

function isRewardEntryClaimable(entry: RewardKeywordEntry) {
  return entry.kind !== 'assist' && space.canRedeemPremiumReward(entry.item)
}

const hasRewardKeywordFilters = computed(() => {
  return rewardKeywordOwnerFilter.value !== 'all'
    || rewardKeywordStatusFilter.value !== 'all'
    || Boolean(rewardCostMinDraft.value)
    || Boolean(rewardCostMaxDraft.value)
    || Boolean(rewardDepositedMinDraft.value)
    || Boolean(rewardDepositedMaxDraft.value)
})

const visibleRewardKeywordEntries = computed(() => {
  const costMin = parseRewardRangeValue(rewardCostMinDraft.value)
  const costMax = parseRewardRangeValue(rewardCostMaxDraft.value)
  const depositedMin = parseRewardRangeValue(rewardDepositedMinDraft.value)
  const depositedMax = parseRewardRangeValue(rewardDepositedMaxDraft.value)

  const filteredEntries = rewardKeywordEntries.value.filter((entry) => {
    if (rewardKeywordOwnerFilter.value !== 'all' && entry.kind !== rewardKeywordOwnerFilter.value) {
      return false
    }

    if (rewardKeywordStatusFilter.value === 'claimable' && !isRewardEntryClaimable(entry)) {
      return false
    }

    if (rewardKeywordStatusFilter.value === 'depositable' && !space.canDepositReward(entry.item, 1)) {
      return false
    }

    return isWithinRewardRange(entry.item.starCoinCost, costMin, costMax)
      && isWithinRewardRange(getRewardDepositedAmount(entry), depositedMin, depositedMax)
  })

  return [...filteredEntries].sort((left, right) => {
    if (rewardKeywordSortMode.value === 'cost') {
      return left.item.starCoinCost - right.item.starCoinCost || left.item.title.localeCompare(right.item.title)
    }

    if (rewardKeywordSortMode.value === 'deposited') {
      return getRewardDepositedAmount(right) - getRewardDepositedAmount(left) || left.item.title.localeCompare(right.item.title)
    }

    if (rewardKeywordSortMode.value === 'remaining') {
      return getRewardRemainingAmount(left) - getRewardRemainingAmount(right) || left.item.starCoinCost - right.item.starCoinCost
    }

    if (rewardKeywordSortMode.value === 'popular') {
      return getRewardClaimCount(right) - getRewardClaimCount(left) || left.item.title.localeCompare(right.item.title)
    }

    if (rewardKeywordSortMode.value === 'newest') {
      return getRewardCreatedAtTime(right) - getRewardCreatedAtTime(left) || left.item.title.localeCompare(right.item.title)
    }

    return 0
  })
})

const selectedRewardEntry = computed(() => {
  if (!visibleRewardKeywordEntries.value.length) {
    return null
  }

  return visibleRewardKeywordEntries.value.find((entry) => entry.item.id === selectedRewardKeywordId.value) || visibleRewardKeywordEntries.value[0]
})

const visibleRewardKeywordEntriesForDisplay = computed(() => {
  if (isRewardManagePanelOpen.value || isRewardKeywordExpanded.value) {
    return visibleRewardKeywordEntries.value
  }

  return visibleRewardKeywordEntries.value.slice(0, REWARD_DEFAULT_VISIBLE_COUNT)
})

const canToggleRewardKeywordExpansion = computed(() => {
  return !isRewardManagePanelOpen.value && visibleRewardKeywordEntries.value.length > REWARD_DEFAULT_VISIBLE_COUNT
})

const claimableVisibleRewardEntries = computed(() => {
  return visibleRewardKeywordEntries.value.filter((entry) => isRewardEntryClaimable(entry))
})

const rewardKeywordHeadline = computed(() => {
  const visibleCount = visibleRewardKeywordEntries.value.length

  if (!visibleCount) {
    return '这一组筛选下还没有匹配项，换个角度再看看。'
  }

  if (rewardKeywordStatusFilter.value === 'claimable') {
    return `这 ${visibleCount} 条已经可以领取，先兑现一条。`
  }

  if (rewardKeywordStatusFilter.value === 'depositable') {
    return `先从这 ${visibleCount} 条可存入的奖励里，给最想要的一条加一把劲。`
  }

  if (rewardKeywordOwnerFilter.value === 'assist') {
    return '这些是对方的奖励，选一条给对方悄悄加油。'
  }

  if (rewardKeywordOwnerFilter.value === 'shared') {
    return '这些是共同奖励，挑一条一起推进会更有感觉。'
  }

  if (rewardKeywordSortMode.value === 'remaining') {
    return '已经按快满排序，先把最接近的一条点亮。'
  }

  if (rewardKeywordSortMode.value === 'cost') {
    return '已经按币数排好，先从最容易兑现的一条开始。'
  }

  if (rewardKeywordSortMode.value === 'deposited') {
    return '先看看哪条已经存得最多，顺手把它推到可领取。'
  }

  if (rewardKeywordSortMode.value === 'popular') {
    return '按热门排在前面的，往往是你最愿意兑现的。'
  }

  if (rewardKeywordSortMode.value === 'newest') {
    return '新写下的奖励排在前面，看看最近最想实现哪条。'
  }

  return '点一个奖励，看它现在能不能兑现。'
})

watchEffect(() => {
  if (!visibleRewardKeywordEntries.value.length) {
    selectedRewardKeywordId.value = null
    return
  }

  if (!visibleRewardKeywordEntries.value.some((entry) => entry.item.id === selectedRewardKeywordId.value)) {
    selectedRewardKeywordId.value = visibleRewardKeywordEntries.value[0].item.id
  }
})

const activeRewardEditor = computed(() => {
  const isEditing = Boolean(space.editingPremiumRewardId)

  return {
    eyebrow: '星币奖励池',
    heading: '奖励',
    isEditing,
    submitCopy: isEditing ? '正在修改这条奖励。' : '保存后会进入星币奖励池。',
    submitLabel: space.isSubmittingReward ? '保存中...' : isEditing ? '更新奖励' : '加入奖励',
  }
})

function openRewardEditor(itemId: string, tier: 'daily' | 'premium') {
  rewardPageMode.value = 'manage'
  space.startEditingReward(itemId, tier)
}

function editRewardFromShelf(itemId: string, tier: 'daily' | 'premium') {
  isRewardShelfManaging.value = false
  openRewardEditor(itemId, tier)
}

function submitActiveRewardDraft() {
  return space.submitPremiumReward()
}

function resetActiveRewardDraft() {
  space.resetRewardDraft('premium')
}

function openRewardManager() {
  rewardPageMode.value = 'manage'
}

async function jumpToClaimableReward() {
  if (!space.claimableRewardEntries.length) {
    return
  }

  rewardKeywordStatusFilter.value = 'claimable'
  rewardKeywordOwnerFilter.value = 'all'
  isRewardKeywordExpanded.value = true

  await nextTick()

  const claimableEntry = claimableVisibleRewardEntries.value[0]

  if (!claimableEntry) {
    return
  }

  selectedRewardKeywordId.value = claimableEntry.item.id

  await nextTick()

  if (typeof document !== 'undefined') {
    document.querySelector('.reward-selected-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    })
  }
}

function selectRewardKeyword(entry: RewardKeywordEntry) {
  selectedRewardKeywordId.value = entry.item.id
}

function chooseRewardKeywordSortMode(mode: RewardKeywordSortMode) {
  rewardKeywordSortMode.value = mode
}

function chooseRewardKeywordOwnerFilter(filter: RewardKeywordOwnerFilter) {
  rewardKeywordOwnerFilter.value = filter
}

function chooseRewardKeywordStatusFilter(filter: RewardKeywordStatusFilter) {
  rewardKeywordStatusFilter.value = filter
}

function clearRewardKeywordFilters() {
  rewardKeywordOwnerFilter.value = 'personal'
  rewardKeywordStatusFilter.value = 'depositable'
  rewardCostMinDraft.value = ''
  rewardCostMaxDraft.value = ''
  rewardDepositedMinDraft.value = ''
  rewardDepositedMaxDraft.value = ''
}

function getRewardKeywordMetricLabel(entry: RewardKeywordEntry) {
  if (rewardKeywordSortMode.value === 'deposited') {
    return `已存 ${getRewardDepositedAmount(entry)}`
  }

  if (rewardKeywordSortMode.value === 'remaining') {
    return getRewardRemainingAmount(entry) > 0 ? `还差 ${getRewardRemainingAmount(entry)}` : '可领'
  }

  if (rewardKeywordSortMode.value === 'popular') {
    return `领 ${getRewardClaimCount(entry)}`
  }

  if (rewardKeywordSortMode.value === 'newest') {
    const days = getRewardCreatedDays(entry)
    return days <= 0 ? '今天新' : `${days}天新`
  }

  return `${entry.item.starCoinCost}星星币`
}

function getRewardKeywordOwnerLabel(entry: RewardKeywordEntry) {
  if (entry.kind === 'assist') {
    return `${entry.ownerName}的奖励`
  }

  return space.getRewardTaskKindLabel(entry.kind)
}

function getSelectedRewardPrimaryLabel(entry: RewardKeywordEntry) {
  if (entry.kind === 'assist' && space.canRedeemPremiumReward(entry.item)) {
    return '等待对方领取'
  }

  return space.getRewardPrimaryActionLabel(entry)
}

function canUseSelectedRewardPrimaryAction(entry: RewardKeywordEntry) {
  if (entry.kind === 'assist' && space.canRedeemPremiumReward(entry.item)) {
    return false
  }

  if (space.canRedeemPremiumReward(entry.item)) {
    return true
  }

  return space.getRecommendedDepositAmount(entry.item) > 0
}

function runRewardPrimaryAction(entry: RewardKeywordEntry) {
  if (entry.kind !== 'assist' && space.canRedeemPremiumReward(entry.item)) {
    return space.redeemPremiumReward(entry.item.id)
  }

  const amount = space.getRecommendedDepositAmount(entry.item)

  if (amount <= 0) {
    return undefined
  }

  return space.depositRewardStarCoins(entry.item.id, amount)
}
</script>

<template>
  <section class="page-stack space-page">
    <div class="space-main-stack">
      <article class="page-card space-shell-card space-main-card space-united-card">
        <div class="space-main-summary-shell">
          <div class="space-main-summary-intro">
            <div class="space-hero-copy-block">
              <h1 class="section-title space-hero-title">把两个人的日常放在同一页</h1>
            </div>
          </div>
        </div>
      </article>

      <PageModeFrame
        v-model:mode="rewardPageMode"
        class="space-mode-frame"
        title="空间页主模式切换"
        action-label="领奖与兑换"
        manage-label="整理与工具"
        :switch-only="true"
      >
        <template #head-meta>
          <div class="badge-row space-mode-badges">
            <span class="badge">{{ space.accountSummary }}</span>
            <span class="badge">{{ space.syncStatusLabel }}</span>
          </div>
        </template>
      </PageModeFrame>

      <component
        :is="rewardPageMode === 'manage' ? ManagePanel : ActionCard"
        class="space-shell-card space-main-card space-reward-hub"
        eyebrow="奖励中心"
        :summary="activeRewardHubLead"
        :title="activeRewardHubTitle"
      >
        <template #actions>
          <button
            v-if="rewardPageMode === 'manage'"
            class="button-subtle"
            type="button"
            @click="rewardPageMode = 'action'"
          >
            回到领奖
          </button>
        </template>

        <template v-if="rewardPageMode === 'action'">
          <section class="reward-command-panel">
            <div class="reward-command-summary">
              <article class="reward-command-stat reward-command-stat-primary">
                <span>手里星币</span>
                <strong>{{ formatStarCoinAmount(space.currentMemberStarCoins) }}</strong>
              </article>
              <article class="reward-command-stat">
                <span>奖池词条</span>
                <strong>{{ visibleRewardKeywordEntries.length }} / {{ rewardKeywordEntries.length }}</strong>
              </article>
              <button
                class="reward-command-stat reward-command-stat-wide reward-command-stat-claim"
                :class="{ 'is-enabled': space.claimableRewardEntries.length > 0 }"
                type="button"
                :disabled="!space.claimableRewardEntries.length"
                @click="void jumpToClaimableReward()"
              >
                <span>现在可领</span>
                <strong>{{ space.claimableRewardEntries.length }}</strong>
              </button>
            </div>

            <div v-if="!rewardKeywordEntries.length" class="reward-command-actions">
              <button v-if="!rewardKeywordEntries.length" class="button-solid" type="button" @click="openRewardManager">写一条奖励</button>
            </div>
          </section>

          <section
            v-if="isRewardFilterPanelOpen && rewardKeywordEntries.length"
            :id="rewardFilterPanelId"
            class="reward-keyword-controls"
            aria-label="奖励奖池筛选排序"
          >
            <div class="reward-keyword-control-row">
              <span class="reward-keyword-control-label">排序</span>
              <div class="reward-keyword-pill-row" role="list" aria-label="排序方式">
                <button
                  v-for="tab in rewardKeywordSortTabs"
                  :key="tab.value"
                  class="reward-filter-pill"
                  :class="{ active: rewardKeywordSortMode === tab.value }"
                  type="button"
                  @click="chooseRewardKeywordSortMode(tab.value)"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <div class="reward-keyword-control-row">
              <span class="reward-keyword-control-label">归属</span>
              <div class="reward-keyword-pill-row" role="list" aria-label="奖励归属筛选">
                <button
                  v-for="tab in rewardKeywordOwnerTabs"
                  :key="tab.value"
                  class="reward-filter-pill"
                  :class="{ active: rewardKeywordOwnerFilter === tab.value }"
                  type="button"
                  @click="chooseRewardKeywordOwnerFilter(tab.value)"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <div class="reward-keyword-control-row">
              <span class="reward-keyword-control-label">状态</span>
              <div class="reward-keyword-pill-row" role="list" aria-label="奖励状态筛选">
                <button
                  v-for="tab in rewardKeywordStatusTabs"
                  :key="tab.value"
                  class="reward-filter-pill"
                  :class="{ active: rewardKeywordStatusFilter === tab.value }"
                  type="button"
                  @click="chooseRewardKeywordStatusFilter(tab.value)"
                >
                  {{ tab.label }}
                </button>
                <span class="reward-keyword-inline-divider" aria-hidden="true"></span>
                <button class="reward-filter-pill reward-range-toggle" type="button" :class="{ active: isRewardRangeFilterOpen }" @click="isRewardRangeFilterOpen = !isRewardRangeFilterOpen">
                  区间
                </button>
              </div>
            </div>

            <div v-if="hasRewardKeywordFilters" class="reward-keyword-control-actions">
              <button class="reward-filter-pill" type="button" @click="clearRewardKeywordFilters">清空</button>
            </div>

            <div v-if="isRewardRangeFilterOpen" class="reward-range-panel">
              <label>
                <span>需要星币</span>
                <input v-model="rewardCostMinDraft" type="number" min="0" inputmode="numeric" placeholder="最小" />
                <input v-model="rewardCostMaxDraft" type="number" min="0" inputmode="numeric" placeholder="最大" />
              </label>
              <label>
                <span>已存星币</span>
                <input v-model="rewardDepositedMinDraft" type="number" min="0" inputmode="numeric" placeholder="最小" />
                <input v-model="rewardDepositedMaxDraft" type="number" min="0" inputmode="numeric" placeholder="最大" />
              </label>
            </div>
          </section>

          <section v-if="rewardKeywordEntries.length" class="reward-keyword-shell">
            <div class="reward-keyword-head">
              <div>
                <p class="eyebrow">奖池</p>
                <h3>{{ rewardKeywordHeadline }}</h3>
              </div>
              <div class="reward-keyword-head-actions">
                <span class="badge">{{ visibleRewardKeywordEntriesForDisplay.length }} / {{ visibleRewardKeywordEntries.length }} 条</span>
                <button
                  class="space-manage-link reward-filter-trigger"
                  :class="{ 'is-active': isRewardFilterPanelOpen }"
                  type="button"
                  aria-label="筛选与排序"
                  :aria-controls="rewardFilterPanelId"
                  :aria-expanded="isRewardFilterPanelOpen"
                  @click="isRewardFilterPanelOpen = !isRewardFilterPanelOpen"
                >
                  <span>筛选</span>
                  <span class="space-manage-link-icon" aria-hidden="true"></span>
                </button>
              </div>
            </div>

            <template v-if="visibleRewardKeywordEntries.length">
              <div class="reward-keyword-cloud" aria-label="奖励词条奖池">
                <button
                  v-for="entry in visibleRewardKeywordEntriesForDisplay"
                  :key="entry.item.id"
                  class="reward-keyword-chip"
                  :class="[
                    `reward-keyword-chip-${entry.kind}`,
                    { active: selectedRewardEntry?.item.id === entry.item.id },
                  ]"
                  type="button"
                  @click="selectRewardKeyword(entry)"
                >
                  <span class="reward-keyword-title">{{ entry.item.title }}</span>
                  <span class="reward-keyword-metric">{{ getRewardKeywordMetricLabel(entry) }}</span>
                </button>
              </div>

              <div class="reward-keyword-inline-links">
                <button v-if="canToggleRewardKeywordExpansion" class="reward-text-link" type="button" @click="isRewardKeywordExpanded = !isRewardKeywordExpanded">
                  {{ isRewardKeywordExpanded ? '收起奖励' : '查看更多奖励' }}
                </button>
              </div>
            </template>

            <div v-else class="space-empty-card reward-filter-empty">
              <strong>没有符合条件的奖励</strong>
              <button v-if="isRewardFilterPanelOpen" class="reward-text-link reward-empty-text-link" type="button" @click="clearRewardKeywordFilters">清空筛选</button>
            </div>
          </section>

          <article v-if="selectedRewardEntry" class="reward-selected-card" :class="[`reward-selected-card-${selectedRewardEntry.kind}`]">
            <div class="reward-task-card-head">
              <div>
                <span class="reward-card-kicker">{{ getRewardKeywordOwnerLabel(selectedRewardEntry) }}</span>
                <strong>{{ selectedRewardEntry.item.title }}</strong>
                <p class="reward-selected-note">{{ selectedRewardEntry.item.note || '还没有备注' }}</p>
              </div>
              <span class="badge">{{ selectedRewardEntry.item.starCoinCost }} 星币</span>
            </div>

            <div class="reward-deposit-progress" :aria-label="`已预存 ${formatStarCoinAmount(getRewardDepositPercent(selectedRewardEntry))}%`">
              <span :style="{ width: `${getRewardDepositPercent(selectedRewardEntry)}%` }"></span>
            </div>

            <p class="space-meta-line reward-card-meta">
              <span>已预存 {{ formatStarCoinAmount(getRewardDepositedAmount(selectedRewardEntry)) }} / {{ formatStarCoinAmount(selectedRewardEntry.item.starCoinCost) }}</span>
              <span>{{ space.getRewardRemainingStarCoins(selectedRewardEntry.item) > 0 ? `还差 ${space.getRewardRemainingStarCoins(selectedRewardEntry.item)} 枚` : '已经存满' }}</span>
              <span>已领 {{ space.wishStore.getRewardItemClaimCount(selectedRewardEntry.item) }} 份</span>
            </p>

            <div class="reward-task-actions">
              <button
                class="button-solid reward-primary-action"
                type="button"
                :disabled="space.processingRewardItemId === selectedRewardEntry.item.id || !canUseSelectedRewardPrimaryAction(selectedRewardEntry)"
                @click="void runRewardPrimaryAction(selectedRewardEntry)"
              >
                {{ space.processingRewardItemId === selectedRewardEntry.item.id ? '处理中...' : getSelectedRewardPrimaryLabel(selectedRewardEntry) }}
              </button>
              <div
                v-if="!space.canRedeemPremiumReward(selectedRewardEntry.item)"
                class="reward-quick-chip-row"
                :aria-label="selectedRewardEntry.kind === 'assist' ? '快捷助力金额' : '快捷存入金额'"
              >
                <button
                  v-for="amount in [1, 3, 5]"
                  :key="amount"
                  class="reward-quick-chip"
                  type="button"
                  :disabled="space.processingRewardItemId === selectedRewardEntry.item.id || !space.canDepositReward(selectedRewardEntry.item, amount)"
                  @click="void space.depositRewardStarCoins(selectedRewardEntry.item.id, amount)"
                >
                  +{{ amount }}
                </button>
              </div>
              <p v-if="space.rewardMessage" :class="['feedback-message', 'space-reward-feedback', space.rewardTone]">{{ space.rewardMessage }}</p>
            </div>
          </article>

          <div v-if="!rewardKeywordEntries.length" class="space-empty-card reward-command-empty">
            <strong>还没有可以推进的奖励</strong>
            <button class="button-solid" type="button" @click="openRewardManager">写一条奖励</button>
          </div>

          <section v-if="isRewardManagePanelOpen" class="reward-recent-strip">
            <div class="reward-task-section-head">
              <div>
                <p class="eyebrow">最近发生</p>
                <h3>奖励记录</h3>
              </div>
              <span class="badge">{{ space.recentRewardClaims.length }} 笔</span>
            </div>

            <div v-if="space.recentRewardClaimPreview.length" class="reward-recent-list">
              <article v-for="item in space.recentRewardClaimPreview" :key="item.claim.id" class="reward-recent-item">
                <span class="reward-claim-marker" aria-hidden="true"></span>
                <div>
                  <strong>{{ item.claim.titleSnapshot }}</strong>
                  <p>{{ space.getRewardClaimReason(item.claim) }}</p>
                  <small>{{ space.formatBeijingDateTime(item.claim.createdAt) }}</small>
                </div>
              </article>
            </div>

            <div v-else class="space-empty-card reward-recent-empty">
              <strong>还没有领取记录</strong>
            </div>
          </section>
        </template>

        <template v-else>
          <div class="space-reward-workbench">
            <div class="space-reward-stage-head">
              <div class="space-reward-stage-copy">
                <p class="eyebrow">编辑区</p>
                <h3 class="space-fold-title">写下和整理奖励</h3>
              </div>
            </div>

            <div class="reward-form-grid space-reward-form-grid">
              <article class="space-form reward-form-card reward-editor-card">
                <form class="reward-editor-form" @submit.prevent="submitActiveRewardDraft">
                  <div class="reward-form-fields reward-form-fields-premium">
                    <label class="space-field-block">
                      <span class="muted">奖励名称</span>
                      <input v-model="space.premiumRewardTitleDraft" type="text" maxlength="120" placeholder="例如：心仪很久的大件 / 一次认真放松的体验" />
                    </label>
                    <label class="space-field-block">
                      <span class="muted">说明（可选）</span>
                      <textarea v-model="space.premiumRewardNoteDraft" rows="2" maxlength="240" placeholder="写下这个奖励真正吸引你的地方"></textarea>
                    </label>
                    <label class="space-field-block reward-form-cost-field">
                      <span class="muted">星星币兑换价</span>
                      <input v-model.number="space.premiumRewardCostDraft" type="number" min="1" max="999" />
                    </label>
                    <div class="space-field-block reward-scope-field">
                      <span class="muted">奖励归属</span>
                      <div class="reward-scope-toggle" role="radiogroup" aria-label="奖励归属">
                        <label>
                          <input v-model="space.premiumRewardScopeDraft" type="radio" value="personal" />
                          <span>个人</span>
                        </label>
                        <label>
                          <input v-model="space.premiumRewardScopeDraft" type="radio" value="shared" />
                          <span>共同</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="reward-form-submit-row">
                    <p class="reward-form-submit-copy">{{ activeRewardEditor.submitCopy }}</p>

                    <div class="button-row reward-form-actions">
                      <button class="button-solid" type="submit" :disabled="space.isSubmittingReward">
                        {{ activeRewardEditor.submitLabel }}
                      </button>
                      <button v-if="activeRewardEditor.isEditing" class="button-subtle" type="button" @click="resetActiveRewardDraft">取消编辑</button>
                    </div>

                    <p v-if="space.rewardMessage" :class="['feedback-message', 'space-reward-feedback-inline', space.rewardTone]">{{ space.rewardMessage }}</p>
                  </div>
                </form>
              </article>
            </div>
          </div>

          <div class="space-reward-stage">
            <div class="space-reward-stage-head">
              <div class="space-reward-stage-copy">
                <p class="eyebrow">奖池</p>
                <h3 class="space-fold-title">查看和管理奖励</h3>
              </div>

              <div class="space-reward-hub-pills">
                <span class="badge">我的奖池</span>
                <span class="badge">{{ activeRewardPoolEntries.length }} 条</span>
              </div>
            </div>

            <div class="reward-pool-viewer-shell reward-pool-unified-shell">
              <article class="reward-shelf-card reward-pool-unified-card">
                <div class="space-subsection-heading">
                  <div>
                    <p class="eyebrow">{{ activeRewardPoolEyebrow }}</p>
                    <h3>{{ activeRewardPoolMemberName }}</h3>
                  </div>

                  <div class="reward-shelf-heading-actions">
                    <span class="badge">{{ activeRewardPoolEntries.length }} 条</span>
                    <button
                      class="reward-shelf-manage-button"
                      type="button"
                      :disabled="!activeRewardPoolEntries.length"
                      @click="isRewardShelfManaging = !isRewardShelfManaging"
                    >
                      {{ isRewardShelfManaging ? '完成' : '管理' }}
                    </button>
                  </div>
                </div>

                <div v-if="activeRewardPoolEntries.length" class="reward-compact-list">
                  <article
                    v-for="entry in activeRewardPoolEntries"
                    :key="`mine:${entry.tier}:${entry.item.id}`"
                    class="reward-compact-row"
                    :class="{
                      'reward-compact-row-premium': entry.tier === 'premium',
                    }"
                  >
                    <div class="reward-compact-main">
                      <span class="reward-card-kicker">{{ entry.label }}</span>
                      <strong>{{ entry.item.title }}</strong>
                      <p>{{ entry.item.note || entry.fallbackNote }}</p>
                    </div>

                    <div class="reward-compact-meta">
                      <span v-for="line in entry.metaLines" :key="line">{{ line }}</span>
                    </div>

                    <div v-if="isRewardShelfManaging" class="reward-compact-manage-actions">
                      <button class="reward-compact-manage-button" type="button" @click="editRewardFromShelf(entry.item.id, entry.tier)">编辑</button>
                      <button
                        class="reward-compact-manage-button danger-button"
                        type="button"
                        :disabled="space.processingRewardItemId === entry.item.id"
                        @click="void space.archiveReward(entry.item.id)"
                      >
                        {{ space.processingRewardItemId === entry.item.id ? '删除中...' : '删除' }}
                      </button>
                    </div>
                  </article>
                </div>

                <div v-else class="space-empty-card">
                  <strong>{{ activeRewardPoolEmpty.title }}</strong>
                  <p>{{ activeRewardPoolEmpty.copy }}</p>
                </div>
              </article>
            </div>
          </div>
        </template>
      </component>
    </div>

    <div class="space-utility-band-head">
      <div>
      </div>
    </div>

    <div v-if="rewardPageMode === 'manage'" class="space-utility-grid">
      <ManagePanel
        class="space-shell-card space-fold-card space-utility-card space-utility-card-tools"
        eyebrow="进入与邀请"
        summary="先把两个人都稳定进到同一间空间。"
        title="进入方式"
      >
        <template #actions>
          <div class="badge-row">
            <span class="badge">{{ space.accountSummary }}</span>
            <span class="badge">{{ space.syncStatusLabel }}</span>
          </div>
        </template>

        <div class="space-fold-body space-tools-fold-body">
          <section class="space-tools-section">
            <div class="space-subsection-heading">
              <div>
                <p class="eyebrow">进入与邀请</p>
                <h3>选择进入方式</h3>
              </div>
              <div class="badge-row">
                <span v-for="badge in space.accountBadges" :key="badge" class="badge">{{ badge }}</span>
              </div>
            </div>

            <div class="access-compact-panel">
              <div class="access-panel-tabs" role="tablist" aria-label="进入方式">
                <button
                  v-for="tab in accessPanelTabs"
                  :key="tab.value"
                  class="access-panel-tab"
                  :class="{ active: activeAccessPanel === tab.value }"
                  type="button"
                  role="tab"
                  :aria-selected="activeAccessPanel === tab.value"
                  @click="activeAccessPanel = tab.value"
                >
                  <span>{{ tab.label }}</span>
                  <small>{{ tab.note }}</small>
                </button>
              </div>

              <section v-if="activeAccessPanel === 'invite'" class="access-panel-body" role="tabpanel">
                <div class="access-panel-head">
                  <div>
                    <h3>邀请对方</h3>
                  </div>
                  <span class="badge">{{ space.syncStatusLabel }}</span>
                </div>

                <div class="access-code-row">
                  <div class="space-inline-code">
                    <span class="muted">邀请口令</span>
                    <strong>{{ space.authStore.inviteCode }}</strong>
                  </div>
                  <button v-if="space.canCopyInviteCode" class="button-subtle" type="button" @click="space.copyInviteCode">复制</button>
                </div>

                <div class="space-fold-card tools-mini-fold">
                  <div class="space-fold-body tools-mini-body">
                    <form class="space-form space-access-form access-inline-form" @submit.prevent="space.joinSpace">
                      <label>
                        <span class="muted">对方发来的邀请口令</span>
                        <input v-model="space.inviteDraft" type="text" placeholder="WISH-2026" />
                      </label>
                      <button class="button-solid" :disabled="space.isJoiningSpace" type="submit">
                        {{ space.isJoiningSpace ? '确认中...' : '确认加入' }}
                      </button>
                    </form>
                    <p class="space-access-form-note">确认后会尝试走进同一间空间，不会盖掉你已经写下的愿望。</p>
                  </div>
                </div>
              </section>

              <section v-else-if="activeAccessPanel === 'email'" class="access-panel-body" role="tabpanel">
                <div class="access-panel-head">
                  <div>
                    <h3>邮箱进入</h3>
                  </div>
                  <span class="badge">{{ space.authStore.isAuthenticated ? ENTRY_STATUS_LABELS.entered : ENTRY_STATUS_LABELS.notEntered }}</span>
                </div>

                <div class="space-fold-card tools-mini-fold">
                  <div class="space-fold-body tools-mini-body">
                    <form class="space-form space-access-form access-inline-form" @submit.prevent="space.submitMagicLink">
                      <label>
                        <span class="muted">邮箱</span>
                        <input v-model="space.loginEmail" type="email" placeholder="chenguang@example.com" />
                      </label>
                      <button class="button-solid" :disabled="space.isSendingMagicLink" type="submit">
                        {{ space.isSendingMagicLink ? '发送中...' : '发送验证邮件' }}
                      </button>
                    </form>

                    <form v-if="space.showOtpForm" class="space-form space-access-form space-access-form-otp access-inline-form" @submit.prevent="space.submitEmailOtp">
                      <label>
                        <span class="muted">邮箱验证码</span>
                        <input v-model="space.loginOtp" type="text" inputmode="numeric" placeholder="输入邮件里的验证码" />
                      </label>
                      <button class="button-subtle" :disabled="space.isVerifyingOtp" type="submit">
                        {{ space.isVerifyingOtp ? '校验中...' : '确认进入' }}
                      </button>
                    </form>
                    <p v-if="space.otpTargetEmail && space.showOtpForm" class="space-access-form-note">按 {{ space.otpTargetEmail }} 校验；换邮箱后先重发一次。</p>
                  </div>
                </div>

                <p v-if="space.loginMessage" :class="['feedback-message', space.loginTone]">{{ space.loginMessage }}</p>
              </section>

              <section v-else-if="space.canBindFixedEmail" class="access-panel-body" role="tabpanel">
                <div class="access-panel-head">
                  <div>
                    <h3>记住常用邮箱</h3>
                  </div>
                  <span class="badge">仅创建者可用</span>
                </div>

                <div class="space-fold-card tools-mini-fold">
                  <div class="space-fold-body tools-mini-body">
                    <form class="space-form space-access-form access-fixed-form" @submit.prevent="space.bindFixedEmail">
                      <label>
                        <span class="muted">邮箱</span>
                        <input v-model="space.fixedEmailDraft" type="email" placeholder="partner@example.com" />
                      </label>
                      <label>
                        <span class="muted">显示名称（可选）</span>
                        <input v-model="space.fixedDisplayNameDraft" type="text" maxlength="50" placeholder="例如：晨光 / 星野" />
                      </label>
                      <button class="button-subtle" :disabled="space.isBindingEmail" type="submit">
                        {{ space.isBindingEmail ? '保存中...' : '记住这个邮箱' }}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            </div>

            <p v-if="space.inviteMessage" :class="['feedback-message', space.inviteTone]">{{ space.inviteMessage }}</p>
          </section>

        </div>
      </ManagePanel>

      <ManagePanel
        class="space-shell-card space-fold-card space-utility-card space-utility-card-tools"
        eyebrow="照片与备份"
        summary="整理空间容量，定期留一份备份。"
        title="备份与容量"
      >
        <template #actions>
          <div class="badge-row">
            <span class="badge">已用 {{ space.storageSummary.usagePercent }}%</span>
            <span class="badge">{{ space.authStore.usesSupabaseSpace ? '云端空间' : '本地体验空间' }}</span>
          </div>
        </template>

        <div class="space-fold-body space-tools-fold-body">
          <section class="space-tools-section">
            <div class="space-subsection-heading">
              <div>
                <p class="eyebrow">照片与备份</p>
                <h3>照片空间与备份</h3>
              </div>
              <div class="badge-row">
                <span class="badge">已用 {{ space.storageSummary.usagePercent }}%</span>
                <span class="badge">{{ space.authStore.usesSupabaseSpace ? '云端空间' : '本地体验空间' }}</span>
              </div>
            </div>

            <div class="storage-compact-panel">
              <CopyFold
                as="p"
                class="section-copy storage-lead"
                layer="supporting"
                page="space"
                target="storage-lead"
                :text="space.storageLead"
              />

              <div class="storage-meter" :aria-label="`照片空间已使用 ${space.storageSummary.usagePercent}%`">
                <div
                  :class="['storage-meter-fill', { warning: space.storageSummary.nearingLimit, danger: space.storageSummary.overSoftLimit }]"
                  :style="{ width: `${space.storageSummary.usagePercent}%` }"
                ></div>
              </div>

              <dl class="storage-stat-list storage-stat-list-compact">
                <div v-for="fact in space.storageFacts.slice(0, 2)" :key="fact.label" class="storage-stat-item">
                  <dt>{{ fact.label }}</dt>
                  <dd>{{ fact.value }}</dd>
                </div>
              </dl>

              <details v-if="space.storageFacts.length > 2" class="space-fold-card storage-more-fold">
                <summary class="space-fold-summary storage-more-summary">
                  <div class="space-fold-copy-block">
                    <p class="eyebrow">更多空间数据</p>
                  </div>
                  <div class="space-fold-meta">
                    <div class="space-fold-toggle" aria-hidden="true">
                      <span class="space-fold-arrow"></span>
                    </div>
                  </div>
                </summary>

                <div class="space-fold-body storage-more-body">
                  <dl class="storage-stat-list">
                    <div v-for="fact in space.storageFacts.slice(2)" :key="fact.label" class="storage-stat-item">
                      <dt>{{ fact.label }}</dt>
                      <dd>{{ fact.value }}</dd>
                    </div>
                  </dl>
                </div>
              </details>

              <div class="storage-backup-row">
                <div class="storage-backup-copy">
                  <CopyFold
                    as="p"
                    class="section-copy"
                    layer="supporting"
                    page="space"
                    target="storage-remaining-hint"
                    :text="space.estimatedRemainingImageCount === null
                      ? '再多传几张后，这里会显示还能放多少。'
                      : `按现在的大小，大约还能放 ${space.estimatedRemainingImageCount} 张。`"
                  />
                  <CopyFold
                    as="p"
                    class="space-meta-line"
                    layer="supporting"
                    page="space"
                    target="storage-backup-note"
                    text="备份会带上清单、星币奖励和记录，建议两个人各留一份。"
                  />
                </div>
                <button class="button-subtle" type="button" @click="space.downloadBackup">备份清单</button>
              </div>
            </div>

            <p v-if="space.backupMessage" :class="['feedback-message', space.backupTone]">{{ space.backupMessage }}</p>
          </section>

        </div>
      </ManagePanel>

      <ManagePanel
        class="space-shell-card space-fold-card space-utility-card space-utility-card-tools"
        eyebrow="同步与退出"
        summary="确认连接状态，必要时安全退出。"
        title="同步状态"
      >
        <template #actions>
          <span class="badge">{{ space.syncStatusLabel }}</span>
        </template>

        <div class="space-fold-body space-tools-fold-body">
          <section class="space-tools-section">
            <div class="space-subsection-heading">
              <div>
                <p class="eyebrow">同步与退出</p>
                <h3>同步与退出</h3>
              </div>
              <span class="badge">{{ space.syncStatusLabel }}</span>
            </div>

            <div class="space-advanced-grid">
              <article class="space-access-card space-advanced-status-card sync-flat-card">
                <span class="muted">同步状态</span>
                <strong>{{ space.syncStatusLabel }}</strong>
                <span class="badge">{{ space.authStore.usesSupabaseSpace ? '云端数据' : '本地体验' }}</span>
              </article>

              <details class="space-access-card space-fold-card space-debug-fold">
                <summary class="space-fold-summary space-debug-summary">
                  <div class="space-fold-copy-block">
                    <p class="eyebrow">同步详情</p>
                    <h3>连接与数据来源</h3>
                  </div>

                  <div class="space-fold-meta">
                    <span class="badge">{{ space.syncStatusLabel }}</span>
                    <div class="space-fold-toggle" aria-hidden="true">
                      <span class="space-fold-arrow"></span>
                    </div>
                  </div>
                </summary>

                <div class="space-fold-body space-debug-body">
                  <div class="info-list">
                    <div v-for="item in space.advancedInfoRows" :key="item.label" class="info-row">
                      <span class="muted">{{ item.label }}</span>
                      <strong>{{ item.value }}</strong>
                    </div>
                  </div>
                </div>
              </details>

              <article class="space-access-card danger-card">
                <div class="danger-row">
                  <span class="muted">离开这台设备</span>
                  <button v-if="space.authStore.isAuthenticated" class="button-subtle danger-button" type="button" @click="void space.authStore.signOut()">
                    退出登录
                  </button>
                  <span v-else class="muted">当前还没有登录中的邮箱会话。</span>
                </div>
              </article>
            </div>
          </section>
        </div>

      </ManagePanel>
    </div>
  </section>
</template>

<style scoped>
.space-page,
.space-main-stack,
.space-utility-grid,
.space-shell-card,
.space-fact-grid,
.space-member-grid,
.space-member-card,
.space-main-summary-shell,
.space-reward-editor-head,
.space-reward-story-head,
.space-reward-heading-copy,
.space-reward-editor-note,
.space-reward-story-note,
.space-reward-editor-stats,
.space-reward-story-meta,
.space-reward-workbench,
.space-reward-stage,
.space-reward-stage-copy,
.space-utility-band-head,
.space-member-stat-grid,
.space-member-meta,
.space-access-grid,
.space-access-card,
.space-advanced-shell,
.space-advanced-grid,
.space-inline-panel,
.space-inline-code,
.space-fold-copy-block,
.space-fold-meta,
.space-fold-body,
.space-claim-panel,
.space-pending-grid,
.space-pending-list,
.space-pending-item,
.space-pending-copy,
.space-pending-controls,
.reward-form-grid,
.reward-form-copy,
.reward-shelf-grid,
.reward-card-grid,
.reward-member-grid,
.reward-claim-list,
.reward-tier-block,
.reward-chip-list,
.info-list,
.space-reward-member-card,
.reward-form-submit-row {
  display: grid;
  gap: 1rem;
}

.space-united-card {
  background:
    radial-gradient(circle at 84% 18%, var(--sage-glow), transparent 28%),
    radial-gradient(circle at 0% 100%, var(--warning-panel), transparent 30%),
    linear-gradient(142deg, var(--card-bg-popover), var(--card-bg-soft));
  border-color: var(--active-item-border);
  box-shadow: var(--shadow-raised);
  padding-block: 0.82rem;
}

.space-reward-hub {
  background:
    radial-gradient(circle at top right, var(--danger-panel), transparent 22%),
    radial-gradient(circle at top left, var(--sage-glow), transparent 24%),
    linear-gradient(180deg, var(--card-bg), var(--card-bg-soft));
  gap: 0.72rem;
}

.space-reward-hub .button-solid,
.space-reward-hub .button-subtle,
.space-reward-hub .button-link {
  gap: 0.28rem;
  padding: 0.62rem 0.86rem;
  font-size: var(--type-meta-size);
  line-height: 1.2;
}

.space-mode-frame {
  gap: 0.52rem;
}

.space-mode-badges {
  justify-content: flex-end;
}

.space-utility-card-tools {
  gap: 0;
  background: linear-gradient(180deg, rgba(248, 242, 236, 0.96), rgba(242, 234, 225, 0.92));
}

.space-tools-fold-body {
  gap: 0.62rem;
}

.space-tools-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.36rem;
}

.space-tools-tab {
  display: grid;
  gap: 0.02rem;
  align-content: center;
  min-height: 2.34rem;
  padding: 0.32rem 0.42rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.42);
  color: var(--text-main);
  text-align: left;
}

.space-tools-tab span {
  font-family: var(--font-heading);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: 1.14;
}

.space-tools-tab small {
  overflow: hidden;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-tools-tab.active {
  border-color: rgba(142, 116, 88, 0.28);
  background: rgba(255, 247, 237, 0.78);
}

.space-tools-section {
  display: grid;
  gap: 0.56rem;
  padding-top: 0.56rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.14);
}

.space-utility-card-tools .space-subsection-heading h3,
.space-utility-card-tools .access-panel-head h3,
.space-utility-card-tools .space-debug-summary h3,
.space-utility-card-tools .storage-stat-item dd {
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
}

.space-utility-card-tools .eyebrow,
.space-utility-card-tools .muted,
.space-utility-card-tools .badge,
.space-utility-card-tools .space-card-intro,
.space-utility-card-tools .space-access-form-note,
.space-utility-card-tools .space-meta-line {
  font-size: var(--type-eyebrow-size);
  line-height: 1.3;
}

.space-utility-card-tools .space-form label {
  gap: 0.28rem;
}

.space-utility-card-tools input {
  min-height: 2.08rem;
  padding: 0.34rem 0.58rem;
  font-size: var(--type-meta-size);
  line-height: 1.2;
}

.space-utility-card-tools .button-solid,
.space-utility-card-tools .button-subtle,
.space-utility-card-tools .space-fold-toggle {
  min-height: 2.04rem;
  padding: 0.3rem 0.66rem;
  font-size: var(--type-meta-size);
  line-height: 1.15;
}

.tools-mini-fold {
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 12px;
  padding: 0.42rem 0.5rem;
  background: rgba(255, 255, 255, 0.26);
}

.tools-mini-body {
  gap: 0.48rem;
  padding-top: 0;
  border-top: 0;
}

.sync-flat-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.52rem;
}

.sync-flat-card strong {
  font-family: var(--font-heading);
  font-size: var(--type-meta-size);
  line-height: 1.2;
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.52rem;
}

.space-tools-section:first-child {
  padding-top: 0;
  border-top: none;
}

.space-reward-hub-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: end;
}

.space-reward-hub-copy {
  display: grid;
  gap: 0.24rem;
}

.space-reward-hub-title {
  font-size: var(--type-card-title-size);
}

.space-reward-hub-lead {
  margin: 0;
  max-width: 34rem;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.space-reward-hub-pills {
  display: flex;
  gap: 0.38rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

.space-manage-link {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.34rem;
  min-height: 2rem;
  padding: 0.26rem 0.64rem;
  border: 1px solid color-mix(in srgb, var(--card-border) 78%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--card-bg-raised) 74%, transparent);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0;
  text-decoration: none;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.space-manage-link:hover {
  color: var(--text-muted);
  border-color: color-mix(in srgb, var(--active-item-border) 78%, transparent);
}

.space-manage-link.is-active {
  color: var(--text-main);
  border-color: color-mix(in srgb, var(--active-item-border) 84%, transparent);
  background: color-mix(in srgb, var(--accent-panel) 56%, var(--card-bg-raised));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-ring) 70%, transparent);
}

.space-manage-link-icon {
  width: 0.38rem;
  height: 0.38rem;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  transform: rotate(45deg) translateY(-1px);
  transition: transform 160ms ease;
}

.space-manage-link.is-active .space-manage-link-icon {
  transform: rotate(-135deg) translateY(-1px);
}

.reward-keyword-inline-links {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.64rem;
}

.reward-text-link {
  margin: 0;
  padding: 0.1rem 0;
  border: 0;
  background: transparent;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: 0;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--text-soft) 55%, transparent);
  text-underline-offset: 2px;
}

.reward-text-link:hover {
  color: var(--text-muted);
}

.reward-empty-text-link {
  justify-self: center;
}

.space-reward-hub-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.56rem;
}

.space-current-catch-card {
  display: grid;
  gap: 0.82rem;
  padding: 1rem 1.02rem;
  border-radius: 24px;
  border: 1px solid var(--active-item-border);
  background:
    linear-gradient(180deg, var(--card-bg-popover), var(--panel-bg-strong)),
    radial-gradient(circle at top right, var(--danger-panel), transparent 30%);
}

.space-current-catch-copy {
  display: grid;
  gap: 0.28rem;
}

.space-current-catch-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.space-current-catch-actions {
  justify-content: flex-start;
}

.space-reward-hub-tab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.72rem 0.88rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--text-main);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.space-reward-hub-tab-copy {
  display: flex;
  align-items: baseline;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.space-reward-hub-tab:hover {
  transform: translateY(-1px);
  border-color: rgba(201, 111, 74, 0.2);
}

.space-reward-hub-tab.active {
  border-color: rgba(201, 111, 74, 0.2);
  box-shadow: 0 14px 28px rgba(88, 66, 45, 0.06);
}

.space-reward-hub-tab-label {
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: var(--type-l5-line);
  letter-spacing: 0.01em;
}

.space-reward-hub-tab-note {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
  letter-spacing: 0.01em;
}

.space-reward-workbench,
.space-reward-stage {
  gap: 1.15rem;
  padding-top: 0.15rem;
}

.space-pending-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.space-pending-card {
  gap: 1rem;
  align-content: start;
  padding: 1rem;
  border-radius: 28px;
  border: 1px solid rgba(95, 74, 55, 0.08);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(249, 242, 233, 0.78));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
}

.space-pending-card-count {
  background: linear-gradient(180deg, rgba(250, 252, 249, 0.72), rgba(241, 238, 232, 0.82));
}

.space-pending-fold {
  gap: 0;
}

.space-pending-fold[open] {
  gap: 0.88rem;
}

.space-pending-summary {
  gap: 0.85rem;
}

.space-pending-summary h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.space-pending-summary .space-fold-copy {
  max-width: 28ch;
}

.space-pending-fold .space-fold-meta {
  gap: 0.48rem;
}

.space-pending-fold .badge-row {
  justify-content: flex-end;
}

.space-pending-fold .space-fold-toggle {
  min-height: 2.08rem;
  padding: 0.34rem 0.72rem;
}

.space-pending-fold-body {
  gap: 0.88rem;
  padding-top: 0.88rem;
  border-top-style: dashed;
}

.space-pending-list {
  gap: 0.88rem;
}

.space-pending-item {
  gap: 0.78rem;
  padding: 0.92rem;
  border-radius: 22px;
  border: 1px solid rgba(95, 74, 55, 0.24);
  background: rgba(255, 252, 248, 0.78);
}

.space-pending-item-count {
  background: rgba(248, 251, 247, 0.82);
}

.space-pending-copy {
  gap: 0.32rem;
}

.space-pending-copy p {
  margin: 0;
}

.space-pending-controls {
  gap: 0.72rem;
  padding-top: 0.72rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.12);
}

.space-pending-select {
  display: grid;
  gap: 0.45rem;
}

.space-pending-select select {
  width: 100%;
}

.space-pending-action-grid {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.space-reward-stage {
  padding-top: 1.1rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
}

.space-hero-title {
  max-width: 20ch;
  font-family: var(--font-display);
  font-size: var(--type-section-title-size);
  font-weight: 400;
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
  color: color-mix(in srgb, var(--text-main) 82%, var(--text-soft));
}

.space-page {
  --space-page-gap: clamp(1.15rem, 2vw, 1.6rem);
  --space-stack-gap: clamp(1rem, 1.7vw, 1.35rem);
  gap: var(--space-page-gap);
}

.space-utility-band-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
  padding-inline: 0.2rem;
}

.space-utility-band-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-section-title-size);
  font-weight: 600;
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.space-utility-band-head .section-copy {
  max-width: 32rem;
  margin: 0;
}

.space-main-stack {
  gap: var(--space-stack-gap);
}

.space-main-summary-shell {
  gap: 0.42rem;
}

.space-main-summary-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(260px, 0.78fr);
  gap: 0.56rem;
  align-items: center;
}

.space-main-kicker {
  margin-bottom: 0;
}

.space-main-summary-lead {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
}

.space-main-summary-lead {
  max-width: 28rem;
  font-size: var(--type-body-size);
  line-height: 1.6;
}

.space-hero-copy p,
.space-fold-copy p {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
}

.space-card-intro,
.space-access-form-note {
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.space-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 0.82rem;
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.space-fact-card,
.space-member-card,
.space-access-card,
.reward-form-card,
.reward-shelf-card,
.reward-card,
.reward-claim-card,
.space-reward-member-card,
.space-empty-card {
  border-radius: 22px;
  border: 1px solid var(--card-border);
  background: var(--panel-bg);
  box-shadow: var(--shadow-card);
  padding: 1rem;
}

.space-fact-card strong,
.space-fold-title,
.space-subsection-heading h3,
.member-head h3,
.space-inline-code strong {
  margin: 0;
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: -0.024em;
}

.space-main-stack {
  align-items: start;
}

.space-utility-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
  gap: 0.78rem;
}

.space-shell-card {
  display: grid;
  gap: 1rem;
  background: linear-gradient(180deg, rgba(255, 253, 248, 0.92), rgba(250, 243, 234, 0.88));
}

.space-main-card {
  align-items: start;
  padding: 1.35rem;
}

.space-fold-copy {
  max-width: 34ch;
}

.space-panel-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-section-title-size);
  font-weight: 600;
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.space-reward-section-heading .section-copy,
.space-utility-band-head .section-copy {
  max-width: 36ch;
}

.space-utility-card {
  align-content: start;
  min-height: 100%;
  padding: 0.92rem 0.98rem;
  background: linear-gradient(180deg, rgba(252, 249, 244, 0.94), rgba(245, 237, 228, 0.88));
  box-shadow: 0 8px 16px rgba(80, 58, 40, 0.035);
}

.space-utility-card-access {
  padding: 0.82rem 0.9rem;
  background: linear-gradient(180deg, rgba(255, 250, 246, 0.94), rgba(245, 237, 228, 0.88));
}

.space-utility-card-access[open] {
  gap: 0.72rem;
}

.space-utility-card-access .space-fold-body {
  padding-top: 0.68rem;
}

.access-compact-panel,
.access-panel-body,
.storage-compact-panel {
  display: grid;
}

.access-compact-panel {
  gap: 0.56rem;
}

.access-panel-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(86px, 1fr));
  gap: 0.36rem;
}

.access-panel-tab {
  display: grid;
  gap: 0.06rem;
  min-height: 2.2rem;
  padding: 0.3rem 0.46rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.42);
  color: var(--text-main);
  text-align: left;
}

.access-panel-tab span {
  font-family: var(--font-heading);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.15;
}

.access-panel-tab small {
  overflow: hidden;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.access-panel-tab.active {
  border-color: rgba(142, 116, 88, 0.28);
  background: rgba(255, 247, 237, 0.78);
}

.access-panel-body {
  gap: 0.44rem;
}

.access-panel-head,
.access-code-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.7rem;
}

.access-panel-head h3 {
  margin: 0;
}

.access-panel-head .badge,
.access-code-row .button-subtle {
  flex: 0 0 auto;
}

.access-code-row .space-inline-code {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.46rem 0.58rem;
}

.access-code-row .button-subtle {
  min-height: 2.08rem;
  padding-inline: 0.62rem;
}

.space-utility-card-access .space-card-intro,
.space-utility-card-access .space-access-form-note {
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.space-tools-section .space-card-intro,
.space-tools-section .space-access-form-note,
.storage-lead,
.storage-backup-copy .section-copy {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.space-utility-card-access .space-access-form {
  gap: 0.48rem;
}

.space-utility-card-access .space-form label {
  gap: 0.34rem;
}

.space-utility-card-access input {
  min-height: 2.08rem;
  padding-block: 0.34rem;
}

.access-inline-form {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.access-inline-form button,
.access-fixed-form button {
  min-height: 2.08rem;
  padding-inline: 0.64rem;
}

.space-utility-card-access .space-access-form-otp {
  padding-top: 0.55rem;
}

.access-fixed-form {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.access-fixed-form button {
  grid-column: 1 / -1;
}

.space-utility-card-memory {
  background: linear-gradient(180deg, rgba(252, 249, 242, 0.94), rgba(244, 238, 225, 0.9));
}

.storage-compact-panel {
  gap: 0.56rem;
}

.storage-lead {
  max-width: 38ch;
}

.storage-meter {
  height: 0.42rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(95, 74, 55, 0.11);
}

.storage-meter-fill {
  height: 100%;
  min-width: 0.42rem;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(134, 166, 126, 0.88), rgba(195, 169, 102, 0.86));
  transition: width 180ms ease-out;
}

.storage-meter-fill.warning {
  background: linear-gradient(90deg, rgba(196, 148, 78, 0.9), rgba(198, 117, 80, 0.86));
}

.storage-meter-fill.danger {
  background: linear-gradient(90deg, rgba(185, 91, 72, 0.92), rgba(142, 67, 61, 0.9));
}

.storage-stat-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem 0.56rem;
  margin: 0;
}

.storage-stat-list-compact .storage-stat-item {
  padding-block: 0.44rem;
}

.storage-stat-item {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  padding: 0.42rem 0;
  border-top: 1px solid rgba(95, 74, 55, 0.12);
}

.storage-stat-item dt,
.storage-stat-item dd {
  margin: 0;
}

.storage-stat-item dt {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.storage-stat-item dd {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
}

.storage-backup-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.62rem;
  padding-top: 0.56rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.14);
}

.storage-backup-copy {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.storage-backup-row .button-subtle {
  flex: 0 0 auto;
  padding-inline: 0.66rem;
}

.space-utility-card-advanced {
  background: linear-gradient(180deg, rgba(247, 242, 236, 0.94), rgba(240, 233, 224, 0.9));
}

.space-utility-card[open] {
  box-shadow: 0 14px 24px rgba(80, 58, 40, 0.05);
}

.space-section-heading .section-title,
.space-advanced-summary .section-title {
  margin-bottom: 0.55rem;
  font-size: var(--type-section-title-size);
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.space-fact-grid,
.space-storage-grid {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.space-fact-card {
  display: grid;
  gap: 0.45rem;
}

.space-fold-card {
  gap: 0;
}

.storage-more-fold {
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 14px;
  padding: 0.5rem 0.56rem;
  background: rgba(255, 255, 255, 0.32);
}

.storage-more-summary {
  align-items: center;
  gap: 0.5rem;
}

.storage-more-summary .space-fold-copy-block {
  gap: 0;
}

.storage-more-summary .space-fold-copy-block .eyebrow {
  margin: 0;
}

.storage-more-summary .space-fold-toggle {
  min-height: 1.72rem;
  padding: 0.2rem 0.5rem;
}

.storage-more-body {
  gap: 0.44rem;
  padding-top: 0.52rem;
  border-top-style: dashed;
}

.space-fold-card[open] {
  gap: 1rem;
}

.space-fold-summary {
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  list-style: none;
  cursor: pointer;
  transition: transform 180ms ease;
}

.space-fold-summary::-webkit-details-marker {
  display: none;
}

.space-fold-summary:focus-visible {
  outline: 2px solid rgba(201, 111, 74, 0.22);
  outline-offset: 0.25rem;
  border-radius: 24px;
}

.space-fold-summary:hover .space-fold-toggle,
.space-fold-summary:focus-visible .space-fold-toggle,
.space-fold-card[open] > .space-fold-summary .space-fold-toggle {
  border-color: rgba(201, 111, 74, 0.22);
  background: rgba(255, 249, 243, 0.92);
}

.space-fold-summary:hover .space-fold-arrow,
.space-fold-summary:focus-visible .space-fold-arrow,
.space-fold-card[open] > .space-fold-summary .space-fold-arrow {
  border-color: rgba(134, 86, 62, 0.96);
}

.space-fold-copy-block {
  gap: 0.35rem;
}

.space-utility-summary {
  gap: 0.8rem;
}

.space-fold-meta {
  justify-items: end;
  gap: 0.7rem;
}

.space-fold-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.4rem;
  padding: 0.48rem 0.86rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgba(95, 74, 55, 0.12);
  background: rgba(255, 255, 255, 0.68);
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}

.space-fold-toggle-strong {
  background: rgba(255, 250, 244, 0.9);
}

.space-fold-arrow {
  width: 0.68rem;
  height: 0.68rem;
  border-right: 1.5px solid rgba(122, 92, 74, 0.8);
  border-bottom: 1.5px solid rgba(122, 92, 74, 0.8);
  transform: rotate(45deg) translateY(-1px);
  transform-origin: center;
  transition: transform 180ms ease, border-color 180ms ease;
}

.space-fold-card[open] > .space-fold-summary .space-fold-arrow {
  transform: rotate(225deg) translateY(-1px);
}

.space-utility-summary h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.space-utility-summary .space-fold-copy {
  max-width: 22ch;
  color: rgba(93, 76, 66, 0.62);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.space-claim-summary .space-fold-copy {
  max-width: 34rem;
  color: rgba(93, 76, 66, 0.62);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.space-utility-summary .badge {
  padding: 0.3rem 0.64rem;
  background: rgba(255, 255, 255, 0.54);
  font-size: var(--type-meta-size);
}

.space-utility-card .space-fold-toggle {
  min-height: 2.1rem;
  padding: 0.38rem 0.74rem;
  background: rgba(255, 255, 255, 0.54);
}

.space-fold-title {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.space-fold-body {
  border-top: 1px solid rgba(95, 74, 55, 0.08);
  padding-top: 1.05rem;
}

.space-claim-fold {
  gap: 0.88rem;
  padding: 0.92rem 0.96rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.44);
  border-color: rgba(95, 74, 55, 0.1);
}

.space-claim-fold-top {
  gap: 0.7rem;
  padding: 0.82rem 0.88rem;
  border-radius: 20px;
}

.space-claim-fold-top .space-fold-summary {
  gap: 0.72rem;
}

.space-claim-fold-top .space-fold-copy-block {
  gap: 0.42rem;
}

.space-claim-fold-top .space-fold-title {
  font-size: var(--type-l5-size);
  line-height: var(--type-l5-line);
}

.space-claim-fold-top .space-fold-copy {
  font-size: var(--type-supporting-size);
  line-height: 1.5;
}

.space-claim-fold-top .badge {
  padding: 0.28rem 0.6rem;
}

.space-claim-fold-top .space-fold-toggle {
  min-height: 2rem;
  padding: 0.3rem 0.7rem;
}

.space-claim-fold-top:not([open]) .space-fold-copy {
  display: none;
}

.space-claim-fold-top:not([open]) .space-fold-copy-block {
  gap: 0.18rem;
}

.space-claim-fold .space-fold-meta {
  gap: 0.55rem;
}

.space-claim-fold .badge-row {
  justify-content: flex-end;
}

.space-claim-fold .space-fold-toggle {
  min-height: 2.18rem;
  padding: 0.38rem 0.76rem;
}

.space-claim-fold-body {
  gap: 0.95rem;
  padding-top: 0.9rem;
  border-top-style: dashed;
}

.space-pending-stage .space-fold-body {
  gap: 1rem;
}

.space-utility-card .space-fold-body {
  border-top-style: dashed;
  padding-top: 0.72rem;
}

.space-fold-summary-compact h3 {
  margin: 0;
}

.space-fact-card strong {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.space-fact-card p,
.space-empty-card p,
.space-member-supporting {
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  color: var(--text-soft);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.space-member-grid,
.space-reward-member-grid {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.space-member-card {
  gap: 0.9rem;
  align-content: start;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(250, 244, 236, 0.74));
}

.space-member-card:nth-child(2n) {
  background: linear-gradient(180deg, rgba(252, 251, 247, 0.78), rgba(244, 240, 233, 0.74));
}

.member-head,
.reward-card-head,
.space-reward-stage-head,
.space-reward-tier-head,
.space-subsection-heading,
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 0.9rem;
  align-items: flex-start;
}

.reward-card-copy {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.premium-card-aside {
  display: grid;
  justify-items: end;
  gap: 0.2rem;
  margin-left: auto;
  max-width: 52%;
  text-align: right;
}

.space-page .premium-card-aside .badge {
  height: 1.5rem;
  padding: 0 0.5rem;
  font-size: var(--type-eyebrow-size);
  line-height: 1.1;
}

.premium-card-meta {
  display: grid;
  justify-items: end;
  gap: 0.06rem;
  padding-top: 0;
}

.space-reward-stage-copy {
  gap: 0.32rem;
}

.reward-card-kicker {
  color: rgba(90, 69, 58, 0.72);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  letter-spacing: var(--type-eyebrow-spacing);
  line-height: 1.4;
}

.space-member-summary {
  margin-top: 0.35rem;
}

.space-member-stat-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.55rem;
}

.space-member-stat-pill {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 2.35rem;
  padding: 0.45rem 0.72rem;
  border-radius: 18px;
  background: rgba(255, 250, 245, 0.72);
  border: 1px solid rgba(95, 74, 55, 0.08);
  color: rgba(93, 73, 63, 0.9);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.space-member-meta {
  gap: 0.28rem;
  min-height: 4.15rem;
  align-content: start;
  padding-top: 0.72rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.12);
}

.space-reward-grid,
.space-account-grid,
.space-storage-grid-shell,
.space-advanced-grid {
  align-items: start;
}

.space-utility-card .space-access-grid,
.space-utility-card .space-advanced-grid {
  grid-template-columns: 1fr;
}

.space-utility-card .space-access-card,
.space-utility-card .space-fact-card,
.space-utility-card .space-inline-panel,
.space-utility-card .space-empty-card {
  padding: 0.88rem;
  background: rgba(255, 255, 255, 0.4);
  box-shadow: none;
  border-color: rgba(95, 74, 55, 0.08);
}

.space-utility-card .space-inline-code {
  background: rgba(255, 255, 255, 0.62);
}

.space-utility-card .space-subsection-heading h3,
.space-utility-card .space-fold-title {
  font-size: var(--type-l5-size);
}

.space-utility-card .info-row {
  gap: 0.6rem;
  padding-bottom: 0.62rem;
}

.space-utility-card .danger-card {
  background: rgba(255, 247, 243, 0.6);
}

.space-reward-form-grid,
.space-access-grid {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.space-access-form {
  gap: 0.82rem;
}

.space-access-form-otp {
  padding-top: 0.9rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.12);
}

.space-form label {
  display: grid;
  gap: 0.55rem;
}

.space-field-block {
  gap: 0.44rem;
}

.space-page .button-row {
  align-items: center;
}

.reward-form-card {
  display: grid;
  gap: 0.66rem;
  align-content: start;
  padding: 0.9rem;
  background: linear-gradient(180deg, var(--panel-bg-strong), var(--card-bg-soft));
}

.space-reward-form-grid {
  grid-template-columns: minmax(0, 1fr);
  gap: 0.62rem;
}

.reward-form-support {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  color: var(--text-soft);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.reward-form-meta,
.reward-form-submit-copy,
.space-stage-support {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.reward-form-fields {
  display: grid;
  gap: 0.48rem;
}

.reward-form-fields-premium {
  gap: 0.42rem;
}

.reward-editor-card .space-field-block > .muted {
  font-size: var(--type-l4-size);
  line-height: var(--type-l4-line);
}

.reward-form-card input,
.reward-form-card select {
  min-height: 2.42rem;
  padding: 0.48rem 0.72rem;
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.reward-form-card textarea {
  min-height: 3.72rem;
  height: 3.72rem;
  padding: 0.52rem 0.74rem;
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.reward-form-cost-field {
  max-width: 10rem;
}

.reward-form-submit-row {
  gap: 0.34rem;
  padding-top: 0.42rem;
  border-top: 1px dashed var(--card-border-soft);
}

.reward-form-actions {
  padding-top: 0;
  border-top: none;
}

.reward-form-card .button-solid,
.reward-form-card .button-subtle {
  min-height: 2.08rem;
  padding: 0.56rem 0.78rem;
  font-size: var(--type-meta-size);
  line-height: 1.2;
}

.space-reward-feedback {
  margin: 0;
  padding: 0.02rem 0.1rem 0;
}

.space-reward-feedback-inline {
  width: 100%;
  margin: 0;
  padding: 0.42rem 0.1rem 0;
}

.reward-shelf-card {
  background: linear-gradient(180deg, var(--panel-bg-strong), var(--card-bg-soft));
}

.reward-pool-unified-card {
  gap: 0.58rem;
}

.reward-pool-unified-card .space-subsection-heading {
  margin-bottom: 0;
}

.reward-pool-unified-card .reward-compact-list {
  max-height: min(44vh, 24rem);
  overflow: auto;
  padding-right: 0.22rem;
}

.reward-shelf-heading-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.42rem;
  margin-left: auto;
}

.reward-shelf-manage-button,
.reward-compact-manage-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.78rem;
  padding: 0.22rem 0.54rem;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--card-bg-raised) 62%, transparent);
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 500;
  line-height: var(--type-meta-line);
}

.reward-shelf-manage-button:disabled,
.reward-compact-manage-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.reward-shelf-card-premium {
  background: linear-gradient(180deg, var(--warning-panel), var(--card-bg-soft));
}

.reward-card {
  gap: 0.82rem;
  background: var(--panel-bg-strong);
}

.reward-card-actions {
  gap: 0.58rem;
}

.reward-deposit-actions {
  grid-template-columns: repeat(3, minmax(0, 0.48fr)) minmax(7rem, 1fr);
}

.reward-assist-section {
  display: grid;
  gap: 0.82rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--card-border-soft);
}

.reward-assist-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.88rem;
}

.reward-assist-head h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  color: var(--text-main);
}

.reward-assist-card {
  background: linear-gradient(180deg, var(--sage-panel), var(--card-bg-soft));
}

.reward-shared-card {
  background: linear-gradient(180deg, var(--accent-panel), var(--card-bg-soft));
}

.reward-assist-actions {
  grid-template-columns: repeat(3, minmax(0, 0.48fr)) minmax(7.6rem, 1fr);
}

.reward-assist-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.18rem;
  padding: 0.42rem 0.62rem;
  border: 1px solid var(--card-border-soft);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--card-bg-raised) 68%, transparent);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: 1.15;
  text-align: center;
}

.reward-scope-field {
  max-width: 14rem;
}

.reward-scope-toggle {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.42rem;
}

.reward-scope-toggle label {
  cursor: pointer;
}

.reward-scope-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.reward-scope-toggle span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 2.02rem;
  padding: 0.3rem 0.52rem;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--card-bg-raised) 62%, transparent);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
}

.reward-scope-toggle input:checked + span {
  border-color: var(--active-item-border);
  background: var(--active-item-bg);
  color: var(--text-main);
}

.reward-deposit-actions .compact-action {
  min-height: 2.18rem;
  padding: 0.42rem 0.58rem;
  font-size: var(--type-meta-size);
  line-height: 1.15;
  white-space: nowrap;
}

.reward-card-actions > .button-subtle {
  min-height: 2.18rem;
  padding: 0.46rem 0.82rem;
  font-size: var(--type-meta-size);
  line-height: 1.15;
}

.reward-deposit-progress {
  width: 100%;
  height: 0.44rem;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: color-mix(in srgb, var(--card-border-soft) 70%, transparent);
}

.reward-deposit-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-strong, var(--accent-dark)), var(--sage-strong, var(--success)));
  transition: width 180ms ease;
}

.reward-card-meta {
  padding-top: 0.1rem;
}

.reward-selected-note {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: 1.3;
}

.reward-command-panel {
  display: grid;
  gap: 0.38rem;
  padding: 0.42rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(255, 252, 247, 0.68), rgba(245, 238, 229, 0.5)),
    radial-gradient(circle at 92% 18%, color-mix(in srgb, var(--sage-glow) 68%, transparent), transparent 28%);
}

.reward-command-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.3rem;
}

.reward-command-stat {
  display: grid;
  gap: 0.08rem;
  min-height: 2.72rem;
  align-content: center;
  padding: 0.38rem 0.42rem;
  border: 1px solid rgba(95, 74, 55, 0.07);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.42);
}

.reward-command-stat span,
.reward-recent-item small {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: 0.68rem;
  line-height: 1.18;
}

.reward-command-stat strong {
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: 0.92rem;
  font-weight: 700;
  line-height: 1.16;
}

.reward-command-stat-primary strong {
  color: var(--accent-strong, var(--accent-dark));
}

.reward-command-stat-claim {
  text-align: left;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
}

.reward-command-stat-claim.is-enabled {
  cursor: pointer;
}

.reward-command-stat-claim.is-enabled:hover,
.reward-command-stat-claim.is-enabled:focus-visible {
  border-color: color-mix(in srgb, var(--active-item-border) 78%, transparent);
  background: color-mix(in srgb, var(--accent-panel) 40%, rgba(255, 255, 255, 0.42));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-ring) 66%, transparent);
}

.reward-command-actions {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.58rem;
  flex-wrap: wrap;
}

.reward-filter-trigger {
  min-height: 2.08rem;
  padding: 0.34rem 0.72rem;
}

.reward-keyword-controls {
  display: grid;
  gap: 0.52rem;
  padding: 0.72rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.34);
}

.reward-keyword-control-row {
  display: grid;
  grid-template-columns: 2.8rem minmax(0, 1fr);
  gap: 0.48rem;
  align-items: center;
}

.reward-keyword-control-label {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 700;
  line-height: 1.2;
}

.reward-keyword-pill-row,
.reward-keyword-control-actions {
  display: flex;
  align-items: center;
  gap: 0.34rem;
  flex-wrap: wrap;
}

.reward-keyword-inline-divider {
  width: 1px;
  height: 1.28rem;
  margin-inline: 0.08rem;
  background: rgba(95, 74, 55, 0.18);
}

.reward-keyword-control-actions {
  justify-content: flex-end;
}

.reward-filter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.86rem;
  padding: 0.28rem 0.56rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.44);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 700;
  line-height: 1.12;
}

.reward-filter-pill.active {
  border-color: var(--active-item-border);
  background: var(--active-item-bg);
  color: var(--text-main);
  box-shadow: 0 8px 16px var(--accent-shadow-soft);
}

.reward-range-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.52rem;
  padding-top: 0.52rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.1);
}

.reward-range-panel label {
  display: grid;
  grid-template-columns: minmax(4.6rem, auto) repeat(2, minmax(0, 1fr));
  gap: 0.36rem;
  align-items: center;
}

.reward-range-panel span {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 700;
}

.reward-range-panel input {
  min-height: 2rem;
  padding: 0.34rem 0.52rem;
  border-radius: 12px;
  font-size: var(--type-meta-size);
}

.reward-keyword-shell,
.reward-keyword-cloud,
.reward-selected-card,
.reward-task-flow,
.reward-task-section,
.reward-task-list,
.reward-recent-strip,
.reward-recent-list,
.reward-task-card,
.reward-task-actions {
  display: grid;
}

.reward-keyword-shell {
  gap: 0.82rem;
  min-height: 13rem;
  padding: 1rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 22px;
  background:
    radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--accent-panel) 82%, transparent), transparent 30%),
    radial-gradient(circle at 88% 78%, color-mix(in srgb, var(--bg-deep) 42%, transparent), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.48), rgba(255, 255, 255, 0.28));
  box-shadow: var(--shadow-card);
}

.reward-keyword-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.82rem;
}

.reward-keyword-head-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.46rem;
  flex-wrap: wrap;
}

.reward-keyword-head h3 {
  margin: 0;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  line-height: var(--type-l5-line);
}

.reward-keyword-cloud {
  display: flex;
  align-content: flex-start;
  gap: 0.42rem;
  flex-wrap: wrap;
}

.reward-keyword-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.28rem;
  max-width: 100%;
  min-height: 2.04rem;
  padding: 0.36rem 0.64rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: var(--radius-pill);
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-eyebrow-size);
  font-weight: 700;
  line-height: 1.16;
  text-align: center;
  box-shadow: 0 8px 18px rgba(95, 74, 55, 0.07);
  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
}

.reward-keyword-title,
.reward-keyword-metric {
  min-width: 0;
}

.reward-keyword-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reward-keyword-metric {
  color: color-mix(in srgb, var(--text-main) 70%, var(--text-soft));
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 800;
  line-height: 1.1;
  white-space: nowrap;
}

.reward-keyword-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(95, 74, 55, 0.1);
}

.reward-keyword-chip.active {
  border-color: var(--active-item-border);
  box-shadow: 0 0 0 3px var(--accent-ring), 0 12px 24px rgba(95, 74, 55, 0.12);
}

.reward-keyword-chip-personal {
  background: linear-gradient(180deg, var(--accent-panel), color-mix(in srgb, var(--accent-panel) 64%, var(--surface-card)));
}

.reward-keyword-chip-assist {
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg-deep) 62%, var(--surface-card)), color-mix(in srgb, var(--mist) 72%, var(--surface-card)));
}

.reward-keyword-chip-shared {
  border-color: color-mix(in srgb, var(--accent) 22%, var(--bg-deep));
  background:
    radial-gradient(circle at 18% 26%, color-mix(in srgb, var(--accent-panel) 90%, var(--accent)) 0%, transparent 50%),
    radial-gradient(circle at 52% 46%, #eadcf6 0%, transparent 54%),
    radial-gradient(circle at 84% 72%, color-mix(in srgb, var(--bg-deep) 78%, var(--mist)) 0%, transparent 54%),
    linear-gradient(110deg,
      color-mix(in srgb, var(--accent-panel) 82%, var(--surface-card)) 0%,
      #eadcf6 52%,
      color-mix(in srgb, var(--bg-deep) 64%, var(--surface-card)) 100%);
}

.reward-selected-card {
  gap: 0.72rem;
  align-content: start;
  padding: 0.96rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(255, 253, 249, 0.84), rgba(248, 241, 233, 0.72));
  box-shadow: var(--shadow-card);
}

.reward-selected-card-personal {
  background: linear-gradient(180deg, var(--accent-panel), rgba(255, 253, 249, 0.82));
}

.reward-selected-card-assist {
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg-deep) 44%, var(--surface-card)), rgba(255, 253, 249, 0.8));
}

.reward-selected-card-shared {
  border-color: color-mix(in srgb, var(--accent) 18%, var(--bg-deep));
  background:
    radial-gradient(circle at 12% 8%, color-mix(in srgb, var(--accent-panel) 82%, transparent), transparent 34%),
    radial-gradient(circle at 52% 44%, rgba(234, 220, 246, 0.68), transparent 42%),
    radial-gradient(circle at 92% 92%, color-mix(in srgb, var(--bg-deep) 42%, transparent), transparent 38%),
    linear-gradient(125deg,
      color-mix(in srgb, var(--accent-panel) 66%, var(--surface-card)) 0%,
      rgba(234, 220, 246, 0.62) 48%,
      color-mix(in srgb, var(--bg-deep) 30%, var(--surface-card)) 100%);
}

.reward-task-flow {
  gap: 1rem;
}

.reward-task-section {
  gap: 0.68rem;
}

.reward-task-section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.8rem;
}

.reward-task-section-head h3 {
  margin: 0;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  line-height: var(--type-l5-line);
}

.reward-task-list {
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.72rem;
}

.reward-task-card {
  gap: 0.72rem;
  align-content: start;
  min-height: 13.5rem;
  padding: 0.88rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(255, 253, 249, 0.84), rgba(248, 241, 233, 0.72));
  box-shadow: var(--shadow-card);
}

.reward-task-section-claimable .reward-task-card {
  background: linear-gradient(180deg, var(--warning-panel), rgba(255, 253, 249, 0.84));
  border-color: rgba(201, 111, 74, 0.18);
}

.reward-task-card-shared {
  background: linear-gradient(180deg, var(--accent-panel), rgba(255, 253, 249, 0.8));
}

.reward-task-card-assist {
  background: linear-gradient(180deg, var(--sage-panel), rgba(255, 253, 249, 0.78));
}

.reward-task-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.72rem;
}

.reward-task-card-head > div {
  display: grid;
  gap: 0.2rem;
  min-width: 0;
}

.reward-task-card-head strong,
.reward-recent-item strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
}

.reward-task-card-head .badge {
  flex: 0 0 auto;
}

.reward-task-actions {
  gap: 0.52rem;
  margin-top: auto;
}

.reward-primary-action {
  width: 100%;
  min-height: 2.72rem;
}

.reward-quick-chip-row {
  display: flex;
  gap: 0.42rem;
  flex-wrap: wrap;
}

.reward-quick-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3rem;
  min-height: 2.08rem;
  padding: 0.36rem 0.66rem;
  border: 1px solid rgba(95, 74, 55, 0.12);
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.5);
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 700;
}

.reward-quick-chip:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.reward-command-empty {
  align-items: start;
}

.reward-command-empty .button-solid {
  width: fit-content;
}

.reward-recent-strip {
  gap: 0.66rem;
  padding-top: 0.85rem;
  border-top: 1px dashed var(--card-border-soft);
}

.reward-recent-list {
  gap: 0.52rem;
}

.reward-recent-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.64rem;
  align-items: start;
  padding: 0.64rem 0.72rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.38);
}

.reward-recent-item > div {
  display: grid;
  gap: 0.16rem;
  min-width: 0;
}

.reward-recent-item p {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
}

.reward-recent-empty {
  padding: 0.72rem;
  background: rgba(255, 255, 255, 0.34);
  box-shadow: none;
}

.reward-compact-list,
.reward-member-strip-list,
.reward-member-strip-preview {
  display: grid;
}

.reward-compact-list,
.reward-member-strip-list {
  gap: 0.48rem;
}

.reward-member-strip-list {
  grid-template-columns: 1fr;
  align-items: stretch;
}

.reward-compact-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8.2rem, auto) auto;
  gap: 0.56rem;
  align-items: center;
  padding: 0.58rem 0.66rem;
  border-radius: 20px;
  border: 1px solid var(--card-border-soft);
  background: var(--panel-bg);
}

.reward-compact-row-premium {
  border-color: var(--warning-border);
  background:
    linear-gradient(135deg, var(--card-bg-popover), var(--warning-panel)),
    radial-gradient(circle at top right, var(--accent-gold), transparent 34%);
  box-shadow: var(--shadow-card);
}

.reward-compact-main {
  display: grid;
  gap: 0.08rem;
  min-width: 0;
}

.reward-compact-main strong {
  overflow-wrap: anywhere;
  font-family: var(--font-heading);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: 1.26;
  letter-spacing: -0.02em;
}

.reward-compact-main p,
.reward-compact-meta {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.reward-compact-main p {
  overflow-wrap: anywhere;
}

.reward-compact-meta {
  display: grid;
  gap: 0.1rem;
}

.reward-compact-manage-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.38rem;
}

.reward-pool-viewer-shell {
  display: grid;
  gap: 0.72rem;
}

.reward-pool-unified-shell {
  gap: 0.82rem;
}

.reward-pool-unified-card {
  display: grid;
  gap: 0.72rem;
}

.reward-pool-viewer-members {
  gap: 0.62rem;
}

.reward-member-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.44rem;
  align-items: start;
  padding: 0.7rem 0.76rem;
  border-radius: 18px;
  border: 1px solid var(--card-border-soft);
  background: linear-gradient(135deg, var(--panel-bg-strong), var(--card-bg-soft));
  box-shadow: var(--shadow-card);
}

.reward-pool-viewer-member {
  width: 100%;
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.reward-pool-viewer-member:hover {
  transform: translateY(-1px);
  border-color: var(--active-item-border);
}

.reward-pool-viewer-member.active {
  border-color: var(--active-item-border);
  background:
    linear-gradient(135deg, var(--card-bg-popover), var(--active-item-bg)),
    radial-gradient(circle at top right, var(--accent-ring), transparent 34%);
  box-shadow: 0 14px 28px rgba(88, 66, 45, 0.06);
}

.reward-pool-viewer-member.active .reward-member-strip-mark {
  background: var(--active-item-bg);
  border-color: var(--active-item-border);
}

.reward-member-strip-person {
  display: flex;
  align-items: center;
  gap: 0.58rem;
  min-width: 0;
}

.reward-member-strip-person h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.28;
  letter-spacing: -0.02em;
}

.reward-member-strip-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.12rem;
  width: 2.12rem;
  height: 2.12rem;
  border-radius: 999px;
  background: var(--success-panel);
  color: var(--text-main);
  font-family: var(--font-heading);
  font-weight: 700;
}

.reward-member-strip-preview {
  gap: 0.18rem;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.reward-chip-list {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.reward-chip {
  display: grid;
  gap: 0.18rem;
  align-items: start;
  width: fit-content;
  padding: 0.5rem 0.78rem;
  border-radius: 18px;
  border: 1px solid rgba(95, 74, 55, 0.12);
  background: rgba(255, 255, 255, 0.74);
}

.reward-chip strong {
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: var(--type-l5-line);
  letter-spacing: -0.02em;
}

.reward-chip span {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.premium-card {
  border-color: rgba(181, 138, 56, 0.24);
  background:
    linear-gradient(135deg, rgba(255, 252, 246, 0.94), rgba(246, 239, 229, 0.82)),
    radial-gradient(circle at top right, rgba(232, 216, 166, 0.24), transparent 30%);
  box-shadow: 0 14px 28px rgba(163, 118, 35, 0.1);
}

.premium-chip {
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.92), rgba(245, 236, 221, 0.86));
}

.space-inline-code {
  gap: 0.35rem;
  padding: 0.9rem 1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px dashed rgba(95, 74, 55, 0.18);
}

.space-inline-code strong {
  font-size: var(--type-card-title-size);
  letter-spacing: 0.04em;
}

.space-inline-panel {
  gap: 0.85rem;
  padding: 1rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--line);
}

.space-reward-member-card {
  gap: 0.9rem;
  background: linear-gradient(180deg, rgba(255, 253, 249, 0.82), rgba(248, 241, 233, 0.78));
}

.space-reward-member-top {
  padding-bottom: 0.9rem;
  border-bottom: 1px solid rgba(95, 74, 55, 0.08);
}

.reward-tier-block {
  gap: 0.6rem;
}

.reward-claim-list {
  gap: 0.75rem;
}

.reward-claim-card {
  grid-template-columns: auto 1fr;
  gap: 0.85rem;
  align-items: start;
  background: linear-gradient(180deg, rgba(255, 252, 248, 0.82), rgba(248, 241, 233, 0.76));
}


.reward-editor-card {
  max-width: 38rem;
}

.reward-editor-tier-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.34rem;
  padding: 0.22rem;
  border: 1px solid var(--card-border-soft);
  border-radius: 18px;
  background: var(--panel-bg);
}

.reward-editor-tier-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.32rem;
  min-height: 2.46rem;
  padding: 0.5rem 0.64rem;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  color: var(--text-soft);
  cursor: pointer;
  transition: background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease;
}

.reward-editor-tier-tab:hover {
  transform: translateY(-1px);
  color: var(--text-main);
}

.reward-editor-tier-tab.active {
  border-color: var(--active-item-border);
  background: var(--active-item-bg);
  color: var(--text-main);
  box-shadow: var(--shadow-card);
}

.reward-editor-tier-label {
  font-family: var(--font-heading);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
}

.reward-editor-tier-note {
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
}

.reward-shelf-tier-tabs {
  margin: 0.72rem 0;
}

.reward-editor-form {
  display: grid;
  gap: 0.72rem;
}
.reward-claim-body {
  display: grid;
  gap: 0.45rem;
}

.reward-claim-body .reward-card-copy {
  width: 100%;
}

.reward-claim-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
}

.reward-claim-title-row strong {
  min-width: 0;
}

.reward-claim-title-row .badge {
  flex: 0 0 auto;
}

.reward-claim-copy,
.reward-claim-meta {
  font-family: var(--font-body);
  line-height: var(--type-supporting-line);
}

.reward-claim-copy {
  font-size: var(--type-supporting-size);
  letter-spacing: var(--type-supporting-spacing);
}

.reward-claim-meta {
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.reward-claim-marker {
  width: 0.72rem;
  height: 0.72rem;
  margin-top: 0.55rem;
  border-radius: 999px;
  background: rgba(201, 111, 74, 0.7);
  box-shadow: 0 0 0 0.35rem rgba(201, 111, 74, 0.12);
}

.space-advanced-shell {
  gap: 1rem;
  background: linear-gradient(180deg, rgba(247, 241, 233, 0.92), rgba(242, 234, 225, 0.88));
}

.space-advanced-grid {
  gap: 0.72rem;
}

.space-advanced-status-card,
.space-debug-fold,
.space-advanced-grid .danger-card {
  gap: 0.62rem;
}

.space-debug-fold {
  gap: 0;
}

.space-debug-fold[open] {
  gap: 0.68rem;
}

.space-debug-summary {
  align-items: center;
  gap: 0.72rem;
}

.space-debug-summary h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: var(--type-l5-line);
}

.space-debug-summary .space-fold-meta {
  display: flex;
  align-items: center;
  gap: 0.52rem;
}

.space-debug-body {
  gap: 0.58rem;
  padding-top: 0.66rem;
  border-top-style: dashed;
}

.space-advanced-summary {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  list-style: none;
  cursor: pointer;
}

.space-advanced-summary::-webkit-details-marker {
  display: none;
}

.space-advanced-copy {
  margin: 0;
}

.feedback-message.success {
  color: var(--success);
}

.feedback-message.danger,
.danger-button {
  color: var(--danger);
}

.info-row {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(95, 74, 55, 0.08);
}

.info-row:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.danger-card {
  align-content: start;
}

@media (max-width: 1080px) {
  .space-reward-hub-head,
  .space-advanced-grid {
    grid-template-columns: 1fr;
  }

  .space-main-summary-intro {
    grid-template-columns: 1fr;
  }

  .space-utility-band-head {
    align-items: start;
    flex-direction: column;
  }

  .space-utility-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .space-page {
    --space-page-gap: 1.1rem;
    --space-stack-gap: 1rem;
  }

  .space-main-summary-shell {
    gap: 0.56rem;
  }

  .space-main-card,
  .space-utility-card {
    padding: 0.82rem;
  }

  .space-reward-hub,
  .space-reward-workbench,
  .space-reward-stage,
  .space-reward-form-grid,
  .reward-form-submit-row,
  .reward-shelf-card,
  .reward-pool-unified-card {
    gap: 0.52rem;
  }

  .space-main-summary-intro,
  .space-reward-hub-head,
  .space-section-heading,
  .space-fold-summary,
  .space-subsection-heading,
  .member-head,
  .space-reward-stage-head,
  .space-reward-tier-head,
  .info-row,
  .reward-card-head,
  .space-utility-summary,
  .space-advanced-summary {
    flex-direction: column;
    align-items: flex-start;
  }

  .reward-editor-card > .space-subsection-heading {
    flex-direction: row;
    align-items: flex-start;
  }

  .premium-card .reward-card-head {
    flex-direction: row;
    align-items: flex-start;
  }

  .premium-card-aside {
    max-width: 48%;
  }

  .reward-editor-card > .space-subsection-heading .badge,
  .reward-shelf-card > .space-subsection-heading .badge {
    margin-left: auto;
  }

  .reward-shelf-card > .space-subsection-heading .badge {
    margin-left: 0;
  }

  .reward-shelf-heading-actions {
    margin-left: auto;
  }

  .reward-shelf-card > .space-subsection-heading {
    flex-direction: row;
    align-items: flex-start;
  }

  .space-hero-title {
    max-width: none;
  }

  .space-fold-meta {
    width: 100%;
    justify-items: start;
  }

  .space-meta-line {
    flex-direction: column;
    gap: 0.16rem;
  }

  .space-utility-summary .space-fold-copy {
    max-width: none;
  }

  .space-claim-summary .space-fold-copy {
    max-width: none;
  }

  .space-utility-grid {
    grid-template-columns: 1fr;
  }

  .space-member-stat-grid {
    grid-template-columns: 1fr;
  }

  .space-reward-form-grid,
  .space-reward-hub-tabs,
  .space-access-grid,
  .space-member-grid,
  .space-reward-member-grid,
  .space-fact-grid,
  .space-storage-grid,
  .space-pending-grid,
  .space-current-catch-card,
  .reward-claim-list {
    gap: 0.8rem;
  }

  .reward-claim-card {
    grid-template-columns: 1fr;
  }

  .reward-claim-marker {
    display: none;
  }

  .space-page .badge,
  .space-page .pill {
    padding: 0.34rem 0.7rem;
    font-size: var(--type-meta-size);
  }

  .space-page .button-row {
    width: 100%;
  }

  .space-page .button-row > * {
    flex: 1 1 100%;
    width: 100%;
  }

  .storage-backup-row {
    align-items: stretch;
    flex-direction: column;
  }

  .storage-backup-row .button-subtle {
    width: 100%;
  }

  .space-claim-fold-top .space-fold-summary {
    gap: 0.6rem;
    flex-direction: row;
    align-items: flex-start;
  }

  .space-debug-summary {
    flex-direction: row;
    align-items: center;
  }

  .space-debug-summary .space-fold-meta {
    width: auto;
    margin-left: auto;
    justify-items: end;
  }

  .space-claim-fold-top .space-fold-meta {
    width: auto;
    margin-left: auto;
    justify-items: end;
  }

  .space-claim-fold-top .space-fold-meta .badge-row {
    display: none;
  }

  .space-reward-hub-pills {
    justify-content: flex-start;
  }

  .space-reward-hub-tab {
    align-items: center;
    min-height: 2.78rem;
    padding: 0.52rem 0.64rem;
    border-radius: 14px;
  }

  .space-reward-hub-tab-copy {
    align-items: baseline;
    gap: 0.32rem;
    flex-wrap: nowrap;
  }

  .space-reward-hub-tab-note {
    white-space: nowrap;
  }

  .reward-command-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.26rem;
  }

  .reward-command-stat-wide {
    grid-column: auto;
  }

  .reward-command-actions,
  .reward-task-section-head {
    align-items: stretch;
  }

  .reward-task-section-head .badge {
    width: 100%;
  }

  .reward-keyword-head-actions {
    width: 100%;
    justify-content: space-between;
  }

  .reward-keyword-shell,
  .reward-selected-card {
    padding: 0.9rem;
  }

  .reward-keyword-controls {
    padding: 0.62rem;
  }

  .reward-keyword-control-row {
    grid-template-columns: 1fr;
    gap: 0.34rem;
  }

  .reward-keyword-control-actions {
    justify-content: flex-start;
  }

  .reward-filter-pill {
    min-height: 1.78rem;
    padding: 0.26rem 0.5rem;
  }

  .reward-range-panel {
    grid-template-columns: 1fr;
  }

  .reward-range-panel label {
    grid-template-columns: 1fr 1fr;
  }

  .reward-range-panel label span {
    grid-column: 1 / -1;
  }

  .reward-keyword-head {
    flex-direction: column;
  }

  .reward-keyword-head .badge {
    width: fit-content;
  }

  .reward-keyword-cloud {
    gap: 0.48rem;
  }

  .reward-keyword-chip {
    min-height: 1.96rem;
    padding: 0.34rem 0.58rem;
  }

  .reward-task-section-head {
    flex-direction: column;
  }

  .reward-task-list {
    grid-template-columns: 1fr;
  }

  .reward-task-card {
    min-height: 0;
  }

  .reward-task-card-head {
    flex-direction: column;
  }

  .reward-task-card-head .badge {
    width: fit-content;
  }

  .reward-quick-chip-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .reward-quick-chip {
    width: 100%;
  }

  .reward-compact-row {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .reward-compact-meta {
    justify-items: end;
    text-align: right;
  }

  .reward-compact-manage-actions {
    grid-column: 1 / -1;
  }

  .reward-member-strip-list {
    grid-template-columns: 1fr;
    gap: 0.58rem;
  }

  .reward-member-strip-preview {
    width: 100%;
  }

  .reward-pool-viewer-member {
    padding: 0.74rem;
  }

  .space-page .badge-row {
    gap: 0.36rem;
  }

  .space-tools-tabs {
    grid-template-columns: 1fr;
  }

  .sync-flat-card,
  .danger-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .space-utility-card-tools .space-subsection-heading h3,
  .space-utility-card-tools .access-panel-head h3,
  .space-utility-card-tools .space-debug-summary h3,
  .space-utility-card-tools .storage-stat-item dd {
    font-size: var(--type-meta-size);
    line-height: 1.28;
  }

  .space-utility-card-tools .button-solid,
  .space-utility-card-tools .button-subtle,
  .space-utility-card-tools input,
  .space-utility-card-tools .space-fold-toggle {
    min-height: 1.96rem;
    padding-inline: 0.56rem;
  }

  .space-hero-note,
  .space-fact-card,
  .space-member-card,
  .space-access-card,
  .reward-form-card,
  .reward-shelf-card,
  .reward-compact-row,
  .reward-member-strip,
  .reward-card,
  .reward-claim-card,
  .space-reward-member-card,
  .space-empty-card,
  .space-inline-panel,
  .space-pending-card,
  .space-pending-item,
  .space-claim-fold {
    padding: 0.72rem;
  }

  .reward-form-card input,
  .reward-form-card select,
  .reward-form-card textarea,
  .reward-form-card .button-solid,
  .reward-form-card .button-subtle,
  .reward-shelf-manage-button,
  .reward-compact-manage-button {
    min-height: 1.76rem;
  }

  .reward-pool-unified-card .reward-compact-list {
    max-height: min(36vh, 17.5rem);
  }

  .reward-compact-row {
    padding: 0.5rem 0.56rem;
    border-radius: 14px;
  }

  .reward-compact-main p {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .space-claim-fold,
  .space-claim-fold-body,
  .space-pending-list,
  .space-pending-controls {
    gap: 0.72rem;
  }

  .space-claim-fold .space-fold-body {
    padding-top: 0.74rem;
  }

  .space-claim-fold .space-fold-toggle {
    min-height: 2.06rem;
    padding-inline: 0.7rem;
  }

  .space-fold-copy {
    max-width: none;
  }

  .space-fold-toggle {
    min-height: 2.2rem;
    padding-inline: 0.74rem;
  }

  .space-inline-code strong {
    font-size: var(--type-card-title-size);
    word-break: break-all;
  }
}

@media (prefers-reduced-motion: reduce) {
  .space-page * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
