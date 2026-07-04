import { createRouter, createWebHashHistory, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '../pages/HomeAtelier.vue'
import ListPage from '../pages/List.vue'
import ComposePage from '../pages/ComposeAtelier.vue'
import ReviewPage from '../pages/MonthlyReviewPreview.vue'
import WishDetailPage from '../pages/WishDetailAtelier.vue'
import SettingsPage from '../pages/Settings.vue'

const isGitHubPagesHost = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/list',
    name: 'list',
    component: ListPage,
  },
  {
    path: '/compose',
    name: 'compose',
    component: ComposePage,
  },
  {
    path: '/wish/:id',
    name: 'wish-detail',
    component: WishDetailPage,
  },
  {
    path: '/review',
    alias: '/stats',
    name: 'review',
    component: ReviewPage,
  },
  {
    path: '/space',
    alias: '/settings',
    name: 'space',
    component: SettingsPage,
  },
]

if (import.meta.env.DEV) {
  routes.push({
    path: '/dev/colors',
    name: 'dev-colors',
    component: () => import('../pages/ColorTokenDashboard.vue'),
  })
  routes.push({
    path: '/dev/wish-bottle-stars',
    name: 'dev-wish-bottle-stars',
    component: () => import('../pages/WishBottleStarDemo.vue'),
  })
  routes.push({
    path: '/dev/monthly-review-preview',
    name: 'dev-monthly-review-preview',
    component: () => import('../pages/MonthlyReviewPreview.vue'),
  })
}

const router = createRouter({
  history: isGitHubPagesHost
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      const isWishProgressAnchor = to.name === 'wish-detail' && to.hash === '#progress'

      if (isWishProgressAnchor && typeof document !== 'undefined') {
        const root = document.documentElement
        const previousBehavior = root.style.scrollBehavior
        root.style.scrollBehavior = 'auto'
        requestAnimationFrame(() => {
          root.style.scrollBehavior = previousBehavior
        })
      }

      return {
        el: to.hash,
        top: isWishProgressAnchor ? 260 : 96,
        behavior: isWishProgressAnchor ? 'auto' : 'smooth',
      }
    }

    return { top: 0 }
  },
})

export default router
