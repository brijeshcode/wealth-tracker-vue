import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ''
    setActivePinia(createPinia())
  })

  it('defaults to dark when no saved preference', () => {
    const store = useThemeStore()
    expect(store.theme).toBe('dark')
  })

  it('applies dark class to <html> on init', () => {
    useThemeStore()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggle switches from dark to light', () => {
    const store = useThemeStore()
    store.toggle()
    expect(store.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggle switches from light to dark', () => {
    const store = useThemeStore()
    store.toggle() // dark → light
    store.toggle() // light → dark
    expect(store.theme).toBe('dark')
  })

  it('persists theme to localStorage', () => {
    const store = useThemeStore()
    store.toggle()
    expect(localStorage.getItem('wt_theme')).toBe('light')
  })

  it('restores theme from localStorage', () => {
    localStorage.setItem('wt_theme', 'light')
    const store = useThemeStore()
    expect(store.theme).toBe('light')
  })
})
