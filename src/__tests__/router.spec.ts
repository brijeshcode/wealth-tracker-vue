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
