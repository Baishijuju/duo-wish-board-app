<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useReviewPreviewState } from '../composables/useReviewPreviewState'

const {
  activePreviewTab,
  currentMonthLabel,
  emptyStates,
  issueRibbonItems,
  journalShelfItems,
  leadMoment,
  liveTimelineGroups,
  memberDigest,
  monthlyNote,
  previewHeroAside,
  previewHeroLead,
  previewHeroTitle,
  previewTabs,
  reviewTab,
  snapshotShelfItems,
} = useReviewPreviewState()

const activeEmptyState = computed(() => emptyStates.value[reviewTab.value])

const hasActiveContent = computed(() => {
  if (reviewTab.value === 'live') {
    return liveTimelineGroups.value.length > 0
  }

  if (reviewTab.value === 'journals') {
    return journalShelfItems.value.length > 0
  }

  return snapshotShelfItems.value.length > 0
})
</script>

<template>
  <section class="review-preview-page">
    <div class="preview-page-head">
      <RouterLink class="preview-page-link" :to="{ name: 'preview-lab' }">返回 Preview Lab</RouterLink>
      <RouterLink class="preview-page-link subtle" :to="{ name: 'review' }">查看正式回顾页</RouterLink>
    </div>

    <article class="review-preview-shell page-card">
      <header class="review-preview-hero">
        <div class="review-preview-copy">
          <p class="eyebrow">Review Preview</p>
          <h1>{{ previewHeroTitle }}</h1>
          <p class="review-preview-lead">{{ previewHeroLead }}</p>
          <p class="review-preview-aside">{{ previewHeroAside }}</p>
        </div>

        <aside class="review-preview-issue-card">
          <p class="review-preview-issue-kicker">{{ currentMonthLabel }} issue</p>
          <p class="review-preview-issue-note">{{ monthlyNote }}</p>

          <div class="review-preview-lead-moment">
            <span>{{ leadMoment.eyebrow }}</span>
            <strong>{{ leadMoment.title }}</strong>
            <small>{{ leadMoment.meta }}</small>
          </div>
        </aside>
      </header>

      <section class="review-preview-ribbon" aria-label="卷首摘要条">
        <article
          v-for="item in issueRibbonItems"
          :key="item.key"
          :class="['review-ribbon-card', item.accent]"
        >
          <p>{{ item.eyebrow }}</p>
          <strong>{{ item.value }}</strong>
          <span>{{ item.label }}</span>
          <small>{{ item.note }}</small>
        </article>
      </section>

      <section class="review-preview-shelf">
        <div class="review-preview-shelf-head">
          <div>
            <p class="eyebrow">Reading Shelf</p>
            <h2>先翻这一册的哪一章</h2>
          </div>
          <p class="review-preview-shelf-note">{{ activePreviewTab.shortNote }}</p>
        </div>

        <div class="review-preview-tab-row" role="tablist" aria-label="回顾预览切换">
          <button
            v-for="tab in previewTabs"
            :key="tab.value"
            type="button"
            class="review-preview-tab"
            :class="{ active: reviewTab === tab.value }"
            @click="reviewTab = tab.value"
          >
            <span class="review-preview-tab-kicker">{{ tab.eyebrow }}</span>
            <strong>{{ tab.label }}</strong>
            <small>{{ tab.count }}</small>
            <p>{{ tab.shortNote }}</p>
          </button>
        </div>

        <div v-if="memberDigest.length" class="review-preview-member-strip">
          <article v-for="member in memberDigest" :key="member.memberId" :class="['review-preview-member-card', member.toneClass]">
            <div>
              <p>{{ member.memberName }}</p>
              <span>{{ member.countLabel }}</span>
            </div>
            <small>{{ member.summaryText }}</small>
          </article>
        </div>
      </section>

      <section class="review-preview-stage">
        <template v-if="reviewTab === 'live' && hasActiveContent">
          <div v-for="group in liveTimelineGroups" :key="group.label" class="review-preview-day-group">
            <div class="review-preview-day-head">
              <span>{{ group.label }}</span>
              <small>{{ group.entries.length }} 条记录</small>
            </div>

            <div class="review-preview-timeline-list">
              <article v-for="entry in group.entries" :key="entry.id" class="review-preview-timeline-card">
                <div class="review-preview-meta-row">
                  <span class="review-preview-chip">{{ entry.eventLabel }}</span>
                  <span :class="['review-preview-member-pill', entry.actorToneClass]">{{ entry.actorName }}</span>
                </div>
                <h3>{{ entry.messageText }}</h3>
                <p>{{ entry.wishTitle }}</p>
                <div class="review-preview-card-foot">
                  <small>{{ entry.timeLabel }}</small>
                  <RouterLink v-if="entry.wishId" class="review-preview-inline-link" :to="{ name: 'wish-detail', params: { id: entry.wishId } }">
                    去这条愿望
                  </RouterLink>
                </div>
              </article>
            </div>
          </div>
        </template>

        <template v-else-if="reviewTab === 'journals' && hasActiveContent">
          <div class="review-preview-library-grid">
            <article v-for="journal in journalShelfItems" :key="journal.id" class="review-preview-library-card">
              <div class="review-preview-meta-row">
                <span class="review-preview-chip">{{ journal.scopeLabel }}</span>
                <span :class="['review-preview-member-pill', journal.ownerToneClass]">{{ journal.ownerName }}</span>
              </div>
              <h3>{{ journal.title }}</h3>
              <p class="review-preview-library-note">实现于 {{ journal.timeLabel }}</p>

              <div class="review-preview-note-stack">
                <article v-for="entry in journal.previewEntries" :key="entry.id" class="review-preview-note-card">
                  <div class="review-preview-meta-row compact">
                    <span class="review-preview-note-kicker">{{ entry.eventLabel }}</span>
                    <span :class="['review-preview-member-pill', entry.actorToneClass]">{{ entry.actorName }}</span>
                  </div>
                  <p>{{ entry.messageText }}</p>
                </article>
              </div>

              <RouterLink class="review-preview-inline-link align-start" :to="{ name: 'wish-detail', params: { id: journal.id } }">
                打开完整手账
              </RouterLink>
            </article>
          </div>
        </template>

        <template v-else-if="reviewTab === 'snapshots' && hasActiveContent">
          <div class="review-preview-archive-grid">
            <article v-for="snapshot in snapshotShelfItems" :key="snapshot.id" class="review-preview-archive-card">
              <div class="review-preview-archive-head">
                <div>
                  <p class="review-preview-archive-month">{{ snapshot.monthLabel }}</p>
                  <h3>{{ snapshot.coverTitle }}</h3>
                </div>
                <small>{{ snapshot.timeLabel }} 冻结</small>
              </div>

              <p class="review-preview-archive-note">{{ snapshot.coverSubtitle }}</p>

              <div class="review-preview-archive-metrics">
                <span>{{ snapshot.metrics.threads }} 条记录</span>
                <span>{{ snapshot.metrics.comments }} 条留言</span>
              </div>

              <div class="review-preview-note-stack">
                <article v-for="block in snapshot.previewBlocks" :key="block.id" class="review-preview-note-card">
                  <div class="review-preview-meta-row compact">
                    <span class="review-preview-note-kicker">{{ block.label }}</span>
                    <span :class="['review-preview-member-pill', block.actorToneClass]">{{ block.actorName }}</span>
                  </div>
                  <p>{{ block.messageText }}</p>
                </article>
              </div>
            </article>
          </div>
        </template>

        <div v-else class="review-preview-empty-card">
          <p class="review-preview-empty-kicker">这一章还没有正文</p>
          <h3>{{ activeEmptyState.title }}</h3>
          <p>先把这一册继续往前写一点，再回来翻，就会看到它开始长出内容。</p>
          <RouterLink class="review-preview-empty-link" :to="activeEmptyState.actionRoute">
            {{ activeEmptyState.actionLabel }}
          </RouterLink>
        </div>
      </section>
    </article>
  </section>
