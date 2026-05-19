import { ref } from 'vue'
import { defineStore } from 'pinia'

export type VisibilityFilter = 'all' | 'shared' | 'mine'
export type StatusFilter = 'all' | 'active' | 'done'

export const useFilterStore = defineStore('filters', () => {
  const search = ref('')
  const visibility = ref<VisibilityFilter>('all')
  const status = ref<StatusFilter>('active')

  function reset() {
    search.value = ''
    visibility.value = 'all'
    status.value = 'active'
  }

  return {
    reset,
    search,
    status,
    visibility,
  }
})