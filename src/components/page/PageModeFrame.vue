<script setup lang="ts">
const mode = defineModel<'action' | 'manage'>('mode', { default: 'action' })

withDefaults(defineProps<{
  actionLabel?: string
  manageLabel?: string
  switchOnly?: boolean
  title?: string
}>(), {
  actionLabel: '先做事',
  manageLabel: '再整理',
  switchOnly: false,
  title: '页面模式切换',
})
</script>

<template>
  <section class="page-mode-frame">
    <div class="page-mode-frame-head">
      <div class="page-mode-frame-switch" role="tablist" :aria-label="title">
        <button
          class="page-mode-frame-tab"
          :class="{ 'is-active': mode === 'action' }"
          type="button"
          role="tab"
          :aria-selected="mode === 'action'"
          @click="mode = 'action'"
        >
          {{ actionLabel }}
        </button>
        <button
          class="page-mode-frame-tab"
          :class="{ 'is-active': mode === 'manage' }"
          type="button"
          role="tab"
          :aria-selected="mode === 'manage'"
          @click="mode = 'manage'"
        >
          {{ manageLabel }}
        </button>
      </div>

      <slot name="head-meta"></slot>
    </div>

    <div v-if="!switchOnly" class="page-mode-frame-content">
      <div v-if="mode === 'action'" class="page-mode-frame-panel is-action" role="tabpanel">
        <slot name="action"></slot>
      </div>

      <div v-else class="page-mode-frame-panel is-manage" role="tabpanel">
        <slot name="manage"></slot>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-mode-frame,
.page-mode-frame-content,
.page-mode-frame-panel {
  display: grid;
  gap: 0.9rem;
}

.page-mode-frame-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
  flex-wrap: wrap;
}

.page-mode-frame-switch {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;
  padding: 0.26rem;
  border: 1px solid var(--warm-border);
  border-radius: 999px;
  background: rgba(255, 252, 247, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45);
}

.page-mode-frame-tab {
  min-height: 2.35rem;
  padding: 0.45rem 0.92rem;
  border-radius: 999px;
  background: transparent;
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  font-weight: 700;
  line-height: 1.1;
  transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.page-mode-frame-tab.is-active {
  background: linear-gradient(135deg, rgba(255, 248, 240, 0.98), rgba(246, 232, 219, 0.94));
  color: var(--text-main);
  box-shadow: 0 8px 18px rgba(78, 55, 39, 0.08);
}

.page-mode-frame-tab:hover,
.page-mode-frame-tab:focus-visible {
  color: var(--text-main);
}

@media (max-width: 720px) {
  .page-mode-frame-head {
    align-items: stretch;
  }

  .page-mode-frame-switch {
    width: 100%;
  }
}
</style>
