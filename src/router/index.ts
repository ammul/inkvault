import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diary',
    name: 'diary',
    component: () => import('@/views/DiaryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diary/:date',
    name: 'diary-day',
    component: () => import('@/views/DiaryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/stats',
    name: 'stats',
    component: () => import('@/views/StatisticsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/trackers',
    name: 'trackers',
    component: () => import('@/views/TrackersView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/data',
    name: 'data',
    component: () => import('@/views/DataView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/theme',
    name: 'theme',
    component: () => import('@/views/ThemeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/app-settings',
    name: 'app-settings',
    component: () => import('@/views/AppSettingsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/AboutView.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isUnlocked) {
    return false
  }
})

export default router
