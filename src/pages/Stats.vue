<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useReviewPageState } from '../composables/useReviewPageState'

const {
  activeReviewTabOption,
  completedWishJournals,
  currentMonthLabel,
  featuredReviewThreads,
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
  getThreadReactionMemberNames,
  getThreadReactionSummaryLabel,
  getThreadReviewHeadline,
  getWishJournalPreview,
  getWishScopeLabel,
  getWishTitle,
  isReviewReactionExpanded,
  liveMonthlyThreads,
  monthlyNote,
  monthlySnapshots,
  reviewHeroLead,
  reviewHeroTitle,
  reviewMemberSummaries,
  reviewHighlights,
  reviewSyncState,
  reviewTab,
  reviewTabOptions,
  toggleReviewReactionMembers,
  getSnapshotPreviewBlocks,
} = useReviewPageState()
</script>

<template>
  <section class="page-stack review-page">
    <article class="page-card review-story-card">
      <div class="section-heading review-story-head">
        <div class="review-story-copy">
          <p class="eyebrow">这一期封面</p>
          <h2 class="section-title">{{ reviewHeroTitle }}</h2>
          <p class="section-copy review-copy">
            {{ reviewHeroLead }}
          </p>
          <p class="review-story-subnote">{{ monthlyNote }}</p>

          <div v-if="reviewMemberSummaries.length" class="review-cover-members" aria-label="这一期的成员近况">
            <article v-for="member in reviewMemberSummaries" :key="member.memberId" :class="['review-cover-member', member.toneClass]">
              <span>{{ member.memberName }}</span>
              <small>{{ member.countLabel }}</small>
            </article>
          </div>
        </div>

        <div class="review-story-tools">
          <span class="badge review-story-pill">{{ currentMonthLabel }} 正在写这一期</span>
          <div v-if="reviewSyncState" :class="['review-cover-status', `is-${reviewSyncState.tone}`]">
            <strong>{{ reviewSyncState.title }}</strong>
            <p>{{ reviewSyncState.message }}</p>
          </div>
          <div class="button-row review-story-actions">
            <button class="button-link" type="button" @click="reviewTab = 'live'">翻这一期</button>
            <RouterLink class="button-subtle" :to="{ name: 'list' }">回清单添一笔</RouterLink>
          </div>
        </div>
      </div>

      <div v-if="featuredReviewThreads.length" class="review-cover-threads">
        <div class="review-cover-thread-head">
          <div>
            <p class="eyebrow">这一期最先翻到</p>
            <h3>最近留下的共同记录</h3>
          </div>
          <span class="badge">{{ featuredReviewThreads.length }} 条</span>
        </div>

        <article
          v-for="thread in featuredReviewThreads"
          :key="thread.id"
          class="review-cover-thread"
        >
          <div class="review-cover-thread-meta">
            <span class="review-card-chip">{{ getThreadEventLabel(thread.eventKind) }}</span>
            <span :class="['review-member-pill', getMemberToneClass(thread.actorId)]">{{ getThreadActorName(thread) }}</span>
            <time>{{ formatDateTimeLabel(thread.createdAt) }}</time>
          </div>
          <h3>{{ getThreadReviewHeadline(thread) }}</h3>
          <p>{{ getWishTitle(thread) }}</p>
        </article>
      </div>

      <div class="review-highlight-strip">
        <article v-for="highlight in reviewHighlights" :key="highlight.key" class="review-highlight-pill">
          <span>{{ highlight.eyebrow }}</span>
          <strong>{{ highlight.value }}</strong>
          <p>{{ highlight.label }}，{{ highlight.note }}</p>
        </article>
      </div>
    </article>

    <article class="page-card review-tabs-card">
      <div class="review-tab-head">
        <div class="section-heading review-tab-intro">
          <div class="review-tab-copy">
            <p class="eyebrow">继续翻阅</p>
            <h3>接着翻哪一章</h3>
            <p class="section-copy review-tab-note">先看正在发生的这一期，再回头看完成和封存。</p>
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
              <small>{{ tab.count }}</small>
            </div>
            <p>{{ tab.note }}</p>
          </button>
        </div>
      </div>

      <div v-if="reviewTab === 'journals'" class="review-panel-stack">
        <div class="section-heading review-panel-head">
          <div class="review-panel-copy">
            <p class="eyebrow">完成册页</p>
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
              <RouterLink class="button-subtle" :to="{ name: 'wish-detail', params: { id: wish.id } }">翻完整过程</RouterLink>
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
            <RouterLink class="button-link" :to="{ name: 'list' }">回清单推进一条</RouterLink>
            <RouterLink class="button-subtle" :to="{ name: 'compose' }">再写下一条愿望</RouterLink>
          </div>
        </div>
      </div>

      <div v-else-if="reviewTab === 'live'" class="review-panel-stack">
        <div class="section-heading review-panel-head">
          <div class="review-panel-copy">
            <p class="eyebrow">这一期</p>
            <h2 class="section-title">{{ currentMonthLabel }} 还在继续写</h2>
            <p class="section-copy review-panel-note">这里先保留这个月还在发生的记录。</p>
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
                <h3>{{ getThreadReviewHeadline(thread) }}</h3>
              </div>
            </div>
            <div v-if="thread.reactions.length" class="review-reaction-group" aria-label="这条记录收到的表情">
              <div class="review-reaction-row">
                <button
                  v-for="reaction in thread.reactions"
                  :key="`${thread.id}-${reaction.emoji}`"
                  class="review-reaction-pill"
                  type="button"
                  :aria-expanded="isReviewReactionExpanded(thread.id, reaction.emoji)"
                  :aria-label="getThreadReactionSummaryLabel(reaction)"
                  @click="toggleReviewReactionMembers(thread.id, reaction.emoji)"
                >
                  <span>{{ reaction.emoji }}</span>
                  <small v-if="reaction.count > 1">{{ reaction.count }}</small>
                </button>
              </div>
              <div
                v-for="reaction in thread.reactions"
                v-show="isReviewReactionExpanded(thread.id, reaction.emoji)"
                :key="`${thread.id}-${reaction.emoji}-members`"
                class="review-reaction-members"
              >
                <span v-for="memberName in getThreadReactionMemberNames(reaction)" :key="memberName">{{ memberName }}</span>
              </div>
            </div>
            <div v-if="thread.wishId" class="button-row review-card-actions">
              <RouterLink class="button-link review-inline-link" :to="{ name: 'wish-detail', params: { id: thread.wishId } }">回到这条愿望</RouterLink>
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
            <RouterLink class="button-link" :to="{ name: 'list' }">回清单推进一条</RouterLink>
            <RouterLink class="button-subtle" :to="{ name: 'compose' }">先写下一条愿望</RouterLink>
          </div>
        </div>
      </div>

      <div v-else class="review-panel-stack">
        <div class="section-heading review-panel-head">
          <div class="review-panel-copy">
            <p class="eyebrow">已封存月刊</p>
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
            <button class="button-link" type="button" @click="reviewTab = 'live'">先看这一期</button>
            <RouterLink class="button-subtle" :to="{ name: 'list' }">回清单继续推进</RouterLink>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
