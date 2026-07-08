import { ref } from 'vue'
import { defineStore } from 'pinia'
import { adminService } from '@/services/adminService'
import type { StockMasterRecord, AdminStockMeta, AdminStockUpdatePayload } from '@/types/admin'

export const useAdminStocksStore = defineStore('adminStocks', () => {
  const stocks = ref<StockMasterRecord[]>([])
  const meta = ref<AdminStockMeta>({ current_page: 1, last_page: 1, total: 0 })
  const loading = ref(false)
  const searchQuery = ref('')
  const statusFilter = ref<'' | 'active' | 'inactive'>('')
  const hasHoldersFilter = ref<boolean | null>(null)
  const pageSize = ref(50)
  const currentPage = ref(1)

  async function fetchStocks() {
    loading.value = true
    try {
      const params: Record<string, any> = { page: currentPage.value, page_size: pageSize.value }
      if (searchQuery.value) params.q = searchQuery.value
      if (statusFilter.value) params.status = statusFilter.value
      if (hasHoldersFilter.value !== null) params.has_holders = hasHoldersFilter.value ? 1 : 0
      const result = await adminService.listStocks(params)
      stocks.value = result.stocks
      meta.value = result.meta ?? { current_page: 1, last_page: 1, total: 0 }
    } finally {
      loading.value = false
    }
  }

  async function updateStock(id: number, data: AdminStockUpdatePayload) {
    const updated = await adminService.updateStock(id, data)
    const idx = stocks.value.findIndex((s) => s.id === id)
    if (idx !== -1) stocks.value[idx] = updated
  }

  async function toggleActive(id: number) {
    const updated = await adminService.toggleStockActive(id)
    const idx = stocks.value.findIndex((s) => s.id === id)
    if (idx !== -1) stocks.value[idx].is_active = updated.is_active
  }

  function goToPage(page: number) {
    currentPage.value = page
    fetchStocks()
  }

  function search(q: string) {
    searchQuery.value = q
    currentPage.value = 1
    fetchStocks()
  }

  function setStatus(status: '' | 'active' | 'inactive') {
    statusFilter.value = status
    currentPage.value = 1
    fetchStocks()
  }

  function setHasHolders(value: boolean | null) {
    hasHoldersFilter.value = value
    currentPage.value = 1
    fetchStocks()
  }

  function setPageSize(size: number) {
    pageSize.value = size
    currentPage.value = 1
    fetchStocks()
  }

  return {
    stocks,
    meta,
    loading,
    searchQuery,
    statusFilter,
    hasHoldersFilter,
    pageSize,
    currentPage,
    fetchStocks,
    updateStock,
    toggleActive,
    goToPage,
    search,
    setStatus,
    setHasHolders,
    setPageSize,
  }
})
