import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@/lib/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const txn = { id: 1, investment_id: 5, type: 'buy', units: 50, price_per_unit: 1000, amount: 50000, transaction_date: '2024-01-15' }

describe('useTransactions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetch populates transactions', async () => {
    const api = (await import('@/lib/axios')).default
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [txn] } })
    const { useTransactions } = await import('@/composables/useTransactions')
    const { transactions, fetch } = useTransactions()
    await fetch(5)
    expect(transactions.value).toHaveLength(1)
    expect(transactions.value[0].id).toBe(1)
  })

  it('add calls POST with payload', async () => {
    const api = (await import('@/lib/axios')).default
    vi.mocked(api.post).mockResolvedValueOnce({})
    const { useTransactions } = await import('@/composables/useTransactions')
    const { add } = useTransactions()
    await add(5, { type: 'buy', units: 10, price_per_unit: 1500, transaction_date: '2024-03-01' })
    expect(api.post).toHaveBeenCalledWith('/investments/5/transactions', {
      type: 'buy', units: 10, price_per_unit: 1500, transaction_date: '2024-03-01',
    })
  })

  it('remove calls DELETE', async () => {
    const api = (await import('@/lib/axios')).default
    vi.mocked(api.delete).mockResolvedValueOnce({})
    const { useTransactions } = await import('@/composables/useTransactions')
    const { remove } = useTransactions()
    await remove(5, 1)
    expect(api.delete).toHaveBeenCalledWith('/investments/5/transactions/1')
  })
})
