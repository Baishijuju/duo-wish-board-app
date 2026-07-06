<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import CopyFold from '../components/CopyFold.vue'
import { useComposePreviewState } from '../composables/useComposePreviewState'

interface ComposePreviewStateWithLastSavedWishId {
  lastSavedWishId: {
    value: string | null
  }
}

function hasLastSavedWishId(state: unknown): state is ComposePreviewStateWithLastSavedWishId {
  return typeof state === 'object' && state !== null && 'lastSavedWishId' in state
}

const composePreviewState = useComposePreviewState({ allowEditing: true })

const {
  addInitialStepField,
  applyCategory,
  cancelEditing,
  categorySuggestions,
  composerHeadline,
  draft,
  draftNotePreview,
  draftTitlePreview,
  editingWish,
  feedbackMessage,
  feedbackTone,
  initialStepCount,
  initialStepDrafts,
  progressOptions,
  progressSummary,
  removeInitialStepField,
  starCoinTotalSummary,
  submitWish,
  viewerName,
} = composePreviewState

const lastSavedWishId = computed(() => {
  return hasLastSavedWishId(composePreviewState) ? composePreviewState.lastSavedWishId.value : null
})

const feedbackToneClass = computed(() => {
  return `compose-preview-feedback-${feedbackTone.value}`
})

const stepPreview = computed(() => {
  return initialStepDrafts.value.map((step) => step.title.trim()).filter(Boolean).slice(0, 4)
})

const submitButtonLabel = computed(() => {
  return editingWish.value ? '保存这次整理' : '保存这条完整愿望'
})

