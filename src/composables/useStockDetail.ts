import { ref, computed } from 'vue'
import { useStocksStore } from '@/stores/useStocksStore'
import type { StockHolding, StockTransaction, StockLot, TaxBreakdownItem, Exchange } from '@/types/stocks'

export interface MergedTransaction extends StockTransaction {
  platform_name: string
  exchange: Exchange
  holding_id: number
}

export interface MergedLot extends StockLot {
  platform_name: string
  holding_id: number
}

export interface MergedTaxReport {
  stcg_gain: number
  stcg_tax: number
  ltcg_gain: number
  ltcg_exemption: number
  ltcg_taxable_gain: number
  ltcg_tax: number
  total_tax: number
  breakdown: TaxBreakdownItem[]
}

export function useStockDetail(stockId: number) {
  const store = useStocksStore()

  const loading = ref(false)
  const mergedTransactions = ref<MergedTransaction[]>([])
  const mergedLots = ref<MergedLot[]>([])
  const mergedTax = ref<MergedTaxReport | null>(null)

  const holdings = computed<StockHolding[]>(() =>
    store.holdings.filter((h) => h.stock_id === stockId),
  )

  const stockInfo = computed(() => holdings.value[0]?.stock ?? null)

  const totalQty = computed(() =>
    holdings.value.reduce((sum, h) => sum + h.quantity, 0),
  )

  const weightedAvg = computed(() => {
    const total = totalQty.value
    if (total === 0) return 0
    return holdings.value.reduce((sum, h) => sum + h.quantity * h.avg_buy_price, 0) / total
  })

  const currentValue = computed(() => {
    const price = stockInfo.value?.latest_price?.price ?? null
    return price !== null ? totalQty.value * price : null
  })

  const costBasis = computed(() => totalQty.value * weightedAvg.value)

  const unrealizedPnl = computed(() =>
    currentValue.value !== null ? currentValue.value - costBasis.value : null,
  )

  const unrealizedPnlPct = computed(() =>
    unrealizedPnl.value !== null && costBasis.value > 0
      ? (unrealizedPnl.value / costBasis.value) * 100
      : null,
  )

  const holdingAgeDays = computed(() => {
    const buyDates = mergedTransactions.value
      .filter((t) => t.type === 'buy')
      .map((t) => new Date(t.transaction_date).getTime())
    if (!buyDates.length) return null
    const earliest = Math.min(...buyDates)
    return Math.floor((Date.now() - earliest) / (1000 * 60 * 60 * 24))
  })

  const isLtcg = computed(() => (holdingAgeDays.value ?? 0) >= 365)

  const holdingAgeLabel = computed(() => {
    const days = holdingAgeDays.value
    if (days === null) return '—'
    const years = Math.floor(days / 365)
    const months = Math.floor((days % 365) / 30)
    if (years > 0 && months > 0)
      return `${years} year${years > 1 ? 's' : ''} ${months} month${months > 1 ? 's' : ''}`
    if (years > 0) return `${years} year${years > 1 ? 's' : ''}`
    return `${months} month${months !== 1 ? 's' : ''}`
  })

  const fetchAll = async () => {
    if (store.holdings.length === 0) {
      await store.fetchHoldings()
    }
    const hs = holdings.value
    if (!hs.length) return

    loading.value = true
    try {
      const results = await Promise.all(
        hs.map(async (h) => {
          const [txns, lots, tax] = await Promise.all([
            store.fetchTransactions(h.id),
            store.fetchLots(h.id),
            store.fetchTax(h.id),
          ])
          return { h, txns, lots, tax }
        }),
      )

      mergedTransactions.value = results
        .flatMap(({ h, txns }) =>
          txns.map((t) => ({
            ...t,
            platform_name: h.holding.platform.display_name,
            exchange: h.exchange,
            holding_id: h.id,
          })),
        )
        .sort(
          (a, b) =>
            new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime(),
        )

      mergedLots.value = results
        .flatMap(({ h, lots }) =>
          lots.map((l) => ({
            ...l,
            platform_name: h.holding.platform.display_name,
            holding_id: h.id,
          })),
        )
        .sort((a, b) => new Date(a.buy_date).getTime() - new Date(b.buy_date).getTime())

      const zero: MergedTaxReport = {
        stcg_gain: 0,
        stcg_tax: 0,
        ltcg_gain: 0,
        ltcg_exemption: 0,
        ltcg_taxable_gain: 0,
        ltcg_tax: 0,
        total_tax: 0,
        breakdown: [],
      }
      const combined = results.reduce(
        (acc, { tax }) => ({
          stcg_gain: acc.stcg_gain + tax.stcg_gain,
          stcg_tax: acc.stcg_tax + tax.stcg_tax,
          ltcg_gain: acc.ltcg_gain + tax.ltcg_gain,
          ltcg_exemption: acc.ltcg_exemption + tax.ltcg_exemption,
          ltcg_taxable_gain: acc.ltcg_taxable_gain + tax.ltcg_taxable_gain,
          ltcg_tax: acc.ltcg_tax + tax.ltcg_tax,
          total_tax: acc.total_tax + tax.total_tax,
          breakdown: [...acc.breakdown, ...tax.breakdown],
        }),
        zero,
      )
      combined.breakdown.sort(
        (a, b) => new Date(b.sell_date).getTime() - new Date(a.sell_date).getTime(),
      )
      mergedTax.value = combined
    } finally {
      loading.value = false
    }
  }

  return {
    holdings,
    stockInfo,
    totalQty,
    weightedAvg,
    currentValue,
    costBasis,
    unrealizedPnl,
    unrealizedPnlPct,
    holdingAgeDays,
    isLtcg,
    holdingAgeLabel,
    mergedTransactions,
    mergedLots,
    mergedTax,
    loading,
    fetchAll,
  }
}
