<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useSpacePreviewState } from '../composables/useSpacePreviewState'

const {
  activePanel,
  actionStage,
  actionStages,
  actionSummary,
  activeActionStage,
  dailyNoteDraft,
  dailyTitleDraft,
  editorSummary,
  headerBadges,
  headerDigest,
  headerLead,
  headerNote,
  headerTitle,
  pendingCountEntries,
  pendingStepEntries,
  premiumCostDraft,
  premiumNoteDraft,
  premiumTitleDraft,
  previewAction,
  previewPanels,
  previewMessage,
  recentEntries,
  redeemEntries,
  rewardFormSections,
  rewardShelfSections,
  sharedRewardDigest,
  toolEntryPills,
} = useSpacePreviewState()

const hasActiveEntries = computed(() => {
  if (actionStage.value === 'steps') {
    return pendingStepEntries.value.length > 0
  }

  if (actionStage.value === 'count') {
    return pendingCountEntries.value.length > 0
  }

  if (actionStage.value === 'redeem') {
    return redeemEntries.value.length > 0
  }

  return recentEntries.value.length > 0
})
</script>

<template>
  <section class="space-preview-page">
    <div class="preview-page-head">
      <RouterLink class="preview-page-link" :to="{ name: 'preview-lab' }">返回 Preview Lab</RouterLink>
      <RouterLink class="preview-page-link subtle" :to="{ name: 'space' }">查看正式空间页</RouterLink>
    </div>

    <article class="space-preview-hero page-card">
      <div class="space-preview-hero-copy">
        <p class="eyebrow">Space Preview</p>
        <h1>{{ headerTitle }}</h1>
        <p class="space-preview-hero-lead">{{ headerLead }}</p>
      </div>

      <div class="space-preview-hero-side">
        <div class="space-preview-pill-row">
          <span v-for="badge in headerBadges" :key="badge" class="space-preview-pill">{{ badge }}</span>
        </div>
        <p class="space-preview-hero-meta strong">{{ headerDigest.memberLine }}</p>
        <p class="space-preview-hero-meta">{{ headerDigest.stateLine }}</p>
        <p class="space-preview-hero-note">{{ headerNote }}</p>
      </div>
    </article>

    <article class="space-preview-stage page-card unified-stage">
      <header class="space-preview-stage-head">
        <div>
          <p class="eyebrow">Reward Hub</p>
          <h2>{{ activePanel === 'claim' ? actionSummary.title : editorSummary.title }}</h2>
          <p class="space-preview-stage-lead">{{ activePanel === 'claim' ? actionSummary.note : editorSummary.note }}</p>
        </div>

        <div class="space-preview-pill-row compact">
          <span
            v-for="pill in activePanel === 'claim' ? actionSummary.pills : editorSummary.pills"
            :key="pill"
            class="space-preview-pill muted"
          >
            {{ pill }}
          </span>
        </div>
      </header>

      <div class="space-preview-mode-row" role="tablist" aria-label="空间页预览主卡切换">
        <button
          v-for="panel in previewPanels"
          :key="panel.key"
          type="button"
          class="space-preview-mode-tab"
          :class="{ active: activePanel === panel.key }"
          @click="activePanel = panel.key"
        >
          <span>{{ panel.title }}</span>
          <small>{{ panel.note }}</small>
        </button>
      </div>

      <p class="space-preview-inline-note">{{ previewMessage }}</p>

      <template v-if="activePanel === 'claim'">
        <div class="space-preview-tab-row" role="tablist" aria-label="空间页预览领奖分段切换">
          <button
            v-for="item in actionStages"
            :key="item.key"
            type="button"
            class="space-preview-tab"
            :class="{ active: actionStage === item.key }"
            @click="actionStage = item.key"
          >
            <span>{{ item.title }}</span>
            <strong>{{ item.count }}</strong>
            <small>{{ item.note }}</small>
          </button>
        </div>

        <section v-if="actionStage === 'steps' && hasActiveEntries" class="space-preview-feed">
          <article v-for="entry in pendingStepEntries" :key="entry.id" class="space-preview-feed-row">
            <div class="space-preview-feed-copy">
              <span>{{ entry.source }}</span>
              <strong>{{ entry.title }}</strong>
              <small>{{ entry.meta }}</small>
            </div>
            <div class="space-preview-compact-actions">
              <button class="space-preview-button" type="button" @click="previewAction('领日常奖励')">领日常奖励</button>
              <button class="space-preview-button" type="button" @click="previewAction('存成星星币')">存成星星币</button>
            </div>
          </article>
        </section>

        <section v-else-if="actionStage === 'count' && hasActiveEntries" class="space-preview-feed">
          <article v-for="entry in pendingCountEntries" :key="entry.id" class="space-preview-feed-row">
            <div class="space-preview-feed-copy">
              <span>{{ entry.source }}</span>
              <strong>{{ entry.title }}</strong>
              <small>{{ entry.meta }}</small>
            </div>
            <div class="space-preview-compact-actions">
              <button class="space-preview-button" type="button" @click="previewAction('领 1 点奖励')">领 1 点</button>
              <button class="space-preview-button" type="button" @click="previewAction('整批存成星星币')">整批存币</button>
            </div>
          </article>
        </section>

        <section v-else-if="actionStage === 'redeem' && hasActiveEntries" class="space-preview-feed">
          <article v-for="entry in redeemEntries" :key="entry.id" class="space-preview-feed-row">
            <div class="space-preview-feed-copy">
              <span>{{ entry.trailingLabel }}</span>
              <strong>{{ entry.title }}</strong>
              <small>{{ entry.meta }}</small>
            </div>
            <div class="space-preview-compact-actions">
              <button class="space-preview-button" type="button" @click="previewAction(entry.isRedeemableNow ? '兑换这份奖励' : '查看兑换门槛')">
                {{ entry.isRedeemableNow ? '兑换这份奖励' : '还不能换' }}
              </button>
            </div>
          </article>
        </section>

        <section v-else-if="actionStage === 'recent' && hasActiveEntries" class="space-preview-feed recent-feed">
          <article v-for="entry in recentEntries" :key="entry.id" class="space-preview-feed-row recent-row">
            <div class="space-preview-feed-copy">
              <span>{{ entry.typeLabel }}</span>
              <strong>{{ entry.title }}</strong>
              <small>{{ entry.meta }}</small>
            </div>
            <div class="space-preview-trailing-tag">{{ entry.trailingLabel }}</div>
          </article>
        </section>

        <div v-else class="space-preview-empty-card">
          <p class="space-preview-mini-kicker">这段先留白</p>
          <h3>{{ activeActionStage.emptyTitle }}</h3>
          <p>这版先验证结构密度和窄屏阅读，不急着把空态写成长段说明。</p>
        </div>
      </template>

      <template v-else>
        <div class="space-preview-form-grid">
          <section v-for="form in rewardFormSections" :key="form.key" class="space-preview-form-panel">
            <div class="space-preview-form-head">
              <div>
                <p class="space-preview-mini-kicker">{{ form.key === 'daily' ? '给小步骤' : '留给大日子' }}</p>
                <h3>{{ form.title }}</h3>
              </div>
              <p>{{ form.helper }}</p>
            </div>

            <label class="space-preview-field-row">
              <span>{{ form.primaryLabel }}</span>
              <input
                v-if="form.key === 'daily'"
                v-model="dailyTitleDraft"
                type="text"
                maxlength="120"
                :placeholder="form.primaryPlaceholder"
              />
              <input
                v-else
                v-model="premiumTitleDraft"
                type="text"
                maxlength="120"
                :placeholder="form.primaryPlaceholder"
              />
            </label>

            <label class="space-preview-field-row textarea">
              <span>{{ form.secondaryLabel }}</span>
              <textarea
                v-if="form.key === 'daily'"
                v-model="dailyNoteDraft"
                rows="2"
                maxlength="240"
                :placeholder="form.notePlaceholder"
              />
              <textarea
                v-else
                v-model="premiumNoteDraft"
                rows="2"
                maxlength="240"
                :placeholder="form.notePlaceholder"
              />
            </label>

            <label v-if="form.costLabel" class="space-preview-field-row compact">
              <span>{{ form.costLabel }}</span>
              <input v-model.number="premiumCostDraft" type="number" min="0" max="999" />
            </label>

            <div class="space-preview-action-row">
              <button class="space-preview-button primary" type="button" @click="previewAction(form.key === 'daily' ? '加入日常奖励' : '加入高档奖励')">
                {{ form.key === 'daily' ? '加入日常奖励' : '加入高档奖励' }}
              </button>
              <button class="space-preview-button" type="button" @click="previewAction(form.key === 'daily' ? '整理日常奖励' : '整理高档奖励')">
                先看更紧的编辑节奏
              </button>
            </div>
          </section>
        </div>

        <section class="space-preview-shelf-block">
          <div class="space-preview-subhead">
            <div>
              <p class="space-preview-mini-kicker">Reward Shelf</p>
              <h3>已写奖励先收成更薄的目录</h3>
            </div>
            <p>这版只保留标题和一句 meta，不再把每条奖励都铺成大卡。</p>
          </div>

          <div class="space-preview-shelf-grid">
            <section v-for="section in rewardShelfSections" :key="section.title" class="space-preview-list-panel">
              <div class="space-preview-list-head">
                <h4>{{ section.title }}</h4>
                <span v-if="section.hiddenCount > 0">另有 {{ section.hiddenCount }} 条</span>
              </div>

              <div v-if="section.items.length" class="space-preview-list-stack">
                <article v-for="item in section.items" :key="item.id" class="space-preview-list-row">
                  <strong>{{ item.title }}</strong>
                  <small>{{ item.meta }}</small>
                </article>
              </div>

              <p v-else class="space-preview-empty-line">{{ section.emptyLabel }}</p>
            </section>
          </div>
        </section>

        <section class="space-preview-subtle-band">
          <div>
            <p class="space-preview-mini-kicker">Shared Pool</p>
            <h3>双方奖池先压成摘要，不再整块铺开</h3>
          </div>

          <div class="space-preview-member-row">
            <article v-for="item in sharedRewardDigest" :key="item.memberId" class="space-preview-member-strip">
              <strong>{{ item.memberName }}</strong>
              <small>{{ item.summary }}</small>
            </article>
          </div>
        </section>
      </template>
    </article>

    <article class="space-preview-tools page-card">
      <div>
        <p class="eyebrow">Space Tools</p>
        <h2>后页工具这轮先只留入口</h2>
      </div>
      <p>进入与邀请、照片与备份、空间概览、同步与退出先收成轻量目录，等核心三段评审通过再继续深改。</p>
      <div class="space-preview-pill-row compact">
        <span v-for="pill in toolEntryPills" :key="pill" class="space-preview-pill muted">{{ pill }}</span>
      </div>
    </article>
  </section>
