<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { LogOut } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const auth = useAuthStore()

const open = ref(false)
const userInitial = computed(() => auth.user?.name?.[0]?.toUpperCase() ?? '?')

async function logout() {
  open.value = false
  await auth.logout()
  router.push('/login')
}

function toggle() {
  open.value = !open.value
}

function close() {
  // Small delay so click on menu items registers before the blur closes the menu
  setTimeout(() => { open.value = false }, 150)
}
</script>

<template>
  <div class="relative">
    <button
      class="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-elevated text-xs font-medium text-ink-dim transition-colors hover:border-gold hover:text-ink"
      :title="auth.user?.name"
      @click="toggle"
      @blur="close"
    >
      {{ userInitial }}
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-surface shadow-xl"
    >
      <!-- User info -->
      <div class="border-b border-border px-4 py-3">
        <p class="truncate text-sm font-medium text-ink">{{ auth.user?.name }}</p>
        <p class="truncate text-xs text-ink-ghost">{{ auth.user?.email }}</p>
      </div>

      <!-- Actions -->
      <div class="p-1">
        <button
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-loss transition-colors hover:bg-elevated"
          @click="logout"
        >
          <LogOut :size="14" />
          Sign out
        </button>
      </div>
    </div>
  </div>
</template>
