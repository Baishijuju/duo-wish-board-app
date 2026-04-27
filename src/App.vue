<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { supabaseReadinessMessage } from './lib/supabase'
import { useAuthStore } from './stores/auth'
import { useWishStore } from './stores/wishes'

const route = useRoute()
const authStore = useAuthStore()
const wishStore = useWishStore()

void authStore.initializeAuthSession()

const navItems = [
  { label: '首页', to: '/' },
  { label: '清单', to: '/list' },
  { label: '统计', to: '/stats' },
]

const currentViewLabel = computed(() => {
  if (route.path.startsWith('/wish/')) {
    return '愿望详情'
  }

  return navItems.find((item) => item.to === route.path)?.label ?? '首页'
})

const joinedSpaceLabel = computed(() => {
  if (!authStore.joinedSpaceAt) {
    return '尚未完成邀请加入'
  }

  return authStore.joinedSpaceAt.replace('T', ' ').slice(0, 16)
})

const realtimeStatusLabel = computed(() => {
  if (!authStore.usesSupabaseSpace) {
    return '本地模式'
  }

  if (wishStore.realtimeStatus === 'subscribed') {
    return '实时已连接'
  }

  if (wishStore.realtimeStatus === 'connecting') {
    return '实时连接中'
  }

  if (wishStore.realtimeStatus === 'error') {
    return '实时异常'
  }

  return '实时未连接'
})
</script>

<template>
  <div class="app-shell">
    <header class="shell-hero">
      <article class="hero-stage page-card">
        <div class="hero-copy">
          <p class="eyebrow">Two Hearts, One Horizon</p>
          <h1>双人人生愿望清单</h1>
          <p class="hero-lead">
            把想一起抵达的地方、想各自完成的目标，放进同一张温柔但可以长期维护的生活地图。
          </p>
          <div class="badge-row hero-badge-row">
            <span class="badge">当前页面：{{ currentViewLabel }}</span>
            <span class="badge">{{ authStore.usesSupabaseSpace ? '云端空间已连接' : '本地演示空间' }}</span>
            <span class="badge">{{ realtimeStatusLabel }}</span>
          </div>
        </div>

        <div class="hero-metrics">
          <article class="hero-summary-card">
            <span>总愿望数</span>
            <strong>{{ wishStore.stats.total }}</strong>
            <p>{{ wishStore.stats.active }} 项正在推进</p>
          </article>
          <article class="hero-summary-card">
            <span>共同愿望</span>
            <strong>{{ wishStore.stats.shared }}</strong>
            <p>{{ wishStore.stats.starred }} 条已经被点亮</p>
          </article>
          <article class="hero-summary-card">
            <span>完成率</span>
            <strong>{{ wishStore.stats.completionRate }}%</strong>
            <p>{{ wishStore.stats.done }} 条已经完成</p>
          </article>
        </div>
      </article>

      <aside class="space-panel page-card">
        <div class="space-panel-copy">
          <p class="eyebrow">Shared Space</p>
          <h2>{{ authStore.spaceName }}</h2>
          <p class="section-copy">{{ authStore.sessionSummary }}</p>
        </div>

        <div class="space-detail-grid">
          <article class="space-detail-card">
            <span>邀请码</span>
            <strong>{{ authStore.inviteCode }}</strong>
          </article>
          <article class="space-detail-card">
            <span>加入时间</span>
            <strong>{{ joinedSpaceLabel }}</strong>
          </article>
        </div>

        <div v-if="authStore.canSwitchMembers" class="member-switch-grid">
          <button
            v-for="member in authStore.members"
            :key="member.id"
            class="member-switch-button"
            :class="{ active: authStore.currentMemberId === member.id }"
            type="button"
            @click="authStore.switchMember(member.id)"
          >
            {{ member.displayName }}
          </button>
        </div>
        <div v-else class="badge-row">
          <span v-for="member in authStore.members" :key="member.id" class="badge">
            {{ member.displayName }} / {{ member.role }}
          </span>
        </div>

        <div class="space-status-card">
          <span>{{ supabaseReadinessMessage }}</span>
          <span>{{ wishStore.syncMessage }}</span>
        </div>

        <div class="button-row">
          <button v-if="authStore.isAuthenticated" class="button-subtle signout-button" type="button" @click="void authStore.signOut()">
            退出当前会话
          </button>
        </div>
      </aside>
    </header>

    <div class="top-rail page-card">
      <nav class="top-nav" aria-label="主导航">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ active: route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to)) }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="top-rail-note">
        <span>{{ wishStore.realtimeMessage }}</span>
      </div>
    </div>

    <main class="app-main">
      <RouterView />
    </main>

    <nav class="mobile-dock page-card" aria-label="移动端主导航">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="dock-link"
        :class="{ active: route.path === item.to || (item.to !== '/' && route.path.startsWith(item.to)) }"
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
  padding: 1.25rem 0 4rem;
}

