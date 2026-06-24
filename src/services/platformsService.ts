import { get } from '@/services/axios'
import type { Platform } from '@/types/stocks'

class PlatformsService {
  async getPlatforms(): Promise<Platform[]> {
    const response = await get<Platform[]>('/platforms')
    return response.data.data!
  }
}

export const platformsService = new PlatformsService()
export default platformsService
