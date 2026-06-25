<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { useAppearanceTheme, type AppearanceThemeId } from '../composables/useAppearanceTheme'
import { clearStoredColorTokenDraft } from '../composables/useColorTokenDashboard'
import { useSpacePageState } from '../composables/useSpacePageState'
import type { RewardPoolItem } from '../stores/wishes'

const space = reactive(useSpacePageState())
const { appearanceThemes, selectedAppearanceId, selectedTheme, setAppearanceTheme } = useAppearanceTheme()

type RewardHubTab = 'claim' | 'editor'
type RewardEditorTier = 'daily' | 'premium'
type RewardPoolScope = 'mine' | 'others'
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

const rewardHubTab = ref<RewardHubTab>('claim')
const rewardPoolScope = ref<RewardPoolScope>('mine')
const rewardPoolViewerMemberId = ref<string | null>(null)
const selectedRewardKeywordId = ref<string | null>(null)
const rewardKeywordSortMode = ref<RewardKeywordSortMode>('default')
const rewardKeywordOwnerFilter = ref<RewardKeywordOwnerFilter>('all')
const rewardKeywordStatusFilter = ref<RewardKeywordStatusFilter>('all')
const rewardCostMinDraft = ref('')
const rewardCostMaxDraft = ref('')
const rewardDepositedMinDraft = ref('')
const rewardDepositedMaxDraft = ref('')
const isRewardRangeFilterOpen = ref(false)
const isRewardShelfManaging = ref(false)
const activeAccessPanel = ref<AccessPanel>('invite')

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
  { label: '全部状态', value: 'all' },
  { label: '可领取', value: 'claimable' },
  { label: '我能存', value: 'depositable' },
]

const rewardHubTabs = [
  {
    label: '领奖',
    note: '待领 / 兑换 / 记录',
    value: 'claim' as const,
  },
  {
    label: '编辑',
    note: '写入 / 整理 / 奖池',
    value: 'editor' as const,
  },
]

const rewardPoolScopeTabs = [
  {
    label: '我的',
    note: '可管理',
    value: 'mine' as const,
  },
  {
    label: '对方',
    note: '只读',
    value: 'others' as const,
  },
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
      note: space.authStore.isAuthenticated ? '已进入' : '未进入',
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
    activeAccessPanel.value = 'invite'
  }
})

const activeRewardHubTitle = computed(() => {
  return rewardHubTab.value === 'claim' ? '领奖与兑换' : '编辑奖励池'
})

const activeRewardHubLead = computed(() => {
  if (rewardHubTab.value === 'claim') {
    return '愿望推进得到的星星币，会在这里换成真正想要的奖励。'
  }

  if (space.currentMemberRewardCount) {
    return '写新奖励、改旧奖励、整理奖池，都在这里。'
  }

  return '先写下一条会让自己开心的奖励。'
})

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

const rewardPoolViewerMembers = computed(() => {
  return space.rewardPoolByMember.map((item) => ({
    ...item,
    isCurrentMember: item.member.id === currentSpaceMemberId.value,
    rewardCount: item.premiumRewards.length,
  }))
})

const rewardPoolOtherMembers = computed(() => rewardPoolViewerMembers.value.filter((item) => !item.isCurrentMember))

const activeRewardPoolViewerMember = computed(() => {
  const members = rewardPoolOtherMembers.value
  const selectedMember = members.find((item) => item.member.id === rewardPoolViewerMemberId.value)

  return selectedMember || members[0] || null
})

const activeRewardPoolEntries = computed(() => {
  if (rewardPoolScope.value === 'mine') {
    return createRewardDisplayEntries(
      [
        ...space.currentMemberPremiumRewards,
        ...space.sharedPremiumRewards.filter((item) => item.ownerId === currentSpaceMemberId.value),
      ],
      'premium',
    )
  }

  const activeMember = activeRewardPoolViewerMember.value

  if (!activeMember) {
    return []
  }

  return createRewardDisplayEntries(activeMember.premiumRewards, 'premium')
})

const activeRewardPoolMemberName = computed(() => {
  return rewardPoolScope.value === 'mine'
    ? space.authStore.currentMember?.displayName || '我的奖池'
    : activeRewardPoolViewerMember.value?.member.displayName || '对方奖池'
})

