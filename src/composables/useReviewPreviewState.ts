import { computed } from 'vue'
import { useReviewPageState } from './useReviewPageState'

type ReviewPreviewTab = 'journals' | 'live' | 'snapshots'

export function useReviewPreviewState() {
  const reviewState = useReviewPageState()

  if (reviewState.reviewTab.value === 'journals') {
    reviewState.reviewTab.value = 'live'
  }

  const previewTabs = computed(() => {
    return reviewState.reviewTabOptions.value.map((tab) => ({
      ...tab,
      label: getPreviewTabLabel(tab.value),
      shortNote: getPreviewTabShortNote(tab.value, reviewState.currentMonthLabel.value),
    }))
  })

  const activePreviewTab = computed(() => {
    return previewTabs.value.find((tab) => tab.value === reviewState.reviewTab.value) ?? previewTabs.value[0]
  })

  const issueRibbonItems = computed(() => {
    return reviewState.reviewHighlights.value.map((item) => ({
      key: item.key,
      eyebrow: item.eyebrow,
      label: item.label,
      value: item.value,
      note: item.note,
      accent: item.accent,
    }))
  })

  const leadMoment = computed(() => {
    const liveThread = reviewState.liveMonthlyThreads.value[0]

    if (liveThread) {
      return {
        title: liveThread.messageText,
        eyebrow: '本期最近一笔',
        meta: `${reviewState.formatDateTimeLabel(liveThread.createdAt)} · ${reviewState.getThreadActorName(liveThread)}`,
      }
    }

    const journalWish = reviewState.completedWishJournals.value[0]

    if (journalWish) {
      return {
        title: `${journalWish.title} 已经完成，收进这一册了。`,
        eyebrow: '最近成册',
        meta: `${reviewState.formatDateLabel(journalWish.completedAt ?? journalWish.updatedAt)} · ${reviewState.getMemberName(journalWish.ownerId)}`,
      }
    }

    const snapshot = reviewState.monthlySnapshots.value[0]

    if (snapshot) {
      return {
        title: snapshot.coverTitle,
        eyebrow: '最近封存',
        meta: `${reviewState.formatMonthLabel(snapshot.monthKey)} · 已冻结成册`,
      }
    }

    return {
      title: '这一册还在等第一条记录落下来。',
      eyebrow: '卷首空白',
      meta: '先写下一条愿望，或者给正在推进的事留一句话。',
    }
  })

  const liveTimelineGroups = computed(() => {
    const groups = new Map<string, {
      label: string
      entries: Array<{
        id: string
        actorName: string
        actorToneClass: string
        eventLabel: string
        messageText: string
        timeLabel: string
        wishId: string | null
        wishTitle: string
      }>
    }>()

    reviewState.liveMonthlyThreads.value.forEach((thread) => {
      const groupKey = reviewState.formatDateLabel(thread.createdAt)
      const currentGroup = groups.get(groupKey)
      const nextEntry = {
        actorName: reviewState.getThreadActorName(thread),
        actorToneClass: reviewState.getMemberToneClass(thread.actorId),
        eventLabel: reviewState.getThreadEventLabel(thread.eventKind),
        id: thread.id,
        messageText: thread.messageText,
        timeLabel: reviewState.formatDateTimeLabel(thread.createdAt),
        wishId: thread.wishId,
        wishTitle: reviewState.getWishTitle(thread),
      }

      if (currentGroup) {
        currentGroup.entries.push(nextEntry)
        return
      }

      groups.set(groupKey, {
        label: groupKey,
        entries: [nextEntry],
      })
    })

    return [...groups.values()]
  })

  const journalShelfItems = computed(() => {
    return reviewState.completedWishJournals.value.map((wish) => ({
      id: wish.id,
      ownerName: reviewState.getMemberName(wish.ownerId),
      ownerToneClass: reviewState.getMemberToneClass(wish.ownerId),
      previewEntries: reviewState.getWishJournalPreview(wish.id).map((entry) => ({
        id: entry.id,
        actorName: reviewState.getThreadActorName(entry),
        actorToneClass: reviewState.getMemberToneClass(entry.actorId),
        eventLabel: reviewState.getThreadEventLabel(entry.eventKind),
        messageText: entry.messageText,
      })),
      scopeLabel: reviewState.getWishScopeLabel(wish.scope),
      timeLabel: reviewState.formatDateLabel(wish.completedAt ?? wish.updatedAt),
      title: wish.title,
    }))
  })

  const snapshotShelfItems = computed(() => {
    return reviewState.monthlySnapshots.value.map((snapshot) => ({
      coverSubtitle: snapshot.coverSubtitle,
      coverTitle: snapshot.coverTitle,
      id: snapshot.id,
      metrics: {
        comments: reviewState.getSnapshotMetric(snapshot, 'commentCount'),
        threads: reviewState.getSnapshotMetric(snapshot, 'threadCount'),
      },
      monthLabel: reviewState.formatMonthLabel(snapshot.monthKey),
      previewBlocks: reviewState.getSnapshotPreviewBlocks(snapshot).map((block, index) => ({
        actorName: reviewState.getSnapshotBlockActor(block),
        actorToneClass: reviewState.getMemberToneClass(reviewState.getSnapshotBlockActorId(block)),
        id: reviewState.getSnapshotBlockKey(snapshot.id, block, index),
        label: reviewState.getSnapshotBlockLabel(block),
        messageText: reviewState.getSnapshotBlockMessage(block),
      })),
      timeLabel: reviewState.formatDateLabel(snapshot.createdAt),
    }))
  })

  const memberDigest = computed(() => {
    return reviewState.reviewMemberSummaries.value.map((member) => ({
      countLabel: member.countLabel,
      latestText: member.latestText,
      memberId: member.memberId,
      memberName: member.memberName,
      summaryText: member.summaryText,
      toneClass: member.toneClass,
    }))
  })

  const emptyStates = computed(() => {
    return {
      journals: {
        actionLabel: '先去清单挑一条',
        actionRoute: { name: 'list' as const },
        title: '完成册页还在等第一本。',
      },
      live: {
        actionLabel: '先写下一条愿望',
        actionRoute: { name: 'compose' as const },
        title: '本期时间流还没有开始写。',
      },
      snapshots: {
        actionLabel: '先看本期回顾',
        actionRoute: { name: 'review' as const },
        title: '归档书架还没有第一册。',
      },
    }
  })

  return {
    activePreviewTab,
    currentMonthLabel: reviewState.currentMonthLabel,
    emptyStates,
    issueRibbonItems,
    journalShelfItems,
    leadMoment,
    liveTimelineGroups,
    memberDigest,
    monthlyNote: reviewState.monthlyNote,
    previewHeroAside: reviewState.reviewHeroAside,
    previewHeroLead: reviewState.reviewHeroLead,
    previewHeroTitle: reviewState.reviewHeroTitle,
    previewTabs,
    reviewTab: reviewState.reviewTab,
    snapshotShelfItems,
  }
}

function getPreviewTabLabel(tab: ReviewPreviewTab) {
  if (tab === 'live') {
    return '本期'
  }

  if (tab === 'journals') {
    return '已完成'
  }

  return '已封存'
}

function getPreviewTabShortNote(tab: ReviewPreviewTab, currentMonthLabel: string) {
  if (tab === 'live') {
    return `${currentMonthLabel} 还在继续写。`
  }

  if (tab === 'journals') {
    return '已经走完整条路的，会先留在这一册。'
  }

  return '月份过去后，会被封成固定版本。'
}