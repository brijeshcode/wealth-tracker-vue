<script setup lang="ts">
import { Notivue, Notification, NotivueSwipe } from 'notivue'
import { useThemeStore } from '@/stores/useThemeStore'

useThemeStore()
</script>

<template>
  <RouterView />
  <Notivue v-slot="item">
    <NotivueSwipe :item="item">
      <Notification :item="item" />
    </NotivueSwipe>
  </Notivue>
</template>
