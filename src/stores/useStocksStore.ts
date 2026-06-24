import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stocksService } from '@/services/stocks/stocksService'
import type {
  StockHolding,
  StockMaster,
  StockTransaction,
  StockLot,
  HoldingMetrics,
  TaxReport,
  CreateTransactionPayload,
  UpdateTransactionPayload,
  UpdateHoldingPayload,
} from '@/types/stocks'

export const useStocksStore = defineStore('stocks', () => {
  // ── State ────────────────────────────────────────────────────────────

  const holdings = ref<StockHolding[]>([])
  const currentHolding = ref<StockHolding | null>(null)
  const currentMetrics = ref<HoldingMetrics | null>(null)
  const currentLots = ref<StockLot[]>([])
  const currentTransactions = ref<StockTransaction[]>([])
  const currentTax = ref<TaxReport | null>(null)
  const stockSearchResults = ref<StockMaster[]>([])
  const loading = ref(false)

  // ── Getters ──────────────────────────────────────────────────────────

  const activeHoldings = computed(() =>
    holdings.value.filter((h) => h.holding.status === 'active'),
  )

  const totalInvested = computed(() =>
    holdings.value.reduce((sum, h) => sum + (h.holding.principal_amount ?? 0), 0),
  )

  // ── Holdings actions ─────────────────────────────────────────────────

  const fetchHoldings = async () => {
    try {
      loading.value = true
      holdings.value = await stocksService.getHoldings()
    } finally {
      loading.value = false
    }
  }

  const fetchHolding = async (id: number) => {
    const holding = await stocksService.getHolding(id)
    currentHolding.value = holding
    return holding
  }

  const updateHolding = async (id: number, data: UpdateHoldingPayload) => {
    const updated = await stocksService.updateHolding(id, data)
    currentHolding.value = updated
    const index = holdings.value.findIndex((h) => h.id === id)
    if (index !== -1) holdings.value[index] = updated
    return updated
  }

  const deleteHolding = async (id: number) => {
    await stocksService.deleteHolding(id)
    holdings.value = holdings.value.filter((h) => h.id !== id)
    if (currentHolding.value?.id === id) currentHolding.value = null
  }

  // ── Computed / lots / tax ────────────────────────────────────────────

  const fetchMetrics = async (id: number) => {
    currentMetrics.value = await stocksService.getComputedMetrics(id)
    return currentMetrics.value
  }

  const fetchLots = async (id: number) => {
    currentLots.value = await stocksService.getLots(id)
    return currentLots.value
  }

  const fetchTax = async (id: number) => {
    currentTax.value = await stocksService.getTax(id)
    return currentTax.value
  }

  // ── Transactions ─────────────────────────────────────────────────────

  const fetchTransactions = async (holdingId: number) => {
    currentTransactions.value = await stocksService.getTransactions(holdingId)
    return currentTransactions.value
  }

  const createTransaction = async (data: CreateTransactionPayload) => {
    await stocksService.createTransaction(data)
    await fetchHoldings()
  }

  const updateTransaction = async (id: number, data: UpdateTransactionPayload) => {
    await stocksService.updateTransaction(id, data)
    if (currentHolding.value) {
      await fetchTransactions(currentHolding.value.id)
    }
  }

  const deleteTransaction = async (id: number) => {
    await stocksService.deleteTransaction(id)
    currentTransactions.value = currentTransactions.value.filter((t) => t.id !== id)
    if (currentHolding.value) {
      await fetchHolding(currentHolding.value.id)
    }
  }

  // ── Stock master search ──────────────────────────────────────────────

  const searchStocks = async (q: string) => {
    if (!q.trim()) {
      stockSearchResults.value = []
      return []
    }
    stockSearchResults.value = await stocksService.searchStocks(q)
    return stockSearchResults.value
  }

  const clearStockSearch = () => {
    stockSearchResults.value = []
  }

  // ── Reset ────────────────────────────────────────────────────────────

  const reset = () => {
    holdings.value = []
    currentHolding.value = null
    currentMetrics.value = null
    currentLots.value = []
    currentTransactions.value = []
    currentTax.value = null
    stockSearchResults.value = []
    loading.value = false
  }

  return {
    // state
    holdings,
    currentHolding,
    currentMetrics,
    currentLots,
    currentTransactions,
    currentTax,
    stockSearchResults,
    loading,
    // getters
    activeHoldings,
    totalInvested,
    // actions
    fetchHoldings,
    fetchHolding,
    updateHolding,
    deleteHolding,
    fetchMetrics,
    fetchLots,
    fetchTax,
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    searchStocks,
    clearStockSearch,
    reset,
  }
})

export default useStocksStore
