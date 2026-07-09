import type { AxiosResponse } from 'axios'
import { get, post, put, patch, type ApiResponse } from '@/services/axios'
import type {
  AdminUser,
  NseImportResult,
  StockUpsertPayload,
  StockMasterRecord,
  AdminStockListParams,
  AdminStockListResult,
  AdminStockUpdatePayload,
  PriceSyncResult,
  BackfillResult,
  SyncLog,
  SyncLogParams,
} from '@/types/admin'

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

  async listStocks(params: AdminStockListParams): Promise<AdminStockListResult> {
    const response = await get('/admin/stocks', { params })
    const raw = response.data as any
    const meta = raw.meta ?? raw.pagination ?? {
      current_page: 1,
      last_page: 1,
      total: Array.isArray(raw.data) ? raw.data.length : 0,
    }
    return { stocks: raw.data ?? [], meta }
  }

  async updateStock(id: number, data: AdminStockUpdatePayload): Promise<StockMasterRecord> {
    const response = await put<StockMasterRecord>(`/admin/stocks/${id}`, data)
    return response.data.data!
  }

  async toggleStockActive(id: number): Promise<StockMasterRecord> {
    const response = await patch<StockMasterRecord>(`/admin/stocks/${id}/toggle-active`)
    return response.data.data!
  }

  async syncPrices(date?: string): Promise<PriceSyncResult> {
    const response = await post<PriceSyncResult>(
      '/admin/stocks/sync-prices',
      undefined,
      { params: date ? { date } : undefined },
    )
    return response.data.data!
  }

  async backfillPrices(from: string, to: string): Promise<BackfillResult> {
    const response = await post<BackfillResult>('/admin/stocks/sync-prices/backfill', { from, to })
    return response.data.data!
  }

  async getSyncLogs(params: SyncLogParams): Promise<{ logs: SyncLog[]; pagination: NonNullable<import('@/services/axios').ApiResponse['pagination']> }> {
    const response = await get<SyncLog[]>('/admin/stocks/sync-logs', { params })
    return {
      logs: response.data.data ?? [],
      pagination: response.data.pagination!,
    }
  }
}

export const adminService = new AdminService()
export default adminService
