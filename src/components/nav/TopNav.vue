<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { navItems } from '@/config/navConfig'
import { iconMap } from './icons'
import LayoutToggle from '@/components/layout/LayoutToggle.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'
import UserMenu from '@/components/layout/UserMenu.vue'

const openGroup = ref<string | null>(null)

function toggleGroup(label: string) {
  openGroup.value = openGroup.value === label ? null : label
}

function closeGroup() {
  openGroup.value = null
}
</script>

<template>
  <header
    class="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-5"
  >
    <!-- Logo -->
    <div class="flex shrink-0 items-center gap-2">
      <div
        class="flex h-7 w-7 items-center justify-center rounded-full border border-gold/40 text-gold ring-1 ring-gold/10"
      >
        <span class="font-mono text-xs font-bold leading-none">₹</span>
      </div>
      <span class="text-sm font-semibold text-ink">Wealth Tracker</span>
    </div>

    <!-- Nav items -->
    <nav class="flex flex-1 items-center gap-0.5">
      <template v-for="item in navItems" :key="item.label">
        <!-- Group with dropdown -->
        <div v-if="item.children" class="relative">
          <button
            class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-dim transition-colors hover:bg-elevated hover:text-ink"
            :class="openGroup === item.label ? 'bg-elevated text-ink' : ''"
            @click="toggleGroup(item.label)"
          >
            <component :is="iconMap[item.icon]" :size="15" class="shrink-0" />
            {{ item.label }}
            <ChevronDown
              :size="12"
              class="transition-transform duration-150"
              :class="openGroup === item.label ? 'rotate-180' : ''"
            />
          </button>

          <!-- Dropdown flyout -->
          <div
            v-if="openGroup === item.label"
            class="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-border bg-surface shadow-xl"
          >
            <RouterLink
              v-for="child in item.children"
              :key="child.label"
              :to="child.to!"
              class="flex items-center gap-2 px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-elevated hover:text-ink first:rounded-t-xl last:rounded-b-xl"
              active-class="bg-elevated text-ink"
              @click="closeGroup"
            >
              <component :is="iconMap[child.icon]" :size="15" class="shrink-0" />
              {{ child.label }}
            </RouterLink>
          </div>
        </div>

        <!-- Leaf nav item -->
        <RouterLink
          v-else
          :to="item.to!"
          class="relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-ink-dim transition-colors hover:bg-elevated hover:text-ink"
          active-class="text-ink after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-gold after:shadow-[0_0_8px_rgba(201,162,39,0.35)] after:content-['']"
        >
          <component :is="iconMap[item.icon]" :size="15" class="shrink-0" />
          {{ item.label }}
        </RouterLink>
      </template>
    </nav>

    <!-- Right controls -->
    <div class="flex shrink-0 items-center gap-1">
      <LayoutToggle />
      <ThemeToggle />
      <div class="ml-1">
        <UserMenu />
      </div>
    </div>
  </header>
</template>
