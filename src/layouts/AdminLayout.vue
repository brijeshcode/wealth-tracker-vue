<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { Lock, Loader2, UploadCloud, PenLine, LayoutDashboard, List } from 'lucide-vue-next'
import { adminService } from '@/services/adminService'

type AccessState = 'checking' | 'granted' | 'denied'
const accessState = ref<AccessState>('checking')

onMounted(async () => {
  const response = await adminService.checkAccess()
  accessState.value = response.status === 200 ? 'granted' : 'denied'
})
</script>

<template>
  <!-- Checking -->
  <div
    v-if="accessState === 'checking'"
    class="flex h-screen items-center justify-center bg-page"
  >
    <div class="flex flex-col items-center gap-3 text-ink-dim">
      <Loader2 class="h-8 w-8 animate-spin" />
      <p class="text-sm">Verifying admin access…</p>
    </div>
  </div>

  <!-- Denied -->
  <div
    v-else-if="accessState === 'denied'"
    class="flex h-screen items-center justify-center bg-page"
  >
    <div class="flex flex-col items-center gap-4 text-center">
      <div class="rounded-full border border-loss/30 bg-loss/10 p-4">
        <Lock class="h-8 w-8 text-loss" />
      </div>
      <div>
        <h1 class="text-lg font-semibold text-ink">Admin Access Required</h1>
        <p class="mt-1 text-sm text-ink-dim">Your account does not have admin privileges.</p>
      </div>
      <RouterLink
        to="/dashboard"
        class="mt-2 inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
      >
        <LayoutDashboard class="h-4 w-4" />
        Back to app
      </RouterLink>
    </div>
  </div>

  <!-- Granted -->
  <div v-else class="flex h-screen overflow-hidden bg-page">
    <!-- Sidebar -->
    <aside class="flex w-52 shrink-0 flex-col border-r border-border bg-surface">
      <div class="px-5 py-4">
        <p class="text-xs font-semibold uppercase tracking-widest text-ink-ghost">Admin</p>
      </div>
      <nav class="flex flex-1 flex-col gap-1 px-3">
        <RouterLink
          to="/admin/stocks/import-nse"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-elevated hover:text-ink"
          active-class="bg-elevated text-ink font-medium"
        >
          <UploadCloud class="h-4 w-4 shrink-0" />
          NSE Import
        </RouterLink>
        <RouterLink
          to="/admin/stocks/upsert"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-elevated hover:text-ink"
          active-class="bg-elevated text-ink font-medium"
        >
          <PenLine class="h-4 w-4 shrink-0" />
          Add / Edit Stock
        </RouterLink>
        <RouterLink
          to="/admin/stocks/list"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-dim transition-colors hover:bg-elevated hover:text-ink"
          active-class="bg-elevated text-ink font-medium"
        >
          <List class="h-4 w-4 shrink-0" />
          Stock List
        </RouterLink>
      </nav>
      <div class="border-t border-border px-3 py-3">
        <RouterLink
          to="/dashboard"
          class="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
        >
          <LayoutDashboard class="h-4 w-4 shrink-0" />
          Back to app
        </RouterLink>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
