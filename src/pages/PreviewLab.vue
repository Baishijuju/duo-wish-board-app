<script setup lang="ts">
import { RouterLink } from 'vue-router'

const previewEntries = [
  {
    name: 'preview-home',
    kicker: 'Home Preview',
    title: '首页轻量重开',
    summary: '把首页压成一个焦点区、一条短清单和一段最近回应，先解决卡片过多和主次不清。',
    tone: 'sun',
  },
  {
    name: 'preview-compose',
    kicker: 'Compose Preview',
    title: '写下页轻量重开',
    summary: '把表单收成一块有节奏的编辑台，只看视觉和结构，不会真实提交。',
    tone: 'sage',
  },
  {
    name: 'preview-review',
    kicker: 'Review Preview',
    title: '回顾页重排试阅',
    summary: '把统计页感整理成一册能翻的时间刊物，先看本期，再翻已完成和已封存。',
    tone: 'ink',
  },
  {
    name: 'preview-space',
    kicker: 'Space Preview',
    title: '空间页压缩试阅',
    summary: '把共同空间收成抬头条，再把奖池编辑和领取区压成窄屏也能顺着读的两张主卡。',
    tone: 'linen',
  },
]

const auditPoints = [
  '一个屏幕先只给一件最重要的事留位置。',
  '减少重复说明和同底色小卡片，改成条带和线性阅读。',
  '保留现在的正式页面，先在预览里比较新方向。',
  '这轮把首页、写下页、回顾页和空间页都放进同一个实验区里对照。',
]
</script>

<template>
  <section class="preview-lab-page">
    <article class="preview-lab-hero page-card">
      <div class="preview-lab-copy">
        <p class="eyebrow">Preview Lab</p>
        <h1>先单独看新版首页、写下页、回顾页和空间页，不碰现在的正式页。</h1>
        <p class="preview-lab-lead">
          这次预览只处理视觉和结构，把几张最重的页面先拆开看，方便直接在手机上判断信息密度、纵向长度和主次层级。
        </p>
      </div>

      <ul class="preview-lab-audit" aria-label="本轮重开重点">
        <li v-for="point in auditPoints" :key="point">{{ point }}</li>
      </ul>
    </article>

    <section class="preview-lab-grid" aria-label="预览入口">
      <RouterLink
        v-for="entry in previewEntries"
        :key="entry.name"
        :to="{ name: entry.name }"
        class="preview-lab-link"
        :class="entry.tone"
      >
        <p class="preview-lab-kicker">{{ entry.kicker }}</p>
        <h2>{{ entry.title }}</h2>
        <p>{{ entry.summary }}</p>
        <span class="preview-lab-cta">打开预览</span>
      </RouterLink>
    </section>
  </section>
</template>

<style scoped>
.preview-lab-page {
  display: grid;
  gap: 1rem;
}

.preview-lab-hero {
  display: grid;
  gap: 1.2rem;
  padding: clamp(1.15rem, 2vw, 1.6rem);
  background:
    radial-gradient(circle at top left, rgba(255, 233, 214, 0.92), transparent 34%),
    linear-gradient(145deg, rgba(255, 251, 245, 0.95), rgba(249, 241, 231, 0.92));
}

.preview-lab-copy {
  display: grid;
  gap: 0.72rem;
}

.preview-lab-copy h1 {
  margin: 0;
  max-width: 14ch;
  font-family: var(--font-heading);
  font-size: clamp(2rem, 4vw, 3.35rem);
  line-height: 1.04;
  letter-spacing: -0.04em;
}

.preview-lab-lead {
  margin: 0;
  max-width: 46rem;
  color: var(--text-soft);
  font-size: 0.98rem;
  line-height: 1.85;
}

.preview-lab-audit {
  display: grid;
  gap: 0.8rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.preview-lab-audit li {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(95, 74, 55, 0.08);
  color: var(--text-main);
  font-size: 0.92rem;
}

.preview-lab-audit li::before {
  content: '';
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: var(--accent-dark);
  box-shadow: 0 0 0 6px rgba(201, 111, 74, 0.12);
}

.preview-lab-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.preview-lab-link {
  position: relative;
  display: grid;
  gap: 0.85rem;
  padding: 1.2rem;
  border: 1px solid rgba(95, 74, 55, 0.08);
  border-radius: 26px;
  color: var(--text-main);
  text-decoration: none;
  overflow: hidden;
  box-shadow: 0 18px 38px rgba(80, 58, 40, 0.05);
  transition: transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
}

.preview-lab-link::before {
  content: '';
  position: absolute;
  inset: auto auto -2rem -2rem;
  width: 8rem;
  height: 8rem;
  border-radius: 999px;
  opacity: 0.5;
  filter: blur(4px);
}

.preview-lab-link.sun {
  background: linear-gradient(155deg, rgba(255, 245, 237, 0.98), rgba(250, 236, 221, 0.92));
}

.preview-lab-link.sun::before {
  background: rgba(229, 170, 126, 0.32);
}

.preview-lab-link.sage {
  background: linear-gradient(155deg, rgba(247, 251, 248, 0.98), rgba(235, 244, 238, 0.92));
}

.preview-lab-link.sage::before {
  background: rgba(159, 190, 174, 0.34);
}

.preview-lab-link.ink {
  background: linear-gradient(160deg, rgba(246, 246, 241, 0.98), rgba(234, 236, 232, 0.94));
}

.preview-lab-link.ink::before {
  background: rgba(123, 138, 144, 0.28);
}

.preview-lab-link.linen {
  background: linear-gradient(160deg, rgba(250, 247, 241, 0.98), rgba(239, 234, 225, 0.94));
}

.preview-lab-link.linen::before {
  background: rgba(184, 161, 129, 0.24);
}

.preview-lab-link:hover {
  transform: translateY(-3px);
  border-color: rgba(201, 111, 74, 0.18);
  box-shadow: 0 22px 42px rgba(80, 58, 40, 0.08);
}

.preview-lab-kicker {
  position: relative;
  z-index: 1;
  margin: 0;
  color: var(--text-soft);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.preview-lab-link h2 {
  position: relative;
  z-index: 1;
  margin: 0;
  max-width: 10ch;
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 3.2vw, 2.2rem);
  line-height: 1.08;
  letter-spacing: -0.04em;
}

.preview-lab-link p {
  position: relative;
  z-index: 1;
  margin: 0;
  color: var(--text-soft);
  line-height: 1.8;
}

.preview-lab-cta {
  position: relative;
  z-index: 1;
  display: inline-flex;
  width: fit-content;
  padding: 0.55rem 0.88rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.68);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.03em;
}

@media (max-width: 960px) {
  .preview-lab-grid {
    grid-template-columns: 1fr;
  }

  .preview-lab-link h2 {
    max-width: none;
  }
}
</style>