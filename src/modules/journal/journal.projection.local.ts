import type {
  MonthlyJournalSnapshotRecord,
  RewardClaimRecord,
  ThreadReactionRecord,
  WishRecord,
  WishThreadEntry,
  WishThreadEventKind,
} from '../../stores/wishes'
import {
  compareIsoAscending,
  createMonthlyJournalSnapshotRecord,
  createWishThreadEntry,
} from './journal.factories'

type CountStarCoinClaimGroup = {
  actorId: string
  claimIds: string[]
  createdAt: string
  quantity: number
  starCoinDelta: number
  updatedAt: string
  wishId: string | null
  wishTitle: string | null
}

export function buildDerivedWishThreadEntries(
  wishes: WishRecord[],
  rewardClaims: RewardClaimRecord[],
  reactions: ThreadReactionRecord[],
) {
  const wishMap = new Map(wishes.map((wish) => [wish.id, wish]))
  const stepMap = new Map(
    wishes.flatMap((wish) => wish.steps.map((step) => [step.id, { step, wish }] as const)),
  )
  const stepCompletionClaimKinds = new Set<RewardClaimRecord['claimKind']>(['step_reward', 'star_coin', 'step_star_coin'])
  const stepIdsWithRewardClaims = new Set(
    rewardClaims
      .filter((claim) => !!claim.sourceStepId && stepCompletionClaimKinds.has(claim.claimKind))
      .map((claim) => claim.sourceStepId as string),
  )
  const countStarCoinClaimGroups = new Map<string, CountStarCoinClaimGroup>()
  const threadEntries: WishThreadEntry[] = []

  for (const wish of wishes) {
    threadEntries.push(
      createWishThreadEntry({
        actorId: wish.ownerId,
        createdAt: wish.createdAt,
        eventKind: 'wish_published',
        id: `thread-wish-published-${wish.id}`,
        messageText: `认真写下了「${wish.title}」。`,
        meta: {
          scope: wish.scope,
          status: wish.status,
        },
        updatedAt: wish.createdAt,
        wishId: wish.id,
      }),
    )

    if (wish.status === 'done') {
      const completedAt = wish.completedAt ?? wish.updatedAt

      threadEntries.push(
        createWishThreadEntry({
          actorId: wish.ownerId,
          createdAt: completedAt,
          eventKind: 'wish_completed',
          id: `thread-wish-completed-${wish.id}`,
          messageText: `把「${wish.title}」收进了回忆里。`,
          meta: {
            completedAt,
            status: wish.status,
          },
          updatedAt: completedAt,
          wishId: wish.id,
        }),
      )
    }

    for (const step of wish.steps.filter((item) => item.isDone)) {
      if (stepIdsWithRewardClaims.has(step.id)) {
        continue
      }

      threadEntries.push(
        createWishThreadEntry({
          actorId: wish.ownerId,
          createdAt: step.updatedAt,
          eventKind: 'wish_step_completed',
          id: `thread-wish-step-${step.id}`,
          messageText: `走完了小步骤「${step.title}」。`,
          meta: {
            stepId: step.id,
            stepTitle: step.title,
            wishTitle: wish.title,
          },
          updatedAt: step.updatedAt,
          wishId: wish.id,
        }),
      )
    }

    for (const comment of wish.comments.filter((item) => !isAutomaticCountProgressComment(item.message))) {
      threadEntries.push(
        createWishThreadEntry({
          actorId: comment.authorId,
          createdAt: comment.createdAt,
          eventKind: 'comment',
          id: comment.id,
          images: comment.images,
          messageText: comment.message,
          updatedAt: comment.createdAt,
          wishId: wish.id,
        }),
      )
    }
  }

  for (const claim of rewardClaims) {
    if (claim.claimKind === 'count_star_coin') {
      mergeCountStarCoinClaim(countStarCoinClaimGroups, claim, wishMap)
      continue
    }

    const relatedWish = claim.sourceWishId ? wishMap.get(claim.sourceWishId) ?? null : null
    const relatedStep = claim.sourceStepId ? stepMap.get(claim.sourceStepId)?.step ?? null : null
    const eventKind: WishThreadEventKind = claim.claimKind === 'premium_redeem' ? 'premium_redeem' : 'reward_claimed'
    const countUnitLabel = `${claim.quantity} 点`
    const gainedStarCoins = formatStarCoinAmount(Math.abs(claim.starCoinDelta))
    const messageText = claim.claimKind === 'step_reward'
      ? `完成「${relatedStep?.title ?? '这个小步骤'}」，接住「${claim.titleSnapshot}」。`
      : claim.claimKind === 'step_star_coin'
        ? `完成「${relatedStep?.title ?? '这个小步骤'}」，+${gainedStarCoins} 星。`
      : claim.claimKind === 'count_reward'
        ? `推进 +${countUnitLabel}，接住「${claim.titleSnapshot}」。`
        : claim.claimKind === 'wish_reward'
          ? `把「${relatedWish?.title ?? claim.titleSnapshot}」认真完成，也接住了「${claim.titleSnapshot}」。`
          : claim.claimKind === 'star_coin'
            ? claim.sourceStepId
              ? `完成「${relatedStep?.title ?? '这个小步骤'}」，+${gainedStarCoins} 星。`
              : `推进 +${countUnitLabel}，存下 ${gainedStarCoins} 星。`
            : `用 ${formatStarCoinAmount(Math.abs(claim.starCoinDelta))} 枚星星币换来了「${claim.titleSnapshot}」。`

    threadEntries.push(
      createWishThreadEntry({
        actorId: claim.ownerId,
        createdAt: claim.createdAt,
        eventKind,
        id: `thread-reward-claim-${claim.id}`,
        messageText,
        meta: {
          claimKind: claim.claimKind,
          noteSnapshot: claim.noteSnapshot,
          quantity: claim.quantity,
          rewardItemId: claim.rewardItemId,
          sourceStepId: claim.sourceStepId,
          sourceWishId: claim.sourceWishId,
          starCoinDelta: claim.starCoinDelta,
          stepTitle: relatedStep?.title ?? null,
          titleSnapshot: claim.titleSnapshot,
          wishTitle: relatedWish?.title ?? null,
        },
        updatedAt: claim.createdAt,
        wishId: claim.sourceWishId,
      }),
    )
  }

  for (const [groupKey, group] of countStarCoinClaimGroups) {
    threadEntries.push(
      createWishThreadEntry({
        actorId: group.actorId,
        createdAt: group.createdAt,
        eventKind: 'reward_claimed',
        id: `thread-count-star-coin-${groupKey}`,
        messageText: `推进 +${group.quantity} 步，+${formatStarCoinAmount(group.starCoinDelta)} 星。`,
        meta: {
          claimIds: group.claimIds,
          claimKind: 'count_star_coin',
          quantity: group.quantity,
          sourceWishId: group.wishId,
          starCoinDelta: group.starCoinDelta,
          wishTitle: group.wishTitle,
        },
        updatedAt: group.updatedAt,
        wishId: group.wishId,
      }),
    )
  }

  return attachThreadReactions(threadEntries, reactions)
}

