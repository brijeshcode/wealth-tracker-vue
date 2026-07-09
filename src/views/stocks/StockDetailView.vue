<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Trash2, Loader2, ChevronDown } from 'lucide-vue-next'
import { useStockDetail } from '@/composables/useStockDetail'
import { useStocksStore } from '@/stores/useStocksStore'
import AppCard from '@/components/ui/AppCard.vue'

const route = useRoute()
const router = useRouter()
const stockId = Number(route.params.stockId)
const stocksStore = useStocksStore()

const {
  stockInfo,
  holdings,
  valuation,
  priceDate,
  totalQty,
  weightedAvg,
  currentValue,
  unrealizedPnl,
  unrealizedPnlPct,
  isLtcg,
  holdingAgeLabel,
  mergedTransactions,
  mergedLots,
  mergedTax,
  loading,
  fetchAll,
  removeTransaction,
} = useStockDetail(stockId)

onMounted(fetchAll)

// ── Delete transaction ────────────────────────────────────────────────────────

const txOpen = ref(false)
const deletingTxId = ref<number | null>(null)

async function confirmDeleteTransaction(id: number) {
  if (!confirm('Delete this transaction? This cannot be undone.')) return
  deletingTxId.value = id
  try {
    await stocksStore.deleteTransaction(id)
    removeTransaction(id)
  } finally {
    deletingTxId.value = null
  }
}

// ── Lots grouped by platform ──────────────────────────────────────────────────

const lotsByPlatform = computed(() => {
  const map = new Map<string, typeof mergedLots.value>()
  for (const lot of mergedLots.value) {
    const group = map.get(lot.platform_name) ?? []
    group.push(lot)
    map.set(lot.platform_name, group)
  }
  return map
})

function lotAge(buyDate: string) {
  return Math.floor((Date.now() - new Date(buyDate).getTime()) / 86_400_000)
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)

const fmtQty = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 4 }).format(n)

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
</script>

