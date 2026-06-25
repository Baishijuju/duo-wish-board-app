import { computed } from 'vue'
import { useSpaceState } from './useSpaceState'

export function useSpacePageState() {
  const space = useSpaceState()

  const viewerName = computed(() => space.authStore.currentMember?.displayName ?? '你')
  const memberNamesLabel = computed(() => {
    const names = space.authStore.members.map((member) => member.displayName).filter(Boolean)

    if (!names.length) {
      return '这间空间还在等第一个名字出现'
    }

    return names.join(' / ')
  })

  const currentMemberRewardCount = computed(() => {
    return space.currentMemberDailyRewards.value.length + space.currentMemberPremiumRewards.value.length
  })

  const totalRewardCount = computed(() => {
    return space.rewardPoolByMember.value.reduce((count, item) => {
      return count + item.dailyRewards.length + item.premiumRewards.length
    }, 0)
  })

  const heroBadges = computed(() => {
    return [
      space.authStore.spaceName,
      space.authStore.members.length > 1 ? '两个人都在' : '等对方进来',
      space.syncStatusLabel.value,
    ]
  })

  const heroCopy = computed(() => {
    if (space.authStore.members.length > 1) {
      return `${memberNamesLabel.value} 已经在同一页里碰头。先看现在的节奏，再决定下一步。`
    }

    if (space.authStore.isAuthenticated) {
      return `${viewerName.value} 先把这里收好，等对方进来后再一起用。`
    }

    return '先从这里进来，这间空间才会慢慢收起两个人的日常。'
  })

  const identitySummary = computed(() => {
    if (space.authStore.members.length > 1) {
      return '两个人都已经在这里，可以从节奏或奖励账页继续往下看。'
    }

    if (space.authStore.isAuthenticated) {
      return `${viewerName.value} 先在这里等着，对方拿到邀请口令后就能进来。`
    }

    return '先用邮箱进来，这页才会慢慢变成共同空间。'
  })

  const summaryGuide = computed(() => {
    if (space.authStore.members.length > 1) {
      return '先认人，再看奖励；邀请、照片和备份都在后面。'
    }

    if (space.authStore.isAuthenticated) {
      return '先认人，再写奖励；邀请、照片和备份都在后面。'
    }

    return '先用邮箱进来，再认人、写奖励。'
  })

  const utilityBandLead = computed(() => {
    if (space.authStore.isAuthenticated) {
      return '先看怎么进来和怎么邀请，再看照片余量；概览和同步细节都在后面。'
    }

    return '先把进入方式理顺，再看邀请和照片余量。'
  })

  const summaryCards = computed(() => {
    return [
      {
        accent: 'accent-sunrise',
        caption: space.pendingStarCoinSpend.value
          ? `想把高档奖励都换一遍，还差 ${space.pendingStarCoinSpend.value} 枚`
          : currentMemberRewardCount.value
            ? '已经够换手边至少一部分大奖励了'
            : '先写几条奖励',
        label: '星星币',
        note: '手里已经攒下',
        value: `${space.currentMemberStarCoins.value} 枚`,
      },
      {
        accent: 'accent-aurora',
        caption: space.pendingSmallRewardUnits.value
          ? `步骤 ${space.pendingStepRewards.value.length} 条 · 数字进度 ${space.pendingCountRewardUnits.value} 点`
          : '新的推进会先把小奖励留在这里',
        label: '待领取',
        note: '空间页统一接住',
        value: `${space.pendingSmallRewardUnits.value} 份`,
      },
      {
        accent: 'accent-golden',
        caption: space.recentRewardClaims.value.length
          ? `最近记下 ${space.recentRewardClaims.value.length} 笔领取记录`
          : '第一笔领取记录会记在这里',
        label: '奖励账页',
        note: '写下的奖励',
        value: `${totalRewardCount.value} 条`,
      },
    ]
  })

  const relationshipLead = computed(() => {
    if (space.authStore.members.length > 1) {
      return '看看最近谁在推进，谁也该被接一下。'
    }

    return '先把这里收好，等对方进来。'
  })

  const memberStoryCards = computed(() => {
    return space.perMemberStats.value.map((item) => ({
      ...item,
      footnote: `星星币 ${item.starCoins} 枚，照片约 ${space.formatStorageBytes(item.imageBytes)}。`,
      roleLabel: space.roleLabels[item.member.role],
      statPills: [
        `在路上 ${item.active}`,
        `已实现 ${item.done}`,
        `一起 ${item.sharedCount}`,
        `私密 ${item.privateCount}`,
      ],
      summary: item.overdue
        ? `有 ${item.overdue} 个愿望慢了一点。`
        : item.active
          ? `${item.active} 个愿望在往前走。`
          : '可以写下一条新愿望。',
      supportingLine: `留言 ${item.comments} · 照片 ${item.imageCount} · 星币 ${item.starCoins}`,
    }))
  })

  const accountBadges = computed(() => {
    if (space.authStore.isAuthenticated) {
      return space.canBindFixedEmail.value ? ['已进入', '可记住邮箱'] : ['已进入', '可邀请对方']
    }

    return ['待进入', '准备邀请对方']
  })

  const accountSummary = computed(() => {
    if (space.authStore.isAuthenticated) {
      return space.canBindFixedEmail.value
        ? '已经进来了，先把邀请口令交给对方；常用邮箱也能记在这里。'
        : '已经进来了，下一步把邀请口令交给对方就好。'
    }

    return '先用邮箱进来，再把邀请口令交给对方。'
  })

  const inviteSummary = computed(() => {
    if (space.authStore.isAuthenticated) {
      return '把这串邀请口令发给对方，对方就能进来。'
    }

    return '先把自己带进来，这里的邀请口令才接得上。'
  })

  const storageLead = computed(() => {
    if (space.storageSummary.value.overSoftLimit) {
      return '照片已经有点多了，先留一份备份更安心。'
    }

    if (space.storageSummary.value.nearingLimit) {
      return '照片快接近上限了，现在顺手备份最合适。'
    }

    return '照片余量和备份都放在这里，需要时翻开就好。'
  })

  const storageSummaryLabel = computed(() => {
    if (!space.wishStore.stats.totalImages) {
      return `已用 ${space.storageSummary.value.usagePercent}% · 还没开始留照片`
    }

    return `已用 ${space.storageSummary.value.usagePercent}% · 已留下 ${space.wishStore.stats.totalImages} 张照片`
  })

  const storageFacts = computed(() => {
    return [
      {
        label: '已经留下',
        note: '照片已占用的空间。',
        value: space.formatStorageBytes(space.storageSummary.value.usedBytes),
      },
      {
        label: '还能放下',
        note: '按总容量估算的剩余空间。',
        value: space.formatStorageBytes(space.storageSummary.value.remainingBytes),
      },
      {
        label: '照片空间',
        note: '当前总照片额度。',
        value: space.formatStorageBytes(space.storageSummary.value.quotaBytes),
      },
      {
        label: '照片数量',
        note: '愿望里的照片总数。',
        value: `${space.wishStore.stats.totalImages} 张`,
      },
    ]
  })

  const advancedInfoRows = computed(() => {
    return [
      {
        label: '云端配置',
        value: space.authStore.usesSupabaseSpace ? '已就绪' : '本地体验中',
      },
      {
        label: '实时刷新',
        value: space.syncStatusLabel,
      },
      {
        label: '数据来源',
        value: space.wishStore.syncMessage,
      },
    ]
  })

  const advancedSummary = computed(() => {
    if (space.authStore.usesSupabaseSpace) {
      return '云端连接、实时刷新和退出入口都收在最后。'
    }

    return '现在还是本地体验，这里主要放同步状态和退出入口。'
  })

  return {
    ...space,
    accountBadges,
    accountSummary,
    advancedInfoRows,
    advancedSummary,
    currentMemberRewardCount,
    heroBadges,
    heroCopy,
    identitySummary,
    inviteSummary,
    memberNamesLabel,
    memberStoryCards,
    relationshipLead,
    storageFacts,
    storageLead,
    storageSummaryLabel,
    summaryGuide,
    summaryCards,
    totalRewardCount,
    utilityBandLead,
    viewerName,
  }
}