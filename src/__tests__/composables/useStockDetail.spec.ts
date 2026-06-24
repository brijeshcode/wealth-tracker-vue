import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { reactive } from 'vue'
import { useStockDetail } from '@/composables/useStockDetail'
import type { StockHolding, StockTransaction, StockLot, TaxReport } from '@/types/stocks'

const mockHolding = (
  id: number,
  stockId: number,
  platformName: string,
  exchange: 'NSE' | 'BSE',
  qty: number,
  avg: number,
): StockHolding => ({
  id,
  stock_id: stockId,
  exchange,
  quantity: qty,
  avg_buy_price: avg,
  holding: {
    id,
    nickname: null,
    notes: null,
    status: 'active',
    principal_amount: qty * avg,
    platform: { id: 1, name: 'zerodha', display_name: platformName },
  },
  stock: {
    id: stockId,
    company_name: 'Test Corp',
    nse_symbol: 'TEST',
    latest_price: { price: 200, price_date: '2026-06-24', change_percent: null },
  },
})

const mockTxn = (
  id: number,
  type: 'buy' | 'sell',
  date: string,
  qty: number,
  price: number,
): StockTransaction => ({
  id,
  type,
  quantity: qty,
  price_per_unit: price,
  amount: qty * price,
  transaction_date: date,
  source: 'manual',
  reference: null,
})

const mockLot = (
  id: number,
  buyDate: string,
  origQty: number,
  remaining: number,
  exhausted: boolean,
): StockLot => ({
  id,
  buy_date: buyDate,
  buy_price: 100,
  original_quantity: origQty,
  quantity_remaining: remaining,
  is_exhausted: exhausted,
  is_locked: false,
  locked_until: null,
})

const emptyTax: TaxReport = {
  stcg_gain: 0,
  stcg_tax: 0,
  ltcg_gain: 0,
  ltcg_exemption: 0,
  ltcg_taxable_gain: 0,
  ltcg_tax: 0,
  total_tax: 0,
  breakdown: [],
}

// Pinia stores expose refs as unwrapped arrays — use reactive() to match production behaviour
const mockStore = reactive({
  holdings: [] as StockHolding[],
  fetchHoldings: vi.fn().mockResolvedValue(undefined),
  fetchTransactions: vi.fn(),
  fetchLots: vi.fn(),
  fetchTax: vi.fn(),
})

vi.mock('@/stores/useStocksStore', () => ({
  useStocksStore: () => mockStore,
}))

