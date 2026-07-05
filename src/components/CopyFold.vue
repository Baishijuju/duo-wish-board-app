<script setup lang="ts">
import { computed, useAttrs, withDefaults } from 'vue'
import { trackAnalyticsEvent } from '../utils/analytics'
import { getCopyPolicyRule, normalizeCopyText, shouldCollapseCopy, truncateCopyText, type CopyLayer } from '../utils/copyPolicy'

let copyFoldIdSeed = 0

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const props = withDefaults(defineProps<{
  as?: string
  collapseLabel?: string
  expandLabel?: string
  layer: CopyLayer
  maxChars?: number
  page: string
  target: string
  text: string
}>(), {
  as: 'p',
  collapseLabel: undefined,
  expandLabel: undefined,
  maxChars: undefined,
})

const isExpanded = defineModel<boolean>('expanded', { default: false })
const contentId = `copy-fold-content-${copyFoldIdSeed += 1}`

const normalizedText = computed(() => normalizeCopyText(props.text))
const policyRule = computed(() => getCopyPolicyRule(props.layer))
const effectiveExpandLabel = computed(() => props.expandLabel ?? policyRule.value.expandLabel)
const effectiveCollapseLabel = computed(() => props.collapseLabel ?? policyRule.value.collapseLabel)
const isCollapsible = computed(() => shouldCollapseCopy(normalizedText.value, props.layer, props.maxChars))
const collapsedText = computed(() => truncateCopyText(normalizedText.value, props.layer, props.maxChars))
const renderedText = computed(() => {
  if (!isCollapsible.value || isExpanded.value) {
    return normalizedText.value
  }

  return collapsedText.value
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
  trackAnalyticsEvent(isExpanded.value ? 'copy_expand' : 'copy_collapse', {
    layer: props.layer,
    page: props.page,
    target: props.target,
  })
}
</script>

<template>
  <div class="copy-fold">
    <component :is="as" :id="contentId" v-bind="attrs">
      {{ renderedText }}
    </component>

    <button
      v-if="isCollapsible"
      class="copy-fold-toggle"
      type="button"
      :aria-controls="contentId"
      :aria-expanded="isExpanded"
      @click="toggleExpanded"
    >
      {{ isExpanded ? effectiveCollapseLabel : effectiveExpandLabel }}
    </button>
  </div>
</template>

<style scoped>
.copy-fold {
  display: grid;
  gap: 0.3rem;
}

.copy-fold-toggle {
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--accent-dark);
  font-size: var(--type-l7-size);
  line-height: var(--type-l7-line);
  letter-spacing: var(--type-l7-spacing);
}

.copy-fold-toggle:hover,
.copy-fold-toggle:focus-visible {
  text-decoration: underline;
}
</style>
