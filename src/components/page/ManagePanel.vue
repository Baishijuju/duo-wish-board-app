<script setup lang="ts">
import { useAttrs } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

withDefaults(defineProps<{
  eyebrow?: string
  summary?: string
  title: string
}>(), {
  eyebrow: undefined,
  summary: undefined,
})
</script>

<template>
  <article class="page-card manage-panel-shell" v-bind="attrs">
    <header v-if="eyebrow || title || summary" class="manage-panel-shell-head">
      <div class="manage-panel-shell-copy">
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h2 class="manage-panel-shell-title">{{ title }}</h2>
        <p v-if="summary" class="manage-panel-shell-summary">{{ summary }}</p>
      </div>
      <slot name="actions"></slot>
    </header>

    <div class="manage-panel-shell-body">
      <slot></slot>
    </div>
  </article>
</template>

<style scoped>
.manage-panel-shell,
.manage-panel-shell-body {
  display: grid;
  gap: 0.9rem;
}

.manage-panel-shell-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.manage-panel-shell-copy {
  display: grid;
  gap: 0.24rem;
}

.manage-panel-shell-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.manage-panel-shell-summary {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}
</style>
