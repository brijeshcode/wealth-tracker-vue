<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import type { ImportRowError } from '@/types/stocks'

defineProps<{ errors: ImportRowError[] }>()
</script>

<template>
  <div v-if="errors.length" class="overflow-hidden rounded-xl border border-loss/40">
    <div class="flex items-center gap-2 border-b border-loss/40 bg-loss/10 px-4 py-3">
      <AlertCircle class="h-4 w-4 shrink-0 text-loss" />
      <p class="text-sm font-medium text-loss">
        {{ errors.length }} error{{ errors.length === 1 ? '' : 's' }} found — fix the file and
        upload again
      </p>
    </div>
    <table class="w-full text-sm">
      <thead>
        <tr
          class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost"
        >
          <th class="w-16 py-2.5 pl-4 pr-3">Row</th>
          <th class="w-40 py-2.5 px-3">Column</th>
          <th class="py-2.5 pl-3 pr-4">Error</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(e, i) in errors" :key="i" class="border-b border-border last:border-0">
          <td class="py-2.5 pl-4 pr-3 font-mono text-ink">{{ e.row }}</td>
          <td class="py-2.5 px-3 font-mono text-xs text-ink-dim">{{ e.column }}</td>
          <td class="py-2.5 pl-3 pr-4 text-ink-dim">{{ e.error }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
