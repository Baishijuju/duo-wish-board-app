<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useComposePreviewSandbox } from '../composables/useComposePreviewSandbox'

const {
  addInitialStepField,
  applyCategory,
  categorySuggestions,
  draft,
  draftNotePreview,
  draftTitlePreview,
  dueDateLabel,
  initialStepCount,
  initialStepDrafts,
  previewMessage,
  previewTone,
  progressOptions,
  progressSummary,
  priorityOptions,
  removeInitialStepField,
  resetDraft,
  scopeOptions,
  selectedOwnerLabel,
  selectedPriorityLabel,
  selectedProgressLabel,
  selectedScopeLabel,
  stagePreview,
  stepPreview,
  viewerName,
} = useComposePreviewSandbox()

const previewToneClass = computed(() => {
  return `compose-preview-feedback-${previewTone.value}`
})
</script>

<template>
  <section class="compose-preview-page">
    <div class="preview-page-head">
      <RouterLink class="preview-page-link" :to="{ name: 'preview-lab' }">返回 Preview Lab</RouterLink>
      <RouterLink class="preview-page-link subtle" :to="{ name: 'compose' }">查看正式写下页</RouterLink>
    </div>

    <article class="compose-preview-shell page-card">
      <header class="compose-preview-hero">
        <div>
          <p class="eyebrow">Compose Preview</p>
          <h1>{{ viewerName }}，把这件事先写成一页干净的开始。</h1>
        </div>
        <p class="compose-preview-lead">
          这里只留下必要字段，让内容比说明更先被看见。
        </p>
      </header>

      <div class="compose-preview-grid">
        <section class="compose-preview-form-stage">
          <label class="compose-field compose-field-title">
            <span>愿望名字</span>
            <input v-model="draft.title" type="text" maxlength="36" placeholder="例如：一起去看海边的日出" />
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

          <label class="compose-field">
            <span>一句心情</span>
            <textarea
              v-model="draft.note"
              rows="3"
              maxlength="180"
              placeholder="只留一句就够，比如为什么现在想把它写下来。"
            />
          </label>

          <section class="compose-preview-section">
            <header class="compose-preview-section-head">
              <div>
                <p class="eyebrow">Visibility</p>
                <h2>给它一个被看见的方式</h2>
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
                <p class="eyebrow">Priority</p>
                <h2>想把它放在哪一层</h2>
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
                <p class="eyebrow">Progress</p>
                <h2>推进方式</h2>
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
              <label class="compose-field compact">
                <span>当前</span>
                <input v-model.number="draft.progressCurrent" type="number" min="0" />
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

            <div v-else-if="draft.progressMode === 'steps'" class="compose-preview-steps-stage">
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
          </section>

          <div class="compose-preview-bottom-row">
            <label class="compose-field compact compose-field-date">
              <span>想在什么时候开始靠近</span>
              <input v-model="draft.dueDate" type="date" />
            </label>

            <div class="compose-preview-actions">
              <button type="button" class="compose-secondary-button" @click="resetDraft">重置草稿</button>
            </div>
          </div>
        </section>

        <aside class="compose-preview-summary-stage">
          <p class="compose-preview-summary-kicker">实时预览</p>
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
            <p class="compose-preview-scene-label">收进首页时会更像这样</p>
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

          <p class="compose-preview-feedback" :class="previewToneClass">{{ previewMessage }}</p>

          <button type="button" class="compose-primary-button compose-preview-submit" @click="stagePreview">
            只在预览里收下
          </button>
        </aside>
      </div>
    </article>
  </section>
</template>

<style scoped>
.compose-preview-page {
  display: grid;
  gap: 0.85rem;
}

.preview-page-head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.preview-page-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.42rem 0.72rem;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-main);
  font-size: 0.76rem;
  font-weight: 600;
  text-decoration: none;
}

.preview-page-link.subtle {
  color: var(--text-soft);
  background: rgba(255, 255, 255, 0.45);
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
  grid-template-columns: minmax(0, 1.2fr) minmax(18rem, 0.8fr);
  gap: 0.82rem;
  align-items: end;
}

