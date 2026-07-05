<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CopyFold from '../components/CopyFold.vue'
import WishCompletionFireworks from '../components/WishCompletionFireworks.vue'
import WishBottleStarDrop from '../components/WishBottleStarDrop.vue'
import { getWishBottleColorTier as getWishBottleColorTierModule } from '../modules/wishes/wish.progress'
import { type WishImage } from '../stores/wishes'
import { formatBeijingDateTime } from '../utils/datetime'
import { useWishDetailPageState } from '../composables/useWishDetailPageState'

const MOBILE_THREAD_PREVIEW_COUNT = 2

const {
  EXTENDED_THREAD_REACTION_OPTIONS,
  FEATURED_THREAD_REACTION_OPTIONS,
  activeReactionPickerThread,
  adjustCountProgress,
  canAddThreadReaction,
  cancelEditingThreadComment,
  canDeleteImage,
  canManageThreadComment,
  canPreviewNext,
  canPreviewPrevious,
  canRetryComment,
  clearCommentImageFiles,
  closeImagePreview,
  closeThreadReactionPicker,
  commentFeedback,
  commentFeedbackTone,
  commentImageFiles,
  commentImageInputVersion,
  countProgressDraft,
  coverImageUrl,
  currentWishStarCoinSummary,
  deleteImage,
  deleteThreadComment,
  deleteWish,
  deletingThreadId,
  draftMessage,
  editingThreadMessage,
  formatFileSize,
  getClaimToneLabel,
  getCompletionStarCoinLabel,
  getCommentImageFileKey,
  getMemberName,
  getStepActionLabel,
  getStepStarCoinLabel,
  getStepStatusCopy,
  getThreadActorName,
  getThreadMessageCopy,
  getThreadReactionAriaLabel,
  getThreadEyebrow,
  getThreadHeadline,
  getThreadMemberReactionEmojis,
  getThreadReactionCount,
  getThreadReactionLabel,
  getThreadReactionMemberNames,
  getThreadReactionRemainingCount,
  getThreadReactionSummaryLabel,
  hasActiveOverflowThreadReaction,
  handleCommentImageSelection,
  handleImageSelection,
  handleWishCompletionAction,
  isCommentThread,
  isCountProgressFeedback,
  canProgressSelectedWish,
  isCoverImage,
  isEditingThreadComment,
  isSavingThreadEdit,
  isSubmittingComment,
  isSubmittingStep,
  isThreadReactionActive,
  isThreadReactionExpanded,
  isThreadReactionMembersExpanded,
  isThreadReactionPickerOpen,
  isThreadReactionRowPending,
  isTogglingThreadReaction,
  lightboxImages,
  openImagePreview,
  openThreadReactionPicker,
  previewImage,
  previewImageIndex,
  progressSnapshot,
  removeCommentImageFile,
  removeWishStep,
  retryComment,
  rewardFeedback,
  rewardFeedbackTone,
  saveCountProgress,
  saveThreadComment,
  selectedWish,
  startEditingThreadComment,
  stepDraft,
  stepStarCoinDraft,
  stepPreview,
  stepRewardFeedbackTargetId,
  submitComment,
  submitWishStep,
  threadFeedback,
  threadFeedbackTone,
  toggleThreadReactionExpansion,
  toggleThreadReactionMembers,
  toggleThreadReaction,
  toggleWishStep,
  wishJournalEntries,
  wishStore,
} = useWishDetailPageState()

const detailTags = computed(() => {
  if (!selectedWish.value) {
    return []
  }

  return [
    selectedWish.value.scope === 'shared' ? '我们一起' : '只属于我',
    selectedWish.value.category || '还没有分类',
    selectedWish.value.status === 'done' ? '已完成' : '进行中',
  ]
})

const visibleThreads = computed(() => wishJournalEntries.value)
const visibleImages = computed(() => {
  const firstWishImage = selectedWish.value?.images[0]

  if (firstWishImage) {
    return [firstWishImage]
  }

  const firstThreadImage = visibleThreads.value.flatMap((thread) => thread.images).find((image) => image.url)

  return firstThreadImage ? [firstThreadImage] : []
})
const coverImageEntry = computed(() => visibleImages.value.find((image) => isCoverImage(image.id)) ?? visibleImages.value[0] ?? null)
const detailPreviewImages = computed(() => {
  const images: WishImage[] = []
  const seenImageIds = new Set<string>()
  const addImage = (image: WishImage) => {
    if (seenImageIds.has(image.id)) {
      return
    }

    seenImageIds.add(image.id)
    images.push(image)
  }

  selectedWish.value?.images.forEach(addImage)
  visibleThreads.value.forEach((thread) => thread.images.forEach(addImage))

  return images
})
const wishImageIds = computed(() => new Set(selectedWish.value?.images.map((image) => image.id) ?? []))
const canManagePreviewImage = computed(() => !!previewImage.value && wishImageIds.value.has(previewImage.value.id))
const mobileVisibleThreads = computed(() => visibleThreads.value.slice(0, MOBILE_THREAD_PREVIEW_COUNT))
const mobileOverflowThreads = computed(() => visibleThreads.value.slice(MOBILE_THREAD_PREVIEW_COUNT))
const mobileNextPendingStep = computed(() => selectedWish.value?.steps.find((step) => !step.isDone) ?? null)
const mobilePrimaryStep = computed(() => mobileNextPendingStep.value ?? selectedWish.value?.steps[0] ?? null)
const mobileCompletedStepCount = computed(() => selectedWish.value?.steps.filter((step) => step.isDone).length ?? 0)
const canShowProgressCompletionAction = computed(() => {
  const progress = progressSnapshot.value

  return Boolean(
    selectedWish.value
      && selectedWish.value.status !== 'done'
      && (
        progress?.mode === 'none'
        || ((progress?.mode === 'count' || progress?.mode === 'steps') && progress.isReady)
      ),
  )
})
const isProgressAutoCompleted = computed(() => {
  return selectedWish.value?.status === 'done' && (progressSnapshot.value?.mode === 'count' || progressSnapshot.value?.mode === 'steps')
})
const isProgressVisualComplete = computed(() => (progressSnapshot.value?.percent ?? 0) >= 100)
const progressBarColorTier = computed(() => getWishBottleColorTierModule(progressSnapshot.value?.percent ?? 0))
const shouldShowStickyCtaDock = computed(() => Boolean(selectedWish.value))
const stickyCtaPrimaryLabel = computed(() => {
  if (!selectedWish.value) {
    return ''
  }

  if (selectedWish.value.status === 'done') {
    return '这条愿望已完成'
  }

  if (!canProgressSelectedWish.value) {
    return '由愿望归属人推进'
  }

  if (progressSnapshot.value?.mode === 'count') {
    return `+1${selectedWish.value.progressUnit ? ` ${selectedWish.value.progressUnit}` : ''}`
  }

  if (progressSnapshot.value?.mode === 'steps') {
    if (mobilePrimaryStep.value && !mobilePrimaryStep.value.isDone) {
      return '完成这一步'
    }

    return selectedWish.value.steps.length ? '去整理步骤' : '先补第一步'
  }

  return `完成并获得 ${getCompletionStarCoinLabel()}`
})
const stickyCtaPrimaryDisabled = computed(() => {
  if (!selectedWish.value || selectedWish.value.status === 'done') {
    return true
  }

  if (!canProgressSelectedWish.value) {
    return true
  }

  if (progressSnapshot.value?.mode === 'steps') {
    return Boolean(mobilePrimaryStep.value?.isDone)
  }

  return false
})
const stickyCtaSecondaryIntent = computed(() => {
  if (!selectedWish.value || selectedWish.value.status === 'done') {
    return 'none' as const
  }

  if (!canProgressSelectedWish.value) {
    return 'compose' as const
  }

  if (progressSnapshot.value?.mode === 'steps' && !selectedWish.value.steps.length) {
    return 'stepSetup' as const
  }

  if (progressSnapshot.value?.mode !== 'none' && canShowProgressCompletionAction.value && !isProgressAutoCompleted.value) {
    return 'complete' as const
  }

  return 'compose' as const
})
const stickyCtaSecondaryLabel = computed(() => {
  if (stickyCtaSecondaryIntent.value === 'none') {
    return ''
  }

  if (stickyCtaSecondaryIntent.value === 'compose') {
    return '写句近况'
  }

  if (stickyCtaSecondaryIntent.value === 'stepSetup') {
    return '去补步骤'
  }

  if (stickyCtaSecondaryIntent.value === 'complete') {
    return `完成并领奖（${getCompletionStarCoinLabel()}）`
  }

  return ''
})
const stickyCtaFeedbackState = computed(() => {
  if (!selectedWish.value) {
    return {
      message: '',
      tone: 'neutral' as const,
    }
  }

  if (rewardFeedback) {
    return {
      message: rewardFeedback,
      tone: rewardFeedbackTone,
    }
  }

  if (commentFeedback) {
    return {
      message: commentFeedback,
      tone: commentFeedbackTone,
    }
  }

  if (threadFeedback) {
    return {
      message: threadFeedback,
      tone: threadFeedbackTone,
    }
  }

  if (selectedWish.value.status === 'done') {
    return {
      message: '这一条已经收进回忆，想补充也可以继续写近况。',
      tone: 'neutral' as const,
    }
  }

  if (!canProgressSelectedWish.value) {
    return {
      message: '推进由愿望归属人完成，你可以写一句打气给对方。',
      tone: 'neutral' as const,
    }
  }

  if (progressSnapshot.value?.mode === 'count') {
    return {
      message: '每次 +1 都会记进这页，并按规则发放星星币。',
      tone: 'neutral' as const,
    }
  }

  if (progressSnapshot.value?.mode === 'steps') {
    if (mobilePrimaryStep.value && !mobilePrimaryStep.value.isDone) {
      return {
        message: `下一步：${mobilePrimaryStep.value.title}`,
        tone: 'neutral' as const,
      }
    }

    return {
      message: selectedWish.value.steps.length ? '当前步骤已完成，可以整理下一步。' : '先补一个具体步骤，这条愿望会更好推进。',
      tone: 'neutral' as const,
    }
  }

  return {
    message: `完成后会获得 ${getCompletionStarCoinLabel()}，也会留下一笔完成记录。`,
    tone: 'neutral' as const,
  }
})
const wishBottleAnimationSnapshot = computed(() => wishStore.wishBottleSnapshot)
const wishBottleAnimationStarCount = computed(() => {
  const snapshot = wishBottleAnimationSnapshot.value
  return snapshot.completedStepStarCount + snapshot.completedCountUnits
})
const isCompletionFireworksActive = ref(false)
const isStepStarDropActive = ref(false)
const isDeleteWishConfirming = ref(false)
const isDeletingWish = ref(false)
const deleteWishFeedback = ref('')

function getPreviewImageCaption(image: WishImage) {
  if (wishImageIds.value.has(image.id)) {
    return coverImageEntry.value?.id === image.id || isCoverImage(image.id) ? '封面图' : '愿望图片'
  }

  const sourceThread = visibleThreads.value.find((thread) => thread.images.some((threadImage) => threadImage.id === image.id))
  const threadMessage = sourceThread?.messageText.trim()

  return threadMessage || '评论图片'
}

function openWishDeleteConfirm() {
  deleteWishFeedback.value = ''
  isDeleteWishConfirming.value = true
}

function cancelWishDeleteConfirm() {
  if (isDeletingWish.value) {
    return
  }

  deleteWishFeedback.value = ''
  isDeleteWishConfirming.value = false
}

async function confirmDeleteWish() {
  if (isDeletingWish.value) {
    return
  }

  isDeletingWish.value = true
  deleteWishFeedback.value = ''

  try {
    const deleted = await deleteWish()

    if (!deleted) {
      deleteWishFeedback.value = '这条愿望暂时还没有移走，请稍后再试。'
      return
    }

    isDeleteWishConfirming.value = false
  } finally {
    isDeletingWish.value = false
  }
}

async function runWishCompletionAction() {
  const wasIncomplete = selectedWish.value?.status !== 'done'
  const completed = await handleWishCompletionAction()

  if (!wasIncomplete || !completed) {
    return
  }

  await nextTick()

  if (selectedWish.value?.status === 'done') {
    isCompletionFireworksActive.value = false
    await nextTick()
    isCompletionFireworksActive.value = true
  }
}

async function runWishStepToggle(stepId: string) {
  const result = await toggleWishStep(stepId)

  if (!result || typeof result !== 'object') {
    return
  }

  if (!result.completedStep) {
    return
  }

  isStepStarDropActive.value = false
  await nextTick()
  isStepStarDropActive.value = true

  if (result.autoCompleted) {
    isCompletionFireworksActive.value = false
    await nextTick()
    isCompletionFireworksActive.value = true
  }
}

async function runCountProgressAdjustment(delta: number) {
  const result = await adjustCountProgress(delta)

  if (!result || typeof result !== 'object') {
    return
  }

  if (result.gainedProgress) {
    await triggerStepStarDrop()
  }

  if (result.autoCompleted) {
    isCompletionFireworksActive.value = false
    await nextTick()
    isCompletionFireworksActive.value = true
  }
}

async function runCountProgressSave() {
  const result = await saveCountProgress()

  if (!result || typeof result !== 'object') {
    return
  }

  if (result.gainedProgress) {
    await triggerStepStarDrop()
  }

  if (result.autoCompleted) {
    isCompletionFireworksActive.value = false
    await nextTick()
    isCompletionFireworksActive.value = true
  }
}

async function triggerStepStarDrop() {
  isStepStarDropActive.value = false
  await nextTick()
  isStepStarDropActive.value = true
}

function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId)

  if (!target) {
    return
  }

  target.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

async function runStickyCtaPrimaryAction() {
  if (!selectedWish.value || selectedWish.value.status === 'done' || !canProgressSelectedWish.value) {
    return
  }

  if (progressSnapshot.value?.mode === 'count') {
    await runCountProgressAdjustment(1)
    return
  }

  if (progressSnapshot.value?.mode === 'steps') {
    if (mobilePrimaryStep.value && !mobilePrimaryStep.value.isDone) {
      await runWishStepToggle(mobilePrimaryStep.value.id)
      return
    }

    scrollToSection('detail-tools')
    return
  }

  await runWishCompletionAction()
}

async function runStickyCtaSecondaryAction() {
  if (!selectedWish.value || stickyCtaSecondaryIntent.value === 'none') {
    return
  }

  if (stickyCtaSecondaryIntent.value === 'compose') {
    scrollToSection('compose')
    return
  }

  if (stickyCtaSecondaryIntent.value === 'stepSetup') {
    scrollToSection('detail-tools')
    return
  }

  if (stickyCtaSecondaryIntent.value === 'complete') {
    await runWishCompletionAction()
    return
  }
}

</script>