export function createLocalMonthlyJournalSnapshot(
  monthKey: string,
  sourceThreads: WishThreadEntry[],
  currentSpaceId: string | null,
  spaceName: string,
  currentMemberId: string | null,
  getMemberDisplayName: (memberId: string | null) => string,
) {
  const orderedThreads = [...sourceThreads].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt) || left.id.localeCompare(right.id))

  return createMonthlyJournalSnapshotRecord({
    coverSubtitle: `${spaceName || '愿望空间'} 的固定版本回顾`,
    coverTitle: formatMonthCoverTitle(monthKey),
    createdAt: new Date().toISOString(),
    createdBy: currentMemberId,
    id: `snapshot-${monthKey}`,
    metricsSnapshot: {
      commentCount: orderedThreads.filter((thread) => thread.eventKind === 'comment').length,
      completedWishCount: orderedThreads.filter((thread) => thread.eventKind === 'wish_completed').length,
      reactionCount: orderedThreads.reduce((count, thread) => count + thread.reactions.reduce((total, reaction) => total + reaction.count, 0), 0),
      rewardEventCount: orderedThreads.filter((thread) => thread.eventKind === 'reward_claimed' || thread.eventKind === 'premium_redeem').length,
      threadCount: orderedThreads.length,
      wishCount: new Set(orderedThreads.map((thread) => thread.wishId).filter((wishId): wishId is string => !!wishId)).size,
    },
    monthKey,
    narrativeBlocks: orderedThreads.map((thread) => createSnapshotNarrativeBlock(thread, getMemberDisplayName)),
    snapshotStatus: 'ready',
    sourceRefs: orderedThreads.map((thread) => ({
      createdAt: thread.createdAt,
      eventKind: thread.eventKind,
      threadId: thread.id,
      wishId: thread.wishId,
    })),
    spaceId: currentSpaceId,
  })
}

