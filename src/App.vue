<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
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

const navItems: NavItem[] = [
  { label: '首页', to: '/' },
  { label: '清单', to: '/list' },
  { label: '写下', to: '/compose', primary: true },
  { label: '回顾', to: '/review' },
  { label: '空间', to: '/space' },
]

const mobileNavItems = navItems.filter((item) => !item.desktopOnly)

const isPreviewRoute = computed(() => route.path === '/preview' || route.path.startsWith('/preview/'))

const syncLabel = computed(() => {
  if (!authStore.usesSupabaseSpace) {
    return '暂未同步'
  }

  if (wishStore.realtimeStatus === 'error' || wishStore.syncMessage.includes('失败')) {
    return '同步异常'
  }

  if (wishStore.realtimeStatus === 'connecting' || wishStore.isLoading) {
    return '同步中'
  }

  return '同步正常'
})

const spaceSummaryLabel = computed(() => {
  const currentMemberName = authStore.currentMember?.displayName ?? '当前成员'

  if (authStore.usesSupabaseSpace) {
    return `${currentMemberName} 已进入共享愿望空间 · ${syncLabel.value} · ${authStore.members.length} 位成员`
  }

  return `${currentMemberName} 当前在本地演示空间 · ${syncLabel.value} · ${authStore.members.length} 位成员`
})

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
          <p class="eyebrow">Two Hearts, One Horizon</p>
          <div class="shell-brand-row">
            <h1>人生愿望清单</h1>
            <RouterLink
              class="shell-preview-link subtle-link"
              :class="{ active: isPreviewRoute }"
              :to="{ name: 'preview-lab' }"
            >
              Preview Lab
            </RouterLink>
          </div>
          <p class="shell-status">{{ spaceSummaryLabel }}</p>
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
  padding: 0.9rem 1rem;
}

.shell-brand {
  display: grid;
  gap: 0.28rem;
  max-width: 19rem;
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
  font-size: var(--type-section-title-size);
  line-height: var(--type-section-title-line);
  letter-spacing: var(--type-section-title-tracking);
}

.shell-preview-link {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 34px;
  padding: 0.45rem 0.78rem;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease;
}

.shell-preview-link:hover,
.shell-preview-link.active {
  transform: translateY(-1px);
  border-color: rgba(201, 111, 74, 0.28);
  background: var(--surface-raised);
  color: var(--accent-dark);
}

.shell-status {
  margin: 0;
  font-family: var(--font-body);
  color: var(--text-soft);
  font-size: var(--type-supporting-size);
  line-height: var(--type-supporting-line);
  letter-spacing: var(--type-supporting-spacing);
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
  border-color: rgba(201, 111, 74, 0.3);
  background: #fff2e9;
  color: var(--accent-dark);
  box-shadow: 0 6px 16px rgba(191, 101, 66, 0.1);
}

.nav-link.primary {
  background: linear-gradient(135deg, var(--accent), var(--accent-dark));
  color: #fffaf2;
  box-shadow: 0 10px 22px rgba(191, 101, 66, 0.22);
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
  bottom: 12px;
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
  color: #fffaf2;
  box-shadow: 0 12px 24px rgba(191, 101, 66, 0.26);
}

@media (max-width: 720px) {
  .app-shell {
    width: min(100%, calc(100% - 1rem));
    padding-bottom: 6.8rem;
  }

  .shell-topbar {
    align-items: flex-start;
  }

  .shell-brand h1 {
    font-size: var(--type-section-title-size);
  }

  .shell-preview-link {
    min-height: 32px;
    padding: 0.4rem 0.72rem;
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