</template>

<style scoped>
.space-preview-page {
  display: grid;
  gap: 1rem;
}

.preview-page-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.8rem;
}

.preview-page-link {
  display: inline-flex;
  align-items: center;
  min-height: 2.6rem;
  padding: 0.68rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(92, 77, 62, 0.1);
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-main);
  text-decoration: none;
  transition: border-color 180ms ease, transform 180ms ease, background 180ms ease;
}

.preview-page-link.subtle {
  background: rgba(246, 243, 237, 0.82);
  color: var(--text-soft);
}

.preview-page-link:hover {
  transform: translateY(-1px);
  border-color: rgba(201, 111, 74, 0.22);
}

.space-preview-hero,
.space-preview-stage,
.space-preview-tools,
.space-preview-form-grid,
.space-preview-shelf-grid,
.space-preview-feed,
.space-preview-list-stack,
.space-preview-member-row,
.space-preview-tab-row {
  display: grid;
  gap: 0.9rem;
}

.space-preview-hero,
.space-preview-stage,
.space-preview-tools {
  padding: clamp(1rem, 2vw, 1.4rem);
}

.space-preview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.95fr);
  gap: 1rem;
  background:
    radial-gradient(circle at top left, rgba(253, 236, 216, 0.78), transparent 28%),
    linear-gradient(160deg, rgba(252, 249, 244, 0.98), rgba(243, 238, 231, 0.96));
}

