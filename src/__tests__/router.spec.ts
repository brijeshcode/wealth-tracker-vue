import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('router auth guard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('redirects unauthenticated user from /dashboard to /login', async () => {
    const { default: router } = await import('@/router')
    await router.push('/dashboard')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('allows unauthenticated access to /login', async () => {
    const { default: router } = await import('@/router')
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/login')
  })

  it('redirects authenticated user from /login to /dashboard', async () => {
    localStorage.setItem('wt_token', 'valid-token')
    const { default: router } = await import('@/router')
    await router.push('/login')
    expect(router.currentRoute.value.path).toBe('/dashboard')
  })
})

describe('admin routes', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('redirects /admin to /admin/stocks/import-nse', async () => {
    localStorage.setItem('wt_token', 'admin-token')
    const { default: router } = await import('@/router')
    await router.push('/admin')
    expect(router.currentRoute.value.path).toBe('/admin/stocks/import-nse')
  })

  it('resolves /admin/stocks/import-nse when authenticated', async () => {
    localStorage.setItem('wt_token', 'admin-token')
    const { default: router } = await import('@/router')
    await router.push('/admin/stocks/import-nse')
    expect(router.currentRoute.value.path).toBe('/admin/stocks/import-nse')
  })

  it('redirects /admin/stocks/import-nse to /login when no token', async () => {
    const { default: router } = await import('@/router')
    await router.push('/admin/stocks/import-nse')
    expect(router.currentRoute.value.path).toBe('/login')
  })
})
