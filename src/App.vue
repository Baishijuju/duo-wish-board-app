<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { applyStoredAppearanceTheme, clearAppearanceThemeTokens } from './composables/useAppearanceTheme'
import { ENTRY_STATUS_LABELS, getSyncStatusLabel } from './shared/statusSemantics'
import { useAuthStore } from './stores/auth'
import { useWishStore } from './stores/wishes'

const route = useRoute()
const authStore = useAuthStore()
const wishStore = useWishStore()

type NavItem = {
  label: string
  to: string
  primary?: boolean
  desktopOnly?: boolean
}

void authStore.initializeAuthSession()
applyStoredAppearanceTheme()

const COLOR_MODE_STORAGE_KEY = 'duo-wish-board-color-mode:v1'
const isDarkMode = ref(false)

function applyColorMode(isDark: boolean) {
  if (typeof document === 'undefined') {
    return
  }

  if (isDark) {
    clearAppearanceThemeTokens()
  } else {
    applyStoredAppearanceTheme()
  }

  document.documentElement.dataset.theme = isDark ? 'dark' : 'light'
}

function initializeColorMode() {
  if (typeof window === 'undefined') {
    return
  }

  const savedMode = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY)
  isDarkMode.value = savedMode === 'dark'
  applyColorMode(isDarkMode.value)
}

function toggleColorMode() {
  isDarkMode.value = !isDarkMode.value
  applyColorMode(isDarkMode.value)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, isDarkMode.value ? 'dark' : 'light')
  }
}

initializeColorMode()

const navItems: NavItem[] = [
  { label: '首页', to: '/' },
  { label: '清单', to: '/list' },
  { label: '写下', to: '/compose', primary: true },
  { label: '回顾', to: '/review' },
  { label: '空间', to: '/space' },
]

const mobileNavItems = navItems.filter((item) => !item.desktopOnly)

const syncLabel = computed(() => {
  return getSyncStatusLabel({
    isLoading: wishStore.isLoading,
    realtimeStatus: wishStore.realtimeStatus,
    syncMessage: wishStore.syncMessage,
    usesSupabaseSpace: authStore.usesSupabaseSpace,
  })
})

const spaceSummaryLabel = computed(() => {
  const currentMemberName = authStore.currentMember?.displayName ?? '当前成员'

  if (authStore.usesSupabaseSpace) {
    return `${currentMemberName} ${ENTRY_STATUS_LABELS.entered}共享愿望空间 · ${syncLabel.value} · ${authStore.members.length} 位成员`
  }

  return `${currentMemberName} 当前在本地演示空间 · ${syncLabel.value} · ${authStore.members.length} 位成员`
})

const syncActionLabel = computed(() => {
  if (wishStore.isLoading) {
    return '同步中...'
  }

  if (wishStore.realtimeStatus === 'error') {
    return '重试同步'
  }

  return '立即同步'
})

const colorModeLabel = computed(() => {
  return isDarkMode.value ? '日间' : '黑夜'
})

const canManualSync = computed(() => authStore.usesSupabaseSpace && !wishStore.isLoading)

async function handleManualSync() {
  if (!canManualSync.value) {
    return
  }

  await wishStore.syncFromSupabase()
}

function isActivePath(targetPath: string) {
  if (targetPath === '/') {
    return route.path === '/'
  }

  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}
</script>

<template>
  <div class="app-shell">
    <header class="shell-header">
      <article class="shell-topbar page-card">
        <div class="shell-brand">
          <p class="eyebrow">两个人的愿望页</p>
          <div class="shell-brand-row">
            <h1>人生愿望清单</h1>
          </div>
          <p class="shell-status shell-status-inline">
            <span>{{ spaceSummaryLabel }}</span>
            <button class="shell-theme-inline-button" type="button" @click="toggleColorMode">
              {{ colorModeLabel }}
            </button>
            <button
              v-if="authStore.usesSupabaseSpace"
              class="shell-sync-inline-button"
              type="button"
              :disabled="!canManualSync"
              @click="void handleManualSync()"
            >
              {{ syncActionLabel }}
            </button>
          </p>
        </div>

        <nav class="top-nav" aria-label="桌面端主导航">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :class="{ active: isActivePath(item.to), primary: item.primary }"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </article>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <nav class="mobile-bottom-nav" aria-label="移动端主导航">
      <RouterLink
        v-for="item in mobileNavItems"
        :key="item.to"
        :to="item.to"
        class="bottom-nav-link"
        :class="{ active: isActivePath(item.to), primary: item.primary }"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  width: min(1180px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1rem 0 6rem;
}