.space-preview-stage {
  background: rgba(255, 253, 249, 0.9);
}

.space-preview-tools {
  background: linear-gradient(160deg, rgba(245, 243, 238, 0.92), rgba(236, 232, 224, 0.9));
}

.space-preview-hero-copy,
.space-preview-hero-side,
.space-preview-subtle-band,
.space-preview-form-panel,
.space-preview-list-panel,
.space-preview-feed-row,
.space-preview-empty-card {
  display: grid;
  gap: 0.7rem;
}

.space-preview-hero-copy h1,
.space-preview-stage-head h2,
.space-preview-form-head h3,
.space-preview-subhead h3,
.space-preview-tools h2,
.space-preview-empty-card h3 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: -0.04em;
}

.space-preview-hero-copy h1 {
  max-width: 11ch;
  font-size: clamp(2rem, 5vw, 3.9rem);
  line-height: 0.98;
}

.space-preview-stage-head h2,
.space-preview-tools h2,
.space-preview-empty-card h3 {
  font-size: clamp(1.45rem, 3vw, 2.2rem);
  line-height: 1.04;
}

.space-preview-hero-lead,
.space-preview-hero-meta,
.space-preview-hero-note,
.space-preview-stage-lead,
.space-preview-inline-note,
.space-preview-form-head p,
.space-preview-subhead p,
.space-preview-tools p,
.space-preview-empty-card p,
.space-preview-empty-line {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.78;
}

