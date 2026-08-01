import { ref } from 'vue'
import { defineStore } from 'pinia'

export type VisibilityFilter = 'all' | 'mine' | 'others'
export type StatusFilter = 'all' | 'active' | 'done'
export type SortFilter = 'progress' | 'starCoins' | 'age' | 'updated'
export type SortDirection = 'asc' | 'desc'

export const useFilterStore = defineStore('filters', () => {
  const search = ref('')
  const visibility = ref<VisibilityFilter>('mine')
  const status = ref<StatusFilter>('active')
  const sortMode = ref<SortFilter>('updated')
  const sortDirection = ref<SortDirection>('desc')

  function setSortMode(nextSortMode: SortFilter) {
    if (sortMode.value === nextSortMode) {
      sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc'
      return
    }

    sortMode.value = nextSortMode
    sortDirection.value = 'desc'
  }

  function reset() {
    search.value = ''
    visibility.value = 'mine'
    status.value = 'active'
    sortMode.value = 'updated'
    sortDirection.value = 'desc'
  }

  return {
    reset,
    search,
    setSortMode,
    sortDirection,
    sortMode,
    status,
    visibility,
  }
})