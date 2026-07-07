import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { push } from 'notivue'
import { stocksService } from '@/services/stocks/stocksService'
import { useStocksStore } from '@/stores/useStocksStore'
import type {
  ImportBroker,
  ImportConfirmResult,
  ImportRow,
  ImportRowError,
  ImportSummary,
  ImportWarning,
} from '@/types/stocks'

export type ImportStep = 'upload' | 'preview' | 'done'

export function useStockImport() {
  const router = useRouter()
  const store = useStocksStore()

  const step = ref<ImportStep>('upload')
  const broker = ref<ImportBroker>('standard')
  const file = ref<File | null>(null)
  const previewing = ref(false)
  const confirming = ref(false)
  const summary = ref<ImportSummary | null>(null)
  const rows = ref<ImportRow[]>([])
  const warnings = ref<ImportWarning[]>([])
  const rowErrors = ref<ImportRowError[]>([])
  const duplicateWarnings = ref<ImportWarning[]>([])
  const showDuplicateDialog = ref(false)
  const result = ref<ImportConfirmResult | null>(null)

  const captureRowErrors = (err: unknown) => {
    const response = (err as { response?: { status?: number; data?: { errors?: unknown } } })
      .response
    if (response?.status === 422 && Array.isArray(response.data?.errors)) {
      rowErrors.value = response.data.errors as ImportRowError[]
    }
  }

  const preview = async () => {
    if (!file.value) return
    rowErrors.value = []
    previewing.value = true
    try {
      const data = await stocksService.importPreview(file.value, broker.value)
      summary.value = data.summary
      warnings.value = data.warnings
      rows.value = data.rows.map((r) => ({ ...r, platform: broker.value }))
      step.value = 'preview'
    } catch (err) {
      captureRowErrors(err)
    } finally {
      previewing.value = false
    }
  }

  const confirmImport = async (ignoreWarnings = false) => {
    rowErrors.value = []
    confirming.value = true
    try {
      const response = await stocksService.importConfirm(rows.value, ignoreWarnings)
      if (response.status === 409) {
        duplicateWarnings.value =
          (response.data.data as { warnings: ImportWarning[] }).warnings
        showDuplicateDialog.value = true
        return
      }
      showDuplicateDialog.value = false
      const data = response.data.data as ImportConfirmResult
      result.value = data
      step.value = 'done'
      push.success(`Imported ${data.imported} transactions across ${data.holdings_synced} holdings`)
      await store.fetchHoldings()
      router.push('/stocks')
    } catch (err) {
      showDuplicateDialog.value = false
      captureRowErrors(err)
    } finally {
      confirming.value = false
    }
  }

  const reset = () => {
    step.value = 'upload'
    file.value = null
    summary.value = null
    rows.value = []
    warnings.value = []
    rowErrors.value = []
    duplicateWarnings.value = []
    showDuplicateDialog.value = false
    result.value = null
  }

  return {
    step,
    broker,
    file,
    previewing,
    confirming,
    summary,
    rows,
    warnings,
    rowErrors,
    duplicateWarnings,
    showDuplicateDialog,
    result,
    preview,
    confirmImport,
    reset,
  }
}
