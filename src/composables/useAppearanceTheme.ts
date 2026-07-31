import { computed, ref } from 'vue'

export type AppearanceThemeId = 'appearance2'

export type AppearanceTheme = {
  id: AppearanceThemeId
  label: string
  shortLabel: string
  description: string
  preview: string[]
  tokens: Record<string, string>
}

const APPEARANCE_STORAGE_KEY = 'duo-wish-board-appearance:v1'
const DEFAULT_APPEARANCE_ID: AppearanceThemeId = 'appearance2'

export const appearanceThemes: AppearanceTheme[] = [
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
      '--accent-strong': '#be5f86',
      '--accent': '#d9799a',
      '--accent-panel': '#ffe9f1',
      '--active-item-bg': '#ffe9f1',
      '--active-item-border': 'rgba(217, 121, 154, 0.38)',
      '--accent-border': 'rgba(217, 121, 154, 0.38)',
      '--accent-ring': 'rgba(217, 121, 154, 0.14)',
      '--accent-shadow-soft': 'rgba(190, 95, 134, 0.12)',
      '--sage-strong': '#5d9aa0',
    },
  },
]

const appearanceTokenNames = Array.from(new Set(appearanceThemes.flatMap((theme) => Object.keys(theme.tokens))))
const selectedAppearanceId = ref<AppearanceThemeId>(readStoredAppearanceId())

function canUseBrowserStorage() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

function readStoredAppearanceId(): AppearanceThemeId {
  return DEFAULT_APPEARANCE_ID
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

export function clearAppearanceThemeTokens() {
  if (!canUseBrowserStorage()) {
    return
  }

  const root = document.documentElement
  for (const name of appearanceTokenNames) {
    root.style.removeProperty(name)
  }
}

export function applyStoredAppearanceTheme() {
  selectedAppearanceId.value = readStoredAppearanceId()
  if (canUseBrowserStorage()) {
    window.localStorage.removeItem(APPEARANCE_STORAGE_KEY)
  }
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
