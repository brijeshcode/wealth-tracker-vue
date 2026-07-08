import type { AxiosResponse } from 'axios'
import { get, post, type ApiResponse } from '@/services/axios'
import type { AdminUser, NseImportResult, StockUpsertPayload, StockMasterRecord } from '@/types/admin'

class AdminService {
  checkAccess(): Promise<AxiosResponse<ApiResponse<AdminUser>>> {
    return get<AdminUser>('/admin/me', {
      validateStatus: (s) => s === 200 || s === 403,
    })
  }

  async importNse(file: File): Promise<NseImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await post<NseImportResult>('/admin/stocks/import-nse', formData, {
      loadingMessage: 'Importing stocks…',
    })
    return response.data.data!
  }

  async upsertStock(data: StockUpsertPayload): Promise<{ stock: StockMasterRecord; created: boolean }> {
    const response = await post<StockMasterRecord>('/admin/stocks/upsert', data, {
      validateStatus: (s) => s === 200 || s === 201,
    })
    return {
      stock: response.data.data!,
      created: response.status === 201,
    }
  }
}

export const adminService = new AdminService()
export default adminService
