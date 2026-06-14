<script setup lang="ts">
import { computed } from 'vue'
import { useColorTokenDashboard } from '../composables/useColorTokenDashboard'

const {
  groups,
  filteredAreaGroups,
  areaSearch,
  importText,
  feedbackMessage,
  exportText,
  overriddenCount,
  tokenCount,
  contrastChecks,
  currentValue,
  defaultValue,
  hasOverride,
  colorInputValue,
  controlTokenDefinitions,
  applyToken,
  resetToken,
  resetAllTokens,
  importTokens,
  setFeedback,
} = useColorTokenDashboard()

const overrideSummary = computed(() => `${overriddenCount.value} / ${tokenCount.value}`)

function readInputValue(event: Event) {
  const target = event.target

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value
  }

  return ''
}

function updateTokenFromText(name: string, event: Event) {
  applyToken(name, readInputValue(event))
}

function updateTokenFromPicker(name: string, event: Event) {
  applyToken(name, readInputValue(event))
}

async function copyExport() {
  try {
    await navigator.clipboard.writeText(exportText.value)
    setFeedback('已复制当前调色 JSON。')
  } catch {
    importText.value = exportText.value
    setFeedback('浏览器没有开放剪贴板，已把 JSON 放到导入框。')
  }
}
</script>

<template>
  <section class="color-dashboard" aria-labelledby="color-dashboard-title">
    <header class="dashboard-hero page-card">
      <div class="dashboard-hero-copy">
        <p class="eyebrow">Hidden color lab</p>
        <h2 id="color-dashboard-title" class="page-title">调色工作台</h2>
        <p class="section-copy">
          这里的改动会即时写入 CSS variables，并保存在当前浏览器的 localStorage。它不会发布成正式主题，也不会出现在主导航里。
        </p>
      </div>

      <div class="dashboard-meter" aria-label="已覆盖 token 数量">
        <span>已调色</span>
        <strong>{{ overrideSummary }}</strong>
        <small>刷新后仍保留，本机有效</small>
      </div>
    </header>

    <div class="dashboard-layout">
      <aside class="dashboard-tools page-card" aria-label="导入导出工具">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Draft</p>
            <h3 class="section-title">本机草稿</h3>
          </div>
        </div>

        <div class="button-row">
          <button class="button-solid" type="button" @click="copyExport">复制 JSON</button>
          <button class="button-subtle" type="button" @click="resetAllTokens">全部恢复</button>
        </div>

        <label class="json-box">
          <span>导入 JSON</span>
          <textarea
            v-model="importText"
            rows="8"
            spellcheck="false"
            placeholder='{ "--accent": "#c96f4a", "--surface-card": "#fffaf3" }'
          />
        </label>

        <button class="button-link" type="button" @click="importTokens">应用导入内容</button>

        <p v-if="feedbackMessage" class="tool-feedback" role="status">{{ feedbackMessage }}</p>

        <label class="area-search">
          <span>按看到的区域查找</span>
          <input v-model="areaSearch" type="search" placeholder="卡片 / 清单 / 奖励 / 输入框 / 愿望瓶">
        </label>

        <div class="contrast-panel">
          <p class="eyebrow">Readability</p>
          <div v-for="check in contrastChecks" :key="check.label" class="contrast-row">
            <span>{{ check.label }}</span>
            <strong :class="{ pass: check.passes }">{{ check.ratio.toFixed(2) }}</strong>
          </div>
        </div>
      </aside>

      <main class="token-workbench" aria-label="颜色区域控制区">
        <section class="area-intro page-card">
          <div>
            <p class="eyebrow">Find by sight</p>
            <h3 class="section-title">先按你看到的区域调</h3>
          </div>
          <p class="section-note">每个选项都写了影响范围，下面的小 token 名只是给后续写回 CSS 用。</p>
        </section>

        <p v-if="filteredAreaGroups.length === 0" class="empty-search page-card">没有找到这个区域，试试“卡片”“清单”“奖励”“输入框”。</p>

        <section v-for="area in filteredAreaGroups" :key="area.id" class="area-group">
          <div class="area-group-head">
            <div>
              <p class="eyebrow">{{ area.pageLabel }}</p>
              <h3 class="section-title">{{ area.title }}</h3>
            </div>
            <p class="section-note">{{ area.description }}</p>
          </div>

          <div class="affected-row" aria-label="影响范围">
            <span v-for="item in area.affected" :key="item">{{ item }}</span>
          </div>

          <div class="area-preview" :data-area="area.id">
            <div class="area-preview-card">
              <span>{{ area.pageLabel }}</span>
              <strong>{{ area.title }}</strong>
              <small>{{ area.affected.join(' / ') }}</small>
            </div>
            <div class="area-preview-items">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>

          <div class="area-control-list">
            <article v-for="control in area.controls" :key="control.label" class="area-control">
              <div class="area-control-copy">
                <strong>{{ control.label }}</strong>
                <p>{{ control.description }}</p>
              </div>

              <div class="area-token-list">
                <label v-for="token in controlTokenDefinitions(control)" :key="token.name" class="area-token-row">
                  <span class="area-token-copy">
                    <strong>{{ token.label }}</strong>
                    <small>{{ token.name }}</small>
                  </span>

                  <input
                    v-if="token.format === 'hex'"
                    class="color-input"
                    type="color"
                    :value="colorInputValue(token.name)"
                    :aria-label="`${control.label} ${token.label} 颜色选择`"
                    @input="updateTokenFromPicker(token.name, $event)"
                  >
                  <span v-else class="color-format">{{ token.format }}</span>

                  <input
                    class="token-value"
                    :value="currentValue(token.name)"
                    spellcheck="false"
                    :aria-label="`${control.label} ${token.label} CSS 值`"
                    @input="updateTokenFromText(token.name, $event)"
                  >

                  <button
                    class="token-reset"
                    type="button"
                    :disabled="!hasOverride(token.name)"
                    @click="resetToken(token.name)"
                  >
                    默认
                  </button>
                </label>
              </div>
            </article>
          </div>
        </section>

        <section class="advanced-token-panel">
          <div class="token-group-head">
            <div>
              <p class="eyebrow">Advanced</p>
              <h3 class="section-title">高级 token 全表</h3>
            </div>
            <p class="section-note">这里保留原始变量名，适合精细调试和导出后写回 CSS。</p>
          </div>

        <section v-for="group in groups" :key="group.title" class="token-group">
          <div class="token-group-head">
            <div>
              <p class="eyebrow">Token group</p>
              <h3 class="section-title">{{ group.title }}</h3>
            </div>
            <p class="section-note">{{ group.description }}</p>
          </div>

          <div class="token-list">
            <label v-for="token in group.tokens" :key="token.name" class="token-row">
              <span class="token-copy">
                <strong>{{ token.label }}</strong>
                <small>{{ token.name }}</small>
                <em>{{ token.description }}</em>
              </span>

              <input
                v-if="token.format === 'hex'"
                class="color-input"
                type="color"
                :value="colorInputValue(token.name)"
                :aria-label="`${token.label} 颜色选择`"
                @input="updateTokenFromPicker(token.name, $event)"
              >
              <span v-else class="color-format">{{ token.format }}</span>

              <input
                class="token-value"
                :value="currentValue(token.name)"
                spellcheck="false"
                :aria-label="`${token.label} CSS 值`"
                @input="updateTokenFromText(token.name, $event)"
              >

              <button
                class="token-reset"
                type="button"
                :disabled="!hasOverride(token.name)"
                @click="resetToken(token.name)"
              >
                默认
              </button>

              <span class="token-default">默认：{{ defaultValue(token.name) }}</span>
            </label>
          </div>
        </section>
        </section>
      </main>
    </div>

    <section class="preview-board page-card" aria-label="实时预览">
      <div class="preview-copy">
        <p class="eyebrow">Live preview</p>
        <h3 class="section-title">典型组件预览</h3>
        <p class="section-copy">改左侧 token 后，这里的卡片、按钮、输入框、徽章和统计块会同步变化。</p>
      </div>

      <div class="preview-surface">
        <div class="badge-row">
          <span class="badge">暖纸张</span>
          <span class="pill active">当前选中</span>
          <span class="pill">待确认</span>
        </div>

        <div class="preview-actions">
          <button class="button-solid" type="button">主行动</button>
          <button class="button-subtle" type="button">次行动</button>
        </div>

        <input value="一个会跟随 token 变化的输入框" aria-label="预览输入框">

        <div class="summary-grid preview-summary">
          <article class="summary-card accent-sunrise">
            <p>愿望</p>
            <strong>18</strong>
            <span>正在发光</span>
          </article>
          <article class="summary-card accent-aurora">
            <p>完成</p>
            <strong>7</strong>
            <span>继续推进</span>
          </article>
          <article class="summary-card accent-golden">
            <p>奖励</p>
            <strong>3</strong>
            <span>等你兑换</span>
          </article>
          <article class="summary-card accent-coral">
            <p>记录</p>
            <strong>42</strong>
            <span>还在生长</span>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.color-dashboard {
  display: grid;
  gap: var(--space-4);
  padding-bottom: var(--space-5);
}

