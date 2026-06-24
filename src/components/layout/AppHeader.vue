<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LayoutToggle from './LayoutToggle.vue'
import ThemeToggle from './ThemeToggle.vue'
import UserMenu from './UserMenu.vue'

const route = useRoute()

const breadcrumb = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  if (!parts.length) return 'Dashboard'
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ')
})
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-5"
  >
    <span class="text-sm text-ink-dim">{{ breadcrumb }}</span>

    <div class="flex items-center gap-1">
      <LayoutToggle />
      <ThemeToggle />
      <div class="ml-1">
        <UserMenu />
      </div>
    </div>
  </header>
</template>