.space-preview-hero-lead,
.space-preview-stage-lead {
  color: var(--text-main);
  font-size: 1rem;
}

.space-preview-hero-side {
  align-content: start;
  padding: 0.95rem 1rem;
  border-radius: 28px;
  border: 1px solid rgba(92, 77, 62, 0.08);
  background: rgba(255, 255, 255, 0.62);
}

.space-preview-hero-meta.strong {
  color: var(--text-main);
  font-weight: 600;
}

.space-preview-pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.space-preview-pill {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.72rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(249, 245, 239, 0.88);
  font-size: 0.82rem;
}

.space-preview-pill.muted {
  background: rgba(244, 240, 233, 0.92);
  color: var(--text-soft);
}

.space-preview-pill-row.compact {
  justify-content: flex-start;
}

.space-preview-stage-head,
.space-preview-subhead,
.space-preview-list-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.7rem 1rem;
  align-items: end;
}

.space-preview-inline-note {
  padding: 0.8rem 0.9rem;
  border-radius: 18px;
  background: rgba(246, 239, 228, 0.72);
}

.space-preview-form-grid,
.space-preview-shelf-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.space-preview-form-panel,
.space-preview-list-panel,
.space-preview-subtle-band,
.space-preview-empty-card {
  padding: 0.95rem 1rem;
  border-radius: 26px;
  border: 1px solid rgba(92, 77, 62, 0.08);
  background: rgba(255, 255, 255, 0.72);
}

.space-preview-form-head,
.space-preview-feed-copy {
  display: grid;
  gap: 0.28rem;
}

