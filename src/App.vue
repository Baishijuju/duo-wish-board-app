<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useWishStore } from './stores/wishes'

const route = useRoute()
const authStore = useAuthStore()
const wishStore = useWishStore()
const VISUAL_PREVIEW_STORAGE_KEY = 'duo-wish-board-visual-preview:v1'

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
const isVisualPreview = ref(false)

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

const visualPreviewLabel = computed(() => isVisualPreview.value ? '新版外观' : '当前外观')

onMounted(() => {
  isVisualPreview.value = window.localStorage.getItem(VISUAL_PREVIEW_STORAGE_KEY) === 'enabled'
})

watch(isVisualPreview, (value) => {
  window.localStorage.setItem(VISUAL_PREVIEW_STORAGE_KEY, value ? 'enabled' : 'disabled')
})

function toggleVisualPreview() {
  isVisualPreview.value = !isVisualPreview.value
}

function isActivePath(targetPath: string) {
  if (targetPath === '/') {
    return route.path === '/'
  }

  return route.path === targetPath || route.path.startsWith(`${targetPath}/`)
}
</script>

<template>
  <div class="app-shell" :class="{ 'visual-preview-mode': isVisualPreview }">
    <header class="shell-header">
      <button
        class="visual-preview-toggle"
        type="button"
        :aria-pressed="isVisualPreview"
        @click="toggleVisualPreview"
      >
        <span>外观预览</span>
        <strong>{{ visualPreviewLabel }}</strong>
      </button>

      <article class="shell-topbar page-card">
        <div class="shell-brand">
          <p class="eyebrow">两个人的愿望页</p>
          <div class="shell-brand-row">
            <h1>人生愿望清单</h1>
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

.visual-preview-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.52rem;
  min-height: 34px;
  margin: 0 0 0.62rem auto;
  padding: 0.34rem 0.44rem 0.34rem 0.72rem;
  border: 1px solid rgba(86, 64, 49, 0.14);
  border-radius: 999px;
  background: rgba(255, 250, 243, 0.82);
  color: var(--text-soft);
  font-family: var(--font-body);
  font-size: var(--type-l7-size);
  font-weight: 600;
  letter-spacing: var(--type-l7-spacing);
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease;
}

.visual-preview-toggle:hover {
  transform: translateY(-1px);
  border-color: rgba(201, 111, 74, 0.26);
  color: var(--accent-dark);
}

.visual-preview-toggle strong {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0.18rem 0.58rem;
  border-radius: 999px;
  background: rgba(201, 111, 74, 0.12);
  color: var(--accent-dark);
  font-size: var(--type-l7-size);
  letter-spacing: 0;
}

.visual-preview-mode .visual-preview-toggle {
  border-color: rgba(196, 166, 101, 0.34);
  background: #182722;
  color: #d8d5bb;
}

.visual-preview-mode .visual-preview-toggle strong {
  background: #d4a94e;
  color: #17211d;
}

.visual-preview-mode .shell-topbar {
  border-color: rgba(199, 240, 91, 0.28);
  background: linear-gradient(120deg, rgba(16, 22, 20, 0.94), rgba(26, 43, 37, 0.92));
  color: #f6f1df;
  box-shadow: 0 20px 48px rgba(16, 22, 20, 0.18);
}

.visual-preview-mode .shell-brand h1,
.visual-preview-mode .shell-status,
.visual-preview-mode .shell-brand .eyebrow {
  color: inherit;
}

.visual-preview-mode .shell-brand .eyebrow {
  color: #d4a94e;
}

.visual-preview-mode .nav-link,
.visual-preview-mode .bottom-nav-link {
  border-color: rgba(246, 241, 223, 0.22);
  background: rgba(246, 241, 223, 0.08);
  color: #f6f1df;
}

.visual-preview-mode .nav-link:hover,
.visual-preview-mode .nav-link.active,
.visual-preview-mode .bottom-nav-link:hover,
.visual-preview-mode .bottom-nav-link.active {
  border-color: rgba(199, 240, 91, 0.52);
  background: rgba(199, 240, 91, 0.12);
  color: #f2ffba;
  box-shadow: none;
}

.visual-preview-mode .nav-link.primary,
.visual-preview-mode .bottom-nav-link.primary {
  background: #c7f05b;
  color: #101614;
  box-shadow: 0 12px 28px rgba(199, 240, 91, 0.18);
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
