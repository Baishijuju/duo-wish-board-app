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
  <article class="page-card action-card-shell" v-bind="attrs">
    <header v-if="eyebrow || title || summary" class="action-card-shell-head">
      <div class="action-card-shell-copy">
        <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>
        <h2 class="action-card-shell-title">{{ title }}</h2>
        <p v-if="summary" class="action-card-shell-summary">{{ summary }}</p>
      </div>
      <slot name="actions"></slot>
    </header>

    <div class="action-card-shell-body">
      <slot></slot>
    </div>
  </article>
</template>

<style scoped>
.action-card-shell,
.action-card-shell-body {
  display: grid;
  gap: 0.9rem;
}

.action-card-shell-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-card-shell-copy {
  display: grid;
  gap: 0.24rem;
}

.action-card-shell-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
}

.action-card-shell-summary {
  margin: 0;
  color: var(--text-soft);
  font-size: var(--type-meta-size);
  line-height: var(--type-meta-line);
}
</style>
