import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn() },
}))

const holdingFixture = {
  id: 1, stock_id: 10, exchange: 'NSE', nickname: null, status: 'active',
  principal_amount: '100000.00', current_value: '120000.00', start_date: '2024-01-01', notes: null,
  stock: { id: 10, company_name: 'Infosys', nse_symbol: 'INFY', bse_symbol: null },
  platform: { id: 1, name: 'zerodha', display_name: 'Zerodha' },
}

const metricsFixture = {
  quantity: 100, avg_buy_price: 1000, total_invested: 100000,
  current_value: 120000, unrealised_pnl: 20000, return_pct: 20,
}

describe('useHoldingDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetchAll populates holding and metrics in parallel', async () => {
    const api = (await import('@/lib/axios')).default
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { data: holdingFixture } })
      .mockResolvedValueOnce({ data: { data: metricsFixture } })
    const { useHoldingDetail } = await import('@/composables/useHoldingDetail')
    const { holding, metrics, fetchAll, loading } = useHoldingDetail()
    await fetchAll(1)
    expect(holding.value?.id).toBe(1)
    expect(metrics.value?.quantity).toBe(100)
    expect(loading.value).toBe(false)
  })

  it('sets error on failure', async () => {
    const api = (await import('@/lib/axios')).default
    vi.mocked(api.get).mockRejectedValueOnce({ response: { data: { message: 'Not found' } } })
    const { useHoldingDetail } = await import('@/composables/useHoldingDetail')
    const { error, fetchAll } = useHoldingDetail()
    await fetchAll(99)
    expect(error.value).toBe('Not found')
  })
})
