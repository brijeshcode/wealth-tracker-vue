import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminService } from '@/services/adminService'
import type { PriceSyncResult, BackfillResult, SyncLog, PriceSyncStatus } from '@/types/admin'

export const useAdminPriceSyncStore = defineStore('adminPriceSync', () => {
  // Single sync
  const syncLoading = ref(false)
  const syncResult = ref<PriceSyncResult | null>(null)

  // Backfill
  const backfillLoading = ref(false)
  const backfillResult = ref<BackfillResult | null>(null)

  // Logs
  const logs = ref<SyncLog[]>([])
  const logsPagination = ref({ current_page: 1, last_page: 1, per_page: 30, total: 0 })
  const logsLoading = ref(false)
  const logsStatusFilter = ref<PriceSyncStatus | ''>('')
  const logsPage = ref(1)

  async function syncPrices(date?: string) {
    syncLoading.value = true
    syncResult.value = null
    try {
      syncResult.value = await adminService.syncPrices(date)
    } finally {
      syncLoading.value = false
    }
  }

  async function backfillPrices(from: string, to: string) {
    backfillLoading.value = true
    backfillResult.value = null
    try {
      backfillResult.value = await adminService.backfillPrices(from, to)
    } finally {
      backfillLoading.value = false
    }
  }

  async function fetchLogs() {
    logsLoading.value = true
    try {
      const params: Record<string, any> = { page: logsPage.value }
      if (logsStatusFilter.value) params.status = logsStatusFilter.value
      const result = await adminService.getSyncLogs(params)
      logs.value = result.logs
      logsPagination.value = result.pagination
    } finally {
      logsLoading.value = false
    }
  }

  function setLogsStatus(status: PriceSyncStatus | '') {
    logsStatusFilter.value = status
    logsPage.value = 1
    fetchLogs()
  }

  function goToLogsPage(page: number) {
    logsPage.value = page
    fetchLogs()
  }

  return {
    syncLoading,
    syncResult,
    backfillLoading,
    backfillResult,
    logs,
    logsPagination,
    logsLoading,
    logsStatusFilter,
    logsPage,
    syncPrices,
    backfillPrices,
    fetchLogs,
    setLogsStatus,
    goToLogsPage,
  }
})
