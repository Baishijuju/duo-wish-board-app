<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useComposePreviewState } from '../composables/useComposePreviewState'

const {
  addInitialStepField,
  applyCategory,
  cancelEditing,
  categorySuggestions,
  composerHeadline,
  composerLead,
  draft,
  draftNotePreview,
  draftTitlePreview,
  dueDateLabel,
  editingWish,
  feedbackMessage,
  feedbackTone,
  initialStepCount,
  initialStepDrafts,
  progressOptions,
  progressSummary,
  priorityOptions,
  removeInitialStepField,
  scopeOptions,
  selectedOwnerLabel,
  selectedPriorityLabel,
  selectedProgressLabel,
  selectedScopeLabel,
  submitWish,
  viewerName,
} = useComposePreviewState({ allowEditing: true })

const feedbackToneClass = computed(() => {
  return `compose-preview-feedback-${feedbackTone.value}`
})

const isSupplementaryOpen = ref(false)

watch(
  () => editingWish.value?.id ?? '',
  (wishId) => {
    isSupplementaryOpen.value = !!wishId
  },
  { immediate: true },
)

const stepPreview = computed(() => {
  return initialStepDrafts.value.map((step) => step.trim()).filter(Boolean).slice(0, 4)
})

const shouldShowSummaryStage = computed(() => {
  return isSupplementaryOpen.value || !!editingWish.value
})

const supplementaryToggleLabel = computed(() => {
  return isSupplementaryOpen.value ? '先写到这里' : '再补一些细节'
})

const sideLead = computed(() => {
  if (editingWish.value) {
    return '这里只改基本信息；步骤、图片和留言继续回详情页。'
  }

  return '先写下名字和一句心情，这条愿望就已经开始了。'
})

const submitButtonLabel = computed(() => {
  return editingWish.value ? '保存这次整理' : '先写下这条愿望'
})

const previewStageTitle = computed(() => {
  return editingWish.value ? '这页整理后会变成这样' : '补充之后，这页会慢慢变成这样'
})

function toggleSupplementaryFields() {
  if (editingWish.value) {
    return
  }

  isSupplementaryOpen.value = !isSupplementaryOpen.value
}
</script>