<template>
  <section class="detail-atelier-page">
    <WishCompletionFireworks :active="isCompletionFireworksActive" @finished="isCompletionFireworksActive = false" />
    <WishBottleStarDrop
      :active="isStepStarDropActive"
      :color-tier="wishBottleAnimationSnapshot.colorTier"
      :is-rainbow-glow="wishBottleAnimationSnapshot.isRainbowGlow"
      :total-stars="wishBottleAnimationStarCount"
      @finished="isStepStarDropActive = false"
    />
    <template v-if="selectedWish">
      <section :class="['detail-atelier-hero', { 'is-coverless': !coverImageEntry }]">
        <article class="page-card detail-atelier-story-card">
          <div v-if="coverImageUrl && coverImageEntry" class="detail-atelier-mobile-glance detail-atelier-mobile-only">
            <div class="detail-atelier-cover-slot">
              <button
                class="detail-atelier-mobile-cover-button"
                type="button"
                @click="openImagePreview(detailPreviewImages, coverImageEntry.id)"
              >
                <img class="detail-atelier-mobile-cover-image" :src="coverImageUrl" :alt="`${selectedWish.title} 首图`" />
              </button>
            </div>
          </div>

          <div class="detail-atelier-story-header">
            <span class="detail-atelier-story-owner">{{ getMemberName(selectedWish.ownerId) }}</span>
            <span class="detail-atelier-story-state-chip detail-atelier-story-state-chip-inline">{{ selectedWish.status === 'done' ? '已完成' : '进行中' }}</span>
          </div>

          <p class="detail-atelier-story-meta-note" role="note">{{ [detailTags.join(' · '), formatBeijingDateTime(selectedWish.createdAt)].filter(Boolean).join(' · ') }}</p>

          <div class="detail-atelier-story-copy">
            <h1>{{ selectedWish.title }}</h1>
            <p class="detail-atelier-lead">
              {{ selectedWish.note || '先留一个短标题也没关系，后面还可以在这里补充动机、背景和下一步。' }}
            </p>
          </div>

          <div class="detail-atelier-story-focus" role="group" aria-label="奖励进度">
            <strong>已领 {{ currentWishStarCoinSummary.earned }} 枚</strong>
            <p>还可获得 {{ currentWishStarCoinSummary.remaining }} 枚 · 可领取 {{ currentWishStarCoinSummary.pending }} 枚</p>
          </div>

          <p v-if="rewardFeedback && !stepRewardFeedbackTargetId && !isCountProgressFeedback" :class="['detail-atelier-feedback', rewardFeedbackTone]" role="status" aria-live="polite">{{ rewardFeedback }}</p>
        </article>

        <article v-if="coverImageUrl && coverImageEntry" class="page-card detail-atelier-cover-card detail-atelier-desktop-only">
          <button class="detail-atelier-cover-button" type="button" @click="openImagePreview(detailPreviewImages, coverImageEntry.id)">
            <img class="detail-atelier-cover-image" :src="coverImageUrl" :alt="`${selectedWish.title} 首图`" />
          </button>
          <div class="detail-atelier-inline-buttons detail-atelier-cover-inline-actions">
            <label v-if="wishStore.isUsingCloudWishes" class="detail-atelier-secondary upload-trigger">
              <input
                class="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                @change="handleImageSelection"
              />
              换图
            </label>
            <button
              v-if="coverImageEntry && canDeleteImage(coverImageEntry.createdBy)"
              class="detail-atelier-text danger"
              type="button"
              @click="void deleteImage(coverImageEntry.id)"
            >
              删除首图
            </button>
          </div>
        </article>
      </section>

      <section class="detail-atelier-overview-grid">
        <article id="progress" class="page-card detail-atelier-overview-card detail-atelier-progress-anchor">
          <div class="detail-atelier-meter-card">
            <div class="detail-atelier-meter-head">
              <strong>{{ progressSnapshot?.mode === 'steps' ? '步骤进度' : progressSnapshot?.mode === 'count' ? '数字进度' : '进度记录' }}</strong>
              <span>{{ progressSnapshot?.percent ?? 0 }}%</span>
            </div>
            <div class="detail-atelier-progress-track" :class="[{ 'is-complete': isProgressVisualComplete }, `tier-${progressBarColorTier}`]" :aria-label="`当前进度 ${progressSnapshot?.label || '未设置'}`">
              <div class="detail-atelier-progress-fill" :class="{ 'is-complete': isProgressVisualComplete }" :style="{ width: `${progressSnapshot?.percent ?? 0}%` }"></div>
            </div>
          </div>

          <div v-if="progressSnapshot?.mode === 'count'" class="detail-atelier-progress-stack"></div>

          <div v-else-if="progressSnapshot?.mode === 'steps'" class="detail-atelier-progress-stack">
            <div v-if="selectedWish.steps.length" class="detail-atelier-step-list detail-atelier-desktop-only">
              <article v-for="step in selectedWish.steps" :key="step.id" :class="['detail-atelier-step-card', { done: step.isDone }]">
                <button v-if="canProgressSelectedWish" class="detail-atelier-secondary detail-atelier-step-toggle" type="button" @click="void runWishStepToggle(step.id)">{{ getStepActionLabel(step.id, step.isDone) }}</button>
                <div class="detail-atelier-step-copy">
                  <strong>{{ step.title }}</strong>
                  <div class="detail-atelier-chip-row compact">
                    <span class="detail-atelier-chip">{{ getStepStarCoinLabel(step.id) }}</span>
                    <span v-if="!canProgressSelectedWish" class="detail-atelier-chip">只读</span>
                  </div>
                  <div v-if="wishStore.getStepRewardClaim(step.id)" class="detail-atelier-chip-row compact">
                    <span class="detail-atelier-chip">{{ getClaimToneLabel(wishStore.getStepRewardClaim(step.id)?.claimKind || '') }}</span>
                    <span class="detail-atelier-chip">{{ wishStore.getStepRewardClaim(step.id)?.titleSnapshot }}</span>
                  </div>
                  <p>{{ getStepStatusCopy(step.id, step.isDone) }}</p>
                </div>
                <p v-if="rewardFeedback && stepRewardFeedbackTargetId === step.id" :class="['detail-atelier-feedback', 'detail-atelier-step-feedback', rewardFeedbackTone]" role="status" aria-live="polite">{{ rewardFeedback }}</p>
              </article>
            </div>

            <div v-if="selectedWish.steps.length" class="detail-atelier-mobile-progress-glance detail-atelier-mobile-only">
              <article class="detail-atelier-mobile-step-focus">
                <div class="detail-atelier-mobile-step-focus-title-row">
                  <p class="detail-atelier-mobile-step-focus-title">{{ mobilePrimaryStep?.title || '还没有下一步' }}</p>
                  <strong class="detail-atelier-mobile-step-focus-status">{{ mobileCompletedStepCount }} / {{ selectedWish.steps.length }} 步</strong>
                </div>
                <p class="detail-atelier-mobile-step-focus-note">{{ mobileCompletedStepCount === selectedWish.steps.length ? '已经全部完成' : `还剩 ${selectedWish.steps.length - mobileCompletedStepCount} 步` }}</p>
              </article>
            </div>

            <div v-else class="detail-atelier-empty-block">
              <strong>还没有拆出小步骤</strong>
              <p>可以先写下第一个很具体的小目标，例如订票、办签证、买装备。</p>
            </div>

            <details v-if="selectedWish.steps.length" class="detail-atelier-mobile-more detail-atelier-mobile-only detail-atelier-step-more-card">
              <summary class="detail-atelier-mobile-more-summary">
                <strong>展开查看这 {{ selectedWish.steps.length }} 步</strong>
              </summary>

              <div class="detail-atelier-step-list">
                <article v-for="step in selectedWish.steps" :key="`mobile-step-${step.id}`" :class="['detail-atelier-step-card', { done: step.isDone }]">
                  <div class="detail-atelier-step-copy">
                    <div class="detail-atelier-mobile-step-title-row">
                      <strong>{{ step.title }}</strong>
                      <div v-if="wishStore.getStepRewardClaim(step.id)" class="detail-atelier-chip-row compact detail-atelier-mobile-step-title-chips">
                        <span class="detail-atelier-chip">{{ getClaimToneLabel(wishStore.getStepRewardClaim(step.id)?.claimKind || '') }}</span>
                        <span class="detail-atelier-chip">{{ wishStore.getStepRewardClaim(step.id)?.titleSnapshot }}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            </details>
          </div>

          <div v-else class="detail-atelier-progress-stack"></div>

          <div v-if="canShowProgressCompletionAction && canProgressSelectedWish && !isProgressAutoCompleted" class="detail-atelier-inline-buttons detail-atelier-progress-completion-row">
            <button class="detail-atelier-secondary detail-atelier-secondary-action detail-atelier-progress-completion" type="button" @click="void runWishCompletionAction()">完成并获得 {{ getCompletionStarCoinLabel() }}</button>
          </div>

        </article>
      </section>

      <section id="compose" class="detail-atelier-compose-band">
        <details class="page-card detail-atelier-compose-card detail-atelier-compose-disclosure">
          <summary class="detail-atelier-compose-summary">
            <div class="detail-atelier-compose-summary-copy">
              <strong>先记下一笔近况</strong>
            </div>
          </summary>

          <form class="detail-atelier-comment-form is-front detail-atelier-compose-form" @submit.prevent="submitComment">
            <label class="detail-atelier-compose-message-field detail-atelier-compose-block">
              <span>留言内容</span>
              <textarea v-model="draftMessage" rows="3" maxlength="180" :disabled="isSubmittingComment" placeholder="先写一句今天的近况"></textarea>
            </label>

            <div class="detail-atelier-attachment-panel detail-atelier-compose-attachment-panel detail-atelier-compose-block detail-atelier-desktop-only" :class="{ 'is-disabled': !wishStore.isUsingCloudWishes }">
              <div class="detail-atelier-compose-attachment-copy">
                <span>图片附件</span>
              </div>

              <div v-if="wishStore.isUsingCloudWishes" class="detail-atelier-inline-buttons detail-atelier-compose-upload-row">
                <label class="detail-atelier-secondary upload-trigger">
                  <input
                    :key="commentImageInputVersion"
                    class="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    @change="handleCommentImageSelection"
                  />
                  {{ commentImageFiles.length ? `已选 ${commentImageFiles.length} 张图` : '选图' }}
                </label>
                <button v-if="commentImageFiles.length" class="detail-atelier-secondary" type="button" @click="clearCommentImageFiles()">清空已选</button>
              </div>

              <span v-else class="detail-atelier-upload-unavailable">图片留言暂需云端同步</span>

              <div v-if="commentImageFiles.length" class="detail-atelier-chip-row compact">
                <button v-for="(file, index) in commentImageFiles" :key="getCommentImageFileKey(file)" class="detail-atelier-chip chip-button" type="button" @click="removeCommentImageFile(index)">
                  {{ file.name }} · 移除
                </button>
              </div>
            </div>

            <div class="detail-atelier-mobile-upload-panel detail-atelier-mobile-only" :class="{ 'is-disabled': !wishStore.isUsingCloudWishes }">
              <div v-if="wishStore.isUsingCloudWishes" class="detail-atelier-inline-buttons detail-atelier-compose-upload-row">
                <label class="detail-atelier-secondary upload-trigger">
                  <input
                    :key="commentImageInputVersion"
                    class="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    @change="handleCommentImageSelection"
                  />
                  {{ commentImageFiles.length ? `已选 ${commentImageFiles.length} 张图` : '选图' }}
                </label>
                <button v-if="commentImageFiles.length" class="detail-atelier-secondary" type="button" @click="clearCommentImageFiles()">清空已选</button>
              </div>

              <span v-else class="detail-atelier-upload-unavailable">图片留言暂需云端同步</span>

              <div v-if="commentImageFiles.length" class="detail-atelier-chip-row compact">
                <button v-for="(file, index) in commentImageFiles" :key="`mobile-${getCommentImageFileKey(file)}`" class="detail-atelier-chip chip-button" type="button" @click="removeCommentImageFile(index)">
                  {{ file.name }} · 移除
                </button>
              </div>
            </div>

            <div class="detail-atelier-compose-submit-row detail-atelier-compose-block">
              <div class="detail-atelier-inline-buttons detail-atelier-compose-submit-buttons">
                <button class="detail-atelier-primary" type="submit" :disabled="!draftMessage.trim() || isSubmittingComment">
                  {{ isSubmittingComment ? '发送中...' : '发送留言' }}
                </button>
                <button v-if="commentFeedbackTone === 'danger' && canRetryComment" class="detail-atelier-secondary" type="button" @click="void retryComment()">重试发送</button>
              </div>
            </div>

            <p v-if="commentFeedback" :class="['detail-atelier-feedback', commentFeedbackTone]" role="status" aria-live="polite">{{ commentFeedback }}</p>
          </form>
        </details>
      </section>

      <section class="detail-atelier-journal-grid">
        <article id="journal" class="page-card detail-atelier-thread-card">
          <div class="detail-atelier-section-head">
            <div class="detail-atelier-section-copy">
              <h2>最近记录</h2>
            </div>
            <span class="detail-atelier-badge">共 {{ visibleThreads.length }} 笔</span>
          </div>

          <div v-if="visibleThreads.length" class="detail-atelier-thread-list detail-atelier-desktop-only">
            <article
              v-for="(thread, index) in visibleThreads"
              :key="thread.id"
              :class="['detail-atelier-thread-entry', { 'is-system': !isCommentThread(thread), 'is-comment': isCommentThread(thread), 'is-latest': index === 0 }]"
            >
              <div class="detail-atelier-thread-toolbar">
                <div class="detail-atelier-thread-meta">
                  <div class="detail-atelier-mobile-thread-head">
                    <div class="detail-atelier-mobile-thread-title">
                      <div class="detail-atelier-thread-subline">
                        <p class="detail-atelier-kicker">{{ getThreadEyebrow(thread) }}</p>
                        <time>{{ formatBeijingDateTime(thread.createdAt) }}</time>
                      </div>
                    </div>
                    <div class="detail-atelier-chip-row compact detail-atelier-mobile-thread-corner-chips">
                      <span class="detail-atelier-chip">{{ getThreadActorName(thread) }}</span>
                      <span v-if="thread.images.length" class="detail-atelier-chip">{{ thread.images.length }} 张图</span>
                      <span v-if="!isCommentThread(thread)" class="detail-atelier-chip">系统</span>
                    </div>
                  </div>
                </div>

                <div v-if="canManageThreadComment(thread)" class="detail-atelier-inline-buttons detail-atelier-thread-tools">
                  <button class="detail-atelier-secondary" type="button" @click="isEditingThreadComment(thread.id) ? cancelEditingThreadComment() : startEditingThreadComment(thread)">
                    {{ isEditingThreadComment(thread.id) ? '取消编辑' : '编辑评论' }}
                  </button>
                  <button class="detail-atelier-text danger" type="button" :disabled="deletingThreadId === thread.id" @click="void deleteThreadComment(thread)">
                    {{ deletingThreadId === thread.id ? '删除中...' : '删除评论' }}
                  </button>
                </div>
              </div>

              <label v-if="isEditingThreadComment(thread.id)" class="detail-atelier-note-editor">
                <span>编辑留言内容</span>
                <textarea v-model="editingThreadMessage" rows="4" maxlength="180" :disabled="isSavingThreadEdit"></textarea>
                <div class="detail-atelier-inline-buttons">
                  <button class="detail-atelier-secondary" type="button" @click="cancelEditingThreadComment()">取消</button>
                  <button class="detail-atelier-primary" type="button" :disabled="!editingThreadMessage.trim() || isSavingThreadEdit" @click="void saveThreadComment(thread)">
                    {{ isSavingThreadEdit ? '保存中...' : '保存留言' }}
                  </button>
                </div>
              </label>

              <CopyFold
                v-else
                as="p"
                class="detail-atelier-thread-message"
                layer="supporting"
                page="wish-detail"
                :target="`thread-message-${thread.id}`"
                :text="getThreadMessageCopy(thread)"
              />

              <div v-if="thread.images.length" class="detail-atelier-thread-images">
                <button
                  v-for="image in thread.images"
                  :key="image.id"
                  class="detail-atelier-thread-image-button"
                  type="button"
                  @click="openImagePreview(detailPreviewImages, image.id)"
                >
                  <img v-if="image.url" class="detail-atelier-thread-image" :src="image.url" :alt="image.fileName" />
                  <span v-else class="detail-atelier-image-empty">这张图正在出现</span>
                </button>
              </div>

              <div class="detail-atelier-reaction-row">
                <div class="detail-atelier-reaction-groups">
                  <div v-if="thread.reactions.length" class="detail-atelier-reaction-list detail-atelier-reaction-list-selected">
                    <button
                      v-for="reaction in thread.reactions"
                      :key="`${thread.id}-reaction-pill-${reaction.emoji}`"
                      :class="['detail-atelier-chip', 'detail-atelier-reaction-pill', { active: isThreadReactionMembersExpanded(thread.id, reaction.emoji) }]"
                      type="button"
                      :aria-expanded="isThreadReactionMembersExpanded(thread.id, reaction.emoji)"
                      :aria-label="getThreadReactionSummaryLabel(reaction)"
                      @click="toggleThreadReactionMembers(thread.id, reaction.emoji)"
                    >
                      {{ reaction.emoji }}<span v-if="reaction.count > 1"> {{ reaction.count }}</span>
                    </button>
                  </div>

                  <div class="detail-atelier-reaction-more">
                    <button
                      :class="['detail-atelier-secondary', 'detail-atelier-reaction-toggle', { active: isThreadReactionExpanded(thread.id) || hasActiveOverflowThreadReaction(thread) }]"
                      type="button"
                      :aria-expanded="isThreadReactionExpanded(thread.id)"
                      :aria-controls="`thread-reaction-panel-${thread.id}`"
                      :aria-label="isThreadReactionExpanded(thread.id) ? '收起表情选项' : '打开表情选项'"
                      @click="toggleThreadReactionExpansion(thread.id)"
                    >
                      {{ isThreadReactionExpanded(thread.id) ? '收起回应' : '回应' }}
                    </button>

                    <span v-if="thread.reactions.length" class="detail-atelier-reaction-summary">{{ thread.reactions.length }} 种回应</span>

                    <div v-if="isThreadReactionExpanded(thread.id)" :id="`thread-reaction-panel-${thread.id}`" class="detail-atelier-reaction-panel">
                      <section class="detail-atelier-reaction-panel-section" :aria-labelledby="`thread-reaction-featured-title-${thread.id}`">
                        <div class="detail-atelier-reaction-picker-section-head">
                          <strong :id="`thread-reaction-featured-title-${thread.id}`">常用回应</strong>
                        </div>
                        <div class="detail-atelier-reaction-list is-extended detail-atelier-reaction-list-featured">
                          <button
                            v-for="emoji in FEATURED_THREAD_REACTION_OPTIONS"
                            :key="`${thread.id}-reaction-featured-${emoji}`"
                            :class="['detail-atelier-reaction-button', { active: isThreadReactionActive(thread, emoji), 'is-pending': isTogglingThreadReaction(thread.id, emoji) }]"
                            type="button"
                            :disabled="isThreadReactionRowPending(thread.id) || !canAddThreadReaction(thread, emoji)"
                            :aria-label="getThreadReactionAriaLabel(thread, emoji)"
                            :aria-pressed="isThreadReactionActive(thread, emoji)"
                            @click="void toggleThreadReaction(thread.id, emoji)"
                          >
                            <span class="detail-atelier-reaction-emoji">{{ emoji }}</span>
                            <span
                              :class="[
                                'detail-atelier-reaction-count',
                                {
                                  'is-empty': !getThreadReactionCount(thread, emoji) && !isTogglingThreadReaction(thread.id, emoji),
                                  'is-loading': isTogglingThreadReaction(thread.id, emoji),
                                },
                              ]"
                            >
                              {{ isTogglingThreadReaction(thread.id, emoji) ? '处理中' : getThreadReactionCount(thread, emoji) || '·' }}
                            </span>
                          </button>
                        </div>
                      </section>

                      <details class="detail-atelier-reaction-picker-disclosure detail-atelier-reaction-panel-disclosure">
                        <summary class="detail-atelier-reaction-picker-disclosure-summary">
                          <strong>更多回应</strong>
                        </summary>

                        <div class="detail-atelier-reaction-list is-extended detail-atelier-reaction-list-extended">
                          <button
                            v-for="emoji in EXTENDED_THREAD_REACTION_OPTIONS"
                            :key="`${thread.id}-reaction-extended-${emoji}`"
                            :class="['detail-atelier-reaction-button', { active: isThreadReactionActive(thread, emoji), 'is-pending': isTogglingThreadReaction(thread.id, emoji) }]"
                            type="button"
                            :disabled="isThreadReactionRowPending(thread.id) || !canAddThreadReaction(thread, emoji)"
                            :aria-label="getThreadReactionAriaLabel(thread, emoji)"
                            :aria-pressed="isThreadReactionActive(thread, emoji)"
                            @click="void toggleThreadReaction(thread.id, emoji)"
                          >
                            <span class="detail-atelier-reaction-emoji">{{ emoji }}</span>
                            <span
                              :class="[
                                'detail-atelier-reaction-count',
                                {
                                  'is-empty': !getThreadReactionCount(thread, emoji) && !isTogglingThreadReaction(thread.id, emoji),
                                  'is-loading': isTogglingThreadReaction(thread.id, emoji),
                                },
                              ]"
                            >
                              {{ isTogglingThreadReaction(thread.id, emoji) ? '处理中' : getThreadReactionCount(thread, emoji) || '·' }}
                            </span>
                          </button>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="thread.reactions.length" class="detail-atelier-reaction-members-stack">
                <div
                  v-for="reaction in thread.reactions"
                  v-show="isThreadReactionMembersExpanded(thread.id, reaction.emoji)"
                  :key="`${thread.id}-reaction-members-${reaction.emoji}`"
                  class="detail-atelier-reaction-members"
                >
                  <span v-for="memberName in getThreadReactionMemberNames(reaction)" :key="memberName">{{ memberName }}</span>
                </div>
              </div>
            </article>
          </div>

          <div v-if="mobileVisibleThreads.length" class="detail-atelier-thread-list detail-atelier-mobile-only">
            <article
              v-for="(thread, index) in mobileVisibleThreads"
              :key="`mobile-thread-${thread.id}`"
              :class="['detail-atelier-thread-entry', { 'is-system': !isCommentThread(thread), 'is-comment': isCommentThread(thread), 'is-latest': index === 0 }]"
            >
              <div class="detail-atelier-thread-toolbar">
                <div class="detail-atelier-thread-meta">
                  <div class="detail-atelier-mobile-thread-head">
                    <div class="detail-atelier-mobile-thread-title">
                      <div class="detail-atelier-thread-subline">
                        <p class="detail-atelier-kicker">{{ getThreadEyebrow(thread) }}</p>
                        <time>{{ formatBeijingDateTime(thread.createdAt) }}</time>
                      </div>
                    </div>
                    <div class="detail-atelier-chip-row compact detail-atelier-mobile-thread-corner-chips">
                      <span class="detail-atelier-chip">{{ getThreadActorName(thread) }}</span>
                      <span v-if="thread.images.length" class="detail-atelier-chip">{{ thread.images.length }} 张图</span>
                      <span v-if="!isCommentThread(thread)" class="detail-atelier-chip">系统</span>
                    </div>
                  </div>
                </div>

              </div>

              <label v-if="isEditingThreadComment(thread.id)" class="detail-atelier-note-editor">
                <span>编辑留言内容</span>
                <textarea v-model="editingThreadMessage" rows="4" maxlength="180" :disabled="isSavingThreadEdit"></textarea>
                <div class="detail-atelier-inline-buttons">
                  <button class="detail-atelier-secondary" type="button" @click="cancelEditingThreadComment()">取消</button>
                  <button class="detail-atelier-primary" type="button" :disabled="!editingThreadMessage.trim() || isSavingThreadEdit" @click="void saveThreadComment(thread)">
                    {{ isSavingThreadEdit ? '保存中...' : '保存留言' }}
                  </button>
                </div>
              </label>

              <CopyFold
                v-else
                as="p"
                class="detail-atelier-thread-message detail-atelier-thread-message-mobile"
                layer="supporting"
                page="wish-detail"
                :target="`mobile-thread-message-${thread.id}`"
                :text="getThreadMessageCopy(thread)"
              />

              <div v-if="thread.images.length" class="detail-atelier-thread-images">
                <button
                  v-for="image in thread.images"
                  :key="`mobile-thread-image-${image.id}`"
                  class="detail-atelier-thread-image-button"
                  type="button"
                  @click="openImagePreview(detailPreviewImages, image.id)"
                >
                  <img v-if="image.url" class="detail-atelier-thread-image" :src="image.url" :alt="image.fileName" />
                  <span v-else class="detail-atelier-image-empty">这张图正在出现</span>
                </button>
              </div>

              <div class="detail-atelier-reaction-row detail-atelier-mobile-reaction-rail">
                <button
                  :id="`thread-reaction-toggle-mobile-${thread.id}`"
                  :class="['detail-atelier-secondary', 'detail-atelier-reaction-toggle', 'detail-atelier-mobile-reaction-trigger', { active: isThreadReactionPickerOpen(thread.id) || hasActiveOverflowThreadReaction(thread) }]"
                  type="button"
                  :aria-expanded="isThreadReactionPickerOpen(thread.id)"
                  aria-controls="detail-thread-reaction-sheet"
                  :aria-label="isThreadReactionPickerOpen(thread.id) ? '收起表情选项' : '打开表情选项'"
                  @click="openThreadReactionPicker(thread.id, `thread-reaction-toggle-mobile-${thread.id}`)"
                >
                  <span aria-hidden="true">+</span>
                </button>

                <div v-if="thread.reactions.length" class="detail-atelier-reaction-list detail-atelier-mobile-reaction-pills">
                  <button
                    v-for="reaction in thread.reactions"
                    :key="`${thread.id}-mobile-reaction-pill-${reaction.emoji}`"
                    :class="['detail-atelier-chip', 'detail-atelier-reaction-pill', { active: isThreadReactionMembersExpanded(thread.id, reaction.emoji) }]"
                    type="button"
                    :aria-expanded="isThreadReactionMembersExpanded(thread.id, reaction.emoji)"
                    :aria-label="getThreadReactionSummaryLabel(reaction)"
                    @click="toggleThreadReactionMembers(thread.id, reaction.emoji)"
                  >
                    {{ reaction.emoji }}<span v-if="reaction.count > 1"> {{ reaction.count }}</span>
                  </button>
                </div>
                <span v-else class="detail-atelier-reaction-summary">暂无回应</span>

                <div v-if="canManageThreadComment(thread)" class="detail-atelier-inline-buttons detail-atelier-mobile-thread-inline-tools">
                  <button class="detail-atelier-text" type="button" @click="isEditingThreadComment(thread.id) ? cancelEditingThreadComment() : startEditingThreadComment(thread)">
                    {{ isEditingThreadComment(thread.id) ? '取消' : '编辑' }}
                  </button>
                  <button class="detail-atelier-text danger" type="button" :disabled="deletingThreadId === thread.id" @click="void deleteThreadComment(thread)">
                    {{ deletingThreadId === thread.id ? '删除中' : '删除' }}
                  </button>
                </div>
              </div>
              <div v-if="thread.reactions.length" class="detail-atelier-reaction-members-stack detail-atelier-mobile-reaction-members-stack">
                <div
                  v-for="reaction in thread.reactions"
                  v-show="isThreadReactionMembersExpanded(thread.id, reaction.emoji)"
                  :key="`${thread.id}-mobile-reaction-members-${reaction.emoji}`"
                  class="detail-atelier-reaction-members"
                >
                  <span v-for="memberName in getThreadReactionMemberNames(reaction)" :key="memberName">{{ memberName }}</span>
                </div>
              </div>
            </article>
          </div>

          <details v-if="mobileOverflowThreads.length" class="detail-atelier-mobile-more detail-atelier-mobile-only detail-atelier-thread-more-card">
            <summary class="detail-atelier-mobile-more-summary">
              <strong>再往前翻 {{ mobileOverflowThreads.length }} 笔</strong>
            </summary>

            <div class="detail-atelier-thread-list detail-atelier-thread-list-overflow">
              <article
                v-for="thread in mobileOverflowThreads"
                :key="`mobile-thread-overflow-${thread.id}`"
                :class="['detail-atelier-thread-entry', { 'is-system': !isCommentThread(thread), 'is-comment': isCommentThread(thread) }]"
              >
                <div class="detail-atelier-thread-toolbar">
                  <div class="detail-atelier-thread-meta">
                    <div class="detail-atelier-mobile-thread-head">
                      <div class="detail-atelier-mobile-thread-title">
                        <div class="detail-atelier-thread-subline">
                          <p class="detail-atelier-kicker">{{ getThreadEyebrow(thread) }}</p>
                          <time>{{ formatBeijingDateTime(thread.createdAt) }}</time>
                        </div>
                      </div>
                      <div class="detail-atelier-chip-row compact detail-atelier-mobile-thread-corner-chips">
                        <span class="detail-atelier-chip">{{ getThreadActorName(thread) }}</span>
                        <span v-if="thread.images.length" class="detail-atelier-chip">{{ thread.images.length }} 张图</span>
                        <span v-if="!isCommentThread(thread)" class="detail-atelier-chip">系统</span>
                      </div>
                    </div>
                  </div>

                </div>

                <label v-if="isEditingThreadComment(thread.id)" class="detail-atelier-note-editor">
                  <span>编辑留言内容</span>
                  <textarea v-model="editingThreadMessage" rows="4" maxlength="180" :disabled="isSavingThreadEdit"></textarea>
                  <div class="detail-atelier-inline-buttons">
                    <button class="detail-atelier-secondary" type="button" @click="cancelEditingThreadComment()">取消</button>
                    <button class="detail-atelier-primary" type="button" :disabled="!editingThreadMessage.trim() || isSavingThreadEdit" @click="void saveThreadComment(thread)">
                      {{ isSavingThreadEdit ? '保存中...' : '保存留言' }}
                    </button>
                  </div>
                </label>

                <CopyFold
                  v-else
                  as="p"
                  class="detail-atelier-thread-message detail-atelier-thread-message-mobile"
                  layer="supporting"
                  page="wish-detail"
                  :target="`mobile-thread-overflow-message-${thread.id}`"
                  :text="getThreadMessageCopy(thread)"
                />

                <div v-if="thread.images.length" class="detail-atelier-thread-images">
                  <button
                    v-for="image in thread.images"
                    :key="`mobile-thread-overflow-image-${image.id}`"
                    class="detail-atelier-thread-image-button"
                    type="button"
                    @click="openImagePreview(detailPreviewImages, image.id)"
                  >
                    <img v-if="image.url" class="detail-atelier-thread-image" :src="image.url" :alt="image.fileName" />
                    <span v-else class="detail-atelier-image-empty">这张图正在出现</span>
                  </button>
                </div>

                <div class="detail-atelier-reaction-row detail-atelier-mobile-reaction-rail">
                  <button
                    :id="`thread-reaction-toggle-mobile-overflow-${thread.id}`"
                    :class="['detail-atelier-secondary', 'detail-atelier-reaction-toggle', 'detail-atelier-mobile-reaction-trigger', { active: isThreadReactionPickerOpen(thread.id) || hasActiveOverflowThreadReaction(thread) }]"
                    type="button"
                    :aria-expanded="isThreadReactionPickerOpen(thread.id)"
                    aria-controls="detail-thread-reaction-sheet"
                    :aria-label="isThreadReactionPickerOpen(thread.id) ? '收起表情选项' : '打开表情选项'"
                    @click="openThreadReactionPicker(thread.id, `thread-reaction-toggle-mobile-overflow-${thread.id}`)"
                  >
                    <span aria-hidden="true">+</span>
                  </button>

                  <div v-if="thread.reactions.length" class="detail-atelier-reaction-list detail-atelier-mobile-reaction-pills">
                    <button
                      v-for="reaction in thread.reactions"
                      :key="`${thread.id}-mobile-overflow-reaction-pill-${reaction.emoji}`"
                      :class="['detail-atelier-chip', 'detail-atelier-reaction-pill', { active: isThreadReactionMembersExpanded(thread.id, reaction.emoji) }]"
                      type="button"
                      :aria-expanded="isThreadReactionMembersExpanded(thread.id, reaction.emoji)"
                      :aria-label="getThreadReactionSummaryLabel(reaction)"
                      @click="toggleThreadReactionMembers(thread.id, reaction.emoji)"
                    >
                      {{ reaction.emoji }}<span v-if="reaction.count > 1"> {{ reaction.count }}</span>
                    </button>
                  </div>
                  <span v-else class="detail-atelier-reaction-summary">暂无回应</span>

                  <div v-if="canManageThreadComment(thread)" class="detail-atelier-inline-buttons detail-atelier-mobile-thread-inline-tools">
                    <button class="detail-atelier-text" type="button" @click="isEditingThreadComment(thread.id) ? cancelEditingThreadComment() : startEditingThreadComment(thread)">
                      {{ isEditingThreadComment(thread.id) ? '取消' : '编辑' }}
                    </button>
                    <button class="detail-atelier-text danger" type="button" :disabled="deletingThreadId === thread.id" @click="void deleteThreadComment(thread)">
                      {{ deletingThreadId === thread.id ? '删除中' : '删除' }}
                    </button>
                  </div>
                </div>
                <div v-if="thread.reactions.length" class="detail-atelier-reaction-members-stack detail-atelier-mobile-reaction-members-stack">
                  <div
                    v-for="reaction in thread.reactions"
                    v-show="isThreadReactionMembersExpanded(thread.id, reaction.emoji)"
                    :key="`${thread.id}-mobile-overflow-reaction-members-${reaction.emoji}`"
                    class="detail-atelier-reaction-members"
                  >
                    <span v-for="memberName in getThreadReactionMemberNames(reaction)" :key="memberName">{{ memberName }}</span>
                  </div>
                </div>
              </article>
            </div>
          </details>

          <div v-else class="detail-atelier-empty-block">
            <strong>这条愿望还没有留下手账记录</strong>
            <p>先从上面的留言口写下一句，后面的变化会继续接进来。</p>
          </div>

          <p v-if="threadFeedback" :class="['detail-atelier-feedback', threadFeedbackTone]" role="status" aria-live="polite">{{ threadFeedback }}</p>
        </article>

      </section>

      <section id="detail-tools" class="detail-atelier-tools-band">
        <details class="page-card detail-atelier-tools-card detail-atelier-danger-details">
          <summary class="detail-atelier-danger-summary">
            <span>更多设置</span>
          </summary>

          <div class="detail-atelier-danger-copy-block">
            <p v-if="deleteWishFeedback" class="detail-atelier-feedback danger" role="status" aria-live="polite">{{ deleteWishFeedback }}</p>
          </div>

          <div class="detail-atelier-tools-section">
            <div class="detail-atelier-inline-buttons detail-atelier-danger-actions detail-atelier-edit-delete-actions">
              <RouterLink class="detail-atelier-secondary" :to="{ name: 'compose', query: { edit: selectedWish.id } }">编辑愿望</RouterLink>
              <button v-if="!isDeleteWishConfirming" class="detail-atelier-text danger" type="button" @click="openWishDeleteConfirm()">移走这条愿望</button>
            </div>
          </div>

          <div v-if="isDeleteWishConfirming" class="detail-atelier-inline-buttons detail-atelier-danger-actions">
            <span class="detail-atelier-chip detail-atelier-danger-chip">移走后会回到清单页</span>
            <button class="detail-atelier-secondary" type="button" :disabled="isDeletingWish" @click="cancelWishDeleteConfirm()">先不删</button>
            <button class="detail-atelier-text danger" type="button" :disabled="isDeletingWish" @click="void confirmDeleteWish()">
              {{ isDeletingWish ? '删除中...' : '确认删除' }}
            </button>
          </div>

          <div v-if="progressSnapshot?.mode === 'count' && canProgressSelectedWish" class="detail-atelier-tools-section">
            <div class="detail-atelier-tools-copy">
              <span>数字进度校正</span>
            </div>

            <div class="detail-atelier-inline-form detail-atelier-inline-form-compact">
              <label>
                <span>把它改成现在的位置</span>
                <input v-model.number="countProgressDraft" type="number" min="0" :max="Math.max(1, selectedWish.progressTarget)" />
              </label>
              <div class="detail-atelier-inline-buttons detail-atelier-tools-actions">
                <button class="detail-atelier-secondary" type="button" @click="void runCountProgressAdjustment(-1)">往回调 1 点</button>
                <button class="detail-atelier-secondary" type="button" @click="void runCountProgressSave()">保存现在的位置</button>
              </div>
            </div>
          </div>

          <div v-if="progressSnapshot?.mode === 'steps' && canProgressSelectedWish" class="detail-atelier-tools-section">
            <div class="detail-atelier-tools-copy">
              <span>步骤整理</span>
            </div>

            <form class="detail-atelier-inline-form detail-atelier-inline-form-compact" @submit.prevent="submitWishStep">
              <label>
                <span>补一小步</span>
                <input v-model="stepDraft" type="text" maxlength="60" placeholder="例如：先确认路线和预算" />
              </label>
              <label>
                <span>完成可得星星币</span>
                <input v-model.number="stepStarCoinDraft" type="number" min="0" step="0.5" />
              </label>
              <div class="detail-atelier-inline-buttons detail-atelier-tools-actions">
                <button class="detail-atelier-secondary" type="submit" :disabled="isSubmittingStep || !stepDraft.trim()">
                  {{ isSubmittingStep ? '正在加入...' : '加入这一步' }}
                </button>
              </div>
            </form>

            <div v-if="selectedWish.steps.length" class="detail-atelier-step-manage-list">
              <div v-for="step in selectedWish.steps" :key="`manage-${step.id}`" class="detail-atelier-step-manage-row">
                <span>{{ step.title }}</span>
                <button class="detail-atelier-text danger" type="button" @click="void removeWishStep(step.id)">移走这一步</button>
              </div>
            </div>
          </div>
        </details>
      </section>

      <div v-if="shouldShowStickyCtaDock" class="detail-atelier-cta-dock detail-atelier-mobile-only" aria-live="polite">
        <div class="detail-atelier-cta-dock-inner">
          <p
            v-if="stickyCtaFeedbackState.message"
            :class="['detail-atelier-cta-dock-note', `is-${stickyCtaFeedbackState.tone}`]"
          >
            {{ stickyCtaFeedbackState.message }}
          </p>
          <button
            class="detail-atelier-primary detail-atelier-cta-dock-primary"
            type="button"
            :disabled="stickyCtaPrimaryDisabled"
            @click="void runStickyCtaPrimaryAction()"
          >
            {{ stickyCtaPrimaryLabel }}
          </button>
          <button
            v-if="stickyCtaSecondaryLabel && stickyCtaPrimaryDisabled"
            class="detail-atelier-secondary detail-atelier-cta-dock-secondary"
            type="button"
            @click="void runStickyCtaSecondaryAction()"
          >
            {{ stickyCtaSecondaryLabel }}
          </button>
        </div>
      </div>
    </template>

    <article v-else class="page-card detail-atelier-empty-card">
      <p class="detail-atelier-kicker">WISH DETAIL</p>
      <h2>还没有找到这条愿望</h2>
      <p>它可能已经被删除；如果你还没有写下任何愿望，就先从第一条开始。</p>
      <div class="detail-atelier-inline-buttons">
        <RouterLink class="detail-atelier-secondary" :to="{ name: 'list' }">回清单看看</RouterLink>
        <RouterLink class="detail-atelier-primary" :to="{ name: 'compose' }">写下新愿望</RouterLink>
      </div>
    </article>

    <Teleport to="body">
      <div v-if="activeReactionPickerThread" class="detail-atelier-reaction-sheet-layer" @click.self="closeThreadReactionPicker()">
        <section
          id="detail-thread-reaction-sheet"
          class="detail-atelier-reaction-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-thread-reaction-sheet-title"
        >
          <div class="detail-atelier-reaction-sheet-handle" aria-hidden="true"></div>

          <div class="detail-atelier-reaction-sheet-head">
            <div>
              <p class="detail-atelier-kicker">手账回应</p>
              <h3 id="detail-thread-reaction-sheet-title">给这笔一点回应</h3>
              <span>{{ getThreadHeadline(activeReactionPickerThread) }}</span>
            </div>
            <button class="detail-atelier-secondary detail-atelier-reaction-picker-close" type="button" @click="closeThreadReactionPicker()">关闭</button>
          </div>

          <div class="detail-atelier-reaction-sheet-status">
            <div v-if="getThreadMemberReactionEmojis(activeReactionPickerThread).length" class="detail-atelier-reaction-list detail-atelier-reaction-list-selected">
              <span v-for="emoji in getThreadMemberReactionEmojis(activeReactionPickerThread)" :key="`sheet-selected-${activeReactionPickerThread.id}-${emoji}`" class="detail-atelier-chip">
                {{ emoji }}
              </span>
            </div>
            <p>{{ getThreadReactionRemainingCount(activeReactionPickerThread) ? `还可以再选 ${getThreadReactionRemainingCount(activeReactionPickerThread)} 个` : '已经选满 3 个，点已选表情可以收回' }}</p>
          </div>

          <div class="detail-atelier-reaction-picker">
            <section class="detail-atelier-reaction-picker-section" aria-labelledby="detail-thread-reaction-featured-title">
              <div class="detail-atelier-reaction-picker-section-head">
                <strong id="detail-thread-reaction-featured-title">常用回应</strong>
                <span>点一下就记上</span>
              </div>
              <div class="detail-atelier-reaction-picker-grid detail-atelier-reaction-list is-extended">
                <button
                  v-for="emoji in FEATURED_THREAD_REACTION_OPTIONS"
                  :key="`sheet-featured-${activeReactionPickerThread.id}-${emoji}`"
                  :class="['detail-atelier-reaction-button', { active: isThreadReactionActive(activeReactionPickerThread, emoji), 'is-pending': isTogglingThreadReaction(activeReactionPickerThread.id, emoji) }]"
                  type="button"
                  :disabled="isThreadReactionRowPending(activeReactionPickerThread.id) || !canAddThreadReaction(activeReactionPickerThread, emoji)"
                  :aria-label="getThreadReactionAriaLabel(activeReactionPickerThread, emoji)"
                  :aria-pressed="isThreadReactionActive(activeReactionPickerThread, emoji)"
                  @click="void toggleThreadReaction(activeReactionPickerThread.id, emoji)"
                >
                  <span class="detail-atelier-reaction-emoji">{{ emoji }}</span>
                  <span class="detail-atelier-reaction-name">{{ getThreadReactionLabel(emoji) }}</span>
                  <span
                    :class="[
                      'detail-atelier-reaction-count',
                      {
                        'is-empty': !getThreadReactionCount(activeReactionPickerThread, emoji) && !isTogglingThreadReaction(activeReactionPickerThread.id, emoji),
                        'is-loading': isTogglingThreadReaction(activeReactionPickerThread.id, emoji),
                      },
                    ]"
                  >
                    {{ isTogglingThreadReaction(activeReactionPickerThread.id, emoji) ? '处理中' : getThreadReactionCount(activeReactionPickerThread, emoji) || '·' }}
                  </span>
                </button>
              </div>
            </section>

            <details class="detail-atelier-reaction-picker-section detail-atelier-reaction-picker-disclosure">
              <summary class="detail-atelier-reaction-picker-disclosure-summary">
                <strong id="detail-thread-reaction-more-title">更多情绪</strong>
                <span>展开查看更多回应</span>
              </summary>

              <div class="detail-atelier-reaction-picker-grid detail-atelier-reaction-list is-extended is-compact" aria-labelledby="detail-thread-reaction-more-title">
                <button
                  v-for="emoji in EXTENDED_THREAD_REACTION_OPTIONS"
                  :key="`sheet-more-${activeReactionPickerThread.id}-${emoji}`"
                  :class="['detail-atelier-reaction-button', { active: isThreadReactionActive(activeReactionPickerThread, emoji), 'is-pending': isTogglingThreadReaction(activeReactionPickerThread.id, emoji) }]"
                  type="button"
                  :disabled="isThreadReactionRowPending(activeReactionPickerThread.id) || !canAddThreadReaction(activeReactionPickerThread, emoji)"
                  :aria-label="getThreadReactionAriaLabel(activeReactionPickerThread, emoji)"
                  :aria-pressed="isThreadReactionActive(activeReactionPickerThread, emoji)"
                  @click="void toggleThreadReaction(activeReactionPickerThread.id, emoji)"
                >
                  <span class="detail-atelier-reaction-emoji">{{ emoji }}</span>
                  <span
                    :class="[
                      'detail-atelier-reaction-count',
                      {
                        'is-empty': !getThreadReactionCount(activeReactionPickerThread, emoji) && !isTogglingThreadReaction(activeReactionPickerThread.id, emoji),
                        'is-loading': isTogglingThreadReaction(activeReactionPickerThread.id, emoji),
                      },
                    ]"
                  >
                    {{ isTogglingThreadReaction(activeReactionPickerThread.id, emoji) ? '处理中' : getThreadReactionCount(activeReactionPickerThread, emoji) || '·' }}
                  </span>
                </button>
              </div>
            </details>
          </div>
        </section>
      </div>
    </Teleport>

    <div v-if="previewImage" class="detail-atelier-overlay" @click.self="closeImagePreview()">
      <div class="detail-atelier-lightbox detail-atelier-preview-lightbox page-card" role="dialog" aria-modal="true" aria-labelledby="detail-image-preview-title">
        <div class="detail-atelier-dialog-head">
          <div>
            <p class="detail-atelier-kicker">图片预览</p>
            <h3 id="detail-image-preview-title">{{ previewImage.fileName }}</h3>
          </div>
          <button class="detail-atelier-secondary" type="button" @click="closeImagePreview()">关闭</button>
        </div>

        <div class="detail-atelier-lightbox-stage">
          <img class="detail-atelier-lightbox-image" :src="previewImage.url" :alt="previewImage.fileName" />
          <div class="detail-atelier-lightbox-actions">
            <div class="detail-atelier-lightbox-nav-actions">
              <button class="detail-atelier-secondary" type="button" :disabled="!canPreviewPrevious" @click="stepPreview(-1)">上一张</button>
              <button class="detail-atelier-secondary" type="button" :disabled="!canPreviewNext" @click="stepPreview(1)">下一张</button>
            </div>
            <div v-if="canManagePreviewImage" class="detail-atelier-lightbox-manage-actions">
              <label v-if="wishStore.isUsingCloudWishes" class="detail-atelier-secondary upload-trigger">
                <input
                  class="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  @change="handleImageSelection"
                />
                换图
              </label>
              <button
                v-if="canDeleteImage(previewImage.createdBy)"
                class="detail-atelier-text danger"
                type="button"
                @click="void deleteImage(previewImage.id)"
              >
                删除
              </button>
            </div>
          </div>
        </div>

        <div class="detail-atelier-meta-row">
          <span>{{ previewImageIndex + 1 }} / {{ lightboxImages.length }}</span>
          <span>{{ formatFileSize(previewImage.sizeBytes) }}</span>
        </div>
        <p class="detail-atelier-support">{{ getPreviewImageCaption(previewImage) }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.detail-atelier-page {
  font-family: var(--font-body);
  background:
    radial-gradient(circle at 8% 4%, color-mix(in srgb, var(--accent-panel) 40%, transparent), transparent 44%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 80%, white), var(--surface-soft));
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

.detail-atelier-page,
.detail-atelier-hero,
.detail-atelier-overview-grid,
.detail-atelier-journal-grid,
.detail-atelier-compose-band,
.detail-atelier-tools-band,
.detail-atelier-summary-grid,
.detail-atelier-summary-card,
.detail-atelier-story-card,
.detail-atelier-story-copy,
.detail-atelier-compose-card,
.detail-atelier-cover-card,
.detail-atelier-image-card,
.detail-atelier-thread-card,
.detail-atelier-overview-card,
.detail-atelier-section-copy,
.detail-atelier-meta-grid,
.detail-atelier-meta-item,
.detail-atelier-hero-summary-grid,
.detail-atelier-image-intro,
.detail-atelier-image-grid,
.detail-atelier-image-memory-strip,
.detail-atelier-image-memory-card,
.detail-atelier-reaction-copy,
.detail-atelier-reaction-groups,
.detail-atelier-reaction-more,
.detail-atelier-thread-list,
.detail-atelier-image-figure,
.detail-atelier-image-stage,
.detail-atelier-image-sheet,
.detail-atelier-comment-form,
.detail-atelier-compose-block,
.detail-atelier-attachment-panel,
.detail-atelier-progress-stack,
.detail-atelier-step-list,
.detail-atelier-choice-grid,
.detail-atelier-balance-grid,
.detail-atelier-note-editor,
.detail-atelier-image-caption-copy,
.detail-atelier-image-memory-note,
.detail-atelier-dialog,
.detail-atelier-lightbox {
  display: grid;
  gap: 1rem;
}

.detail-atelier-marquee,
.detail-atelier-marquee-actions,
.detail-atelier-chip-row,
.detail-atelier-hero-top,
.detail-atelier-meta-row,
.detail-atelier-danger-row,
.detail-atelier-inline-buttons,
.detail-atelier-image-actions,
.detail-atelier-thread-meta,
.detail-atelier-reaction-row,
.detail-atelier-choice-head,
.detail-atelier-dialog-head,
.detail-atelier-meter-head,
.detail-atelier-section-head {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-start;
}

.detail-atelier-hero,
.detail-atelier-overview-grid,
.detail-atelier-journal-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-atelier-hero {
  grid-template-columns: minmax(0, 1.12fr) minmax(320px, 0.88fr);
  align-items: start;
}

.detail-atelier-hero.is-coverless {
  grid-template-columns: minmax(0, 1fr);
}

.detail-atelier-journal-grid {
  grid-template-columns: minmax(0, 1.12fr) minmax(300px, 0.88fr);
  align-items: start;
}

.detail-atelier-balance-grid-compact {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-atelier-marquee {
  justify-content: space-between;
  align-items: center;
  padding: 0.9rem 1rem;
  background: var(--warm-panel-strong);
}

.detail-atelier-marquee p,
.detail-atelier-kicker,
.detail-atelier-meta-label,
.detail-atelier-summary-card span,
.detail-atelier-balance-card span,
.detail-atelier-empty-block strong,
.detail-atelier-comment-form label span,
.detail-atelier-identity-card span,
.detail-atelier-image-caption p,
.detail-atelier-meter-head span {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.detail-atelier-kicker {
  color: color-mix(in srgb, var(--text-soft) 82%, var(--text-faint));
  letter-spacing: 0.06em;
  text-transform: none;
}

.detail-atelier-mini-link,
.detail-atelier-primary,
.detail-atelier-secondary,
.detail-atelier-text,
.detail-atelier-badge,
.detail-atelier-chip,
.detail-atelier-reaction-button,
.chip-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: var(--type-button-tracking);
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.detail-atelier-mini-link,
.detail-atelier-secondary,
.detail-atelier-text,
.detail-atelier-badge,
.detail-atelier-chip,
.detail-atelier-reaction-button,
.chip-button {
  padding: 0.46rem 0.76rem;
  border: 1px solid var(--warm-border-soft);
  background: color-mix(in srgb, var(--surface-card) 92%, var(--warm-panel));
  color: var(--text-main);
}

.detail-atelier-primary {
  min-height: 40px;
  padding: 0.56rem 0.94rem;
  border: 0;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: var(--accent-contrast);
  box-shadow: 0 10px 20px var(--accent-shadow);
}

.detail-atelier-secondary-action {
  background: var(--warm-panel-strong);
  color: var(--text-muted);
  box-shadow: none;
}

.detail-atelier-primary:hover,
.detail-atelier-secondary:hover,
.detail-atelier-text:hover,
.detail-atelier-mini-link:hover,
.detail-atelier-reaction-button:hover,
.chip-button:hover {
  transform: translateY(-1px);
}

.detail-atelier-text.danger {
  color: var(--danger);
}

.detail-atelier-story-card,
.detail-atelier-compose-card,
.detail-atelier-cover-card,
.detail-atelier-overview-card,
.detail-atelier-image-card,
.detail-atelier-thread-card,
.detail-atelier-tools-card,
.detail-atelier-empty-card {
  padding: 0.96rem;
}

.detail-atelier-overview-card,
.detail-atelier-image-card,
.detail-atelier-thread-card,
.detail-atelier-dialog,
.detail-atelier-lightbox {
  gap: 1.05rem;
}

.detail-atelier-progress-anchor {
  scroll-margin-top: 6rem;
}

.detail-atelier-desktop-only {
  display: contents;
}

.detail-atelier-mobile-only {
  display: none;
}

.detail-atelier-story-copy {
  gap: 0.42rem;
}


.detail-atelier-mobile-step-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.detail-atelier-mobile-step-title-row > strong {
  min-width: 0;
  flex: 1 1 auto;
}

.detail-atelier-mobile-step-title-chips {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  gap: 0.28rem;
  overflow: visible;
  padding-bottom: 0;
}
.detail-atelier-story-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.detail-atelier-mobile-step-title-chips .detail-atelier-chip {
  min-height: 24px;
  padding: 0.2rem 0.46rem;
  font-size: 0.66rem;
  line-height: 1.1;
}

.detail-atelier-story-owner {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-story-state-chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0.14rem 0.56rem;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--warm-border) 72%, var(--warm-border-soft));
  background: color-mix(in srgb, var(--surface-card) 82%, white);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  line-height: 1.15;
  letter-spacing: var(--type-l7-spacing);
}

.detail-atelier-story-state-chip-inline {
  min-height: 22px;
  padding: 0.1rem 0.46rem;
}

.detail-atelier-kicker-bilingual {
  display: inline-flex;
  align-items: baseline;
  gap: 0.46rem;
  letter-spacing: 0.08em;
  text-transform: none;
}

.detail-atelier-kicker-bilingual span {
  color: var(--text-faint);
  font-size: var(--type-kicker-sub-size);
  letter-spacing: var(--type-kicker-sub-spacing);
  text-transform: uppercase;
}

.detail-atelier-section-copy {
  gap: 0.18rem;
  max-width: 28rem;
}

.detail-atelier-story-card {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--danger-panel) 54%, transparent), transparent 30%),
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 86%, white), var(--warm-panel-strong));
  padding: 0.74rem;
  gap: 0.54rem;
}