describe('useStockDetail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.holdings = []
  })

  it('filters holdings by stockId', () => {
    mockStore.holdings = [
      mockHolding(1, 10, 'Zerodha', 'NSE', 5, 100),
      mockHolding(2, 99, 'Groww', 'BSE', 3, 200),
    ]
    const { holdings } = useStockDetail(10)
    expect(holdings.value).toHaveLength(1)
    expect(holdings.value[0].id).toBe(1)
  })

  it('computes totalQty and weightedAvg across holdings', () => {
    mockStore.holdings = [
      mockHolding(1, 10, 'Zerodha', 'NSE', 4, 100),
      mockHolding(2, 10, 'Groww', 'BSE', 6, 200),
    ]
    const { totalQty, weightedAvg } = useStockDetail(10)
    expect(totalQty.value).toBe(10)
    expect(weightedAvg.value).toBe((4 * 100 + 6 * 200) / 10) // 160
  })

  it('marks isLtcg true when earliest buy is >= 365 days ago', async () => {
    mockStore.holdings = [mockHolding(1, 10, 'Zerodha', 'NSE', 5, 100)]
    const oldDate = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    mockStore.fetchTransactions.mockResolvedValue([mockTxn(1, 'buy', oldDate, 5, 100)])
    mockStore.fetchLots.mockResolvedValue([])
    mockStore.fetchTax.mockResolvedValue(emptyTax)

    const { isLtcg, fetchAll } = useStockDetail(10)
    await fetchAll()
    expect(isLtcg.value).toBe(true)
  })

  it('marks isLtcg false when earliest buy is < 365 days ago', async () => {
    mockStore.holdings = [mockHolding(1, 10, 'Zerodha', 'NSE', 5, 100)]
    const recentDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    mockStore.fetchTransactions.mockResolvedValue([mockTxn(1, 'buy', recentDate, 5, 100)])
    mockStore.fetchLots.mockResolvedValue([])
    mockStore.fetchTax.mockResolvedValue(emptyTax)

    const { isLtcg, fetchAll } = useStockDetail(10)
    await fetchAll()
    expect(isLtcg.value).toBe(false)
  })

  it('merges transactions sorted newest first and annotates platform', async () => {
    mockStore.holdings = [
      mockHolding(1, 10, 'Zerodha', 'NSE', 5, 100),
      mockHolding(2, 10, 'Groww', 'BSE', 3, 150),
    ]
    mockStore.fetchTransactions.mockImplementation((id: number) =>
      Promise.resolve(
        id === 1
          ? [mockTxn(10, 'buy', '2025-01-01', 5, 100)]
          : [mockTxn(20, 'buy', '2026-01-01', 3, 150)],
      ),
    )
    mockStore.fetchLots.mockResolvedValue([])
    mockStore.fetchTax.mockResolvedValue(emptyTax)

    const { mergedTransactions, fetchAll } = useStockDetail(10)
    await fetchAll()

    expect(mergedTransactions.value).toHaveLength(2)
    expect(mergedTransactions.value[0].transaction_date).toBe('2026-01-01')
    expect(mergedTransactions.value[0].platform_name).toBe('Groww')
    expect(mergedTransactions.value[1].platform_name).toBe('Zerodha')
  })

  it('merges lots sorted oldest first and annotates platform', async () => {
    mockStore.holdings = [
      mockHolding(1, 10, 'Zerodha', 'NSE', 5, 100),
      mockHolding(2, 10, 'Groww', 'BSE', 3, 150),
    ]
    mockStore.fetchTransactions.mockResolvedValue([])
    mockStore.fetchLots.mockImplementation((id: number) =>
      Promise.resolve(
        id === 1
          ? [mockLot(1, '2026-01-01', 5, 5, false)]
          : [mockLot(2, '2024-01-01', 3, 0, true)],
      ),
    )
    mockStore.fetchTax.mockResolvedValue(emptyTax)

    const { mergedLots, fetchAll } = useStockDetail(10)
    await fetchAll()

    expect(mergedLots.value).toHaveLength(2)
    expect(mergedLots.value[0].buy_date).toBe('2024-01-01') // oldest first
    expect(mergedLots.value[0].platform_name).toBe('Groww')
  })

  it('sums tax reports across holdings', async () => {
    mockStore.holdings = [
      mockHolding(1, 10, 'Zerodha', 'NSE', 5, 100),
      mockHolding(2, 10, 'Groww', 'BSE', 3, 150),
    ]
    mockStore.fetchTransactions.mockResolvedValue([])
    mockStore.fetchLots.mockResolvedValue([])
    mockStore.fetchTax.mockResolvedValue({
      ...emptyTax,
      stcg_gain: 500,
      stcg_tax: 75,
      total_tax: 75,
    })

    const { mergedTax, fetchAll } = useStockDetail(10)
    await fetchAll()

    expect(mergedTax.value?.stcg_gain).toBe(1000)
    expect(mergedTax.value?.total_tax).toBe(150)
  })

  it('calls fetchHoldings if holdings list is empty on fetchAll', async () => {
    mockStore.holdings = []
    mockStore.fetchHoldings.mockResolvedValue(undefined)

    const { fetchAll } = useStockDetail(10)
    await fetchAll()

    expect(mockStore.fetchHoldings).toHaveBeenCalledTimes(1)
  })
})