<template>
  <section class="compose-preview-page compose-live-page">
    <article class="compose-preview-shell page-card">
      <header class="compose-preview-hero">
        <div class="compose-preview-hero-copy">
          <p class="eyebrow">{{ editingWish ? '整理这一页愿望' : '写下这条愿望' }}</p>
          <h1>
            <span class="compose-atelier-hero-name">{{ viewerName }}</span>
            <span class="compose-atelier-hero-headline">{{ composerHeadline }}</span>
          </h1>
          <p class="compose-preview-hero-copy-note">{{ composerLead }}</p>
        </div>
        <p class="compose-preview-lead">{{ sideLead }}</p>
      </header>

      <div class="compose-preview-grid" :class="{ 'is-single-stage': !shouldShowSummaryStage }">
        <form id="compose-atelier-form" class="compose-preview-form-stage" @submit.prevent="submitWish">
          <section class="compose-preview-core-stage">
            <label class="compose-field compose-field-title">
              <span>愿望名字</span>
              <input v-model="draft.title" type="text" maxlength="36" placeholder="例如：一起去看海边的日出" />
            </label>

            <label class="compose-field">
              <span>一句心情</span>
              <textarea
                v-model="draft.note"
                rows="3"
                maxlength="180"
                placeholder="先留一句就够，比如为什么现在想把它写下来。"
              />
            </label>

            <div class="compose-preview-primary-actions">
              <button type="submit" class="compose-primary-button compose-primary-button-inline">
                {{ submitButtonLabel }}
              </button>
              <button
                v-if="!editingWish"
                type="button"
                class="compose-secondary-button"
                @click="toggleSupplementaryFields()"
              >
                {{ supplementaryToggleLabel }}
              </button>
              <button v-else type="button" class="compose-secondary-button" @click="cancelEditing()">
                回详情页
              </button>
            </div>

            <p v-if="feedbackMessage" class="compose-preview-feedback" :class="feedbackToneClass" role="status" aria-live="polite">{{ feedbackMessage }}</p>
          </section>

          <section v-if="isSupplementaryOpen || editingWish" class="compose-preview-supplementary-stage">
            <header class="compose-preview-supplementary-head">
              <div>
                <p class="eyebrow">补充这条愿望</p>
                <h2>这些都可以慢一点再决定</h2>
              </div>
              <button v-if="!editingWish" type="button" class="compose-inline-action" @click="toggleSupplementaryFields()">
                先写到这里
              </button>
            </header>

            <div class="compose-preview-chip-row" aria-label="分类建议">
              <button
                v-for="category in categorySuggestions"
                :key="category"
                type="button"
                class="compose-chip"
                :class="{ active: draft.category === category }"
                @click="applyCategory(category)"
              >
                {{ category }}
              </button>
            </div>

            <label class="compose-field compact">
              <span>分类</span>
              <input v-model="draft.category" type="text" maxlength="20" placeholder="旅行 / 生活 / 成长" />
            </label>

            <section class="compose-preview-section">
              <header class="compose-preview-section-head">
                <div>
                  <p class="eyebrow">一起怎么看这条愿望</p>
                  <h2>先决定它要不要一起被看见</h2>
                </div>
                <span>{{ selectedScopeLabel }}</span>
              </header>

              <div class="compose-preview-option-grid">
                <button
                  v-for="option in scopeOptions"
                  :key="option.value"
                  type="button"
                  class="compose-option-card"
                  :class="{ active: draft.scope === option.value }"
                  @click="draft.scope = option.value"
                >
                  <strong>{{ option.label }}</strong>
                </button>
              </div>
            </section>

            <section class="compose-preview-section compact">
              <header class="compose-preview-section-head">
                <div>
                  <p class="eyebrow">想先把它放在哪</p>
                  <h2>给它一个靠近生活的位置</h2>
                </div>
                <span>{{ selectedPriorityLabel }}</span>
              </header>

              <div class="compose-preview-member-row priority-row">
                <button
                  v-for="option in priorityOptions"
                  :key="option.value"
                  type="button"
                  class="compose-member-chip"
                  :class="{ active: draft.priority === option.value }"
                  @click="draft.priority = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </section>

            <section class="compose-preview-section">
              <header class="compose-preview-section-head">
                <div>
                  <p class="eyebrow">慢慢靠近的方式</p>
                  <h2>等你愿意时，再决定怎么记进度</h2>
                </div>
                <span>{{ selectedProgressLabel }}</span>
              </header>

              <div class="compose-preview-option-grid compact">
                <button
                  v-for="option in progressOptions"
                  :key="option.value"
                  type="button"
                  class="compose-option-card"
                  :class="{ active: draft.progressMode === option.value }"
                  @click="draft.progressMode = option.value"
                >
                  <strong>{{ option.label }}</strong>
                </button>
              </div>

              <div v-if="draft.progressMode === 'count'" class="compose-preview-count-grid">
                <label v-if="editingWish" class="compose-field compact">
                  <span>当前</span>
                  <input v-model.number="draft.progressCurrent" type="number" min="0" />
                </label>
                <label v-else class="compose-field compact compose-field-readonly">
                  <span>当前</span>
                  <input :value="0" type="number" min="0" readonly />
                </label>
                <label class="compose-field compact">
                  <span>目标</span>
                  <input v-model.number="draft.progressTarget" type="number" min="1" />
                </label>
                <label class="compose-field compact">
                  <span>单位</span>
                  <input v-model="draft.progressUnit" type="text" maxlength="10" placeholder="次 / 公里 / 页" />
                </label>
              </div>

              <div v-else-if="draft.progressMode === 'steps' && !editingWish" class="compose-preview-steps-stage">
                <div class="compose-preview-step-head">
                  <span>起步步骤 {{ initialStepCount }}</span>
                  <button type="button" class="compose-inline-action" @click="addInitialStepField">再加一步</button>
                </div>

                <div class="compose-preview-step-list">
                  <label v-for="index in initialStepDrafts.length" :key="index" class="compose-field compact">
                    <span>第 {{ index }} 步</span>
                    <div class="compose-preview-step-field">
                      <input
                        v-model="initialStepDrafts[index - 1]"
                        type="text"
                        maxlength="30"
                        placeholder="写一个很小的起步动作"
                      />
                      <button type="button" class="compose-inline-action subtle" @click="removeInitialStepField(index - 1)">
                        移除
                      </button>
                    </div>
                  </label>
                </div>
              </div>

              <div v-else-if="draft.progressMode === 'steps' && editingWish" class="compose-preview-step-notice">
                <strong>这条愿望已经有步骤管理区了</strong>
                <p>这里只整理基本信息；想继续拆步骤，回详情页会更顺。</p>
                <RouterLink class="compose-inline-action" :to="{ name: 'wish-detail', params: { id: editingWish.id } }">
                  去详情页管理步骤
                </RouterLink>
              </div>
            </section>

            <div class="compose-preview-bottom-row">
              <label class="compose-field compact compose-field-date">
                <span>想在什么时候开始靠近</span>
                <input v-model="draft.dueDate" type="date" />
              </label>

              <div class="compose-preview-actions">
                <button v-if="editingWish" type="button" class="compose-secondary-button" @click="cancelEditing()">
                  回详情页
                </button>
                <button v-else type="button" class="compose-secondary-button" @click="toggleSupplementaryFields()">
                  先写到这里
                </button>
                <button type="submit" class="compose-primary-button compose-mobile-submit">
                  {{ submitButtonLabel }}
                </button>
              </div>
            </div>
          </section>
        </form>

        <aside v-if="shouldShowSummaryStage" class="compose-preview-summary-stage">
          <p class="compose-preview-summary-kicker">{{ previewStageTitle }}</p>
          <h2>{{ draftTitlePreview }}</h2>
          <p class="compose-preview-summary-note">{{ draftNotePreview }}</p>

          <dl class="compose-preview-meta-list">
            <div>
              <dt>归属</dt>
              <dd>{{ selectedOwnerLabel }}</dd>
            </div>
            <div>
              <dt>范围</dt>
              <dd>{{ selectedScopeLabel }}</dd>
            </div>
            <div>
              <dt>优先级</dt>
              <dd>{{ selectedPriorityLabel }}</dd>
            </div>
            <div>
              <dt>进度</dt>
              <dd>{{ progressSummary }}</dd>
            </div>
            <div>
              <dt>日期</dt>
              <dd>{{ dueDateLabel }}</dd>
            </div>
          </dl>

          <section class="compose-preview-scene">
            <p class="compose-preview-scene-label">写下之后，它会先这样出现</p>
            <div class="compose-preview-mini-card">
              <span>{{ draft.category || '生活' }}</span>
              <strong>{{ draftTitlePreview }}</strong>
              <p>{{ progressSummary }}</p>
            </div>
          </section>

          <section v-if="stepPreview.length" class="compose-preview-step-preview">
            <p class="compose-preview-scene-label">起步步骤</p>
            <ol>
              <li v-for="step in stepPreview" :key="step">{{ step }}</li>
            </ol>
          </section>

          <button type="submit" form="compose-atelier-form" class="compose-primary-button compose-preview-submit">
            {{ submitButtonLabel }}
          </button>
        </aside>
      </div>
    </article>
  </section>
