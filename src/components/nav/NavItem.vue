<script setup lang="ts">
import { iconMap } from './icons'
import type { NavItem } from '@/config/navConfig'

defineProps<{
  item: NavItem
  collapsed: boolean
}>()
</script>

<template>
  <RouterLink
    :to="item.to!"
    class="group relative mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-elevated hover:text-ink"
    active-class="bg-elevated text-ink before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-0.5 before:rounded-full before:bg-gold before:shadow-[0_0_8px_rgba(201,162,39,0.4)] before:content-['']"
    :title="collapsed ? item.label : undefined"
  >
    <component :is="iconMap[item.icon]" :size="18" class="shrink-0" />
    <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
  </RouterLink>
</template>
