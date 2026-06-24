import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlatformsStore } from '../usePlatformsStore'
import { platformsService } from '@/services/platformsService'
import type { Platform } from '@/types/stocks'

vi.mock('@/services/platformsService', () => ({
  platformsService: {
    getPlatforms: vi.fn(),
  },
}))

const mockPlatforms: Platform[] = [
  { id: 1, name: 'zerodha', display_name: 'Zerodha' },
  { id: 2, name: 'groww', display_name: 'Groww' },
]

describe('usePlatformsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts with empty platforms', () => {
    const store = usePlatformsStore()
    expect(store.platforms).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('fetches and stores platforms', async () => {
    vi.mocked(platformsService.getPlatforms).mockResolvedValue(mockPlatforms)
    const store = usePlatformsStore()
    await store.fetchPlatforms()
    expect(store.platforms).toEqual(mockPlatforms)
    expect(store.loading).toBe(false)
  })

  it('skips network call if platforms already loaded', async () => {
    vi.mocked(platformsService.getPlatforms).mockResolvedValue(mockPlatforms)
    const store = usePlatformsStore()
    await store.fetchPlatforms()
    await store.fetchPlatforms()
    expect(platformsService.getPlatforms).toHaveBeenCalledTimes(1)
  })
})