const previewStageTitle = computed(() => {
  return editingWish.value ? '这页整理后会变成这样' : '写完整之后，这页会先变成这样'
})
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
        </div>
      </header>

      <div class="compose-preview-grid">
        <form id="compose-atelier-form" class="compose-preview-form-stage" @submit.prevent="submitWish">
          <section class="compose-preview-core-stage compose-form-block compose-form-block-main">
            <header class="compose-form-block-head">
              <div>
                <h2>它叫什么，为什么现在想实现？</h2>
              </div>
            </header>

            <label class="compose-field compose-field-title">
              <span>愿望名字</span>
              <input v-model="draft.title" type="text" maxlength="36" placeholder="例如：一起去看海边日出" />
            </label>

            <label class="compose-field">
              <span>一句心情</span>
              <textarea
                v-model="draft.note"
                rows="3"
                maxlength="180"
                placeholder="写一句为什么现在想实现它，回看时会更有力。"
              />
            </label>

            <div v-if="editingWish" class="compose-preview-primary-actions">
              <button type="button" class="compose-secondary-button" @click="cancelEditing()">
                回详情页
              </button>
            </div>
          </section>

          <section class="compose-preview-supplementary-stage">
            <section class="compose-form-block compose-form-block-compact">
              <header class="compose-form-block-head">
                <div>
                  <h2>以后要找它时，一眼就能认出来。</h2>
                </div>
              </header>

              <label class="compose-field compact">
                <span>分类</span>
                <input v-model="draft.category" type="text" maxlength="20" placeholder="如：旅行 / 生活 / 成长" />
              </label>

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
            </section>

            <section class="compose-form-block compose-form-block-progress">
              <header class="compose-form-block-head">
                <div>
                  <h2>选一种推进方式，再写下第一步。</h2>
                </div>
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
                  <input v-model="draft.progressUnit" type="text" maxlength="10" placeholder="单位，如：次 / 公里 / 页" />
                </label>
                <label class="compose-field compact">
                  <span>每单位星星币</span>
                  <input v-model.number="draft.progressStarCoinValue" type="number" min="0" step="0.1" />
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
                        v-model="initialStepDrafts[index - 1].title"
                        type="text"
                        maxlength="30"
                        placeholder="先写一个最小动作"
                      />
                      <input
                        v-model.number="initialStepDrafts[index - 1].starCoinValue"
                        class="compose-preview-step-coin-input"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="星币数"
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
                <CopyFold
                  as="p"
                  layer="supporting"
                  page="compose"
                  target="steps-editing-notice"
                  text="这里只整理基本信息；想继续拆步骤，回详情页会更顺。"
                />
                <RouterLink class="compose-inline-action" :to="{ name: 'wish-detail', params: { id: editingWish.id } }">
                  去详情页管理步骤
                </RouterLink>
              </div>
            </section>

            <section class="compose-form-block compose-form-block-finish">
              <header class="compose-form-block-head">
                <div>
                  <h2>给未来做到这件事的你，留一点甜。</h2>
                </div>
              </header>

              <div class="compose-preview-bottom-row compose-form-finish-row">
                <label class="compose-field compact">
                  <span>最终完成额外星星币</span>
                  <input v-model.number="draft.completionStarCoinBonus" type="number" min="0" step="0.1" />
                </label>

                <div class="compose-preview-actions">
                  <button v-if="editingWish" type="button" class="compose-secondary-button" @click="cancelEditing()">
                    回详情页
                  </button>
                  <button type="submit" class="compose-primary-button compose-mobile-submit">
                    {{ submitButtonLabel }}
                  </button>
                  <div v-if="feedbackMessage && feedbackTone === 'success' && lastSavedWishId" class="compose-preview-feedback compose-preview-feedback-mobile" :class="feedbackToneClass" role="status" aria-live="polite">
                    <span>{{ feedbackMessage }}</span>
                    <RouterLink class="compose-preview-feedback-link" :to="{ name: 'wish-detail', params: { id: lastSavedWishId } }">去愿望详情</RouterLink>
                  </div>
                  <p v-else-if="feedbackMessage" class="compose-preview-feedback compose-preview-feedback-mobile" :class="feedbackToneClass" role="status" aria-live="polite">{{ feedbackMessage }}</p>
                </div>
              </div>
            </section>
          </section>
        </form>

        <aside class="compose-preview-summary-stage">
          <p class="compose-preview-summary-kicker">{{ previewStageTitle }}</p>
          <h2>{{ draftTitlePreview }}</h2>
          <CopyFold
            as="p"
            class="compose-preview-summary-note"
            layer="supporting"
            page="compose"
            target="preview-summary-note"
            :text="draftNotePreview"
          />

          <dl class="compose-preview-meta-list">
            <div>
              <dt>进度</dt>
              <dd>{{ progressSummary }}</dd>
            </div>
            <div>
              <dt>星星币</dt>
              <dd>{{ starCoinTotalSummary }}</dd>
            </div>
          </dl>

          <section class="compose-preview-scene">
            <p class="compose-preview-scene-label">写下之后，它会先这样出现</p>
            <div class="compose-preview-mini-card">
              <span>{{ draft.category || '生活' }}</span>
              <strong>{{ draftTitlePreview }}</strong>
              <CopyFold
                as="p"
                layer="supporting"
                page="compose"
                target="preview-progress-summary"
                :text="progressSummary"
              />
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
          <div v-if="feedbackMessage && feedbackTone === 'success' && lastSavedWishId" class="compose-preview-feedback compose-preview-feedback-desktop" :class="feedbackToneClass" role="status" aria-live="polite">
            <span>{{ feedbackMessage }}</span>
            <RouterLink class="compose-preview-feedback-link" :to="{ name: 'wish-detail', params: { id: lastSavedWishId } }">去愿望详情</RouterLink>
          </div>
          <p v-else-if="feedbackMessage" class="compose-preview-feedback compose-preview-feedback-desktop" :class="feedbackToneClass" role="status" aria-live="polite">{{ feedbackMessage }}</p>
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
    radial-gradient(circle at 100% 0%, color-mix(in srgb, var(--sage) 56%, transparent), transparent 28%),
    linear-gradient(160deg, var(--warm-panel-strong), var(--surface-soft));
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
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.compose-atelier-hero-headline {
  font-family: var(--font-display);
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
  padding: clamp(0.92rem, 2vw, 1.18rem) clamp(0.92rem, 2.4vw, 1.32rem);
  border: 1px solid var(--line-soft);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 253, 249, 0.78), rgba(255, 250, 244, 0.42)),
    var(--surface-card);
}

