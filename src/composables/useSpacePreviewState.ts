import { computed, ref, watch } from 'vue'
import { useSpacePageState } from './useSpacePageState'

type SpacePreviewActionStage = 'count' | 'recent' | 'redeem' | 'steps'
type SpacePreviewPanel = 'claim' | 'editor'

export function useSpacePreviewState() {
  const space = useSpacePageState()

  const dailyTitleDraft = ref('')
  const dailyNoteDraft = ref('')
  const premiumTitleDraft = ref('')
  const premiumNoteDraft = ref('')
  const premiumCostDraft = ref(6)
  const previewMessage = ref('这版先看结构，不触发真实编辑、领取或兑换。')
  const activePanel = ref<SpacePreviewPanel>('claim')
  const actionStage = ref<SpacePreviewActionStage>('steps')

  const previewPanels = computed(() => {
    return [
      {
        key: 'claim' as const,
        note: '先把待领取、兑换和记录接住。',
        title: '领奖',
      },
      {
        key: 'editor' as const,
        note: '再去写、改和整理奖励池。',
        title: '编辑',
      },
    ]
  })

  const headerBadges = computed(() => {
    return [
      space.authStore.spaceName,
      space.authStore.members.length > 1 ? '两个人都在' : '等对方进来',
      space.syncStatusLabel.value,
    ]
  })

  const headerTitle = computed(() => {
    if (space.authStore.members.length > 1) {
      return '把共同空间收成一条更轻的抬头'
    }

    return '先把这间空间收成一条清楚的入口'
  })

  const headerLead = computed(() => {
    if (space.authStore.members.length > 1) {
      return `${space.memberNamesLabel.value} 已经在同一页里碰头。首屏先只留谁在这里、现在状态怎样，奖励和动作都往下收。`
    }

    return '先只留下空间名字、谁已经进来和当前状态，其他内容都在后面按段展开。'
  })

  const headerNote = computed(() => {
    if (space.authStore.members.length > 1) {
      return '愿望币从这里拿掉，奖励相关数字也不再抢首屏位置。'
    }

    return '这条抬头只负责认人和认状态，不负责塞统计。'
  })

  const headerDigest = computed(() => {
    return {
      memberLine: `成员：${space.memberNamesLabel.value}`,
      stateLine: space.identitySummary.value,
    }
  })

  const editorSummary = computed(() => {
    return {
      note: space.currentMemberRewardCount.value
        ? `你已经写下 ${space.currentMemberRewardCount.value} 条奖励，这一页里切到编辑就能继续整理。`
        : '先把会让自己开心的事写下来，后面领取时就不用临时想。',
      pills: [
        `日常 ${space.currentMemberDailyRewards.value.length}`,
        `高档 ${space.currentMemberPremiumRewards.value.length}`,
        `${space.currentMemberStarCoins.value} 星币`,
      ],
      title: '奖池编辑',
    }
  })

  const rewardFormSections = computed(() => {
    return [
      {
        costLabel: null,
        helper: '轻一点、随手能接住就够了。',
        key: 'daily',
        notePlaceholder: '比如为什么这个小奖励会让今天轻一点。',
        primaryLabel: '奖励名称',
        primaryPlaceholder: '例如：一杯喜欢的奶茶',
        secondaryLabel: '一句说明',
        title: '日常奖励',
      },
      {
        costLabel: '星币价格',
        helper: '留给完成大事，或者认真奖赏自己的时候。',
        key: 'premium',
        notePlaceholder: '比如为什么它值得慢慢攒着换到。',
        primaryLabel: '奖励名称',
        primaryPlaceholder: '例如：一次认真放松的体验',
        secondaryLabel: '一句说明',
        title: '高档奖励',
      },
    ]
  })

  const rewardShelfSections = computed(() => {
    return [
      {
        emptyLabel: '还没有日常奖励',
        hiddenCount: Math.max(space.currentMemberDailyRewards.value.length - 4, 0),
        items: space.currentMemberDailyRewards.value.slice(0, 4).map((item) => ({
          id: item.id,
          meta: item.note || '给小步骤的小奖励',
          title: item.title,
        })),
        title: '已写日常奖励',
      },
      {
        emptyLabel: '还没有高档奖励',
        hiddenCount: Math.max(space.currentMemberPremiumRewards.value.length - 4, 0),
        items: space.currentMemberPremiumRewards.value.slice(0, 4).map((item) => ({
          id: item.id,
          meta: item.starCoinCost > 0 ? `${item.starCoinCost} 星币` : '完成时领取',
          title: item.title,
        })),
        title: '已写高档奖励',
      },
    ]
  })

  const sharedRewardDigest = computed(() => {
    return space.rewardPoolByMember.value.map((item) => ({
      memberId: item.member.id,
      memberName: item.member.displayName,
      summary: `日常 ${item.dailyRewards.length} 条 · 高档 ${item.premiumRewards.length} 条 · ${item.starCoins} 星币`,
    }))
  })

  const actionSummary = computed(() => {
    return {
      note: space.pendingSmallRewardUnits.value
        ? `现在还有 ${space.pendingSmallRewardUnits.value} 份小奖励没接住，兑换和最近记录也一起压在这一张里。`
        : '待领取、兑换和记录都留在这一张里，编辑奖励时再切换过去。',
      pills: [
        `待领 ${space.pendingSmallRewardUnits.value}`,
        `可换 ${space.premiumRedeemableNowCount.value}`,
        `最近 ${space.recentRewardClaims.value.length}`,
      ],
      title: '领取台',
    }
  })

  const pendingStepEntries = computed(() => {
    return space.pendingStepRewards.value.map((item) => ({
      id: item.stepId,
      meta: `完成于 ${space.formatBeijingDateTime(item.completedAt)}`,
      source: `来自「${item.wishTitle}」`,
      title: item.stepTitle,
    }))
  })

  const pendingCountEntries = computed(() => {
    return space.pendingCountRewardSummaries.value.map((item) => ({
      id: item.wishId,
      meta: `${item.progressCurrent} / ${item.progressTarget}${item.progressUnit ? ` ${item.progressUnit}` : ''}`,
      source: `来自「${item.wishTitle}」`,
      title: `还有 ${space.getPendingCountUnitLabel(item.pendingUnits, item.progressUnit)} 没去领`,
    }))
  })

  const redeemEntries = computed(() => {
    return space.currentMemberPremiumExchangeRewards.value.map((item) => ({
      id: item.id,
      isRedeemableNow: space.canRedeemPremiumReward(item.starCoinCost),
      meta: item.note || '这条奖励还没有补充说明。',
      title: item.title,
      trailingLabel: `${item.starCoinCost} 星币`,
    }))
  })

  const recentEntries = computed(() => {
    return space.recentRewardClaims.value.slice(0, 3).map((item) => ({
      id: item.claim.id,
      meta: `${item.memberName} · ${space.formatBeijingDateTime(item.claim.createdAt)}`,
      title: item.claim.titleSnapshot,
      trailingLabel: item.claim.quantity > 1 ? `${item.claim.quantity} 份` : '1 份',
      typeLabel: space.getRewardClaimLabel(item.claim.claimKind),
    }))
  })

  const actionStages = computed(() => {
    return [
      {
        count: pendingStepEntries.value.length,
        emptyTitle: '现在没有待领取的步骤奖励',
        key: 'steps' as const,
        note: '完成的小步骤先从这里接住。',
        title: '步骤奖励',
      },
      {
        count: pendingCountEntries.value.length,
        emptyTitle: '现在没有待领取的数字进度奖励',
        key: 'count' as const,
        note: '数字推进积下来的小奖励，统一在这里接。',
        title: '数字进度',
      },
      {
        count: redeemEntries.value.length,
        emptyTitle: '现在没有可兑换的高档奖励',
        key: 'redeem' as const,
        note: '只留下设置了星币价格的高档奖励。',
        title: '星币兑换',
      },
      {
        count: recentEntries.value.length,
        emptyTitle: '还没有领取或兑换记录',
        key: 'recent' as const,
        note: '最近发生的动作，只压成最必要的几笔。',
        title: '最近记录',
      },
    ]
  })

  const activeActionStage = computed(() => {
    return actionStages.value.find((item) => item.key === actionStage.value) ?? actionStages.value[0]
  })

  const activeActionEntries = computed(() => {
    if (actionStage.value === 'steps') {
      return pendingStepEntries.value
    }

    if (actionStage.value === 'count') {
      return pendingCountEntries.value
    }

    if (actionStage.value === 'redeem') {
      return redeemEntries.value
    }

    return recentEntries.value
  })

  const toolEntryPills = computed(() => {
    return ['进入与邀请', '照片与备份', '空间概览', '同步与退出']
  })

  watch(
    actionStages,
    () => {
      if (hasEntriesForStage(actionStage.value, pendingStepEntries.value.length, pendingCountEntries.value.length, redeemEntries.value.length, recentEntries.value.length)) {
        return
      }

      actionStage.value = getPreferredActionStage(
        pendingStepEntries.value.length,
        pendingCountEntries.value.length,
        redeemEntries.value.length,
        recentEntries.value.length,
      )
    },
    { immediate: true },
  )

  function previewAction(label: string) {
    previewMessage.value = `${label} 这一步先只看排版和层级，暂时不写入真实数据。`
  }

  return {
    activePanel,
    actionStage,
    actionStages,
    actionSummary,
    activeActionEntries,
    activeActionStage,
    dailyNoteDraft,
    dailyTitleDraft,
    editorSummary,
    headerBadges,
    headerDigest,
    headerLead,
    headerNote,
    headerTitle,
    pendingCountEntries,
    pendingStepEntries,
    premiumCostDraft,
    premiumNoteDraft,
    premiumTitleDraft,
    previewAction,
    previewPanels,
    previewMessage,
    recentEntries,
    redeemEntries,
    rewardFormSections,
    rewardShelfSections,
    sharedRewardDigest,
    toolEntryPills,
  }
}

function hasEntriesForStage(
  stage: SpacePreviewActionStage,
  stepCount: number,
  countCount: number,
  redeemCount: number,
  recentCount: number,
) {
  if (stage === 'steps') {
    return stepCount > 0
  }

  if (stage === 'count') {
    return countCount > 0
  }

  if (stage === 'redeem') {
    return redeemCount > 0
  }

  return recentCount > 0
}

function getPreferredActionStage(
  stepCount: number,
  countCount: number,
  redeemCount: number,
  recentCount: number,
): SpacePreviewActionStage {
  if (stepCount > 0) {
    return 'steps'
  }

  if (countCount > 0) {
    return 'count'
  }

  if (redeemCount > 0) {
    return 'redeem'
  }

  if (recentCount > 0) {
    return 'recent'
  }

  return 'steps'
}