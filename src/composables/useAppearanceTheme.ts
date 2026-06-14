import { computed, ref } from 'vue'

export type AppearanceThemeId = 'appearance1' | 'appearance2'

export type AppearanceTheme = {
  id: AppearanceThemeId
  label: string
  shortLabel: string
  description: string
  preview: string[]
  tokens: Record<string, string>
}

const APPEARANCE_STORAGE_KEY = 'duo-wish-board-appearance:v1'

export const appearanceThemes: AppearanceTheme[] = [
  {
    id: 'appearance1',
    label: '外观 1',
    shortLabel: '原来',
    description: '原来的暖纸张、橙棕强调和安静卡片。',
    preview: ['#f5eee5', '#fffaf3', '#c96f4a'],
    tokens: {},
  },
  {
    id: 'appearance2',
    label: '外观 2',
    shortLabel: '粉青',
    description: '淡紫粉背景、青蓝落底、桃米卡片和玫瑰按钮。',
    preview: ['#e8d1ea', '#a0dadc', '#d9799a'],
    tokens: {
      '--bg': '#e8d1ea',
      '--surface-card': '#fff0f7',
      '--bg-deep': '#a0dadc',
      '--card-bg-popover': '#fff8d8',
      '--accent-gradient-end': '#e7799f',
      '--accent-shadow': 'rgba(190, 95, 134, 0.22)',
      '--card-bg': '#fff1e5',
      '--card-bg-raised': '#f8f2f8',
      '--accent-sun': '#ff9fb7',
      '--accent-dark': '#be5f86',
      '--accent': '#d9799a',
      '--accent-panel': '#ffe9f1',
      '--active-item-bg': '#ffe9f1',
      '--active-item-border': 'rgba(217, 121, 154, 0.38)',
      '--accent-border': 'rgba(217, 121, 154, 0.38)',
      '--accent-ring': 'rgba(217, 121, 154, 0.14)',
      '--accent-shadow-soft': 'rgba(190, 95, 134, 0.12)',
    },
  },
]

const appearanceTokenNames = Array.from(new Set(appearanceThemes.flatMap((theme) => Object.keys(theme.tokens))))
const selectedAppearanceId = ref<AppearanceThemeId>(readStoredAppearanceId())

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function isAppearanceThemeId(value: string | null): value is AppearanceThemeId {
  return value === 'appearance1' || value === 'appearance2'
}

function readStoredAppearanceId(): AppearanceThemeId {
  if (!canUseBrowserStorage()) {
    return 'appearance1'
  }

  const storedValue = window.localStorage.getItem(APPEARANCE_STORAGE_KEY)
  return isAppearanceThemeId(storedValue) ? storedValue : 'appearance1'
}

function persistAppearanceId(id: AppearanceThemeId) {
  if (!canUseBrowserStorage()) {
    return
  }

  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, id)
}

function applyAppearanceTokens(id: AppearanceThemeId) {
  if (!canUseBrowserStorage()) {
    return
  }

  const root = document.documentElement
  const theme = appearanceThemes.find((item) => item.id === id) ?? appearanceThemes[0]

  for (const name of appearanceTokenNames) {
    root.style.removeProperty(name)
  }

  for (const [name, value] of Object.entries(theme.tokens)) {
    root.style.setProperty(name, value)
  }
}

export function applyStoredAppearanceTheme() {
  selectedAppearanceId.value = readStoredAppearanceId()
  applyAppearanceTokens(selectedAppearanceId.value)
}

export function setAppearanceTheme(id: AppearanceThemeId) {
  selectedAppearanceId.value = id
  persistAppearanceId(id)
  applyAppearanceTokens(id)
}

export function useAppearanceTheme() {
  const selectedTheme = computed(() => appearanceThemes.find((theme) => theme.id === selectedAppearanceId.value) ?? appearanceThemes[0])

  return {
    appearanceThemes,
    selectedAppearanceId,
    selectedTheme,
    setAppearanceTheme,
  }
}