.compose-preview-core-stage,
.compose-preview-supplementary-stage {
  display: grid;
  gap: 0;
}

.compose-preview-supplementary-stage {
  padding-top: 0;
  border-top: 0;
}

.compose-form-block {
  display: grid;
  grid-template-columns: minmax(8.2rem, 0.28fr) minmax(0, 1fr);
  column-gap: clamp(0.88rem, 2.4vw, 1.36rem);
  row-gap: 0.68rem;
  padding: clamp(0.9rem, 1.8vw, 1.12rem) 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.compose-form-block + .compose-form-block,
.compose-preview-supplementary-stage .compose-form-block {
  border-top: 1px solid rgba(126, 96, 76, 0.1);
}

.compose-form-block:first-child {
  padding-top: 0;
}

.compose-form-block > :not(.compose-form-block-head) {
  grid-column: 2;
}

.compose-form-block-main {
  row-gap: 0.52rem;
}

.compose-form-block-compact {
  row-gap: 0.58rem;
}

.compose-form-block-finish {
  padding-bottom: 0.1rem;
}

.compose-form-block-head,
.compose-preview-supplementary-head {
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  align-items: stretch;
  align-self: center;
  max-width: 12rem;
}

.compose-form-block-head h2,
.compose-preview-supplementary-head h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  line-height: var(--type-l5-line);
  letter-spacing: 0;
  color: var(--text-muted);
}

.compose-form-block-head > span {
  width: fit-content;
  min-height: 28px;
  padding: 0.2rem 0.58rem;
  border: 1px solid rgba(126, 96, 76, 0.1);
  border-radius: 999px;
  background: rgba(255, 252, 247, 0.64);
  color: var(--text-soft);
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
}

.compose-preview-primary-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
}

.compose-field {
  display: grid;
  gap: 0.24rem;
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
  border: 1px solid var(--warm-border-soft);
  border-radius: 16px;
  background: var(--surface-raised);
  color: var(--text-main);
  font: inherit;
  font-size: var(--type-l5-size);
  padding: 0.58rem 0.72rem;
  transition: border-color 180ms ease, box-shadow 180ms ease, background 180ms ease;
}

.compose-field textarea {
  min-height: 4.35rem;
  font-size: var(--type-l6-size);
  line-height: 1.5;
}

.compose-field input:focus,
.compose-field textarea:focus {
  outline: none;
  border-color: var(--accent-border);
  box-shadow: 0 0 0 4px var(--accent-ring);
  background: var(--surface-popover);
}

.compose-field-title input {
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.compose-preview-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.46rem;
}

.compose-chip,
.compose-inline-action,
.compose-secondary-button,
.compose-primary-button,
.compose-option-card {
  border: 1px solid var(--warm-border-soft);
  font: inherit;
}

.compose-chip,
.compose-inline-action,
.compose-secondary-button,
.compose-primary-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 34px;
  padding: 0.42rem 0.68rem;
  border-radius: 999px;
  background: var(--warm-panel-strong);
  color: var(--text-main);
  font-size: var(--type-l7-size);
  text-decoration: none;
}

.compose-chip.active {
  border-color: var(--accent-border);
  background: var(--accent-panel);
  color: var(--accent-dark);
}

.compose-preview-section {
  display: grid;
  gap: 0.7rem;
  padding-top: 0.72rem;
  border-top: 1px solid var(--line-soft);
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
  background: var(--surface-raised);
  text-align: center;
}

.compose-option-card strong {
  min-width: 0;
  font-size: var(--type-l7-size);
  font-weight: 600;
  line-height: var(--type-l7-line);
}