.compose-preview-hero h1 {
  margin: 0;
  max-width: 12ch;
  font-family: var(--font-heading);
  font-size: clamp(1.72rem, 4vw, 3.05rem);
  line-height: 1.06;
  letter-spacing: -0.05em;
}

.compose-preview-lead {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.88rem;
  line-height: 1.7;
}

.compose-preview-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.28fr) minmax(19rem, 0.82fr);
  gap: 0.85rem;
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

.compose-field {
  display: grid;
  gap: 0.34rem;
}

.compose-field span,
.compose-preview-section-note,
.compose-preview-step-head,
.compose-preview-summary-kicker,
.compose-preview-scene-label,
.compose-preview-feedback,
.compose-preview-meta-list dt {
  color: var(--text-soft);
  font-size: 0.74rem;
  letter-spacing: 0.04em;
}

.compose-field input,
.compose-field textarea {
  width: 100%;
  border: 1px solid rgba(95, 74, 55, 0.1);
  border-radius: 16px;
  background: rgba(255, 251, 246, 0.94);
  color: var(--text-main);
  font: inherit;
  font-size: 0.9rem;
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
  font-size: clamp(1.12rem, 2.4vw, 1.46rem);
  letter-spacing: -0.03em;
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
  font-size: 0.78rem;
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
  font-size: clamp(1.04rem, 2vw, 1.36rem);
  line-height: 1.18;
  letter-spacing: -0.03em;
}

.compose-preview-section-head span {
  color: var(--text-soft);
  font-size: 0.74rem;
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
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.2;
}

.compose-option-card.active {
  border-color: rgba(201, 111, 74, 0.24);
  background: linear-gradient(155deg, rgba(255, 245, 237, 0.98), rgba(253, 237, 223, 0.95));
}

.compose-preview-count-grid,
.compose-preview-bottom-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.78rem;
}

.compose-preview-bottom-row {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.compose-preview-count-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.compose-field.compact input {
  padding: 0.64rem 0.78rem;
}

.compose-preview-steps-stage {
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

.compose-inline-action {
  font-size: 0.74rem;
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

.compose-preview-summary-stage h2,
.compose-preview-summary-note {
  margin: 0;
}

.compose-preview-summary-note {
  color: var(--text-soft);
  font-size: 0.88rem;
  line-height: 1.68;
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
  font-size: 0.86rem;
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
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.compose-preview-mini-card strong {
  font-family: var(--font-heading);
  font-size: 1.16rem;
  line-height: 1.18;
}

.compose-preview-mini-card p {
  font-size: 0.84rem;
  color: var(--text-soft);
}

.compose-preview-mini-card p,
.compose-preview-step-preview ol {
  margin: 0;
}

.compose-preview-step-preview ol {
  display: grid;
  gap: 0.46rem;
  padding-left: 1.1rem;
  color: var(--text-soft);
  font-size: 0.84rem;
}

.compose-preview-feedback {
  margin: 0;
  padding: 0.62rem 0.76rem;
  border-radius: 16px;
  border: 1px solid rgba(95, 74, 55, 0.08);
  background: rgba(255, 255, 255, 0.64);
}

.compose-preview-feedback-info {
  color: var(--text-soft);
}

.compose-preview-feedback-success {
  color: var(--success);
  background: rgba(216, 231, 220, 0.44);
}

.compose-preview-feedback-warning {
  color: var(--danger);
  background: rgba(241, 214, 202, 0.44);
}

.priority-row .compose-member-chip {
  flex: 1 1 0;
  min-width: 0;
  padding: 0.38rem 0.46rem;
  font-size: 0.7rem;
  line-height: 1.18;
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

  .compose-preview-step-field {
    flex-direction: column;
    align-items: stretch;
  }

  .compose-preview-actions {
    justify-content: stretch;
  }

  .compose-primary-button,
  .compose-secondary-button {
    width: 100%;
    justify-content: center;
  }
}
</style>