.detail-atelier-story-focus {
  display: grid;
  gap: 0.16rem;
  padding: 0.44rem 0.52rem;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--accent-border) 40%, var(--warm-border-soft));
  background: color-mix(in srgb, var(--surface-card) 84%, white);
}

.detail-atelier-story-focus-kicker {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  line-height: 1.3;
  letter-spacing: var(--type-l7-spacing);
  text-transform: uppercase;
}

.detail-atelier-story-focus strong {
  margin: 0;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.22;
  letter-spacing: var(--type-l5-spacing);
}

.detail-atelier-story-focus p {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  line-height: 1.34;
  letter-spacing: var(--type-l7-spacing);
}

.detail-atelier-story-meta-note {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  line-height: 1.36;
  letter-spacing: var(--type-l7-spacing);
}

.detail-atelier-story-card .detail-atelier-summary-card {
  padding: 0.62rem 0.68rem;
  gap: 0.26rem;
  border-radius: 14px;
}

.detail-atelier-story-card .detail-atelier-summary-card p {
  line-height: 1.42;
}

.detail-atelier-mobile-info-card {
  gap: 0.64rem;
}

.detail-atelier-mobile-info-card .detail-atelier-meta-item {
  padding: 0.62rem 0.66rem;
  border-radius: 14px;
}

