import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useStockImport } from '@/composables/useStockImport'
import { stocksService } from '@/services/stocks/stocksService'
import { push } from 'notivue'
import type { ImportPreviewData, ImportRow } from '@/types/stocks'

const { routerPush, mockStore } = vi.hoisted(() => ({
  routerPush: vi.fn<() => void>(),
  mockStore: { fetchHoldings: vi.fn<() => Promise<void>>() },
}))

vi.mock('@/services/stocks/stocksService', () => ({
  stocksService: {
    importPreview: vi.fn<() => Promise<ImportPreviewData>>(),
    importConfirm: vi.fn<() => Promise<unknown>>(),
  },
}))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: routerPush }),
}))
vi.mock('notivue', () => ({
  push: { success: vi.fn<() => void>(), error: vi.fn<() => void>() },
}))
vi.mock('@/stores/useStocksStore', () => ({
  useStocksStore: () => mockStore,
}))

const sampleRow: ImportRow = {
  transaction_date: '2024-01-15 10:30:00',
  symbol: 'RELIANCE',
  exchange: 'NSE',
  type: 'buy',
  quantity: 10,
  price_per_unit: 2450.5,
  platform: 'Zerodha',
  reference: 'TRD123',
  nickname: null,
  notes: null,
}

const previewData: ImportPreviewData = {
  summary: { total: 1, buy: 1, sell: 0 },
  warnings: [{ row: 5, message: 'Possible duplicate' }],
  rows: [sampleRow],
}

const confirm200 = {
  status: 200,
  data: { message: 'Import complete', data: { imported: 48, holdings_synced: 5 } },
} as never

const confirm409 = {
  status: 409,
  data: {
    message: 'Duplicate transactions detected',
    data: { warnings: [{ row: 5, message: 'Definitive duplicate' }] },
  },
} as never

const error422 = {
  response: {
    status: 422,
    data: {
      message: 'Import validation failed',
      errors: [{ row: 3, column: 'symbol', error: 'RELIANCE not found in stock master' }],
    },
  },
}

const makeFile = () => new File(['a,b,c'], 'trades.csv', { type: 'text/csv' })

describe('useStockImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.fetchHoldings.mockResolvedValue(undefined)
  })

  describe('preview', () => {
    it('does nothing when no file is selected', async () => {
      const imp = useStockImport()
      await imp.preview()
      expect(stocksService.importPreview).not.toHaveBeenCalled()
      expect(imp.step.value).toBe('upload')
    })

    it('populates summary, rows, warnings and moves to preview step on success', async () => {
      vi.mocked(stocksService.importPreview).mockResolvedValue(previewData)
      const imp = useStockImport()
      imp.file.value = makeFile()
      imp.broker.value = 'zerodha'

      await imp.preview()

      expect(stocksService.importPreview).toHaveBeenCalledWith(imp.file.value, 'zerodha')
      expect(imp.summary.value).toEqual({ total: 1, buy: 1, sell: 0 })
      expect(imp.rows.value).toEqual([sampleRow])
      expect(imp.warnings.value).toHaveLength(1)
      expect(imp.step.value).toBe('preview')
      expect(imp.previewing.value).toBe(false)
    })

    it('fills rowErrors and stays on upload step on 422', async () => {
      vi.mocked(stocksService.importPreview).mockRejectedValue(error422)
      const imp = useStockImport()
      imp.file.value = makeFile()

      await imp.preview()

      expect(imp.rowErrors.value).toEqual([
        { row: 3, column: 'symbol', error: 'RELIANCE not found in stock master' },
      ])
      expect(imp.step.value).toBe('upload')
    })

    it('clears previous rowErrors before a new preview', async () => {
      vi.mocked(stocksService.importPreview).mockRejectedValueOnce(error422)
      const imp = useStockImport()
      imp.file.value = makeFile()
      await imp.preview()
      expect(imp.rowErrors.value).toHaveLength(1)

      vi.mocked(stocksService.importPreview).mockResolvedValueOnce(previewData)
      await imp.preview()
      expect(imp.rowErrors.value).toHaveLength(0)
      expect(imp.step.value).toBe('preview')
    })
  })

  describe('confirmImport', () => {
    const setupPreviewed = async () => {
      vi.mocked(stocksService.importPreview).mockResolvedValue(previewData)
      const imp = useStockImport()
      imp.file.value = makeFile()
      await imp.preview()
      return imp
    }

    it('on 200: stores result, toasts, refetches holdings, navigates to /stocks', async () => {
      const imp = await setupPreviewed()
      vi.mocked(stocksService.importConfirm).mockResolvedValue(confirm200)

      await imp.confirmImport()

      expect(stocksService.importConfirm).toHaveBeenCalledWith(imp.rows.value, false)
      expect(imp.result.value).toEqual({ imported: 48, holdings_synced: 5 })
      expect(imp.step.value).toBe('done')
      expect(push.success).toHaveBeenCalledWith('Imported 48 transactions across 5 holdings')
      expect(mockStore.fetchHoldings).toHaveBeenCalled()
      expect(routerPush).toHaveBeenCalledWith('/stocks')
    })

    it('on 409: opens duplicate dialog with warnings, does not navigate', async () => {
      const imp = await setupPreviewed()
      vi.mocked(stocksService.importConfirm).mockResolvedValue(confirm409)

      await imp.confirmImport()

      expect(imp.duplicateWarnings.value).toEqual([{ row: 5, message: 'Definitive duplicate' }])
      expect(imp.showDuplicateDialog.value).toBe(true)
      expect(routerPush).not.toHaveBeenCalled()
      expect(imp.step.value).toBe('preview')
    })

    it('retry with ignoreWarnings=true passes flag and closes dialog on success', async () => {
      const imp = await setupPreviewed()
      vi.mocked(stocksService.importConfirm)
        .mockResolvedValueOnce(confirm409)
        .mockResolvedValueOnce(confirm200)

      await imp.confirmImport()
      expect(imp.showDuplicateDialog.value).toBe(true)

      await imp.confirmImport(true)
      expect(stocksService.importConfirm).toHaveBeenLastCalledWith(imp.rows.value, true)
      expect(imp.showDuplicateDialog.value).toBe(false)
      expect(imp.step.value).toBe('done')
    })

    it('on 422: fills rowErrors and stays on preview step', async () => {
      const imp = await setupPreviewed()
      vi.mocked(stocksService.importConfirm).mockRejectedValue(error422)

      await imp.confirmImport()

      expect(imp.rowErrors.value).toHaveLength(1)
      expect(imp.step.value).toBe('preview')
      expect(routerPush).not.toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('clears state back to the upload step', async () => {
      vi.mocked(stocksService.importPreview).mockResolvedValue(previewData)
      const imp = useStockImport()
      imp.file.value = makeFile()
      await imp.preview()
      expect(imp.step.value).toBe('preview')

      imp.reset()

      expect(imp.step.value).toBe('upload')
      expect(imp.file.value).toBeNull()
      expect(imp.summary.value).toBeNull()
      expect(imp.rows.value).toHaveLength(0)
      expect(imp.warnings.value).toHaveLength(0)
      expect(imp.rowErrors.value).toHaveLength(0)
      expect(imp.duplicateWarnings.value).toHaveLength(0)
      expect(imp.showDuplicateDialog.value).toBe(false)
      expect(imp.result.value).toBeNull()
    })
  })
})