export function ensureLocalMonthlySnapshots(
  nextThreads: WishThreadEntry[],
  existingSnapshots: MonthlyJournalSnapshotRecord[],
  currentMonthKey: string,
  createSnapshot: (monthKey: string, sourceThreads: WishThreadEntry[]) => MonthlyJournalSnapshotRecord,
) {
  const existingMonthKeys = new Set(existingSnapshots.map((snapshot) => snapshot.monthKey))
  const pendingThreadsByMonth = new Map<string, WishThreadEntry[]>()

  for (const thread of nextThreads) {
    const monthKey = getBeijingMonthKey(thread.createdAt)

    if (monthKey >= currentMonthKey || existingMonthKeys.has(monthKey)) {
      continue
    }

    const bucket = pendingThreadsByMonth.get(monthKey) ?? []
    bucket.push(thread)
    pendingThreadsByMonth.set(monthKey, bucket)
  }

  if (!pendingThreadsByMonth.size) {
    return [...existingSnapshots]
      .sort((left, right) => right.monthKey.localeCompare(left.monthKey) || compareIsoAscending(right.createdAt, left.createdAt))
  }

  return [
    ...existingSnapshots,
    ...[...pendingThreadsByMonth.entries()]
      .sort(([leftMonthKey], [rightMonthKey]) => leftMonthKey.localeCompare(rightMonthKey))
      .map(([monthKey, sourceThreads]) => createSnapshot(monthKey, sourceThreads)),
  ].sort((left, right) => right.monthKey.localeCompare(left.monthKey) || compareIsoAscending(right.createdAt, left.createdAt))
}

function mergeCountStarCoinClaim(
  groups: Map<string, CountStarCoinClaimGroup>,
  claim: RewardClaimRecord,
  wishMap: Map<string, WishRecord>,
) {
  const dateKey = getBeijingDateKey(claim.createdAt)
  const groupKey = `${dateKey}:${claim.sourceWishId ?? 'no-wish'}:${claim.ownerId}`
  const relatedWish = claim.sourceWishId ? wishMap.get(claim.sourceWishId) ?? null : null
  const previous = groups.get(groupKey)

  if (previous) {
    previous.claimIds.push(claim.id)
    previous.quantity += claim.quantity
    previous.starCoinDelta += claim.starCoinDelta
    previous.createdAt = compareIsoAscending(claim.createdAt, previous.createdAt) < 0 ? claim.createdAt : previous.createdAt
    previous.updatedAt = compareIsoAscending(previous.updatedAt, claim.createdAt) < 0 ? claim.createdAt : previous.updatedAt
    return
  }

  groups.set(groupKey, {
    actorId: claim.ownerId,
    claimIds: [claim.id],
    createdAt: claim.createdAt,
    quantity: claim.quantity,
    starCoinDelta: claim.starCoinDelta,
    updatedAt: claim.createdAt,
    wishId: claim.sourceWishId,
    wishTitle: relatedWish?.title ?? null,
  })
}

