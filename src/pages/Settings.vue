<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useSpacePageState } from '../composables/useSpacePageState'

const space = reactive(useSpacePageState())

type RewardHubTab = 'claim' | 'editor'

const rewardHubTab = ref<RewardHubTab>('claim')
const collapsedRewardItemIds = ref<string[]>([])

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

function openRewardEditor(itemId: string, tier: 'daily' | 'premium') {
  rewardHubTab.value = 'editor'
  space.startEditingReward(itemId, tier)
}

function formatRewardTitlePreview(rewards: Array<{ title: string }>, limit = 2) {
  return rewards.slice(0, limit).map((reward) => reward.title).join('、')
}

function isRewardItemCollapsed(itemId: string) {
  return collapsedRewardItemIds.value.includes(itemId)
}

function toggleRewardItemCollapse(itemId: string) {
  collapsedRewardItemIds.value = isRewardItemCollapsed(itemId)
    ? collapsedRewardItemIds.value.filter((id) => id !== itemId)
    : [...collapsedRewardItemIds.value, itemId]
}
</script>

<template>
  <section class="page-stack space-page">
    <div class="space-main-stack">
      <article class="page-card space-shell-card space-main-card space-united-card">
        <div class="space-main-summary-shell">
          <div class="space-main-summary-intro">
            <div class="space-hero-copy-block">
              <p class="eyebrow space-main-kicker">共同空间 Space</p>
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
          <details class="space-inline-panel space-fold-card space-claim-fold space-claim-fold-top space-pending-stage">
            <summary class="space-fold-summary space-claim-summary">
              <div class="space-fold-copy-block">
                <p class="eyebrow">待领奖励</p>
                <h3 class="space-fold-title">先接住这些小奖励</h3>
                <p class="space-fold-copy">步骤和数字进度累下来的小奖励，都会先收在这里。</p>
              </div>

              <div class="space-fold-meta">
                <div class="badge-row">
                  <span class="badge">待领 {{ space.pendingSmallRewardUnits }} 份</span>
                  <span class="badge">步骤 {{ space.pendingStepRewards.length }} 条</span>
                  <span class="badge">数字 {{ space.pendingCountRewardUnits }} 点</span>
                </div>
                <div class="space-fold-toggle" aria-hidden="true">
                  <span class="space-fold-toggle-state">
                    <span class="space-fold-when-closed">展开</span>
                    <span class="space-fold-when-open">收起</span>
                  </span>
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
                      <h3>完成了，还没领的步骤</h3>
                      <p class="space-fold-copy">完成的小步骤会先排在这里，想领奖励或先存星星币，都从这里开始。</p>
                    </div>

                    <div class="space-fold-meta">
                      <div class="badge-row">
                        <span class="badge">{{ space.pendingStepRewards.length }} 条</span>
                      </div>
                      <div class="space-fold-toggle" aria-hidden="true">
                        <span class="space-fold-toggle-state">
                          <span class="space-fold-when-closed">展开</span>
                          <span class="space-fold-when-open">收起</span>
                        </span>
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
                            <span class="muted">领哪条日常奖励</span>
                            <select :value="space.getPendingRewardSelection(`step:${item.stepId}`)" @change="space.handlePendingRewardSelectionChange(`step:${item.stepId}`, $event)">
                              <option v-for="reward in space.currentMemberDailyRewards" :key="reward.id" :value="reward.id">{{ reward.title }}</option>
                            </select>
                          </label>
                          <p v-else class="muted">还没准备日常奖励，也可以先把这一笔存成星星币。</p>

                          <div class="button-row space-pending-action-grid">
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`step:${item.stepId}:daily`) || !space.currentMemberDailyRewards.length"
                              @click="void space.claimPendingStepReward(item.wishId, item.stepId)"
                            >
                              {{ space.isProcessingPendingReward(`step:${item.stepId}:daily`) ? '领取中...' : '领日常奖励' }}
                            </button>
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`step:${item.stepId}:star`)"
                              @click="void space.claimPendingStepReward(item.wishId, item.stepId, true)"
                            >
                              {{ space.isProcessingPendingReward(`step:${item.stepId}:star`) ? '存币中...' : '存成星星币' }}
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>

                    <div v-else class="space-empty-card">
                      <strong>现在没有待领取的步骤奖励</strong>
                      <p>下一次把小步骤走完，它就会先落到这里。</p>
                    </div>
                  </div>
                </details>

                <details class="space-pending-card space-pending-card-count space-fold-card space-pending-fold">
                  <summary class="space-fold-summary space-pending-summary">
                    <div class="space-fold-copy-block">
                      <p class="eyebrow">数字奖励</p>
                      <h3>积下来的进度也在这里</h3>
                      <p class="space-fold-copy">数字推进累下来的小奖励，可以按 1 点或整批处理。</p>
                    </div>

                    <div class="space-fold-meta">
                      <div class="badge-row">
                        <span class="badge">{{ space.pendingCountRewardUnits }} 点</span>
                      </div>
                      <div class="space-fold-toggle" aria-hidden="true">
                        <span class="space-fold-toggle-state">
                          <span class="space-fold-when-closed">展开</span>
                          <span class="space-fold-when-open">收起</span>
                        </span>
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
                            <span class="muted">整批领日常奖励时，先选这一条</span>
                            <select :value="space.getPendingRewardSelection(`count:${item.wishId}`)" @change="space.handlePendingRewardSelectionChange(`count:${item.wishId}`, $event)">
                              <option v-for="reward in space.currentMemberDailyRewards" :key="reward.id" :value="reward.id">{{ reward.title }}</option>
                            </select>
                          </label>
                          <p v-else class="muted">还没准备日常奖励时，也可以先按 1 点或整批存成星星币。</p>

                          <div class="button-row space-pending-action-grid">
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:1:daily`) || !space.currentMemberDailyRewards.length"
                              @click="void space.claimPendingCountReward(item.wishId, 1)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:1:daily`) ? '领取中...' : '领 1 点日常奖励' }}
                            </button>
                            <button
                              v-if="item.pendingUnits > 1"
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:daily`) || !space.currentMemberDailyRewards.length"
                              @click="void space.claimPendingCountReward(item.wishId, item.pendingUnits)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:daily`) ? '领取中...' : '整批领日常奖励' }}
                            </button>
                            <button
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:1:star`)"
                              @click="void space.claimPendingCountReward(item.wishId, 1, true)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:1:star`) ? '存币中...' : '存 1 点星星币' }}
                            </button>
                            <button
                              v-if="item.pendingUnits > 1"
                              class="button-subtle"
                              type="button"
                              :disabled="space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:star`)"
                              @click="void space.claimPendingCountReward(item.wishId, item.pendingUnits, true)"
                            >
                              {{ space.isProcessingPendingReward(`count:${item.wishId}:${item.pendingUnits}:star`) ? '存币中...' : '整批存成星星币' }}
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>

                    <div v-else class="space-empty-card">
                      <strong>现在没有待领取的数字进度奖励</strong>
                      <p>下次把数字往前推一点，这里就会先替你记住。</p>
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
                  <span class="space-fold-toggle-state">
                    <span class="space-fold-when-closed">展开</span>
                    <span class="space-fold-when-open">收起</span>
                  </span>
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
                    <span class="badge">{{ item.starCoinCost }} 星币</span>
                  </div>
                  <p>{{ item.note || '这条高档奖励还没有补充说明。' }}</p>
                  <p class="space-meta-line reward-card-meta">
                    <span>兑换价 {{ item.starCoinCost }} 星星币</span>
                    <span>已领 {{ space.wishStore.getRewardItemClaimCount(item) }} 份</span>
                  </p>
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
                    <button class="button-subtle" type="button" @click="openRewardEditor(item.id, 'premium')">切到编辑</button>
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
                  <span class="space-fold-toggle-state">
                    <span class="space-fold-when-closed">展开</span>
                    <span class="space-fold-when-open">收起</span>
                  </span>
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
                        <strong>{{ item.claim.titleSnapshot }}</strong>
                      </div>
                      <span class="badge">{{ space.getRewardClaimLabel(item.claim.claimKind) }}</span>
                    </div>
                    <p class="reward-claim-copy">{{ space.getRewardClaimReason(item.claim) }}</p>
                    <p class="space-meta-line reward-claim-meta">
                      <span>{{ item.claim.quantity > 1 ? `这一笔领了 ${item.claim.quantity} 份` : '这一笔已记下' }}</span>
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
                <p class="space-stage-support">领奖和兑换切到“领奖”，这里专心写、改和整理。</p>
              </div>
              <span class="badge">这里只写和整理</span>
            </div>

            <div class="reward-form-grid space-reward-form-grid">
              <form class="space-form reward-form-card" @submit.prevent="space.submitDailyReward">
                <div class="space-subsection-heading">
                  <div>
                    <p class="eyebrow">日常这一层</p>
                    <h3>日常奖励</h3>
                  </div>
                  <span class="badge">给小步骤</span>
                </div>

                <div class="reward-form-copy">
                  <p class="reward-form-support">写一个适合小推进的轻奖励。</p>
                </div>

                <div class="reward-form-fields">
                  <label class="space-field-block">
                    <span class="muted">奖励名称</span>
                    <input v-model="space.dailyRewardTitleDraft" type="text" maxlength="120" placeholder="例如：一杯喜欢的奶茶 / 一顿轻松晚餐" />
                  </label>
                  <label class="space-field-block">
                    <span class="muted">说明（可选）</span>
                    <textarea v-model="space.dailyRewardNoteDraft" rows="2" maxlength="240" placeholder="写下这个小奖励为什么值得期待"></textarea>
                  </label>
                </div>

                <div class="reward-form-submit-row">
                  <p class="reward-form-submit-copy">{{ space.editingDailyRewardId ? '正在修改日常奖励。' : '保存后会进入日常奖池。' }}</p>

                  <div class="button-row reward-form-actions">
                    <button class="button-solid" type="submit" :disabled="space.isSubmittingReward">
                      {{ space.isSubmittingReward ? '保存中...' : space.editingDailyRewardId ? '更新日常奖励' : '加入日常奖励' }}
                    </button>
                    <button v-if="space.editingDailyRewardId" class="button-subtle" type="button" @click="space.resetRewardDraft('daily')">取消编辑</button>
                  </div>

                  <p v-if="space.rewardMessage" :class="['feedback-message', 'space-reward-feedback-inline', space.rewardTone]">{{ space.rewardMessage }}</p>
                </div>
              </form>

              <form class="space-form reward-form-card" @submit.prevent="space.submitPremiumReward">
                <div class="space-subsection-heading">
                  <div>
                    <p class="eyebrow">留给大日子</p>
                    <h3>高档奖励</h3>
                  </div>
                  <span class="badge">给大日子</span>
                </div>

                <div class="reward-form-copy">
                  <p class="reward-form-support">留给大事，也可以写上星星币价格慢慢换。</p>
                </div>

                <div class="reward-form-fields reward-form-fields-premium">
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
                </div>

                <div class="reward-form-submit-row">
                  <p class="reward-form-submit-copy">{{ space.editingPremiumRewardId ? '正在修改高档奖励。' : '保存后会进入高档奖池。' }}</p>

                  <div class="button-row reward-form-actions">
                    <button class="button-solid" type="submit" :disabled="space.isSubmittingReward">
                      {{ space.isSubmittingReward ? '保存中...' : space.editingPremiumRewardId ? '更新高档奖励' : '加入高档奖励' }}
                    </button>
                    <button v-if="space.editingPremiumRewardId" class="button-subtle" type="button" @click="space.resetRewardDraft('premium')">取消编辑</button>
                  </div>

                  <p v-if="space.rewardMessage" :class="['feedback-message', 'space-reward-feedback-inline', space.rewardTone]">{{ space.rewardMessage }}</p>
                </div>
              </form>
            </div>
          </div>

          <div class="space-reward-stage">
            <div class="space-reward-stage-head">
              <div>
                <p class="eyebrow">我的奖池</p>
                <h3 class="space-fold-title">已经写好的奖励</h3>
              </div>
              <span class="badge">这里只做整理</span>
            </div>

            <div class="reward-shelf-grid space-reward-shelf-grid">
              <article class="reward-shelf-card">
                <div class="space-subsection-heading">
                  <div>
                    <p class="eyebrow">日常这一格</p>
                    <h3>随手就能领的小奖励</h3>
                  </div>
                  <span class="badge">{{ space.currentMemberDailyRewards.length }} 条</span>
                </div>

                <div v-if="space.currentMemberDailyRewards.length" class="reward-compact-list">
                  <article v-for="item in space.currentMemberDailyRewards" :key="item.id" class="reward-compact-row" :class="{ 'is-collapsed': isRewardItemCollapsed(item.id) }">
                    <div class="reward-compact-main">
                      <span class="reward-card-kicker">日常奖励</span>
                      <strong>{{ item.title }}</strong>
                      <p v-if="!isRewardItemCollapsed(item.id)">{{ item.note || '这条日常奖励还没有补充说明。' }}</p>
                    </div>

                    <div v-if="!isRewardItemCollapsed(item.id)" class="reward-compact-meta">
                      <span>已领 {{ space.wishStore.getRewardItemClaimCount(item) }} 份</span>
                      <span>小推进可领</span>
                    </div>

                    <div class="button-row reward-compact-actions">
                      <button class="button-subtle" type="button" @click="space.startEditingReward(item.id, 'daily')">编辑</button>
                      <button class="button-subtle" type="button" @click="toggleRewardItemCollapse(item.id)">
                        {{ isRewardItemCollapsed(item.id) ? '展开' : '收起' }}
                      </button>
                      <button
                        class="button-subtle danger-button"
                        type="button"
                        :disabled="space.processingRewardItemId === item.id"
                        @click="void space.archiveReward(item.id)"
                      >
                        {{ space.processingRewardItemId === item.id ? '处理中...' : '归档' }}
                      </button>
                    </div>
                  </article>
                </div>

                <div v-else class="space-empty-card">
                  <strong>还没有日常奖励</strong>
                  <p>先准备几条会让你开心的小奖励。</p>
                </div>
              </article>

              <article class="reward-shelf-card reward-shelf-card-premium">
                <div class="space-subsection-heading">
                  <div>
                    <p class="eyebrow">大日子这一格</p>
                    <h3>留给大日子的奖励</h3>
                  </div>
                  <span class="badge">{{ space.currentMemberPremiumRewards.length }} 条</span>
                </div>

                <div v-if="space.currentMemberPremiumRewards.length" class="reward-compact-list">
                  <article v-for="item in space.currentMemberPremiumRewards" :key="item.id" class="reward-compact-row reward-compact-row-premium" :class="{ 'is-collapsed': isRewardItemCollapsed(item.id) }">
                    <div class="reward-compact-main">
                      <span class="reward-card-kicker">高档奖励</span>
                      <strong>{{ item.title }}</strong>
                      <p v-if="!isRewardItemCollapsed(item.id)">{{ item.note || '这条高档奖励还没有补充说明。' }}</p>
                    </div>

                    <div v-if="!isRewardItemCollapsed(item.id)" class="reward-compact-meta">
                      <span>已领 {{ space.wishStore.getRewardItemClaimCount(item) }} 份</span>
                      <span v-if="item.starCoinCost > 0">{{ item.starCoinCost }} 星星币兑换</span>
                      <span v-else>详情页领取</span>
                    </div>

                    <div class="button-row reward-compact-actions">
                      <button class="button-subtle" type="button" @click="space.startEditingReward(item.id, 'premium')">编辑</button>
                      <button class="button-subtle" type="button" @click="toggleRewardItemCollapse(item.id)">
                        {{ isRewardItemCollapsed(item.id) ? '展开' : '收起' }}
                      </button>
                      <button
                        class="button-subtle danger-button"
                        type="button"
                        :disabled="space.processingRewardItemId === item.id"
                        @click="void space.archiveReward(item.id)"
                      >
                        {{ space.processingRewardItemId === item.id ? '处理中...' : '归档' }}
                      </button>
                    </div>
                  </article>
                </div>

                <div v-else class="space-empty-card">
                  <strong>还没有高档奖励</strong>
                  <p>先留给大日子一两条真正想认真奖励自己的事。</p>
                </div>
              </article>
            </div>
          </div>

          <div class="space-reward-stage">
            <div class="space-reward-stage-head">
              <div class="space-reward-stage-copy">
                <p class="eyebrow">一起的奖池</p>
                <h3 class="space-fold-title">两个人的奖励</h3>
                <p class="section-copy">这里只看奖池本身，领取记录切到“领奖”。</p>
              </div>

              <div class="space-reward-hub-pills">
                <span class="badge">共 {{ space.totalRewardCount }} 条</span>
                <span class="badge">双方可见</span>
              </div>
            </div>

            <div class="reward-member-strip-list">
              <article v-for="item in space.rewardPoolByMember" :key="item.member.id" class="reward-member-strip">
                <div class="reward-member-strip-person">
                  <span class="reward-member-strip-mark">{{ item.member.displayName.slice(0, 1) }}</span>
                  <div>
                    <h3>{{ item.member.displayName }}</h3>
                    <p class="space-member-summary">{{ item.starCoins }} 枚星星币 · {{ item.dailyRewards.length + item.premiumRewards.length }} 条奖励</p>
                  </div>
                </div>

                <div class="reward-member-strip-stats" aria-label="成员奖励摘要">
                  <span><strong>{{ item.dailyRewards.length }}</strong>日常</span>
                  <span><strong>{{ item.premiumRewards.length }}</strong>高档</span>
                  <span><strong>{{ item.starCoins }}</strong>星币</span>
                </div>

                <div class="reward-member-strip-preview">
                  <span v-if="item.dailyRewards.length">日常：{{ formatRewardTitlePreview(item.dailyRewards) }}{{ item.dailyRewards.length > 2 ? ' 等' : '' }}</span>
                  <span v-else>日常：还没准备</span>
                  <span v-if="item.premiumRewards.length">高档：{{ formatRewardTitlePreview(item.premiumRewards) }}{{ item.premiumRewards.length > 2 ? ' 等' : '' }}</span>
                  <span v-else>高档：还没准备</span>
                </div>
              </article>
            </div>
          </div>
        </template>
      </article>
    </div>

    <div class="space-utility-band-head">
      <div>
        <p class="eyebrow">后页工具 Space Tools</p>
        <h2 class="space-utility-band-title">需要时再往后翻</h2>
      </div>
      <p class="section-copy">{{ space.utilityBandLead }}</p>
    </div>

    <div class="space-utility-grid">
      <details class="page-card space-shell-card space-fold-card space-utility-card space-utility-card-overview">
        <summary class="space-fold-summary space-utility-summary">
          <div class="space-fold-copy-block">
            <p class="eyebrow">空间概览</p>
            <h3>把底账收在一起</h3>
            <p class="space-fold-copy">{{ space.overviewSummary }}</p>
          </div>

          <div class="space-fold-meta">
            <div class="badge-row">
              <span class="badge">{{ space.currentRoleLabel }}</span>
              <span class="badge">{{ space.authStore.members.length }} 位成员</span>
            </div>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-toggle-state">
                <span class="space-fold-when-closed">展开</span>
                <span class="space-fold-when-open">收起</span>
              </span>
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body">
          <strong class="space-fold-title">{{ space.authStore.spaceName }}</strong>

          <div class="space-fact-grid">
            <article v-for="fact in space.spaceFacts" :key="fact.label" class="space-fact-card">
              <span class="muted">{{ fact.label }}</span>
              <strong>{{ fact.value }}</strong>
              <p>{{ fact.note }}</p>
            </article>
          </div>

          <div v-if="space.authStore.canSwitchMembers" class="member-switch-grid">
            <button
              v-for="member in space.authStore.members"
              :key="member.id"
              class="member-switch-button"
              :class="{ active: space.authStore.currentMemberId === member.id }"
              type="button"
              @click="space.authStore.switchMember(member.id)"
            >
              {{ member.displayName }}
            </button>
          </div>
          <div v-else class="badge-row">
            <span v-for="member in space.authStore.members" :key="member.id" class="badge">
              {{ member.displayName }} · {{ space.roleLabels[member.role] }}
            </span>
          </div>
        </div>
      </details>

      <details class="page-card space-shell-card space-fold-card space-utility-card space-utility-card-access">
        <summary class="space-fold-summary space-utility-summary">
          <div class="space-fold-copy-block">
            <p class="eyebrow">进入与邀请</p>
            <h3>进入与邀请</h3>
            <p class="space-fold-copy">{{ space.accountSummary }}</p>
          </div>

          <div class="space-fold-meta">
            <div class="badge-row">
              <span v-for="badge in space.accountBadges" :key="badge" class="badge">{{ badge }}</span>
            </div>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-toggle-state">
                <span class="space-fold-when-closed">展开</span>
                <span class="space-fold-when-open">收起</span>
              </span>
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body">
          <div class="space-access-grid">
            <section class="space-access-card">
              <div class="space-subsection-heading">
                <div>
                  <p class="eyebrow">把对方带进来</p>
                  <h3>邀请对方</h3>
                </div>
                <span class="badge">{{ space.syncStatusLabel }}</span>
              </div>

              <p class="space-card-intro">{{ space.inviteSummary }}</p>

              <div class="space-inline-code">
                <span class="muted">邀请口令</span>
                <strong>{{ space.authStore.inviteCode }}</strong>
              </div>

              <form class="space-form space-access-form" @submit.prevent="space.joinSpace">
                <label>
                  <span class="muted">对方发来的邀请口令</span>
                  <input v-model="space.inviteDraft" type="text" placeholder="WISH-2026" />
                </label>
                <p class="space-access-form-note">确认后会尝试走进同一间空间，不会盖掉你已经写下的愿望。</p>
                <div class="button-row reward-card-actions">
                  <button class="button-solid" :disabled="space.isJoiningSpace" type="submit">
                    {{ space.isJoiningSpace ? '确认中...' : '确认加入' }}
                  </button>
                  <button v-if="space.canCopyInviteCode" class="button-subtle" type="button" @click="space.copyInviteCode">复制邀请口令</button>
                </div>
              </form>
            </section>

            <section class="space-access-card">
              <div class="space-subsection-heading">
                <div>
                  <p class="eyebrow">邮箱走进来</p>
                  <h3>邮箱进入</h3>
                </div>
                <span class="badge">{{ space.authStore.isAuthenticated ? '已进入' : '未进入' }}</span>
              </div>

              <p class="space-card-intro">如果已经把邮箱和这间空间连上，之后回来就不用每次都靠邀请码。</p>

              <form class="space-form space-access-form" @submit.prevent="space.submitMagicLink">
                <label>
                  <span class="muted">邮箱</span>
                  <input v-model="space.loginEmail" type="email" placeholder="chenguang@example.com" />
                </label>
                <p class="space-access-form-note">先发验证邮件，再用邮件里的链接或验证码走回来。</p>
                <div class="button-row reward-card-actions">
                  <button class="button-solid" :disabled="space.isSendingMagicLink" type="submit">
                    {{ space.isSendingMagicLink ? '发送中...' : '发送验证邮件' }}
                  </button>
                </div>
              </form>

              <form v-if="space.showOtpForm" class="space-form space-access-form space-access-form-otp" @submit.prevent="space.submitEmailOtp">
                <label>
                  <span class="muted">邮箱验证码</span>
                  <input v-model="space.loginOtp" type="text" inputmode="numeric" placeholder="输入邮件里的验证码" />
                </label>
                <p v-if="space.otpTargetEmail" class="muted">当前会按 {{ space.otpTargetEmail }} 校验；如果刚换了邮箱，请先重新发送一次。</p>
                <div class="button-row reward-card-actions">
                  <button class="button-subtle" :disabled="space.isVerifyingOtp" type="submit">
                    {{ space.isVerifyingOtp ? '校验中...' : '确认进入' }}
                  </button>
                </div>
              </form>

              <p v-if="space.loginMessage" :class="['feedback-message', space.loginTone]">{{ space.loginMessage }}</p>
            </section>

            <section v-if="space.canBindFixedEmail" class="space-access-card">
              <div class="space-subsection-heading">
                <div>
                  <p class="eyebrow">记住这个入口</p>
                  <h3>记住常用邮箱</h3>
                </div>
                <span class="badge">仅创建者可用</span>
              </div>

              <p class="space-card-intro">把常用邮箱记在这间空间上，后面回来会更快。</p>

              <form class="space-form space-access-form" @submit.prevent="space.bindFixedEmail">
                <label>
                  <span class="muted">邮箱</span>
                  <input v-model="space.fixedEmailDraft" type="email" placeholder="partner@example.com" />
                </label>
                <label>
                  <span class="muted">显示名称（可选）</span>
                  <input v-model="space.fixedDisplayNameDraft" type="text" maxlength="50" placeholder="例如：晨光 / 星野" />
                </label>
                <p class="space-access-form-note">这里只是把邮箱和显示名称记在这间空间上，不会替你发送邮件。</p>
                <div class="button-row reward-card-actions">
                  <button class="button-subtle" :disabled="space.isBindingEmail" type="submit">
                    {{ space.isBindingEmail ? '保存中...' : '记住这个邮箱' }}
                  </button>
                </div>
              </form>

              <p class="muted">绑定后可直接回到这个空间。</p>
            </section>
          </div>

          <p v-if="space.inviteMessage" :class="['feedback-message', space.inviteTone]">{{ space.inviteMessage }}</p>
        </div>
      </details>

      <details class="page-card space-shell-card space-fold-card space-utility-card space-utility-card-memory">
        <summary class="space-fold-summary space-utility-summary">
          <div class="space-fold-copy-block">
            <p class="eyebrow">照片与备份</p>
            <h3>照片空间与备份</h3>
            <p class="space-fold-copy">{{ space.storageSummaryLabel }}</p>
          </div>

          <div class="space-fold-meta">
            <div class="badge-row">
              <span class="badge">已用 {{ space.storageSummary.usagePercent }}%</span>
              <span class="badge">{{ space.authStore.usesSupabaseSpace ? '云端空间' : '本地体验空间' }}</span>
            </div>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-toggle-state">
                <span class="space-fold-when-closed">展开</span>
                <span class="space-fold-when-open">收起</span>
              </span>
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body">
          <p class="section-copy">{{ space.storageLead }}</p>

          <div class="space-fact-grid space-storage-grid">
            <article v-for="fact in space.storageFacts" :key="fact.label" class="space-fact-card">
              <span class="muted">{{ fact.label }}</span>
              <strong>{{ fact.value }}</strong>
              <p>{{ fact.note }}</p>
            </article>
          </div>

          <div class="storage-meter" :aria-label="`照片空间已使用 ${space.storageSummary.usagePercent}%`">
            <div
              :class="['storage-meter-fill', { warning: space.storageSummary.nearingLimit, danger: space.storageSummary.overSoftLimit }]"
              :style="{ width: `${space.storageSummary.usagePercent}%` }"
            ></div>
          </div>

          <div class="space-inline-panel">
            <p class="section-copy">
              {{ space.estimatedRemainingImageCount === null
                ? '再多传几张后，这里会显示还能放多少。'
                : `按现在的大小，大约还能放 ${space.estimatedRemainingImageCount} 张。` }}
            </p>
            <p class="space-meta-line">
              <span>备份会带上当前清单、奖励和记录</span>
              <span>最好两个人都各自留一份</span>
            </p>
            <div class="button-row">
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
            <h3>同步与退出</h3>
            <p class="space-fold-copy">{{ space.advancedSummary }}</p>
          </div>

          <div class="space-fold-meta">
            <div class="badge-row">
              <span class="badge">{{ space.syncStatusLabel }}</span>
            </div>
            <div class="space-fold-toggle" aria-hidden="true">
              <span class="space-fold-toggle-state">
                <span class="space-fold-when-closed">展开</span>
                <span class="space-fold-when-open">收起</span>
              </span>
              <span class="space-fold-arrow"></span>
            </div>
          </div>
        </summary>

        <div class="space-fold-body">
          <div class="space-advanced-grid">
            <article class="space-access-card">
              <div class="space-subsection-heading">
                <div>
                  <p class="eyebrow">只在排查时翻</p>
                  <h3>排查时再看</h3>
                </div>
                <span class="badge">{{ space.supabaseAuthMode }}</span>
              </div>

              <p class="space-card-intro">这些信息主要用于排查同步问题，平时不用反复确认。</p>

              <div class="info-list">
                <div v-for="item in space.advancedInfoRows" :key="item.label" class="info-row">
                  <span class="muted">{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </div>
              </div>
            </article>

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
    radial-gradient(circle at 84% 18%, rgba(216, 231, 220, 0.42), transparent 28%),
    radial-gradient(circle at 0% 100%, rgba(233, 209, 178, 0.28), transparent 30%),
    linear-gradient(142deg, rgba(255, 253, 249, 0.98), rgba(249, 240, 229, 0.94));
  border-color: rgba(201, 111, 74, 0.16);
  box-shadow: 0 24px 48px rgba(104, 73, 52, 0.08);
}

