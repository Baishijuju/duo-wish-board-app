<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useReviewPageState } from '../composables/useReviewPageState'

const {
  activeReviewTabOption,
  completedWishJournals,
  currentMonthLabel,
  formatDateLabel,
  formatDateTimeLabel,
  formatMonthLabel,
  getMemberName,
  getMemberToneClass,
  getSnapshotBlockActor,
  getSnapshotBlockActorId,
  getSnapshotBlockKey,
  getSnapshotBlockLabel,
  getSnapshotBlockMessage,
  getSnapshotMetric,
  getThreadActorName,
  getThreadEventLabel,
  getWishJournalPreview,
  getWishScopeLabel,
  getWishTitle,
  liveMonthlyThreads,
  monthlyNote,
  monthlySnapshots,
  reviewHeroAside,
  reviewHeroLead,
  reviewHeroTitle,
  reviewMemberSummaries,
  reviewHighlights,
  reviewTab,
  reviewTabOptions,
  getSnapshotPreviewBlocks,
} = useReviewPageState()
</script>

<template>
  <section class="page-stack review-page">
    <article class="page-card review-story-card">
      <div class="section-heading review-story-head">
        <div class="review-story-copy">
          <p class="eyebrow">回顾页 Review</p>
          <h2 class="section-title">{{ reviewHeroTitle }}</h2>
          <p class="section-copy review-copy">
            {{ reviewHeroLead }}
          </p>
          <p class="review-story-subnote">{{ reviewHeroAside }}</p>
        </div>

        <div class="review-story-tools">
          <span class="badge review-story-pill">{{ currentMonthLabel }} 正在写这一期</span>
          <div class="button-row review-story-actions">
            <RouterLink class="button-subtle" :to="{ name: 'space' }">去空间整理奖励</RouterLink>
            <RouterLink class="button-link" :to="{ name: 'list' }">回清单继续推进</RouterLink>
          </div>
        </div>
      </div>

      <div class="summary-grid review-stats">
        <article
          v-for="highlight in reviewHighlights"
          :key="highlight.key"
          :class="['summary-card', highlight.accent, 'review-stat-card', { 'is-primary': highlight.featured }]"
        >
          <span class="review-stat-kicker">{{ highlight.eyebrow }}</span>
          <p class="review-stat-label">{{ highlight.label }}</p>
          <strong>{{ highlight.value }}</strong>
          <p class="review-stat-note">{{ highlight.note }}</p>
        </article>
      </div>
    </article>

    <article class="page-card monthly-note-card">
      <div class="review-note-head">
        <div>
          <p class="eyebrow">本月小注 Monthly Note</p>
          <h3>这一期刚刚写到这里</h3>
        </div>
        <span class="badge">{{ currentMonthLabel }}</span>
      </div>
      <p>{{ monthlyNote }}</p>
    </article>

    <article class="page-card review-tabs-card">
      <div class="review-tab-head">
        <div class="section-heading review-tab-intro">
          <div class="review-tab-copy">
            <p class="eyebrow">翻阅目录 Reading Shelf</p>
            <h3>这次想先翻哪一册</h3>
            <p class="section-copy review-tab-note">三种视角读的是同一段日子，只是分别看完成、本月和封存。</p>
          </div>
          <div class="review-tab-current">
            <span class="badge">{{ activeReviewTabOption.count }}</span>
            <p>{{ activeReviewTabOption.note }}</p>
          </div>
        </div>

        <div class="review-tab-row">
          <button
            v-for="tab in reviewTabOptions"
            :key="tab.value"
            class="review-tab-button"
            type="button"
            :class="{ active: reviewTab === tab.value }"
            @click="reviewTab = tab.value"
          >
            <span class="review-tab-kicker">{{ tab.eyebrow }}</span>
            <div class="review-tab-main">
              <span>{{ tab.label }}</span>
              <small>{{ tab.count }}</small>
            </div>
            <p>{{ tab.note }}</p>
          </button>
        </div>

        <div v-if="reviewMemberSummaries.length" class="review-member-band">
          <article v-for="member in reviewMemberSummaries" :key="member.memberId" :class="['review-member-summary', member.toneClass]">
            <div class="review-member-summary-head">
              <div>
                <p class="review-member-role">{{ member.roleLabel }}</p>
                <h4>{{ member.memberName }}</h4>
              </div>
              <span class="badge review-member-badge">{{ member.countLabel }}</span>
            </div>
            <p class="review-member-summary-copy">{{ member.summaryText }}</p>
            <p class="review-member-summary-meta">{{ member.latestText }}</p>
          </article>
        </div>
      </div>

      <div v-if="reviewTab === 'journals'" class="review-panel-stack">
        <div class="section-heading review-panel-head">
          <div class="review-panel-copy">
            <p class="eyebrow">完成手账 Journals</p>
            <h2 class="section-title">已经走完整条路的这些册页</h2>
            <p class="section-copy review-panel-note">这些愿望已经完成，更适合回头翻过程。</p>
          </div>
          <span class="badge">{{ completedWishJournals.length }} 本</span>
        </div>

        <div v-if="completedWishJournals.length" class="journal-grid">
          <article v-for="wish in completedWishJournals" :key="wish.id" class="journal-card">
            <div class="journal-card-band">
              <span class="review-card-chip">完成手账</span>
              <span class="review-item-time">实现于 {{ formatDateLabel(wish.completedAt ?? wish.updatedAt) }}</span>
            </div>

            <div class="journal-card-head">
              <div class="journal-card-copy">
                <div class="review-card-kicker-row">
                  <p class="review-card-kicker">{{ getWishScopeLabel(wish.scope) }}</p>
                  <span :class="['review-member-pill', getMemberToneClass(wish.ownerId)]">{{ getMemberName(wish.ownerId) }}</span>
                </div>
                <h3>{{ wish.title }}</h3>
                <p class="journal-card-note">这条愿望已经完成，适合回头翻过程。</p>
              </div>
              <div class="review-card-meter">
                <span class="review-card-meter-value">{{ getWishJournalPreview(wish.id).length }}</span>
                <span class="review-card-meter-label">最近摘录</span>
              </div>
            </div>

            <div class="review-preview-shell">
              <div class="review-subsection-head">
                <span class="review-preview-label">最近翻到的三笔</span>
                <p>先从最后几句开始读，会更快想起来。</p>
              </div>

              <div class="journal-preview-list">
                <article v-for="entry in getWishJournalPreview(wish.id)" :key="entry.id" class="journal-preview-item">
                  <div class="review-preview-meta">
                    <span class="review-preview-kicker">{{ getThreadEventLabel(entry.eventKind) }}</span>
                    <span :class="['review-member-pill', getMemberToneClass(entry.actorId)]">{{ getThreadActorName(entry) }}</span>
                  </div>
                  <p>{{ entry.messageText }}</p>
                </article>
              </div>
            </div>

            <div class="button-row review-card-actions">
              <RouterLink class="button-subtle" :to="{ name: 'wish-detail', params: { id: wish.id } }">打开完整手账</RouterLink>
            </div>
          </article>
        </div>

        <div v-else class="empty-card">
          <span class="review-empty-kicker">完成手账还在等第一册</span>
          <h3>还没有愿望被正式收进这册手账</h3>
          <p>等第一条愿望完成后，它就会留在这里。</p>
          <div class="review-empty-path">
            <article class="review-empty-step">
              <strong>先从清单里挑一条</strong>
              <p>挑一条最想先看见结果的愿望。</p>
            </article>
            <article class="review-empty-step">
              <strong>推进、留言、投币</strong>
              <p>这些过程会先被详情页收住，完成后再翻到这里。</p>
            </article>
          </div>
          <div class="button-row review-empty-actions">
            <RouterLink class="button-subtle" :to="{ name: 'list' }">先去清单看看</RouterLink>
            <RouterLink class="button-link" :to="{ name: 'compose' }">写下一条新愿望</RouterLink>
          </div>
        </div>
      </div>

      <div v-else-if="reviewTab === 'live'" class="review-panel-stack">
        <div class="section-heading review-panel-head">
          <div class="review-panel-copy">
            <p class="eyebrow">本月页 Live</p>
            <h2 class="section-title">{{ currentMonthLabel }} 还在继续写</h2>
            <p class="section-copy review-panel-note">这里先保留这个月还在发生的记录，月后再封成固定月刊。</p>
          </div>
          <span class="badge">{{ liveMonthlyThreads.length }} 条</span>
        </div>

        <div v-if="liveMonthlyThreads.length" class="review-list">
          <article v-for="thread in liveMonthlyThreads" :key="thread.id" class="review-item">
            <div class="review-item-band">
              <span class="review-card-chip">{{ getThreadEventLabel(thread.eventKind) }}</span>
              <time class="review-item-time">{{ formatDateTimeLabel(thread.createdAt) }}</time>
            </div>

            <div class="review-item-head">
              <div class="review-item-copy">
                <p class="eyebrow review-item-eyebrow">{{ getWishTitle(thread) }}</p>
                <h3>{{ thread.messageText }}</h3>
                <p class="review-item-note">这笔记录先留在本月目录里，月后再封存。</p>
              </div>
            </div>
            <p class="review-meta-line">
              <span :class="['review-member-pill', getMemberToneClass(thread.actorId)]">{{ getThreadActorName(thread) }}</span>
              <span>{{ getThreadEventLabel(thread.eventKind) }}</span>
            </p>
            <div v-if="thread.wishId" class="button-row review-card-actions">
              <RouterLink class="button-link review-inline-link" :to="{ name: 'wish-detail', params: { id: thread.wishId } }">去这条愿望</RouterLink>
            </div>
          </article>
        </div>

        <div v-else class="empty-card">
          <span class="review-empty-kicker">本月页还很安静</span>
          <h3>这一期还没有新的实时记录</h3>
          <p>评论、投币、完成步骤和领奖都会先落在这里，月后再封存。</p>
          <div class="review-empty-path">
            <article class="review-empty-step">
              <strong>先让这一期开始动起来</strong>
              <p>只要有一条愿望被留言、推进或投币，这里就会开始有内容。</p>
            </article>
            <article class="review-empty-step">
              <strong>月底会自动封存</strong>
              <p>现在发生的是实时版本，过了这个月才会成册。</p>
            </article>
          </div>
          <div class="button-row review-empty-actions">
            <RouterLink class="button-subtle" :to="{ name: 'list' }">先去清单看看</RouterLink>
            <RouterLink class="button-link" :to="{ name: 'compose' }">先写下一条愿望</RouterLink>
          </div>
        </div>
      </div>

      <div v-else class="review-panel-stack">
        <div class="section-heading review-panel-head">
          <div class="review-panel-copy">
            <p class="eyebrow">冻结月刊 Snapshot</p>
            <h2 class="section-title">已经封存下来的固定月刊</h2>
            <p class="section-copy review-panel-note">这些页面不会再变化，适合回头慢慢翻看。</p>
          </div>
          <span class="badge">{{ monthlySnapshots.length }} 本</span>
        </div>

        <div v-if="monthlySnapshots.length" class="snapshot-grid">
          <article v-for="snapshot in monthlySnapshots" :key="snapshot.id" class="snapshot-card">
            <div class="snapshot-card-band">
              <span class="review-card-chip">固定月刊</span>
              <span class="review-item-time">{{ formatDateLabel(snapshot.createdAt) }} 冻结</span>
            </div>

            <div class="snapshot-card-head">
              <div class="snapshot-card-copy">
                <p class="eyebrow">{{ formatMonthLabel(snapshot.monthKey) }}</p>
                <h3>{{ snapshot.coverTitle }}</h3>
                <p class="snapshot-card-note">{{ snapshot.coverSubtitle }}</p>
              </div>
              <div class="review-card-meter">
                <span class="review-card-meter-value">{{ getSnapshotMetric(snapshot, 'threadCount') }}</span>
                <span class="review-card-meter-label">收进本册的记录</span>
              </div>
            </div>

            <div class="snapshot-metrics-grid">
              <article class="snapshot-metric-card">
                <span>记录</span>
                <strong>{{ getSnapshotMetric(snapshot, 'threadCount') }}</strong>
              </article>
              <article class="snapshot-metric-card">
                <span>留言</span>
                <strong>{{ getSnapshotMetric(snapshot, 'commentCount') }}</strong>
              </article>
              <article class="snapshot-metric-card">
                <span>卷期</span>
                <strong>{{ formatMonthLabel(snapshot.monthKey) }}</strong>
              </article>
            </div>

            <div class="review-preview-shell">
              <div class="review-subsection-head">
                <span class="review-preview-label">封面前三段</span>
                <p>先看这册最前面的几段，再决定要不要回头翻完整过程。</p>
              </div>

              <div class="snapshot-preview-list">
                <article
                  v-for="(block, index) in getSnapshotPreviewBlocks(snapshot)"
                  :key="getSnapshotBlockKey(snapshot.id, block, index)"
                  class="snapshot-preview-item"
                >
                  <div class="review-preview-meta">
                    <span class="review-preview-kicker">{{ getSnapshotBlockLabel(block) }}</span>
                    <span :class="['review-member-pill', getMemberToneClass(getSnapshotBlockActorId(block))]">
                      {{ getSnapshotBlockActor(block) }}
                    </span>
                  </div>
                  <p>{{ getSnapshotBlockMessage(block) }}</p>
                </article>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="empty-card">
          <span class="review-empty-kicker">固定月刊还没有第一册</span>
          <h3>还没有封存好的月刊</h3>
          <p>月份切换时，系统会把已经过去的月份自动冻结成固定版本。</p>
          <div class="review-empty-path">
            <article class="review-empty-step">
              <strong>先让这个月留下内容</strong>
              <p>实时回顾里要先有过程，月底它才有东西能被封存。</p>
            </article>
            <article class="review-empty-step">
              <strong>等月份切换自动成册</strong>
              <p>这一步不用手动操作，月份过去后系统会自己归档。</p>
            </article>
          </div>
          <div class="button-row review-empty-actions">
            <button class="button-subtle" type="button" @click="reviewTab = 'live'">先看本月实时回顾</button>
            <RouterLink class="button-link" :to="{ name: 'list' }">回清单继续推进</RouterLink>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.page-stack,
