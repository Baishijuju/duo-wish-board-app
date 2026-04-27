<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useWishStore } from '../stores/wishes'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const wishStore = useWishStore()

const selectedWish = computed(() => {
  return wishStore.findById(String(route.params.id ?? ''))
})

const draftAuthorId = ref(authStore.currentMember?.id ?? authStore.members[0]?.id ?? '')
const draftMessage = ref('')
const commentFeedback = ref('')
const commentFeedbackTone = ref<'success' | 'danger'>('success')
const isSubmittingComment = ref(false)
const lastFailedCommentDraft = ref('')
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

const previewImages = computed(() => selectedWish.value?.images ?? [])
const deletableImageCount = computed(() => selectedWish.value?.images.filter((image) => canDeleteImage(image.createdBy)).length ?? 0)
const previewImageIndex = computed(() => {
  if (!previewImageId.value) {
    return -1
  }

  return previewImages.value.findIndex((image) => image.id === previewImageId.value)
})

const previewImage = computed(() => {
  return previewImageIndex.value >= 0 ? previewImages.value[previewImageIndex.value] ?? null : null
})

const canPreviewPrevious = computed(() => previewImageIndex.value > 0)
const canPreviewNext = computed(() => previewImageIndex.value >= 0 && previewImageIndex.value < previewImages.value.length - 1)
const canRetryComment = computed(() => !!(lastFailedCommentDraft.value || draftMessage.value.trim()) && !isSubmittingComment.value)

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

    if (!previewImageId.value) {
      return
    }

    if (!selectedWish.value?.images.some((image) => image.id === previewImageId.value)) {
      previewImageId.value = selectedWish.value?.images[0]?.id ?? null
    }
  },
)

watch(previewImageId, (imageId) => {
  if (typeof document === 'undefined') {
    return
  }

  document.body.style.overflow = imageId ? 'hidden' : ''
})

function getMemberName(memberId: string) {
  return authStore.members.find((member) => member.id === memberId)?.displayName ?? '未命名成员'
}

function canDeleteImage(createdBy: string) {
  return createdBy === authStore.currentMemberId
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
    const result = await wishStore.addComment(selectedWish.value.id, draftAuthorId.value, messageToSend)

    commentFeedback.value = result.message
    commentFeedbackTone.value = result.ok ? 'success' : 'danger'

    if (!result.ok) {
      lastFailedCommentDraft.value = messageToSend
      return
    }

    draftMessage.value = ''
    lastFailedCommentDraft.value = ''
  } finally {
    isSubmittingComment.value = false
  }
}

async function retryComment() {
  if (!draftMessage.value.trim() && lastFailedCommentDraft.value) {
    draftMessage.value = lastFailedCommentDraft.value
  }

  await submitComment()
}

async function deleteWish() {
  if (!selectedWish.value) {
    return
  }

  const deleted = await wishStore.deleteWish(selectedWish.value.id)

  if (!deleted) {
    return
  }

  router.push({ name: 'list' })
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

function openImagePreview(imageId: string) {
  previewImageId.value = imageId
}

function closeImagePreview() {
  previewImageId.value = null
}

function stepPreview(offset: -1 | 1) {
  const nextIndex = previewImageIndex.value + offset
  const nextImage = previewImages.value[nextIndex]

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

function handlePreviewKeydown(event: KeyboardEvent) {
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
    window.addEventListener('keydown', handlePreviewKeydown)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handlePreviewKeydown)
  }

  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})
</script>