.space-reward-hub {
  background:
    radial-gradient(circle at top right, rgba(241, 214, 202, 0.22), transparent 22%),
    radial-gradient(circle at top left, rgba(216, 231, 220, 0.24), transparent 24%),
    linear-gradient(180deg, rgba(255, 251, 246, 0.97), rgba(247, 240, 231, 0.92));
  gap: 0.95rem;
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
  border: 1px solid rgba(95, 74, 55, 0.08);
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

.space-utility-card-overview {
  order: 3;
}

.space-utility-card-advanced {
  order: 4;
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
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.58);
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

.space-utility-card-overview {
  background: linear-gradient(180deg, rgba(249, 252, 250, 0.94), rgba(240, 243, 237, 0.88));
}

.space-utility-card-access {
  background: linear-gradient(180deg, rgba(255, 250, 246, 0.94), rgba(245, 237, 228, 0.88));
}

.space-utility-card-memory {
  background: linear-gradient(180deg, rgba(252, 249, 242, 0.94), rgba(244, 238, 225, 0.9));
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

.space-fold-toggle-state {
  display: inline-flex;
  align-items: center;
  color: rgba(122, 92, 74, 0.84);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
  text-transform: uppercase;
}

.space-fold-when-open {
  display: none;
}

.space-fold-card[open] > .space-fold-summary .space-fold-when-open {
  display: inline;
}

.space-fold-card[open] > .space-fold-summary .space-fold-when-closed {
  display: none;
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

.member-switch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
}

.member-switch-button {
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.82rem 1rem;
  background: rgba(255, 255, 255, 0.82);
  color: var(--text-main);
  transition: transform 160ms ease, background 160ms ease, border-color 160ms ease;
}

.member-switch-button:hover {
  transform: translateY(-1px);
}

.member-switch-button.active {
  background: rgba(216, 231, 220, 0.8);
  border-color: rgba(159, 190, 174, 0.44);
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

.space-utility-card .member-switch-button {
  background: rgba(255, 255, 255, 0.72);
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
.space-reward-shelf-grid,
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
  background: linear-gradient(180deg, rgba(255, 253, 249, 0.86), rgba(249, 241, 232, 0.82));
}

.space-reward-form-grid {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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

.reward-form-cost-field {
  max-width: 10rem;
}

.reward-form-submit-row {
  gap: 0.62rem;
  padding-top: 0.68rem;
  border-top: 1px dashed rgba(95, 74, 55, 0.12);
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
  background: linear-gradient(180deg, rgba(255, 252, 248, 0.76), rgba(248, 240, 231, 0.72));
}

.reward-shelf-card-premium {
  background: linear-gradient(180deg, rgba(255, 249, 244, 0.84), rgba(246, 238, 226, 0.76));
}

.reward-card {
  gap: 0.82rem;
  background: rgba(255, 255, 255, 0.72);
}

.reward-card-actions {
  gap: 0.58rem;
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
  border: 1px solid rgba(95, 74, 55, 0.1);
  background: rgba(255, 255, 255, 0.7);
}

.reward-compact-row-premium {
  border-color: rgba(181, 138, 56, 0.26);
  background:
    linear-gradient(135deg, rgba(255, 252, 246, 0.96), rgba(246, 239, 229, 0.82)),
    radial-gradient(circle at top right, rgba(232, 216, 166, 0.28), transparent 34%);
  box-shadow: 0 12px 24px rgba(163, 118, 35, 0.12);
}

.reward-compact-row.is-collapsed {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.68rem;
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

.reward-compact-actions {
  gap: 0.42rem;
  justify-content: flex-end;
  padding-top: 0;
  border-top: none;
}

.reward-member-strip {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.64rem;
  align-items: start;
  padding: 0.78rem 0.84rem;
  border-radius: 18px;
  border: 1px solid rgba(95, 74, 55, 0.1);
  background: linear-gradient(135deg, rgba(255, 253, 249, 0.84), rgba(248, 241, 233, 0.76));
  box-shadow: var(--shadow-card);
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
  background: rgba(216, 231, 220, 0.76);
  color: rgba(83, 71, 57, 0.88);
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
  border: 1px solid rgba(95, 74, 55, 0.08);
  background: rgba(255, 255, 255, 0.58);
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

.reward-claim-body {
  display: grid;
  gap: 0.45rem;
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
  .space-reward-shelf-grid,
  .space-reward-hub-tabs,
  .space-access-grid,
  .space-member-grid,
  .space-reward-member-grid,
  .space-fact-grid,
  .space-storage-grid,
  .space-pending-grid,
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

  .space-claim-fold-top .space-fold-summary {
    gap: 0.6rem;
  }

  .space-reward-hub-pills {
    justify-content: flex-start;
  }

  .space-reward-hub-tab {
    align-items: flex-start;
  }

  .space-reward-hub-tab-copy {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.12rem;
  }

  .reward-compact-row {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .reward-member-strip-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.58rem;
  }

  .reward-compact-actions,
  .reward-member-strip-preview {
    width: 100%;
  }

  .reward-compact-actions {
    justify-content: stretch;
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