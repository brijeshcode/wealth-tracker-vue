import { defineStore } from 'pinia'
import { ref } from 'vue'
import { platformsService } from '@/services/platformsService'
import type { Platform } from '@/types/stocks'

export const usePlatformsStore = defineStore('platforms', () => {
  const platforms = ref<Platform[]>([])
  const loading = ref(false)

  const fetchPlatforms = async () => {
    if (platforms.value.length > 0) return
    try {
      loading.value = true
      platforms.value = await platformsService.getPlatforms()
    } finally {
      loading.value = false
    }
  }

  return { platforms, loading, fetchPlatforms }
})

export default usePlatformsStore
