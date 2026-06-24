<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useLayoutStore } from '@/stores/useLayoutStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { navItems } from '@/config/navConfig'
import NavItem from './NavItem.vue'
import NavGroup from './NavGroup.vue'
import ThemeToggle from '@/components/layout/ThemeToggle.vue'

defineProps<{ collapsed: boolean }>()

const router = useRouter()
const layoutStore = useLayoutStore()
const auth = useAuthStore()

const userInitial = computed(() => auth.user?.name?.[0]?.toUpperCase() ?? '?')

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    class="flex h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 ease-in-out"
    :class="collapsed ? 'w-16' : 'w-60'"
  >
    <!-- Logo + collapse toggle -->
    <div
      class="flex h-14 shrink-0 items-center justify-between border-b border-border px-3"
      :class="collapsed ? 'justify-center' : ''"
    >
      <div class="flex min-w-0 items-center gap-2.5">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 text-gold ring-1 ring-gold/10"
        >
          <span class="font-mono text-sm font-bold leading-none">₹</span>
        </div>
        <span v-if="!collapsed" class="truncate text-sm font-semibold text-ink">
          Wealth Tracker
        </span>
      </div>
      <button
        v-if="!collapsed"
        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
        title="Collapse sidebar"
        @click="layoutStore.toggleSidebar"
      >
        <ChevronLeft :size="14" />
      </button>
    </div>

    <!-- Collapsed expand button -->
    <div v-if="collapsed" class="flex justify-center py-2">
      <button
        class="flex h-6 w-6 items-center justify-center rounded-md text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
        title="Expand sidebar"
        @click="layoutStore.toggleSidebar"
      >
        <ChevronRight :size="14" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex flex-1 flex-col gap-0.5 overflow-y-auto py-2">
      <template v-for="item in navItems" :key="item.label">
        <NavGroup v-if="item.children" :item="item" :collapsed="collapsed" />
        <NavItem v-else :item="item" :collapsed="collapsed" />
      </template>
    </nav>

    <!-- User strip -->
    <div class="shrink-0 border-t border-border p-2">
      <!-- Expanded: avatar + name/email + theme + logout -->
      <div v-if="!collapsed" class="flex items-center gap-2">
        <div
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium text-ink-dim"
          :title="auth.user?.name"
        >
          {{ userInitial }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-medium text-ink">{{ auth.user?.name }}</p>
          <p class="truncate text-xs text-ink-ghost">{{ auth.user?.email }}</p>
        </div>
        <ThemeToggle />
        <button
          class="flex h-7 w-7 items-center justify-center rounded-lg text-ink-ghost transition-colors hover:bg-elevated hover:text-loss"
          title="Sign out"
          @click="logout"
        >
          <LogOut :size="14" />
        </button>
      </div>

      <!-- Collapsed: stacked avatar + logout icon -->
      <div v-else class="flex flex-col items-center gap-1">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium text-ink-dim"
          :title="auth.user?.name"
        >
          {{ userInitial }}
        </div>
        <button
          class="flex h-7 w-7 items-center justify-center rounded-lg text-ink-ghost transition-colors hover:bg-elevated hover:text-loss"
          title="Sign out"
          @click="logout"
        >
          <LogOut :size="14" />
        </button>
      </div>
    </div>
  </aside>
</template>
