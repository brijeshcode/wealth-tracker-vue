<script setup lang="ts">
import { computed } from 'vue'
import { useLayoutStore } from '@/stores/useLayoutStore'
import SidebarLayout from './SidebarLayout.vue'
import TopNavLayout from './TopNavLayout.vue'

const layoutStore = useLayoutStore()
const CurrentLayout = computed(() =>
  layoutStore.layout === 'sidebar' ? SidebarLayout : TopNavLayout,
)
</script>

<template>
  <component :is="CurrentLayout" />
</template>
