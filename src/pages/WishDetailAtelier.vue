<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { DRAGON_BALL_COIN_TARGET } from '../stores/wishes'
import { formatBeijingDateTime } from '../utils/datetime'
import { useWishDetailPageState } from '../composables/useWishDetailPageState'

const priorityLabels = {
  high: '很想靠近',
  medium: '慢慢靠近',
  low: '先放在这里',
} as const

const MOBILE_THREAD_PREVIEW_COUNT = 3

const {
  THREAD_REACTION_OPTIONS,
  adjustCountProgress,
  authStore,
  canAddThreadReaction,
  cancelEditingImageNote,
  cancelEditingThreadComment,
  canConfirmWishReward,
  canDeleteImage,
  canManageThreadComment,
  canPreviewNext,
  canPreviewPrevious,
  canRetryComment,
  clearCommentImageFiles,
  closeImagePreview,
  closeRewardDialog,
  coinLead,
  coinProgressPercent,
  coinSnapshot,
  commentFeedback,
  commentFeedbackTone,
  commentImageFiles,
  commentImageInputVersion,
  confirmWishCompletionReward,
  countProgressDraft,
  coverImageUrl,
  currentMemberPremiumRewards,
  currentMemberStarCoins,
  deleteImage,
  deleteThreadComment,
  deleteWish,
  deletingThreadId,
  draftMessage,
  dueDateLabel,
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
  getThreadMemberReactionEmojis,
  getThreadReactionCount,
  getWishActionLabel,
  hasActiveOverflowThreadReaction,
  handleCommentImageSelection,
  handleImageSelection,
  handleWishCompletionAction,
  imageNoteDraft,
  isCommentThread,
  isCoverImage,
  isEditingThreadComment,
  isSavingImageNote,
  isSavingThreadEdit,
  isSubmittingComment,
  isSubmittingReward,
  isThreadReactionActive,
  isThreadReactionExpanded,
  isThreadReactionRowPending,
  isTogglingThreadReaction,
  isUploadingImages,
  lightboxImages,
  openImagePreview,
  pendingCompletionKind,
  pendingWishRewardSelectionId,
  previewImage,
  previewImageIndex,
  progressLead,
  progressSnapshot,
  removeCommentImageFile,
  removeWishStep,
  retryComment,
  rewardFeedback,
  rewardFeedbackTone,
  rewardHeadline,
  saveCountProgress,
  saveImageNote,
  saveThreadComment,
  shouldRecordCountProgressLog,
  selectedWish,
  startEditingImageNote,
  startEditingThreadComment,
  stepDraft,
  stepPreview,
  submitComment,
  submitWishStep,
  threadFeedback,
  threadFeedbackTone,
  toggleThreadReactionExpansion,
  toggleThreadReaction,
  toggleWishStep,
  wishJournalEntries,
  wishRewardClaim,
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
const mobileVisibleThreads = computed(() => visibleThreads.value.slice(0, MOBILE_THREAD_PREVIEW_COUNT))
const mobileOverflowThreads = computed(() => visibleThreads.value.slice(MOBILE_THREAD_PREVIEW_COUNT))
const mobileNextPendingStep = computed(() => selectedWish.value?.steps.find((step) => !step.isDone) ?? null)
const mobilePrimaryStep = computed(() => mobileNextPendingStep.value ?? selectedWish.value?.steps[0] ?? null)
const mobileCompletedStepCount = computed(() => selectedWish.value?.steps.filter((step) => step.isDone).length ?? 0)
const mobileAttachmentSummary = computed(() => {
  if (commentImageFiles.value.length) {
    return `已选 ${commentImageFiles.value.length} 张图`
  }

  return wishStore.isUsingCloudWishes
    ? '先写一句也可以，图片放在里面再加'
    : '连接云端愿望后，这里就能加图片'
})
const mobileStorySummary = computed(() => {
  if (!selectedWish.value) {
    return '先写下一笔近况，今天最重要的变化就会继续落在这里。'
  }

  if (progressSnapshot.value?.mode === 'steps') {
    return selectedWish.value.steps.length
      ? '先完成眼前这一步，再回来把新的变化写下来。'
      : '先写下第一步，这页会更容易继续往前。'
  }

  if (progressSnapshot.value?.mode === 'count') {
    return '先把数字往前推一点，再回来记一句今天的近况。'
  }

  return '先写一句近况，后面的推进、投币和记录都会继续接在这一页。'
})
const isDeleteWishConfirming = ref(false)
const isDeletingWish = ref(false)
const deleteWishFeedback = ref('')

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

          <div class="detail-atelier-mobile-glance detail-atelier-mobile-only">
            <button
              v-if="coverImageUrl && coverImageEntry"
              class="detail-atelier-mobile-cover-button"
              type="button"
              @click="openImagePreview(visibleImages, coverImageEntry.id)"
            >
              <img class="detail-atelier-mobile-cover-image" :src="coverImageUrl" :alt="`${selectedWish.title} 首图`" />
            </button>
            <div v-else class="detail-atelier-mobile-cover-empty detail-atelier-empty-block">
              <strong>还没有封面</strong>
              <p>等你留下第一张图。</p>
            </div>

            <div class="detail-atelier-mobile-glance-copy">
              <span class="detail-atelier-badge">{{ coverImageEntry ? '已留住封面' : '还没有首图' }}</span>
              <strong>{{ selectedWish.images.length }} 张图 · {{ visibleThreads.length }} 条记录</strong>
              <p>{{ mobileStorySummary }}</p>
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
              <strong>{{ selectedWish.images.length }} 张图 · {{ wishJournalEntries.length }} 条记录</strong>
            </div>
            <div class="detail-atelier-meta-item">
              <span class="detail-atelier-meta-label">创建时间</span>
              <strong>{{ formatBeijingDateTime(selectedWish.createdAt) }}</strong>
            </div>
          </div>

          <details class="detail-atelier-mobile-more detail-atelier-mobile-only">
            <summary class="detail-atelier-mobile-more-summary">
              <span>更多信息</span>
              <strong>写下的人、标签和创建时间</strong>
            </summary>

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
                <strong>{{ selectedWish.images.length }} 张图 · {{ wishJournalEntries.length }} 条记录</strong>
              </div>
              <div class="detail-atelier-meta-item">
                <span class="detail-atelier-meta-label">创建时间</span>
                <strong>{{ formatBeijingDateTime(selectedWish.createdAt) }}</strong>
              </div>
            </div>
          </details>

          <div class="detail-atelier-action-row">
            <div class="detail-atelier-action-copy">
              <span>先把这条愿望稳稳放在手边</span>
              <p>投币、完成和手账记录都会接在这一页。</p>
            </div>
            <div class="detail-atelier-inline-buttons detail-atelier-action-buttons">
              <button
                class="detail-atelier-primary"
                type="button"
                :disabled="selectedWish.status === 'done' || wishStore.currentMemberRemainingCoins <= 0"
                @click="void wishStore.castWishCoin(selectedWish.id)"
              >
                {{ selectedWish.status === 'done' ? '愿望已实现' : wishStore.currentMemberRemainingCoins > 0 ? '投 1 币' : '本周已投完' }}
              </button>
              <button class="detail-atelier-secondary detail-atelier-secondary-action" type="button" @click="void handleWishCompletionAction()">{{ getWishActionLabel() }}</button>
            </div>
          </div>

          <p v-if="rewardFeedback && !pendingCompletionKind" :class="['detail-atelier-feedback', rewardFeedbackTone]" role="status" aria-live="polite">{{ rewardFeedback }}</p>
        </article>

        <article class="page-card detail-atelier-cover-card detail-atelier-desktop-only">
          <img v-if="coverImageUrl" class="detail-atelier-cover-image" :src="coverImageUrl" :alt="`${selectedWish.title} 首图`" />
          <div v-else class="detail-atelier-cover-empty">
            <strong>这页还在等一张封面</strong>
            <p>这条愿望还没放进图片，但详情页仍会完整保留过程和记录。</p>
          </div>

          <div class="detail-atelier-cover-head">
            <p class="detail-atelier-kicker">封面首图</p>
            <span class="detail-atelier-badge">{{ coverImageEntry ? '已经留住一张首图' : '还没有留下首图' }}</span>
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
            <span class="detail-atelier-badge">会落在下面</span>
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
                <p>{{ wishStore.isUsingCloudWishes ? '可选，会和这笔近况一起留在下面。' : '连接云端愿望后，就能把图片和这笔近况一起留下。' }}</p>
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
                  {{ commentImageFiles.length ? `已选 ${commentImageFiles.length} 张图` : '给这条留言加图片' }}
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

            <details class="detail-atelier-mobile-more detail-atelier-mobile-only detail-atelier-compose-attachment-details" :class="{ 'is-disabled': !wishStore.isUsingCloudWishes }">
              <summary class="detail-atelier-mobile-more-summary">
                <span>图片附件</span>
                <strong>{{ mobileAttachmentSummary }}</strong>
              </summary>

              <div class="detail-atelier-compose-attachment-copy">
                <p>{{ wishStore.isUsingCloudWishes ? '可选，会和这笔近况一起留在下面。' : '连接云端愿望后，就能把图片和这笔近况一起留下。' }}</p>
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
                  {{ commentImageFiles.length ? `已选 ${commentImageFiles.length} 张图` : '给这条留言加图片' }}
                </label>
                <button v-if="commentImageFiles.length" class="detail-atelier-secondary" type="button" @click="clearCommentImageFiles()">清空已选</button>
              </div>

              <span v-else class="detail-atelier-upload-unavailable">图片留言暂需云端同步</span>

              <div v-if="commentImageFiles.length" class="detail-atelier-chip-row compact">
                <button v-for="(file, index) in commentImageFiles" :key="`mobile-${getCommentImageFileKey(file)}`" class="detail-atelier-chip chip-button" type="button" @click="removeCommentImageFile(index)">
                  {{ file.name }} · 移除
                </button>
              </div>
            </details>

            <div class="detail-atelier-compose-submit-row detail-atelier-compose-block">
              <span class="detail-atelier-compose-author-note">默认以 {{ authStore.currentMember?.displayName || '当前成员' }} 留言</span>

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
                <p>每往前一点，小奖励都会先被空间页接住。</p>
              </div>
              <button class="detail-atelier-primary detail-atelier-progress-primary" type="button" @click="void adjustCountProgress(1)">
                +1{{ selectedWish.progressUnit ? ` ${selectedWish.progressUnit}` : '' }}
              </button>
            </div>
          </div>

          <div v-else-if="progressSnapshot?.mode === 'steps'" class="detail-atelier-progress-stack">
            <div v-if="selectedWish.steps.length" class="detail-atelier-step-list detail-atelier-desktop-only">
              <article v-for="step in selectedWish.steps" :key="step.id" :class="['detail-atelier-step-card', { done: step.isDone }]">
                <button class="detail-atelier-secondary detail-atelier-step-toggle" type="button" @click="void toggleWishStep(step.id)">{{ getStepActionLabel(step.id, step.isDone) }}</button>
                <div class="detail-atelier-step-copy">
                  <strong>{{ step.title }}</strong>
                  <div v-if="wishStore.getStepRewardClaim(step.id)" class="detail-atelier-chip-row compact">
                    <span class="detail-atelier-chip">{{ getClaimToneLabel(wishStore.getStepRewardClaim(step.id)?.claimKind || '') }}</span>
                    <span class="detail-atelier-chip">{{ wishStore.getStepRewardClaim(step.id)?.titleSnapshot }}</span>
                  </div>
                  <p>{{ getStepStatusCopy(step.id, step.isDone) }}</p>
                </div>
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
                <p>{{ selectedWish.steps.length ? '走完下一步时，这页会继续替你把过程留住。' : '有了第一步，这条愿望会更容易继续往前。' }}</p>
              </div>
              <button class="detail-atelier-primary detail-atelier-progress-primary" type="button" @click="mobilePrimaryStep ? void toggleWishStep(mobilePrimaryStep.id) : undefined" :disabled="!mobilePrimaryStep || mobilePrimaryStep.isDone">
                {{ selectedWish.steps.length ? '完成这一步' : '先去下面补一步' }}
              </button>
            </div>

            <details v-if="selectedWish.steps.length" class="detail-atelier-mobile-more detail-atelier-mobile-only detail-atelier-step-more-card">
              <summary class="detail-atelier-mobile-more-summary">
                <span>全部步骤</span>
                <strong>展开查看这 {{ selectedWish.steps.length }} 步</strong>
              </summary>

              <div class="detail-atelier-step-list">
                <article v-for="step in selectedWish.steps" :key="`mobile-step-${step.id}`" :class="['detail-atelier-step-card', { done: step.isDone }]">
                  <button class="detail-atelier-secondary detail-atelier-step-toggle" type="button" @click="void toggleWishStep(step.id)">{{ getStepActionLabel(step.id, step.isDone) }}</button>
                  <div class="detail-atelier-step-copy">
                    <strong>{{ step.title }}</strong>
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

          <div v-else class="detail-atelier-empty-block">
            <strong>还没有开始记录进度</strong>
            <p>这条愿望还没决定要怎么记进度，晚一点再补上也没关系。</p>
          </div>
        </article>

        <article class="page-card detail-atelier-overview-card is-warm">
          <div class="detail-atelier-section-head">
            <div class="detail-atelier-section-copy">
              <p class="detail-atelier-kicker">愿望币与奖励</p>
              <h2>把偏爱、鼓励和奖励留在同一页</h2>
            </div>
            <span class="detail-atelier-badge">{{ coinSnapshot?.total ?? 0 }} / {{ DRAGON_BALL_COIN_TARGET }}</span>
          </div>

          <p class="detail-atelier-support">{{ coinLead }}</p>

          <div class="detail-atelier-mobile-summary-grid detail-atelier-mobile-only">
            <article class="detail-atelier-summary-card detail-atelier-summary-card-featured">
              <span>愿望币</span>
              <strong>{{ coinSnapshot?.total ?? 0 }} / {{ DRAGON_BALL_COIN_TARGET }}</strong>
              <p>{{ getCoinStatusLabel() }}</p>
            </article>
            <article class="detail-atelier-summary-card">
              <span>星星币</span>
              <strong>{{ currentMemberStarCoins }} 枚</strong>
              <p>高档奖励 {{ currentMemberPremiumRewards.length }} 项</p>
            </article>
          </div>

          <div class="detail-atelier-meter-card is-warm">
            <div class="detail-atelier-meter-head">
              <strong>七龙珠进度</strong>
              <span>{{ coinProgressPercent }}%</span>
            </div>
            <div class="detail-atelier-progress-track" :aria-label="`愿望币进度 ${coinSnapshot?.total ?? 0}/${DRAGON_BALL_COIN_TARGET}`">
              <div class="detail-atelier-progress-fill is-warm" :style="{ width: `${coinProgressPercent}%` }"></div>
            </div>
            <p>{{ getCoinStatusLabel() }}</p>
          </div>

          <div class="detail-atelier-member-grid detail-atelier-desktop-only">
            <article v-for="member in coinSnapshot?.memberTotals ?? []" :key="member.memberId" class="detail-atelier-member-card">
              <span>{{ member.displayName }}</span>
              <strong>{{ member.total }} 枚</strong>
            </article>
          </div>

          <div class="detail-atelier-reward-block detail-atelier-desktop-only">
            <strong>{{ rewardHeadline }}</strong>
            <p>你手里现在攒着 {{ currentMemberStarCoins }} 枚星星币，也替自己备下了 {{ currentMemberPremiumRewards.length }} 项高档奖励；步骤和数字进度的小奖励，现在统一去空间页接住。</p>
            <div class="detail-atelier-chip-row compact">
              <span v-if="wishRewardClaim" class="detail-atelier-chip">已领 {{ wishRewardClaim.titleSnapshot }}</span>
              <span v-else class="detail-atelier-chip">完成时就能领奖</span>
              <span class="detail-atelier-chip">本周还剩 {{ wishStore.currentMemberRemainingCoins }} 枚愿望币</span>
            </div>
          </div>

          <details class="detail-atelier-mobile-more detail-atelier-mobile-only">
            <summary class="detail-atelier-mobile-more-summary">
              <span>奖励细节</span>
              <strong>展开这页的愿望币和奖励说明</strong>
            </summary>

            <div class="detail-atelier-member-grid">
              <article v-for="member in coinSnapshot?.memberTotals ?? []" :key="`mobile-${member.memberId}`" class="detail-atelier-member-card">
                <span>{{ member.displayName }}</span>
                <strong>{{ member.total }} 枚</strong>
              </article>
            </div>

            <div class="detail-atelier-reward-block">
              <strong>{{ rewardHeadline }}</strong>
              <p>你手里现在攒着 {{ currentMemberStarCoins }} 枚星星币，也替自己备下了 {{ currentMemberPremiumRewards.length }} 项高档奖励；步骤和数字进度的小奖励，现在统一去空间页接住。</p>
              <div class="detail-atelier-chip-row compact">
                <span v-if="wishRewardClaim" class="detail-atelier-chip">已领 {{ wishRewardClaim.titleSnapshot }}</span>
                <span v-else class="detail-atelier-chip">完成时就能领奖</span>
                <span class="detail-atelier-chip">本周还剩 {{ wishStore.currentMemberRemainingCoins }} 枚愿望币</span>
              </div>
            </div>
          </details>
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
                  @click="openImagePreview(thread.images, image.id)"
                >
                  <img v-if="image.url" class="detail-atelier-thread-image" :src="image.url" :alt="image.fileName" />
                  <span v-else class="detail-atelier-image-empty">这张图正在出现</span>
                </button>
              </div>

              <div class="detail-atelier-reaction-row">
                <div class="detail-atelier-reaction-groups">
                  <div v-if="getThreadMemberReactionEmojis(thread).length" class="detail-atelier-reaction-list detail-atelier-reaction-list-selected">
                    <span v-for="emoji in getThreadMemberReactionEmojis(thread)" :key="`${thread.id}-selected-${emoji}`" class="detail-atelier-chip">
                      {{ emoji }}
                    </span>
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

                <details v-if="canManageThreadComment(thread)" class="detail-atelier-mobile-thread-tools">
                  <summary class="detail-atelier-mobile-thread-tools-summary">
                    <span>更多</span>
                  </summary>
                  <div class="detail-atelier-inline-buttons detail-atelier-thread-tools">
                    <button class="detail-atelier-secondary" type="button" @click="isEditingThreadComment(thread.id) ? cancelEditingThreadComment() : startEditingThreadComment(thread)">
                      {{ isEditingThreadComment(thread.id) ? '取消编辑' : '编辑评论' }}
                    </button>
                    <button class="detail-atelier-text danger" type="button" :disabled="deletingThreadId === thread.id" @click="void deleteThreadComment(thread)">
                      {{ deletingThreadId === thread.id ? '删除中...' : '删除评论' }}
                    </button>
                  </div>
                </details>
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

              <details class="detail-atelier-mobile-thread-more">
                <summary class="detail-atelier-mobile-thread-more-summary">
                  <span>继续看这笔</span>
                  <strong>{{ thread.images.length ? `${thread.images.length} 张图` : '表情和更多操作' }}</strong>
                </summary>

                <div v-if="thread.images.length" class="detail-atelier-thread-images">
                  <button
                    v-for="image in thread.images"
                    :key="`mobile-thread-image-${image.id}`"
                    class="detail-atelier-thread-image-button"
                    type="button"
                    @click="openImagePreview(thread.images, image.id)"
                  >
                    <img v-if="image.url" class="detail-atelier-thread-image" :src="image.url" :alt="image.fileName" />
                    <span v-else class="detail-atelier-image-empty">这张图正在出现</span>
                  </button>
                </div>

                <div class="detail-atelier-reaction-row">
                  <div class="detail-atelier-reaction-groups">
                    <div v-if="getThreadMemberReactionEmojis(thread).length" class="detail-atelier-reaction-list detail-atelier-reaction-list-selected">
                      <span v-for="emoji in getThreadMemberReactionEmojis(thread)" :key="`${thread.id}-mobile-selected-${emoji}`" class="detail-atelier-chip">
                        {{ emoji }}
                      </span>
                    </div>

                    <div class="detail-atelier-reaction-more">
                      <button
                        :class="['detail-atelier-secondary', 'detail-atelier-reaction-toggle', { active: isThreadReactionExpanded(thread.id) || hasActiveOverflowThreadReaction(thread) }]"
                        type="button"
                        :aria-expanded="isThreadReactionExpanded(thread.id)"
                        :aria-controls="`thread-reaction-panel-mobile-${thread.id}`"
                        :aria-label="isThreadReactionExpanded(thread.id) ? '收起表情选项' : '打开表情选项'"
                        @click="toggleThreadReactionExpansion(thread.id)"
                      >
                        {{ isThreadReactionExpanded(thread.id) ? '收起表情' : '表情' }}
                      </button>

                      <span v-if="thread.reactions.length" class="detail-atelier-reaction-summary">{{ thread.reactions.length }} 种回应</span>

                      <div v-if="isThreadReactionExpanded(thread.id)" :id="`thread-reaction-panel-mobile-${thread.id}`" class="detail-atelier-reaction-list is-extended">
                        <button
                          v-for="emoji in THREAD_REACTION_OPTIONS"
                          :key="`${thread.id}-mobile-reaction-${emoji}`"
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
              </details>
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

                  <details v-if="canManageThreadComment(thread)" class="detail-atelier-mobile-thread-tools">
                    <summary class="detail-atelier-mobile-thread-tools-summary">
                      <span>更多</span>
                    </summary>
                    <div class="detail-atelier-inline-buttons detail-atelier-thread-tools">
                      <button class="detail-atelier-secondary" type="button" @click="isEditingThreadComment(thread.id) ? cancelEditingThreadComment() : startEditingThreadComment(thread)">
                        {{ isEditingThreadComment(thread.id) ? '取消编辑' : '编辑评论' }}
                      </button>
                      <button class="detail-atelier-text danger" type="button" :disabled="deletingThreadId === thread.id" @click="void deleteThreadComment(thread)">
                        {{ deletingThreadId === thread.id ? '删除中...' : '删除评论' }}
                      </button>
                    </div>
                  </details>
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

                <details class="detail-atelier-mobile-thread-more">
                  <summary class="detail-atelier-mobile-thread-more-summary">
                    <span>继续看这笔</span>
                    <strong>{{ thread.images.length ? `${thread.images.length} 张图` : '表情和更多操作' }}</strong>
                  </summary>

                  <div v-if="thread.images.length" class="detail-atelier-thread-images">
                    <button
                      v-for="image in thread.images"
                      :key="`mobile-thread-overflow-image-${image.id}`"
                      class="detail-atelier-thread-image-button"
                      type="button"
                      @click="openImagePreview(thread.images, image.id)"
                    >
                      <img v-if="image.url" class="detail-atelier-thread-image" :src="image.url" :alt="image.fileName" />
                      <span v-else class="detail-atelier-image-empty">这张图正在出现</span>
                    </button>
                  </div>

                  <div class="detail-atelier-reaction-row">
                    <div class="detail-atelier-reaction-groups">
                      <div v-if="getThreadMemberReactionEmojis(thread).length" class="detail-atelier-reaction-list detail-atelier-reaction-list-selected">
                        <span v-for="emoji in getThreadMemberReactionEmojis(thread)" :key="`${thread.id}-mobile-overflow-selected-${emoji}`" class="detail-atelier-chip">
                          {{ emoji }}
                        </span>
                      </div>

                      <div class="detail-atelier-reaction-more">
                        <button
                          :class="['detail-atelier-secondary', 'detail-atelier-reaction-toggle', { active: isThreadReactionExpanded(thread.id) || hasActiveOverflowThreadReaction(thread) }]"
                          type="button"
                          :aria-expanded="isThreadReactionExpanded(thread.id)"
                          :aria-controls="`thread-reaction-panel-mobile-overflow-${thread.id}`"
                          :aria-label="isThreadReactionExpanded(thread.id) ? '收起表情选项' : '打开表情选项'"
                          @click="toggleThreadReactionExpansion(thread.id)"
                        >
                          {{ isThreadReactionExpanded(thread.id) ? '收起表情' : '表情' }}
                        </button>

                        <span v-if="thread.reactions.length" class="detail-atelier-reaction-summary">{{ thread.reactions.length }} 种回应</span>

                        <div v-if="isThreadReactionExpanded(thread.id)" :id="`thread-reaction-panel-mobile-overflow-${thread.id}`" class="detail-atelier-reaction-list is-extended">
                          <button
                            v-for="emoji in THREAD_REACTION_OPTIONS"
                            :key="`${thread.id}-mobile-overflow-reaction-${emoji}`"
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
                </details>
              </article>
            </div>
          </details>

          <div v-else class="detail-atelier-empty-block">
            <strong>这条愿望还没有留下手账记录</strong>
            <p>先从上面的留言口写下一句，后面的变化会继续接进来。</p>
          </div>

          <p v-if="threadFeedback" :class="['detail-atelier-feedback', threadFeedbackTone]" role="status" aria-live="polite">{{ threadFeedback }}</p>
        </article>

        <article class="page-card detail-atelier-image-card">
          <div class="detail-atelier-section-head">
            <div class="detail-atelier-section-copy">
              <p class="detail-atelier-kicker">图片与纪念</p>
              <h2>图片与纪念</h2>
            </div>
            <span class="detail-atelier-badge">{{ visibleImages.length }} 张</span>
          </div>

          <div class="detail-atelier-image-intro">
            <div class="detail-atelier-image-toolbar">
              <div class="detail-atelier-image-toolbar-copy">
                <span>先挑出最想记住的画面</span>
                <p>这里更像纪念册。先摆顺序，再补一句话。</p>
              </div>

              <div class="detail-atelier-inline-buttons detail-atelier-image-toolbar-actions">
                <label v-if="wishStore.isUsingCloudWishes && !visibleImages.length" class="detail-atelier-secondary upload-trigger">
                  <input
                    class="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    @change="handleImageSelection"
                  />
                  {{ isUploadingImages ? '上传中...' : '添加封面图' }}
                </label>
                <span v-else-if="wishStore.isUsingCloudWishes" class="detail-atelier-chip">现在先留住这一张封面</span>
              </div>
            </div>

            <p v-if="visibleImages.length" class="detail-atelier-support">想换一张时，再回来慢慢整理也可以。</p>

            <div v-if="visibleImages.length" class="detail-atelier-image-memory-strip">
              <article class="detail-atelier-image-memory-card">
                <span>这一页的封面</span>
                <strong>{{ coverImageEntry?.fileName || '还没设置首图' }}</strong>
                <p>封面会先出现在首屏。</p>
              </article>
            </div>
          </div>

          <div v-if="visibleImages.length" class="detail-atelier-image-grid">
            <figure
              v-for="(image, index) in visibleImages"
              :key="image.id"
              :class="['detail-atelier-image-figure', { 'is-cover': isCoverImage(image.id) }]"
            >
              <div class="detail-atelier-image-stage">
                <button v-if="image.url" class="detail-atelier-image-button" type="button" @click="openImagePreview(visibleImages, image.id)">
                  <img class="detail-atelier-image" :src="image.url" :alt="image.fileName" draggable="false" />
                </button>
                <div v-else class="detail-atelier-image-empty">这张图正在展开</div>

                <div class="detail-atelier-image-badges">
                  <span class="detail-atelier-chip">{{ isCoverImage(image.id) ? '当前首图' : `第 ${index + 1} 张` }}</span>
                </div>
              </div>

              <div class="detail-atelier-image-sheet">
                <figcaption class="detail-atelier-image-caption">
                  <div class="detail-atelier-image-caption-copy">
                    <strong>{{ image.fileName }}</strong>
                    <div class="detail-atelier-chip-row compact detail-atelier-image-meta-chips">
                      <span class="detail-atelier-chip">{{ getMemberName(image.createdBy) }}</span>
                      <span class="detail-atelier-chip">{{ formatFileSize(image.sizeBytes) }}</span>
                    </div>
                  </div>
                  <span v-if="isCoverImage(image.id)" class="detail-atelier-chip">封面</span>
                </figcaption>

                <div :class="['detail-atelier-image-memory-note', { 'is-empty': !image.note }]">
                  <span>{{ image.note ? '纪念备注' : '还没写下这一刻' }}</span>
                  <p class="detail-atelier-image-note">{{ image.note || '可以补一句地点、当时的心情，或者它为什么值得留下。' }}</p>
                </div>

                <div v-if="editingImageNoteId === image.id" class="detail-atelier-note-editor">
                  <label>
                    <span>图片备注</span>
                    <textarea v-model="imageNoteDraft" rows="3" maxlength="240" placeholder="补充这张图的地点、想法、来源或纪念意义"></textarea>
                  </label>
                  <div class="detail-atelier-inline-buttons">
                    <button class="detail-atelier-secondary" type="button" @click="cancelEditingImageNote()">取消</button>
                    <button class="detail-atelier-primary" type="button" :disabled="isSavingImageNote" @click="void saveImageNote(image.id)">
                      {{ isSavingImageNote ? '保存中...' : '保存备注' }}
                    </button>
                  </div>
                </div>

                <div class="detail-atelier-image-actions">
                  <button class="detail-atelier-secondary" type="button" @click="startEditingImageNote(image.id, image.note)">
                    {{ image.note ? '编辑备注' : '添加备注' }}
                  </button>
                </div>
              </div>
            </figure>
          </div>

          <div v-else class="detail-atelier-empty-block">
            <strong>还没有图片</strong>
            <p>可以给这条愿望上传灵感图、截图或者完成过程里的纪念照片。</p>
          </div>
        </article>
      </section>

      <section class="detail-atelier-tools-band">
        <details class="page-card detail-atelier-tools-card detail-atelier-danger-details">
          <summary class="detail-atelier-danger-summary">
            <span>低频工具</span>
            <strong>整理这页愿望</strong>
          </summary>

          <div class="detail-atelier-danger-copy-block">
            <p class="detail-atelier-danger-copy">删除和移走这条愿望，都放在这里，平时不用一直看见。</p>
            <p v-if="deleteWishFeedback" class="detail-atelier-feedback danger" role="status" aria-live="polite">{{ deleteWishFeedback }}</p>
          </div>

          <div v-if="visibleImages.length" class="detail-atelier-tools-section">
            <div class="detail-atelier-tools-copy">
              <span>封面图片</span>
              <p>如果想换掉这一张封面，先从这里整理会更安全。</p>
            </div>
            <div class="detail-atelier-inline-buttons detail-atelier-danger-actions">
              <button
                v-if="coverImageEntry && canDeleteImage(coverImageEntry.createdBy)"
                class="detail-atelier-secondary"
                type="button"
                @click="void deleteImage(coverImageEntry.id)"
              >
                换一张封面
              </button>
            </div>
          </div>

          <div class="detail-atelier-inline-buttons detail-atelier-danger-actions">
            <template v-if="isDeleteWishConfirming">
              <span class="detail-atelier-chip detail-atelier-danger-chip">移走后会回到清单页</span>
              <button class="detail-atelier-secondary" type="button" :disabled="isDeletingWish" @click="cancelWishDeleteConfirm()">先不删</button>
              <button class="detail-atelier-text danger" type="button" :disabled="isDeletingWish" @click="void confirmDeleteWish()">
                {{ isDeletingWish ? '删除中...' : '确认删除' }}
              </button>
            </template>
            <button v-else class="detail-atelier-text danger" type="button" @click="openWishDeleteConfirm()">移走这条愿望</button>
          </div>

          <div v-if="progressSnapshot?.mode === 'count'" class="detail-atelier-tools-section">
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

          <div v-if="progressSnapshot?.mode === 'steps'" class="detail-atelier-tools-section">
            <div class="detail-atelier-tools-copy">
              <span>步骤整理</span>
              <p>当你想回头整理步骤顺序时，再从这里增删小步骤就好。</p>
            </div>

            <form class="detail-atelier-inline-form detail-atelier-inline-form-compact" @submit.prevent="submitWishStep">
              <label>
                <span>补一小步</span>
                <input v-model="stepDraft" type="text" maxlength="60" placeholder="例如：先确认路线和预算" />
              </label>
              <div class="detail-atelier-inline-buttons detail-atelier-tools-actions">
                <button class="detail-atelier-secondary" type="submit" :disabled="!stepDraft.trim()">加入这一步</button>
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

    <div v-if="pendingCompletionKind" class="detail-atelier-overlay" @click.self="closeRewardDialog()">
      <div class="detail-atelier-dialog detail-atelier-reward-dialog page-card" role="dialog" aria-modal="true" aria-labelledby="detail-reward-dialog-title">
        <div class="detail-atelier-dialog-head">
          <div>
            <p class="detail-atelier-kicker">愿望奖励</p>
            <h3 id="detail-reward-dialog-title">给这次完成一个正式的奖励仪式</h3>
          </div>
          <button class="detail-atelier-secondary" type="button" @click="closeRewardDialog()">关闭</button>
        </div>

        <p class="detail-atelier-support">整条愿望完成时，可以从高档奖励池里认真挑一个。</p>

        <div class="detail-atelier-balance-grid detail-atelier-balance-grid-compact">
          <article class="detail-atelier-balance-card">
            <span>手里的星星币</span>
            <strong>{{ currentMemberStarCoins }}</strong>
          </article>
          <article class="detail-atelier-balance-card">
            <span>眼前可选的奖励</span>
            <strong>{{ currentMemberPremiumRewards.length }}</strong>
          </article>
        </div>

        <div v-if="currentMemberPremiumRewards.length" class="detail-atelier-choice-grid detail-atelier-choice-grid-reward">
          <button
            v-for="item in currentMemberPremiumRewards"
            :key="item.id"
            :class="['detail-atelier-choice-card', { active: pendingWishRewardSelectionId === item.id }]"
            type="button"
            @click="pendingWishRewardSelectionId = item.id"
          >
            <div class="detail-atelier-choice-head">
              <strong>{{ item.title }}</strong>
              <span class="detail-atelier-chip">高档奖励</span>
            </div>
            <p>{{ item.note || '这条奖励还没有补充说明。' }}</p>
            <div class="detail-atelier-chip-row compact">
              <span class="detail-atelier-chip">已领 {{ wishStore.getRewardItemClaimCount(item) }} 份</span>
              <span v-if="item.starCoinCost > 0" class="detail-atelier-chip">{{ item.starCoinCost }} 星星币可兑换</span>
            </div>
          </button>
        </div>
        <div v-else class="detail-atelier-empty-block">
          <strong>你的高档奖励池还是空的</strong>
          <p>先去空间页放进一两个大奖励，再回来会更顺。</p>
        </div>

        <p v-if="rewardFeedback && pendingCompletionKind" :class="['detail-atelier-feedback', rewardFeedbackTone]" role="status" aria-live="polite">{{ rewardFeedback }}</p>

        <div class="detail-atelier-inline-buttons detail-atelier-dialog-actions">
          <button class="detail-atelier-secondary" type="button" @click="closeRewardDialog()">先放一放</button>
          <button class="detail-atelier-primary" type="button" :disabled="!canConfirmWishReward" @click="void confirmWishCompletionReward()">
            {{ isSubmittingReward ? '确认中...' : '完成并领取高档奖励' }}
          </button>
        </div>
      </div>
    </div>

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
          <button class="detail-atelier-secondary" type="button" :disabled="!canPreviewPrevious" @click="stepPreview(-1)">上一张</button>
          <img class="detail-atelier-lightbox-image" :src="previewImage.url" :alt="previewImage.fileName" />
          <button class="detail-atelier-secondary" type="button" :disabled="!canPreviewNext" @click="stepPreview(1)">下一张</button>
        </div>

        <div class="detail-atelier-meta-row">
          <span>{{ previewImageIndex + 1 }} / {{ lightboxImages.length }}</span>
          <span>{{ formatFileSize(previewImage.sizeBytes) }}</span>
        </div>
        <p class="detail-atelier-support">{{ previewImage.note || '这张图还没有备注。' }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.detail-atelier-page {
  font-family: var(--font-body);
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
.detail-atelier-action-copy,
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
.detail-atelier-action-row,
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
  background: rgba(255, 252, 246, 0.82);
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
  color: rgba(70, 53, 45, 0.66);
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
  border: 1px solid rgba(126, 96, 76, 0.14);
  background: rgba(255, 255, 255, 0.78);
  color: #392922;
}

.detail-atelier-primary {
  min-height: 44px;
  padding: 0.66rem 1.12rem;
  border: 0;
  background: linear-gradient(135deg, #c97c61, #9f5d50);
  color: #fffaf5;
  box-shadow: 0 14px 28px rgba(163, 91, 73, 0.22);
}

.detail-atelier-secondary-action {
  background: rgba(255, 250, 244, 0.72);
  color: rgba(57, 41, 34, 0.84);
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
  color: rgba(70, 53, 45, 0.42);
  font-size: var(--type-kicker-sub-size);
  letter-spacing: var(--type-kicker-sub-spacing);
  text-transform: uppercase;
}

.detail-atelier-section-copy {
  gap: 0.34rem;
  max-width: 28rem;
}

.detail-atelier-story-card {
  background:
    radial-gradient(circle at top right, rgba(226, 193, 206, 0.18), transparent 24%),
    radial-gradient(circle at bottom left, rgba(232, 216, 166, 0.18), transparent 26%),
    linear-gradient(180deg, rgba(255, 248, 243, 0.96), rgba(255, 255, 255, 0.74));
  gap: 1.1rem;
}

.detail-atelier-mobile-glance {
  grid-template-columns: minmax(96px, 112px) minmax(0, 1fr);
  gap: 0.82rem;
  align-items: start;
  padding: 0.82rem;
  border-radius: 22px;
  border: 1px solid rgba(126, 96, 76, 0.1);
  background: rgba(255, 255, 255, 0.62);
}

.detail-atelier-mobile-cover-button {
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
  border: 1px solid rgba(126, 96, 76, 0.14);
  box-shadow: var(--shadow-card);
}

.detail-atelier-mobile-cover-empty {
  min-height: 100%;
  padding: 0.72rem;
}

.detail-atelier-mobile-cover-empty strong,
.detail-atelier-mobile-glance-copy strong {
  color: #2e1f19;
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
  color: rgba(76, 59, 50, 0.68);
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
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.62);
}

.detail-atelier-mobile-more-summary {
  display: flex;
  justify-content: space-between;
  gap: 0.72rem;
  align-items: center;
  cursor: pointer;
  list-style: none;
}

.detail-atelier-mobile-more-summary::-webkit-details-marker {
  display: none;
}

.detail-atelier-mobile-more-summary span {
  color: rgba(70, 53, 45, 0.6);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.detail-atelier-mobile-more-summary strong {
  color: rgba(57, 41, 34, 0.86);
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
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(86, 63, 52, 0.84);
  justify-content: flex-start;
}

.detail-atelier-hero-top .detail-atelier-mini-link:hover,
.detail-atelier-hero-top .detail-atelier-mini-link:active {
  transform: none;
}

.detail-atelier-compose-card {
  background:
    linear-gradient(180deg, rgba(255, 250, 244, 0.96), rgba(255, 255, 255, 0.76)),
    radial-gradient(circle at top right, rgba(216, 231, 220, 0.24), transparent 24%),
    radial-gradient(circle at bottom left, rgba(241, 214, 202, 0.2), transparent 26%);
}

.detail-atelier-thread-card {
  background:
    linear-gradient(180deg, rgba(255, 249, 243, 0.96), rgba(255, 255, 255, 0.74)),
    radial-gradient(circle at top right, rgba(226, 193, 206, 0.16), transparent 28%);
}

.detail-atelier-image-card {
  align-content: start;
  background:
    linear-gradient(180deg, rgba(255, 249, 243, 0.97), rgba(255, 255, 255, 0.76)),
    radial-gradient(circle at bottom right, rgba(216, 231, 220, 0.18), transparent 28%);
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
  color: #281c17;
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
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
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
  color: rgba(61, 46, 40, 0.76);
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
  color: rgba(61, 46, 40, 0.62);
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
  border: 1px solid rgba(126, 96, 76, 0.1);
  background: rgba(255, 255, 255, 0.62);
}

.detail-atelier-meta-item strong {
  color: #2e1f19;
  font-family: var(--font-heading);
  font-size: var(--type-l6-size);
  font-weight: 600;
  line-height: var(--type-l6-line);
  letter-spacing: var(--type-l6-spacing);
}

.detail-atelier-chip-row-primary {
  padding-bottom: 0.1rem;
}

.detail-atelier-action-row {
  align-items: end;
  padding-top: 0.1rem;
}

.detail-atelier-action-copy {
  gap: 0.34rem;
  max-width: 24rem;
}

.detail-atelier-action-copy span {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(70, 53, 45, 0.68);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.detail-atelier-action-copy p,
.detail-atelier-danger-copy {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(76, 59, 50, 0.62);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-danger-copy-block {
  display: grid;
  gap: 0.42rem;
}

.detail-atelier-action-buttons {
  justify-content: flex-start;
}

.detail-atelier-action-row .detail-atelier-primary,
.detail-atelier-action-row .detail-atelier-secondary {
  min-width: 9.5rem;
}

.detail-atelier-danger-row {
  gap: 0.64rem;
  padding-top: 0.78rem;
  border-top: 1px dashed rgba(126, 96, 76, 0.16);
}

.detail-atelier-tools-card {
  background: rgba(255, 252, 247, 0.82);
}

.detail-atelier-tools-section {
  display: grid;
  gap: 0.6rem;
  padding-top: 0.78rem;
  border-top: 1px dashed rgba(126, 96, 76, 0.16);
}

.detail-atelier-tools-copy {
  display: grid;
  gap: 0.28rem;
}

.detail-atelier-tools-copy span {
  margin: 0;
  color: rgba(70, 53, 45, 0.68);
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
  color: rgba(76, 59, 50, 0.62);
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
  color: rgba(76, 59, 50, 0.62);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-danger-summary::-webkit-details-marker {
  display: none;
}

.detail-atelier-danger-summary span {
  color: rgba(70, 53, 45, 0.56);
}

.detail-atelier-danger-summary strong {
  color: rgba(122, 77, 64, 0.78);
  font-weight: 500;
}

.detail-atelier-danger-details[open] .detail-atelier-danger-summary {
  padding-bottom: 0.56rem;
}

.detail-atelier-danger-actions {
  justify-content: flex-end;
  align-items: center;
}

.detail-atelier-tools-actions {
  justify-content: flex-start;
  align-items: center;
}

.detail-atelier-danger-chip {
  min-height: 38px;
  background: rgba(249, 238, 232, 0.84);
  color: rgba(122, 77, 64, 0.88);
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

.detail-atelier-mobile-summary-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.58rem;
}

.detail-atelier-mobile-progress-glance {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.58rem;
}

.detail-atelier-summary-card-featured {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 248, 241, 0.7)),
    radial-gradient(circle at top right, rgba(241, 214, 202, 0.2), transparent 26%);
}

.detail-atelier-summary-card strong,
.detail-atelier-balance-card strong,
.detail-atelier-member-card strong,
.detail-atelier-choice-card strong,
.detail-atelier-star-card strong {
  color: #2e1f19;
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

.detail-atelier-overview-card.is-warm {
  background:
    linear-gradient(180deg, rgba(255, 249, 241, 0.96), rgba(255, 255, 255, 0.74)),
    radial-gradient(circle at top right, rgba(232, 216, 166, 0.26), transparent 26%);
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(250, 243, 235, 0.72));
}

.detail-atelier-progress-quick-action {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.82rem;
  align-items: center;
  padding: 0.88rem 0.92rem;
  border-radius: 20px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.68);
}

.detail-atelier-progress-quick-copy {
  display: grid;
  gap: 0.22rem;
}

.detail-atelier-progress-quick-copy strong {
  color: #2e1f19;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.detail-atelier-progress-quick-copy p {
  margin: 0;
  color: rgba(76, 59, 50, 0.62);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-progress-primary {
  min-width: 10rem;
}

.detail-atelier-overview-card.is-warm .detail-atelier-meter-card {
  background:
    linear-gradient(180deg, rgba(255, 250, 244, 0.9), rgba(255, 244, 236, 0.78)),
    radial-gradient(circle at top right, rgba(232, 216, 166, 0.2), transparent 28%);
}

.detail-atelier-progress-track {
  position: relative;
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(79, 49, 35, 0.08);
}

.detail-atelier-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(215, 133, 95, 0.9), rgba(216, 231, 220, 0.92));
}

.detail-atelier-progress-fill.is-warm {
  background: linear-gradient(135deg, rgba(215, 133, 95, 0.92), rgba(232, 216, 166, 0.92));
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
  border-top: 1px solid rgba(126, 96, 76, 0.1);
}

.detail-atelier-compose-attachment-copy {
  gap: 0.28rem;
}

.detail-atelier-compose-attachment-copy p,
.detail-atelier-compose-author-note {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(76, 59, 50, 0.62);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-compose-submit-row {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.62rem 0.82rem;
  align-items: center;
}

.detail-atelier-compose-attachment-panel {
  padding: 0.72rem 0.78rem;
  border-radius: 18px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.56);
}

.detail-atelier-compose-attachment-details.is-disabled {
  background: rgba(250, 244, 237, 0.54);
}

.detail-atelier-compose-attachment-panel.is-disabled {
  background: rgba(250, 244, 237, 0.54);
}

.detail-atelier-upload-unavailable {
  display: inline-flex;
  width: fit-content;
  min-height: 36px;
  align-items: center;
  padding: 0.4rem 0.72rem;
  border-radius: 999px;
  border: 1px dashed rgba(126, 96, 76, 0.18);
  color: rgba(76, 59, 50, 0.62);
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
  background: rgba(255, 255, 255, 0.9);
}

.detail-atelier-compose-card textarea {
  min-height: 112px;
}

.detail-atelier-progress-log-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  width: fit-content;
  color: rgba(76, 59, 50, 0.72);
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
  border: 1px solid rgba(126, 96, 76, 0.1);
  background: rgba(255, 255, 255, 0.6);
}

.detail-atelier-step-manage-row span {
  color: #2e1f19;
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
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.72);
}