.detail-atelier-mobile-glance {
  grid-template-columns: minmax(0, 1fr);
  width: min(100%, 355px);
  gap: 0.5rem;
  align-items: start;
  padding: 0.68rem;
  border-radius: 22px;
  border: 1px solid var(--warm-border-soft);
  background: var(--warm-panel);
}

.detail-atelier-cover-slot {
  display: grid;
  width: 100%;
  gap: 0.46rem;
}

.detail-atelier-mobile-cover-button {
  display: block;
  width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.detail-atelier-cover-button {
  display: block;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.detail-atelier-mobile-cover-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 20px;
  border: 1px solid var(--warm-border);
  box-shadow: var(--shadow-card);
}

.detail-atelier-mobile-cover-empty {
  min-height: 0;
  aspect-ratio: 1;
  padding: 0.72rem;
}

.detail-atelier-cover-upload {
  display: grid;
  place-items: center;
  border-radius: 20px;
  border: 1px dashed var(--warm-border-strong);
  background: var(--warm-panel);
  cursor: pointer;
}

.detail-atelier-cover-inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.36rem;
  align-items: center;
}

.detail-atelier-cover-action {
  min-height: 30px;
  padding: 0.24rem 0.52rem;
  border-radius: 999px;
  font-size: var(--type-l7-size);
  line-height: 1.1;
}