const activeRewardPoolEyebrow = computed(() => {
  if (rewardPoolScope.value === 'mine') {
    return '我的星币奖励'
  }

  return '对方星币奖励'
})

const activeRewardPoolEmpty = computed(() => {
  if (rewardPoolScope.value === 'others' && !activeRewardPoolViewerMember.value) {
    return {
      copy: '邀请对方加入后，就能在这里查看对方的奖池。',
      title: '还没有其他成员',
    }
  }

  const ownerLabel = rewardPoolScope.value === 'mine' ? '你' : '对方'
  const tierLabel = '星币奖励'

  return {
    copy: `${ownerLabel}还没有${tierLabel}。`,
    title: `还没有${tierLabel}`,
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
  rewardHubTab.value = 'editor'
  space.startEditingReward(itemId, tier)
}

function editRewardFromShelf(itemId: string, tier: 'daily' | 'premium') {
  isRewardShelfManaging.value = false
  openRewardEditor(itemId, tier)
}

function chooseRewardPoolScope(scope: RewardPoolScope) {
  rewardPoolScope.value = scope

  if (scope === 'others') {
    isRewardShelfManaging.value = false
  }
}

function submitActiveRewardDraft() {
  return space.submitPremiumReward()
}

function resetActiveRewardDraft() {
  space.resetRewardDraft('premium')
}

function openRewardManager() {
  rewardHubTab.value = 'editor'
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
  rewardKeywordOwnerFilter.value = 'all'
  rewardKeywordStatusFilter.value = 'all'
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

function chooseAppearanceTheme(id: AppearanceThemeId) {
  clearStoredColorTokenDraft()
  setAppearanceTheme(id)
}
</script>

<template>
  <section class="page-stack space-page">
    <div class="space-main-stack">
      <article class="page-card space-shell-card space-main-card space-united-card">
        <div class="space-main-summary-shell">
          <div class="space-main-summary-intro">
            <div class="space-hero-copy-block">
              <p class="eyebrow space-main-kicker">共同空间</p>
              <h1 class="section-title space-hero-title">把两个人的日常收在同一页</h1>
              <p class="section-copy space-main-summary-lead">成员、邀请、奖励和照片，都从这里往后翻。</p>
            </div>
          </div>
        </div>
      </article>

      <article class="page-card space-shell-card space-main-card space-reward-hub">
        <div class="space-reward-hub-head">
          <div class="space-reward-hub-copy">
            <p class="eyebrow">奖励中心</p>
            <h2 class="space-panel-title space-reward-hub-title">{{ activeRewardHubTitle }}</h2>
            <p class="space-reward-hub-lead">{{ activeRewardHubLead }}</p>
          </div>

        </div>

        <div class="space-reward-hub-tabs" role="tablist" aria-label="奖励中心切换">
          <button
            v-for="tab in rewardHubTabs"
            :key="tab.value"
            type="button"
            class="space-reward-hub-tab"
            :class="{ active: rewardHubTab === tab.value }"
            @click="rewardHubTab = tab.value"
          >
            <span class="space-reward-hub-tab-copy">
              <span class="space-reward-hub-tab-label">{{ tab.label }}</span>
              <span class="space-reward-hub-tab-note">{{ tab.note }}</span>
            </span>
          </button>
        </div>

        <template v-if="rewardHubTab === 'claim'">
          <section class="reward-command-panel">
            <div class="reward-command-summary">
              <article class="reward-command-stat reward-command-stat-primary">
                <span>手里星币</span>
                <strong>{{ space.currentMemberStarCoins }}</strong>
              </article>
              <article class="reward-command-stat">
                <span>奖池词条</span>
                <strong>{{ visibleRewardKeywordEntries.length }} / {{ rewardKeywordEntries.length }}</strong>
              </article>
              <article class="reward-command-stat reward-command-stat-wide">
                <span>现在可领</span>
                <strong>{{ space.claimableRewardEntries.length }}</strong>
              </article>
            </div>

            <div v-if="!rewardKeywordEntries.length" class="reward-command-actions">
              <button class="button-solid" type="button" @click="openRewardManager">写一条奖励</button>
            </div>
          </section>

          <p v-if="space.rewardMessage" :class="['feedback-message', 'space-reward-feedback', space.rewardTone]">{{ space.rewardMessage }}</p>

          <section v-if="rewardKeywordEntries.length" class="reward-keyword-controls" aria-label="奖励奖池筛选排序">
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
                <h3>点一个奖励，看它现在能不能兑现</h3>
              </div>
              <span class="badge">{{ visibleRewardKeywordEntries.length }} / {{ rewardKeywordEntries.length }} 条</span>
            </div>

            <div v-if="visibleRewardKeywordEntries.length" class="reward-keyword-cloud" aria-label="奖励词条奖池">
              <button
                v-for="entry in visibleRewardKeywordEntries"
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

            <div v-else class="space-empty-card reward-filter-empty">
              <strong>没有符合条件的奖励</strong>
              <p>试试放宽币数区间，或清空筛选。</p>
              <button class="button-subtle" type="button" @click="clearRewardKeywordFilters">清空筛选</button>
            </div>
          </section>

          <article v-if="selectedRewardEntry" class="reward-selected-card" :class="[`reward-selected-card-${selectedRewardEntry.kind}`]">
            <div class="reward-task-card-head">
              <div>
                <span class="reward-card-kicker">{{ getRewardKeywordOwnerLabel(selectedRewardEntry) }}</span>
                <strong>{{ selectedRewardEntry.item.title }}</strong>
              </div>
              <span class="badge">{{ selectedRewardEntry.item.starCoinCost }} 星币</span>
            </div>

            <div class="reward-deposit-progress" :aria-label="`已存入 ${space.getRewardDepositPercent(selectedRewardEntry.item)}%`">
              <span :style="{ width: `${space.getRewardDepositPercent(selectedRewardEntry.item)}%` }"></span>
            </div>

            <p class="space-meta-line reward-card-meta">
              <span>已存 {{ space.getRewardDepositedStarCoins(selectedRewardEntry.item) }} / {{ selectedRewardEntry.item.starCoinCost }}</span>
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
            </div>
          </article>

          <div v-if="!rewardKeywordEntries.length" class="space-empty-card reward-command-empty">
            <strong>还没有可以推进的奖励</strong>
            <p>先写一条有星星币价格的奖励，它就会出现在这里。</p>
            <button class="button-solid" type="button" @click="openRewardManager">写一条奖励</button>
          </div>

          <section class="reward-recent-strip">
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
              <p>第一次存入或领取后会显示在这里。</p>
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
                <span class="badge">{{ rewardPoolScope === 'mine' ? '我的奖池' : '对方只读' }}</span>
                <span class="badge">{{ activeRewardPoolEntries.length }} 条</span>
              </div>
            </div>

            <div class="reward-pool-viewer-shell reward-pool-unified-shell">
              <div class="reward-editor-tier-tabs reward-pool-scope-tabs" role="tablist" aria-label="奖池范围切换">
                <button
                  v-for="tab in rewardPoolScopeTabs"
                  :key="tab.value"
                  type="button"
                  class="reward-editor-tier-tab"
                  :class="{ active: rewardPoolScope === tab.value }"
                  :aria-selected="rewardPoolScope === tab.value"
                  role="tab"
                  @click="chooseRewardPoolScope(tab.value)"
                >
                  <span class="reward-editor-tier-label">{{ tab.label }}</span>
                  <span class="reward-editor-tier-note">{{ tab.note }}</span>
                </button>
              </div>

              <div v-if="rewardPoolScope === 'others' && rewardPoolOtherMembers.length" class="reward-member-strip-list reward-pool-viewer-members" role="list" aria-label="选择要查看的成员奖池">
                <button
                  v-for="item in rewardPoolOtherMembers"
                  :key="item.member.id"
                  class="reward-member-strip reward-pool-viewer-member"
                  :class="{ active: activeRewardPoolViewerMember?.member.id === item.member.id }"
                  type="button"
                  @click="rewardPoolViewerMemberId = item.member.id"
                >
                  <div class="reward-member-strip-person">
                    <span class="reward-member-strip-mark">{{ item.member.displayName.slice(0, 1) }}</span>
                    <div>
                      <h3>{{ item.member.displayName }}</h3>
                      <p class="space-member-summary">对方 · {{ item.starCoins }} 枚星星币 · {{ item.rewardCount }} 条奖励</p>
                    </div>
                  </div>

                  <div class="reward-member-strip-stats" aria-label="成员奖励摘要">
                    <span><strong>{{ item.premiumRewards.length }}</strong>奖励</span>
                    <span><strong>{{ item.starCoins }}</strong>星币</span>
                  </div>
                </button>
              </div>

              <article class="reward-shelf-card reward-pool-unified-card">
                <div class="space-subsection-heading">
                  <div>
                    <p class="eyebrow">{{ activeRewardPoolEyebrow }}</p>
                    <h3>{{ activeRewardPoolMemberName }}</h3>
                  </div>

                  <div class="reward-shelf-heading-actions">
                    <span class="badge">{{ activeRewardPoolEntries.length }} 条</span>
                    <button
                      v-if="rewardPoolScope === 'mine'"
                      class="reward-shelf-manage-button"
                      type="button"
                      :disabled="!activeRewardPoolEntries.length"
                      @click="isRewardShelfManaging = !isRewardShelfManaging"
                    >
                      {{ isRewardShelfManaging ? '完成' : '管理' }}
                    </button>
                    <span v-else class="badge">只读查看</span>
                  </div>
                </div>

                <div v-if="activeRewardPoolEntries.length" class="reward-compact-list">
                  <article
                    v-for="entry in activeRewardPoolEntries"
                    :key="`${rewardPoolScope}:${entry.tier}:${entry.item.id}`"
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

                    <div v-if="rewardPoolScope === 'mine' && isRewardShelfManaging" class="reward-compact-manage-actions">
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
      </article>
    </div>

    <div class="space-utility-band-head">
      <div>
        <p class="eyebrow">后页工具</p>
        <h2 class="space-utility-band-title">需要时再往后翻</h2>
      </div>
      <p class="section-copy">{{ space.utilityBandLead }}</p>
    </div>

    <div class="space-utility-grid">
      <details class="page-card space-shell-card space-fold-card space-utility-card space-utility-card-access">
        <summary class="space-fold-summary space-utility-summary">
          <div class="space-fold-copy-block">
            <p class="eyebrow">进入与邀请</p>
            <h3>需要时再来处理进入方式</h3>
            <p class="space-fold-copy">{{ space.accountSummary }}</p>
          </div>

          <div class="space-fold-meta">
            <div class="badge-row">
              <span v-for="badge in space.accountBadges" :key="badge" class="badge">{{ badge }}</span>
            </div>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body">
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
                  <p class="eyebrow">把对方带进来</p>
                  <h3>邀请对方</h3>
                </div>
                <span class="badge">{{ space.syncStatusLabel }}</span>
              </div>

              <p class="space-card-intro">{{ space.inviteSummary }}</p>

              <div class="access-code-row">
                <div class="space-inline-code">
                  <span class="muted">邀请口令</span>
                  <strong>{{ space.authStore.inviteCode }}</strong>
                </div>
                <button v-if="space.canCopyInviteCode" class="button-subtle" type="button" @click="space.copyInviteCode">复制</button>
              </div>

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
            </section>

            <section v-else-if="activeAccessPanel === 'email'" class="access-panel-body" role="tabpanel">
              <div class="access-panel-head">
                <div>
                  <p class="eyebrow">邮箱走进来</p>
                  <h3>邮箱进入</h3>
                </div>
                <span class="badge">{{ space.authStore.isAuthenticated ? '已进入' : '未进入' }}</span>
              </div>

              <p class="space-card-intro">把邮箱和这间空间连上，回来就不用每次都靠邀请码。</p>

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

              <p v-if="space.loginMessage" :class="['feedback-message', space.loginTone]">{{ space.loginMessage }}</p>
            </section>

            <section v-else-if="space.canBindFixedEmail" class="access-panel-body" role="tabpanel">
              <div class="access-panel-head">
                <div>
                  <p class="eyebrow">记住这个入口</p>
                  <h3>记住常用邮箱</h3>
                </div>
                <span class="badge">仅创建者可用</span>
              </div>

              <p class="space-card-intro">把常用邮箱记在这间空间上，后面回来会更快。</p>

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
              <p class="space-access-form-note">这里只是把邮箱和显示名称记在这间空间上，不会替你发送邮件。</p>
            </section>
          </div>

          <p v-if="space.inviteMessage" :class="['feedback-message', space.inviteTone]">{{ space.inviteMessage }}</p>
        </div>
      </details>

      <details class="page-card space-shell-card space-fold-card space-utility-card space-utility-card-memory">
        <summary class="space-fold-summary space-utility-summary">
          <div class="space-fold-copy-block">
            <p class="eyebrow">照片与备份</p>
            <h3>照片空间和备份都放在这里</h3>
            <p class="space-fold-copy">{{ space.storageSummaryLabel }}</p>
          </div>

          <div class="space-fold-meta">
            <div class="badge-row">
              <span class="badge">已用 {{ space.storageSummary.usagePercent }}%</span>
              <span class="badge">{{ space.authStore.usesSupabaseSpace ? '云端空间' : '本地体验空间' }}</span>
            </div>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body">
          <div class="storage-compact-panel">
            <p class="section-copy storage-lead">{{ space.storageLead }}</p>

            <div class="storage-meter" :aria-label="`照片空间已使用 ${space.storageSummary.usagePercent}%`">
              <div
                :class="['storage-meter-fill', { warning: space.storageSummary.nearingLimit, danger: space.storageSummary.overSoftLimit }]"
                :style="{ width: `${space.storageSummary.usagePercent}%` }"
              ></div>
            </div>

            <dl class="storage-stat-list">
              <div v-for="fact in space.storageFacts" :key="fact.label" class="storage-stat-item">
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>

            <div class="storage-backup-row">
              <div class="storage-backup-copy">
                <p class="section-copy">
                  {{ space.estimatedRemainingImageCount === null
                    ? '再多传几张后，这里会显示还能放多少。'
                    : `按现在的大小，大约还能放 ${space.estimatedRemainingImageCount} 张。` }}
                </p>
                <p class="space-meta-line">
                        <span>备份会带上清单、星币奖励和记录</span>
                  <span>两个人最好各自留一份</span>
                </p>
              </div>
              <button class="button-subtle" type="button" @click="space.downloadBackup">备份清单</button>
            </div>
          </div>

          <p v-if="space.backupMessage" :class="['feedback-message', space.backupTone]">{{ space.backupMessage }}</p>
        </div>
      </details>

      <details class="page-card space-shell-card space-fold-card space-utility-card space-advanced-shell space-utility-card-advanced">
        <summary class="space-fold-summary space-utility-summary">
          <div class="space-fold-copy-block">
            <p class="eyebrow">同步与退出</p>
            <h3>同步详情和退出</h3>
            <p class="space-fold-copy">{{ space.advancedSummary }}</p>
          </div>

          <div class="space-fold-meta">
            <div class="badge-row">
              <span class="badge">{{ space.syncStatusLabel }}</span>
            </div>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body">
          <div class="space-advanced-grid">
            <article class="space-access-card space-advanced-status-card">
              <div class="space-subsection-heading">
                <div>
                  <p class="eyebrow">同步状态</p>
                  <h3>{{ space.syncStatusLabel }}</h3>
                </div>
                <span class="badge">{{ space.authStore.usesSupabaseSpace ? '云端数据' : '本地体验' }}</span>
              </div>

              <p class="space-card-intro">{{ space.wishStore.syncMessage }}</p>
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
              <div class="space-subsection-heading">
                <div>
                  <p class="eyebrow">离开这台设备</p>
                  <h3>退出登录</h3>
                </div>
              </div>

              <p class="space-card-intro">这里只会退出当前设备上的登录状态，不会删掉这间空间或已经写下的内容。</p>

              <div class="button-row">
                <button v-if="space.authStore.isAuthenticated" class="button-subtle danger-button" type="button" @click="void space.authStore.signOut()">
                  退出登录
                </button>
                <span v-else class="muted">当前还没有登录中的邮箱会话。</span>
              </div>
            </article>
          </div>
        </div>
      </details>

      <details class="page-card space-shell-card space-fold-card space-main-card space-appearance-card" aria-labelledby="space-appearance-title">
        <summary class="space-fold-summary space-utility-summary space-appearance-summary">
          <div class="space-fold-copy-block">
            <p class="eyebrow">外观</p>
            <h3 id="space-appearance-title">选择这台设备的页面颜色</h3>
          </div>
          <div class="space-fold-meta">
            <span class="badge">当前：{{ selectedTheme.label }}</span>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body space-appearance-body">
          <p class="space-card-intro">这里会保存到当前浏览器。切换正式外观时，会清掉调色工作台的临时草稿。</p>

          <div class="space-appearance-options" role="group" aria-label="外观切换">
            <button
              v-for="theme in appearanceThemes"
              :key="theme.id"
              type="button"
              class="space-appearance-option"
              :class="{ active: selectedAppearanceId === theme.id }"
              :aria-pressed="selectedAppearanceId === theme.id"
              @click="chooseAppearanceTheme(theme.id)"
            >
              <span class="space-appearance-preview" aria-hidden="true">
                <span v-for="color in theme.preview" :key="`${theme.id}-${color}`" :style="{ background: color }"></span>
              </span>
              <span class="space-appearance-copy">
                <strong>{{ theme.label }}</strong>
                <small>{{ theme.description }}</small>
              </span>
            </button>
          </div>
        </div>
      </details>
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
}

.space-reward-hub {
  background:
    radial-gradient(circle at top right, var(--danger-panel), transparent 22%),
    radial-gradient(circle at top left, var(--sage-glow), transparent 24%),
    linear-gradient(180deg, var(--card-bg), var(--card-bg-soft));
  gap: 0.95rem;
}

.space-appearance-card {
  gap: 0.85rem;
  background:
    radial-gradient(circle at 100% 0%, var(--accent-panel), transparent 26%),
    linear-gradient(180deg, var(--card-bg), var(--card-bg-soft));
}

.space-appearance-body {
  gap: 0.85rem;
  padding-top: 0.85rem;
  border-top-style: dashed;
}

.space-appearance-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.72rem;
}

.space-appearance-option {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.78rem;
  align-items: center;
  min-height: 5.2rem;
  padding: 0.82rem;
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  background: var(--panel-bg);
  color: var(--text-main);
  text-align: left;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.space-appearance-option:hover {
  transform: translateY(-1px);
  border-color: var(--active-item-border);
  background: var(--card-bg-popover);
}

.space-appearance-option.active {
  border-color: var(--active-item-border);
  background: var(--active-item-bg);
  box-shadow: 0 12px 24px var(--accent-shadow-soft);
}

.space-appearance-preview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  width: 4.1rem;
  height: 3.2rem;
  overflow: hidden;
  border: 1px solid var(--card-border-soft);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
}

.space-appearance-preview span {
  min-width: 0;
}

.space-appearance-copy {
  display: grid;
  gap: 0.18rem;
}

.space-appearance-copy strong {
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  line-height: var(--type-l5-line);
}

.space-appearance-copy small {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
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

.space-utility-card-access {
  order: 1;
}

.space-utility-card-memory {
  order: 2;
}

.space-utility-card-advanced {
  order: 3;
}

.space-reward-stage {
  padding-top: 1.1rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
}

.space-hero-title {
  max-width: 20ch;
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
  gap: 0.78rem;
}

.space-main-summary-intro {
  display: grid;
  grid-template-columns: minmax(0, 1.32fr) minmax(260px, 0.78fr);
  gap: 1rem;
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
  gap: 0.76rem;
}

.access-panel-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(86px, 1fr));
  gap: 0.36rem;
}

