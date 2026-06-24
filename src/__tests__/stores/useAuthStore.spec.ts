import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/lib/axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts unauthenticated when no saved token', async () => {
    const { useAuthStore } = await import('@/stores/useAuthStore')
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.user).toBeNull()
  })

  it('restores session from localStorage', async () => {
    localStorage.setItem('wt_token', 'abc123')
    localStorage.setItem('wt_user', JSON.stringify({ id: 1, name: 'Brijesh', email: 'b@b.com' }))
    const { useAuthStore } = await import('@/stores/useAuthStore')
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(true)
    expect(store.user?.name).toBe('Brijesh')
  })

  it('login stores token and user', async () => {
    const api = (await import('@/lib/axios')).default
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { data: { token: 'tok', user: { id: 1, name: 'Test', email: 't@t.com' } } },
    })
    const { useAuthStore } = await import('@/stores/useAuthStore')
    const store = useAuthStore()
    await store.login('t@t.com', 'pass')
    expect(store.isAuthenticated).toBe(true)
    expect(store.token).toBe('tok')
    expect(localStorage.getItem('wt_token')).toBe('tok')
  })

  it('logout clears token and user', async () => {
    localStorage.setItem('wt_token', 'tok')
    localStorage.setItem('wt_user', JSON.stringify({ id: 1, name: 'Test', email: 't@t.com' }))
    const api = (await import('@/lib/axios')).default
    vi.mocked(api.post).mockResolvedValueOnce({})
    const { useAuthStore } = await import('@/stores/useAuthStore')
    const store = useAuthStore()
    await store.logout()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem('wt_token')).toBeNull()
  })
})