</template>

<style scoped>
.review-preview-page {
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
  background: rgba(246, 246, 242, 0.82);
  color: var(--text-soft);
}

.preview-page-link:hover {
  transform: translateY(-1px);
  border-color: rgba(201, 111, 74, 0.22);
}

.review-preview-shell,
.review-preview-copy,
.review-preview-issue-card,
.review-preview-shelf,
.review-preview-stage,
.review-preview-day-group,
.review-preview-note-stack {
  display: grid;
  gap: 1rem;
}

.review-preview-shell {
  padding: clamp(1.1rem, 2vw, 1.5rem);
  background:
    radial-gradient(circle at top left, rgba(255, 241, 225, 0.82), transparent 24%),
    radial-gradient(circle at right 18%, rgba(205, 216, 210, 0.5), transparent 28%),
    linear-gradient(160deg, rgba(250, 247, 241, 0.98), rgba(243, 239, 233, 0.96));
}

.review-preview-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(18rem, 0.9fr);
  gap: 1rem;
  align-items: start;
}

.review-preview-copy h1,
.review-preview-shelf-head h2,
.review-preview-stage h3,
.review-preview-archive-head h3,
.review-preview-empty-card h3 {
  margin: 0;
  font-family: var(--font-display);
  letter-spacing: -0.04em;
}

