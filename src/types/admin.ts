export interface AdminUser {
  id: number
  name: string
  email: string
}

export interface NseImportResult {
  inserted: number
  updated: number
  skipped: number
}

export interface StockUpsertPayload {
  isin: string
  company_name: string
  nse_symbol?: string
  bse_symbol?: string
  bse_code?: string
  sector?: string
  industry?: string
  is_active?: boolean
}

export interface StockMasterRecord {
  id: number
  isin: string
  company_name: string
  nse_symbol: string | null
  bse_symbol: string | null
  bse_code: string | null
  sector: string | null
  industry: string | null
  is_active: boolean
  holder_count: number
  total_shares: string
}

export interface AdminStockMeta {
  current_page: number
  last_page: number
  total: number
}

export interface AdminStockListResult {
  stocks: StockMasterRecord[]
  meta: AdminStockMeta
}

export interface AdminStockListParams {
  q?: string
  status?: 'active' | 'inactive'
  has_holders?: boolean
  page_size?: number
  page?: number
}

export interface AdminStockUpdatePayload {
  company_name?: string
  nse_symbol?: string
  bse_symbol?: string
  bse_code?: string
  sector?: string
  industry?: string
  is_active?: boolean
}