</template>

<style scoped>
.compose-live-page {
  display: grid;
  gap: 0.85rem;
  font-family: var(--font-body);
}

.compose-preview-shell {
  display: grid;
  gap: 0.82rem;
  padding: clamp(0.88rem, 1.8vw, 1.08rem);
  background:
    radial-gradient(circle at 100% 0%, rgba(216, 231, 220, 0.56), transparent 28%),
    linear-gradient(160deg, rgba(255, 252, 247, 0.96), rgba(247, 242, 233, 0.94));
}

.compose-preview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.34fr) minmax(16rem, 0.66fr);
  gap: 0.82rem;
  align-items: end;
}

.compose-preview-hero-copy {
  display: grid;
  gap: 0.7rem;
}

.compose-preview-hero h1 {
  display: grid;
  gap: 0.28rem;
  margin: 0;
  max-width: 20ch;
  font-family: var(--font-display);
  font-size: var(--type-page-title-size);
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
  font-weight: 400;
}

.compose-atelier-hero-name,
.compose-atelier-hero-headline {
  display: block;
}

.compose-atelier-hero-name {
  color: rgba(47, 33, 27, 0.88);
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.compose-atelier-hero-headline {
  font-family: var(--font-display);
}

.compose-preview-hero-copy-note {
  margin: 0;
  max-width: 33ch;
  color: rgba(61, 46, 40, 0.82);
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-line);
}

.compose-preview-lead {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
  letter-spacing: var(--type-l6-spacing);
}

.compose-preview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.34fr) minmax(18rem, 0.66fr);
  gap: 0.85rem;
}

.compose-preview-grid.is-single-stage {
  grid-template-columns: 1fr;
}

.compose-preview-form-stage,
.compose-preview-summary-stage {
  display: grid;
  gap: 0.82rem;
}

.compose-preview-form-stage {
  padding: 0.88rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.62);
}

.compose-preview-core-stage,
.compose-preview-supplementary-stage {
  display: grid;
  gap: 0.82rem;
}

.compose-preview-supplementary-stage {
  padding-top: 0.8rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
}

.compose-preview-supplementary-head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: end;
}

