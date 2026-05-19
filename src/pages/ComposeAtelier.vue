<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useComposePreviewState } from '../composables/useComposePreviewState'

const {
  addInitialStepField,
  applyCategory,
  authStore,
  cancelEditing,
  composerHeadline,
  categorySuggestions,
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
  progressDetail,
  progressOptions,
  progressSummary,
  priorityOptions,
  removeInitialStepField,
  resetDraft,
  scopeOptions,
  selectedOwnerLabel,
  selectedPriorityDescription,
  selectedPriorityLabel,
  selectedProgressDescription,
  selectedProgressLabel,
  selectedScopeDescription,
  selectedScopeLabel,
  submitWish,
  viewerName,
  wishStore,
} = useComposePreviewState({ allowEditing: true })

const overviewCards = computed(() => {
  return [
    {
      label: '写下的人',
      note: wishStore.isUsingCloudWishes ? '当前空间会自动锁定成员。' : '本地模式下可以自由选择。',
      value: selectedOwnerLabel.value,
    },
    {
      label: '可见范围',
      note: selectedScopeDescription.value,
      value: selectedScopeLabel.value,
    },
    {
      label: '想先怎么靠近',
      note: selectedPriorityDescription.value,
      value: selectedPriorityLabel.value,
    },
  ]
})

const previewChips = computed(() => {
  return [selectedScopeLabel.value, selectedPriorityLabel.value, dueDateLabel.value]
})
</script>