.access-panel-tab {
  display: grid;
  gap: 0.06rem;
  min-height: 2.46rem;
  padding: 0.36rem 0.52rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.42);
  color: var(--text-main);
  text-align: left;
}

.access-panel-tab span {
  font-family: var(--font-heading);
  font-size: var(--type-meta-size);
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
  gap: 0.52rem;
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
  padding: 0.58rem 0.68rem;
}

.access-code-row .button-subtle {
  min-height: 2.62rem;
  padding-inline: 0.75rem;
}

.space-utility-card-access .space-card-intro,
.space-utility-card-access .space-access-form-note {
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.space-utility-card-access .space-access-form {
  gap: 0.48rem;
}

.space-utility-card-access .space-form label {
  gap: 0.34rem;
}

.space-utility-card-access input {
  min-height: 2.32rem;
  padding-block: 0.44rem;
}

.access-inline-form {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.access-inline-form button,
.access-fixed-form button {
  min-height: 2.32rem;
  padding-inline: 0.78rem;
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
  gap: 0.72rem;
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
  gap: 0.46rem 0.68rem;
  margin: 0;
}

.storage-stat-item {
  display: grid;
  gap: 0.12rem;
  min-width: 0;
  padding: 0.5rem 0;
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
  gap: 0.8rem;
  padding-top: 0.68rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.14);
}

.storage-backup-copy {
  display: grid;
  gap: 0.22rem;
  min-width: 0;
}

.storage-backup-row .button-subtle {
  flex: 0 0 auto;
  padding-inline: 0.86rem;
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
  padding-top: 0.92rem;
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
  gap: 0.52rem;
}

.space-page .button-row {
  align-items: center;
}

.reward-form-card {
  display: grid;
  gap: 0.78rem;
  align-content: start;
  padding: 0.98rem;
  background: linear-gradient(180deg, var(--panel-bg-strong), var(--card-bg-soft));
}

.space-reward-form-grid {
  grid-template-columns: minmax(0, 1fr);
  gap: 0.85rem;
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
  gap: 0.72rem;
}

.reward-form-fields-premium {
  gap: 0.68rem;
}

.reward-form-card input,
.reward-form-card select {
  min-height: 2.68rem;
  padding: 0.56rem 0.78rem;
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.reward-form-card textarea {
  min-height: 4.2rem;
  height: 4.2rem;
  padding: 0.64rem 0.82rem;
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.reward-form-cost-field {
  max-width: 10rem;
}

.reward-form-submit-row {
  gap: 0.62rem;
  padding-top: 0.68rem;
  border-top: 1px dashed var(--card-border-soft);
}

.reward-form-actions {
  padding-top: 0;
  border-top: none;
}

.reward-form-card .button-solid,
.reward-form-card .button-subtle {
  min-height: 2.52rem;
}

.space-reward-feedback {
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
  min-height: 2rem;
  padding: 0.34rem 0.68rem;
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
  min-height: 2.32rem;
  padding: 0.46rem 0.7rem;
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
  background: linear-gradient(90deg, var(--accent-strong), var(--sage-strong));
  transition: width 180ms ease;
}

.reward-card-meta {
  padding-top: 0.1rem;
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
  color: var(--accent-strong);
}

.reward-command-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.58rem;
  flex-wrap: wrap;
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
  gap: 0.68rem;
}

.reward-member-strip-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: stretch;
}

.reward-compact-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(8.2rem, auto) auto;
  gap: 0.82rem;
  align-items: center;
  padding: 0.76rem 0.86rem;
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
  gap: 0.18rem;
  min-width: 0;
}

.reward-compact-main strong {
  overflow-wrap: anywhere;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.3;
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
  gap: 0.64rem;
  align-items: start;
  padding: 0.78rem 0.84rem;
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

.reward-member-strip-stats {
  display: flex;
  gap: 0.36rem;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.reward-member-strip-stats span {
  display: grid;
  min-width: 3.45rem;
  padding: 0.34rem 0.48rem;
  border-radius: 14px;
  border: 1px solid var(--card-border-soft);
  background: var(--panel-bg);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  text-align: center;
}

.reward-member-strip-stats strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  line-height: var(--type-l5-line);
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
    gap: 0.96rem;
  }

  .space-main-card,
  .space-utility-card {
    padding: 1rem;
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
  .space-appearance-options,
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

  .reward-command-actions > *,
  .reward-task-section-head .badge {
    width: 100%;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.58rem;
  }

  .reward-member-strip-preview {
    width: 100%;
  }

  .reward-member-strip-stats {
    justify-content: flex-start;
  }

  .space-page .badge-row {
    gap: 0.5rem;
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
    padding: 0.9rem;
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
