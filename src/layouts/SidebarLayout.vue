<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore } from '@/stores/useLayoutStore'
import SidebarNav from '@/components/nav/SidebarNav.vue'
import AppHeader from '@/components/layout/AppHeader.vue'

const layoutStore = useLayoutStore()
const collapsed = computed(() => layoutStore.sidebarCollapsed)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-page">
    <SidebarNav :collapsed="collapsed" />

    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />
      <main class="flex-1 overflow-y-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