function buildThreadReactionSummaryMap(reactions: ThreadReactionRecord[]) {
  const threadMap = new Map<string, Map<string, { emoji: string; count: number; memberIds: string[] }>>()

  for (const reaction of [...reactions].sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt))) {
    const emojiMap = threadMap.get(reaction.targetThreadId) ?? new Map<string, { emoji: string; count: number; memberIds: string[] }>()
    const existingSummary = emojiMap.get(reaction.emoji)

    if (existingSummary) {
      existingSummary.count += 1

      if (!existingSummary.memberIds.includes(reaction.actorId)) {
        existingSummary.memberIds.push(reaction.actorId)
      }
    } else {
      emojiMap.set(reaction.emoji, {
        count: 1,
        emoji: reaction.emoji,
        memberIds: [reaction.actorId],
      })
    }

    threadMap.set(reaction.targetThreadId, emojiMap)
  }

  return new Map(
    [...threadMap.entries()].map(([threadId, emojiMap]) => [
      threadId,
      [...emojiMap.values()].sort((left, right) => right.count - left.count || left.emoji.localeCompare(right.emoji)),
    ]),
  )
}

function attachThreadReactions(entries: WishThreadEntry[], reactions: ThreadReactionRecord[]) {
  const reactionSummaryMap = buildThreadReactionSummaryMap(reactions)

  return [...entries]
    .map((entry) =>
      createWishThreadEntry({
        ...entry,
        reactions: reactionSummaryMap.get(entry.id) ?? [],
      }),
    )
    .sort((left, right) => compareIsoAscending(left.createdAt, right.createdAt) || left.id.localeCompare(right.id))
}

function getBeijingMonthKey(dateValue: string | Date = new Date()) {
  const timestamp = dateValue instanceof Date ? dateValue.getTime() : new Date(dateValue).getTime()
  const shiftedDate = new Date((Number.isNaN(timestamp) ? Date.now() : timestamp) + 8 * 60 * 60 * 1000)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')

  return `${year}-${month}`
}

function getBeijingDateKey(dateValue: string | Date = new Date()) {
  const timestamp = dateValue instanceof Date ? dateValue.getTime() : new Date(dateValue).getTime()
  const shiftedDate = new Date((Number.isNaN(timestamp) ? Date.now() : timestamp) + 8 * 60 * 60 * 1000)
  const year = shiftedDate.getUTCFullYear()
  const month = `${shiftedDate.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${shiftedDate.getUTCDate()}`.padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatStarCoinAmount(value: number) {
  const roundedValue = Math.round(value * 10) / 10
  return Number.isInteger(roundedValue) ? `${roundedValue}` : roundedValue.toFixed(1)
}

function isAutomaticCountProgressComment(message: string) {
  const normalizedMessage = message.trim()

  return normalizedMessage.startsWith('数字进度往前推进了 ') || normalizedMessage.startsWith('数字进度改到了 ')
}

function formatMonthCoverTitle(monthKey: string) {
  const [year = '', month = ''] = monthKey.split('-')
  return `${year}年${month}月 月刊`
}

function createSnapshotNarrativeBlock(
  thread: WishThreadEntry,
  getMemberDisplayName: (memberId: string | null) => string,
) {
  return {
    actorId: thread.actorId,
    actorName: getMemberDisplayName(thread.actorId),
    createdAt: thread.createdAt,
    eventKind: thread.eventKind,
    id: thread.id,
    images: thread.images.map((image) => ({
      createdAt: image.createdAt,
      createdBy: image.createdBy,
      fileName: image.fileName,
      id: image.id,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      storagePath: image.storagePath,
      url: image.url,
    })),
    messageText: thread.messageText,
    meta: { ...thread.meta },
    reactions: thread.reactions.map((reaction) => ({
      count: reaction.count,
      emoji: reaction.emoji,
      memberIds: [...reaction.memberIds],
    })),
    updatedAt: thread.updatedAt,
    wishId: thread.wishId,
  }
}