.detail-atelier-cover-action.danger {
  color: var(--danger);
}

.detail-atelier-mobile-cover-empty strong,
.detail-atelier-mobile-glance-copy strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: var(--type-l5-line);
  letter-spacing: -0.02em;
}

.detail-atelier-mobile-glance-copy {
  display: grid;
  gap: 0.38rem;
  align-content: start;
}

.detail-atelier-mobile-glance-copy p {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-mobile-more {
  display: grid;
  gap: 0.82rem;
  padding: 0.9rem 0.95rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
}

.detail-atelier-mobile-more-summary {
  display: flex;
  justify-content: space-between;
  gap: 0.72rem;
  align-items: center;
  cursor: pointer;
  list-style: none;
}

.detail-atelier-mobile-more-summary::after,
.detail-atelier-danger-summary::after {
  content: '';
  width: 0.42rem;
  height: 0.42rem;
  flex: 0 0 auto;
  border-right: 1.5px solid var(--text-soft);
  border-bottom: 1.5px solid var(--text-soft);
  transform: rotate(45deg) translateY(-1px);
  transition: transform 160ms ease;
}

.detail-atelier-mobile-more[open] .detail-atelier-mobile-more-summary::after,
.detail-atelier-danger-details[open] .detail-atelier-danger-summary::after {
  transform: rotate(225deg) translateY(-1px);
}

.detail-atelier-mobile-more-summary::-webkit-details-marker {
  display: none;
}

.detail-atelier-mobile-more-summary span {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.detail-atelier-mobile-more-summary strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l6-size);
  font-weight: 600;
  line-height: var(--type-l6-line);
  letter-spacing: var(--type-l6-spacing);
}

.detail-atelier-mobile-more[open] .detail-atelier-mobile-more-summary {
  padding-bottom: 0.14rem;
}

.detail-atelier-mobile-meta-grid {
  gap: 0.58rem;
}

.detail-atelier-hero-top {
  justify-content: space-between;
  align-items: center;
}

.detail-atelier-hero-top .detail-atelier-mini-link {
  min-height: auto;
  padding: 0.18rem 0.62rem;
  border: 1px solid var(--warm-border-strong);
  background: var(--warm-panel-strong);
  color: var(--text-muted);
  justify-content: flex-start;
}

.detail-atelier-hero-top .detail-atelier-mini-link:hover,
.detail-atelier-hero-top .detail-atelier-mini-link:active {
  transform: none;
}

.detail-atelier-compose-card {
  border: 1px solid var(--warm-border-soft);
  background: color-mix(in srgb, var(--surface-card) 94%, white);
}

.detail-atelier-compose-disclosure {
  display: grid;
  gap: 0.7rem;
}

.detail-atelier-compose-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.78rem;
  cursor: pointer;
  list-style: none;
}

.detail-atelier-compose-summary::-webkit-details-marker {
  display: none;
}

.detail-atelier-compose-summary-copy {
  display: grid;
  gap: 0.16rem;
}

.detail-atelier-compose-summary-copy strong {
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-l5-size);
  font-weight: 700;
  line-height: 1.3;
}

.detail-atelier-compose-summary-copy span {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-compose-summary::after {
  content: '';
  width: 0.42rem;
  height: 0.42rem;
  flex: 0 0 auto;
  border-right: 1.5px solid var(--text-soft);
  border-bottom: 1.5px solid var(--text-soft);
  transform: rotate(45deg) translateY(-1px);
  transition: transform 160ms ease;
}

.detail-atelier-compose-disclosure[open] .detail-atelier-compose-summary::after {
  transform: rotate(225deg) translateY(-1px);
}

.detail-atelier-compose-form {
  border-top: 1px solid var(--warm-border-soft);
  padding-top: 0.68rem;
}

.detail-atelier-thread-card {
  border: 1px solid var(--warm-border-soft);
  background: linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 94%, white), var(--surface-soft));
}

.detail-atelier-overview-card {
  position: relative;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent-border) 44%, var(--warm-border));
  background:
    linear-gradient(180deg, var(--surface-card), color-mix(in srgb, var(--accent-panel) 54%, var(--surface-card))),
    radial-gradient(circle at 92% 8%, color-mix(in srgb, var(--accent-ring) 42%, transparent), transparent 44%);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--accent-shadow) 36%, transparent);
}

.detail-atelier-overview-card::before {
  content: '';
  position: absolute;
  top: -34px;
  right: -28px;
  width: 148px;
  height: 92px;
  border-radius: 999px;
  background: radial-gradient(circle at center, color-mix(in srgb, var(--accent-ring) 54%, transparent), transparent 68%);
  pointer-events: none;
}

.detail-atelier-overview-card .detail-atelier-section-head {
  position: relative;
}

.detail-atelier-overview-card .detail-atelier-meter-card {
  border-color: color-mix(in srgb, var(--accent-border) 44%, var(--warm-border-soft));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--accent-panel) 64%, var(--surface-card)), var(--surface-soft));
}

.detail-atelier-image-card {
  align-content: start;
  background:
    linear-gradient(180deg, var(--surface-card), var(--warm-panel-strong)),
    radial-gradient(circle at bottom right, var(--sage-glow), transparent 28%);
}

.detail-atelier-story-card h1,
.detail-atelier-cover-card h2,
.detail-atelier-overview-card h2,
.detail-atelier-image-card h2,
.detail-atelier-thread-card h2,
.detail-atelier-dialog h3,
.detail-atelier-lightbox h3,
.detail-atelier-empty-card h2 {
  margin: 0;
  color: var(--text-main);
}

.detail-atelier-story-card h1 {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.032em;
}

.detail-atelier-cover-card h2,
.detail-atelier-overview-card h2,
.detail-atelier-image-card h2,
.detail-atelier-thread-card h2,
.detail-atelier-dialog h3,
.detail-atelier-lightbox h3,
.detail-atelier-empty-card h2 {
  font-family: var(--font-body);
  font-size: var(--type-l5-size);
  font-weight: 700;
  line-height: 1.32;
  letter-spacing: 0;
}

.detail-atelier-story-card h1 {
  max-width: 20ch;
  font-size: clamp(1.42rem, 1.12rem + 1.1vw, 1.76rem);
  line-height: 1.18;
  letter-spacing: -0.01em;
}

.detail-atelier-lead,
.detail-atelier-thread-message,
.detail-atelier-image-note {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-muted);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.detail-atelier-support,
.detail-atelier-summary-card p,
.detail-atelier-empty-block p,
.detail-atelier-reward-block p,
.detail-atelier-choice-card p {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-lead {
  max-width: 34ch;
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-line);
}

.detail-atelier-support-wide {
  max-width: 42rem;
}

.detail-atelier-chip-row.compact,
.detail-atelier-inline-buttons {
  justify-content: flex-start;
}

.detail-atelier-meta-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.72rem;
}

.detail-atelier-meta-item {
  gap: 0.26rem;
  padding: 0.76rem 0.82rem;
  border-radius: 18px;
  border: 1px solid var(--warm-border-soft);
  background: var(--warm-panel);
}

.detail-atelier-meta-item strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l6-size);
  font-weight: 600;
  line-height: var(--type-l6-line);
  letter-spacing: var(--type-l6-spacing);
}

.detail-atelier-danger-copy {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-danger-copy-block {
  display: grid;
  gap: 0.42rem;
}

.detail-atelier-danger-row {
  gap: 0.64rem;
  padding-top: 0.78rem;
  border-top: 1px dashed var(--warm-border);
}

.detail-atelier-tools-card {
  background: var(--warm-panel-strong);
}

.detail-atelier-tools-section {
  display: grid;
  gap: 0.6rem;
  padding-top: 0.78rem;
  border-top: 1px dashed var(--warm-border);
}

.detail-atelier-tools-copy {
  display: grid;
  gap: 0.28rem;
}

.detail-atelier-tools-copy span {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.detail-atelier-tools-copy p {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-danger-details {
  display: grid;
  justify-content: stretch;
}

.detail-atelier-danger-summary {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  cursor: pointer;
  list-style: none;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-danger-summary::-webkit-details-marker {
  display: none;
}

.detail-atelier-danger-summary span {
  color: var(--text-faint);
}

.detail-atelier-danger-summary strong {
  color: var(--text-main);
  font-weight: 600;
}

.detail-atelier-danger-details[open] .detail-atelier-danger-summary {
  padding-bottom: 0.56rem;
}

.detail-atelier-danger-actions {
  justify-content: flex-end;
  align-items: center;
}

.detail-atelier-edit-delete-actions {
  flex-wrap: nowrap;
}

.detail-atelier-edit-delete-actions > .detail-atelier-secondary,
.detail-atelier-edit-delete-actions > .detail-atelier-text.danger {
  flex: 1 1 0;
  min-width: 0;
}

.detail-atelier-tools-actions {
  justify-content: flex-start;
  align-items: center;
}

.detail-atelier-danger-chip {
  min-height: 38px;
  background: var(--danger-panel);
  color: var(--danger);
}

.detail-atelier-cover-card {
  background: var(--surface-raised);
  box-shadow: var(--shadow-soft);
}

.detail-atelier-cover-head {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
}

.detail-atelier-cover-image {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
}

.detail-atelier-cover-empty,
.detail-atelier-empty-block {
  display: grid;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: var(--radius-xl);
  border: 1px dashed var(--line-strong);
  background: var(--surface-soft);
}

.detail-atelier-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.56rem;
}

.detail-atelier-summary-card,
.detail-atelier-balance-card,
.detail-atelier-member-card,
.detail-atelier-meter-card,
.detail-atelier-choice-card,
.detail-atelier-star-card,
.detail-atelier-identity-card,
.detail-atelier-image-figure,
.detail-atelier-thread-entry {
  padding: 0.84rem;
  border-radius: 16px;
  border: 1px solid var(--warm-border-soft);
  background: color-mix(in srgb, var(--surface-card) 78%, var(--warm-panel));
  box-shadow: none;
}

.detail-atelier-summary-card:not(.detail-atelier-summary-card-featured) {
  background: color-mix(in srgb, var(--surface-card) 92%, var(--warm-panel));
}

.detail-atelier-summary-card {
  gap: 0.28rem;
  align-content: start;
  padding: 0.72rem 0.78rem;
  border-radius: 16px;
}

.detail-atelier-hero-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.58rem;
}

.detail-atelier-mobile-info-card .detail-atelier-mobile-meta-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.58rem;
}

.detail-atelier-mobile-progress-glance {
  grid-template-columns: minmax(0, 1fr);
  gap: 0.52rem;
}

.detail-atelier-mobile-step-focus {
  display: grid;
  gap: 0.28rem;
  padding: 0.62rem 0.68rem;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--accent-border) 36%, var(--warm-border-soft));
  background: color-mix(in srgb, var(--surface-card) 90%, white);
}

.detail-atelier-mobile-step-focus-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.detail-atelier-mobile-step-focus-status {
  margin: 0;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l6-size);
  font-weight: 600;
  line-height: 1.2;
  flex: 0 0 auto;
}

.detail-atelier-mobile-step-focus-title {
  margin: 0;
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  line-height: 1.25;
  min-width: 0;
  flex: 1 1 auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-atelier-mobile-step-focus-note {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: 1.34;
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-summary-card-featured {
  background:
    linear-gradient(180deg, var(--warm-panel-strong), var(--accent-panel)),
    radial-gradient(circle at top right, var(--danger-panel), transparent 26%);
  border-color: color-mix(in srgb, var(--accent-border) 42%, var(--warm-border-soft));
}

.detail-atelier-summary-card strong,
.detail-atelier-balance-card strong,
.detail-atelier-member-card strong,
.detail-atelier-choice-card strong,
.detail-atelier-star-card strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l6-size);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0;
}

.detail-atelier-summary-card strong {
  font-size: var(--type-l5-size);
}

.detail-atelier-summary-card-featured strong {
  font-size: var(--type-l5-size);
  line-height: 1.28;
  letter-spacing: 0;
}

.detail-atelier-meter-card,
.detail-atelier-reward-block,
.detail-atelier-balance-card,
.detail-atelier-member-card,
.detail-atelier-choice-card,
.detail-atelier-star-card {
  gap: 0.68rem;
}

.detail-atelier-meter-card {
  background:
    linear-gradient(180deg, var(--warm-panel-strong), var(--surface-soft));
  border-color: color-mix(in srgb, var(--accent-border) 34%, var(--warm-border-soft));
}

.detail-atelier-progress-quick-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.68rem;
  align-items: center;
  padding: 0.76rem 0.8rem;
  border-radius: 16px;
  border: 1px solid var(--warm-border-soft);
  background: var(--warm-panel);
}

.detail-atelier-progress-quick-copy {
  display: grid;
  gap: 0.22rem;
}

.detail-atelier-progress-quick-copy strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-supporting-size);
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0;
}

.detail-atelier-progress-quick-copy p {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-progress-primary {
  min-width: 10rem;
}

.detail-atelier-progress-primary.is-complete {
  min-height: 40px;
  padding: 0.5rem 0.88rem;
  border: 1px solid var(--warm-border);
  background: linear-gradient(180deg, var(--warm-panel-strong), var(--surface-soft));
  color: var(--text-muted);
  box-shadow: none;
  font-size: var(--type-l6-size);
  font-weight: 400;
  line-height: 1.35;
  letter-spacing: var(--type-l6-spacing);
}

.detail-atelier-progress-primary.is-complete:disabled {
  opacity: 1;
  cursor: default;
}

.detail-atelier-progress-completion-row {
  justify-content: flex-end;
  padding-top: 0.1rem;
}

.detail-atelier-progress-completion {
  min-width: 10rem;
}

.detail-atelier-progress-inline-actions {
  justify-content: flex-start;
  padding-top: 0.04rem;
}

.detail-atelier-cta-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(5.45rem + env(safe-area-inset-bottom, 0px));
  z-index: 75;
  pointer-events: none;
  animation: detail-cta-fade-in 220ms cubic-bezier(0.23, 1, 0.32, 1);
}

.detail-atelier-cta-dock-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.34rem;
  width: min(560px, calc(100% - 1rem));
  margin: 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  pointer-events: auto;
}

.detail-atelier-cta-dock-primary {
  position: relative;
  isolation: isolate;
  border: 1px solid color-mix(in srgb, white 54%, var(--warm-border-soft));
  background:
    radial-gradient(circle at 16% -32%, color-mix(in srgb, white 74%, transparent), transparent 56%),
    radial-gradient(circle at 92% 118%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 46%),
    linear-gradient(160deg, color-mix(in srgb, white 30%, transparent), color-mix(in srgb, var(--surface-popover) 34%, transparent));
  color: color-mix(in srgb, var(--text-main) 90%, white);
  box-shadow:
    0 8px 18px color-mix(in srgb, var(--accent-shadow) 16%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 80%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
}

.detail-atelier-cta-dock-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(180deg, color-mix(in srgb, white 52%, transparent), transparent 48%);
}

.detail-atelier-cta-dock-primary:hover,
.detail-atelier-cta-dock-primary:active {
  border-color: color-mix(in srgb, white 62%, var(--warm-border-soft));
  box-shadow:
    0 10px 20px color-mix(in srgb, var(--accent-shadow) 18%, transparent),
    inset 0 1px 0 color-mix(in srgb, white 82%, transparent);
}

.detail-atelier-cta-dock-primary,
.detail-atelier-cta-dock-secondary {
  width: 100%;
}

.detail-atelier-cta-dock-secondary {
  min-height: 32px;
  padding: 0.22rem 0.4rem;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  box-shadow: none;
}

.detail-atelier-cta-dock-secondary:hover,
.detail-atelier-cta-dock-secondary:active {
  transform: none;
  background: transparent;
  color: var(--text-soft);
}

.detail-atelier-cta-dock-note {
  margin: 0;
  display: none;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  line-height: 1.35;
  letter-spacing: var(--type-l7-spacing);
}

.detail-atelier-cta-dock-note.is-success,
.detail-atelier-cta-dock-note.is-danger {
  display: block;
}

.detail-atelier-cta-dock-note.is-success {
  color: var(--success);
}

.detail-atelier-cta-dock-note.is-danger {
  color: var(--danger);
}

.detail-atelier-cta-dock-primary:disabled {
  border: 1px solid color-mix(in srgb, var(--warm-border) 70%, white);
  background: linear-gradient(160deg, color-mix(in srgb, white 20%, transparent), color-mix(in srgb, var(--surface-soft) 28%, transparent));
  color: var(--text-muted);
  box-shadow: none;
}

.detail-atelier-progress-track {
  position: relative;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--accent-border) 34%, var(--warm-border-soft));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 86%, white), color-mix(in srgb, var(--line-soft) 78%, white));
  box-shadow: inset 0 1px 2px color-mix(in srgb, var(--accent-shadow) 12%, transparent);
}