<template>
  <section class="compose-atelier-page">
    <section class="compose-atelier-hero">
      <article class="page-card compose-atelier-intro">
        <p class="compose-atelier-kicker">写下页 Compose</p>
        <div class="compose-atelier-intro-copy">
          <h1>
            <span class="compose-atelier-hero-name">{{ viewerName }}</span>
            <span class="compose-atelier-hero-headline">{{ composerHeadline }}</span>
          </h1>
          <p class="compose-atelier-lead">{{ composerLead }}</p>
          <p class="compose-atelier-sublead">
            {{
              editingWish
                ? '先整理标题、范围和进度方式；步骤、图片和留言回详情页再补。'
                : '先定名字、方向和一句想实现它的原因。'
            }}
          </p>
        </div>

        <div class="compose-atelier-hero-actions">
          <button class="compose-submit-button" type="submit" form="compose-atelier-form">
            {{ editingWish ? '保存这次整理' : '现在写下' }}
          </button>
          <button class="compose-atelier-button is-soft" type="button" @click="editingWish ? cancelEditing() : resetDraft()">
            {{ editingWish ? '先不改了' : '清空重写' }}
          </button>
          <RouterLink
            class="compose-atelier-button is-ghost"
            :to="editingWish ? { name: 'wish-detail', params: { id: editingWish.id } } : { name: 'list' }"
          >
            {{ editingWish ? '回这条愿望' : '去清单继续推进' }}
          </RouterLink>
        </div>

        <div class="compose-atelier-overview-grid">
          <article v-for="(card, index) in overviewCards" :key="card.label" :class="['compose-atelier-overview-card', { 'is-wide': index === 0 }]">
            <span>{{ card.label }}</span>
            <strong>{{ card.value }}</strong>
            <p>{{ card.note }}</p>
          </article>
        </div>
      </article>

      <article class="page-card compose-atelier-preview-card">
        <p class="compose-atelier-kicker">这一页会先长成这样 Preview</p>
        <div class="compose-atelier-preview-copy">
          <h2>{{ draftTitlePreview }}</h2>
          <p>{{ draftNotePreview }}</p>
        </div>

        <p class="compose-atelier-preview-note">写下后它会先落进清单里，步骤和回应后面再补。</p>

        <div class="compose-atelier-chip-row">
          <span v-for="chip in previewChips" :key="chip" class="compose-atelier-chip">{{ chip }}</span>
        </div>

        <div class="compose-atelier-preview-meta">
          <article class="compose-atelier-preview-panel is-wide">
            <span>分类</span>
            <strong>{{ draft.category || '还没选分类' }}</strong>
            <p>先写一句也可以，后面还能继续补全。</p>
          </article>
          <article class="compose-atelier-preview-panel">
            <span>记录方式</span>
            <strong>{{ progressSummary }}</strong>
            <p>{{ selectedProgressDescription }}</p>
          </article>
          <article class="compose-atelier-preview-panel">
            <span>完成时间</span>
            <strong>{{ dueDateLabel }}</strong>
            <p>{{ draft.dueDate ? '定了日子，会更容易往前放。' : '没定也没关系，后面再补。' }}</p>
          </article>
        </div>
      </article>
    </section>

    <article class="page-card compose-atelier-form-shell">
      <div class="compose-atelier-section-head">
        <div class="compose-atelier-section-copy">
          <p class="compose-atelier-kicker">录入台 Form</p>
          <h2>{{ editingWish ? '在这里把基本信息改成现在最像它的样子' : '把一个愿望认真放进生活里' }}</h2>
        </div>
        <div class="compose-atelier-section-aside">
          <span class="compose-atelier-state-pill">{{ editingWish ? '正在整理已有愿望' : '先写下一句也可以' }}</span>
          <p class="compose-atelier-form-note">
            {{
              editingWish
                ? '这里只改基本信息；步骤、图片和留言回详情页处理。'
                : '先定标题、方向和进度方式，后面都还能再改。'
            }}
          </p>
        </div>
      </div>

      <div class="compose-atelier-sequence">
        <article class="compose-atelier-sequence-card">
          <span>第一段</span>
          <strong>愿望先落地</strong>
          <p>把标题、日期和分类先定下来。</p>
        </article>
        <article class="compose-atelier-sequence-card">
          <span>第二段</span>
          <strong>再决定怎么被看见</strong>
          <p>范围、轻重和推进方式，会决定后面怎么继续靠近。</p>
        </article>
        <article class="compose-atelier-sequence-card">
          <span>第三段</span>
          <strong>最后留一句原因</strong>
          <p>留一句原因就够，让这一页更像你现在真的想要的。</p>
        </article>
      </div>

      <form id="compose-atelier-form" class="compose-atelier-form" @submit.prevent="submitWish">
        <section class="compose-atelier-block is-foundation">
          <div class="compose-atelier-block-head">
            <h3>先给它一个清楚的名字</h3>
            <p>先把愿望落下来，细节后面再补。</p>
          </div>

          <div class="compose-atelier-form-grid">
            <label class="compose-field is-wide">
              <span class="compose-label">想写下什么愿望？</span>
              <input v-model="draft.title" type="text" maxlength="60" placeholder="例如：一起去看一次极光" />
            </label>

            <label v-if="!wishStore.isUsingCloudWishes" class="compose-field">
              <span class="compose-label">写下的人</span>
              <div class="compose-select-shell">
                <select v-model="draft.ownerId">
                  <option v-for="member in authStore.members" :key="member.id" :value="member.id">
                    {{ member.displayName }}
                  </option>
                </select>
                <span class="compose-select-caret" aria-hidden="true"></span>
              </div>
            </label>

            <div v-else class="compose-owner-card compose-field">
              <span class="compose-label">写下的人</span>
              <strong>{{ authStore.currentMember?.displayName || '当前成员' }}</strong>
            </div>

            <label class="compose-field">
              <span class="compose-label">希望完成的日子</span>
              <input v-model="draft.dueDate" type="date" />
            </label>

            <label class="compose-field is-wide">
              <span class="compose-label">放进哪一类生活里？</span>
              <input v-model="draft.category" type="text" maxlength="20" placeholder="旅行 / 生活 / 成长" />
              <div class="compose-category-row">
                <button
                  v-for="category in categorySuggestions"
                  :key="category"
                  class="compose-category-chip"
                  type="button"
                  @click="applyCategory(category)"
                >
                  {{ category }}
                </button>
              </div>
            </label>
          </div>
        </section>

        <section class="compose-atelier-block is-direction">
          <div class="compose-atelier-block-head">
            <h3>再决定它怎样被一起看见</h3>
            <p>把范围、轻重和推进方式先定下来。</p>
          </div>

          <div class="compose-choice-stack">
            <label class="compose-choice-card">
              <div class="compose-choice-copy">
                <span class="compose-label">公开范围</span>
                <strong>{{ selectedScopeLabel }}</strong>
                <p class="compose-select-hint">{{ selectedScopeDescription }}</p>
              </div>
              <div class="compose-select-shell">
                <select v-model="draft.scope">
                  <option v-for="option in scopeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <span class="compose-select-caret" aria-hidden="true"></span>
              </div>
            </label>

            <label class="compose-choice-card">
              <div class="compose-choice-copy">
                <span class="compose-label">优先级</span>
                <strong>{{ selectedPriorityLabel }}</strong>
                <p class="compose-select-hint">{{ selectedPriorityDescription }}</p>
              </div>
              <div class="compose-select-shell">
                <select v-model="draft.priority">
                  <option v-for="option in priorityOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <span class="compose-select-caret" aria-hidden="true"></span>
              </div>
            </label>

            <label class="compose-choice-card">
              <div class="compose-choice-copy">
                <span class="compose-label">进度方式</span>
                <strong>{{ selectedProgressLabel }}</strong>
                <p class="compose-select-hint">{{ selectedProgressDescription }}</p>
              </div>
              <div class="compose-select-shell">
                <select v-model="draft.progressMode">
                  <option v-for="option in progressOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <span class="compose-select-caret" aria-hidden="true"></span>
              </div>
            </label>
          </div>

          <p class="compose-inline-note">{{ progressDetail }}</p>

          <div v-if="draft.progressMode === 'count'" class="compose-detail-card">
            <div class="compose-detail-grid">
              <label class="compose-field">
                <span class="compose-label">目标是多少？</span>
                <input v-model.number="draft.progressTarget" type="number" min="1" max="9999" placeholder="例如：10" />
              </label>

              <label class="compose-field">
                <span class="compose-label">现在走到哪里了？</span>
                <input v-model.number="draft.progressCurrent" type="number" min="0" max="9999" placeholder="例如：2" />
              </label>

              <label class="compose-field is-wide">
                <span class="compose-label">量词是什么？</span>
                <input v-model="draft.progressUnit" type="text" maxlength="12" placeholder="例如：本 / 次 / 节 / 公里" />
              </label>
            </div>
          </div>

          <div v-else-if="draft.progressMode === 'steps' && !editingWish" class="compose-detail-card compose-step-card">
            <div class="compose-hint-head">
              <strong>先给这条愿望拆几步</strong>
              <span>现在已经写了 {{ initialStepCount }} 个初始步骤</span>
            </div>
            <p>先预填第一批步骤，写下后再去详情页补和勾选。</p>

            <div class="compose-step-list">
              <label v-for="(_, index) in initialStepDrafts" :key="`preview-initial-step-${index}`" class="compose-step-row">
                <span class="compose-label">初始步骤 {{ index + 1 }}</span>
                <div class="compose-step-input-row">
                  <input v-model="initialStepDrafts[index]" type="text" maxlength="60" :placeholder="`例如：第 ${index + 1} 步要先做什么`" />
                  <button class="compose-inline-button" type="button" @click="removeInitialStepField(index)">删掉</button>
                </div>
              </label>
            </div>

            <button class="compose-inline-button is-soft" type="button" @click="addInitialStepField">再加一步</button>
          </div>

          <div v-else-if="draft.progressMode === 'steps' && editingWish" class="compose-detail-card compose-step-card">
            <div class="compose-hint-head">
              <strong>这条愿望已经有步骤管理区了</strong>
              <span>后续新增、勾选和删除都继续放在详情页</span>
            </div>
            <p>写下页只改基本信息；要继续拆步骤，回详情页会更顺。</p>
            <RouterLink class="compose-inline-button is-soft" :to="{ name: 'wish-detail', params: { id: editingWish.id } }">
              去详情页管理步骤
            </RouterLink>
          </div>
        </section>

        <section class="compose-atelier-block is-memory">
          <div class="compose-atelier-block-head">
            <h3>最后留下此刻为什么想实现</h3>
            <p>留一句原因，让这一页更像现在的心情。</p>
          </div>

          <label class="compose-field is-wide">
            <span class="compose-label">为什么想实现？</span>
            <textarea v-model="draft.note" rows="6" maxlength="180" placeholder="写下完成那天，你希望记住的画面。"></textarea>
          </label>
        </section>

        <div class="compose-atelier-submit-row">
          <div class="compose-atelier-submit-copy">
            <span>{{ editingWish ? '把这次修改认真写回清单' : '把这条愿望放进共同生活' }}</span>
            <p>
              {{
                editingWish
                  ? '保存后，它会带着新的基本信息继续留在原来的详情页里。'
                  : '写下后它会先出现在清单里，步骤和留言后面再补。'
              }}
            </p>
          </div>

          <div class="compose-atelier-actions">
            <button class="compose-submit-button" type="submit">{{ editingWish ? '保存修改' : '放进清单' }}</button>
            <button v-if="editingWish" class="compose-reset-button" type="button" @click="cancelEditing">先不改了</button>
            <button v-else class="compose-reset-button" type="button" @click="resetDraft">重新写</button>
          </div>
        </div>

        <p v-if="feedbackMessage" :class="['compose-feedback', feedbackTone]">{{ feedbackMessage }}</p>
      </form>
    </article>
  </section>