.compose-preview-supplementary-head h2 {
  margin: 0.1rem 0 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.compose-preview-primary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.compose-primary-button-inline {
  min-width: 11rem;
}

.compose-field {
  display: grid;
  gap: 0.34rem;
}

.compose-field span,
.compose-preview-step-head,
.compose-preview-summary-kicker,
.compose-preview-scene-label,
.compose-preview-feedback,
.compose-preview-meta-list dt {
  color: var(--text-soft);
  font-size: var(--type-l7-size);
  letter-spacing: var(--type-l7-spacing);
}

.compose-field input,
.compose-field textarea {
  width: 100%;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 16px;
  background: rgba(255, 251, 246, 0.94);
  color: var(--text-main);
  font: inherit;
  font-size: var(--type-l5-size);
  padding: 0.72rem 0.84rem;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.compose-field textarea {
  min-height: 5.6rem;
  line-height: 1.6;
}

.compose-field input:focus,
.compose-field textarea:focus {
  outline: none;
  border-color: rgba(201, 111, 74, 0.26);
  box-shadow: 0 0 0 4px rgba(201, 111, 74, 0.08);
  background: #fffdf9;
}

.compose-field-title input {
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.compose-preview-chip-row,
.compose-preview-member-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.46rem;
}

.compose-preview-member-row.priority-row {
  flex-wrap: nowrap;
  gap: 0.4rem;
}

.compose-chip,
.compose-member-chip,
.compose-inline-action,
.compose-secondary-button,
.compose-primary-button,
.compose-option-card {
  border: 1px solid rgba(95, 74, 55, 0.1);
  font: inherit;
}

.compose-chip,
.compose-member-chip,
.compose-inline-action,
.compose-secondary-button,
.compose-primary-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 34px;
  padding: 0.42rem 0.68rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-main);
  font-size: var(--type-l7-size);
  text-decoration: none;
}

.compose-chip.active,
.compose-member-chip.active {
  border-color: rgba(201, 111, 74, 0.24);
  background: rgba(255, 241, 232, 0.94);
  color: var(--accent-dark);
}

.compose-preview-section {
  display: grid;
  gap: 0.7rem;
  padding-top: 0.72rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
}

.compose-preview-section.compact {
  padding-top: 0;
  border-top: none;
}

.compose-preview-section-head {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: end;
}

.compose-preview-section-head h2,
.compose-preview-summary-stage h2 {
  margin: 0.12rem 0 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.compose-preview-section-head span {
  color: var(--text-soft);
  font-size: var(--type-l7-size);
}

.compose-preview-option-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.42rem;
}

.compose-preview-option-grid > * {
  flex: 1 1 0;
  min-width: 0;
}

.compose-option-card {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 34px;
  padding: 0.48rem 0.3rem;
  border-radius: 999px;
  background: rgba(255, 251, 246, 0.92);
  text-align: center;
}

.compose-option-card strong {
  min-width: 0;
  font-size: var(--type-l7-size);
  font-weight: 600;
  line-height: var(--type-l7-line);
}

.compose-option-card.active {
  border-color: rgba(201, 111, 74, 0.24);
  background: linear-gradient(155deg, rgba(255, 245, 237, 0.98), rgba(253, 237, 223, 0.95));
}

.compose-preview-count-grid,
.compose-preview-bottom-row {
  display: grid;
  gap: 0.78rem;
}

.compose-preview-count-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.compose-preview-bottom-row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.compose-field.compact input {
  padding: 0.64rem 0.78rem;
}

.compose-field-readonly input {
  color: rgba(76, 59, 50, 0.64);
  background: rgba(247, 241, 233, 0.84);
}

.compose-field-date {
  min-width: 0;
}

.compose-field-date input {
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

.compose-preview-actions {
  min-width: 0;
}

.compose-preview-steps-stage,
.compose-preview-step-notice {
  display: grid;
  gap: 0.62rem;
}

.compose-preview-step-head {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: center;
}

.compose-preview-step-list {
  display: grid;
  gap: 0.62rem;
}

.compose-preview-step-field {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.compose-preview-step-notice {
  padding: 0.8rem;
  border-radius: 18px;
  border: 1px solid rgba(95, 74, 55, 0.08);
  background: rgba(255, 251, 246, 0.76);
}

.compose-preview-step-notice strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  line-height: var(--type-l5-line);
}

.compose-preview-step-notice p {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
}

.compose-inline-action {
  font-size: var(--type-l7-size);
}

.compose-inline-action.subtle {
  color: var(--text-soft);
}

.compose-preview-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 0.55rem;
  align-items: end;
}

.compose-preview-submit {
  width: 100%;
}