.dashboard-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(12rem, 0.28fr);
  gap: var(--space-5);
  align-items: end;
  background:
    radial-gradient(circle at 92% 18%, var(--sage-glow), transparent 34%),
    linear-gradient(135deg, var(--surface-card), var(--warm-panel-strong));
}

.dashboard-hero-copy {
  display: grid;
  gap: 0.7rem;
}

.dashboard-hero-copy .section-copy {
  max-width: 44rem;
  margin: 0;
}

.dashboard-meter {
  display: grid;
  gap: 0.35rem;
  justify-items: end;
  text-align: right;
}

.dashboard-meter span,
.dashboard-meter small {
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.dashboard-meter strong {
  color: var(--accent-dark);
  font-family: var(--font-heading);
  font-size: var(--type-d1-size);
  font-weight: 600;
  line-height: var(--type-d1-line);
}

.dashboard-layout {
  display: grid;
  grid-template-columns: minmax(16rem, 0.32fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.dashboard-tools {
  position: sticky;
  top: var(--space-4);
  display: grid;
  gap: var(--space-4);
}

.area-search {
  display: grid;
  gap: 0.55rem;
  padding-top: var(--space-3);
  border-top: 1px solid var(--line-soft);
}

.json-box {
  display: grid;
  gap: 0.55rem;
}

.area-search span,
.json-box span,
.tool-feedback,
.contrast-row span {
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.json-box textarea {
  min-height: 10rem;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: var(--type-meta-size);
}

.tool-feedback {
  margin: 0;
}

.contrast-panel {
  display: grid;
  gap: 0.65rem;
  padding-top: var(--space-3);
  border-top: 1px solid var(--line-soft);
}

.contrast-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.contrast-row strong {
  color: var(--danger);
  font-family: var(--font-heading);
  font-weight: 600;
}

.contrast-row strong.pass {
  color: var(--success);
}

.token-workbench {
  display: grid;
  gap: var(--space-4);
}

.area-intro {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
  padding: var(--space-4) var(--space-5);
  background:
    radial-gradient(circle at 92% 0%, var(--accent-panel), transparent 32%),
    linear-gradient(135deg, var(--surface-card), var(--warm-panel-strong));
}

.empty-search {
  margin: 0;
  color: var(--text-soft);
}

.area-group,
.advanced-token-panel {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--warm-border-soft);
  border-radius: var(--radius-xl);
  background: var(--warm-panel);
  box-shadow: var(--shadow-card);
}

.area-group-head,
.token-group-head {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;
}

.affected-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.affected-row span {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.34rem 0.72rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
  color: var(--text-muted);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.area-preview {
  display: grid;
  grid-template-columns: minmax(0, 0.72fr) minmax(8rem, 0.28fr);
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 100% 0%, var(--cool-glow), transparent 32%),
    var(--surface-soft);
}

.area-preview-card {
  display: grid;
  gap: 0.28rem;
  min-height: 7rem;
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
}

.area-preview-card span,
.area-preview-card small {
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.area-preview-card strong {
  color: var(--text-main);
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  font-weight: 600;
  line-height: var(--type-card-title-line);
}

.area-preview-items {
  display: grid;
  gap: 0.55rem;
}

.area-preview-items span {
  min-height: 2rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-pill);
  background: var(--surface-raised);
}

.area-preview[data-area='buttons-navigation'] .area-preview-card,
.area-preview[data-area='list-cards'] .area-preview-card {
  border-color: var(--accent-border);
  background: var(--accent-panel);
}

.area-preview[data-area='rewards-space'] .area-preview-card {
  border-color: var(--warning-border);
  background: linear-gradient(135deg, var(--warning-panel), var(--surface-card));
}

.area-preview[data-area='wish-bottle'] .area-preview-card {
  border-color: var(--warm-border);
  background:
    radial-gradient(circle at 80% 12%, var(--accent-gold), transparent 18%),
    linear-gradient(135deg, var(--mist), var(--surface-card));
}

.area-control-list {
  display: grid;
  gap: var(--space-3);
}

.area-control {
  display: grid;
  grid-template-columns: minmax(12rem, 0.28fr) minmax(0, 1fr);
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface-raised) 62%, transparent);
}

.area-control-copy {
  display: grid;
  gap: 0.35rem;
  align-content: start;
}

.area-control-copy strong,
.area-token-copy strong {
  color: var(--text-main);
  font-size: var(--type-l4-size);
  line-height: var(--type-l4-line);
}

.area-control-copy p {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.area-token-list {
  display: grid;
  gap: 0.62rem;
}

.area-token-row {
  display: grid;
  grid-template-columns: minmax(8rem, 0.72fr) 4rem minmax(10rem, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
}

.area-token-copy {
  display: grid;
  gap: 0.15rem;
}

.area-token-copy small {
  color: var(--text-faint);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}

.token-group {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-5);
  border: 1px solid var(--warm-border-soft);
  border-radius: var(--radius-xl);
  background: var(--warm-panel);
  box-shadow: var(--shadow-card);
}

.token-list {
  display: grid;
  gap: 0.72rem;
}

.token-row {
  display: grid;
  grid-template-columns: minmax(12rem, 1fr) 4rem minmax(12rem, 0.72fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.82rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface-raised) 70%, transparent);
}

.token-copy {
  display: grid;
  gap: 0.2rem;
}

.token-copy strong {
  font-size: var(--type-l4-size);
  line-height: var(--type-l4-line);
}

.token-copy small,
.token-copy em,
.token-default,
.color-format {
  color: var(--text-faint);
  font-size: var(--type-meta-size);
  font-style: normal;
  line-height: var(--type-meta-line);
}

.color-input {
  width: 3.5rem;
  min-width: 3.5rem;
  height: 2.75rem;
  padding: 0.22rem;
  border-radius: var(--radius-md);
}

.color-format {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-md);
  background: var(--surface-soft);
}

