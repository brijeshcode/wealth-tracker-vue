import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useLayoutStore = defineStore('layout', () => {
  const saved = localStorage.getItem('wt_layout') as 'sidebar' | 'topnav' | null
  const layout = ref<'sidebar' | 'topnav'>(saved ?? 'sidebar')
  const sidebarCollapsed = ref(false)

  watch(layout, (v) => localStorage.setItem('wt_layout', v), { flush: 'sync' })

  function toggleLayout() {
    layout.value = layout.value === 'sidebar' ? 'topnav' : 'sidebar'
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { layout, sidebarCollapsed, toggleLayout, toggleSidebar }
})
