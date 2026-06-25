<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { type WishImage } from '../stores/wishes'
import { formatBeijingDateTime } from '../utils/datetime'
import { useWishDetailPageState } from '../composables/useWishDetailPageState'

const priorityLabels = {
  high: '很想靠近',
  medium: '慢慢靠近',
  low: '先放在这里',
} as const

const MOBILE_THREAD_PREVIEW_COUNT = 3

const {
  EXTENDED_THREAD_REACTION_OPTIONS,
  FEATURED_THREAD_REACTION_OPTIONS,
  THREAD_REACTION_OPTIONS,
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
  currentMemberStarCoins,
  deleteImage,
  deleteThreadComment,
  deleteWish,
  deletingThreadId,
  draftMessage,
  dueDateLabel,
  editingThreadMessage,
  formatFileSize,
  getClaimToneLabel,
  getCompletionStarCoinLabel,
  getCommentImageFileKey,
  getCountStarCoinLabel,
  getMemberName,
  getStepActionLabel,
  getStepStarCoinLabel,
  getStepStatusCopy,
  getThreadActorName,
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
  isUploadingImages,
  lightboxImages,
  openImagePreview,
  openThreadReactionPicker,
  previewImage,
  previewImageIndex,
  progressLead,
  progressSnapshot,
  removeCommentImageFile,
  removeWishStep,
  retryComment,
  rewardFeedback,
  rewardFeedbackTone,
  saveCountProgress,
  saveThreadComment,
  shouldRecordCountProgressLog,
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
    priorityLabels[selectedWish.value.priority],
    selectedWish.value.status === 'done' ? '已完成' : '进行中',
    dueDateLabel.value,
  ]
})

const visibleImages = computed(() => {
  const firstImage = selectedWish.value?.images[0]
  return firstImage ? [firstImage] : []
})
const coverImageEntry = computed(() => visibleImages.value.find((image) => isCoverImage(image.id)) ?? visibleImages.value[0] ?? null)
const visibleThreads = computed(() => wishJournalEntries.value)
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
const detailImageCount = computed(() => detailPreviewImages.value.length)
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
</script>

