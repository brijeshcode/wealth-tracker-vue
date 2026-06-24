<script setup lang="ts">
import TopNav from '@/components/nav/TopNav.vue'
</script>

<template>
  <div class="flex h-screen flex-col overflow-hidden bg-page">
    <TopNav />
    <main class="flex-1 overflow-y-auto p-6">
      <RouterView />
    </main>
  </div>
</template>
