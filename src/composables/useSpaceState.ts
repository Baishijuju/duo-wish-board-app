import { computed, ref, watch } from 'vue'
import { supabaseAuthMode, supabaseReadinessMessage } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { useWishStore, type RewardPoolItem } from '../stores/wishes'
import { formatBeijingDateTime } from '../utils/datetime'

type RewardTaskKind = 'personal' | 'shared' | 'assist'

interface RewardTaskEntry {
  item: RewardPoolItem
  kind: RewardTaskKind
  ownerName: string
}

export function useSpaceState() {
  const authStore = useAuthStore()
  const wishStore = useWishStore()

  const roleLabels = {
    owner: '创建者',
    member: '成员',
  } as const

  const loginEmail = ref(authStore.sessionEmail || authStore.currentMember?.email || '')
  const loginOtp = ref('')
  const inviteDraft = ref(authStore.inviteCode)
  const fixedEmailDraft = ref('')
  const fixedDisplayNameDraft = ref('')
  const loginMessage = ref('')
  const loginTone = ref<'success' | 'danger'>('success')
  const inviteMessage = ref('')
  const inviteTone = ref<'success' | 'danger'>('success')
  const backupMessage = ref('')
  const backupTone = ref<'success' | 'danger'>('success')
  const rewardMessage = ref('')
  const rewardTone = ref<'success' | 'danger'>('success')
  const dailyRewardTitleDraft = ref('')
  const dailyRewardNoteDraft = ref('')
  const premiumRewardTitleDraft = ref('')
  const premiumRewardNoteDraft = ref('')
  const premiumRewardCostDraft = ref(6)
  const premiumRewardScopeDraft = ref<'personal' | 'shared'>('personal')
  const editingDailyRewardId = ref<string | null>(null)
  const editingPremiumRewardId = ref<string | null>(null)
  const isSendingMagicLink = ref(false)
  const isVerifyingOtp = ref(false)
  const isJoiningSpace = ref(false)
  const isBindingEmail = ref(false)
  const isSubmittingReward = ref(false)
  const processingRewardItemId = ref<string | null>(null)
  const processingPendingRewardKey = ref<string | null>(null)
  const pendingRewardSelectionBySource = ref<Record<string, string>>({})

  const showOtpForm = computed(() => !authStore.isAuthenticated)
  const otpTargetEmail = computed(() => authStore.sessionEmail || loginEmail.value.trim().toLowerCase())
  const canCopyInviteCode = computed(() => !!authStore.inviteCode)
  const canBindFixedEmail = computed(() => authStore.usesSupabaseSpace && authStore.currentMember?.role === 'owner')
  const storageSummary = computed(() => wishStore.imageStorageSummary)
  const currentMemberId = computed(() => authStore.currentMemberId || authStore.currentMember?.id || '')
  const currentMemberStarCoins = computed(() => wishStore.currentMemberStarCoinBalance)
  const currentMemberDailyRewards = computed(() => {
    return currentMemberId.value ? wishStore.getRewardPoolItems(currentMemberId.value, 'daily') : []
  })
  const currentMemberPremiumRewards = computed(() => {
    return currentMemberId.value ? wishStore.getRewardPoolItems(currentMemberId.value, 'premium') : []
  })
  const currentMemberPremiumExchangeRewards = computed(() => {
    return currentMemberPremiumRewards.value.filter((item) => item.starCoinCost > 0)
  })
  const sharedPremiumRewards = computed(() => wishStore.getSharedRewardPoolItems('premium'))
  const sharedPremiumExchangeRewards = computed(() => {
    return sharedPremiumRewards.value.filter((item) => item.starCoinCost > 0)
  })
  const pendingStepRewards = computed(() => wishStore.pendingStepRewards)
  const pendingCountRewardSummaries = computed(() => wishStore.pendingCountRewardSummaries)
  const pendingCountRewardUnits = computed(() => {
    return pendingCountRewardSummaries.value.reduce((total, item) => total + item.pendingUnits, 0)
  })
  const pendingSmallRewardUnits = computed(() => wishStore.pendingSmallRewardCount)
  const premiumWishlistCostTotal = computed(() => {
    return currentMemberPremiumRewards.value.reduce((total, item) => total + Math.max(item.starCoinCost, 0), 0)
  })
  const premiumRedeemableNowCount = computed(() => {
    return [...currentMemberPremiumRewards.value, ...sharedPremiumRewards.value]
      .filter((item) => item.starCoinCost > 0 && getRewardDepositedStarCoins(item) >= item.starCoinCost).length
  })
  const pendingStarCoinSpend = computed(() => {
    return [...currentMemberPremiumRewards.value, ...sharedPremiumRewards.value]
      .reduce((total, item) => total + getRewardRemainingStarCoins(item), 0)
  })
  const rewardPoolByMember = computed(() => {
    return authStore.members.map((member) => ({
      dailyRewards: wishStore.getRewardPoolItems(member.id, 'daily'),
      member,
      premiumRewards: wishStore.getRewardPoolItems(member.id, 'premium'),
      starCoins: wishStore.getMemberStarCoinBalance(member.id),
    }))
  })
  const currentMemberRewardEntries = computed<RewardTaskEntry[]>(() => {
    const memberName = authStore.currentMember?.displayName || '我'
    return currentMemberPremiumExchangeRewards.value.map((item) => ({ item, kind: 'personal', ownerName: memberName }))
  })
  const sharedRewardEntries = computed<RewardTaskEntry[]>(() => {
    return sharedPremiumExchangeRewards.value.map((item) => ({ item, kind: 'shared', ownerName: '共同' }))
  })
  const assistRewardEntries = computed<RewardTaskEntry[]>(() => {
    return rewardPoolByMember.value
      .filter((entry) => entry.member.id !== currentMemberId.value)
      .flatMap((entry) => entry.premiumRewards
        .filter((item) => item.starCoinCost > 0)
        .map((item) => ({
          item,
          kind: 'assist' as const,
          ownerName: entry.member.displayName || '对方',
        })))
      .sort((left, right) => getRewardRemainingStarCoins(left.item) - getRewardRemainingStarCoins(right.item))
  })
  const rewardTaskEntries = computed(() => [...currentMemberRewardEntries.value, ...sharedRewardEntries.value])
  const claimableRewardEntries = computed(() => {
    return rewardTaskEntries.value
      .filter((entry) => canRedeemPremiumReward(entry.item))
      .sort((left, right) => getRewardRemainingStarCoins(left.item) - getRewardRemainingStarCoins(right.item))
  })
  const savingRewardEntries = computed(() => {
    return rewardTaskEntries.value
      .filter((entry) => !canRedeemPremiumReward(entry.item) && getRewardRemainingStarCoins(entry.item) > 0)
      .sort((left, right) => getRewardRemainingStarCoins(left.item) - getRewardRemainingStarCoins(right.item))
  })
  const closestRewardEntry = computed(() => savingRewardEntries.value[0] ?? assistRewardEntries.value[0] ?? null)
  const recentRewardClaims = computed(() => {
    return wishStore.latestRewardClaims.map((claim) => ({
      claim,
      memberName: authStore.members.find((member) => member.id === claim.ownerId)?.displayName ?? '未命名成员',
    }))
  })
  const recentRewardClaimPreview = computed(() => recentRewardClaims.value.slice(0, 3))
  const currentCatchMoment = computed(() => {
    const firstPendingStepReward = pendingStepRewards.value[0]

    if (firstPendingStepReward) {
      return {
        actionLabel: currentMemberDailyRewards.value.length ? '接住这次奖励' : '先收成星星币',
        actionMode: currentMemberDailyRewards.value.length ? 'step-daily' : 'step-star',
        eyebrow: '刚刚完成的一步',
        note: currentMemberDailyRewards.value.length
          ? '这一步的小奖励已经到了，先接住它就好。'
          : '这一步的小奖励已经到了，先收成星星币也可以。',
        sourceLabel: `来自「${firstPendingStepReward.wishTitle}」`,
        sourceMeta: formatBeijingDateTime(firstPendingStepReward.completedAt),
        title: firstPendingStepReward.stepTitle,
      } as const
    }

    const firstPendingCountReward = pendingCountRewardSummaries.value[0]

    if (firstPendingCountReward) {
      return {
        actionLabel: currentMemberDailyRewards.value.length ? '先接住这一段' : '先收成星星币',
        actionMode: currentMemberDailyRewards.value.length ? 'count-daily' : 'count-star',
        eyebrow: '刚刚推进的这一段',
        note: currentMemberDailyRewards.value.length
          ? `已经替你攒下 ${getPendingCountUnitLabel(firstPendingCountReward.pendingUnits, firstPendingCountReward.progressUnit)} 小奖励。`
          : `已经替你攒下 ${getPendingCountUnitLabel(firstPendingCountReward.pendingUnits, firstPendingCountReward.progressUnit)}，先收成星星币也可以。`,
        sourceLabel: `来自「${firstPendingCountReward.wishTitle}」`,
        sourceMeta: formatBeijingDateTime(firstPendingCountReward.updatedAt),
        title: `${getPendingCountUnitLabel(firstPendingCountReward.pendingUnits, firstPendingCountReward.progressUnit)} 正在等你接住`,
      } as const
    }

    return null
  })

  const joinedSpaceLabel = computed(() => {
    if (!authStore.joinedSpaceAt) {
      return '还没有记录加入时间'
    }

    return formatBeijingDateTime(authStore.joinedSpaceAt)
  })

  const currentRoleLabel = computed(() => {
    return roleLabels[authStore.currentMember?.role ?? 'member']
  })

  const syncStatusLabel = computed(() => {
    if (!authStore.usesSupabaseSpace) {
      return '暂未同步'
    }

    if (wishStore.realtimeStatus === 'error' || wishStore.syncMessage.includes('失败')) {
      return '同步异常'
    }

    if (wishStore.realtimeStatus === 'connecting' || wishStore.isLoading) {
      return '同步中'
    }

    return '同步正常'
  })

  const estimatedRemainingImageCount = computed(() => {
    if (!wishStore.stats.totalImages || !storageSummary.value.usedBytes) {
      return null
    }

    const averageImageBytes = storageSummary.value.usedBytes / wishStore.stats.totalImages
    return averageImageBytes > 0 ? Math.floor(storageSummary.value.remainingBytes / averageImageBytes) : null
  })

  const perMemberStats = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return authStore.members.map((member) => {
      const mine = wishStore.wishes.filter((wish) => wish.ownerId === member.id)
      const imageCount = mine.reduce((count, wish) => count + wish.images.length, 0)
      const imageBytes = mine.reduce((count, wish) => count + wish.images.reduce((imageTotal, image) => imageTotal + image.sizeBytes, 0), 0)

      return {
        active: mine.filter((wish) => wish.status === 'active').length,
        comments: mine.reduce((count, wish) => count + wish.comments.length, 0),
        done: mine.filter((wish) => wish.status === 'done').length,
        imageBytes,
        imageCount,
        member,
        overdue: mine.filter((wish) => {
          const dueTimestamp = getLocalDateTimestamp(wish.dueDate)
          return wish.status === 'active' && dueTimestamp !== null && dueTimestamp < today.getTime()
        }).length,
        privateCount: mine.filter((wish) => wish.scope === 'private').length,
        sharedCount: mine.filter((wish) => wish.scope === 'shared').length,
        starCoins: wishStore.getMemberStarCoinBalance(member.id),
        total: mine.length,
      }
    })
  })

  watch(
    () => authStore.sessionEmail,
    (value) => {
      if (value) {
        loginEmail.value = value
      }
    },
  )

  watch(
    () => authStore.inviteCode,
    (value) => {
      inviteDraft.value = value
    },
    { immediate: true },
  )

  async function submitMagicLink() {
    isSendingMagicLink.value = true

    try {
      const result = await authStore.requestMagicLink(loginEmail.value)
      loginMessage.value = result.message
      loginTone.value = result.ok ? 'success' : 'danger'

      if (result.ok) {
        loginOtp.value = ''
      }
    } finally {
      isSendingMagicLink.value = false
    }
  }

  async function submitEmailOtp() {
    isVerifyingOtp.value = true

    try {
      const result = await authStore.verifyEmailOtp(loginEmail.value, loginOtp.value)
      loginMessage.value = result.message
      loginTone.value = result.ok ? 'success' : 'danger'

      if (result.ok) {
        loginOtp.value = ''
      }
    } finally {
      isVerifyingOtp.value = false
    }
  }

  async function joinSpace() {
    isJoiningSpace.value = true

    try {
      const result = await authStore.joinSpaceByInvite(inviteDraft.value)
      inviteMessage.value = result.message
      inviteTone.value = result.ok ? 'success' : 'danger'
    } finally {
      isJoiningSpace.value = false
    }
  }

  async function copyInviteCode() {
    if (!canCopyInviteCode.value || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      inviteMessage.value = '当前环境暂时不能直接复制邀请口令，请手动复制。'
      inviteTone.value = 'danger'
      return
    }

    await navigator.clipboard.writeText(authStore.inviteCode)
    inviteMessage.value = '邀请口令已经复制好了。'
    inviteTone.value = 'success'
  }

  async function bindFixedEmail() {
    isBindingEmail.value = true

    try {
      const result = await authStore.bindEmailToCurrentSpace(fixedEmailDraft.value, fixedDisplayNameDraft.value)
      inviteMessage.value = result.message
      inviteTone.value = result.ok ? 'success' : 'danger'

      if (result.ok) {
        fixedEmailDraft.value = ''
        fixedDisplayNameDraft.value = ''
      }
    } finally {
      isBindingEmail.value = false
    }
  }

  function getLocalDateTimestamp(dateValue: string) {
    const trimmedValue = dateValue.trim()

    if (!trimmedValue) {
      return null
    }

    const [yearText, monthText, dayText] = trimmedValue.split('-')
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null
    }

    const timestamp = new Date(year, month - 1, day).getTime()
    return Number.isNaN(timestamp) ? null : timestamp
  }

  function formatStorageBytes(sizeBytes: number) {
    if (sizeBytes >= 1024 * 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }

    if (sizeBytes >= 1024 * 1024) {
      return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
    }

    if (sizeBytes >= 1024) {
      return `${Math.round(sizeBytes / 1024)} KB`
    }

    return `${sizeBytes} B`
  }

  function toFileSafeSegment(value: string) {
    return value.trim().replace(/[\\/:*?"<>|\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'wish-space'
  }

  function downloadBackup() {
    if (typeof window === 'undefined') {
      backupMessage.value = '当前环境不支持下载备份文件。'
      backupTone.value = 'danger'
      return
    }

    const payload = wishStore.createBackupPayload()
    const fileName = `${toFileSafeSegment(payload.space.name)}-${payload.space.dataMode}-${payload.exportedAt.slice(0, 10)}.json`
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const anchor = window.document.createElement('a')

    anchor.href = url
    anchor.download = fileName
    anchor.click()
    window.URL.revokeObjectURL(url)

    backupMessage.value = '这份清单已经备份好了。建议两个人都各自留一份。'
    backupTone.value = 'success'
  }

  function setRewardMessage(message: string, tone: 'success' | 'danger' = 'success') {
    rewardMessage.value = message
    rewardTone.value = tone
  }

  function resetRewardDraft(tier: 'daily' | 'premium') {
    if (tier === 'daily') {
      dailyRewardTitleDraft.value = ''
      dailyRewardNoteDraft.value = ''
      editingDailyRewardId.value = null
      return
    }

    premiumRewardTitleDraft.value = ''
    premiumRewardNoteDraft.value = ''
    premiumRewardCostDraft.value = 6
    premiumRewardScopeDraft.value = 'personal'
    editingPremiumRewardId.value = null
  }

  function startEditingReward(itemId: string, tier: 'daily' | 'premium') {
    const source = tier === 'daily'
      ? currentMemberDailyRewards.value.find((item) => item.id === itemId)
      : [...currentMemberPremiumRewards.value, ...sharedPremiumRewards.value].find((item) => item.id === itemId)

    if (!source) {
      return
    }

    if (tier === 'daily') {
      editingDailyRewardId.value = source.id
      dailyRewardTitleDraft.value = source.title
      dailyRewardNoteDraft.value = source.note
      return
    }

    editingPremiumRewardId.value = source.id
    premiumRewardTitleDraft.value = source.title
    premiumRewardNoteDraft.value = source.note
    premiumRewardCostDraft.value = source.starCoinCost
    premiumRewardScopeDraft.value = source.scope
  }

  async function submitDailyReward() {
    isSubmittingReward.value = true

    try {
      const result = editingDailyRewardId.value
        ? await wishStore.updateRewardPoolItem(editingDailyRewardId.value, {
            note: dailyRewardNoteDraft.value,
            title: dailyRewardTitleDraft.value,
          })
        : await wishStore.addRewardPoolItem({
            note: dailyRewardNoteDraft.value,
            tier: 'daily',
            title: dailyRewardTitleDraft.value,
          })

      setRewardMessage(result.message, result.ok ? 'success' : 'danger')

      if (result.ok) {
        resetRewardDraft('daily')
      }
    } finally {
      isSubmittingReward.value = false
    }
  }

  async function submitPremiumReward() {
    isSubmittingReward.value = true

    try {
      const result = editingPremiumRewardId.value
        ? await wishStore.updateRewardPoolItem(editingPremiumRewardId.value, {
            note: premiumRewardNoteDraft.value,
            scope: premiumRewardScopeDraft.value,
            starCoinCost: premiumRewardCostDraft.value,
            title: premiumRewardTitleDraft.value,
          })
        : await wishStore.addRewardPoolItem({
            note: premiumRewardNoteDraft.value,
            scope: premiumRewardScopeDraft.value,
            starCoinCost: premiumRewardCostDraft.value,
            tier: 'premium',
            title: premiumRewardTitleDraft.value,
          })

      setRewardMessage(result.message, result.ok ? 'success' : 'danger')

      if (result.ok) {
        resetRewardDraft('premium')
      }
    } finally {
      isSubmittingReward.value = false
    }
  }

  async function archiveReward(itemId: string) {
    processingRewardItemId.value = itemId

    try {
      const result = await wishStore.archiveRewardPoolItem(itemId)
      setRewardMessage(result.message, result.ok ? 'success' : 'danger')

      if (result.ok) {
        if (editingDailyRewardId.value === itemId) {
          resetRewardDraft('daily')
        }

        if (editingPremiumRewardId.value === itemId) {
          resetRewardDraft('premium')
        }
      }
    } finally {
      processingRewardItemId.value = null
    }
  }

  async function redeemPremiumReward(itemId: string) {
    processingRewardItemId.value = itemId

    try {
      const result = await wishStore.redeemPremiumReward(itemId)
      setRewardMessage(result.message, result.ok ? 'success' : 'danger')
    } finally {
      processingRewardItemId.value = null
    }
  }

  async function depositRewardStarCoins(itemId: string, amount: number) {
    processingRewardItemId.value = itemId

    try {
      const result = await wishStore.depositRewardStarCoins(itemId, amount)
      setRewardMessage(result.message, result.ok ? 'success' : 'danger')
    } finally {
      processingRewardItemId.value = null
    }
  }

  function getRewardDepositedStarCoins(item: { id: string; starCoinCost: number }) {
    return wishStore.getRewardItemAvailableDepositedStarCoins(item)
  }

  function getRewardRemainingStarCoins(item: { id: string; starCoinCost: number }) {
    return Math.max(item.starCoinCost - getRewardDepositedStarCoins(item), 0)
  }

  function getRewardDepositPercent(item: { id: string; starCoinCost: number }) {
    return item.starCoinCost > 0
      ? Math.min(Math.round((getRewardDepositedStarCoins(item) / item.starCoinCost) * 100), 100)
      : 0
  }

  function canDepositReward(item: { id: string; starCoinCost: number }, amount: number) {
    return item.starCoinCost > 0 && getRewardRemainingStarCoins(item) > 0 && currentMemberStarCoins.value >= Math.min(amount, getRewardRemainingStarCoins(item))
  }

  function canRedeemPremiumReward(item: { id: string; starCoinCost: number }) {
    return item.starCoinCost > 0 && getRewardDepositedStarCoins(item) >= item.starCoinCost
  }

  function getRecommendedDepositAmount(item: { id: string; starCoinCost: number }) {
    return Math.max(Math.min(getRewardRemainingStarCoins(item), currentMemberStarCoins.value), 0)
  }

  function getRewardTaskKindLabel(kind: RewardTaskKind) {
    if (kind === 'shared') {
      return '共同奖励'
    }

    if (kind === 'assist') {
      return '帮对方'
    }

    return '我的奖励'
  }

  function getRewardPrimaryActionLabel(entry: RewardTaskEntry) {
    if (canRedeemPremiumReward(entry.item)) {
      return entry.kind === 'shared' ? '领取共同奖励' : '领取奖励'
    }

    const amount = getRecommendedDepositAmount(entry.item)

    if (amount <= 0) {
      return '星币不足'
    }

    return entry.kind === 'assist' ? `助力 ${amount} 枚` : `存入 ${amount} 枚`
  }

  function getPendingRewardSelection(sourceKey: string) {
    const selectedRewardId = pendingRewardSelectionBySource.value[sourceKey]

    if (selectedRewardId && currentMemberDailyRewards.value.some((item) => item.id === selectedRewardId)) {
      return selectedRewardId
    }

    return currentMemberDailyRewards.value[0]?.id ?? ''
  }

  function handlePendingRewardSelectionChange(sourceKey: string, event: Event) {
    const target = event.target as HTMLSelectElement | null

    pendingRewardSelectionBySource.value = {
      ...pendingRewardSelectionBySource.value,
      [sourceKey]: target?.value ?? '',
    }
  }

  function isProcessingPendingReward(actionKey: string) {
    return processingPendingRewardKey.value === actionKey
  }

  function getPendingCountUnitLabel(units: number, progressUnit: string) {
    return progressUnit ? `${units} ${progressUnit}` : `${units} 点`
  }

  async function claimPendingStepReward(wishId: string, stepId: string, claimStarCoin = false) {
    const actionKey = `step:${stepId}:${claimStarCoin ? 'star' : 'daily'}`
    processingPendingRewardKey.value = actionKey

    try {
      const result = await wishStore.claimCompletedStepReward(wishId, stepId, {
        claimStarCoin,
        rewardItemId: claimStarCoin ? null : getPendingRewardSelection(`step:${stepId}`),
      })

      setRewardMessage(result.message, result.ok ? 'success' : 'danger')
    } finally {
      processingPendingRewardKey.value = null
    }
  }

  async function claimPendingCountReward(wishId: string, quantity: number, claimStarCoin = false) {
    const normalizedQuantity = Math.max(1, Math.trunc(Number(quantity) || 0))
    const actionKey = `count:${wishId}:${normalizedQuantity}:${claimStarCoin ? 'star' : 'daily'}`
    processingPendingRewardKey.value = actionKey

    try {
      const result = await wishStore.claimCountProgressReward(wishId, {
        claimStarCoin,
        quantity: normalizedQuantity,
        rewardItemId: claimStarCoin ? null : getPendingRewardSelection(`count:${wishId}`),
      })

      setRewardMessage(result.message, result.ok ? 'success' : 'danger')
    } finally {
      processingPendingRewardKey.value = null
    }
  }

  async function claimCurrentCatchMoment() {
    const currentMoment = currentCatchMoment.value

    if (!currentMoment) {
      return
    }

    const firstPendingStepReward = pendingStepRewards.value[0]

    if (firstPendingStepReward && (currentMoment.actionMode === 'step-daily' || currentMoment.actionMode === 'step-star')) {
      await claimPendingStepReward(firstPendingStepReward.wishId, firstPendingStepReward.stepId, currentMoment.actionMode === 'step-star')
      return
    }

    const firstPendingCountReward = pendingCountRewardSummaries.value[0]

    if (firstPendingCountReward && (currentMoment.actionMode === 'count-daily' || currentMoment.actionMode === 'count-star')) {
      await claimPendingCountReward(
        firstPendingCountReward.wishId,
        firstPendingCountReward.pendingUnits,
        currentMoment.actionMode === 'count-star',
      )
    }
  }

  function getRewardClaimLabel(claimKind: string) {
    if (claimKind === 'wish_reward') {
      return '完成愿望'
    }

    if (claimKind === 'step_reward') {
      return '完成步骤'
    }

    if (claimKind === 'count_reward') {
      return '数字进度'
    }

    if (claimKind === 'star_coin') {
      return '存星星币'
    }

    if (claimKind === 'step_star_coin') {
      return '步骤星币'
    }

    if (claimKind === 'count_star_coin') {
      return '进度星币'
    }

    if (claimKind === 'wish_completion_bonus') {
      return '完成星币'
    }

    if (claimKind === 'reward_deposit') {
      return '助力存入'
    }

    return '兑换奖励'
  }

  function getRewardClaimReason(claim: {
    claimKind: string
    sourceWishId: string | null
    sourceStepId: string | null
    titleSnapshot: string
    quantity: number
  }) {
    const sourceWishTitle = claim.sourceWishId ? wishStore.findById(claim.sourceWishId)?.title ?? '这条愿望' : '这条愿望'
    const rewardTitle = claim.titleSnapshot || '这份奖励'

    if (claim.claimKind === 'step_reward') {
      return `因为「${sourceWishTitle}」的小步骤完成了，接住了「${rewardTitle}」。`
    }

    if (claim.claimKind === 'count_reward') {
      return `因为「${sourceWishTitle}」推进了 ${Math.max(1, claim.quantity)} 点，接住了「${rewardTitle}」。`
    }

    if (claim.claimKind === 'wish_reward') {
      return `因为「${sourceWishTitle}」整条完成了，接住了「${rewardTitle}」。`
    }

    if (claim.claimKind === 'star_coin') {
      return claim.sourceStepId
        ? `因为「${sourceWishTitle}」的小步骤完成了，这次先存成了 ${Math.max(1, claim.quantity)} 枚星星币。`
        : `因为「${sourceWishTitle}」数字进度推进了 ${Math.max(1, claim.quantity)} 点，这次先存成了 ${Math.max(1, claim.quantity)} 枚星星币。`
    }

    if (claim.claimKind === 'step_star_coin') {
      return `因为「${sourceWishTitle}」的小步骤完成了，自动获得了「${rewardTitle}」。`
    }

    if (claim.claimKind === 'count_star_coin') {
      return `因为「${sourceWishTitle}」数字进度推进了 ${Math.max(1, claim.quantity)} 点，自动获得了「${rewardTitle}」。`
    }

    if (claim.claimKind === 'wish_completion_bonus') {
      return `因为「${sourceWishTitle}」整条完成了，自动获得了「${rewardTitle}」。`
    }

    if (claim.claimKind === 'reward_deposit') {
      return `往「${rewardTitle}」助力存入了 ${Math.max(1, claim.quantity)} 枚星星币。`
    }

    return `用星星币兑换到了「${rewardTitle}」。`
  }

  return {
    archiveReward,
    authStore,
    backupMessage,
    backupTone,
    bindFixedEmail,
    canBindFixedEmail,
    canCopyInviteCode,
    claimCurrentCatchMoment,
    claimPendingCountReward,
    claimPendingStepReward,
    claimableRewardEntries,
    closestRewardEntry,
    canDepositReward,
    canRedeemPremiumReward,
    copyInviteCode,
    currentMemberDailyRewards,
    currentMemberPremiumExchangeRewards,
    currentMemberPremiumRewards,
    currentMemberStarCoins,
    currentCatchMoment,
    currentRoleLabel,
    dailyRewardNoteDraft,
    dailyRewardTitleDraft,
    depositRewardStarCoins,
    downloadBackup,
    editingDailyRewardId,
    editingPremiumRewardId,
    estimatedRemainingImageCount,
    fixedDisplayNameDraft,
    fixedEmailDraft,
    formatBeijingDateTime,
    formatStorageBytes,
    getRewardClaimLabel,
    getRewardClaimReason,
    getRewardDepositedStarCoins,
    getRewardDepositPercent,
    getRecommendedDepositAmount,
    getRewardPrimaryActionLabel,
    getRewardRemainingStarCoins,
    getRewardTaskKindLabel,
    inviteDraft,
    inviteMessage,
    inviteTone,
    getPendingCountUnitLabel,
    getPendingRewardSelection,
    isBindingEmail,
    isJoiningSpace,
    isProcessingPendingReward,
    isSendingMagicLink,
    isSubmittingReward,
    isVerifyingOtp,
    handlePendingRewardSelectionChange,
    joinedSpaceLabel,
    joinSpace,
    loginEmail,
    loginMessage,
    loginOtp,
    loginTone,
    otpTargetEmail,
    perMemberStats,
    premiumRewardCostDraft,
    premiumRewardNoteDraft,
    premiumRewardScopeDraft,
    premiumRewardTitleDraft,
    premiumRedeemableNowCount,
    premiumWishlistCostTotal,
    pendingCountRewardSummaries,
    pendingCountRewardUnits,
    pendingSmallRewardUnits,
    pendingStarCoinSpend,
    pendingStepRewards,
    processingRewardItemId,
    recentRewardClaims,
    recentRewardClaimPreview,
    redeemPremiumReward,
    resetRewardDraft,
    rewardMessage,
    rewardPoolByMember,
    rewardTaskEntries,
    rewardTone,
    roleLabels,
    sharedPremiumExchangeRewards,
    sharedPremiumRewards,
    savingRewardEntries,
    assistRewardEntries,
    showOtpForm,
    startEditingReward,
    storageSummary,
    submitDailyReward,
    submitEmailOtp,
    submitMagicLink,
    submitPremiumReward,
    supabaseAuthMode,
    supabaseReadinessMessage,
    syncStatusLabel,
    wishStore,
  }
}
