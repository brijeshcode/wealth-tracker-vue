<script setup lang="ts">
defineProps<{ padding?: boolean }>()
</script>

<template>
  <div
    class="rounded-xl border border-border bg-surface"
    :class="padding !== false ? 'p-5' : ''"
  >
    <slot />
  </div>
</template>
