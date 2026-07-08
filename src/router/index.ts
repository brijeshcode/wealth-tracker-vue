import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Public auth routes ─────────────────────────────────────────
    {
      path: '/login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/register',
      component: RegisterView,
      meta: { public: true },
    },
    // ── Protected app routes (AppLayout wraps all) ─────────────────
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        { path: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'fd', component: () => import('@/views/fd/FdView.vue') },
        { path: 'stocks', component: () => import('@/views/stocks/StocksView.vue') },
        { path: 'stocks/import', component: () => import('@/views/stocks/StockImportView.vue') },
        { path: 'stocks/:stockId', component: () => import('@/views/stocks/StockDetailView.vue') },
        { path: 'mf', component: () => import('@/views/mf/MfView.vue') },
        { path: 'income', component: () => import('@/views/IncomeView.vue') },
        { path: 'maturities', component: () => import('@/views/MaturitiesView.vue') },
        { path: 'import', component: () => import('@/views/ImportView.vue') },
      ],
    },
    // ── Admin routes ─────────────────────────────────────────────────
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/stocks/import-nse' },
        {
          path: 'stocks/import-nse',
          component: () => import('@/views/admin/AdminNseImportView.vue'),
        },
        {
          path: 'stocks/upsert',
          component: () => import('@/views/admin/AdminStockUpsertView.vue'),
        },
        {
          path: 'stocks/list',
          component: () => import('@/views/admin/AdminStockListView.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('wt_token')
  const requiresAuth = to.matched.some((r) => r.meta.requiresAuth)
  const isPublic = to.matched.some((r) => r.meta.public)

  if (requiresAuth && !token) return '/login'
  if (isPublic && token) return '/dashboard'
  return true
})

export default router
