import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('wt_theme') as 'dark' | 'light' | null
  const initial: 'dark' | 'light' = saved ?? 'dark'

  const theme = ref<'dark' | 'light'>(initial)

  // Apply on init synchronously
  document.documentElement.classList.toggle('dark', theme.value === 'dark')

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('wt_theme', theme.value)
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
  }

  return { theme, toggle }
})