.detail-atelier-step-card.done {
  background: rgba(216, 231, 220, 0.28);
}

.detail-atelier-step-copy {
  display: grid;
  gap: 0.28rem;
}

.detail-atelier-step-copy strong {
  color: #2e1f19;
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
  border: 1px solid rgba(126, 96, 76, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 252, 248, 0.92), rgba(255, 247, 239, 0.68)),
    radial-gradient(circle at top right, rgba(232, 216, 166, 0.14), transparent 30%);
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
  color: rgba(70, 53, 45, 0.68);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
  text-transform: uppercase;
}

.detail-atelier-image-toolbar-copy p {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(76, 59, 50, 0.74);
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
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.66);
}

.detail-atelier-image-memory-card span,
.detail-atelier-image-memory-note span {
  margin: 0;
  color: rgba(70, 53, 45, 0.66);
  font-size: var(--type-l7-size);
  letter-spacing: var(--type-l7-spacing);
  text-transform: uppercase;
}

.detail-atelier-image-memory-card strong {
  color: #2e1f19;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: var(--type-l5-line);
  letter-spacing: var(--type-button-tracking);
}

.detail-atelier-image-memory-card p {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(76, 59, 50, 0.72);
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
    linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(250, 243, 235, 0.8));
}

.detail-atelier-image-figure.is-cover {
  order: -1;
  grid-column: 1 / -1;
  grid-template-columns: minmax(0, 1.14fr) minmax(250px, 0.86fr);
  align-items: start;
  box-shadow: 0 0 0 2px rgba(201, 111, 74, 0.16) inset;
  background:
    linear-gradient(180deg, rgba(255, 250, 246, 0.94), rgba(255, 244, 237, 0.82)),
    radial-gradient(circle at top right, rgba(241, 214, 202, 0.24), transparent 28%);
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
  color: #2e1f19;
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
  border: 1px solid rgba(126, 96, 76, 0.1);
  background: rgba(244, 237, 229, 0.62);
}