<template>
  <section class="detail-atelier-page">
    <template v-if="selectedWish">
      <section class="detail-atelier-hero">
        <article class="page-card detail-atelier-story-card">
          <div class="detail-atelier-hero-top">
            <p class="detail-atelier-kicker">这一页愿望</p>
            <RouterLink class="detail-atelier-mini-link" :to="{ name: 'list' }">回清单继续推进</RouterLink>
          </div>

          <div class="detail-atelier-story-copy">
            <h1>{{ selectedWish.title }}</h1>
            <p class="detail-atelier-lead">
              {{ selectedWish.note || '先留一个短标题也没关系，后面还可以在这里补充动机、背景和下一步。' }}
            </p>
          </div>

          <div class="detail-atelier-chip-row detail-atelier-chip-row-primary">
            <span v-for="chip in detailTags.slice(0, 3)" :key="chip" class="detail-atelier-chip">{{ chip }}</span>
          </div>

          <div class="detail-atelier-hero-summary-grid">
            <article class="detail-atelier-summary-card detail-atelier-summary-card-featured">
              <span>手账记录</span>
              <strong>{{ wishJournalEntries.length }} 条</strong>
              <p>推进、留言和完成都会留在这里</p>
            </article>
            <article class="detail-atelier-summary-card">
              <span>星星币</span>
              <strong>{{ currentMemberStarCoins }} 枚</strong>
              <p>攒着，去空间页接住大奖励</p>
            </article>
          </div>

          <div class="detail-atelier-mobile-glance detail-atelier-mobile-only">
            <div class="detail-atelier-cover-slot">
              <button
                v-if="coverImageUrl && coverImageEntry"
                class="detail-atelier-mobile-cover-button"
                type="button"
                @click="openImagePreview(detailPreviewImages, coverImageEntry.id)"
              >
                <img class="detail-atelier-mobile-cover-image" :src="coverImageUrl" :alt="`${selectedWish.title} 首图`" />
              </button>
              <label v-else-if="wishStore.isUsingCloudWishes" class="detail-atelier-mobile-cover-empty detail-atelier-cover-upload">
                <input
                  class="visually-hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  @change="handleImageSelection"
                />
                <strong>{{ isUploadingImages ? '上传中...' : '添加首图' }}</strong>
              </label>
              <div v-else class="detail-atelier-mobile-cover-empty detail-atelier-empty-block">
                <strong>还没有封面</strong>
              </div>
            </div>
          </div>

          <div class="detail-atelier-meta-grid detail-atelier-desktop-only">
            <div class="detail-atelier-meta-item">
              <span class="detail-atelier-meta-label">写下的人</span>
              <strong>{{ getMemberName(selectedWish.ownerId) }}</strong>
            </div>
            <div v-if="detailTags.length > 3" class="detail-atelier-meta-item">
              <span class="detail-atelier-meta-label">当前标签</span>
              <strong>{{ detailTags.slice(3).join(' · ') }}</strong>
            </div>
            <div class="detail-atelier-meta-item">
              <span class="detail-atelier-meta-label">这页进展</span>
              <strong>{{ detailImageCount }} 张图 · {{ wishJournalEntries.length }} 条记录</strong>
            </div>
            <div class="detail-atelier-meta-item">
              <span class="detail-atelier-meta-label">创建时间</span>
              <strong>{{ formatBeijingDateTime(selectedWish.createdAt) }}</strong>
            </div>
          </div>

          <div class="detail-atelier-mobile-more detail-atelier-mobile-only detail-atelier-mobile-info-card">
            <div class="detail-atelier-meta-grid detail-atelier-mobile-meta-grid">
              <div class="detail-atelier-meta-item">
                <span class="detail-atelier-meta-label">写下的人</span>
                <strong>{{ getMemberName(selectedWish.ownerId) }}</strong>
              </div>
              <div v-if="detailTags.length > 3" class="detail-atelier-meta-item">
                <span class="detail-atelier-meta-label">当前标签</span>
                <strong>{{ detailTags.slice(3).join(' · ') }}</strong>
              </div>
              <div class="detail-atelier-meta-item">
                <span class="detail-atelier-meta-label">这页进展</span>
                <strong>{{ detailImageCount }} 张图 · {{ wishJournalEntries.length }} 条记录</strong>
              </div>
              <div class="detail-atelier-meta-item">
                <span class="detail-atelier-meta-label">创建时间</span>
                <strong>{{ formatBeijingDateTime(selectedWish.createdAt) }}</strong>
              </div>
            </div>
          </div>

          <p v-if="rewardFeedback && !stepRewardFeedbackTargetId && !isCountProgressFeedback" :class="['detail-atelier-feedback', rewardFeedbackTone]" role="status" aria-live="polite">{{ rewardFeedback }}</p>
        </article>

        <article class="page-card detail-atelier-cover-card detail-atelier-desktop-only">
          <button v-if="coverImageUrl && coverImageEntry" class="detail-atelier-cover-button" type="button" @click="openImagePreview(detailPreviewImages, coverImageEntry.id)">
            <img class="detail-atelier-cover-image" :src="coverImageUrl" :alt="`${selectedWish.title} 首图`" />
          </button>
          <label v-else-if="wishStore.isUsingCloudWishes" class="detail-atelier-cover-empty detail-atelier-cover-upload">
            <input
              class="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              @change="handleImageSelection"
            />
            <strong>{{ isUploadingImages ? '上传中...' : '添加首图' }}</strong>
          </label>
          <div v-else class="detail-atelier-cover-empty">
            <strong>这页还在等一张封面</strong>
          </div>

          <div class="detail-atelier-cover-head">
            <p class="detail-atelier-kicker">封面首图</p>
            <span class="detail-atelier-badge">{{ coverImageEntry ? '已经留住一张首图' : '还没有留下首图' }}</span>
          </div>
          <div class="detail-atelier-inline-buttons detail-atelier-cover-inline-actions">
            <label v-if="wishStore.isUsingCloudWishes" class="detail-atelier-secondary upload-trigger">
              <input
                class="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                @change="handleImageSelection"
              />
              {{ coverImageEntry ? '换图' : '添加首图' }}
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
          <div class="detail-atelier-section-head">
            <div class="detail-atelier-section-copy">
              <p class="detail-atelier-kicker">推进痕迹</p>
              <h2>这条愿望正走到哪里</h2>
            </div>
            <span class="detail-atelier-badge">{{ progressSnapshot?.label || '还没开始' }}</span>
          </div>

          <p class="detail-atelier-support">{{ progressLead }}</p>

          <div class="detail-atelier-meter-card">
            <div class="detail-atelier-meter-head">
              <strong>{{ progressSnapshot?.mode === 'steps' ? '步骤进度' : progressSnapshot?.mode === 'count' ? '数字进度' : '进度记录' }}</strong>
              <span>{{ progressSnapshot?.percent ?? 0 }}%</span>
            </div>
            <div class="detail-atelier-progress-track" :aria-label="`当前进度 ${progressSnapshot?.label || '未设置'}`">
              <div class="detail-atelier-progress-fill" :style="{ width: `${progressSnapshot?.percent ?? 0}%` }"></div>
            </div>
          </div>

          <div v-if="progressSnapshot?.mode === 'count'" class="detail-atelier-progress-stack">
            <div class="detail-atelier-progress-quick-action">
              <div class="detail-atelier-progress-quick-copy">
                <strong>先让它继续往前一点</strong>
                <p>{{ canProgressSelectedWish ? getCountStarCoinLabel() : '你可以评论和打气，进度由愿望归属人推进。' }}</p>
              </div>
              <button v-if="canProgressSelectedWish" class="detail-atelier-primary detail-atelier-progress-primary" type="button" @click="void adjustCountProgress(1)">
                +1{{ selectedWish.progressUnit ? ` ${selectedWish.progressUnit}` : '' }}
              </button>
              <p v-if="rewardFeedback && isCountProgressFeedback" :class="['detail-atelier-feedback', 'detail-atelier-step-feedback', 'detail-atelier-progress-feedback', rewardFeedbackTone]" role="status" aria-live="polite">{{ rewardFeedback }}</p>
            </div>
          </div>

          <div v-else-if="progressSnapshot?.mode === 'steps'" class="detail-atelier-progress-stack">
            <div v-if="selectedWish.steps.length" class="detail-atelier-step-list detail-atelier-desktop-only">
              <article v-for="step in selectedWish.steps" :key="step.id" :class="['detail-atelier-step-card', { done: step.isDone }]">
                <button v-if="canProgressSelectedWish" class="detail-atelier-secondary detail-atelier-step-toggle" type="button" @click="void toggleWishStep(step.id)">{{ getStepActionLabel(step.id, step.isDone) }}</button>
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
              <article class="detail-atelier-summary-card detail-atelier-summary-card-featured">
                <span>正在推进</span>
                <strong>{{ mobilePrimaryStep?.title || '还没有下一步' }}</strong>
                <p>{{ mobileNextPendingStep ? '先把眼前这一步走完。' : '这条步骤愿望已经全部走完。' }}</p>
              </article>
              <article class="detail-atelier-summary-card">
                <span>步骤进度</span>
                <strong>{{ mobileCompletedStepCount }} / {{ selectedWish.steps.length }}</strong>
                <p>{{ mobileCompletedStepCount === selectedWish.steps.length ? '已经全部完成' : `还剩 ${selectedWish.steps.length - mobileCompletedStepCount} 步` }}</p>
              </article>
            </div>

            <div v-else class="detail-atelier-empty-block">
              <strong>还没有拆出小步骤</strong>
              <p>可以先写下第一个很具体的小目标，例如订票、办签证、买装备。</p>
            </div>

            <div class="detail-atelier-progress-quick-action">
              <div class="detail-atelier-progress-quick-copy">
                <strong>{{ selectedWish.steps.length ? '先完成眼前这一步' : '先写下第一步' }}</strong>
                <p>{{ canProgressSelectedWish ? (selectedWish.steps.length ? '走完下一步时，星星币会自动到账。' : '有了第一步，这条愿望会更容易继续往前。') : '你可以在下面评论和打气，步骤由愿望归属人推进。' }}</p>
              </div>
              <button v-if="canProgressSelectedWish" class="detail-atelier-primary detail-atelier-progress-primary" type="button" @click="mobilePrimaryStep ? void toggleWishStep(mobilePrimaryStep.id) : undefined" :disabled="!mobilePrimaryStep || mobilePrimaryStep.isDone">
                {{ selectedWish.steps.length ? '完成这一步' : '先去下面补一步' }}
              </button>
              <p v-if="rewardFeedback && stepRewardFeedbackTargetId" :class="['detail-atelier-feedback', 'detail-atelier-step-feedback', rewardFeedbackTone]" role="status" aria-live="polite">{{ rewardFeedback }}</p>
            </div>

            <details v-if="selectedWish.steps.length" class="detail-atelier-mobile-more detail-atelier-mobile-only detail-atelier-step-more-card">
              <summary class="detail-atelier-mobile-more-summary">
                <span>全部步骤</span>
                <strong>展开查看这 {{ selectedWish.steps.length }} 步</strong>
              </summary>

              <div class="detail-atelier-step-list">
                <article v-for="step in selectedWish.steps" :key="`mobile-step-${step.id}`" :class="['detail-atelier-step-card', { done: step.isDone }]">
                  <button v-if="canProgressSelectedWish" class="detail-atelier-secondary detail-atelier-step-toggle" type="button" @click="void toggleWishStep(step.id)">{{ getStepActionLabel(step.id, step.isDone) }}</button>
                  <div class="detail-atelier-step-copy">
                    <strong>{{ step.title }}</strong>
                    <div class="detail-atelier-chip-row compact">
                      <span class="detail-atelier-chip">{{ getStepStarCoinLabel(step.id) }}</span>
                    </div>
                    <div v-if="wishStore.getStepRewardClaim(step.id)" class="detail-atelier-chip-row compact">
                      <span class="detail-atelier-chip">{{ getClaimToneLabel(wishStore.getStepRewardClaim(step.id)?.claimKind || '') }}</span>
                      <span class="detail-atelier-chip">{{ wishStore.getStepRewardClaim(step.id)?.titleSnapshot }}</span>
                    </div>
                    <p>{{ getStepStatusCopy(step.id, step.isDone) }}</p>
                  </div>
                </article>
              </div>
            </details>
          </div>

          <div v-else class="detail-atelier-progress-quick-action detail-atelier-progress-one-step">
            <div class="detail-atelier-progress-quick-copy">
              <strong>这条愿望可以一步完成</strong>
              <p>没有拆数字或步骤时，完成按钮就直接放在这里。</p>
            </div>
          </div>

          <div v-if="canShowProgressCompletionAction && canProgressSelectedWish" class="detail-atelier-inline-buttons detail-atelier-progress-completion-row">
            <button class="detail-atelier-secondary detail-atelier-secondary-action detail-atelier-progress-completion" type="button" @click="void handleWishCompletionAction()">完成并获得 {{ getCompletionStarCoinLabel() }}</button>
          </div>
        </article>
      </section>

      <section class="detail-atelier-compose-band">
        <article class="page-card detail-atelier-compose-card">
          <div class="detail-atelier-section-head">
            <div class="detail-atelier-section-copy">
              <p class="detail-atelier-kicker">写一笔近况</p>
              <h2>先记下一笔近况</h2>
            </div>
          </div>

          <p class="detail-atelier-support detail-atelier-support-wide">先写一句，想带图也可以；发出去后会顺着往下留下。</p>

          <form class="detail-atelier-comment-form is-front" @submit.prevent="submitComment">
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
        </article>
      </section>

      <section class="detail-atelier-journal-grid">
        <article id="journal" class="page-card detail-atelier-thread-card">
          <div class="detail-atelier-section-head">
            <div class="detail-atelier-section-copy">
              <p class="detail-atelier-kicker">共同手账</p>
              <h2>这一页已经留下的过程</h2>
            </div>
            <span class="detail-atelier-badge">最新在上 · {{ visibleThreads.length }} 笔</span>
          </div>

          <p class="detail-atelier-support detail-atelier-support-wide">最上面这一笔就是最近一次近况，往下是更早的记录。</p>

          <div v-if="visibleThreads.length" class="detail-atelier-thread-list detail-atelier-desktop-only">
            <article
              v-for="thread in visibleThreads"
              :key="thread.id"
              :class="['detail-atelier-thread-entry', { 'is-system': !isCommentThread(thread) }]"
            >
              <div class="detail-atelier-thread-toolbar">
                <div class="detail-atelier-thread-meta">
                  <div class="detail-atelier-mobile-thread-head">
                    <div class="detail-atelier-mobile-thread-title">
                    <p class="detail-atelier-kicker">{{ getThreadEyebrow(thread) }}</p>
                    <strong>{{ getThreadHeadline(thread) }}</strong>
                      <time>{{ formatBeijingDateTime(thread.createdAt) }}</time>
                    </div>
                    <div class="detail-atelier-chip-row compact detail-atelier-mobile-thread-corner-chips">
                      <span class="detail-atelier-chip">{{ getThreadActorName(thread) }}</span>
                      <span v-if="thread.images.length" class="detail-atelier-chip">{{ thread.images.length }} 张图</span>
                      <span v-if="!isCommentThread(thread)" class="detail-atelier-chip">系统记录</span>
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

              <p v-else class="detail-atelier-thread-message">{{ thread.messageText }}</p>

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
                      {{ isThreadReactionExpanded(thread.id) ? '收起表情' : '表情' }}
                    </button>

                    <span v-if="thread.reactions.length" class="detail-atelier-reaction-summary">{{ thread.reactions.length }} 种回应</span>

                    <div v-if="isThreadReactionExpanded(thread.id)" :id="`thread-reaction-panel-${thread.id}`" class="detail-atelier-reaction-list is-extended">
                      <button
                        v-for="emoji in THREAD_REACTION_OPTIONS"
                        :key="`${thread.id}-reaction-${emoji}`"
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
              v-for="thread in mobileVisibleThreads"
              :key="`mobile-thread-${thread.id}`"
              :class="['detail-atelier-thread-entry', { 'is-system': !isCommentThread(thread) }]"
            >
              <div class="detail-atelier-thread-toolbar">
                <div class="detail-atelier-thread-meta">
                  <div class="detail-atelier-mobile-thread-head">
                    <div class="detail-atelier-mobile-thread-title">
                      <p class="detail-atelier-kicker">{{ getThreadEyebrow(thread) }}</p>
                      <strong>{{ getThreadHeadline(thread) }}</strong>
                      <time>{{ formatBeijingDateTime(thread.createdAt) }}</time>
                    </div>
                    <div class="detail-atelier-chip-row compact detail-atelier-mobile-thread-corner-chips">
                      <span class="detail-atelier-chip">{{ getThreadActorName(thread) }}</span>
                      <span v-if="thread.images.length" class="detail-atelier-chip">{{ thread.images.length }} 张图</span>
                      <span v-if="!isCommentThread(thread)" class="detail-atelier-chip">系统记录</span>
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

              <p v-else class="detail-atelier-thread-message detail-atelier-thread-message-mobile">{{ thread.messageText }}</p>

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
                  <span>表情</span>
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
                <span v-else class="detail-atelier-reaction-summary">还没有回应</span>

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
              <span>更早记录</span>
              <strong>再往前翻 {{ mobileOverflowThreads.length }} 笔</strong>
            </summary>

            <div class="detail-atelier-thread-list detail-atelier-thread-list-overflow">
              <article
                v-for="thread in mobileOverflowThreads"
                :key="`mobile-thread-overflow-${thread.id}`"
                :class="['detail-atelier-thread-entry', { 'is-system': !isCommentThread(thread) }]"
              >
                <div class="detail-atelier-thread-toolbar">
                  <div class="detail-atelier-thread-meta">
                    <div class="detail-atelier-mobile-thread-head">
                      <div class="detail-atelier-mobile-thread-title">
                        <p class="detail-atelier-kicker">{{ getThreadEyebrow(thread) }}</p>
                        <strong>{{ getThreadHeadline(thread) }}</strong>
                        <time>{{ formatBeijingDateTime(thread.createdAt) }}</time>
                      </div>
                      <div class="detail-atelier-chip-row compact detail-atelier-mobile-thread-corner-chips">
                        <span class="detail-atelier-chip">{{ getThreadActorName(thread) }}</span>
                        <span v-if="thread.images.length" class="detail-atelier-chip">{{ thread.images.length }} 张图</span>
                        <span v-if="!isCommentThread(thread)" class="detail-atelier-chip">系统记录</span>
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

                <p v-else class="detail-atelier-thread-message detail-atelier-thread-message-mobile">{{ thread.messageText }}</p>

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
                    <span>表情</span>
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
                  <span v-else class="detail-atelier-reaction-summary">还没有回应</span>

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

      <section class="detail-atelier-tools-band">
        <details class="page-card detail-atelier-tools-card detail-atelier-danger-details">
          <summary class="detail-atelier-danger-summary">
            <span>低频工具</span>
            <strong>整理这页愿望</strong>
          </summary>

          <div class="detail-atelier-danger-copy-block">
            <p class="detail-atelier-danger-copy">补详情、整理进度和移走愿望，都放在这里。</p>
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
              <p>只有当你想回头整理记录时，再从这里校正现在的数值。</p>
            </div>

            <label class="detail-atelier-progress-log-toggle">
              <input v-model="shouldRecordCountProgressLog" type="checkbox" />
              <span>每次推进数字进度时，顺手记一笔手账记录</span>
            </label>

            <div class="detail-atelier-inline-form detail-atelier-inline-form-compact">
              <label>
                <span>把它改成现在的位置</span>
                <input v-model.number="countProgressDraft" type="number" min="0" :max="Math.max(1, selectedWish.progressTarget)" />
              </label>
              <div class="detail-atelier-inline-buttons detail-atelier-tools-actions">
                <button class="detail-atelier-secondary" type="button" @click="void adjustCountProgress(-1)">往回调 1 点</button>
                <button class="detail-atelier-secondary" type="button" @click="void saveCountProgress()">保存现在的位置</button>
              </div>
            </div>
          </div>

          <div v-if="progressSnapshot?.mode === 'steps' && canProgressSelectedWish" class="detail-atelier-tools-section">
            <div class="detail-atelier-tools-copy">
              <span>步骤整理</span>
              <p>当你想回头整理步骤顺序时，再从这里增删小步骤就好。</p>
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

            <section class="detail-atelier-reaction-picker-section" aria-labelledby="detail-thread-reaction-more-title">
              <div class="detail-atelier-reaction-picker-section-head">
                <strong id="detail-thread-reaction-more-title">更多情绪</strong>
                <span>细一点也可以</span>
              </div>
              <div class="detail-atelier-reaction-picker-grid detail-atelier-reaction-list is-extended is-compact">
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
            </section>
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
  min-height: 42px;
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--type-body-size);
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
  padding: 0.56rem 0.9rem;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel-strong);
  color: var(--text-main);
}

