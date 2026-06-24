<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import { iconMap } from './icons'
import NavItem from './NavItem.vue'
import type { NavItem as NavItemType } from '@/config/navConfig'

const props = defineProps<{
  item: NavItemType
  collapsed: boolean
}>()

const route = useRoute()

const isChildActive = computed(() =>
  props.item.children?.some((c) => c.to && route.path.startsWith(c.to)) ?? false,
)

const open = ref(isChildActive.value)
</script>

<template>
  <!-- Collapsed sidebar: show child icons directly (no group heading) -->
  <div v-if="collapsed" class="mx-2 flex flex-col gap-0.5">
    <NavItem
      v-for="child in item.children"
      :key="child.label"
      :item="child"
      :collapsed="true"
    />
  </div>

  <!-- Expanded sidebar: collapsible group with chevron -->
  <div v-else class="mx-2">
    <button
      class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-elevated"
      :class="isChildActive ? 'text-ink' : 'text-ink-dim'"
      @click="open = !open"
    >
      <component :is="iconMap[item.icon]" :size="18" class="shrink-0" />
      <span class="flex-1 truncate text-left">{{ item.label }}</span>
      <ChevronDown
        :size="14"
        class="transition-transform duration-150"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <div
      v-if="open"
      class="ml-4 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2"
    >
      <NavItem
        v-for="child in item.children"
        :key="child.label"
        :item="child"
        :collapsed="false"
      />
    </div>
  </div>
</template>