.space-preview-mini-kicker,
.space-preview-feed-copy span,
.space-preview-list-head span,
.space-preview-trailing-tag {
  margin: 0;
  color: rgba(76, 59, 50, 0.64);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.space-preview-field-row {
  display: grid;
  gap: 0.42rem;
}

.space-preview-field-row span {
  color: var(--text-soft);
  font-size: 0.84rem;
}

.space-preview-field-row input,
.space-preview-field-row textarea {
  width: 100%;
  padding: 0.8rem 0.88rem;
  border: 1px solid rgba(126, 96, 76, 0.12);
  border-radius: 18px;
  background: rgba(255, 252, 247, 0.92);
  color: var(--text-main);
  font: inherit;
}

.space-preview-field-row textarea {
  resize: vertical;
}

.space-preview-action-row,
.space-preview-compact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.space-preview-button {
  min-height: 2.5rem;
  padding: 0.68rem 0.9rem;
  border: 1px solid rgba(126, 96, 76, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-main);
  font: inherit;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.space-preview-button.primary {
  background: rgba(245, 228, 208, 0.92);
}

.space-preview-button:hover,
.space-preview-tab:hover {
  transform: translateY(-1px);
  border-color: rgba(201, 111, 74, 0.22);
}

.space-preview-list-head h4,
.space-preview-list-row strong,
.space-preview-feed-copy strong,
.space-preview-member-strip strong {
  margin: 0;
  font-family: var(--font-heading);
  font-weight: 600;
}

.space-preview-list-stack,
.space-preview-feed {
  gap: 0.65rem;
}

.space-preview-list-row,
.space-preview-feed-row,
.space-preview-member-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.7rem 1rem;
  align-items: start;
  padding: 0.78rem 0;
  border-top: 1px solid rgba(92, 77, 62, 0.08);
}

.space-preview-list-stack .space-preview-list-row:first-child,
.space-preview-feed .space-preview-feed-row:first-child,
.space-preview-member-row .space-preview-member-strip:first-child {
  padding-top: 0;
  border-top: 0;
}

.space-preview-list-row small,
.space-preview-feed-copy small,
.space-preview-member-strip small,
.space-preview-tab small {
  color: var(--text-soft);
  line-height: 1.7;
}

.space-preview-subtle-band,
.space-preview-member-row {
  gap: 0.8rem;
}

.space-preview-mode-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;
}

.space-preview-mode-tab {
  display: grid;
  gap: 0.22rem;
  padding: 0.8rem 0.95rem;
  border: 1px solid rgba(92, 77, 62, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  color: var(--text-main);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.space-preview-mode-tab span {
  font-family: var(--font-heading);
  font-size: 1.02rem;
  font-weight: 600;
}

.space-preview-mode-tab small {
  color: var(--text-soft);
  line-height: 1.6;
}

.space-preview-mode-tab.active {
  border-color: rgba(201, 111, 74, 0.22);
  box-shadow: 0 14px 28px rgba(88, 66, 45, 0.06);
}

.space-preview-tab-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.space-preview-tab {
  display: grid;
  gap: 0.26rem;
  align-content: start;
  padding: 0.9rem 0.95rem;
  border: 1px solid rgba(92, 77, 62, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.74);
  text-align: left;
  color: var(--text-main);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.space-preview-tab.active {
  border-color: rgba(201, 111, 74, 0.22);
  box-shadow: 0 14px 28px rgba(88, 66, 45, 0.06);
}

.space-preview-tab span,
.space-preview-tab strong,
.space-preview-trailing-tag {
  font-family: var(--font-heading);
}

.space-preview-tab strong {
  font-size: 1.25rem;
}

.space-preview-feed-row.recent-row {
  align-items: center;
}

.space-preview-trailing-tag {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.72rem;
  border-radius: 999px;
  background: rgba(245, 239, 229, 0.9);
}

@media (max-width: 980px) {
  .space-preview-hero,
  .space-preview-mode-row,
  .space-preview-form-grid,
  .space-preview-shelf-grid,
  .space-preview-tab-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .preview-page-head,
  .space-preview-stage-head,
  .space-preview-subhead,
  .space-preview-list-head,
  .space-preview-feed-row,
  .space-preview-list-row,
  .space-preview-member-strip {
    align-items: start;
  }

  .space-preview-hero-copy h1 {
    max-width: none;
  }

  .space-preview-button,
  .space-preview-compact-actions {
    width: 100%;
  }
}
</style>