<template>
  <section v-if="selectedWish" class="page-stack detail-page">
    <article class="page-card detail-hero-card">
      <div class="detail-hero-top">
        <div class="detail-hero-copy">
          <div class="badge-row">
            <span class="badge">{{ selectedWish.scope === 'shared' ? '共同愿望' : '私密愿望' }}</span>
            <span class="badge">{{ selectedWish.category }}</span>
            <span class="badge">{{ selectedWish.priority }}</span>
            <span class="badge">{{ selectedWish.status === 'done' ? '已完成' : '进行中' }}</span>
            <span class="badge">{{ selectedWish.starred ? '已点亮' : '未点亮' }}</span>
          </div>

          <div>
            <p class="eyebrow">Wish Detail</p>
            <h2 class="section-title">{{ selectedWish.title }}</h2>
            <p class="section-copy detail-lead">
              {{ selectedWish.note || '先留一个短标题也没关系，后面还可以在这里补充动机、背景和下一步。' }}
            </p>
            <p class="muted">{{ wishStore.syncMessage }}</p>
          </div>
        </div>

        <div class="detail-meta-grid">
          <article class="stat-card">
            <span>创建人</span>
            <strong>{{ getMemberName(selectedWish.ownerId) }}</strong>
          </article>
          <article class="stat-card">
            <span>截止日期</span>
            <strong>{{ selectedWish.dueDate || '未设置' }}</strong>
          </article>
          <article class="stat-card">
            <span>图片数量</span>
            <strong>{{ selectedWish.images.length }}</strong>
          </article>
          <article class="stat-card">
            <span>留言条数</span>
            <strong>{{ selectedWish.comments.length }}</strong>
          </article>
        </div>
      </div>

      <div class="button-row detail-action-bar">
        <RouterLink class="button-link" :to="{ name: 'list' }">返回清单</RouterLink>
        <button class="button-subtle" type="button" @click="void wishStore.toggleStar(selectedWish.id)">
          {{ selectedWish.starred ? '取消点亮' : '点亮这条愿望' }}
        </button>
        <button class="button-subtle" type="button" @click="void wishStore.toggleDone(selectedWish.id)">
          {{ selectedWish.status === 'done' ? '改回进行中' : '标记完成' }}
        </button>
        <button class="button-subtle danger-button" type="button" @click="deleteWish">删除愿望</button>
      </div>
    </article>

    <div class="split-grid detail-content-grid">
      <article class="page-card image-studio-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Image Studio</p>
            <h2 class="section-title image-title">图片与纪念</h2>
          </div>
          <div class="badge-row">
            <span class="badge">{{ selectedWish.images.length }} 张</span>
            <span v-if="selectedWish.images.length" class="badge">首图会同步到首页与清单</span>
          </div>
        </div>

        <div class="stack-item image-guide-card">
          <p>
            {{ wishStore.isUsingCloudWishes ? '支持 JPG / PNG / WEBP / GIF。上传前会自动做温和压缩：优先保证手机端看图清楚，同时尽量把体积压到更适合免费空间长期使用的范围。' : '图片上传仅在 Supabase 云端空间中可用。' }}
          </p>
          <p v-if="selectedWish.images.length">桌面端可以直接拖动图片卡片调整顺序，手机端更适合用“设为首图”、备注和批量选择来管理。</p>
          <p v-if="selectedWish.images.length">点击任意图片会进入放大预览，左右切换仍然保留。</p>
        </div>

        <div class="image-toolbar">
          <div v-if="wishStore.isUsingCloudWishes" class="button-row">
            <label class="button-subtle upload-trigger">
              <input
                class="visually-hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                @change="handleImageSelection"
              />
              {{ isUploadingImages ? '上传中...' : '添加图片' }}
            </label>
          </div>

          <div v-if="deletableImageCount" class="button-row image-management-row">
            <button class="button-subtle" type="button" @click="isSelectingImages ? cancelImageSelection() : beginImageSelection()">
              {{ isSelectingImages ? '取消批量选择' : '批量删除' }}
            </button>
            <span v-if="isSelectingImages" class="muted">已选择 {{ selectedImageIds.length }} 张</span>
            <button
              v-if="isSelectingImages"
              class="button-subtle danger-button"
              type="button"
              :disabled="!selectedImageIds.length || isDeletingSelectedImages"
              @click="void deleteSelectedImages()"
            >
              {{ isDeletingSelectedImages ? '删除中...' : `删除选中${selectedImageIds.length ? ` ${selectedImageIds.length} 张` : ''}` }}
            </button>
          </div>
        </div>

        <div v-if="selectedWish.images.length" class="image-grid">
          <figure
            v-for="image in selectedWish.images"
            :key="image.id"
            :class="['image-card', { 'is-cover-image': isCoverImage(image.id), 'is-dragging-image': isDraggedImage(image.id), 'is-drop-target-image': isDropTargetImage(image.id) }]"
            :draggable="!isSelectingImages && !isReorderingImages"
            @dragend="handleImageDragEnd"
            @dragenter.prevent="handleImageDragEnter(image.id)"
            @dragover.prevent
            @dragstart="handleImageDragStart(image.id)"
            @drop.prevent="void handleImageDrop(image.id)"
          >
            <button v-if="image.url" class="image-preview-button" type="button" @click="openImagePreview(image.id)">
              <img class="image-preview" :src="image.url" :alt="image.fileName" draggable="false" />
            </button>
            <div v-else class="image-placeholder">图片链接准备中</div>

            <figcaption class="image-caption">
              <div class="image-caption-head">
                <strong>{{ image.fileName }}</strong>
                <span v-if="isCoverImage(image.id)" class="badge cover-badge">当前首图</span>
              </div>
              <span class="muted">{{ formatFileSize(image.sizeBytes) }}</span>
            </figcaption>

            <p v-if="image.note" class="image-note">{{ image.note }}</p>
            <p v-else class="muted image-note-placeholder">还没有备注</p>

            <div v-if="editingImageNoteId === image.id" class="image-note-editor">
              <label>
                <span class="muted">图片备注</span>
                <textarea v-model="imageNoteDraft" rows="3" maxlength="240" placeholder="补充这张图的地点、想法、来源或纪念意义"></textarea>
              </label>
              <div class="button-row">
                <button class="button-subtle" type="button" @click="cancelEditingImageNote">取消</button>
                <button class="button-solid" type="button" :disabled="isSavingImageNote" @click="void saveImageNote(image.id)">
                  {{ isSavingImageNote ? '保存中...' : '保存备注' }}
                </button>
              </div>
            </div>

            <div class="button-row image-card-actions">
              <span class="muted drag-tip">{{ isSelectingImages ? '批量选择中' : '拖动排序' }}</span>
              <button
                v-if="isSelectingImages && canDeleteImage(image.createdBy)"
                :class="['button-subtle', { 'selection-button-active': isImageSelected(image.id) }]"
                type="button"
                @click="toggleImageSelection(image.id)"
              >
                {{ isImageSelected(image.id) ? '取消选中' : '选中删除' }}
              </button>
              <button
                v-else-if="!isSelectingImages"
                class="button-subtle"
                type="button"
                @click="startEditingImageNote(image.id, image.note)"
              >
                {{ image.note ? '编辑备注' : '添加备注' }}
              </button>
              <button v-if="!isSelectingImages && !isCoverImage(image.id)" class="button-subtle" type="button" @click="void setCoverImage(image.id)">
                设为首图
              </button>
              <button v-if="!isSelectingImages && canDeleteImage(image.createdBy)" class="button-subtle danger-button" type="button" @click="void deleteImage(image.id)">
                删除图片
              </button>
            </div>
          </figure>
        </div>

        <div v-else class="stack-item empty-media-card">
          <h3>还没有图片</h3>
          <p>可以给这条愿望上传灵感参考图、行程截图，或者后续完成过程中的纪念照片。</p>
        </div>
      </article>

      <article class="page-card thread-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Thread</p>
            <h2 class="section-title thread-title">愿望详情下留言</h2>
          </div>
          <span class="badge">{{ selectedWish.comments.length }} 条</span>
        </div>

        <div class="stack-list thread-list">
          <div v-if="!selectedWish.comments.length" class="stack-item empty-thread-card">
            <h3>还没有留言</h3>
            <p>现在这里的留言已经会跟随当前空间自动同步，你可以直接把下一步、提醒或者临时想法留在这里。</p>
          </div>

          <div v-for="comment in selectedWish.comments" :key="comment.id" class="comment-card-surface">
            <div class="comment-meta">
              <span class="badge">{{ getMemberName(comment.authorId) }}</span>
              <time class="muted">{{ comment.createdAt.replace('T', ' ').slice(0, 16) }}</time>
            </div>
            <p>{{ comment.message }}</p>
          </div>
        </div>

        <form class="comment-form" @submit.prevent="submitComment">
          <label v-if="!wishStore.isUsingCloudWishes">
            <span class="muted">以谁的身份留言</span>
            <select v-model="draftAuthorId" :disabled="isSubmittingComment">
              <option v-for="member in authStore.members" :key="member.id" :value="member.id">{{ member.displayName }}</option>
            </select>
          </label>
          <div v-else class="stack-item compact-author-card">
            <span class="muted">当前留言身份</span>
            <strong>{{ authStore.currentMember?.displayName || '当前成员' }}</strong>
          </div>
          <label class="comment-message-field">
            <span class="muted">留言内容</span>
            <textarea v-model="draftMessage" rows="4" maxlength="180" :disabled="isSubmittingComment" placeholder="例如：这周末一起把这条愿望拆成三个小步骤"></textarea>
          </label>
          <div class="button-row comment-actions-row">
            <button class="button-solid" type="submit" :disabled="!draftMessage.trim() || isSubmittingComment">
              {{ isSubmittingComment ? '发送中...' : '发送留言' }}
            </button>
            <button v-if="commentFeedbackTone === 'danger' && canRetryComment" class="button-subtle" type="button" @click="void retryComment()">
              重试发送
            </button>
          </div>
          <p v-if="commentFeedback" :class="['comment-feedback', commentFeedbackTone]">{{ commentFeedback }}</p>
        </form>
      </article>
    </div>
  </section>

  <article v-else class="page-card empty-card">
    <p class="eyebrow">Wish Detail</p>
    <h2 class="section-title">没有找到这条愿望</h2>
    <p class="section-copy">可能是路由参数不对，或者这条数据还没从云端同步进来。</p>
  </article>

  <div v-if="previewImage" class="lightbox-overlay" @click.self="closeImagePreview">
    <div class="lightbox-panel page-card">
      <div class="lightbox-toolbar">
        <div>
          <p class="eyebrow">Image Preview</p>
          <h3 class="section-title lightbox-title">{{ previewImage.fileName }}</h3>
        </div>
        <button class="button-subtle" type="button" @click="closeImagePreview">关闭</button>
      </div>

      <div class="lightbox-stage">
        <button class="button-subtle lightbox-nav" type="button" :disabled="!canPreviewPrevious" @click="stepPreview(-1)">
          上一张
        </button>
        <img class="lightbox-image" :src="previewImage.url" :alt="previewImage.fileName" />
        <button class="button-subtle lightbox-nav" type="button" :disabled="!canPreviewNext" @click="stepPreview(1)">
          下一张
        </button>
      </div>

      <div class="lightbox-footer muted">
        <span>{{ previewImageIndex + 1 }} / {{ previewImages.length }}</span>
        <span>{{ formatFileSize(previewImage.sizeBytes) }}</span>
      </div>
      <p class="lightbox-note">{{ previewImage.note || '这张图还没有备注。' }}</p>
    </div>
  </div>