.detail-atelier-primary {
  min-height: 44px;
  padding: 0.66rem 1.12rem;
  border: 0;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: var(--accent-contrast);
  box-shadow: 0 14px 28px var(--accent-shadow);
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
  padding: 1.15rem;
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
  gap: 0.82rem;
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
    radial-gradient(circle at top right, var(--danger-panel), transparent 24%),
    radial-gradient(circle at bottom left, color-mix(in srgb, var(--accent-gold) 28%, transparent), transparent 26%),
    linear-gradient(180deg, var(--surface-card), var(--warm-panel-strong));
  gap: 1.1rem;
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
  background:
    linear-gradient(180deg, var(--surface-card), var(--warm-panel-strong)),
    radial-gradient(circle at top right, var(--sage-glow), transparent 24%),
    radial-gradient(circle at bottom left, var(--danger-panel), transparent 26%);
}

.detail-atelier-thread-card {
  background:
    linear-gradient(180deg, var(--surface-card), var(--warm-panel-strong)),
    radial-gradient(circle at top right, var(--danger-panel), transparent 28%);
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
  font-size: var(--type-card-title-size);
  font-weight: 700;
  line-height: var(--type-card-title-line);
  letter-spacing: 0;
}

.detail-atelier-story-card h1 {
  max-width: 20ch;
  font-size: var(--type-page-title-size);
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
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

.detail-atelier-chip-row-primary {
  padding-bottom: 0.1rem;
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
  color: var(--danger);
  font-weight: 500;
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
  padding: 0.95rem;
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.58rem;
}

.detail-atelier-summary-card-featured {
  background:
    linear-gradient(180deg, var(--warm-panel-strong), var(--accent-panel)),
    radial-gradient(circle at top right, var(--danger-panel), transparent 26%);
}

.detail-atelier-summary-card strong,
.detail-atelier-balance-card strong,
.detail-atelier-member-card strong,
.detail-atelier-choice-card strong,
.detail-atelier-star-card strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.detail-atelier-summary-card strong {
  font-size: var(--type-card-title-size);
}

.detail-atelier-summary-card-featured strong {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
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
}

.detail-atelier-progress-quick-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.82rem;
  align-items: center;
  padding: 0.88rem 0.92rem;
  border-radius: 20px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
}

