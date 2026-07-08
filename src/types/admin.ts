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
}
