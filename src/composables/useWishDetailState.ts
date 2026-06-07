import { computed, nextTick, onBeforeUnmount, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { DRAGON_BALL_COIN_TARGET, type WishImage, type WishThreadEntry, useWishStore } from '../stores/wishes'

interface UseWishDetailStateOptions {
  wishId?: MaybeRefOrGetter<string | null | undefined>
  fallbackToFirst?: boolean
}

export function useWishDetailState(options: UseWishDetailStateOptions = {}) {
  const route = useRoute()
  const router = useRouter()
  const authStore = useAuthStore()
  const wishStore = useWishStore()

  const selectedWish = computed(() => {
    const preferredId = String(toValue(options.wishId) ?? route.params.id ?? '')
    const preferredWish = preferredId ? wishStore.findById(preferredId) : null

    if (preferredWish) {
      return preferredWish
    }

    return options.fallbackToFirst ? wishStore.sortedWishes[0] : undefined
  })

  const draftAuthorId = ref(authStore.currentMember?.id ?? authStore.members[0]?.id ?? '')
  const draftMessage = ref('')
  const commentFeedback = ref('')
  const commentFeedbackTone = ref<'success' | 'danger'>('success')
  const threadFeedback = ref('')
  const threadFeedbackTone = ref<'success' | 'danger'>('success')
  const editingThreadId = ref('')
  const editingThreadMessage = ref('')
  const deletingThreadId = ref('')
  const isSubmittingComment = ref(false)
  const isSavingThreadEdit = ref(false)
  const lastFailedCommentDraft = ref('')
  const commentImageFiles = ref<File[]>([])
  const commentImageInputVersion = ref(0)
  const pendingThreadReactionKeys = ref<string[]>([])
  const expandedThreadReactionIds = ref<string[]>([])
  const activeReactionPickerThreadId = ref<string | null>(null)
  const activeReactionPickerTriggerId = ref<string | null>(null)
  const isUploadingImages = ref(false)
  const isReorderingImages = ref(false)
  const isSelectingImages = ref(false)
  const isDeletingSelectedImages = ref(false)
  const isSavingImageNote = ref(false)
  const draggedImageId = ref<string | null>(null)
  const dragOverImageId = ref<string | null>(null)
  const previewImageId = ref<string | null>(null)
  const editingImageNoteId = ref<string | null>(null)
  const imageNoteDraft = ref('')
  const selectedImageIds = ref<string[]>([])
  const countProgressDraft = ref(0)
  const stepDraft = ref('')
  const lightboxImages = ref<WishImage[]>([])
  const pendingCompletionKind = ref<'wish' | null>(null)
  const pendingWishRewardSelectionId = ref('')
  const rewardFeedback = ref('')
  const rewardFeedbackTone = ref<'success' | 'danger'>('success')
  const stepRewardFeedbackTargetId = ref('')
  const isCountProgressFeedback = ref(false)
  const isSubmittingReward = ref(false)
  const shouldRecordCountProgressLog = ref(false)

  const deletableImageCount = computed(() => selectedWish.value?.images.filter((image) => canDeleteImage(image.createdBy)).length ?? 0)
  const coinSnapshot = computed(() => {
    return selectedWish.value ? wishStore.getWishCoinSummary(selectedWish.value) : null
  })
  const progressSnapshot = computed(() => {
    return selectedWish.value ? wishStore.getWishProgressSnapshot(selectedWish.value) : null
  })
  const currentMemberId = computed(() => authStore.currentMemberId || authStore.currentMember?.id || '')
  const currentMemberPremiumRewards = computed(() => {
    return currentMemberId.value ? wishStore.getRewardPoolItems(currentMemberId.value, 'premium') : []
  })
  const currentMemberStarCoins = computed(() => wishStore.currentMemberStarCoinBalance)
  const activeThreadReactionKey = computed(() => pendingThreadReactionKeys.value[0] ?? '')
  const wishRewardClaim = computed(() => {
    return selectedWish.value ? wishStore.getWishRewardClaim(selectedWish.value) : null
  })
  const canConfirmWishReward = computed(() => !!selectedWish.value && !!pendingWishRewardSelectionId.value && !isSubmittingReward.value)
  const coinProgressPercent = computed(() => {
    if (!coinSnapshot.value) {
      return 0
    }

    return Math.min(100, Math.round((Math.min(coinSnapshot.value.total, DRAGON_BALL_COIN_TARGET) / DRAGON_BALL_COIN_TARGET) * 100))
  })
  const previewImageIndex = computed(() => {
    if (!previewImageId.value) {
      return -1
    }

    return lightboxImages.value.findIndex((image) => image.id === previewImageId.value)
  })

  const previewImage = computed(() => {
    return previewImageIndex.value >= 0 ? lightboxImages.value[previewImageIndex.value] ?? null : null
  })

  const canPreviewPrevious = computed(() => previewImageIndex.value > 0)
  const canPreviewNext = computed(() => previewImageIndex.value >= 0 && previewImageIndex.value < lightboxImages.value.length - 1)
  const canRetryComment = computed(() => !!(lastFailedCommentDraft.value || draftMessage.value.trim()) && !isSubmittingComment.value)
  const wishJournalEntries = computed(() => {
    return selectedWish.value ? wishStore.getWishThreadEntries(selectedWish.value.id) : []
  })

  const FEATURED_THREAD_REACTION_OPTIONS = ['❤️', '😂', '😮', '🔥', '🎉', '✨']
  const EXTENDED_THREAD_REACTION_OPTIONS = Array.from(new Set([
    '👍', '👎', '👌', '👏', '🙌', '🤝', '🫶',
    '😊', '😄', '😌', '🥰', '😍', '🤗', '🥳',
    '🥹', '🥺', '😭', '😮', '🤯', '😡', '😴',
    '💪', '🙏', '💯', '💖', '🌟', '✨', '🍀',
  ])).filter((emoji) => !FEATURED_THREAD_REACTION_OPTIONS.includes(emoji))
  const THREAD_REACTION_OPTIONS = [...FEATURED_THREAD_REACTION_OPTIONS, ...EXTENDED_THREAD_REACTION_OPTIONS]
  const THREAD_REACTION_LABELS: Record<string, string> = {
    '❤️': '喜欢',
    '😂': '笑出声',
    '😮': '有点惊喜',
    '🔥': '太有感觉了',
    '🎉': '值得庆祝',
    '✨': '好有灵光',
    '🫶': '被接住了',
    '👏': '真想鼓掌',
    '🥹': '有点感动',
    '🥺': '好想抱一下',
    '💪': '一起加油',
    '🌟': '这刻在发光',
    '😍': '太喜欢了',
    '🥰': '心都软了',
    '🙌': '太好了',
    '🤝': '一起记住',
    '😊': '很安心',
    '😌': '刚刚好',
    '😭': '有点想哭',
    '🥳': '好热闹',
    '💖': '想把这刻收起来',
    '🙏': '认真谢谢你',
  }

  watch(
    () => authStore.currentMemberId,
    (memberId) => {
      if (memberId) {
        draftAuthorId.value = memberId
      }
    },
    { immediate: true },
  )

  watch(
    () => selectedWish.value?.images.map((image) => image.id).join('|') ?? '',
    () => {
      const visibleImageIds = new Set(selectedWish.value?.images.map((image) => image.id) ?? [])

      if (selectedImageIds.value.length) {
        selectedImageIds.value = selectedImageIds.value.filter((imageId) => visibleImageIds.has(imageId))
      }

      if (editingImageNoteId.value && !visibleImageIds.has(editingImageNoteId.value)) {
        cancelEditingImageNote()
      }
    },
  )

  watch(
    () => lightboxImages.value.map((image) => image.id).join('|'),
    () => {
      if (!previewImageId.value) {
        return
      }

      if (!lightboxImages.value.some((image) => image.id === previewImageId.value)) {
        previewImageId.value = lightboxImages.value[0]?.id ?? null
      }
    },
  )

  watch(
    currentMemberPremiumRewards,
    (items) => {
      if (!items.some((item) => item.id === pendingWishRewardSelectionId.value)) {
        pendingWishRewardSelectionId.value = items[0]?.id ?? ''
      }
    },
    { immediate: true },
  )

  watch(
    () => selectedWish.value?.id ?? '',
    () => {
      closeRewardDialog(false)
      cancelEditingThreadComment()
      rewardFeedback.value = ''
      stepRewardFeedbackTargetId.value = ''
      isCountProgressFeedback.value = false
      expandedThreadReactionIds.value = []
      pendingThreadReactionKeys.value = []
      closeThreadReactionPicker(false)
    },
  )

  watch(
    () => !!previewImageId.value || !!activeReactionPickerThreadId.value,
    (shouldLockScroll) => {
      if (typeof document === 'undefined') {
        return
      }

      document.body.style.overflow = shouldLockScroll ? 'hidden' : ''
    },
  )

  watch(
    () => `${selectedWish.value?.id ?? ''}|${selectedWish.value?.progressMode ?? 'none'}|${selectedWish.value?.progressCurrent ?? 0}`,
    () => {
      countProgressDraft.value = selectedWish.value?.progressMode === 'count' ? selectedWish.value.progressCurrent : 0
    },
    { immediate: true },
  )

  function getMemberName(memberId: string) {
    return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
  }

  function getThreadActorName(thread: WishThreadEntry) {
    return thread.actorId ? getMemberName(thread.actorId) : '系统'
  }

  function isCommentThread(thread: WishThreadEntry) {
    return thread.eventKind === 'comment'
  }

  function getThreadEyebrow(thread: WishThreadEntry) {
    const claimKind = typeof thread.meta.claimKind === 'string' ? thread.meta.claimKind : ''
    const sourceStepId = typeof thread.meta.sourceStepId === 'string' ? thread.meta.sourceStepId : ''

    if (thread.eventKind === 'comment') {
      return '留言'
    }

    if (thread.eventKind === 'wish_published') {
      return '写下'
    }

    if (thread.eventKind === 'wish_step_completed') {
      return '步骤完成'
    }

    if (thread.eventKind === 'wish_coin_cast') {
      return '投币'
    }

    if (thread.eventKind === 'dragon_ball_reached') {
      return '七龙珠'
    }

    if (thread.eventKind === 'wish_completed') {
      return '完成'
    }

    if (thread.eventKind === 'premium_redeem') {
      return '兑换奖励'
    }

    if (thread.eventKind === 'weekly_welfare_issued') {
      return '本周发放'
    }

    if (claimKind === 'count_reward') {
      return '数字奖励'
    }

    if (claimKind === 'star_coin' && !sourceStepId) {
      return '进度存币'
    }

    return '领奖'
  }

  function getThreadHeadline(thread: WishThreadEntry) {
    const claimKind = typeof thread.meta.claimKind === 'string' ? thread.meta.claimKind : ''
    const sourceStepId = typeof thread.meta.sourceStepId === 'string' ? thread.meta.sourceStepId : ''

    if (thread.eventKind === 'comment') {
      return '留下了一句此刻的话'
    }

    if (thread.eventKind === 'wish_published') {
      return '这条愿望被认真写下'
    }

    if (thread.eventKind === 'wish_step_completed') {
      return '又往前走完了一小步'
    }

    if (thread.eventKind === 'wish_coin_cast') {
      return '有人替它轻轻投下一枚币'
    }

    if (thread.eventKind === 'dragon_ball_reached') {
      return '七龙珠已经集齐'
    }

    if (thread.eventKind === 'wish_completed') {
      return '它被正式收进回忆里'
    }

    if (thread.eventKind === 'premium_redeem') {
      return '星星币换成了一份奖励'
    }

    if (thread.eventKind === 'weekly_welfare_issued') {
      return '这一周的新愿望币到了'
    }

    if (claimKind === 'count_reward') {
      return '数字进度接住了一份小奖励'
    }

    if (claimKind === 'star_coin' && !sourceStepId) {
      return '数字进度先存成了星星币'
    }

    return '一份奖励被认真接住了'
  }

  function getThreadReactionCount(thread: WishThreadEntry, emoji: string) {
    return thread.reactions.find((reaction) => reaction.emoji === emoji)?.count ?? 0
  }

  function getThreadReactionLabel(emoji: string) {
    return THREAD_REACTION_LABELS[emoji] ?? '留个回应'
  }

  function getThreadReactionAriaLabel(thread: WishThreadEntry, emoji: string) {
    const count = getThreadReactionCount(thread, emoji)
    const activeCopy = isThreadReactionActive(thread, emoji) ? '，你已经点过了' : ''
    const countCopy = count ? `，目前有 ${count} 个回应` : '，目前还没有回应'
    const pendingCopy = isTogglingThreadReaction(thread.id, emoji) ? '，正在发送' : ''

    return `${getThreadReactionLabel(emoji)}${countCopy}${activeCopy}${pendingCopy}`
  }

  function isThreadReactionActive(thread: WishThreadEntry, emoji: string) {
    if (!currentMemberId.value) {
      return false
    }

    return thread.reactions.some((reaction) => reaction.emoji === emoji && reaction.memberIds.includes(currentMemberId.value))
  }

  function getThreadMemberReactionEmojis(thread: WishThreadEntry) {
    if (!currentMemberId.value) {
      return []
    }

    return thread.reactions
      .filter((reaction) => reaction.memberIds.includes(currentMemberId.value))
      .map((reaction) => reaction.emoji)
  }

  function getThreadReactionRemainingCount(thread: WishThreadEntry) {
    return Math.max(0, 3 - getThreadMemberReactionEmojis(thread).length)
  }

  function canAddThreadReaction(thread: WishThreadEntry, emoji: string) {
    if (isThreadReactionActive(thread, emoji)) {
      return true
    }

    return getThreadMemberReactionEmojis(thread).length < 3
  }

  function isTogglingThreadReaction(threadId: string, emoji: string) {
    return pendingThreadReactionKeys.value.includes(`${threadId}:${emoji}`)
  }

  function isThreadReactionRowPending(threadId: string) {
    return pendingThreadReactionKeys.value.some((key) => key.startsWith(`${threadId}:`))
  }

  function isThreadReactionExpanded(threadId: string) {
    return expandedThreadReactionIds.value.includes(threadId)
  }

  function toggleThreadReactionExpansion(threadId: string) {
    expandedThreadReactionIds.value = isThreadReactionExpanded(threadId)
      ? expandedThreadReactionIds.value.filter((id) => id !== threadId)
      : [...expandedThreadReactionIds.value, threadId]
  }

  const activeReactionPickerThread = computed(() => {
    if (!activeReactionPickerThreadId.value) {
      return null
    }

    return wishJournalEntries.value.find((thread) => thread.id === activeReactionPickerThreadId.value) ?? null
  })

  function isThreadReactionPickerOpen(threadId: string) {
    return activeReactionPickerThreadId.value === threadId
  }

  function openThreadReactionPicker(threadId: string, triggerId?: string) {
    activeReactionPickerThreadId.value = threadId
    activeReactionPickerTriggerId.value = triggerId ?? null
  }

  function closeThreadReactionPicker(restoreFocus = true) {
    const triggerId = activeReactionPickerTriggerId.value

    activeReactionPickerThreadId.value = null
    activeReactionPickerTriggerId.value = null

    if (!restoreFocus || !triggerId || typeof document === 'undefined') {
      return
    }

    void nextTick(() => {
      document.getElementById(triggerId)?.focus()
    })
  }

  function getOverflowThreadReactions(thread: WishThreadEntry) {
    return thread.reactions.filter((reaction) => EXTENDED_THREAD_REACTION_OPTIONS.includes(reaction.emoji))
  }

  function hasActiveOverflowThreadReaction(thread: WishThreadEntry) {
    if (!currentMemberId.value) {
      return false
    }

    return getOverflowThreadReactions(thread).some((reaction) => reaction.memberIds.includes(currentMemberId.value))
  }

  function getThreadReactionOverflowLabel(thread: WishThreadEntry) {
    const hiddenReactionKinds = getOverflowThreadReactions(thread).length

    return hiddenReactionKinds ? `更多表情 · ${hiddenReactionKinds} 种回应` : '更多表情'
  }

  function canManageThreadComment(thread: WishThreadEntry) {
    return isCommentThread(thread) && !!currentMemberId.value && thread.actorId === currentMemberId.value
  }

  function isEditingThreadComment(threadId: string) {
    return editingThreadId.value === threadId
  }

  function startEditingThreadComment(thread: WishThreadEntry) {
    editingThreadId.value = thread.id
    editingThreadMessage.value = thread.messageText
    threadFeedback.value = ''
  }

  function cancelEditingThreadComment() {
    editingThreadId.value = ''
    editingThreadMessage.value = ''
  }

  async function toggleThreadReaction(threadId: string, emoji: string) {
    const reactionKey = `${threadId}:${emoji}`
    const thread = wishJournalEntries.value.find((entry) => entry.id === threadId)

    if (thread && !canAddThreadReaction(thread, emoji)) {
      threadFeedback.value = '同一条记录里，每位成员最多保留 3 个表情回应。'
      threadFeedbackTone.value = 'danger'
      return
    }

    if (pendingThreadReactionKeys.value.includes(reactionKey)) {
      return
    }

    pendingThreadReactionKeys.value = [...pendingThreadReactionKeys.value, reactionKey]

    try {
      const result = await wishStore.toggleThreadReaction(threadId, emoji)
      threadFeedback.value = result.message
      threadFeedbackTone.value = result.ok ? 'success' : 'danger'
    } finally {
      pendingThreadReactionKeys.value = pendingThreadReactionKeys.value.filter((key) => key !== reactionKey)
    }
  }

  async function saveThreadComment(thread: WishThreadEntry) {
    if (!selectedWish.value) {
      return
    }

    isSavingThreadEdit.value = true

    try {
      const result = await wishStore.updateComment(selectedWish.value.id, thread.id, editingThreadMessage.value)
      threadFeedback.value = result.message
      threadFeedbackTone.value = result.ok ? 'success' : 'danger'

      if (result.ok) {
        cancelEditingThreadComment()
      }
    } finally {
      isSavingThreadEdit.value = false
    }
  }

  async function deleteThreadComment(thread: WishThreadEntry) {
    if (!selectedWish.value) {
      return
    }

    deletingThreadId.value = thread.id

    try {
      const result = await wishStore.deleteComment(selectedWish.value.id, thread.id)
      threadFeedback.value = result.message
      threadFeedbackTone.value = result.ok ? 'success' : 'danger'

      if (result.ok && editingThreadId.value === thread.id) {
        cancelEditingThreadComment()
      }
    } finally {
      deletingThreadId.value = ''
    }
  }

  function getCoinStatusLabel() {
    if (!coinSnapshot.value) {
      return `离七龙珠还差 ${DRAGON_BALL_COIN_TARGET} 枚`
    }

    return coinSnapshot.value.isDragonBallReady ? '七龙珠已经集齐' : `离七龙珠还差 ${coinSnapshot.value.remainingToDragonBall} 枚`
  }

  function canDeleteImage(createdBy: string) {
    return createdBy === authStore.currentMemberId
  }

  function setRewardFeedback(message: string, tone: 'success' | 'danger' = 'success', stepId = '', source: 'global' | 'count' = 'global') {
    rewardFeedback.value = message
    rewardFeedbackTone.value = tone
    stepRewardFeedbackTargetId.value = stepId
    isCountProgressFeedback.value = source === 'count'
  }

  function closeRewardDialog(clearFeedback = true) {
    pendingCompletionKind.value = null
    pendingWishRewardSelectionId.value = currentMemberPremiumRewards.value[0]?.id ?? ''

    if (clearFeedback) {
      rewardFeedback.value = ''
      stepRewardFeedbackTargetId.value = ''
      isCountProgressFeedback.value = false
    }
  }

  function getWishActionLabel() {
    if (!selectedWish.value) {
      return '标记为完成'
    }

    if (selectedWish.value.status === 'done') {
      return '放回进行中'
    }

    return wishStore.hasWishRewardClaim(selectedWish.value) ? '放回已完成' : '完成并领奖'
  }

  function getStepActionLabel(stepId: string, isDone: boolean) {
    if (isDone) {
      return '放回未完成'
    }

    return wishStore.hasStepRewardClaim(stepId) ? '重新标记完成' : '标记完成'
  }

  function getStepStatusCopy(stepId: string, isDone: boolean) {
    const claim = wishStore.getStepRewardClaim(stepId)

    if (isDone && claim) {
      return claim.claimKind === 'star_coin'
        ? `这个小目标已经走完，小奖励也存成了 ${claim.titleSnapshot}。`
        : `这个小目标已经走完，小奖励也已经接住了「${claim.titleSnapshot}」。`
    }

    if (isDone) {
      return '这个小目标已经走完了，小奖励先在空间页等你去领。'
    }

    if (claim) {
      return '这一步的小奖励已经领过了；再次完成只会记进度，不会再重复发。'
    }

    return '它还在路上。'
  }

  function getClaimToneLabel(claimKind: string) {
    if (claimKind === 'count_reward') {
      return '数字奖励'
    }

    if (claimKind === 'star_coin') {
      return '星星币'
    }

    if (claimKind === 'premium_redeem') {
      return '星币兑换'
    }

    return '已领奖'
  }

  function isCoverImage(imageId: string) {
    return selectedWish.value?.images[0]?.id === imageId
  }

  function isDraggedImage(imageId: string) {
    return draggedImageId.value === imageId
  }

  function isDropTargetImage(imageId: string) {
    return dragOverImageId.value === imageId && draggedImageId.value !== imageId
  }

  function isImageSelected(imageId: string) {
    return selectedImageIds.value.includes(imageId)
  }

  function formatFileSize(sizeBytes: number) {
    if (sizeBytes >= 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (sizeBytes >= 1024) {
      return `${Math.round(sizeBytes / 1024)} KB`
    }

    return `${sizeBytes} B`
  }

  async function submitComment() {
    if (!selectedWish.value || !draftMessage.value.trim()) {
      return
    }

    isSubmittingComment.value = true
    const messageToSend = draftMessage.value.trim()

    try {
      const authorId = authStore.currentMemberId || authStore.currentMember?.id || draftAuthorId.value
      const result = await wishStore.addComment(selectedWish.value.id, authorId, messageToSend, commentImageFiles.value)

      commentFeedback.value = result.message
      commentFeedbackTone.value = result.ok ? 'success' : 'danger'

      if (!result.ok) {
        lastFailedCommentDraft.value = messageToSend
        return
      }

      draftMessage.value = ''
      lastFailedCommentDraft.value = ''
      clearCommentImageFiles()
    } finally {
      isSubmittingComment.value = false
    }
  }

  function getCommentImageFileKey(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`
  }

  function clearCommentImageFiles() {
    commentImageFiles.value = []
    commentImageInputVersion.value += 1
  }

  function removeCommentImageFile(index: number) {
    commentImageFiles.value = commentImageFiles.value.filter((_, fileIndex) => fileIndex !== index)
  }

  function handleCommentImageSelection(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])

    if (!files.length) {
      return
    }

    const existingKeys = new Set(commentImageFiles.value.map((file) => getCommentImageFileKey(file)))
    const nextFiles = [...commentImageFiles.value]

    for (const file of files) {
      const fileKey = getCommentImageFileKey(file)

      if (existingKeys.has(fileKey)) {
        continue
      }

      existingKeys.add(fileKey)
      nextFiles.push(file)
    }

    commentImageFiles.value = nextFiles
    input.value = ''
  }

  async function retryComment() {
    if (!draftMessage.value.trim() && lastFailedCommentDraft.value) {
      draftMessage.value = lastFailedCommentDraft.value
    }

    await submitComment()
  }

  async function deleteWish() {
    if (!selectedWish.value) {
      return false
    }

    const deleted = await wishStore.deleteWish(selectedWish.value.id)

    if (!deleted) {
      return false
    }

    await router.push({ name: 'list' })
    return true
  }

  async function adjustCountProgress(delta: number) {
    if (!selectedWish.value || selectedWish.value.progressMode !== 'count') {
      return
    }

    const previousCurrent = selectedWish.value.progressCurrent
    const updated = await wishStore.incrementWishCountProgress(selectedWish.value.id, delta)

    if (!updated) {
      setRewardFeedback(wishStore.syncMessage || '数字进度暂时没有更新。', 'danger', '', 'count')
      return
    }

    const nextCurrent = selectedWish.value?.progressCurrent ?? previousCurrent
    const gainedUnits = Math.max(nextCurrent - previousCurrent, 0)

    if (gainedUnits > 0 && shouldRecordCountProgressLog.value) {
      const actorId = authStore.currentMemberId || authStore.currentMember?.id || ''
      if (actorId) {
        await wishStore.addComment(
          selectedWish.value.id,
          actorId,
          `数字进度往前推进了 ${gainedUnits} 点（现在 ${nextCurrent}/${selectedWish.value.progressTarget}${selectedWish.value.progressUnit ? ` ${selectedWish.value.progressUnit}` : ''}）。`,
        )
      }
    }

    setRewardFeedback(
      gainedUnits
        ? `数字进度先往前走了 ${gainedUnits} 点，小奖励已经留到空间页等你去领。`
        : nextCurrent < previousCurrent
          ? '数字进度已经往回调整，空间页里的待领取数量也会跟着收住。'
          : '数字进度已经更新。',
      'success',
      '',
      'count',
    )
  }

  async function saveCountProgress() {
    if (!selectedWish.value || selectedWish.value.progressMode !== 'count') {
      return
    }

    const previousCurrent = selectedWish.value.progressCurrent
    const updated = await wishStore.setWishCountProgress(selectedWish.value.id, countProgressDraft.value)

    if (!updated) {
      setRewardFeedback(wishStore.syncMessage || '数字进度暂时没有更新。', 'danger', '', 'count')
      return
    }

    const nextCurrent = selectedWish.value?.progressCurrent ?? previousCurrent
    const gainedUnits = Math.max(nextCurrent - previousCurrent, 0)

    if (gainedUnits > 0 && shouldRecordCountProgressLog.value) {
      const actorId = authStore.currentMemberId || authStore.currentMember?.id || ''
      if (actorId) {
        await wishStore.addComment(
          selectedWish.value.id,
          actorId,
          `数字进度改到了 ${nextCurrent}/${selectedWish.value.progressTarget}${selectedWish.value.progressUnit ? ` ${selectedWish.value.progressUnit}` : ''}，本次新增 ${gainedUnits} 点。`,
        )
      }
    }

    setRewardFeedback(
      gainedUnits
        ? `数字进度已经补到现在的位置，新增的 ${gainedUnits} 点小奖励先在空间页等你。`
        : nextCurrent < previousCurrent
          ? '数字进度已经重新校正，空间页里的待领取数量也会跟着收住。'
          : '数字进度已经更新。',
      'success',
      '',
      'count',
    )
  }

  async function submitWishStep() {
    if (!selectedWish.value || selectedWish.value.progressMode !== 'steps') {
      return
    }

    const added = await wishStore.addWishStep(selectedWish.value.id, stepDraft.value)

    if (added) {
      stepDraft.value = ''
    }
  }

  async function handleWishCompletionAction() {
    if (!selectedWish.value) {
      return
    }

    if (selectedWish.value.status === 'done' || wishStore.hasWishRewardClaim(selectedWish.value)) {
      await wishStore.toggleDone(selectedWish.value.id)
      return
    }

    if (!currentMemberPremiumRewards.value.length) {
      setRewardFeedback('先去空间页给自己准备至少一个高档奖励，再来完成这条愿望。', 'danger')
      return
    }

    pendingCompletionKind.value = 'wish'
    pendingWishRewardSelectionId.value = currentMemberPremiumRewards.value[0]?.id ?? ''
    setRewardFeedback('', 'success')
  }

  async function confirmWishCompletionReward() {
    if (!selectedWish.value || !pendingWishRewardSelectionId.value) {
      setRewardFeedback('先选一个高档奖励。', 'danger')
      return
    }

    isSubmittingReward.value = true

    try {
      const result = await wishStore.completeWishWithReward(selectedWish.value.id, pendingWishRewardSelectionId.value)
      setRewardFeedback(result.message, result.ok ? 'success' : 'danger')

      if (result.ok) {
        closeRewardDialog(false)
      }
    } finally {
      isSubmittingReward.value = false
    }
  }

  async function toggleWishStep(stepId: string) {
    if (!selectedWish.value) {
      return
    }

    const step = selectedWish.value.steps.find((item) => item.id === stepId)

    if (!step) {
      return
    }

    const wasDone = step.isDone
    const hadClaim = wishStore.hasStepRewardClaim(stepId)
    const updated = await wishStore.toggleWishStep(selectedWish.value.id, stepId)

    if (!updated) {
      return
    }

    if (!wasDone) {
      setRewardFeedback(
        hadClaim
          ? '这个步骤重新记成完成了；小奖励不会重复发，但推进会继续记下。'
          : '这个步骤已经记成完成了，小奖励先去空间页接住就好。',
        'success',
        stepId,
      )
      return
    }

    setRewardFeedback(
      hadClaim
        ? '这个步骤已经放回路上；之前领过的小奖励会保留。'
        : '这个步骤已经放回路上，空间页里对应的小奖励也会先收住。',
      'success',
      stepId,
    )
  }

  async function removeWishStep(stepId: string) {
    if (!selectedWish.value) {
      return
    }

    await wishStore.deleteWishStep(selectedWish.value.id, stepId)
  }

  async function handleImageSelection(event: Event) {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files ?? [])

    if (!selectedWish.value || !files.length) {
      return
    }

    isUploadingImages.value = true

    try {
      await wishStore.uploadWishImages(selectedWish.value.id, files)
    } finally {
      input.value = ''
      isUploadingImages.value = false
    }
  }

  async function deleteImage(imageId: string) {
    if (!selectedWish.value) {
      return
    }

    await wishStore.deleteWishImage(selectedWish.value.id, imageId)
  }

  async function setCoverImage(imageId: string) {
    if (!selectedWish.value) {
      return
    }

    await wishStore.setWishCoverImage(selectedWish.value.id, imageId)
  }

  function openImagePreview(images: WishImage[], imageId: string) {
    lightboxImages.value = images
    previewImageId.value = imageId
  }

  function closeImagePreview() {
    previewImageId.value = null
    lightboxImages.value = []
  }

  function stepPreview(offset: -1 | 1) {
    const nextIndex = previewImageIndex.value + offset
    const nextImage = lightboxImages.value[nextIndex]

    if (!nextImage) {
      return
    }

    previewImageId.value = nextImage.id
  }

  function clearDragState() {
    draggedImageId.value = null
    dragOverImageId.value = null
  }

  function beginImageSelection() {
    isSelectingImages.value = true
    selectedImageIds.value = []
    cancelEditingImageNote()
    clearDragState()
  }

  function cancelImageSelection() {
    isSelectingImages.value = false
    selectedImageIds.value = []
  }

  function toggleImageSelection(imageId: string) {
    if (isImageSelected(imageId)) {
      selectedImageIds.value = selectedImageIds.value.filter((id) => id !== imageId)
      return
    }

    selectedImageIds.value = [...selectedImageIds.value, imageId]
  }

  function startEditingImageNote(imageId: string, currentNote: string) {
    editingImageNoteId.value = imageId
    imageNoteDraft.value = currentNote
    cancelImageSelection()
  }

  function cancelEditingImageNote() {
    editingImageNoteId.value = null
    imageNoteDraft.value = ''
  }

  function buildReorderedImageIds(sourceImageId: string, targetImageId: string) {
    const currentImageIds = selectedWish.value?.images.map((image) => image.id) ?? []
    const sourceIndex = currentImageIds.indexOf(sourceImageId)
    const targetIndex = currentImageIds.indexOf(targetImageId)

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      return null
    }

    const nextImageIds = [...currentImageIds]
    const [movedImageId] = nextImageIds.splice(sourceIndex, 1)

    if (!movedImageId) {
      return null
    }

    nextImageIds.splice(targetIndex, 0, movedImageId)
    return nextImageIds
  }

  function handleImageDragStart(imageId: string) {
    if (isReorderingImages.value || isSelectingImages.value) {
      return
    }

    draggedImageId.value = imageId
    dragOverImageId.value = imageId
  }

  function handleImageDragEnter(imageId: string) {
    if (!draggedImageId.value || draggedImageId.value === imageId || isSelectingImages.value) {
      return
    }

    dragOverImageId.value = imageId
  }

  async function handleImageDrop(targetImageId: string) {
    if (!selectedWish.value || !draggedImageId.value || isReorderingImages.value || isSelectingImages.value) {
      clearDragState()
      return
    }

    const nextImageIds = buildReorderedImageIds(draggedImageId.value, targetImageId)
    clearDragState()

    if (!nextImageIds) {
      return
    }

    isReorderingImages.value = true

    try {
      await wishStore.reorderWishImages(selectedWish.value.id, nextImageIds)
    } finally {
      isReorderingImages.value = false
    }
  }

  function handleImageDragEnd() {
    clearDragState()
  }

  async function saveImageNote(imageId: string) {
    if (!selectedWish.value) {
      return
    }

    isSavingImageNote.value = true

    try {
      const saved = await wishStore.updateWishImageNote(selectedWish.value.id, imageId, imageNoteDraft.value)

      if (saved) {
        cancelEditingImageNote()
      }
    } finally {
      isSavingImageNote.value = false
    }
  }

  async function deleteSelectedImages() {
    if (!selectedWish.value || !selectedImageIds.value.length) {
      return
    }

    isDeletingSelectedImages.value = true

    try {
      const deleted = await wishStore.deleteWishImages(selectedWish.value.id, selectedImageIds.value)

      if (deleted) {
        cancelImageSelection()
      }
    } finally {
      isDeletingSelectedImages.value = false
    }
  }

  function handleDetailKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && activeReactionPickerThreadId.value) {
      closeThreadReactionPicker()
      return
    }

    if (!previewImage.value) {
      return
    }

    if (event.key === 'Escape') {
      closeImagePreview()
      return
    }

    if (event.key === 'ArrowLeft' && canPreviewPrevious.value) {
      stepPreview(-1)
      return
    }

    if (event.key === 'ArrowRight' && canPreviewNext.value) {
      stepPreview(1)
    }
  }

  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleDetailKeydown)
    }
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleDetailKeydown)
    }

    if (typeof document !== 'undefined') {
      document.body.style.overflow = ''
    }
  })

  return {
    EXTENDED_THREAD_REACTION_OPTIONS,
    FEATURED_THREAD_REACTION_OPTIONS,
    THREAD_REACTION_OPTIONS,
    activeReactionPickerThread,
    activeThreadReactionKey,
    adjustCountProgress,
    authStore,
    beginImageSelection,
    cancelEditingImageNote,
    cancelEditingThreadComment,
    cancelImageSelection,
    canConfirmWishReward,
    canDeleteImage,
    canManageThreadComment,
    canPreviewNext,
    canPreviewPrevious,
    canRetryComment,
    clearCommentImageFiles,
    closeImagePreview,
    closeThreadReactionPicker,
    closeRewardDialog,
    coinProgressPercent,
    coinSnapshot,
    commentFeedback,
    commentFeedbackTone,
    commentImageFiles,
    commentImageInputVersion,
    confirmWishCompletionReward,
    countProgressDraft,
    currentMemberPremiumRewards,
    currentMemberStarCoins,
    deleteImage,
    deleteSelectedImages,
    deleteThreadComment,
    deleteWish,
    deletableImageCount,
    deletingThreadId,
    draftAuthorId,
    draftMessage,
    editingImageNoteId,
    editingThreadMessage,
    formatFileSize,
    getClaimToneLabel,
    getCoinStatusLabel,
    getCommentImageFileKey,
    getMemberName,
    getStepActionLabel,
    getStepStatusCopy,
    getThreadActorName,
    getThreadReactionAriaLabel,
    getThreadEyebrow,
    getThreadHeadline,
    getThreadReactionCount,
    getThreadReactionLabel,
    getThreadReactionOverflowLabel,
    getThreadReactionRemainingCount,
    getWishActionLabel,
    hasActiveOverflowThreadReaction,
    handleCommentImageSelection,
    handleImageDragEnd,
    handleImageDragEnter,
    handleImageDragStart,
    handleImageDrop,
    handleImageSelection,
    handleWishCompletionAction,
    imageNoteDraft,
    isCommentThread,
    isCountProgressFeedback,
    isCoverImage,
    isDraggedImage,
    isDropTargetImage,
    isEditingThreadComment,
    isImageSelected,
    isDeletingSelectedImages,
    isReorderingImages,
    isSavingImageNote,
    isSavingThreadEdit,
    isSelectingImages,
    isSubmittingComment,
    isSubmittingReward,
    isThreadReactionActive,
    isThreadReactionExpanded,
    isThreadReactionPickerOpen,
    isThreadReactionRowPending,
    isTogglingThreadReaction,
    isUploadingImages,
    lightboxImages,
    openImagePreview,
    openThreadReactionPicker,
    pendingCompletionKind,
    pendingWishRewardSelectionId,
    previewImage,
    previewImageIndex,
    progressSnapshot,
    removeCommentImageFile,
    removeWishStep,
    retryComment,
    rewardFeedback,
    rewardFeedbackTone,
    saveCountProgress,
    saveImageNote,
    saveThreadComment,
    selectedImageIds,
    selectedWish,
    setCoverImage,
    shouldRecordCountProgressLog,
    startEditingImageNote,
    startEditingThreadComment,
    stepDraft,
    stepRewardFeedbackTargetId,
    stepPreview,
    submitComment,
    submitWishStep,
    threadFeedback,
    threadFeedbackTone,
    getThreadMemberReactionEmojis,
    canAddThreadReaction,
    toggleImageSelection,
    toggleThreadReactionExpansion,
    toggleThreadReaction,
    toggleWishStep,
    wishJournalEntries,
    wishRewardClaim,
    wishStore,
  }
}