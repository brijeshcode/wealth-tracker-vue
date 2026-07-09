export type Exchange = 'NSE' | 'BSE'
export type TransactionType = 'buy' | 'sell' | 'dividend' | 'bonus' | 'split'
export type TransactionSource = 'manual' | 'csv_import' | 'api_sync'

export interface StockMaster {
  id: number
  isin: string
  company_name: string
  nse_symbol: string | null
  bse_symbol: string | null
  bse_code: string | null
  sector: string | null
}

export interface Platform {
  id: number
  name: string
  display_name: string
}

export interface StockValuation {
  current_price: number
  price_date: string
  current_value: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
}

export interface StockHolding {
  id: number
  stock_id: number
  exchange: Exchange
  quantity: number
  avg_buy_price: number
  cost_basis: number
  valuation: StockValuation | null
  holding: {
    id: number
    nickname: string | null
    notes: string | null
    status: string
    principal_amount: number
    platform: Platform
  }
  stock: {
    id: number
    company_name: string
    nse_symbol: string | null
    isin: string
  }
}

export interface HoldingMetrics {
  quantity: number
  avg_buy_price: number
  cost_basis: number
  current_price: number | null
  price_date: string | null
  current_value: number | null
  unrealized_pnl: number | null
  unrealized_pnl_pct: number | null
}

export interface StockLot {
  id: number
  buy_date: string
  buy_price: number
  original_quantity: number
  quantity_remaining: number
  is_exhausted: boolean
  is_locked: boolean
  locked_until: string | null
}

export interface StockTransaction {
  id: number
  type: TransactionType
  quantity: number | null
  price_per_unit: number | null
  amount: number
  transaction_date: string
  source: TransactionSource
  reference: string | null
}

export interface TaxBreakdownItem {
  lot_id: number
  buy_date: string
  sell_date: string
  holding_months: number
  quantity: number
  buy_price: number
  sell_price: number
  gain: number
  type: 'STCG' | 'LTCG'
}

export interface TaxReport {
  stcg_gain: number
  stcg_tax: number
  ltcg_gain: number
  ltcg_exemption: number
  ltcg_taxable_gain: number
  ltcg_tax: number
  total_tax: number
  breakdown: TaxBreakdownItem[]
}

export interface CreateTransactionPayload {
  stock_id: number
  platform_id: number
  exchange: Exchange
  type: TransactionType
  quantity?: number
  price_per_unit?: number
  transaction_date: string
  source?: TransactionSource
  reference?: string | null
  nickname?: string | null
  notes?: string | null
}

export interface UpdateTransactionPayload {
  quantity?: number | null
  price_per_unit?: number | null
  transaction_date?: string | null
  reference?: string | null
}

export interface UpdateHoldingPayload {
  nickname?: string | null
  notes?: string | null
}

// ── Import ──────────────────────────────────────────────────────────

export type ImportBroker = 'standard' | 'zerodha' | 'groww' | 'upstox'

export interface ImportRow {
  transaction_date: string // "YYYY-MM-DD HH:mm:ss"
  symbol: string
  exchange: Exchange
  type: TransactionType
  quantity: number | null // null for non-buy/sell types
  price_per_unit: number | null // null for non-buy/sell types
  platform: string
  reference: string | null
  nickname: string | null
  notes: string | null
}

export interface ImportRowError {
  row: number
  column: string
  error: string
}

export interface ImportWarning {
  row: number
  message: string
}

export interface ImportSummary {
  total: number
  buy: number
  sell: number
}

export interface ImportPreviewData {
  summary: ImportSummary
  warnings: ImportWarning[]
  rows: ImportRow[]
}

export interface ImportConfirmResult {
  imported: number
  holdings_synced: number
}
