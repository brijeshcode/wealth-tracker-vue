<script setup lang="ts">
import { useLayoutStore } from '@/stores/useLayoutStore'
import { LayoutPanelLeft, LayoutPanelTop } from 'lucide-vue-next'

const layout = useLayoutStore()
</script>

<template>
  <button
    class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
    :title="layout.layout === 'sidebar' ? 'Switch to top navigation' : 'Switch to sidebar navigation'"
    @click="layout.toggleLayout"
  >
    <component
      :is="layout.layout === 'sidebar' ? LayoutPanelTop : LayoutPanelLeft"
      :size="16"
    />
  </button>
</template>
