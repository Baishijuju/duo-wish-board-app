import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomeAtelier.vue'
import ListPage from '../pages/List.vue'
import ComposePage from '../pages/ComposeAtelier.vue'
import PreviewLabPage from '../pages/PreviewLab.vue'
import HomePreviewPage from '../pages/HomePreviewAtelier.vue'
import ComposePreviewPage from '../pages/ComposePreviewAtelier.vue'
import ReviewPreviewPage from '../pages/ReviewPreviewAtelier.vue'
import SpacePreviewPage from '../pages/SpacePreviewAtelier.vue'
import StatsPage from '../pages/Stats.vue'
import WishDetailPage from '../pages/WishDetailAtelier.vue'
import SettingsPage from '../pages/Settings.vue'

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
      path: '/preview',
      name: 'preview-lab',
      component: PreviewLabPage,
    },
    {
      path: '/preview/home',
      name: 'preview-home',
      component: HomePreviewPage,
    },
    {
      path: '/preview/compose',
      name: 'preview-compose',
      component: ComposePreviewPage,
    },
    {
      path: '/preview/review',
      name: 'preview-review',
      component: ReviewPreviewPage,
    },
    {
      path: '/preview/space',
      name: 'preview-space',
      component: SpacePreviewPage,
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
      component: StatsPage,
    },
    {
      path: '/space',
      alias: '/settings',
      name: 'space',
      component: SettingsPage,
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
