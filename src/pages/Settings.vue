<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
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

const rewardHubTab = ref<RewardHubTab>('claim')
const rewardEditorTier = ref<RewardEditorTier>('daily')
const rewardPoolTier = ref<RewardEditorTier>('daily')
const rewardPoolScope = ref<RewardPoolScope>('mine')
const rewardPoolViewerMemberId = ref<string | null>(null)
const isRewardShelfManaging = ref(false)
const activeAccessPanel = ref<AccessPanel>('invite')

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

const rewardEditorTierTabs = [
  {
    label: '日常奖励',
    note: '小步骤',
    value: 'daily' as const,
  },
  {
    label: '高档奖励',
    note: '大日子',
    value: 'premium' as const,
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
    if (space.pendingSmallRewardUnits) {
      return `待领 ${space.pendingSmallRewardUnits} 份，兑换和最近记录也都收在这里。`
    }

    return '待领、兑换和最近记录都收在这里。'
  }

  if (space.currentMemberRewardCount) {
    return '写新奖励、改旧奖励、整理奖池，都在这里。'
  }

  return '先写下一条会让自己开心的奖励。'
})

const activeRewardHubPills = computed(() => {
  if (rewardHubTab.value === 'claim') {
    return [
      `待领 ${space.pendingSmallRewardUnits}`,
      `可换 ${space.currentMemberPremiumExchangeRewards.length}`,
      `记录 ${space.recentRewardClaims.length}`,
    ]
  }

  return [
    `日常 ${space.currentMemberDailyRewards.length}`,
    `高档 ${space.currentMemberPremiumRewards.length}`,
    `星币 ${space.currentMemberStarCoins}`,
  ]
})

function createRewardDisplayEntries(rewards: RewardPoolItem[], tier: RewardEditorTier) {
  return rewards.map((item) => ({
    fallbackNote: tier === 'daily'
      ? '这条日常奖励还没有补充说明。'
      : '这条高档奖励还没有补充说明。',
    item,
    label: tier === 'daily' ? '日常奖励' : '高档奖励',
    metaLines: tier === 'daily'
      ? [
          `已领 ${space.wishStore.getRewardItemClaimCount(item)} 份`,
          '小推进可领',
        ]
      : [
          `已领 ${space.wishStore.getRewardItemClaimCount(item)} 份`,
          item.starCoinCost > 0 ? `${item.starCoinCost} 星星币兑换` : '详情页领取',
        ],
    tier,
  }))
}

const currentSpaceMemberId = computed(() => space.authStore.currentMemberId || space.authStore.currentMember?.id || null)