.review-story-card,
.monthly-note-card,
.review-tabs-card,
.review-panel-stack,
.review-list,
.journal-grid,
.snapshot-grid,
.journal-preview-list,
.snapshot-preview-list,
.review-story-copy,
.review-story-tools,
.review-note-head,
.review-tab-head,
.review-panel-copy,
.review-preview-shell,
.review-empty-path,
.snapshot-metrics-grid {
  display: grid;
  gap: 1rem;
}

.review-page .section-title {
  margin-bottom: 0.45rem;
  font-family: var(--font-heading);
  font-size: var(--type-section-title-size);
  font-weight: 600;
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.review-story-card {
  background:
    linear-gradient(135deg, rgba(255, 252, 246, 0.92), rgba(251, 244, 234, 0.9)),
    radial-gradient(circle at top right, rgba(216, 231, 220, 0.3), transparent 36%);
}

.review-story-card .section-title {
  max-width: 20ch;
  margin-bottom: 0.7rem;
  font-family: var(--font-display);
  font-size: var(--type-page-title-size);
  font-weight: 400;
  line-height: var(--type-page-title-line);
  letter-spacing: var(--type-page-title-tracking);
}

.review-copy,
.review-story-subnote,
.monthly-note-card p,
.review-item p,
.journal-card p,
.snapshot-card p,
.empty-card p,
.journal-preview-item p,
.snapshot-preview-item p {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.review-story-subnote,
.monthly-note-card p,
.snapshot-card p,
.empty-card p,
.journal-preview-item p,
.snapshot-preview-item p {
  color: rgba(76, 59, 50, 0.64);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.review-copy {
  max-width: 40rem;
  font-size: var(--type-lead-size);
  line-height: var(--type-lead-line);
}

.review-story-subnote {
  max-width: 38rem;
  color: rgba(76, 59, 50, 0.64);
}

.review-story-head {
  align-items: start;
}

.review-story-tools {
  justify-items: start;
  align-content: start;
  gap: 0.8rem;
}

.review-story-pill {
  min-height: 34px;
  padding-inline: 0.92rem;
}

.review-card-kicker,
.review-empty-kicker,
.review-preview-label {
  margin: 0;
  color: rgba(70, 53, 45, 0.66);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--type-eyebrow-size);
  letter-spacing: var(--type-eyebrow-spacing);
  line-height: 1.4;
}

.review-card-chip {
  margin: 0;
  color: rgba(70, 53, 45, 0.66);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.review-card-chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0.35rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(255, 255, 255, 0.68);
}

.monthly-note-card h3,
.review-tab-copy h3,
.review-item h3,
.journal-card h3,
.snapshot-card h3,
.empty-card h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.review-note-head {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
}

.review-note-head .eyebrow {
  margin-bottom: 0.45rem;
  font-size: var(--type-l7-size);
  letter-spacing: 0.14em;
}

.review-note-head h3 {
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.review-tab-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.review-tab-head {
  gap: 1rem;
}

.review-member-band {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.review-member-summary {
  display: grid;
  gap: 0.45rem;
  padding: 0.95rem 1rem;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.58);
}

.review-member-summary.is-rose {
  background: linear-gradient(180deg, rgba(255, 248, 243, 0.9), rgba(255, 255, 255, 0.72));
  border-color: rgba(201, 124, 97, 0.16);
}

.review-member-summary.is-sage {
  background: linear-gradient(180deg, rgba(245, 250, 246, 0.9), rgba(255, 255, 255, 0.72));
  border-color: rgba(132, 161, 145, 0.16);
}

.review-member-summary-head,
.review-card-kicker-row,
.review-preview-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.45rem 0.7rem;
  align-items: flex-start;
}

.review-member-role {
  margin: 0 0 0.2rem;
  color: rgba(70, 53, 45, 0.64);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  font-weight: 600;
  letter-spacing: 0.14em;
  line-height: 1.4;
  text-transform: uppercase;
}

.review-member-summary h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.review-member-summary-copy,
.review-member-summary-meta {
  margin: 0;
  font-family: var(--font-body);
}

.review-member-summary-copy {
  color: rgba(76, 59, 50, 0.74);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.review-member-summary-meta {
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.review-member-badge {
  min-height: 1.9rem;
}

.review-tab-note {
  max-width: 48rem;
}

.review-tab-intro,
.review-tab-copy,
.review-tab-current,
.review-tab-main {
  display: grid;
  gap: 0.45rem;
}

.review-tab-intro,
.review-tab-current {
  align-items: start;
}

.review-tab-current {
  justify-items: start;
  gap: 0.62rem;
}

.review-tab-current p,
.review-tab-button p {
  margin: 0;
  color: rgba(76, 59, 50, 0.72);
  font-family: var(--font-body);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.review-tab-button {
  display: grid;
  gap: 0.5rem;
  padding: 0.96rem 1rem;
  border-radius: 22px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.66);
  text-align: left;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.review-tab-kicker {
  margin: 0;
  color: rgba(70, 53, 45, 0.64);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.review-tab-button span {
  color: #2d201a;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.26;
  letter-spacing: -0.02em;
}

.review-tab-button small {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.review-tab-main {
  gap: 0.24rem;
}

.review-tab-button:hover {
  transform: translateY(-1px);
}

.review-tab-button.active {
  background: rgba(255, 243, 231, 0.92);
  border-color: rgba(185, 120, 53, 0.26);
  box-shadow: 0 12px 24px rgba(172, 116, 87, 0.08);
}

.review-panel-head {
  align-items: end;
}

.review-panel-note {
  max-width: 40rem;
}

.journal-card-band,
.review-item-band,
.snapshot-card-band,
.review-subsection-head,
.review-card-meter {
  display: grid;
  gap: 0.45rem;
}

.journal-card-band,
.review-item-band,
.snapshot-card-band {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
}

.review-subsection-head p,
.journal-card-note,
.review-item-note,
.snapshot-card-note,
.review-empty-step p {
  margin: 0;
  color: rgba(76, 59, 50, 0.62);
  font-family: var(--font-body);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
}

.review-card-meter {
  justify-items: end;
  text-align: right;
}

.review-card-meter-value,
.snapshot-metric-card strong {
  color: #2f211a;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.review-card-meter-label,
.snapshot-metric-card span {
  color: rgba(76, 59, 50, 0.68);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.journal-grid,
.snapshot-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.review-stats {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.82rem;
}

.review-stat-card {
  display: grid;
  align-content: start;
  gap: 0.38rem;
  grid-column: span 2;
}

.review-stat-card.is-primary {
  grid-column: span 6;
  background: linear-gradient(180deg, rgba(255, 250, 245, 0.96), rgba(255, 255, 255, 0.8));
}

.review-stat-kicker {
  position: relative;
  z-index: 1;
  margin: 0;
  color: rgba(70, 53, 45, 0.68);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.review-stat-label,
.review-stat-note {
  position: relative;
  z-index: 1;
  margin: 0;
}

.review-stat-label {
  color: rgba(73, 55, 45, 0.72);
  font-family: var(--font-body);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.review-stat-card strong {
  margin: 0.15rem 0 0;
  font-family: var(--font-heading);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.review-stat-note {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-body-size);
  line-height: var(--type-body-line);
}

.review-item,
.journal-card,
.snapshot-card,
.empty-card,
.journal-preview-item,
.snapshot-preview-item {
  display: grid;
  gap: 0.8rem;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.52);
  padding: 1rem;
}

.review-item,
.journal-card,
.snapshot-card,
.empty-card {
  gap: 0.92rem;
  padding: 1.05rem;
}

.journal-card,
.snapshot-card {
  align-content: start;
}

.journal-card,
.snapshot-card,
.review-item,
.empty-card {
  gap: 1rem;
}

.journal-card {
  background:
    linear-gradient(180deg, rgba(255, 250, 245, 0.92), rgba(255, 255, 255, 0.74)),
    radial-gradient(circle at top right, rgba(241, 214, 202, 0.16), transparent 28%);
}

.snapshot-card {
  background:
    linear-gradient(135deg, rgba(255, 250, 244, 0.88), rgba(248, 245, 240, 0.86)),
    linear-gradient(160deg, rgba(216, 231, 220, 0.12), transparent 56%);
}

.review-item-head,
.journal-card-head,
.snapshot-card-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem 1rem;
  align-items: start;
}

.review-item-copy,
.journal-card-copy,
.snapshot-card-copy {
  display: grid;
  gap: 0.4rem;
}

.review-item-eyebrow,
.snapshot-card .eyebrow {
  margin-bottom: 0;
}

.review-item-time {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  text-align: right;
}

.review-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.8rem;
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.review-member-pill {
  display: inline-flex;
  align-items: center;
  min-height: 1.9rem;
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(95, 74, 55, 0.12);
  background: rgba(255, 255, 255, 0.66);
  color: rgba(70, 53, 45, 0.86);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.review-member-pill.is-rose {
  background: rgba(255, 243, 236, 0.88);
  border-color: rgba(201, 124, 97, 0.18);
  color: rgba(138, 80, 60, 0.92);
}

.review-member-pill.is-sage {
  background: rgba(240, 248, 242, 0.88);
  border-color: rgba(132, 161, 145, 0.18);
  color: rgba(79, 111, 96, 0.92);
}

.review-member-pill.is-shared {
  background: rgba(248, 244, 237, 0.86);
  border-color: rgba(150, 129, 111, 0.16);
  color: rgba(106, 84, 72, 0.9);
}

.review-preview-kicker {
  color: rgba(70, 53, 45, 0.68);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.journal-preview-item,
.snapshot-preview-item {
  gap: 0.5rem;
  border-color: rgba(95, 74, 55, 0.08);
  background: rgba(255, 255, 255, 0.72);
}

.snapshot-metrics-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.68rem;
}

.snapshot-metric-card,
.review-empty-step {
  display: grid;
  gap: 0.35rem;
  padding: 0.85rem 0.92rem;
  border-radius: 18px;
  border: 1px solid rgba(95, 74, 55, 0.08);
  background: rgba(255, 255, 255, 0.72);
}

.review-empty-step strong {
  color: #2f211a;
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.26;
  letter-spacing: -0.02em;
}

.review-card-actions,
.review-empty-actions {
  gap: 0.58rem;
}

.review-inline-link {
  padding: 0.7rem 0.96rem;
}

.empty-card {
  background: rgba(255, 250, 244, 0.72);
}

@media (max-width: 720px) {
  .section-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-member-band,
  .review-tab-row {
    grid-template-columns: 1fr;
  }

  .review-note-head,
  .journal-card-band,
  .review-item-band,
  .snapshot-card-band,
  .review-item-head,
  .journal-card-head,
  .snapshot-card-head {
    grid-template-columns: 1fr;
  }

  .review-card-meter {
    justify-items: start;
    text-align: left;
  }

  .snapshot-metrics-grid {
    grid-template-columns: 1fr;
  }

  .review-item-time {
    text-align: left;
  }

  .review-member-summary-head,
  .review-card-kicker-row,
  .review-preview-meta {
    justify-content: flex-start;
  }

  .review-card-actions,
  .review-empty-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .review-card-actions > *,
  .review-empty-actions > * {
    width: 100%;
    justify-content: center;
  }

  .review-stats {
    grid-template-columns: 1fr;
  }

  .review-stat-card,
  .review-stat-card.is-primary {
    grid-column: auto;
  }
}
</style>