.token-value {
  min-height: 2.75rem;
  padding: 0.65rem 0.75rem;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: var(--type-meta-size);
}

.token-reset {
  min-height: 2.75rem;
  padding: 0 0.82rem;
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--surface-card);
  color: var(--text-soft);
}

.token-default {
  grid-column: 3 / 5;
}

.preview-board {
  display: grid;
  grid-template-columns: minmax(14rem, 0.34fr) minmax(0, 1fr);
  gap: var(--space-5);
  align-items: start;
}

.preview-copy {
  display: grid;
  gap: 0.65rem;
}

.preview-copy .section-copy {
  margin: 0;
}

.preview-surface {
  display: grid;
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--warm-border);
  border-radius: var(--radius-lg);
  background: var(--surface-raised);
}

.preview-actions {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.preview-summary {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

@media (max-width: 920px) {
  .dashboard-hero,
  .dashboard-layout,
  .preview-board {
    grid-template-columns: 1fr;
  }

  .dashboard-meter {
    justify-items: start;
    text-align: left;
  }

  .dashboard-tools {
    position: static;
  }

  .area-intro,
  .area-group-head,
  .area-control,
  .area-preview,
  .area-token-row {
    grid-template-columns: 1fr;
  }

  .area-intro,
  .area-group-head {
    display: grid;
  }

  .token-group-head {
    display: grid;
  }

  .token-row {
    grid-template-columns: 4rem minmax(0, 1fr) auto;
  }

  .token-copy,
  .token-default {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .token-group,
  .preview-surface {
    padding: var(--space-4);
  }

  .token-row {
    grid-template-columns: 1fr;
  }

  .color-input,
  .color-format,
  .token-value,
  .token-reset {
    width: 100%;
  }

  .preview-summary {
    grid-template-columns: 1fr;
  }
}
</style>