.compose-mobile-submit {
  display: none;
}

.compose-primary-button {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: #fffaf2;
  box-shadow: 0 14px 28px rgba(191, 101, 66, 0.18);
}

.compose-preview-summary-stage {
  align-content: start;
  padding: 0.88rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 22px;
  background: linear-gradient(160deg, rgba(255, 249, 242, 0.98), rgba(246, 240, 231, 0.96));
}

@media (min-width: 961px) {
  .compose-preview-summary-stage {
    position: sticky;
    top: 0.85rem;
  }
}

.compose-preview-summary-stage h2,
.compose-preview-summary-note {
  margin: 0;
}

.compose-preview-summary-note {
  color: var(--text-soft);
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
}

.compose-preview-meta-list {
  display: grid;
  gap: 0.6rem;
  margin: 0;
}

.compose-preview-meta-list div {
  display: grid;
  grid-template-columns: 4rem 1fr;
  gap: 0.6rem;
  padding-top: 0.6rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
}

.compose-preview-meta-list dd {
  margin: 0;
  font-size: var(--type-l6-size);
}

.compose-preview-scene,
.compose-preview-step-preview {
  display: grid;
  gap: 0.6rem;
}

.compose-preview-mini-card {
  display: grid;
  gap: 0.36rem;
  padding: 0.8rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(95, 74, 55, 0.08);
}

.compose-preview-mini-card span {
  color: var(--text-soft);
  font-size: var(--type-l7-size);
  letter-spacing: var(--type-l7-spacing);
  text-transform: uppercase;
}

.compose-preview-mini-card strong {
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
}

.compose-preview-mini-card p {
  margin: 0;
  font-size: var(--type-l6-size);
  color: var(--text-soft);
}

.compose-preview-step-preview ol {
  display: grid;
  gap: 0.46rem;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-soft);
  font-size: var(--type-l6-size);
}

.compose-preview-feedback {
  margin: 0;
  padding: 0.62rem 0.76rem;
  border-radius: var(--radius-lg);
  border: 1px solid rgba(95, 74, 55, 0.08);
  background: rgba(255, 255, 255, 0.64);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.compose-preview-feedback-success {
  color: var(--success);
  border-color: rgba(75, 129, 96, 0.16);
  background: rgba(216, 231, 220, 0.44);
}

.compose-preview-feedback-danger {
  color: var(--danger);
  border-color: rgba(142, 91, 73, 0.16);
  background: rgba(241, 214, 202, 0.44);
}

.compose-preview-feedback-info {
  color: rgba(76, 59, 50, 0.76);
  border-color: rgba(126, 96, 76, 0.14);
  background: rgba(255, 250, 244, 0.7);
}

.compose-preview-feedback-warning {
  color: var(--warning);
  border-color: rgba(185, 126, 65, 0.18);
  background: rgba(252, 238, 214, 0.54);
}

.priority-row .compose-member-chip {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.38rem 0.46rem;
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
  text-align: center;
}

@media (max-width: 960px) {
  .compose-preview-hero,
  .compose-preview-grid {
    grid-template-columns: 1fr;
  }

  .compose-preview-hero h1 {
    max-width: none;
  }
}

@media (max-width: 720px) {
  .compose-preview-count-grid,
  .compose-preview-bottom-row {
    grid-template-columns: 1fr;
  }

  .compose-preview-supplementary-head,
  .compose-preview-primary-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .compose-preview-step-field {
    flex-direction: column;
    align-items: stretch;
  }

  .compose-preview-actions {
    justify-content: stretch;
  }

  .compose-mobile-submit {
    display: inline-flex;
  }

  .compose-preview-submit {
    display: none;
  }

  .compose-primary-button,
  .compose-secondary-button {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 640px) {
  .compose-preview-count-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .compose-preview-hero h1 {
    font-size: var(--type-page-title-size);
  }

  .compose-preview-form-stage,
  .compose-preview-summary-stage {
    padding: 0.9rem;
  }

  .compose-preview-option-grid,
  .compose-preview-member-row.priority-row {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    grid-template-columns: none;
    overflow-x: auto;
    padding-bottom: 0.1rem;
    scrollbar-width: none;
  }

  .compose-preview-option-grid::-webkit-scrollbar,
  .compose-preview-member-row.priority-row::-webkit-scrollbar {
    display: none;
  }

  .compose-preview-option-grid > *,
  .priority-row .compose-member-chip {
    width: auto;
    min-width: 4.8rem;
    flex: 0 0 auto;
    padding-inline: 0.7rem;
  }
}
</style>