.page-stack,
.review-story-card,
.review-tabs-card,
.review-panel-stack,
.review-list,
.journal-grid,
.snapshot-grid,
.journal-preview-list,
.snapshot-preview-list,
.review-cover-threads,
.review-cover-thread,
.review-story-copy,
.review-story-tools,
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
    linear-gradient(135deg, var(--warm-panel-strong), var(--surface-soft)),
    radial-gradient(circle at top right, var(--sage-glow), transparent 36%);
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
.review-cover-status p,
.review-cover-thread p,
.review-highlight-pill p,
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
.review-cover-status p,
.review-cover-thread p,
.review-highlight-pill p,
.snapshot-card p,
.empty-card p,
.journal-preview-item p,
.snapshot-preview-item p {
  color: var(--text-soft);
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
  color: var(--text-soft);
}

.review-story-head {
  align-items: start;
}

.review-story-tools {
  justify-items: start;
  align-content: start;
  gap: 0.8rem;
}

.review-cover-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.95rem;
}

.review-cover-member {
  display: inline-grid;
  gap: 0.1rem;
  min-height: 3rem;
  padding: 0.48rem 0.78rem;
  border-radius: 999px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
}

.review-cover-member.is-rose {
  border-color: var(--danger-border);
  background: var(--danger-panel);
}

.review-cover-member.is-sage {
  border-color: var(--success-border);
  background: var(--success-panel);
}

.review-cover-member span,
.review-cover-status strong,
.review-highlight-pill strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-l5-size);
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.review-cover-member small {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.review-cover-status {
  display: grid;
  gap: 0.28rem;
  max-width: 20rem;
  padding: 0.78rem 0.88rem;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: var(--warm-panel);
}

.review-cover-status.is-error {
  border-color: var(--danger-border);
  background: var(--danger-panel);
}

.review-cover-threads {
  gap: 0.75rem;
  padding-top: 1.05rem;
  border-top: 1px solid var(--line-soft);
}

.review-cover-thread-head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: start;
}

.review-cover-thread-head .eyebrow {
  margin-bottom: 0.38rem;
}

.review-cover-thread {
  gap: 0.48rem;
  padding-top: 0.78rem;
  border-top: 1px solid var(--line-soft);
}

