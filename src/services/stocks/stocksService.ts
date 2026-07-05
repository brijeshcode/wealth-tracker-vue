import type { AxiosResponse } from 'axios'
import { get, post, put, del, type ApiResponse } from '@/services/axios'
import type {
  StockHolding,
  HoldingMetrics,
  StockLot,
  StockTransaction,
  TaxReport,
  StockMaster,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  UpdateHoldingPayload,
  ImportBroker,
  ImportPreviewData,
  ImportRow,
  ImportConfirmResult,
  ImportWarning,
} from '@/types/stocks'

class StocksService {
  // ── Stock master ────────────────────────────────────────────────────

  async searchStocks(q: string): Promise<StockMaster[]> {
    const response = await get<StockMaster[]>(`/stocks/search`, {
      params: { q },
      showLoading: false,
    })
    return response.data.data!
  }

  async getStock(id: number): Promise<StockMaster> {
    const response = await get<StockMaster>(`/stocks/${id}`)
    return response.data.data!
  }

  async getStockEvents(id: number): Promise<any[]> {
    const response = await get<any[]>(`/stocks/${id}/events`)
    return response.data.data!
  }

  // ── Holdings ────────────────────────────────────────────────────────

  async getHoldings(): Promise<StockHolding[]> {
    const response = await get<StockHolding[]>('/stock-holdings', {
      loadingMessage: 'Loading holdings...',
    })
    return response.data.data!
  }

  async getHolding(id: number): Promise<StockHolding> {
    const response = await get<StockHolding>(`/stock-holdings/${id}`)
    return response.data.data!
  }

  async updateHolding(id: number, data: UpdateHoldingPayload): Promise<StockHolding> {
    const response = await put<StockHolding>(`/stock-holdings/${id}`, data, {
      loadingMessage: 'Updating...',
      showSuccessNotification: true,
      successMessage: 'Holding updated',
    })
    return response.data.data!
  }

  async deleteHolding(id: number): Promise<void> {
    await del(`/stock-holdings/${id}`, {
      loadingMessage: 'Deleting...',
      showSuccessNotification: true,
      successMessage: 'Holding deleted',
    })
  }

  async getComputedMetrics(id: number): Promise<HoldingMetrics> {
    const response = await get<HoldingMetrics>(`/stock-holdings/${id}/computed`, {
      showLoading: false,
    })
    return response.data.data!
  }

  async getLots(id: number): Promise<StockLot[]> {
    const response = await get<StockLot[]>(`/stock-holdings/${id}/lots`)
    return response.data.data!
  }

  async getTax(id: number): Promise<TaxReport> {
    const response = await get<TaxReport>(`/stock-holdings/${id}/tax`)
    return response.data.data!
  }

  // ── Transactions ────────────────────────────────────────────────────

  async getTransactions(holdingId: number): Promise<StockTransaction[]> {
    const response = await get<StockTransaction[]>(`/stock-holdings/${holdingId}/transactions`)
    return response.data.data!
  }

  async createTransaction(data: CreateTransactionPayload): Promise<void> {
    await post('/stock-transactions', data, {
      loadingMessage: 'Saving transaction...',
      showSuccessNotification: true,
      successMessage: 'Transaction added',
    })
  }

  async updateTransaction(id: number, data: UpdateTransactionPayload): Promise<void> {
    await put(`/stock-transactions/${id}`, data, {
      loadingMessage: 'Updating transaction...',
      showSuccessNotification: true,
      successMessage: 'Transaction updated',
    })
  }

  async deleteTransaction(id: number): Promise<void> {
    await del(`/stock-transactions/${id}`, {
      loadingMessage: 'Deleting transaction...',
      showSuccessNotification: true,
      successMessage: 'Transaction deleted',
    })
  }

  // ── Import ──────────────────────────────────────────────────────────

  async importPreview(file: File, broker: ImportBroker): Promise<ImportPreviewData> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('broker', broker)
    const response = await post<ImportPreviewData>(
      '/stock-transactions/import/preview',
      formData,
      { loadingMessage: 'Analyzing file...' },
    )
    return response.data.data!
  }

  // Resolves on 200 and 409 (expected duplicate flow — avoids the global
  // error toast); rejects on 422. Caller inspects response.status.
  async importConfirm(
    rows: ImportRow[],
    ignoreWarnings: boolean,
  ): Promise<AxiosResponse<ApiResponse<ImportConfirmResult | { warnings: ImportWarning[] }>>> {
    return post(
      '/stock-transactions/import/confirm',
      { rows, ignore_warnings: ignoreWarnings },
      {
        loadingMessage: 'Importing...',
        validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
      },
    )
  }
}

export const stocksService = new StocksService()
export default stocksService