.detail-atelier-progress-track.tier-blue {
  border-color: color-mix(in srgb, #6ea8ff 44%, var(--warm-border-soft));
}

.detail-atelier-progress-track.tier-green {
  border-color: color-mix(in srgb, #66b38d 44%, var(--warm-border-soft));
}

.detail-atelier-progress-track.tier-orange {
  border-color: color-mix(in srgb, #d99a55 46%, var(--warm-border-soft));
}

.detail-atelier-progress-track.tier-gold {
  border-color: color-mix(in srgb, var(--accent-gold) 48%, var(--warm-border-soft));
}

.detail-atelier-progress-track.tier-rainbow {
  border-color: color-mix(in srgb, #d98962 44%, var(--warm-border-soft));
}

.detail-atelier-progress-fill {
  position: relative;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(92deg, color-mix(in srgb, var(--accent) 88%, white), color-mix(in srgb, var(--sage) 72%, white));
  transition: width 460ms cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent-border) 36%, transparent),
    0 2px 6px color-mix(in srgb, var(--accent-shadow) 16%, transparent);
}

.detail-atelier-progress-track.tier-blue .detail-atelier-progress-fill {
  background: linear-gradient(92deg, #8fc2ff, #6a89f8);
}

.detail-atelier-progress-track.tier-green .detail-atelier-progress-fill {
  background: linear-gradient(92deg, #8ad9b2, #5db68f);
}

.detail-atelier-progress-track.tier-orange .detail-atelier-progress-fill {
  background: linear-gradient(92deg, #f2bf7d, #e09152);
}

.detail-atelier-progress-track.tier-gold .detail-atelier-progress-fill {
  background: linear-gradient(92deg, #f0dfad, #d6aa56);
}

.detail-atelier-progress-track.tier-rainbow .detail-atelier-progress-fill {
  background: linear-gradient(94deg, #f3c992 0%, #e5aa63 24%, #de8969 52%, #d7777f 76%, #bf6a73 100%);
}

.detail-atelier-progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(120deg, transparent 0%, color-mix(in srgb, #ffe8c4 46%, transparent) 48%, transparent 100%);
  opacity: 0.2;
  transform: translateX(-85%);
  animation: detail-progress-sheen 2.8s ease-in-out infinite;
}

.detail-atelier-progress-track.is-complete {
  border-color: color-mix(in srgb, var(--accent-gold) 44%, var(--warm-border));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--warm-panel-strong) 86%, white), color-mix(in srgb, var(--surface-soft) 88%, white));
}

.detail-atelier-progress-fill.is-complete {
  background: linear-gradient(92deg, color-mix(in srgb, var(--accent-gold) 72%, white), color-mix(in srgb, var(--accent) 58%, var(--accent-gold)));
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--accent-gold) 34%, transparent),
    0 2px 8px color-mix(in srgb, var(--accent-shadow) 20%, transparent);
}

.detail-atelier-progress-fill.is-complete::before {
  background: color-mix(in srgb, white 74%, var(--accent-gold));
  box-shadow: 0 0 10px color-mix(in srgb, var(--accent-gold) 36%, transparent);
  opacity: 0.8;
}

.detail-atelier-progress-fill.is-complete::after {
  background: linear-gradient(120deg, transparent 0%, color-mix(in srgb, #ffe1ad 54%, transparent) 48%, transparent 100%);
  opacity: 0.3;
  animation-duration: 3.2s;
}

@keyframes detail-progress-sheen {
  0% {
    transform: translateX(-85%);
  }
  70%,
  100% {
    transform: translateX(145%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-atelier-progress-fill {
    transition: none;
  }

  .detail-atelier-progress-fill::after {
    animation: none;
  }

  .detail-atelier-progress-fill.is-complete::after {
    animation: none;
  }
}

.detail-atelier-inline-form,
.detail-atelier-inline-form label,
.detail-atelier-note-editor label,
.detail-atelier-comment-form label {
  display: grid;
  gap: 0.55rem;
}

.detail-atelier-comment-form.is-front {
  gap: 0.48rem;
}

.detail-atelier-comment-form.is-front > * + * {
  padding-top: 0.88rem;
  border-top: 1px solid var(--warm-border-soft);
}

.detail-atelier-compose-attachment-copy {
  gap: 0.28rem;
}

.detail-atelier-compose-attachment-copy p,
.detail-atelier-compose-author-note {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-compose-submit-row {
  grid-template-columns: 1fr;
  gap: 0.62rem 0.82rem;
  align-items: center;
}

.detail-atelier-compose-attachment-panel {
  padding: 0.72rem 0.78rem;
  border-radius: 18px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
}

.detail-atelier-compose-attachment-details.is-disabled {
  background: var(--surface-soft);
}

.detail-atelier-compose-attachment-panel.is-disabled {
  background: var(--surface-soft);
}

.detail-atelier-upload-unavailable {
  display: inline-flex;
  width: fit-content;
  min-height: 36px;
  align-items: center;
  padding: 0.4rem 0.72rem;
  border-radius: 999px;
  border: 1px dashed var(--warm-border);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-compose-card .detail-atelier-primary,
.detail-atelier-compose-card .detail-atelier-secondary,
.detail-atelier-compose-card .upload-trigger {
  min-height: 44px;
  border-radius: 18px;
}

.detail-atelier-compose-card textarea {
  border-radius: 18px;
  background: var(--surface-popover);
}

.detail-atelier-compose-card textarea {
  min-height: 112px;
}

.detail-atelier-inline-form-compact {
  gap: 0.72rem;
}

.detail-atelier-step-list,
.detail-atelier-member-grid {
  display: grid;
  gap: 0.58rem;
}

.detail-atelier-step-manage-list {
  display: grid;
  gap: 0.56rem;
}

.detail-atelier-step-manage-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.56rem;
  align-items: center;
  padding: 0.72rem 0.78rem;
  border-radius: 18px;
  border: 1px solid var(--warm-border-soft);
  background: var(--warm-panel);
}

.detail-atelier-step-manage-row span {
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.detail-atelier-member-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-atelier-step-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.58rem 0.68rem;
  align-items: center;
  padding: 0.72rem 0.78rem;
  border-radius: 18px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel-strong);
}

.detail-atelier-step-card.done {
  background: var(--success-panel);
}

.detail-atelier-step-copy {
  display: grid;
  gap: 0.28rem;
}

.detail-atelier-step-copy strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.34;
  letter-spacing: -0.02em;
}

.detail-atelier-image-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.detail-atelier-image-intro {
  gap: 0.9rem;
  padding: 0.95rem 1rem 1rem;
  border-radius: 24px;
  border: 1px solid var(--warm-border);
  background:
    linear-gradient(180deg, var(--surface-card), var(--accent-panel)),
    radial-gradient(circle at top right, color-mix(in srgb, var(--accent-gold) 24%, transparent), transparent 30%);
}

.detail-atelier-image-toolbar-copy,
.detail-atelier-thread-toolbar {
  display: grid;
  gap: 0.4rem;
}

.detail-atelier-image-toolbar-copy {
  max-width: 28rem;
}

.detail-atelier-image-toolbar-copy span {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.detail-atelier-image-toolbar-copy p {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-muted);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.detail-atelier-thread-tools,
.detail-atelier-image-toolbar-actions {
  justify-content: flex-start;
}

.detail-atelier-image-memory-strip {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.72rem;
}

.detail-atelier-image-memory-card {
  gap: 0.4rem;
  padding: 0.88rem 0.92rem;
  border-radius: 20px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
}

.detail-atelier-image-memory-card span,
.detail-atelier-image-memory-note span {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-l7-size);
  letter-spacing: var(--type-l7-spacing);
  text-transform: uppercase;
}

.detail-atelier-image-memory-card strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: var(--type-l5-line);
  letter-spacing: var(--type-button-tracking);
}

.detail-atelier-image-memory-card p {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.detail-atelier-image-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.92rem;
  align-items: start;
}

.detail-atelier-image-figure {
  gap: 0.88rem;
  padding: 0.92rem;
  background:
    linear-gradient(180deg, var(--warm-panel-strong), var(--surface-soft));
}

.detail-atelier-image-figure.is-cover {
  order: -1;
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1.14fr) minmax(250px, 0.86fr);
  align-items: start;
  box-shadow: 0 0 0 2px var(--accent-ring) inset;
  background:
    linear-gradient(180deg, var(--surface-card), var(--accent-panel)),
    radial-gradient(circle at top right, var(--danger-panel), transparent 28%);
}

.detail-atelier-image-figure.is-dragging {
  opacity: 0.72;
}

.detail-atelier-image-figure.is-target {
  transform: translateY(-2px);
}

.detail-atelier-image-button,
.detail-atelier-thread-image-button {
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
}

.detail-atelier-image-stage {
  gap: 0.6rem;
  align-content: start;
}

.detail-atelier-image-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.detail-atelier-image-sheet {
  gap: 0.72rem;
  align-content: start;
}

.detail-atelier-image,
.detail-atelier-thread-image {
  width: 100%;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

.detail-atelier-image {
  aspect-ratio: 4 / 3;
}

.detail-atelier-thread-image {
  aspect-ratio: 1;
}

.detail-atelier-image-empty {
  display: grid;
  place-items: center;
  min-height: 160px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  color: var(--text-soft);
}

.detail-atelier-image-caption {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.detail-atelier-image-note {
  min-height: 0;
  line-height: 1.68;
}

.detail-atelier-image-caption-copy {
  gap: 0.45rem;
}

.detail-atelier-image-caption strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.46;
  letter-spacing: -0.02em;
}

.detail-atelier-image-meta-chips {
  gap: 0.45rem;
}

.detail-atelier-image-memory-note {
  gap: 0.4rem;
  padding: 0.78rem 0.82rem;
  border-radius: 18px;
  border: 1px solid var(--warm-border-soft);
  background: var(--surface-soft);
}

.detail-atelier-image-memory-note.is-empty {
  background: var(--warm-panel);
}

.detail-atelier-image-actions {
  align-items: flex-start;
}

.detail-atelier-thread-entry {
  display: grid;
  gap: 0.66rem;
  padding: 0.82rem;
  border-color: color-mix(in srgb, var(--warm-border) 56%, var(--warm-border-soft));
}

.detail-atelier-thread-entry.is-comment {
  border-color: color-mix(in srgb, var(--accent-border) 26%, var(--warm-border-soft));
  background: color-mix(in srgb, var(--surface-card) 94%, white);
}

.detail-atelier-thread-entry.is-latest {
  border-color: color-mix(in srgb, var(--accent-border) 46%, var(--warm-border-soft));
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--surface-card) 95%, white), color-mix(in srgb, var(--warm-panel) 82%, white));
  box-shadow: 0 6px 14px color-mix(in srgb, var(--accent-shadow) 12%, transparent);
}

.detail-atelier-thread-entry.is-latest .detail-atelier-thread-message {
  color: var(--text-main);
}

.detail-atelier-thread-entry.is-comment .detail-atelier-thread-message {
  color: var(--text-main);
}

.detail-atelier-thread-entry.is-comment .detail-atelier-mobile-thread-title strong {
  color: var(--text-main);
}

.detail-atelier-thread-list {
  display: grid;
  gap: 0.7rem;
}

.detail-atelier-thread-more-card {
  margin-top: 0.2rem;
}

.detail-atelier-step-more-card {
  margin-top: 0.12rem;
}

.detail-atelier-thread-list-overflow {
  gap: 0.72rem;
}

.detail-atelier-mobile-thread-tools,
.detail-atelier-mobile-thread-more {
  display: grid;
  gap: 0.62rem;
}

.detail-atelier-mobile-thread-inline-tools {
  gap: 0.22rem;
  margin-left: auto;
  flex-wrap: nowrap;
}

.detail-atelier-mobile-thread-inline-tools .detail-atelier-text {
  min-height: 30px;
  padding: 0.24rem 0.42rem;
  border: 0;
  background: transparent;
  box-shadow: none;
  font-size: var(--type-l7-size);
}

.detail-atelier-mobile-thread-tools-summary,
.detail-atelier-mobile-thread-more-summary {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  cursor: pointer;
  list-style: none;
}

.detail-atelier-mobile-thread-tools-summary::-webkit-details-marker,
.detail-atelier-mobile-thread-more-summary::-webkit-details-marker {
  display: none;
}

.detail-atelier-mobile-thread-tools-summary span,
.detail-atelier-mobile-thread-more-summary span {
  color: var(--text-faint);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  font-weight: 600;
  line-height: var(--type-l7-line);
  letter-spacing: var(--type-l7-spacing);
  text-transform: uppercase;
}

.detail-atelier-mobile-thread-more-summary strong {
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-thread-message-mobile {
  display: -webkit-box;
  overflow: hidden;
  line-height: 1.62;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
}

.detail-atelier-reward-block {
  padding: 0.92rem 0.95rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
  background: var(--surface-soft);
}

.detail-atelier-thread-entry.is-system {
  background: color-mix(in srgb, var(--surface-soft) 92%, var(--warm-panel));
  border-color: color-mix(in srgb, var(--warm-border-soft) 72%, var(--surface-soft));
}

.detail-atelier-thread-entry.is-system .detail-atelier-mobile-thread-title strong {
  color: var(--text-muted);
}

.detail-atelier-thread-entry.is-system .detail-atelier-thread-message {
  color: var(--text-soft);
}

.detail-atelier-thread-entry.is-system .detail-atelier-reaction-row {
  opacity: 0.88;
}

.detail-atelier-thread-toolbar {
  gap: 0.72rem;
}

.detail-atelier-thread-subline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.detail-atelier-thread-subline .detail-atelier-kicker {
  margin: 0;
}

.detail-atelier-thread-meta time {
  color: color-mix(in srgb, var(--text-faint) 80%, var(--surface-soft));
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-l7-line);
  letter-spacing: var(--type-meta-spacing);
}

.detail-atelier-thread-entry .detail-atelier-kicker {
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
  color: var(--text-faint);
}

.detail-atelier-thread-tools {
  opacity: 0.82;
}

.detail-atelier-thread-tools .detail-atelier-secondary,
.detail-atelier-thread-tools .detail-atelier-text {
  min-height: 30px;
  padding: 0.24rem 0.46rem;
  border-color: color-mix(in srgb, var(--warm-border-soft) 86%, var(--surface-soft));
  background: color-mix(in srgb, var(--surface-card) 96%, var(--surface-soft));
  box-shadow: none;
  font-size: var(--type-l7-size);
  letter-spacing: var(--type-l7-spacing);
}

@keyframes detail-cta-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.detail-atelier-thread-images {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.detail-atelier-reaction-row {
  display: flex;
  gap: 0.52rem;
  align-items: center;
  justify-content: flex-start;
}

.detail-atelier-reaction-copy {
  gap: 0.36rem;
}

.detail-atelier-reaction-copy p {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-reaction-groups,
.detail-atelier-reaction-more {
  gap: 0.46rem;
}

.detail-atelier-reaction-more {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.detail-atelier-reaction-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.46rem;
}

.detail-atelier-reaction-list-selected {
  gap: 0.4rem;
}

.detail-atelier-reaction-pill {
  cursor: pointer;
  letter-spacing: 0;
}

.detail-atelier-reaction-pill.active {
  border-color: var(--accent-border);
  background: var(--accent-panel);
}

.detail-atelier-reaction-members-stack {
  display: grid;
  gap: 0.36rem;
}

.detail-atelier-reaction-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.detail-atelier-reaction-members span {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-soft);
}

.detail-atelier-reaction-list.is-extended {
  flex: 1 1 100%;
  padding-top: 0.12rem;
}

.detail-atelier-reaction-panel {
  display: grid;
  flex: 1 1 100%;
  gap: 0.56rem;
  padding-top: 0.12rem;
}

.detail-atelier-reaction-panel-section {
  display: grid;
  gap: 0.4rem;
}

.detail-atelier-reaction-panel-disclosure {
  gap: 0.42rem;
  padding-top: 0.12rem;
  border-top: 1px solid color-mix(in srgb, var(--warm-border-soft) 74%, transparent);
}

.detail-atelier-reaction-list-featured .detail-atelier-reaction-button,
.detail-atelier-reaction-list-extended .detail-atelier-reaction-button {
  min-width: 3rem;
}

.detail-atelier-reaction-toggle {
  justify-self: start;
  min-height: 34px;
  padding: 0.34rem 0.66rem;
  border-color: color-mix(in srgb, var(--warm-border-soft) 78%, var(--surface-soft));
  color: var(--text-soft);
}

.detail-atelier-reaction-summary {
  color: var(--text-faint);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-reaction-button {
  min-height: 38px;
  padding: 0.42rem 0.66rem;
  gap: 0.28rem;
  border-radius: 16px;
}

.detail-atelier-reaction-emoji {
  font-size: var(--type-l5-size);
  line-height: 1;
}

.detail-atelier-reaction-name {
  overflow: hidden;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-atelier-reaction-button.active {
  background: var(--accent-panel);
  border-color: var(--accent-border);
  box-shadow: 0 10px 20px var(--accent-shadow-soft);
}

.detail-atelier-reaction-button.is-pending {
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.detail-atelier-reaction-button:disabled {
  transform: none;
  cursor: wait;
}

.detail-atelier-reaction-count {
  min-width: 1.3rem;
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  text-align: center;
  color: var(--text-soft);
}

.detail-atelier-reaction-count.is-empty {
  opacity: 0.24;
}

.detail-atelier-reaction-count.is-loading {
  color: var(--accent-dark);
  opacity: 1;
}

.detail-atelier-reaction-sheet-layer {
  position: fixed;
  inset: 0;
  display: grid;
  align-items: end;
  padding: 1rem;
  background: color-mix(in srgb, var(--text-main) 28%, transparent);
  backdrop-filter: blur(10px);
  z-index: 110;
  animation: detail-sheet-backdrop-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.detail-atelier-reaction-sheet {
  display: grid;
  width: min(560px, 100%);
  max-height: min(76vh, 680px);
  justify-self: center;
  gap: 0.88rem;
  overflow: auto;
  padding: 0.72rem 0.9rem calc(0.92rem + env(safe-area-inset-bottom, 0px));
  border: 1px solid var(--warm-border);
  border-radius: 26px 26px 22px 22px;
  background: var(--surface-popover);
  box-shadow: var(--shadow-raised);
  animation: detail-sheet-in 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.detail-atelier-reaction-sheet-handle {
  width: 2.7rem;
  height: 0.24rem;
  justify-self: center;
  border-radius: 999px;
  background: var(--warm-border-strong);
}

.detail-atelier-reaction-sheet-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.72rem;
  align-items: start;
}

.detail-atelier-reaction-sheet-head h3,
.detail-atelier-reaction-sheet-head p,
.detail-atelier-reaction-sheet-head span,
.detail-atelier-reaction-sheet-status p {
  margin: 0;
}

.detail-atelier-reaction-sheet-head h3 {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l4-size);
  font-weight: 600;
  line-height: var(--type-l4-line);
  letter-spacing: var(--type-l4-spacing);
}

.detail-atelier-reaction-sheet-head span {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 0.24rem;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.detail-atelier-reaction-picker-close {
  min-height: 34px;
  padding: 0.42rem 0.68rem;
}

.detail-atelier-reaction-sheet-status {
  display: flex;
  flex-wrap: wrap;
  gap: 0.48rem 0.62rem;
  align-items: center;
  justify-content: space-between;
  padding: 0.58rem 0.68rem;
  border: 1px solid var(--warm-border-soft);
  border-radius: 18px;
  background: var(--warm-panel);
}

.detail-atelier-reaction-sheet-status p {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-reaction-picker,
.detail-atelier-reaction-picker-section {
  display: grid;
  gap: 0.72rem;
}

.detail-atelier-reaction-picker-section {
  padding-top: 0.78rem;
  border-top: 1px solid var(--warm-border);
}

.detail-atelier-reaction-picker-disclosure {
  gap: 0.56rem;
}

.detail-atelier-reaction-picker-disclosure-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.62rem;
  cursor: pointer;
  list-style: none;
}

.detail-atelier-reaction-picker-disclosure-summary::-webkit-details-marker {
  display: none;
}

.detail-atelier-reaction-picker-disclosure-summary strong,
.detail-atelier-reaction-picker-disclosure-summary span {
  font-family: var(--font-body);
}

.detail-atelier-reaction-picker-disclosure-summary strong {
  color: var(--text-main);
  font-size: var(--type-body-size);
  font-weight: 700;
  line-height: var(--type-body-line);
  letter-spacing: var(--type-body-spacing);
}

.detail-atelier-reaction-picker-disclosure-summary span {
  color: var(--text-faint);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.detail-atelier-reaction-picker-disclosure-summary::after {
  content: '';
  width: 0.38rem;
  height: 0.38rem;
  flex: 0 0 auto;
  border-right: 1.5px solid var(--text-soft);
  border-bottom: 1.5px solid var(--text-soft);
  transform: rotate(45deg) translateY(-1px);
  transition: transform 160ms ease;
}

.detail-atelier-reaction-picker-disclosure[open] .detail-atelier-reaction-picker-disclosure-summary::after {
  transform: rotate(225deg) translateY(-1px);
}

.detail-atelier-reaction-picker-section-head {
  display: flex;
  gap: 0.52rem;
  align-items: baseline;
  justify-content: space-between;
}

.detail-atelier-reaction-picker-section-head strong,
.detail-atelier-reaction-picker-section-head span {
  font-family: var(--font-body);
}

.detail-atelier-reaction-picker-section-head strong {
  color: var(--text-main);
  font-size: var(--type-body-size);
  font-weight: 700;
  line-height: var(--type-body-line);
  letter-spacing: var(--type-body-spacing);
}

.detail-atelier-reaction-picker-section-head span {
  color: var(--text-faint);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.detail-atelier-reaction-picker-grid.detail-atelier-reaction-list.is-extended {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.46rem;
  padding: 0;
}

.detail-atelier-reaction-picker-grid.is-compact {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.detail-atelier-reaction-picker-grid .detail-atelier-reaction-button {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-width: 0;
  min-height: 48px;
  justify-items: start;
  padding: 0.54rem 0.62rem;
  border-radius: 18px;
}

.detail-atelier-reaction-picker-grid.is-compact .detail-atelier-reaction-button {
  grid-template-columns: 1fr;
  justify-items: center;
  gap: 0.2rem;
  min-height: 52px;
  padding: 0.46rem 0.28rem;
}

.detail-atelier-reaction-picker-grid .detail-atelier-reaction-button:active {
  transform: translateY(1px) scale(0.985);
}

@keyframes detail-sheet-backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes detail-sheet-in {
  from {
    opacity: 0;
    transform: translateY(22px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.detail-atelier-choice-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-atelier-choice-grid-reward {
  gap: 0.72rem;
}

.detail-atelier-choice-card {
  text-align: left;
}

.detail-atelier-reward-mode-row,
.detail-atelier-dialog-actions {
  justify-content: flex-start;
}

.detail-atelier-choice-card.active,
.detail-atelier-secondary.active {
  background: var(--accent-panel);
  border-color: var(--accent-border);
}

.detail-atelier-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text-main) 34%, transparent);
  backdrop-filter: blur(12px);
  z-index: 90;
}

.detail-atelier-dialog,
.detail-atelier-lightbox {
  width: min(840px, 100%);
  max-height: calc(100vh - 3rem);
  overflow: auto;
  padding: 1.2rem;
  gap: 1rem;
}

.detail-atelier-lightbox-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
}

.detail-atelier-lightbox-actions {
  display: grid;
  grid-template-columns: max-content max-content;
  gap: 0.52rem;
  align-items: flex-start;
  justify-content: space-between;
}

.detail-atelier-lightbox-nav-actions,
.detail-atelier-lightbox-manage-actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.52rem;
  align-items: flex-start;
}

.detail-atelier-lightbox-manage-actions {
  justify-self: end;
  margin-left: 0;
  justify-content: flex-end;
}

.detail-atelier-lightbox-actions .detail-atelier-secondary,
.detail-atelier-lightbox-actions .detail-atelier-text,
.detail-atelier-lightbox-actions .upload-trigger {
  display: inline-flex;
  flex: 0 0 auto;
  width: max-content;
  min-height: 36px;
  height: auto;
  padding: 0.46rem 0.72rem;
}

.detail-atelier-lightbox-image {
  width: 100%;
  max-height: 68vh;
  object-fit: contain;
  border-radius: 22px;
  background: var(--surface-soft);
}

.detail-atelier-feedback {
  margin: 0;
  padding: 0.68rem 0.78rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-feedback.success {
  color: var(--success);
  border-color: var(--success-border);
  background: var(--success-panel);
}

.detail-atelier-feedback.danger {
  color: var(--danger);
  border-color: var(--danger-border);
  background: var(--danger-panel);
}

.detail-atelier-step-feedback {
  grid-column: 2 / -1;
  padding: 0.48rem 0.62rem;
  border-radius: 12px;
  font-size: var(--type-l7-size);
  line-height: 1.35;
  letter-spacing: var(--type-l7-spacing);
}

.detail-atelier-progress-quick-action .detail-atelier-step-feedback {
  grid-column: 1 / -1;
}

@media (max-width: 1080px) {
  .detail-atelier-hero,
  .detail-atelier-overview-grid,
  .detail-atelier-journal-grid,
  .detail-atelier-summary-grid,
  .detail-atelier-choice-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .detail-atelier-page {
    padding-bottom: calc(3rem + env(safe-area-inset-bottom, 0px));
  }

  .detail-atelier-cta-dock {
    bottom: calc(5.7rem + env(safe-area-inset-bottom, 0px));
  }

  .detail-atelier-desktop-only {
    display: none !important;
  }

  .detail-atelier-mobile-only {
    display: grid;
  }

  .detail-atelier-hero-top,
  .detail-atelier-marquee,
  .detail-atelier-section-head,
  .detail-atelier-thread-meta,
  .detail-atelier-image-toolbar,
  .detail-atelier-step-card,
  .detail-atelier-lightbox-stage {
    grid-template-columns: 1fr;
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-atelier-story-card h1 {
    font-size: clamp(1.38rem, 1.12rem + 1.1vw, 1.64rem);
    max-width: none;
  }

  .detail-atelier-meta-grid {
    grid-template-columns: 1fr;
  }

  .detail-atelier-lead {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .detail-atelier-mobile-glance {
    grid-template-columns: minmax(0, 1fr);
    width: min(100%, 355px);
    gap: 0.48rem;
    padding: 0.62rem;
    border-radius: 20px;
  }

  .detail-atelier-mobile-glance-copy {
    gap: 0.34rem;
  }

  .detail-atelier-hero-summary-grid {
    grid-template-columns: 1fr;
  }

  .detail-atelier-mobile-progress-glance {
    grid-template-columns: 1fr;
  }

  .detail-atelier-progress-anchor {
    scroll-margin-top: 2rem;
  }

  .detail-atelier-progress-anchor .detail-atelier-meter-card,
  .detail-atelier-progress-anchor .detail-atelier-mobile-step-focus {
    border-color: color-mix(in srgb, var(--accent-border) 62%, var(--warm-border-soft));
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--accent-panel) 78%, white), color-mix(in srgb, var(--surface-soft) 76%, white));
    box-shadow: 0 6px 14px color-mix(in srgb, var(--accent-shadow) 12%, transparent);
  }

  .detail-atelier-progress-anchor .detail-atelier-meter-head strong,
  .detail-atelier-progress-anchor .detail-atelier-mobile-step-focus-status,
  .detail-atelier-progress-anchor .detail-atelier-mobile-step-focus-title {
    color: var(--text-main);
    font-weight: 600;
  }

  .detail-atelier-progress-anchor .detail-atelier-meter-head span,
  .detail-atelier-progress-anchor .detail-atelier-mobile-step-focus-note {
    color: var(--text-soft);
  }

  .detail-atelier-mobile-step-focus {
    padding: 0.56rem 0.6rem;
  }

  .detail-atelier-progress-anchor .detail-atelier-progress-quick-action {
    gap: 0.34rem;
    padding: 0.5rem 0.56rem;
    border-radius: 12px;
    border-color: color-mix(in srgb, var(--warm-border-soft) 72%, transparent);
    background: color-mix(in srgb, var(--surface-soft) 88%, transparent);
    opacity: 0.78;
  }

  .detail-atelier-progress-anchor .detail-atelier-progress-quick-copy {
    gap: 0.1rem;
  }

  .detail-atelier-progress-anchor .detail-atelier-progress-quick-copy strong {
    font-size: 0.74rem;
    line-height: 1.18;
    color: var(--text-soft);
    font-weight: 500;
  }

  .detail-atelier-progress-anchor .detail-atelier-progress-quick-copy p {
    font-size: 0.66rem;
    line-height: 1.14;
    color: var(--text-faint);
  }

  .detail-atelier-progress-anchor .detail-atelier-progress-primary {
    min-width: 0;
    min-height: 28px;
    padding: 0.28rem 0.48rem;
    font-size: 0.72rem;
    line-height: 1;
    border-radius: 999px;
    box-shadow: none;
  }

  .detail-atelier-progress-anchor .detail-atelier-step-more-card {
    margin-top: 0;
    padding: 0.3rem 0.46rem;
    border-radius: 10px;
    background: color-mix(in srgb, var(--surface-soft) 82%, transparent);
    opacity: 0.72;
  }

  .detail-atelier-progress-anchor .detail-atelier-step-more-card:not([open]) {
    display: flex;
    align-items: center;
    min-height: 2rem;
    padding: 0 0.46rem;
  }

  .detail-atelier-progress-anchor .detail-atelier-step-more-card .detail-atelier-mobile-more-summary {
    gap: 0.18rem;
    align-items: center;
    min-height: 1rem;
    margin: 0;
    padding: 0;
  }

  .detail-atelier-progress-anchor .detail-atelier-step-more-card:not([open]) .detail-atelier-mobile-more-summary {
    width: 100%;
    min-height: 0;
  }

  .detail-atelier-progress-anchor .detail-atelier-step-more-card .detail-atelier-mobile-more-summary::after {
    width: 0.34rem;
    height: 0.34rem;
    border-right-width: 1.3px;
    border-bottom-width: 1.3px;
  }

  .detail-atelier-progress-anchor .detail-atelier-step-more-card .detail-atelier-mobile-more-summary span,
  .detail-atelier-progress-anchor .detail-atelier-step-more-card .detail-atelier-mobile-more-summary strong {
    display: inline-flex;
    align-items: center;
    font-size: 0.72rem;
    line-height: 1.18;
    color: var(--text-faint);
    font-weight: 500;
  }

  .detail-atelier-progress-anchor .detail-atelier-progress-completion-row,
  .detail-atelier-progress-anchor .detail-atelier-progress-inline-actions {
    padding-top: 0;
    opacity: 0.72;
  }

  .detail-atelier-progress-anchor .detail-atelier-progress-completion-row .detail-atelier-secondary,
  .detail-atelier-progress-anchor .detail-atelier-progress-inline-actions .detail-atelier-secondary,
  .detail-atelier-progress-anchor .detail-atelier-progress-inline-actions .detail-atelier-text {
    min-height: 28px;
    padding: 0.24rem 0.46rem;
    font-size: 0.66rem;
    line-height: 1;
    box-shadow: none;
  }

  .detail-atelier-mobile-info-card .detail-atelier-mobile-meta-grid {
    grid-template-columns: 1fr;
  }

  .detail-atelier-mobile-more {
    padding: 0.84rem 0.88rem;
    border-radius: 20px;
  }

  .detail-atelier-mobile-more-summary {
    align-items: center;
  }

  .detail-atelier-thread-card .detail-atelier-thread-more-card:not([open]) {
    display: flex;
    align-items: center;
    min-height: 2.1rem;
    padding: 0 0.62rem;
  }

  .detail-atelier-thread-card .detail-atelier-thread-more-card:not([open]) .detail-atelier-mobile-more-summary {
    width: 100%;
    min-height: 0;
    margin: 0;
    padding: 0;
  }

  .detail-atelier-danger-row {
    align-items: flex-start;
  }

  .detail-atelier-danger-summary {
    align-items: center;
  }

  .detail-atelier-danger-details:not([open]) {
    display: flex;
    align-items: center;
    min-height: 2.1rem;
    padding: 0 0.72rem;
  }

  .detail-atelier-danger-details:not([open]) .detail-atelier-danger-summary {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  .detail-atelier-danger-details:not([open]) .detail-atelier-danger-summary span,
  .detail-atelier-danger-details:not([open]) .detail-atelier-danger-summary strong {
    display: inline-flex;
    align-items: center;
    line-height: 1.18;
  }

  .detail-atelier-danger-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .detail-atelier-danger-details[open] {
    gap: 0.38rem;
    padding: 0.58rem 0.62rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-danger-summary {
    padding-bottom: 0.24rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-tools-section {
    gap: 0.42rem;
    padding-top: 0.48rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-inline-form-compact {
    gap: 0.4rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-inline-form-compact label {
    gap: 0.18rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-inline-form-compact input {
    min-height: 34px;
    padding: 0.32rem 0.56rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-tools-actions .detail-atelier-secondary {
    min-height: 32px;
    padding: 0.3rem 0.56rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-step-manage-list {
    gap: 0.34rem;
    max-height: 8.4rem;
    overflow-y: auto;
    padding-right: 0.14rem;
  }

  .detail-atelier-danger-details[open] .detail-atelier-step-manage-row {
    gap: 0.34rem;
    padding: 0.42rem 0.52rem;
    border-radius: 12px;
  }

  .detail-atelier-danger-details[open] .detail-atelier-step-manage-row span {
    font-size: 0.8rem;
    line-height: 1.24;
  }

  .detail-atelier-danger-details[open] .detail-atelier-step-manage-row .detail-atelier-text {
    min-height: 28px;
    padding: 0.22rem 0.44rem;
    font-size: 0.68rem;
  }

  .detail-atelier-overlay {
    padding: 0.75rem;
    align-items: end;
  }

  .detail-atelier-dialog-actions {
    padding-bottom: calc(0.35rem + env(safe-area-inset-bottom, 0px));
  }

  .detail-atelier-story-card,
  .detail-atelier-compose-card,
  .detail-atelier-cover-card,
  .detail-atelier-overview-card,
  .detail-atelier-thread-card,
  .detail-atelier-image-card,
  .detail-atelier-empty-card {
    padding: 0.78rem;
  }

  .detail-atelier-story-card {
    padding: 1.08rem 1rem 1.12rem;
    gap: 1.02rem;
  }

  .detail-atelier-story-header {
    align-items: center;
    gap: 0.72rem;
  }

  .detail-atelier-story-owner {
    font-size: 0.72rem;
    opacity: 0.78;
  }

  .detail-atelier-story-state-chip-inline {
    min-height: 24px;
    padding: 0.16rem 0.54rem;
  }

  .detail-atelier-story-copy {
    gap: 0.56rem;
  }

  .detail-atelier-story-copy h1 {
    font-size: clamp(1.46rem, 1.18rem + 1.3vw, 1.78rem);
    line-height: 1.16;
    letter-spacing: -0.018em;
  }

  .detail-atelier-story-copy .detail-atelier-lead {
    color: var(--text-muted);
    font-size: 0.84rem;
    line-height: 1.52;
    max-width: 30ch;
  }

  .detail-atelier-story-focus {
    gap: 0.4rem;
    padding: 0.76rem 0.78rem;
    border-radius: 14px;
    border-color: color-mix(in srgb, var(--accent-border) 48%, var(--warm-border-soft));
    background: color-mix(in srgb, var(--surface-card) 90%, white);
  }

  .detail-atelier-story-focus strong {
    font-size: clamp(1.06rem, 0.96rem + 0.55vw, 1.2rem);
    line-height: 1.18;
  }

  .detail-atelier-story-focus p {
    color: var(--text-faint);
    line-height: 1.42;
  }

  .detail-atelier-story-meta-note {
    font-size: 0.7rem;
    line-height: 1.52;
    opacity: 0.76;
  }

  .detail-atelier-mobile-glance {
    padding: 0.76rem;
    border-radius: 22px;
  }

  .detail-atelier-compose-card {
    gap: 0.56rem;
    padding: 0.74rem;
  }

  .detail-atelier-compose-summary-copy strong {
    font-size: var(--type-l6-size);
    line-height: var(--type-l6-line);
  }

  .detail-atelier-compose-summary-copy span {
    font-size: var(--type-l7-size);
    line-height: 1.35;
    letter-spacing: var(--type-l7-spacing);
  }

  .detail-atelier-image-toolbar {
    flex-direction: row;
    justify-content: flex-start;
  }

  .detail-atelier-thread-tools,
  .detail-atelier-image-toolbar-actions {
    width: 100%;
  }

  .detail-atelier-image-intro {
    padding: 0.82rem;
    border-radius: 20px;
    gap: 0.75rem;
  }

  .detail-atelier-cover-head {
    align-items: flex-start;
  }

  .detail-atelier-member-grid,
  .detail-atelier-image-grid {
    grid-template-columns: 1fr;
  }

  .detail-atelier-thread-images {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-atelier-image-memory-strip {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }

  .detail-atelier-image-memory-card {
    padding: 0.8rem 0.82rem;
    border-radius: 18px;
  }

  .detail-atelier-thread-tools .detail-atelier-secondary,
  .detail-atelier-thread-tools .detail-atelier-text,
  .detail-atelier-image-toolbar-actions .detail-atelier-secondary,
  .detail-atelier-image-toolbar-actions .detail-atelier-text {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 0;
  }

  .detail-atelier-reward-dialog,
  .detail-atelier-preview-lightbox {
    width: 100%;
    max-height: calc(100vh - 1rem);
    padding: 0.95rem;
    gap: 0.82rem;
  }

  .detail-atelier-dialog-head {
    gap: 0.5rem;
  }

  .detail-atelier-dialog-head .detail-atelier-secondary {
    min-height: 40px;
    padding: 0.48rem 0.78rem;
  }

  .detail-atelier-balance-grid-compact,
  .detail-atelier-choice-grid-reward {
    gap: 0.55rem;
  }

  .detail-atelier-balance-grid-compact .detail-atelier-balance-card,
  .detail-atelier-choice-grid-reward .detail-atelier-choice-card,
  .detail-atelier-reward-dialog .detail-atelier-star-card,
  .detail-atelier-meter-card,
  .detail-atelier-member-card,
  .detail-atelier-reward-block {
    padding: 0.8rem 0.82rem;
    border-radius: 18px;
  }

  .detail-atelier-choice-grid-reward .detail-atelier-choice-card p {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.58;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .detail-atelier-choice-grid-reward .detail-atelier-chip-row {
    gap: 0.38rem;
  }

  .detail-atelier-reward-mode-row .detail-atelier-secondary,
  .detail-atelier-dialog-actions .detail-atelier-secondary,
  .detail-atelier-dialog-actions .detail-atelier-primary {
    flex: 1 1 calc(50% - 0.25rem);
    min-height: 42px;
    padding: 0.5rem 0.78rem;
  }

  .detail-atelier-compose-submit-buttons,
  .detail-atelier-compose-upload-row {
    width: 100%;
  }

  .detail-atelier-mobile-upload-panel {
    gap: 0.44rem;
    padding-top: 0.48rem;
  }

  .detail-atelier-mobile-upload-panel .detail-atelier-compose-upload-row {
    width: auto;
  }

  .detail-atelier-comment-form .detail-atelier-compose-upload-row .upload-trigger {
    display: inline-flex;
    flex: 0 1 auto;
    width: auto;
    min-height: 36px;
    padding: 0.42rem 0.74rem;
    font-size: var(--type-l6-size);
    line-height: var(--type-l6-line);
  }

  .detail-atelier-chip-row.compact,
  .detail-atelier-reaction-list {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    grid-template-columns: none;
    overflow-x: auto;
    max-width: 100%;
    padding-bottom: 0.08rem;
    scrollbar-width: none;
  }

  .detail-atelier-chip-row.compact::-webkit-scrollbar,
  .detail-atelier-reaction-list::-webkit-scrollbar {
    display: none;
  }

  .detail-atelier-chip-row.compact .detail-atelier-chip,
  .detail-atelier-chip-row.compact .chip-button {
    max-width: 16rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .detail-atelier-compose-submit-buttons .detail-atelier-primary,
  .detail-atelier-compose-submit-buttons .detail-atelier-secondary,
  .detail-atelier-compose-upload-row .detail-atelier-secondary,
  .detail-atelier-compose-upload-row .upload-trigger {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 0;
  }

  .detail-atelier-mobile-upload-panel .detail-atelier-compose-upload-row .detail-atelier-secondary,
  .detail-atelier-mobile-upload-panel .detail-atelier-compose-upload-row .upload-trigger {
    flex: 0 1 auto;
  }

  .detail-atelier-thread-list {
    gap: 0.54rem;
  }

  .detail-atelier-mobile-thread-tools-summary,
  .detail-atelier-mobile-thread-more-summary {
    min-height: 28px;
  }

  .detail-atelier-thread-tools {
    width: 100%;
  }

  .detail-atelier-thread-tools .detail-atelier-secondary,
  .detail-atelier-thread-tools .detail-atelier-text {
    flex: 1 1 calc(50% - 0.25rem);
    min-width: 0;
  }

  .detail-atelier-comment-form.is-front {
    gap: 0.22rem;
  }

  .detail-atelier-comment-form.is-front > * + * {
    padding-top: 0.48rem;
  }

  .detail-atelier-progress-stack,
  .detail-atelier-step-list,
  .detail-atelier-inline-form,
  .detail-atelier-progress-quick-action {
    gap: 0.68rem;
  }

  .detail-atelier-compose-presence,
  .detail-atelier-compose-submit-row {
    grid-template-columns: 1fr;
  }

  .detail-atelier-compose-submit-row {
    gap: 0.42rem;
  }

  .detail-atelier-compose-card .detail-atelier-primary,
  .detail-atelier-compose-card .detail-atelier-secondary,
  .detail-atelier-compose-card .upload-trigger {
    min-height: 42px;
    padding: 0.5rem 0.78rem;
  }

  .detail-atelier-compose-card textarea {
    min-height: 92px;
    padding: 0.72rem 0.82rem;
  }

  .detail-atelier-step-card {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.5rem 0.62rem;
    align-items: center;
  }

  .detail-atelier-step-feedback {
    grid-column: 1 / -1;
    padding: 0.42rem 0.54rem;
    border-radius: 11px;
  }

  .detail-atelier-step-toggle {
    min-width: 5rem;
    min-height: 34px;
    padding: 0.42rem 0.68rem;
  }

  .detail-atelier-step-remove {
    grid-column: 2;
    justify-self: start;
    min-height: auto;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .detail-atelier-inline-form > .detail-atelier-primary,
  .detail-atelier-inline-form > .detail-atelier-secondary {
    justify-self: start;
    min-height: 38px;
  }

  .detail-atelier-progress-quick-action {
    grid-template-columns: 1fr;
  }

  .detail-atelier-progress-primary {
    width: 100%;
    min-width: 0;
  }

  .detail-atelier-progress-quick-action .detail-atelier-progress-primary,
  .detail-atelier-progress-completion-row {
    display: none;
  }

  .detail-atelier-cta-dock {
    display: block;
  }

  .detail-atelier-cta-dock-inner {
    padding: 0;
    gap: 0.24rem;
  }

  .detail-atelier-cta-dock-primary,
  .detail-atelier-cta-dock-secondary {
    padding: 0.28rem 0.58rem;
  }

  .detail-atelier-cta-dock-primary {
    min-height: 33px;
    width: min(82%, 15.8rem);
    justify-self: center;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.012em;
    color: color-mix(in srgb, var(--text-main) 94%, black);
    border-width: 1px;
    box-shadow:
      0 6px 14px color-mix(in srgb, var(--accent-shadow) 16%, transparent),
      inset 0 1px 0 color-mix(in srgb, white 84%, transparent);
    -webkit-backdrop-filter: blur(12px) saturate(138%);
    backdrop-filter: blur(12px) saturate(138%);
  }

  .detail-atelier-cta-dock-secondary {
    min-height: 31px;
  }

  .detail-atelier-cta-dock-note {
    display: none;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .detail-atelier-cta-dock-note.is-success,
  .detail-atelier-cta-dock-note.is-danger {
    display: -webkit-box;
  }

  .detail-atelier-thread-entry,
  .detail-atelier-image-figure {
    gap: 0.56rem;
    padding: 0.7rem;
    border-radius: 16px;
  }

  .detail-atelier-thread-entry {
    gap: 0.36rem;
    padding: 0.62rem 0.66rem;
    border-radius: 14px;
  }

  .detail-atelier-thread-toolbar {
    gap: 0.32rem;
  }

  .detail-atelier-thread-entry .detail-atelier-thread-meta {
    display: block;
    width: 100%;
  }

  .detail-atelier-mobile-thread-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.42rem;
    align-items: start;
  }

  .detail-atelier-mobile-thread-title {
    display: grid;
    min-width: 0;
    gap: 0.06rem;
  }

  .detail-atelier-mobile-thread-title .detail-atelier-kicker {
    line-height: 1.1;
    color: var(--text-faint);
    font-size: 0.68rem;
  }

  .detail-atelier-thread-subline {
    gap: 0.26rem;
    opacity: 0.78;
  }

  .detail-atelier-mobile-thread-title strong {
    display: -webkit-box;
    overflow: hidden;
    color: var(--text-faint);
    font-family: var(--font-heading);
    font-size: 0.68rem;
    font-weight: 400;
    line-height: 1.12;
    letter-spacing: 0;
    opacity: 0.74;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }

  .detail-atelier-thread-entry.is-latest .detail-atelier-mobile-thread-title strong {
    opacity: 0.86;
  }

  .detail-atelier-mobile-thread-title time {
    color: var(--text-faint);
    font-size: 0.68rem;
    line-height: 1.15;
    letter-spacing: var(--type-l7-spacing);
  }

  .detail-atelier-mobile-thread-corner-chips {
    display: flex;
    max-width: 11rem;
    justify-content: flex-end;
    gap: 0.22rem;
    overflow: visible;
    padding-bottom: 0;
  }

  .detail-atelier-mobile-thread-corner-chips .detail-atelier-chip {
    min-height: 22px;
    max-width: 5.6rem;
    padding: 0.16rem 0.44rem;
    border: 1px solid color-mix(in srgb, var(--warm-border-soft) 76%, var(--surface-soft));
    background: color-mix(in srgb, var(--surface-card) 96%, var(--warm-panel));
    color: var(--text-soft);
    font-size: 0.68rem;
    line-height: 1;
    letter-spacing: 0;
  }

  .detail-atelier-thread-entry.is-system .detail-atelier-mobile-thread-corner-chips .detail-atelier-chip:last-child {
    border-color: color-mix(in srgb, var(--accent-border) 48%, var(--warm-border-soft));
    background: color-mix(in srgb, var(--accent-panel) 72%, white);
    color: var(--text-main);
    font-weight: 600;
  }

  .detail-atelier-thread-message-mobile {
    color: var(--text-main);
    font-size: 1.02rem;
    font-weight: 500;
    line-height: 1.42;
    -webkit-line-clamp: 4;
    line-clamp: 4;
  }

  .detail-atelier-thread-entry.is-system .detail-atelier-thread-message-mobile {
    color: var(--text-main);
  }

  .detail-atelier-mobile-thread-more {
    gap: 0.42rem;
  }

  .detail-atelier-mobile-thread-more-summary {
    padding-top: 0.1rem;
  }

  .detail-atelier-mobile-reaction-rail {
    display: flex;
    flex-wrap: nowrap;
    gap: 0.24rem;
    align-items: center;
    min-height: 22px;
    opacity: 0.68;
  }

  .detail-atelier-mobile-reaction-trigger.detail-atelier-reaction-toggle {
    width: auto;
    min-width: 0;
    min-height: 20px;
    justify-content: center;
    gap: 0;
    padding: 0.12rem 0.32rem;
    border-radius: 999px;
    border-color: color-mix(in srgb, var(--warm-border-soft) 70%, var(--surface-soft));
    background: color-mix(in srgb, var(--surface-card) 94%, var(--warm-panel));
    color: var(--text-faint);
    font-size: 0.62rem;
    letter-spacing: 0;
    line-height: 1;
  }

  .detail-atelier-mobile-reaction-pills.detail-atelier-reaction-list {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    grid-template-columns: none;
    gap: 0.28rem;
    overflow-x: auto;
    max-width: none;
    flex: 1 1 auto;
    padding-bottom: 0;
    scrollbar-width: none;
  }

  .detail-atelier-mobile-reaction-pills.detail-atelier-reaction-list::-webkit-scrollbar {
    display: none;
  }

  .detail-atelier-mobile-reaction-pills .detail-atelier-chip {
    min-height: 20px;
    padding: 0.14rem 0.34rem;
    border-radius: 999px;
    font-size: 0.62rem;
    line-height: 1;
    letter-spacing: 0;
    color: var(--text-faint);
  }

  .detail-atelier-mobile-reaction-members-stack {
    padding-top: 0.1rem;
  }

  .detail-atelier-mobile-reaction-rail .detail-atelier-reaction-summary {
    display: none;
  }

  .detail-atelier-mobile-thread-inline-tools {
    flex: 0 0 auto;
    opacity: 0.72;
  }

  .detail-atelier-image-figure.is-cover {
    grid-column: auto;
    grid-template-columns: 1fr;
  }

  .detail-atelier-inline-buttons,
  .detail-atelier-image-actions,
  .detail-atelier-reaction-row {
    gap: 0.45rem;
  }

  .detail-atelier-reaction-groups,
  .detail-atelier-reaction-more,
  .detail-atelier-reaction-list {
    gap: 0.42rem;
  }

  .detail-atelier-reaction-toggle {
    min-height: 38px;
    padding: 0.44rem 0.72rem;
  }

  .detail-atelier-reaction-row {
    align-items: flex-start;
  }

  .detail-atelier-reaction-more {
    width: 100%;
  }

  .detail-atelier-reaction-list.is-extended {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    grid-template-columns: none;
    overflow-x: auto;
    max-width: 100%;
    padding-bottom: 0.08rem;
    scrollbar-width: none;
  }

  .detail-atelier-reaction-list.is-extended::-webkit-scrollbar {
    display: none;
  }

  .detail-atelier-reaction-sheet-layer {
    padding: 0.56rem;
  }

  .detail-atelier-reaction-sheet {
    width: 100%;
    max-height: min(78vh, 640px);
    gap: 0.76rem;
    padding: 0.62rem 0.68rem calc(0.78rem + env(safe-area-inset-bottom, 0px));
    border-radius: 24px 24px 18px 18px;
  }

  .detail-atelier-reaction-sheet-head {
    gap: 0.48rem;
  }

  .detail-atelier-reaction-sheet-head h3 {
    font-size: var(--type-l5-size);
    line-height: var(--type-l5-line);
    letter-spacing: var(--type-l5-spacing);
  }

  .detail-atelier-reaction-sheet-status {
    gap: 0.42rem;
    padding: 0.5rem 0.56rem;
  }

  .detail-atelier-reaction-picker,
  .detail-atelier-reaction-picker-section {
    gap: 0.58rem;
  }

  .detail-atelier-reaction-picker-section {
    padding-top: 0.64rem;
  }

  .detail-atelier-reaction-sheet .detail-atelier-reaction-list.is-extended,
  .detail-atelier-reaction-picker-grid.detail-atelier-reaction-list.is-extended {
    display: grid;
    grid-auto-flow: row;
    grid-auto-columns: auto;
    overflow: visible;
    max-width: none;
    scrollbar-width: auto;
  }

  .detail-atelier-reaction-picker-grid.detail-atelier-reaction-list.is-extended {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.38rem;
  }

  .detail-atelier-reaction-picker-grid.is-compact.detail-atelier-reaction-list.is-extended {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .detail-atelier-reaction-picker-grid .detail-atelier-reaction-button {
    min-height: 46px;
    padding: 0.48rem 0.46rem;
  }

  .detail-atelier-reaction-picker-grid.is-compact .detail-atelier-reaction-button {
    min-height: 50px;
    padding: 0.42rem 0.22rem;
  }

  .detail-atelier-image-actions .detail-atelier-secondary,
  .detail-atelier-image-actions .detail-atelier-text {
    min-height: 34px;
    padding: 0.42rem 0.68rem;
  }

  .detail-atelier-chip,
  .detail-atelier-badge {
    min-height: 34px;
    padding: 0.42rem 0.74rem;
  }

  .detail-atelier-chip-row-primary .detail-atelier-chip {
    min-height: 30px;
    padding: 0.34rem 0.62rem;
    font-size: var(--type-l6-size);
    line-height: var(--type-l6-line);
  }

  .detail-atelier-reaction-button {
    min-height: 38px;
    padding: 0.42rem 0.68rem;
  }

  .detail-atelier-lightbox-stage {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
    align-items: stretch;
  }

  .detail-atelier-lightbox-actions {
    grid-column: 1 / -1;
    width: 100%;
  }

  .detail-atelier-lightbox-image {
    grid-column: 1 / -1;
    max-height: 56vh;
    border-radius: 18px;
  }

  .detail-atelier-lightbox-stage > .detail-atelier-secondary {
    width: 100%;
    min-height: 36px;
    padding: 0.46rem 0.72rem;
  }

  .detail-atelier-image-grid {
    grid-template-columns: 1fr;
    gap: 0.72rem;
  }

  .detail-atelier-thread-images {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.48rem;
  }

  .detail-atelier-image-empty {
    min-height: 120px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-atelier-reaction-sheet-layer,
  .detail-atelier-reaction-sheet {
    animation-duration: 0.01ms;
  }

  .detail-atelier-reaction-picker-grid .detail-atelier-reaction-button:active {
    transform: none;
  }
}
</style>