</template>

<style scoped>
.page-stack {
  display: grid;
  gap: 1rem;
}

.detail-hero-card,
.image-studio-card,
.thread-card,
.thread-list {
  display: grid;
  gap: 1rem;
}

.section-heading,
.comment-meta,
.lightbox-toolbar,
.lightbox-footer,
.image-caption-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}

.detail-hero-card {
  background:
    linear-gradient(135deg, rgba(255, 247, 237, 0.95), rgba(255, 242, 227, 0.8)),
    linear-gradient(160deg, rgba(219, 107, 87, 0.14), transparent 50%);
}

.detail-hero-top {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: 1rem;
}

.detail-hero-copy,
.detail-meta-grid,
.image-note-editor,
.comment-form,
.image-guide-card {
  display: grid;
  gap: 1rem;
}

.detail-meta-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-lead,
.image-note,
.image-note-placeholder,
.lightbox-note,
.comment-card-surface p,
.image-guide-card p,
.empty-media-card p,
.empty-thread-card p {
  margin: 0;
  line-height: 1.75;
  white-space: pre-wrap;
}

.detail-action-bar {
  align-items: center;
}

.image-title,
.thread-title {
  margin-bottom: 0;
  font-size: clamp(1.7rem, 2.7vw, 2.2rem);
}

