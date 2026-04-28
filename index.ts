import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HomePage from '../pages/Home.vue'
import ListPage from '../pages/List.vue'
import StatsPage from '../pages/Stats.vue'
import WishDetailPage from '../pages/WishDetail.vue'

const isGitHubPagesHost = typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')

const router = createRouter({
  history: isGitHubPagesHost
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
      path: '/wish/:id',
      name: 'wish-detail',
      component: WishDetailPage,
    },
    {
      path: '/stats',
      name: 'stats',
      component: StatsPage,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router