.detail-atelier-progress-quick-copy {
  display: grid;
  gap: 0.22rem;
}

.detail-atelier-progress-quick-copy strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.02em;
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

.detail-atelier-progress-completion-row {
  justify-content: flex-end;
  padding-top: 0.1rem;
}

.detail-atelier-progress-completion {
  min-width: 10rem;
}

.detail-atelier-progress-track {
  position: relative;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--line-soft);
}

.detail-atelier-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, var(--accent), var(--sage));
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

.detail-atelier-progress-log-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-progress-log-toggle input {
  width: 1rem;
  height: 1rem;
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
  gap: 0.82rem;
  padding: 1rem;
}

.detail-atelier-thread-list {
  display: grid;
  gap: 0.9rem;
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
  background: var(--surface-soft);
}

.detail-atelier-thread-toolbar {
  gap: 0.72rem;
}

.detail-atelier-thread-meta time {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
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

.detail-atelier-reaction-toggle {
  justify-self: start;
  min-height: 38px;
  padding: 0.44rem 0.78rem;
}

.detail-atelier-reaction-summary {
  color: var(--text-faint);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
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
    font-size: var(--type-page-title-size);
    max-width: none;
  }

  .detail-atelier-meta-grid {
    grid-template-columns: 1fr;
  }

  .detail-atelier-lead {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-clamp: 3;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-atelier-mobile-progress-glance {
    grid-template-columns: 1fr;
  }

  .detail-atelier-mobile-more {
    padding: 0.84rem 0.88rem;
    border-radius: 20px;
  }

  .detail-atelier-mobile-more-summary {
    align-items: flex-start;
  }

  .detail-atelier-danger-row {
    align-items: flex-start;
  }

  .detail-atelier-danger-summary {
    align-items: flex-start;
  }

  .detail-atelier-danger-actions {
    width: 100%;
    justify-content: flex-start;
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
    padding: 0.95rem;
  }

  .detail-atelier-compose-card {
    gap: 0.68rem;
    padding: 0.82rem;
  }

  .detail-atelier-compose-card .detail-atelier-section-head {
    height: 65px;
    gap: 0.42rem;
    justify-content: center;
  }

  .detail-atelier-compose-card .detail-atelier-section-copy {
    gap: 0.18rem;
  }

  .detail-atelier-compose-card .detail-atelier-section-copy h2 {
    margin: 0;
  }

  .detail-atelier-compose-card .detail-atelier-support-wide {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
    line-clamp: 1;
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

  .detail-atelier-thread-entry,
  .detail-atelier-image-figure {
    gap: 0.68rem;
    padding: 0.82rem;
    border-radius: 20px;
  }

  .detail-atelier-thread-entry {
    gap: 0.42rem;
    padding: 0.68rem 0.72rem;
    border-radius: 18px;
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
    gap: 0.12rem;
  }

  .detail-atelier-mobile-thread-title .detail-atelier-kicker {
    line-height: 1.2;
  }

  .detail-atelier-mobile-thread-title strong {
    display: -webkit-box;
    overflow: hidden;
    color: var(--text-main);
    font-family: var(--font-heading);
    font-size: var(--type-l5-size);
    font-weight: 600;
    line-height: 1.34;
    letter-spacing: 0;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .detail-atelier-mobile-thread-title time {
    color: var(--text-faint);
    font-size: var(--type-l7-size);
    line-height: 1.25;
    letter-spacing: var(--type-l7-spacing);
  }

  .detail-atelier-mobile-thread-corner-chips {
    display: flex;
    max-width: 9.8rem;
    justify-content: flex-end;
    gap: 0.28rem;
    overflow: visible;
    padding-bottom: 0;
  }

  .detail-atelier-mobile-thread-corner-chips .detail-atelier-chip {
    min-height: 26px;
    max-width: 5rem;
    padding: 0.25rem 0.48rem;
    font-size: var(--type-l7-size);
    line-height: 1.1;
    letter-spacing: 0;
  }

  .detail-atelier-thread-message-mobile {
    line-height: 1.48;
    -webkit-line-clamp: 2;
    line-clamp: 2;
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
    gap: 0.32rem;
    align-items: center;
    min-height: 30px;
  }

  .detail-atelier-mobile-reaction-trigger.detail-atelier-reaction-toggle {
    width: auto;
    min-width: 0;
    min-height: 30px;
    justify-content: center;
    gap: 0.18rem;
    padding: 0.26rem 0.48rem;
    border-radius: 999px;
    font-size: var(--type-supporting-size);
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
    min-height: 28px;
    padding: 0.28rem 0.48rem;
    border-radius: 999px;
    font-size: var(--type-l7-size);
    line-height: 1;
    letter-spacing: 0;
  }

  .detail-atelier-mobile-reaction-members-stack {
    padding-top: 0.1rem;
  }

  .detail-atelier-mobile-reaction-rail .detail-atelier-reaction-summary {
    align-self: center;
    flex: 1 1 auto;
    font-size: var(--type-l7-size);
    line-height: 1.2;
    letter-spacing: var(--type-l7-spacing);
  }

  .detail-atelier-mobile-thread-inline-tools {
    flex: 0 0 auto;
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