.image-guide-card {
  background: rgba(255, 255, 255, 0.66);
}

.upload-trigger {
  position: relative;
  cursor: pointer;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.image-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.image-card {
  position: relative;
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 0.9rem;
  border-radius: 20px;
  border: 1px solid rgba(79, 49, 35, 0.08);
  background: rgba(255, 255, 255, 0.62);
  box-shadow: var(--shadow-soft);
}

.image-card::after {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  border-radius: 20px 20px 0 0;
  background: linear-gradient(135deg, rgba(241, 166, 97, 0.88), rgba(46, 142, 131, 0.78));
  opacity: 0.7;
}

.image-card.is-cover-image {
  border-color: rgba(185, 120, 53, 0.42);
  box-shadow: 0 12px 28px rgba(185, 120, 53, 0.12);
}

.image-card.is-dragging-image {
  opacity: 0.55;
}

.image-card.is-drop-target-image {
  border-color: rgba(47, 138, 128, 0.4);
  box-shadow: 0 12px 28px rgba(47, 138, 128, 0.12);
}

.image-preview-button {
  display: block;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: 16px;
  overflow: hidden;
}

.image-preview,
.image-placeholder {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 16px;
}

.image-preview {
  object-fit: cover;
  background: rgba(255, 255, 255, 0.9);
}

.image-placeholder {
  display: grid;
  place-items: center;
  color: var(--text-soft);
  background: rgba(239, 226, 207, 0.48);
}

.image-caption {
  display: grid;
  gap: 0.3rem;
}

.image-note-editor label {
  display: grid;
  gap: 0.55rem;
}

.image-caption strong {
  overflow-wrap: anywhere;
}

.cover-badge {
  white-space: nowrap;
}

.drag-tip {
  margin-right: auto;
  align-self: center;
}

.image-management-row {
  align-items: center;
}

.selection-button-active {
  background: rgba(197, 106, 77, 0.14);
  border-color: rgba(197, 106, 77, 0.26);
}

.image-card-actions {
  align-items: center;
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 1.2rem;
  background: rgba(25, 17, 21, 0.7);
  backdrop-filter: blur(12px);
}

.lightbox-panel {
  width: min(1100px, 100%);
  display: grid;
  gap: 1rem;
}

.lightbox-title {
  margin-bottom: 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.lightbox-stage {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
}

.lightbox-image {
  width: 100%;
  max-height: min(72vh, 900px);
  object-fit: contain;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
}

.lightbox-nav:disabled {
  opacity: 0.45;
  cursor: default;
  transform: none;
}

.comment-card-surface {
  display: grid;
  gap: 0.7rem;
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(79, 49, 35, 0.08);
  background: rgba(255, 255, 255, 0.62);
  box-shadow: var(--shadow-soft);
}

.danger-button {
  color: #8e3c31;
}

.compact-author-card {
  display: grid;
  gap: 0.4rem;
  align-content: start;
}

.comment-form {
  padding: 1rem;
  border-radius: 22px;
  border: 1px solid rgba(79, 49, 35, 0.08);
  background: rgba(255, 255, 255, 0.62);
}

.comment-actions-row {
  align-items: center;
}

.comment-feedback {
  margin: 0;
  line-height: 1.7;
}

.comment-feedback.success {
  color: var(--success);
}

.comment-feedback.danger {
  color: #8e3c31;
}

.comment-form label {
  display: grid;
  gap: 0.55rem;
}

.empty-card {
  display: grid;
  gap: 0.7rem;
}

.empty-media-card,
.empty-thread-card {
  align-content: start;
}

@media (max-width: 1080px) {
  .detail-hero-top,
  .detail-meta-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .section-heading,
  .comment-meta,
  .image-caption-head,
  .image-toolbar,
  .image-management-row,
  .lightbox-toolbar,
  .lightbox-footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .lightbox-stage {
    grid-template-columns: 1fr;
  }

  .lightbox-nav,
  .image-card-actions > * {
    width: 100%;
  }

  .image-card-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .drag-tip {
    margin-right: 0;
  }

  .lightbox-overlay {
    padding: 0.85rem;
  }
}
</style>