.shell-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.22fr) minmax(320px, 0.88fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.hero-stage {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 1.2rem;
  align-content: space-between;
  min-height: 22rem;
  padding: 1.8rem;
  background:
    linear-gradient(135deg, rgba(255, 247, 237, 0.95), rgba(255, 241, 226, 0.78)),
    linear-gradient(160deg, rgba(241, 166, 97, 0.22), transparent 52%);
}

.hero-stage::before,
.hero-stage::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
}

.hero-stage::before {
  width: 18rem;
  height: 18rem;
  top: -6rem;
  right: -4rem;
  background: radial-gradient(circle, rgba(46, 142, 131, 0.24), transparent 66%);
}

.hero-stage::after {
  width: 15rem;
  height: 15rem;
  bottom: -8rem;
  left: -5rem;
  background: radial-gradient(circle, rgba(219, 107, 87, 0.18), transparent 68%);
}

.hero-copy,
.space-panel-copy {
  position: relative;
  z-index: 1;
}

.hero-copy {
  display: grid;
  gap: 1rem;
  align-content: end;
}

.hero-copy h1,
.space-panel h2 {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  letter-spacing: 0.02em;
}

.hero-copy h1 {
  max-width: 9ch;
  font-size: clamp(3.1rem, 6vw, 5rem);
  line-height: 0.94;
}

.hero-lead {
  width: min(34rem, 100%);
  margin: 0;
  color: var(--text-soft);
  font-size: 1rem;
  line-height: 1.8;
}

.hero-badge-row .badge {
  background: rgba(255, 255, 255, 0.82);
}

.hero-metrics {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.hero-summary-card {
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(90, 59, 41, 0.08);
  background: rgba(255, 255, 255, 0.62);
}

.hero-summary-card span,
.space-detail-card span {
  display: block;
  color: var(--text-soft);
  font-size: 0.88rem;
}

.hero-summary-card strong,
.space-detail-card strong {
  display: block;
  margin: 0.3rem 0 0.18rem;
  font-size: 1.8rem;
  font-family: 'Cormorant Garamond', serif;
}

.hero-summary-card p {
  margin: 0;
  color: rgba(32, 23, 28, 0.72);
  line-height: 1.6;
}

.space-panel {
  display: grid;
  gap: 1rem;
  align-content: start;
  padding: 1.5rem;
  background:
    linear-gradient(180deg, rgba(252, 248, 242, 0.95), rgba(248, 239, 228, 0.82)),
    radial-gradient(circle at bottom right, rgba(241, 166, 97, 0.16), transparent 42%);
}

.space-panel h2 {
  font-size: 2.2rem;
  line-height: 1;
}

.space-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.space-detail-card,
.space-status-card {
  padding: 1rem;
  border-radius: 20px;
  border: 1px solid rgba(90, 59, 41, 0.08);
  background: rgba(255, 255, 255, 0.58);
}

.space-status-card {
  display: grid;
  gap: 0.35rem;
  color: var(--text-soft);
  line-height: 1.7;
}

.member-switch-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.member-switch-button,
.signout-button,
.nav-link,
.dock-link {
  border: 1px solid rgba(79, 49, 35, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--text-main);
  transition: transform 180ms ease, border-color 180ms ease, background 180ms ease;
}

.member-switch-button,
.dock-link {
  padding: 0.72rem 1rem;
}

.member-switch-button:hover,
.member-switch-button.active,
.signout-button:hover,
.nav-link:hover,
.nav-link.active,
.dock-link:hover,
.dock-link.active {
  transform: translateY(-1px);
  border-color: rgba(46, 142, 131, 0.26);
  background: rgba(236, 248, 246, 0.84);
}

.top-rail {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.9rem 1rem;
}

.top-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
}

.nav-link,
.dock-link {
  text-decoration: none;
}

.nav-link {
  padding: 0.8rem 1.1rem;
}

.top-rail-note {
  max-width: 24rem;
  color: var(--text-soft);
  line-height: 1.7;
  text-align: right;
}

.app-main {
  min-height: 0;
}

.mobile-dock {
  display: none;
}

@media (max-width: 1080px) {
  .shell-hero {
    grid-template-columns: 1fr;
  }

  .hero-copy h1 {
    max-width: none;
  }

  .top-rail {
    align-items: flex-start;
    flex-direction: column;
  }

  .top-rail-note {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 720px) {
  .app-shell {
    width: min(1180px, calc(100% - 1rem));
    padding-bottom: 6.4rem;
  }

  .hero-stage,
  .space-panel {
    padding: 1.25rem;
  }

  .hero-metrics,
  .space-detail-grid {
    grid-template-columns: 1fr;
  }

  .top-rail {
    display: none;
  }

  .mobile-dock {
    position: fixed;
    left: 50%;
    bottom: 0.7rem;
    transform: translateX(-50%);
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.45rem;
    width: min(560px, calc(100% - 1rem));
    padding: 0.55rem;
  }

  .dock-link {
    text-align: center;
  }
}
</style>
