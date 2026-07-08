<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  currentPage: number
  lastPage: number
  total: number
}>()

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

const pages = computed(() => {
  const range: (number | '...')[] = []
  const { currentPage, lastPage } = props

  if (lastPage <= 7) {
    for (let i = 1; i <= lastPage; i++) range.push(i)
    return range
  }

  range.push(1)
  if (currentPage > 3) range.push('...')
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(lastPage - 1, currentPage + 1); i++) {
    range.push(i)
  }
  if (currentPage < lastPage - 2) range.push('...')
  range.push(lastPage)

  return range
})
</script>

<template>
  <div class="flex items-center justify-between text-sm">
    <p class="text-ink-dim">
      {{ total.toLocaleString() }} stocks &mdash; page {{ currentPage }} of {{ lastPage }}
    </p>
    <div class="flex items-center gap-1">
      <button
        class="cursor-pointer rounded px-2 py-1 text-ink-dim transition-colors hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="currentPage === 1"
        @click="emit('page-change', currentPage - 1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>

      <template v-for="p in pages" :key="p">
        <span v-if="p === '...'" class="px-1 text-ink-ghost">…</span>
        <button
          v-else
          class="min-w-8 rounded px-2 py-1 transition-colors"
          :class="
            p === currentPage
              ? 'bg-gold text-ink-inv font-medium'
              : 'text-ink-dim hover:bg-elevated hover:text-ink'
          "
          @click="emit('page-change', p)"
        >
          {{ p }}
        </button>
      </template>

      <button
        class="cursor-pointer rounded px-2 py-1 text-ink-dim transition-colors hover:bg-elevated hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="currentPage === lastPage"
        @click="emit('page-change', currentPage + 1)"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