.compose-option-card.active {
  border-color: var(--accent-border);
  background: linear-gradient(155deg, var(--accent-panel), var(--accent-soft));
}

.compose-preview-count-grid,
.compose-preview-bottom-row {
  display: grid;
  gap: 0.78rem;
}

.compose-preview-count-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.compose-preview-bottom-row {
  grid-template-columns: minmax(10rem, 0.65fr) minmax(0, 1fr) auto;
  align-items: end;
}

.compose-form-finish-row {
  grid-template-columns: minmax(10rem, 0.55fr) minmax(0, 1fr);
}

.compose-field.compact input {
  height: 35px;
  padding: 0.34rem 0.72rem;
  font-size: var(--type-l6-size);
  line-height: var(--type-l6-line);
}

.compose-field-readonly input {
  color: var(--text-faint);
  background: var(--surface-soft);
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

.compose-preview-step-coin-input {
  flex: 0 0 5.8rem;
}

.compose-preview-step-notice {
  padding: 0.8rem;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: var(--warm-panel-strong);
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
  color: var(--accent-contrast);
  box-shadow: 0 14px 28px var(--accent-shadow);
}

.compose-preview-summary-stage {
  align-content: start;
  padding: 0.88rem;
  border: 1px solid var(--line-soft);
  border-radius: 22px;
  background: linear-gradient(160deg, var(--surface-card), var(--surface-soft));
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
  border-top: 1px solid var(--line-soft);
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
  background: var(--warm-panel-strong);
  border: 1px solid var(--line-soft);
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
  display: grid;
  gap: 0.46rem;
  padding: 0.62rem 0.76rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line-soft);
  background: var(--warm-panel);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
  text-decoration: none;
}

.compose-preview-feedback-link {
  justify-self: start;
  min-height: 1.85rem;
  padding: 0.28rem 0.66rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: rgba(255, 255, 255, 0.58);
  color: inherit;
  font-size: var(--type-l7-size);
  font-weight: 700;
  line-height: var(--type-l7-line);
  text-decoration: none;
}

.compose-preview-feedback-mobile {
  display: none;
}

.compose-preview-feedback-desktop {
  margin-top: 0.62rem;
}

.compose-preview-feedback-success {
  color: var(--success);
  border-color: var(--success-border);
  background: var(--success-panel);
}

.compose-preview-feedback-danger {
  color: var(--danger);
  border-color: var(--danger-border);
  background: var(--danger-panel);
}

.compose-preview-feedback-info {
  color: var(--text-muted);
  border-color: var(--warm-border);
  background: var(--warm-panel-strong);
}

.compose-preview-feedback-warning {
  color: var(--warning);
  border-color: var(--warning-border);
  background: var(--warning-panel);
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
  .compose-form-block {
    grid-template-columns: 1fr;
    padding: 0.9rem 0;
  }

  .compose-form-block-head {
    grid-row: auto;
  }

  .compose-form-block > :not(.compose-form-block-head) {
    grid-column: 1;
  }

  .compose-form-block-head {
    max-width: none;
  }

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
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
  }

  .compose-preview-step-field input:first-child {
    grid-column: 1 / -1;
  }

  .compose-preview-step-coin-input {
    flex: none;
    width: 6.8rem;
  }

  .compose-preview-step-field .compose-inline-action.subtle {
    min-height: 35px;
    padding-inline: 0.82rem;
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

  .compose-preview-feedback-mobile {
    display: block;
  }

  .compose-preview-feedback-desktop {
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

  .compose-preview-option-grid {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    grid-template-columns: none;
    overflow-x: auto;
    padding-bottom: 0.1rem;
    scrollbar-width: none;
  }

  .compose-preview-option-grid::-webkit-scrollbar {
    display: none;
  }

  .compose-preview-option-grid > * {
    width: auto;
    min-width: 4.8rem;
    flex: 0 0 auto;
    padding-inline: 0.7rem;
  }
}
</style>