.review-cover-thread-head + .review-cover-thread {
  padding-top: 0;
  border-top: 0;
}

.review-cover-thread-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
  align-items: center;
}

.review-cover-thread-meta time {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.review-highlight-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.56rem;
  padding-top: 0.95rem;
  border-top: 1px solid var(--line-soft);
}

.review-highlight-pill {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
  padding: 0.7rem 0.78rem;
  border-radius: 18px;
  border: 1px solid var(--line-soft);
  background: var(--warm-panel);
}

.review-highlight-pill span {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.review-highlight-pill p {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.review-story-pill {
  min-height: 34px;
  padding-inline: 0.92rem;
}

.review-card-kicker,
.review-empty-kicker,
.review-preview-label {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-weight: 600;
  font-size: var(--type-eyebrow-size);
  letter-spacing: var(--type-eyebrow-spacing);
  line-height: 1.4;
}

.review-card-chip {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.review-card-chip {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: 30px;
  width: max-content;
  padding: 0.35rem 0.68rem;
  border-radius: 999px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
}

.review-cover-thread-head h3,
.review-cover-thread h3,
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

.review-tab-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
}

.review-tab-head {
  gap: 1rem;
}

.review-card-kicker-row,
.review-preview-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.45rem 0.7rem;
  align-items: flex-start;
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
  color: var(--text-muted);
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
  background: var(--warm-panel);
  text-align: left;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.review-tab-kicker {
  margin: 0;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.review-tab-button small {
  display: inline-flex;
  align-items: center;
  width: max-content;
  min-height: 1.85rem;
  padding: 0.24rem 0.62rem;
  border-radius: 999px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
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
  background: var(--accent-panel);
  border-color: var(--accent-border);
  box-shadow: 0 12px 24px var(--accent-shadow-soft);
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
  color: var(--text-soft);
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
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.review-card-meter-label,
.snapshot-metric-card span {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.journal-grid,
.snapshot-grid {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
  background: var(--warm-panel);
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
    linear-gradient(180deg, var(--surface-card), var(--warm-panel-strong)),
    radial-gradient(circle at top right, var(--danger-panel), transparent 28%);
}

.snapshot-card {
  background:
    linear-gradient(135deg, var(--warm-panel-strong), var(--surface-soft)),
    linear-gradient(160deg, var(--success-panel), transparent 56%);
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
  white-space: nowrap;
}

.review-reaction-group {
  display: grid;
  gap: 0.42rem;
}

.review-reaction-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.42rem;
}

.review-reaction-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.26rem;
  min-height: 1.9rem;
  padding: 0.28rem 0.58rem;
  border-radius: 999px;
  border: 1px solid var(--warm-border);
  background: var(--warm-panel-strong);
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
}

.review-reaction-pill small {
  color: var(--text-soft);
  font-size: var(--type-l7-size);
  line-height: 1;
}

.review-reaction-pill[aria-expanded='true'] {
  border-color: var(--accent-border);
  background: var(--accent-panel);
}

.review-reaction-members {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.review-reaction-members span {
  display: inline-flex;
  align-items: center;
  min-height: 1.7rem;
  padding: 0.22rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-soft);
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
  border: 1px solid var(--warm-border);
  background: var(--warm-panel);
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  line-height: var(--type-meta-line);
  letter-spacing: var(--type-meta-spacing);
}

.review-member-pill.is-rose {
  background: var(--danger-panel);
  border-color: var(--danger-border);
  color: var(--danger);
}

.review-member-pill.is-sage {
  background: var(--success-panel);
  border-color: var(--success-border);
  color: var(--success);
}

.review-member-pill.is-shared {
  background: var(--surface-soft);
  border-color: var(--warm-border);
  color: var(--text-muted);
}

.review-preview-kicker {
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-meta-size);
  font-weight: 600;
  letter-spacing: var(--type-meta-spacing);
  line-height: var(--type-meta-line);
}

.journal-preview-item,
.snapshot-preview-item {
  gap: 0.5rem;
  border-color: var(--line-soft);
  background: var(--warm-panel-strong);
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
  border: 1px solid var(--line-soft);
  background: var(--warm-panel-strong);
}

.review-empty-step strong {
  color: var(--text-main);
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
  background: var(--warm-panel-strong);
}

@media (max-width: 720px) {
  .section-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-tab-row {
    grid-template-columns: 1fr;
  }

  .journal-card-band,
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

  .review-highlight-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.56rem;
  }

  .review-cover-thread-head {
    grid-template-columns: 1fr;
  }

  .review-highlight-pill {
    padding: 0.66rem 0.68rem;
  }
}
</style>