const rewardPoolViewerMembers = computed(() => {
  return space.rewardPoolByMember.map((item) => ({
    ...item,
    isCurrentMember: item.member.id === currentSpaceMemberId.value,
    rewardCount: item.dailyRewards.length + item.premiumRewards.length,
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
      rewardPoolTier.value === 'daily' ? space.currentMemberDailyRewards : space.currentMemberPremiumRewards,
      rewardPoolTier.value,
    )
  }

  const activeMember = activeRewardPoolViewerMember.value

  if (!activeMember) {
    return []
  }

  return createRewardDisplayEntries(
    rewardPoolTier.value === 'daily' ? activeMember.dailyRewards : activeMember.premiumRewards,
    rewardPoolTier.value,
  )
})

const activeRewardPoolMemberName = computed(() => {
  return rewardPoolScope.value === 'mine'
    ? space.authStore.currentMember?.displayName || '我的奖池'
    : activeRewardPoolViewerMember.value?.member.displayName || '对方奖池'
})

const activeRewardPoolEyebrow = computed(() => {
  if (rewardPoolScope.value === 'mine') {
    return rewardPoolTier.value === 'daily' ? '我的日常奖励' : '我的高档奖励'
  }

  return rewardPoolTier.value === 'daily' ? '对方日常奖励' : '对方高档奖励'
})

const activeRewardPoolEmpty = computed(() => {
  if (rewardPoolScope.value === 'others' && !activeRewardPoolViewerMember.value) {
    return {
      copy: '邀请对方加入后，就能在这里查看对方的奖池。',
      title: '还没有其他成员',
    }
  }

  const ownerLabel = rewardPoolScope.value === 'mine' ? '你' : '对方'
  const tierLabel = rewardPoolTier.value === 'daily' ? '日常奖励' : '高档奖励'

  return {
    copy: `${ownerLabel}还没有${tierLabel}。`,
    title: `还没有${tierLabel}`,
  }
})

const activeRewardEditor = computed(() => {
  if (rewardEditorTier.value === 'daily') {
    const isEditing = Boolean(space.editingDailyRewardId)

    return {
      badge: '给小步骤',
      eyebrow: '日常这一层',
      heading: '日常奖励',
      isEditing,
      submitCopy: isEditing ? '正在修改日常奖励。' : '保存后会进入日常奖池。',
      submitLabel: space.isSubmittingReward ? '保存中...' : isEditing ? '更新日常奖励' : '加入日常奖励',
      support: '写一个适合小推进的轻奖励。',
    }
  }

  const isEditing = Boolean(space.editingPremiumRewardId)

  return {
    badge: '给大日子',
    eyebrow: '留给大日子',
    heading: '高档奖励',
    isEditing,
    submitCopy: isEditing ? '正在修改高档奖励。' : '保存后会进入高档奖池。',
    submitLabel: space.isSubmittingReward ? '保存中...' : isEditing ? '更新高档奖励' : '加入高档奖励',
    support: '留给大事，也可以写上星星币价格慢慢换。',
  }
})

function openRewardEditor(itemId: string, tier: 'daily' | 'premium') {
  rewardHubTab.value = 'editor'
  rewardEditorTier.value = tier
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
  if (rewardEditorTier.value === 'daily') {
    return space.submitDailyReward()
  }

  return space.submitPremiumReward()
}

function resetActiveRewardDraft() {
  space.resetRewardDraft(rewardEditorTier.value)
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

            <aside class="space-main-summary-side space-main-summary-side-compact" aria-label="空间摘要">
              <div class="pill-row space-hero-pill-row">
                <span v-for="badge in space.heroBadges" :key="badge" class="pill">{{ badge }}</span>
              </div>

              <div class="space-main-summary-digest">
                <strong>{{ space.memberNamesLabel }}</strong>
                <p>{{ space.currentRoleLabel }} · 本周 {{ space.wishStore.currentMemberRemainingCoins }} 枚愿望币 · 奖励 {{ space.currentMemberRewardCount }} 条 · 星币 {{ space.currentMemberStarCoins }} 枚</p>
              </div>
            </aside>
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

          <div class="space-reward-hub-pills">
            <span v-for="pill in activeRewardHubPills" :key="pill" class="badge">{{ pill }}</span>
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

        <p v-if="space.rewardMessage && rewardHubTab === 'claim'" :class="['feedback-message', 'space-reward-feedback', space.rewardTone]">{{ space.rewardMessage }}</p>

        <template v-if="rewardHubTab === 'claim'">
          <article v-if="space.currentCatchMoment" class="space-current-catch-card">
            <div class="space-current-catch-copy">
              <p class="eyebrow">{{ space.currentCatchMoment.eyebrow }}</p>
              <h3 class="space-fold-title">{{ space.currentCatchMoment.title }}</h3>
              <p class="space-fold-copy">{{ space.currentCatchMoment.note }}</p>
            </div>

            <div class="space-current-catch-meta">
              <span class="badge">{{ space.currentCatchMoment.sourceLabel }}</span>
              <span class="badge">{{ space.currentCatchMoment.sourceMeta }}</span>
            </div>

            <div class="button-row space-current-catch-actions">
              <button class="button-solid" type="button" @click="void space.claimCurrentCatchMoment()">
                {{ space.currentCatchMoment.actionLabel }}
              </button>
            </div>
          </article>

          <details class="space-inline-panel space-fold-card space-claim-fold space-claim-fold-top space-pending-stage">
            <summary class="space-fold-summary space-claim-summary">
              <div class="space-fold-copy-block">
                <p class="eyebrow">待领奖励</p>
                <h3 class="space-fold-title">先接住这次推进</h3>
                <p class="space-fold-copy">步骤和数字进度累下来的小奖励，都会先收在这里，等你慢慢接住。</p>
              </div>

              <div class="space-fold-meta">
                <div class="badge-row">
                  <span class="badge">待领 {{ space.pendingSmallRewardUnits }} 份</span>
                  <span class="badge">步骤 {{ space.pendingStepRewards.length }} 条</span>
                  <span class="badge">数字 {{ space.pendingCountRewardUnits }} 点</span>
                </div>
                <div class="space-fold-toggle" aria-hidden="true">
                  <span class="space-fold-arrow"></span>
                </div>
              </div>
            </summary>

            <div class="space-fold-body space-claim-fold-body">
              <div class="space-pending-grid">
                <details class="space-pending-card space-fold-card space-pending-fold">
                  <summary class="space-fold-summary space-pending-summary">
                    <div class="space-fold-copy-block">
                      <p class="eyebrow">步骤奖励</p>
                      <h3>刚刚走完的这一步</h3>
                      <p class="space-fold-copy">完成的小步骤会先排在这里，先接住它，再决定要怎么领都来得及。</p>
                    </div>

                    <div class="space-fold-meta">
                      <div class="badge-row">
                        <span class="badge">{{ space.pendingStepRewards.length }} 条</span>
                      </div>
                      <div class="space-fold-toggle" aria-hidden="true">
                        <span class="space-fold-arrow"></span>
                      </div>
                    </div>
                  </summary>

                  <div class="space-fold-body space-pending-fold-body">
                    <div v-if="space.pendingStepRewards.length" class="space-pending-list">
                      <article v-for="item in space.pendingStepRewards" :key="item.stepId" class="space-pending-item">
                        <div class="space-pending-copy">
                          <span class="reward-card-kicker">来自「{{ item.wishTitle }}」</span>
                          <strong>{{ item.stepTitle }}</strong>
                          <p>这一步已经完成，小奖励现在先在空间页等你慢慢接住。</p>
                        </div>

                        <div class="space-meta-line reward-claim-meta">
                          <span>{{ space.formatBeijingDateTime(item.completedAt) }}</span>
                          <RouterLink class="button-subtle" :to="{ name: 'wish-detail', params: { id: item.wishId } }">回详情看这一步</RouterLink>
                        </div>

                        <div class="space-pending-controls">
                          <label v-if="space.currentMemberDailyRewards.length" class="space-pending-select">
                            <span class="muted">想把这次推进接成哪份日常奖励</span>
                            <select :value="space.getPendingRewardSelection(`step:${item.stepId}`)" @change="space.handlePendingRewardSelectionChange(`step:${item.stepId}`, $event)">
                              <option v-for="reward in space.currentMemberDailyRewards" :key="reward.id" :value="reward.id">{{ reward.title }}</option>
                            </select>
                          </label>
                          <p v-else class="muted">如果你还没放进日常奖励，也可以先把这一笔收成星星币。</p>

                          <div class="button-row space-pending-action-grid">
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`step:${item.stepId}:daily`) || !space.currentMemberDailyRewards.length"
                              @click="void space.claimPendingStepReward(item.wishId, item.stepId)"
                            >
                              {{ space.isProcessingPendingReward(`step:${item.stepId}:daily`) ? '接住中...' : '接住这次奖励' }}
                            </button>
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`step:${item.stepId}:star`)"
                              @click="void space.claimPendingStepReward(item.wishId, item.stepId, true)"
                            >
                              {{ space.isProcessingPendingReward(`step:${item.stepId}:star`) ? '收好中...' : '先收成星星币' }}
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>

                    <div v-else class="space-empty-card">
                      <strong>这会儿还没有新的步骤奖励</strong>
                      <p>下一次把小步骤走完，它会先安静落到这里。</p>
                    </div>
                  </div>
                </details>

                <details class="space-pending-card space-pending-card-count space-fold-card space-pending-fold">
                  <summary class="space-fold-summary space-pending-summary">
                    <div class="space-fold-copy-block">
                      <p class="eyebrow">数字奖励</p>
                      <h3>这段推进也先收在这里</h3>
                      <p class="space-fold-copy">数字推进累下来的小奖励，可以先接住一部分，也可以等一整段再来。</p>
                    </div>

                    <div class="space-fold-meta">
                      <div class="badge-row">
                        <span class="badge">{{ space.pendingCountRewardUnits }} 点</span>
                      </div>
                      <div class="space-fold-toggle" aria-hidden="true">
                        <span class="space-fold-arrow"></span>
                      </div>
                    </div>
                  </summary>

                  <div class="space-fold-body space-pending-fold-body">
                    <div v-if="space.pendingCountRewardSummaries.length" class="space-pending-list">
                      <article v-for="item in space.pendingCountRewardSummaries" :key="item.wishId" class="space-pending-item space-pending-item-count">
                        <div class="space-pending-copy">
                          <span class="reward-card-kicker">来自「{{ item.wishTitle }}」</span>
                          <strong>还有 {{ space.getPendingCountUnitLabel(item.pendingUnits, item.progressUnit) }} 小奖励没去领</strong>
                          <p>当前已经到 {{ item.progressCurrent }} / {{ item.progressTarget }}{{ item.progressUnit ? ` ${item.progressUnit}` : '' }}，可以一次领 1 点，也可以整批接住。</p>
                        </div>

                        <div class="space-meta-line reward-claim-meta">
                          <span>这页最近更新于 {{ space.formatBeijingDateTime(item.updatedAt) }}</span>
                          <RouterLink class="button-subtle" :to="{ name: 'wish-detail', params: { id: item.wishId } }">回详情看进度</RouterLink>
                        </div>

                        <div class="space-pending-controls">
                          <label v-if="space.currentMemberDailyRewards.length" class="space-pending-select">
                            <span class="muted">想把这段推进接成哪份日常奖励</span>
                            <select :value="space.getPendingRewardSelection(`count:${item.wishId}`)" @change="space.handlePendingRewardSelectionChange(`count:${item.wishId}`, $event)">
                              <option v-for="reward in space.currentMemberDailyRewards" :key="reward.id" :value="reward.id">{{ reward.title }}</option>
                            </select>
                          </label>
                          <p v-else class="muted">如果你还没放进日常奖励，也可以先按 1 点或整段收成星星币。</p>

                          <div class="button-row space-pending-action-grid">
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:1:daily`) || !space.currentMemberDailyRewards.length"
                              @click="void space.claimPendingCountReward(item.wishId, 1)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:1:daily`) ? '接住中...' : '先接住这 1 点' }}
                            </button>
                            <button
                              v-if="item.pendingUnits > 1"
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:daily`) || !space.currentMemberDailyRewards.length"
                              @click="void space.claimPendingCountReward(item.wishId, item.pendingUnits)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:daily`) ? '接住中...' : '把这一段都接住' }}
                            </button>
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:1:star`)"
                              @click="void space.claimPendingCountReward(item.wishId, 1, true)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:1:star`) ? '收好中...' : '先收成 1 点星星币' }}
                            </button>
                            <button
                              v-if="item.pendingUnits > 1"
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:star`)"
                              @click="void space.claimPendingCountReward(item.wishId, item.pendingUnits, true)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:star`) ? '收好中...' : '整段收成星星币' }}
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>

                    <div v-else class="space-empty-card">
                      <strong>这会儿还没有新的数字奖励</strong>
                      <p>下次把数字往前推一点，这里会先替你轻轻记住。</p>
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </details>

          <details class="space-inline-panel space-fold-card space-claim-fold space-claim-fold-top">
            <summary class="space-fold-summary space-claim-summary">
              <div class="space-fold-copy-block">
                <p class="eyebrow">星币兑换</p>
                <h3 class="space-fold-title">把星星币换成奖励</h3>
                <p class="space-fold-copy">这里只放写了星星币价格的高档奖励。</p>
              </div>

              <div class="space-fold-meta">
                <div class="badge-row">
                  <span class="badge">可换 {{ space.currentMemberPremiumExchangeRewards.length }} 条</span>
                  <span class="badge">手里 {{ space.currentMemberStarCoins }} 星币</span>
                  <span class="badge">现在可换 {{ space.premiumRedeemableNowCount }} 条</span>
                </div>
                <div class="space-fold-toggle" aria-hidden="true">
                  <span class="space-fold-arrow"></span>
                </div>
              </div>
            </summary>

            <div class="space-fold-body space-claim-fold-body">
              <div v-if="space.currentMemberPremiumExchangeRewards.length" class="reward-card-grid">
                <article v-for="item in space.currentMemberPremiumExchangeRewards" :key="item.id" class="reward-card premium-card">
                  <div class="reward-card-head">
                    <div class="reward-card-copy">
                      <span class="reward-card-kicker">高档奖励</span>
                      <strong>{{ item.title }}</strong>
                    </div>
                    <div class="premium-card-aside">
                      <p class="space-meta-line reward-card-meta premium-card-meta">
                        <span>已领 {{ space.wishStore.getRewardItemClaimCount(item) }} 份</span>
                      </p>
                      <span class="badge">{{ item.starCoinCost }} 星币</span>
                    </div>
                  </div>
                  <div class="button-row reward-card-actions">
                    <button
                      class="button-subtle"
                      type="button"
                      :disabled="space.processingRewardItemId === item.id || !space.canRedeemPremiumReward(item.starCoinCost)"
                      @click="void space.redeemPremiumReward(item.id)"
                    >
                      {{ space.processingRewardItemId === item.id
                        ? '兑换中...'
                        : space.canRedeemPremiumReward(item.starCoinCost)
                          ? '兑换这份奖励'
                          : `还差 ${item.starCoinCost - space.currentMemberStarCoins} 枚` }}
                    </button>
                  </div>
                </article>
              </div>

              <div v-else class="space-empty-card">
                <strong>现在没有可兑换的高档奖励</strong>
                <p>切到编辑给高档奖励写上星星币价格，它们就会出现在这里。</p>
              </div>
            </div>
          </details>

          <details class="space-inline-panel space-fold-card space-claim-fold space-claim-fold-top">
            <summary class="space-fold-summary space-claim-summary">
              <div class="space-fold-copy-block">
                <p class="eyebrow">最近记录</p>
                <h3 class="space-fold-title">最近的领取和兑换</h3>
                <p class="space-fold-copy">最近发生过的奖励动作，都会从这里往下记。</p>
              </div>

              <div class="space-fold-meta">
                <div class="badge-row">
                  <span class="badge">最近 {{ space.recentRewardClaims.length }} 笔</span>
                </div>
                <div class="space-fold-toggle" aria-hidden="true">
                  <span class="space-fold-arrow"></span>
                </div>
              </div>
            </summary>

            <div class="space-fold-body space-claim-fold-body">
              <div v-if="space.recentRewardClaims.length" class="reward-claim-list">
                <article v-for="item in space.recentRewardClaims" :key="item.claim.id" class="reward-claim-card">
                  <span class="reward-claim-marker" aria-hidden="true"></span>
                  <div class="reward-claim-body">
                    <div class="reward-card-head">
                      <div class="reward-card-copy">
                        <span class="reward-card-kicker">{{ item.memberName }}</span>
                        <div class="reward-claim-title-row">
                          <strong>{{ item.claim.titleSnapshot }}</strong>
                          <span class="badge">{{ space.getRewardClaimLabel(item.claim.claimKind) }}</span>
                        </div>
                      </div>
                    </div>
                    <p class="reward-claim-copy">{{ space.getRewardClaimReason(item.claim) }}</p>
                    <p class="space-meta-line reward-claim-meta">
                      <span>{{ space.formatBeijingDateTime(item.claim.createdAt) }}</span>
                    </p>
                  </div>
                </article>
              </div>

              <div v-else class="space-empty-card">
                <strong>还没有领取记录</strong>
                <p>第一次领取或兑换后会显示在这里。</p>
              </div>
            </div>
          </details>
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
                <div class="space-subsection-heading">
                  <div>
                    <p class="eyebrow">{{ activeRewardEditor.eyebrow }}</p>
                    <h3>{{ activeRewardEditor.heading }}</h3>
                  </div>
                  <span class="badge">{{ activeRewardEditor.badge }}</span>
                </div>

                <div class="reward-editor-tier-tabs" role="tablist" aria-label="奖励类型切换">
                  <button
                    v-for="tab in rewardEditorTierTabs"
                    :key="tab.value"
                    type="button"
                    class="reward-editor-tier-tab"
                    :class="{ active: rewardEditorTier === tab.value }"
                    :aria-selected="rewardEditorTier === tab.value"
                    role="tab"
                    @click="rewardEditorTier = tab.value"
                  >
                    <span class="reward-editor-tier-label">{{ tab.label }}</span>
                    <span class="reward-editor-tier-note">{{ tab.note }}</span>
                  </button>
                </div>

                <div class="reward-form-copy">
                  <p class="reward-form-support">{{ activeRewardEditor.support }}</p>
                </div>

                <form class="reward-editor-form" @submit.prevent="submitActiveRewardDraft">
                  <div class="reward-form-fields" :class="{ 'reward-form-fields-premium': rewardEditorTier === 'premium' }">
                    <template v-if="rewardEditorTier === 'daily'">
                      <label class="space-field-block">
                        <span class="muted">奖励名称</span>
                        <input v-model="space.dailyRewardTitleDraft" type="text" maxlength="120" placeholder="例如：一杯喜欢的奶茶 / 一顿轻松晚餐" />
                      </label>
                      <label class="space-field-block">
                        <span class="muted">说明（可选）</span>
                        <textarea v-model="space.dailyRewardNoteDraft" rows="2" maxlength="240" placeholder="写下这个小奖励为什么值得期待"></textarea>
                      </label>
                    </template>

                    <template v-else>
                      <label class="space-field-block">
                        <span class="muted">奖励名称</span>
                        <input v-model="space.premiumRewardTitleDraft" type="text" maxlength="120" placeholder="例如：心仪很久的大件 / 一次认真放松的体验" />
                      </label>
                      <label class="space-field-block">
                        <span class="muted">说明（可选）</span>
                        <textarea v-model="space.premiumRewardNoteDraft" rows="2" maxlength="240" placeholder="写下这个高档奖励真正吸引你的地方"></textarea>
                      </label>
                      <label class="space-field-block reward-form-cost-field">
                        <span class="muted">星星币兑换价</span>
                        <input v-model.number="space.premiumRewardCostDraft" type="number" min="0" max="999" />
                      </label>
                    </template>
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
                    <span><strong>{{ item.dailyRewards.length }}</strong>日常</span>
                    <span><strong>{{ item.premiumRewards.length }}</strong>高档</span>
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

                <div class="reward-editor-tier-tabs reward-shelf-tier-tabs" role="tablist" aria-label="奖池类型切换">
                  <button
                    v-for="tab in rewardEditorTierTabs"
                    :key="tab.value"
                    type="button"
                    class="reward-editor-tier-tab"
                    :class="{ active: rewardPoolTier === tab.value }"
                    :aria-selected="rewardPoolTier === tab.value"
                    role="tab"
                    @click="rewardPoolTier = tab.value"
                  >
                    <span class="reward-editor-tier-label">{{ tab.label }}</span>
                    <span class="reward-editor-tier-note">{{ tab.note }}</span>
                  </button>
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
                  <span>备份会带上清单、奖励和记录</span>
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
.space-main-summary-side,
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