.shell-header {
  margin-bottom: 1rem;
}

.shell-topbar {
  display: flex;
  justify-content: space-between;
  gap: 1.35rem;
  align-items: center;
  padding: 0.78rem 0.92rem;
}

.shell-brand {
  display: grid;
  gap: 0.16rem;
  max-width: 17rem;
}

.shell-brand-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
}

.shell-brand h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--type-card-title-size);
  line-height: var(--type-card-title-line);
  letter-spacing: var(--type-card-title-tracking);
  color: color-mix(in srgb, var(--text-main) 84%, var(--text-soft));
}

.shell-status {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-l7-size);
  line-height: 1.4;
  letter-spacing: var(--type-supporting-spacing);
}

.shell-status-inline {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.46rem;
}

.shell-status-inline > span {
  display: inline-block;
  white-space: nowrap;
  letter-spacing: 0;
}

.shell-sync-inline-button {
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: var(--surface-soft);
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-nav-size);
  line-height: 1;
  letter-spacing: var(--type-button-tracking);
  padding: 0.42rem 0.78rem;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}

.shell-sync-inline-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--accent-border);
  background: var(--accent-panel);
}

.shell-sync-inline-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.shell-theme-inline-button {
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  background: color-mix(in srgb, var(--card-bg-raised) 72%, transparent);
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-nav-size);
  line-height: 1;
  letter-spacing: var(--type-button-tracking);
  padding: 0.42rem 0.72rem;
  transition: transform 180ms ease, background 180ms ease, border-color 180ms ease;
}

.shell-theme-inline-button:hover {
  transform: translateY(-1px);
  border-color: var(--accent-border);
  background: var(--accent-panel);
}

.top-nav {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.82rem;
}

.nav-link,
.bottom-nav-link {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-card);
  color: var(--text-main);
  font-family: var(--font-body);
  font-size: var(--type-nav-size);
  font-weight: 500;
  line-height: var(--type-nav-line);
  letter-spacing: var(--type-button-tracking);
  text-decoration: none;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.nav-link {
  min-height: 44px;
  padding: 0.68rem 1.08rem;
}

.nav-link:hover,
.nav-link.active,
.bottom-nav-link:hover,
.bottom-nav-link.active {
  transform: translateY(-1px);
  border-color: var(--accent-border);
  background: var(--accent-panel);
  color: var(--accent-dark);
  box-shadow: 0 6px 16px var(--accent-shadow-soft);
}

.nav-link.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: var(--accent-contrast);
  box-shadow: 0 10px 22px var(--accent-shadow);
}

:global(:root[data-theme='dark']) .bottom-nav-link.active,
:global(:root[data-theme='dark']) .nav-link.active,
:global(:root[data-theme='dark']) .nav-link.primary {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent) 62%, var(--surface-strong)),
    color-mix(in srgb, var(--accent-dark) 70%, var(--surface-strong))
  );
  color: var(--accent-contrast);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--accent-shadow) 56%, transparent);
}

.subtle-link {
  background: var(--surface-soft);
}

.app-main {
  display: grid;
  gap: 1rem;
}

.mobile-bottom-nav {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: max(12px, env(safe-area-inset-bottom, 0px));
  z-index: 50;
  display: none;
  grid-template-columns: 1fr 1fr 64px 1fr 1fr;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 999px;
  background: var(--surface-popover);
  border: 1px solid var(--line-strong);
  box-shadow: var(--shadow-raised);
}

.bottom-nav-link {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 42px;
  padding: 10px 4px;
}

.bottom-nav-link.primary {
  width: 52px;
  height: 52px;
  margin: -20px auto 0;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: var(--accent-contrast);
  box-shadow: 0 12px 24px var(--accent-shadow);
}

@media (max-width: 720px) {
  .app-shell {
    width: min(100%, calc(100% - 1rem));
    padding-bottom: calc(6.8rem + env(safe-area-inset-bottom, 0px));
  }

  .shell-topbar {
    align-items: flex-start;
  }

  .shell-brand h1 {
    font-size: var(--type-card-title-size);
  }

  .top-nav {
    display: none;
  }

  .mobile-bottom-nav {
    display: grid;
  }
}

@media (min-width: 721px) {
  .mobile-bottom-nav {
    display: none;
  }
}
</style>