.detail-atelier-image-memory-note.is-empty {
  background: rgba(255, 255, 255, 0.6);
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
  color: rgba(70, 53, 45, 0.58);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  font-weight: 600;
  line-height: var(--type-l7-line);
  letter-spacing: var(--type-l7-spacing);
  text-transform: uppercase;
}

.detail-atelier-mobile-thread-more-summary strong {
  color: rgba(57, 41, 34, 0.82);
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
  color: rgba(76, 59, 50, 0.72);
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
  color: rgba(76, 59, 50, 0.62);
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
  color: rgba(76, 59, 50, 0.56);
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

.detail-atelier-reaction-button.active {
  background: rgba(210, 121, 87, 0.14);
  border-color: rgba(210, 121, 87, 0.24);
  box-shadow: 0 10px 20px rgba(201, 111, 74, 0.1);
}

.detail-atelier-reaction-button.is-pending {
  background: rgba(243, 222, 210, 0.72);
  border-color: rgba(201, 111, 74, 0.24);
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
  color: rgba(76, 59, 50, 0.72);
}

.detail-atelier-reaction-count.is-empty {
  opacity: 0.24;
}

.detail-atelier-reaction-count.is-loading {
  color: #9f5d50;
  opacity: 1;
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
  background: rgba(210, 121, 87, 0.12);
  border-color: rgba(210, 121, 87, 0.22);
}

.detail-atelier-overlay {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1.5rem;
  background: rgba(36, 27, 22, 0.34);
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
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
}

.detail-atelier-lightbox-image {
  width: 100%;
  max-height: 68vh;
  object-fit: contain;
  border-radius: 22px;
  background: rgba(251, 244, 234, 0.9);
}

.detail-atelier-feedback {
  margin: 0;
  padding: 0.68rem 0.78rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.68);
  color: rgba(61, 46, 40, 0.72);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.detail-atelier-feedback.success {
  color: var(--success);
  border-color: rgba(75, 129, 96, 0.18);
  background: rgba(226, 239, 229, 0.72);
}

.detail-atelier-feedback.danger {
  color: var(--danger);
  border-color: rgba(142, 91, 73, 0.18);
  background: rgba(249, 238, 232, 0.8);
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
  .detail-atelier-action-row,
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
  }

  .detail-atelier-mobile-glance {
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 0.72rem;
    padding: 0.78rem;
    border-radius: 20px;
  }

  .detail-atelier-mobile-glance-copy {
    gap: 0.34rem;
  }

  .detail-atelier-mobile-summary-grid {
    grid-template-columns: 1fr;
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

  .detail-atelier-action-buttons {
    width: 100%;
  }

  .detail-atelier-action-buttons .detail-atelier-primary,
  .detail-atelier-action-buttons .detail-atelier-secondary {
    flex: 1 1 100%;
    min-width: 0;
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
    gap: 0.42rem;
  }

  .detail-atelier-compose-card .detail-atelier-section-copy {
    gap: 0.18rem;
  }

  .detail-atelier-compose-card .detail-atelier-support-wide {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;
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

  .detail-atelier-compose-attachment-details {
    gap: 0.44rem;
    padding: 0.62rem 0.68rem;
    border-radius: 16px;
  }

  .detail-atelier-compose-attachment-details .detail-atelier-mobile-more-summary {
    gap: 0.48rem;
    align-items: center;
  }

  .detail-atelier-compose-attachment-details .detail-atelier-mobile-more-summary strong {
    line-height: 1.28;
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
    color: #2e1f19;
    font-family: var(--font-heading);
    font-size: var(--type-l5-size);
    font-weight: 600;
    line-height: 1.34;
    letter-spacing: 0;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .detail-atelier-mobile-thread-title time {
    color: rgba(76, 59, 50, 0.58);
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
  }

  .detail-atelier-mobile-thread-more {
    gap: 0.42rem;
  }

  .detail-atelier-mobile-thread-more-summary {
    padding-top: 0.1rem;
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

  .detail-atelier-reaction-button {
    min-height: 38px;
    padding: 0.42rem 0.68rem;
  }

  .detail-atelier-lightbox-stage {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.55rem;
    align-items: stretch;
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
</style>
