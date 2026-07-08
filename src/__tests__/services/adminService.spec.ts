import { describe, it, expect, vi, beforeEach } from 'vitest'
import { adminService } from '@/services/adminService'
import * as axiosHelpers from '@/services/axios'
import type { StockUpsertPayload } from '@/types/admin'

vi.mock('@/services/axios', () => ({
  get: vi.fn(),
  post: vi.fn(),
}))

const mockGet = vi.mocked(axiosHelpers.get)
const mockPost = vi.mocked(axiosHelpers.post)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('checkAccess', () => {
  it('resolves on 200 and returns the response', async () => {
    const response = { status: 200, data: { data: { id: 1, name: 'Brijesh', email: 'b@example.com' } } }
    mockGet.mockResolvedValue(response as never)

    const result = await adminService.checkAccess()

    expect(mockGet).toHaveBeenCalledWith('/admin/me', {
      validateStatus: expect.any(Function),
    })
    expect(result.status).toBe(200)
  })

  it('resolves on 403 without throwing', async () => {
    const response = { status: 403, data: { message: 'Admin access required.' } }
    mockGet.mockResolvedValue(response as never)

    const result = await adminService.checkAccess()
    expect(result.status).toBe(403)
  })

  it('passes validateStatus that allows 200 and 403', async () => {
    mockGet.mockResolvedValue({ status: 200, data: {} } as never)
    await adminService.checkAccess()

    const config = mockGet.mock.calls[0][1] as { validateStatus: (s: number) => boolean }
    expect(config.validateStatus(200)).toBe(true)
    expect(config.validateStatus(403)).toBe(true)
    expect(config.validateStatus(500)).toBe(false)
  })
})

describe('importNse', () => {
  it('posts multipart/form-data and returns NseImportResult', async () => {
    const result = { inserted: 2037, updated: 20, skipped: 325 }
    mockPost.mockResolvedValue({ data: { data: result } } as never)

    const file = new File(['a,b'], 'EQUITY_L.csv', { type: 'text/csv' })
    const data = await adminService.importNse(file)

    expect(mockPost).toHaveBeenCalledWith(
      '/admin/stocks/import-nse',
      expect.any(FormData),
      expect.objectContaining({ loadingMessage: expect.any(String) }),
    )
    const formData = mockPost.mock.calls[0][1] as FormData
    expect(formData.get('file')).toBe(file)
    expect(data).toEqual(result)
  })
})

describe('upsertStock', () => {
  const payload: StockUpsertPayload = {
    isin: 'INF204KB14I2',
    company_name: 'Nippon India ETF Nifty 50 BeES',
    nse_symbol: 'NIFTYBEES',
    sector: 'ETF',
    industry: 'Index ETF',
  }
  const stockRecord = {
    id: 2058,
    isin: 'INF204KB14I2',
    company_name: 'Nippon India ETF Nifty 50 BeES',
    nse_symbol: 'NIFTYBEES',
    bse_symbol: null,
    bse_code: null,
    sector: 'ETF',
    industry: 'Index ETF',
    is_active: true,
  }

  it('returns created: true on 201', async () => {
    mockPost.mockResolvedValue({ status: 201, data: { data: stockRecord } } as never)

    const result = await adminService.upsertStock(payload)
    expect(result.created).toBe(true)
    expect(result.stock).toEqual(stockRecord)
  })

  it('returns created: false on 200', async () => {
    mockPost.mockResolvedValue({ status: 200, data: { data: stockRecord } } as never)

    const result = await adminService.upsertStock(payload)
    expect(result.created).toBe(false)
    expect(result.stock).toEqual(stockRecord)
  })

  it('posts to /admin/stocks/upsert with the payload', async () => {
    mockPost.mockResolvedValue({ status: 201, data: { data: stockRecord } } as never)
    await adminService.upsertStock(payload)

    expect(mockPost).toHaveBeenCalledWith(
      '/admin/stocks/upsert',
      payload,
      expect.objectContaining({ validateStatus: expect.any(Function) }),
    )
  })

  it('passes validateStatus that allows 200 and 201', async () => {
    mockPost.mockResolvedValue({ status: 200, data: { data: stockRecord } } as never)
    await adminService.upsertStock(payload)

    const config = mockPost.mock.calls[0][2] as { validateStatus: (s: number) => boolean }
    expect(config.validateStatus(200)).toBe(true)
    expect(config.validateStatus(201)).toBe(true)
    expect(config.validateStatus(422)).toBe(false)
  })
})
