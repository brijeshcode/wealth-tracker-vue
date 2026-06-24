<script setup lang="ts">
import { useThemeStore } from '@/stores/useThemeStore'
import { Sun, Moon } from 'lucide-vue-next'

const theme = useThemeStore()
</script>

<template>
  <button
    class="flex h-8 w-8 items-center justify-center rounded-lg text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
    :title="theme.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
    @click="theme.toggle"
  >
    <component :is="theme.theme === 'dark' ? Sun : Moon" :size="16" />
  </button>
</template>