</template>

<style scoped>
.compose-atelier-page {
  font-family: var(--font-body);
}

.compose-atelier-page,
.compose-atelier-form,
.compose-atelier-form-grid,
.compose-atelier-block,
.compose-atelier-intro-copy,
.compose-atelier-preview-copy,
.compose-atelier-preview-meta,
.compose-atelier-overview-grid,
.compose-atelier-sequence,
.compose-choice-stack,
.compose-choice-copy,
.compose-detail-grid,
.compose-step-list,
.compose-atelier-section-copy,
.compose-atelier-section-aside,
.compose-atelier-submit-row,
.compose-atelier-submit-copy {
  display: grid;
  gap: 1rem;
}

.compose-atelier-hero-actions,
.compose-atelier-chip-row,
.compose-category-row,
.compose-atelier-actions,
 .compose-step-input-row {
  display: flex;
  gap: 0.72rem;
  flex-wrap: wrap;
}

.compose-atelier-hero {
  display: grid;
  gap: 1rem;
}

.compose-atelier-kicker,
.compose-hint-head span {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(70, 53, 45, 0.66);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  letter-spacing: var(--type-eyebrow-spacing);
  line-height: 1.4;
  text-transform: uppercase;
}

.compose-atelier-overview-card span,
.compose-atelier-preview-meta span {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(70, 53, 45, 0.68);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.compose-atelier-preview-card > .compose-atelier-kicker {
  font-size: calc(var(--type-eyebrow-size) - 1px);
  letter-spacing: 0.14em;
}

.compose-label {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(70, 53, 45, 0.74);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.compose-atelier-button,
.compose-category-chip,
.compose-inline-button,
.compose-submit-button,
.compose-reset-button {
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

.compose-atelier-button.is-ghost,
.compose-atelier-button.is-soft,
.compose-category-chip,
.compose-inline-button,
.compose-reset-button {
  padding: 0.55rem 0.9rem;
  border: 1px solid rgba(126, 96, 76, 0.14);
  background: rgba(255, 255, 255, 0.74);
  color: #362720;
}

.compose-atelier-button.is-soft {
  background: rgba(243, 222, 210, 0.56);
  border-color: rgba(201, 111, 74, 0.16);
}

.compose-atelier-button,
.compose-submit-button {
  padding: 0.7rem 1.18rem;
}

.compose-atelier-button.is-solid,
.compose-submit-button {
  border: 0;
  background: linear-gradient(135deg, #c97c61, #9f5d50);
  color: #fffaf5;
  box-shadow: 0 16px 30px rgba(163, 91, 73, 0.24);
}

.compose-atelier-button:hover,
.compose-category-chip:hover,
.compose-inline-button:hover,
.compose-submit-button:hover,
.compose-reset-button:hover {
  transform: translateY(-1px);
}

.compose-inline-button.is-soft {
  background: rgba(210, 121, 87, 0.12);
  border-color: rgba(210, 121, 87, 0.2);
}

.compose-atelier-hero {
  grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr);
  align-items: stretch;
}

.compose-atelier-intro,
.compose-atelier-preview-card,
.compose-atelier-form-shell {
  display: grid;
  gap: 1.05rem;
  padding: 1.18rem;
}

.compose-atelier-intro {
  background:
    radial-gradient(circle at top right, rgba(226, 193, 206, 0.18), transparent 24%),
    linear-gradient(180deg, rgba(255, 248, 243, 0.94), rgba(255, 255, 255, 0.68));
}

.compose-atelier-intro h1,
.compose-atelier-preview-card h2,
.compose-atelier-section-head h2,
.compose-atelier-block-head h3 {
  margin: 0;
}

.compose-atelier-intro h1 {
  font-family: var(--font-display);
  font-weight: 400;
  letter-spacing: -0.032em;
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

.compose-atelier-preview-card h2,
.compose-atelier-section-head h2,
.compose-atelier-block-head h3 {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: -0.024em;
}

.compose-atelier-preview-card h2,
.compose-atelier-block-head h3 {
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.compose-atelier-section-head h2 {
  font-size: var(--type-section-title-size);
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.compose-atelier-intro h1 {
  display: grid;
  gap: 0.28rem;
  font-size: var(--type-page-title-size);
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
}

.compose-atelier-lead,
.compose-atelier-sublead,
.compose-atelier-overview-card p,
.compose-atelier-preview-card p,
.compose-atelier-form-note,
.compose-atelier-block-head p,
.compose-inline-note,
.compose-detail-card p,
.compose-select-hint {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(61, 46, 40, 0.74);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.compose-atelier-intro-copy,
.compose-atelier-preview-copy {
  gap: 0.75rem;
}

.compose-atelier-lead {
  max-width: 33ch;
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-line);
}

.compose-atelier-sublead,
.compose-atelier-preview-note {
  max-width: 42ch;
  color: rgba(76, 59, 50, 0.7);
}

.compose-atelier-sequence-card {
  display: grid;
  gap: 0.32rem;
  padding: 0.92rem 0.96rem;
  border-radius: 22px;
  border: 1px solid rgba(126, 96, 76, 0.1);
  background: rgba(255, 255, 255, 0.54);
}

.compose-atelier-sequence-card span {
  margin: 0;
  color: rgba(70, 53, 45, 0.62);
  font-family: var(--font-body);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: var(--type-eyebrow-spacing);
}

.compose-atelier-sequence-card strong {
  color: #2e1f19;
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.compose-atelier-sequence-card p {
  margin: 0;
  color: rgba(76, 59, 50, 0.68);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: 1.55;
}

.compose-atelier-overview-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.78rem;
}

.compose-atelier-overview-card,
.compose-atelier-preview-meta article,
.compose-owner-card,
.compose-choice-card,
.compose-detail-card {
  border: 1px solid rgba(126, 96, 76, 0.12);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
}

.compose-atelier-overview-card,
.compose-atelier-preview-meta article,
.compose-owner-card,
.compose-choice-card,
.compose-detail-card {
  display: grid;
  gap: 0.38rem;
  padding: 0.95rem 1rem;
}

.compose-atelier-overview-card.is-wide {
  grid-column: 1 / -1;
}

.compose-atelier-overview-card strong,
.compose-atelier-preview-meta strong,
.compose-owner-card strong,
.compose-hint-head strong {
  color: #2e1f19;
  font-family: var(--font-heading);
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.24;
  letter-spacing: -0.02em;
}

.compose-atelier-preview-card {
  background:
    radial-gradient(circle at top right, rgba(234, 211, 151, 0.22), transparent 24%),
    linear-gradient(180deg, rgba(255, 251, 246, 0.98), rgba(249, 241, 232, 0.76));
}

.compose-atelier-chip {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.42rem 0.76rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(126, 96, 76, 0.12);
  color: #3d2c25;
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.compose-atelier-preview-meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.compose-atelier-preview-panel {
  gap: 0.38rem;
}

.compose-atelier-preview-panel.is-wide {
  grid-column: 1 / -1;
}

.compose-atelier-form-shell {
  background: rgba(255, 252, 246, 0.84);
}

.compose-atelier-section-head,
.compose-atelier-block-head,
.compose-hint-head {
  display: grid;
  gap: 0.3rem;
}

.compose-atelier-section-head {
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.78fr);
  align-items: start;
  gap: 0.9rem 1.2rem;
}

.compose-atelier-section-copy {
  gap: 0.35rem;
  max-width: 36rem;
}

.compose-atelier-sequence {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.78rem;
}

.compose-atelier-section-aside {
  gap: 0.55rem;
  justify-items: start;
}

.compose-atelier-state-pill {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0.42rem 0.78rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.74);
  color: rgba(70, 53, 45, 0.78);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.compose-atelier-block {
  gap: 0.92rem;
  padding: 1.08rem;
  border: 1px solid rgba(126, 96, 76, 0.1);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.56);
}

.compose-atelier-block.is-foundation {
  background: linear-gradient(180deg, rgba(255, 252, 247, 0.9), rgba(255, 255, 255, 0.56));
}

.compose-atelier-block.is-direction {
  background: linear-gradient(180deg, rgba(251, 246, 240, 0.92), rgba(255, 255, 255, 0.54));
}

.compose-atelier-block.is-memory {
  background: linear-gradient(180deg, rgba(249, 242, 236, 0.9), rgba(255, 255, 255, 0.52));
}

.compose-atelier-form-grid,
.compose-detail-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compose-field {
  display: grid;
  gap: 0.58rem;
}

.compose-field.is-wide {
  grid-column: span 2;
}

.compose-category-row {
  margin-top: 0.05rem;
}

.compose-category-chip {
  padding: 0.48rem 0.82rem;
}

.compose-choice-stack {
  gap: 0.72rem;
}

.compose-choice-card {
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.84fr);
  align-items: start;
  gap: 0.9rem 1rem;
}

.compose-choice-copy {
  gap: 0.34rem;
}

.compose-choice-copy strong {
  color: #2e1f19;
  font-family: var(--font-heading);
  font-size: 1.02rem;
  font-weight: 600;
  line-height: 1.36;
  letter-spacing: -0.02em;
}

.compose-select-shell {
  position: relative;
}

.compose-select-shell select {
  appearance: none;
  padding-right: 2.8rem;
}

.compose-select-caret {
  position: absolute;
  top: 50%;
  right: 1rem;
  width: 10px;
  height: 10px;
  border-right: 2px solid rgba(102, 78, 63, 0.52);
  border-bottom: 2px solid rgba(102, 78, 63, 0.52);
  transform: translateY(-70%) rotate(45deg);
  pointer-events: none;
}

.compose-inline-note {
  padding: 0 0.12rem;
  max-width: 58ch;
}

.compose-step-row {
  display: grid;
  gap: 0.45rem;
}

.compose-step-input-row {
  align-items: center;
}

.compose-atelier-submit-row {
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.9rem 1rem;
  align-items: end;
  padding-top: 0.18rem;
}

.compose-atelier-submit-copy {
  gap: 0.4rem;
  max-width: 34rem;
}

.compose-atelier-submit-copy span {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(70, 53, 45, 0.68);
  font-size: var(--type-eyebrow-size);
  font-weight: 600;
  letter-spacing: var(--type-eyebrow-spacing);
  line-height: 1.4;
  text-transform: uppercase;
}

.compose-atelier-submit-copy p {
  margin: 0;
  font-family: var(--font-body);
  color: rgba(76, 59, 50, 0.74);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.compose-atelier-actions {
  justify-content: flex-start;
}

.compose-feedback {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.compose-feedback.success {
  color: var(--success);
}

.compose-feedback.danger {
  color: var(--danger);
}

@media (max-width: 1100px) {
  .compose-atelier-hero,
  .compose-atelier-section-head,
  .compose-atelier-sequence,
  .compose-choice-card,
  .compose-atelier-submit-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 820px) {
  .compose-atelier-overview-grid,
  .compose-atelier-preview-meta,
  .compose-atelier-form-grid,
  .compose-detail-grid,
  .compose-step-input-row {
    grid-template-columns: 1fr;
  }

  .compose-atelier-overview-card.is-wide,
  .compose-atelier-preview-panel.is-wide {
    grid-column: auto;
  }

  .compose-field.is-wide {
    grid-column: auto;
  }
}

@media (max-width: 640px) {
  .compose-atelier-intro h1 {
    font-size: var(--type-page-title-size);
  }

  .compose-atelier-intro,
  .compose-atelier-preview-card,
  .compose-atelier-form-shell,
  .compose-atelier-block,
  .compose-atelier-overview-card,
  .compose-atelier-preview-meta article,
  .compose-owner-card,
  .compose-choice-card,
  .compose-detail-card {
    padding: 0.9rem;
  }

  .compose-atelier-button,
  .compose-submit-button,
  .compose-reset-button,
  .compose-inline-button,
  .compose-category-chip {
    min-height: 40px;
  }
}
</style>