.review-preview-copy h1 {
  max-width: 11ch;
  font-size: clamp(2.1rem, 5vw, 4.2rem);
  line-height: 0.98;
}

.review-preview-lead,
.review-preview-aside,
.review-preview-issue-note,
.review-preview-shelf-note,
.review-preview-timeline-card p,
.review-preview-note-card p,
.review-preview-archive-note,
.review-preview-empty-card p,
.review-preview-library-note {
  margin: 0;
  font-size: 0.96rem;
  line-height: 1.8;
}

.review-preview-lead {
  max-width: 40rem;
  color: var(--text-main);
  font-size: 1.04rem;
}

.review-preview-aside,
.review-preview-shelf-note,
.review-preview-library-note,
.review-preview-archive-note {
  color: var(--text-soft);
}

.review-preview-issue-card {
  padding: 1rem;
  border: 1px solid rgba(92, 77, 62, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.62);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.review-preview-issue-kicker,
.review-ribbon-card p,
.review-preview-tab-kicker,
.review-preview-day-head span,
.review-preview-archive-month,
.review-preview-empty-kicker,
.review-preview-note-kicker,
.review-preview-member-card p {
  margin: 0;
  color: rgba(76, 59, 50, 0.64);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.review-preview-lead-moment {
  display: grid;
  gap: 0.35rem;
  padding-top: 0.9rem;
  border-top: 1px solid rgba(92, 77, 62, 0.08);
}

.review-preview-lead-moment span,
.review-preview-member-card span,
.review-preview-card-foot small,
.review-preview-day-head small,
.review-preview-archive-head small {
  color: var(--text-soft);
  font-size: 0.82rem;
  line-height: 1.6;
}

.review-preview-lead-moment strong,
.review-ribbon-card strong,
.review-preview-tab strong,
.review-preview-timeline-card h3,
.review-preview-library-card h3,
.review-preview-archive-head h3,
.review-preview-empty-card h3 {
  font-family: var(--font-heading);
  font-weight: 600;
}

.review-preview-lead-moment strong {
  font-size: 1.05rem;
  line-height: 1.45;
}

.review-preview-ribbon {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;
}

.review-ribbon-card {
  display: grid;
  gap: 0.28rem;
  min-height: 10rem;
  padding: 0.9rem 0.95rem;
  border-radius: 22px;
  border: 1px solid rgba(92, 77, 62, 0.08);
  background: rgba(255, 255, 255, 0.58);
}

.review-ribbon-card strong {
  font-size: clamp(1.5rem, 3vw, 2.1rem);
  line-height: 1;
}

.review-ribbon-card span,
.review-ribbon-card small {
  line-height: 1.65;
}

.review-ribbon-card small {
  color: var(--text-soft);
}

.review-preview-shelf {
  padding: 1rem;
  border-radius: 30px;
  background: rgba(255, 252, 248, 0.66);
  border: 1px solid rgba(92, 77, 62, 0.08);
}

.review-preview-shelf-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: end;
}

.review-preview-shelf-head h2 {
  font-size: clamp(1.5rem, 3vw, 2.3rem);
  line-height: 1.02;
}

.review-preview-tab-row,
.review-preview-member-strip,
.review-preview-timeline-list,
.review-preview-library-grid,
.review-preview-archive-grid,
.review-preview-archive-metrics {
  display: grid;
  gap: 0.8rem;
}

.review-preview-tab-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.review-preview-tab {
  display: grid;
  gap: 0.28rem;
  align-content: start;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(92, 77, 62, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  text-align: left;
  color: var(--text-main);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.review-preview-tab.active {
  transform: translateY(-2px);
  border-color: rgba(201, 111, 74, 0.22);
  box-shadow: 0 18px 32px rgba(88, 66, 45, 0.08);
}

.review-preview-tab small,
.review-preview-tab p,
.review-preview-member-card small,
.review-preview-archive-metrics span {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.65;
}

.review-preview-member-strip {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.review-preview-member-card,
.review-preview-timeline-card,
.review-preview-library-card,
.review-preview-archive-card,
.review-preview-note-card,
.review-preview-empty-card {
  display: grid;
  gap: 0.75rem;
  border-radius: 26px;
  border: 1px solid rgba(92, 77, 62, 0.08);
  background: rgba(255, 255, 255, 0.78);
}

.review-preview-member-card {
  padding: 0.85rem 0.95rem;
}

.review-preview-member-card.is-rose {
  background: linear-gradient(180deg, rgba(255, 249, 244, 0.94), rgba(255, 255, 255, 0.82));
}

.review-preview-member-card.is-sage {
  background: linear-gradient(180deg, rgba(246, 251, 247, 0.94), rgba(255, 255, 255, 0.82));
}

.review-preview-stage {
  gap: 1rem;
}

.review-preview-day-head,
.review-preview-meta-row,
.review-preview-card-foot,
.review-preview-archive-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem 0.8rem;
  align-items: center;
}

.review-preview-timeline-list,
.review-preview-library-grid,
.review-preview-archive-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.review-preview-timeline-card,
.review-preview-library-card,
.review-preview-archive-card,
.review-preview-empty-card {
  padding: 1rem;
}

.review-preview-timeline-card h3,
.review-preview-library-card h3,
.review-preview-archive-head h3,
.review-preview-empty-card h3 {
  font-size: 1.2rem;
  line-height: 1.35;
}

.review-preview-chip,
.review-preview-member-pill,
.review-preview-empty-link,
.review-preview-inline-link {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 2rem;
  padding: 0.35rem 0.72rem;
  border-radius: 999px;
  text-decoration: none;
}

.review-preview-chip,
.review-preview-member-pill {
  border: 1px solid rgba(126, 96, 76, 0.12);
  background: rgba(248, 243, 236, 0.88);
  font-size: 0.8rem;
}

.review-preview-member-pill.is-rose {
  background: rgba(255, 241, 233, 0.94);
}

.review-preview-member-pill.is-sage {
  background: rgba(238, 248, 241, 0.94);
}

.review-preview-note-card {
  padding: 0.82rem 0.88rem;
}

.review-preview-meta-row.compact {
  align-items: start;
}

.review-preview-inline-link,
.review-preview-empty-link {
  color: rgba(96, 63, 39, 0.95);
  background: rgba(246, 233, 218, 0.9);
}

.review-preview-inline-link.align-start {
  justify-self: start;
}

.review-preview-archive-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.review-preview-archive-metrics span {
  display: inline-flex;
  justify-content: space-between;
  gap: 0.6rem;
  min-height: 2.6rem;
  padding: 0.65rem 0.8rem;
  border-radius: 18px;
  background: rgba(246, 246, 241, 0.85);
}

@media (max-width: 980px) {
  .review-preview-hero,
  .review-preview-ribbon,
  .review-preview-tab-row,
  .review-preview-member-strip,
  .review-preview-timeline-list,
  .review-preview-library-grid,
  .review-preview-archive-grid,
  .review-preview-archive-metrics {
    grid-template-columns: 1fr;
  }

  .review-preview-shelf-head {
    display: grid;
    justify-content: stretch;
    align-items: start;
  }
}

@media (max-width: 640px) {
  .preview-page-head,
  .review-preview-card-foot,
  .review-preview-archive-head,
  .review-preview-meta-row {
    align-items: start;
  }

  .review-preview-copy h1 {
    max-width: none;
  }
}
</style>