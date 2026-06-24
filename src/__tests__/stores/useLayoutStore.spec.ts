import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLayoutStore } from '@/stores/useLayoutStore'

describe('useLayoutStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults to sidebar layout', () => {
    const store = useLayoutStore()
    expect(store.layout).toBe('sidebar')
  })

  it('defaults to expanded sidebar', () => {
    const store = useLayoutStore()
    expect(store.sidebarCollapsed).toBe(false)
  })

  it('toggleLayout switches sidebar to topnav', () => {
    const store = useLayoutStore()
    store.toggleLayout()
    expect(store.layout).toBe('topnav')
  })

  it('toggleLayout switches topnav back to sidebar', () => {
    const store = useLayoutStore()
    store.toggleLayout()
    store.toggleLayout()
    expect(store.layout).toBe('sidebar')
  })

  it('toggleSidebar collapses the sidebar', () => {
    const store = useLayoutStore()
    store.toggleSidebar()
    expect(store.sidebarCollapsed).toBe(true)
  })

  it('persists layout to localStorage', () => {
    const store = useLayoutStore()
    store.toggleLayout()
    expect(localStorage.getItem('wt_layout')).toBe('topnav')
  })

  it('restores layout from localStorage', () => {
    localStorage.setItem('wt_layout', 'topnav')
    const store = useLayoutStore()
    expect(store.layout).toBe('topnav')
  })
})