.space-main-summary-side {
  justify-items: start;
  align-content: start;
}

.space-main-summary-side-compact {
  gap: 0.62rem;
  padding: 0.88rem 0.94rem;
  border-radius: 22px;
  border: 1px solid rgba(95, 74, 55, 0.08);
  background: rgba(255, 255, 255, 0.54);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58);
}

.space-main-summary-digest {
  display: grid;
  gap: 0.28rem;
}

.space-main-summary-digest strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.01em;
}

.space-main-summary-digest p {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.space-hero-copy,
.space-fold-copy,
.space-member-summary,
.space-member-supporting,
.space-fact-card p,
.space-inline-panel p,
.space-empty-card p,
.reward-card p,
.reward-claim-card p,
.reward-shelf-card p,
.feedback-message,
.space-access-card p {
  margin: 0;
  line-height: var(--type-supporting-line);
}

.space-hero-copy,
.space-member-summary {
  line-height: var(--type-body-line);
}

.space-fold-copy,
.space-member-supporting,
.space-fact-card p,
.space-inline-panel p,
.space-empty-card p,
.reward-card p,
.reward-claim-card p,
.reward-shelf-card p,
.feedback-message,
.space-access-card p {
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  letter-spacing: var(--type-supporting-spacing);
}

.space-card-intro,
.space-access-form-note,
.space-meta-line {
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

.reward-card-actions > .button-subtle {
  min-height: 2.18rem;
  padding: 0.46rem 0.82rem;
  font-size: var(--type-meta-size);
  line-height: 1.15;
}

.reward-card-meta {
  padding-top: 0.1rem;
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

  .space-main-summary-side {
    gap: 0.7rem;
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

  .space-hero-pill-row,
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