<template>
  <div class="space-y-6 p-6">

    <!-- Back -->
    <button
      class="flex cursor-pointer items-center gap-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
      @click="router.push('/stocks')"
    >
      <ArrowLeft class="h-4 w-4" />
      Stocks
    </button>

    <!-- Loading -->
    <div v-if="loading && !stockInfo" class="flex items-center justify-center py-24 text-ink-dim">
      <Loader2 class="mr-2 h-5 w-5 animate-spin" />
      Loading…
    </div>

    <!-- Not found -->
    <div v-else-if="!stockInfo && !loading" class="py-24 text-center text-ink-dim">
      Stock not found.
    </div>

    <template v-else-if="stockInfo">

      <!-- ── Header card ──────────────────────────────────────────────────── -->
      <AppCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div class="flex flex-col gap-1.5">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-xl font-semibold text-ink">{{ stockInfo.company_name }}</h1>
              <span
                v-if="stockInfo.nse_symbol"
                class="rounded bg-elevated px-2 py-0.5 font-mono text-xs font-medium text-ink-ghost"
              >
                {{ stockInfo.nse_symbol }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm text-ink-dim">Held for {{ holdingAgeLabel }}</span>
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="isLtcg
                  ? 'bg-gain/10 text-gain'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'"
              >
                {{ isLtcg ? 'LTCG Eligible' : 'STCG' }}
              </span>
              <span v-if="priceDate" class="text-xs text-ink-ghost">
                Price as of {{ fmtDate(priceDate) }}
              </span>
            </div>
          </div>

          <div class="flex flex-wrap gap-6 text-right">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Qty</p>
              <p class="mt-0.5 font-mono text-lg font-semibold text-ink">{{ fmtQty(totalQty) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Avg Buy</p>
              <p class="mt-0.5 font-mono text-lg font-semibold text-ink">₹{{ fmt(weightedAvg) }}</p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Value</p>
              <p class="mt-0.5 font-mono text-lg font-semibold text-ink">
                {{ currentValue !== null ? fmtCurrency(currentValue) : '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">P&amp;L</p>
              <p
                class="mt-0.5 font-mono text-lg font-semibold"
                :class="unrealizedPnl !== null
                  ? (unrealizedPnl >= 0 ? 'text-gain' : 'text-loss')
                  : 'text-ink-ghost'"
              >
                <template v-if="unrealizedPnl !== null">
                  {{ unrealizedPnl >= 0 ? '+' : '' }}{{ fmtCurrency(unrealizedPnl) }}
                  <span class="text-sm">
                    ({{ unrealizedPnl >= 0 ? '+' : '' }}{{ fmt(unrealizedPnlPct!) }}%)
                  </span>
                </template>
                <template v-else>—</template>
              </p>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- ── Per-platform breakdown ───────────────────────────────────────── -->
      <AppCard :padding="false">
        <div class="border-b border-border px-4 py-3">
          <h2 class="text-sm font-medium text-ink">Holdings by Platform</h2>
        </div>
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
              <th class="py-3 pl-5 pr-3">Platform</th>
              <th class="py-3 px-3">Exchange</th>
              <th class="py-3 px-3 text-right">Qty</th>
              <th class="py-3 px-3 text-right">Avg Price</th>
              <th class="py-3 px-3 text-right">Cost Basis</th>
              <th class="py-3 pl-3 pr-5 text-right">% Share</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in holdings" :key="h.id" class="border-b border-border last:border-0">
              <td class="py-3 pl-5 pr-3 font-medium text-ink">
                {{ h.holding.platform.display_name }}
              </td>
              <td class="py-3 px-3">
                <span
                  class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                  :class="h.exchange === 'NSE'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'"
                >
                  {{ h.exchange }}
                </span>
              </td>
              <td class="py-3 px-3 text-right font-mono text-ink">{{ fmtQty(h.quantity) }}</td>
              <td class="py-3 px-3 text-right font-mono text-ink-dim">₹{{ fmt(h.avg_buy_price) }}</td>
              <td class="py-3 px-3 text-right font-mono text-ink">{{ fmtCurrency(h.cost_basis) }}</td>
              <td class="py-3 pl-3 pr-5">
                <div class="flex items-center justify-end gap-2">
                  <div class="h-1.5 w-20 overflow-hidden rounded-full bg-elevated">
                    <div
                      class="h-full rounded-full bg-gold"
                      :style="{ width: `${totalQty > 0 ? (h.quantity / totalQty) * 100 : 0}%` }"
                    />
                  </div>
                  <span class="w-10 text-right font-mono text-xs text-ink-dim">
                    {{ fmt(totalQty > 0 ? (h.quantity / totalQty) * 100 : 0) }}%
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </AppCard>

      <!-- ── Transactions ─────────────────────────────────────────────────── -->
      <AppCard :padding="false">
        <button
          class="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
          :class="txOpen ? 'border-b border-border' : ''"
          @click="txOpen = !txOpen"
        >
          <h2 class="text-sm font-medium text-ink">
            Transactions
            <span v-if="mergedTransactions.length" class="ml-1.5 font-normal text-ink-ghost">
              ({{ mergedTransactions.length }})
            </span>
          </h2>
          <ChevronDown
            class="h-4 w-4 text-ink-ghost transition-transform duration-200"
            :class="txOpen ? 'rotate-180' : ''"
          />
        </button>

        <div v-if="loading && txOpen" class="flex items-center justify-center py-12 text-ink-dim">
          <Loader2 class="mr-2 h-4 w-4 animate-spin" />
          Loading…
        </div>

        <div v-else-if="!mergedTransactions.length && txOpen" class="py-12 text-center text-sm text-ink-dim">
          No transactions found.
        </div>

        <div v-else-if="txOpen" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
                <th class="py-3 pl-5 pr-3">Date</th>
                <th class="py-3 px-3">Type</th>
                <th class="py-3 px-3 text-right">Qty</th>
                <th class="py-3 px-3 text-right">Price / unit</th>
                <th class="py-3 px-3 text-right">Amount</th>
                <th class="py-3 px-3">Platform</th>
                <th class="py-3 px-3">Exch</th>
                <th class="py-3 pl-3 pr-5"></th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in mergedTransactions"
                :key="t.id"
                class="border-b border-border last:border-0 transition-colors hover:bg-elevated/40"
              >
                <td class="py-3 pl-5 pr-3 font-mono text-xs text-ink-dim">
                  {{ fmtDate(t.transaction_date) }}
                </td>
                <td class="py-3 px-3">
                  <span
                    class="rounded px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    :class="t.type === 'buy'
                      ? 'bg-gain/10 text-gain'
                      : t.type === 'sell'
                        ? 'bg-loss/10 text-loss'
                        : 'bg-elevated text-ink-dim'"
                  >
                    {{ t.type }}
                  </span>
                </td>
                <td class="py-3 px-3 text-right font-mono text-ink">
                  {{ t.quantity !== null ? fmtQty(t.quantity) : '—' }}
                </td>
                <td class="py-3 px-3 text-right font-mono text-ink-dim">
                  {{ t.price_per_unit !== null ? '₹' + fmt(t.price_per_unit) : '—' }}
                </td>
                <td class="py-3 px-3 text-right font-mono font-medium text-ink">
                  {{ fmtCurrency(t.amount) }}
                </td>
                <td class="py-3 px-3 text-sm text-ink-dim">{{ t.platform_name }}</td>
                <td class="py-3 px-3">
                  <span
                    class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    :class="t.exchange === 'NSE'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'"
                  >
                    {{ t.exchange }}
                  </span>
                </td>
                <td class="py-3 pl-3 pr-5">
                  <button
                    class="cursor-pointer rounded p-1.5 text-ink-ghost transition-colors hover:bg-elevated hover:text-loss disabled:opacity-40"
                    title="Delete transaction"
                    :disabled="deletingTxId === t.id"
                    @click="confirmDeleteTransaction(t.id)"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- ── Lots ─────────────────────────────────────────────────────────── -->
      <template v-if="mergedLots.length">
        <AppCard
          v-for="[platform, lots] in lotsByPlatform"
          :key="platform"
          :padding="false"
        >
          <div class="border-b border-border px-4 py-3">
            <h2 class="text-sm font-medium text-ink">Lots — {{ platform }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
                <th class="py-3 pl-5 pr-3">Buy Date</th>
                <th class="py-3 px-3 text-right">Age</th>
                <th class="py-3 px-3 text-right">Orig Qty</th>
                <th class="py-3 px-3 text-right">Remaining</th>
                <th class="py-3 pl-3 pr-5">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lot in lots"
                :key="lot.id"
                class="border-b border-border last:border-0"
              >
                <td class="py-3 pl-5 pr-3 font-mono text-xs text-ink-dim">{{ fmtDate(lot.buy_date) }}</td>
                <td class="py-3 px-3 text-right tabular-nums font-mono text-sm"
                  :class="lotAge(lot.buy_date) >= 365 ? 'text-gain' : 'text-ink-dim'"
                >
                  {{ lotAge(lot.buy_date) }}d
                </td>
                <td class="py-3 px-3 text-right font-mono text-ink">{{ fmtQty(lot.original_quantity) }}</td>
                <td class="py-3 px-3 text-right font-mono text-ink">{{ fmtQty(lot.quantity_remaining) }}</td>
                <td class="py-3 pl-3 pr-5">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    :class="lot.is_locked
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : lot.is_exhausted
                        ? 'bg-elevated text-ink-ghost'
                        : 'bg-gain/10 text-gain'"
                  >
                    {{ lot.is_locked ? `Locked until ${fmtDate(lot.locked_until!)}` : lot.is_exhausted ? 'Exhausted' : 'Active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Lot summary -->
          <div class="border-t border-border bg-elevated/40 px-4 py-3">
            <div class="flex items-center gap-8 text-xs">
              <div>
                <span class="text-ink-ghost">Total Qty</span>
                <span class="ml-2 font-mono font-medium text-ink">
                  {{ fmtQty(lots.reduce((s, l) => s + l.quantity_remaining, 0)) }}
                </span>
              </div>
              <div>
                <span class="text-ink-ghost">Invested</span>
                <span class="ml-2 font-mono font-medium text-ink">
                  {{ fmtCurrency(lots.reduce((s, l) => s + l.quantity_remaining * l.buy_price, 0)) }}
                </span>
              </div>
              <div v-if="valuation">
                <span class="text-ink-ghost">Current Value</span>
                <span class="ml-2 font-mono font-medium text-ink">
                  {{ fmtCurrency(lots.reduce((s, l) => s + l.quantity_remaining * valuation!.current_price, 0)) }}
                </span>
              </div>
            </div>
          </div>
        </AppCard>
      </template>

      <!-- ── Tax ──────────────────────────────────────────────────────────── -->
      <template v-if="mergedTax && mergedTax.total_tax > 0">
        <AppCard>
          <h2 class="mb-4 text-sm font-medium text-ink">Tax Summary</h2>
          <div class="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <p class="text-xs text-ink-ghost">STCG Gain</p>
              <p class="mt-0.5 font-mono font-medium text-ink">{{ fmtCurrency(mergedTax.stcg_gain) }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-ghost">STCG Tax (15%)</p>
              <p class="mt-0.5 font-mono font-medium text-ink">{{ fmtCurrency(mergedTax.stcg_tax) }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-ghost">LTCG Gain</p>
              <p class="mt-0.5 font-mono font-medium text-ink">{{ fmtCurrency(mergedTax.ltcg_gain) }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-ghost">LTCG Exemption (₹1L)</p>
              <p class="mt-0.5 font-mono font-medium text-ink">{{ fmtCurrency(mergedTax.ltcg_exemption) }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-ghost">LTCG Taxable</p>
              <p class="mt-0.5 font-mono font-medium text-ink">{{ fmtCurrency(mergedTax.ltcg_taxable_gain) }}</p>
            </div>
            <div>
              <p class="text-xs text-ink-ghost">LTCG Tax (10%)</p>
              <p class="mt-0.5 font-mono font-medium text-ink">{{ fmtCurrency(mergedTax.ltcg_tax) }}</p>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p class="text-sm font-medium text-ink">Total Estimated Tax</p>
            <p class="font-mono text-lg font-semibold text-loss">{{ fmtCurrency(mergedTax.total_tax) }}</p>
          </div>
        </AppCard>
      </template>

    </template>
  </div>
</template>
