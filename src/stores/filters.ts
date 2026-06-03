import { ref } from 'vue'
import { defineStore } from 'pinia'

export type VisibilityFilter = 'all' | 'shared' | 'mine'
export type StatusFilter = 'all' | 'active' | 'done'
export type SortFilter = 'time' | 'progress'

export const useFilterStore = defineStore('filters', () => {
  const search = ref('')
  const visibility = ref<VisibilityFilter>('all')
  const status = ref<StatusFilter>('active')
  const sortMode = ref<SortFilter>('time')

  function reset() {
    search.value = ''
    visibility.value = 'all'
    status.value = 'active'
    sortMode.value = 'time'
  }

  return {
    reset,
    search,
    sortMode,
    status,
    visibility,
  }
})