<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from 'lucide-vue-next'
import { useStockDetail } from '@/composables/useStockDetail'
import AppCard from '@/components/ui/AppCard.vue'

const route = useRoute()
const router = useRouter()
const stockId = Number(route.params.stockId)

const {
  stockInfo,
  holdings,
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
} = useStockDetail(stockId)

onMounted(fetchAll)

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'transactions' | 'lots' | 'tax'
const activeTab = ref<Tab>('overview')
const tabs: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'lots', label: 'Lots' },
  { key: 'tax', label: 'Tax' },
]

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

    <!-- Back breadcrumb -->
    <button
      class="flex items-center gap-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
      @click="router.push('/stocks')"
    >
      <ArrowLeft class="h-4 w-4" />
      Stocks
    </button>

    <!-- Loading state -->
    <div v-if="loading && !stockInfo" class="flex items-center justify-center py-24 text-ink-dim">
      <svg class="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      Loading…
    </div>

    <!-- Not found -->
    <div v-else-if="!stockInfo && !loading" class="py-24 text-center text-ink-dim">
      Stock not found.
    </div>

    <template v-else-if="stockInfo">

      <!-- ── Page Header ──────────────────────────────────────────────────── -->
      <AppCard>
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <!-- Name + badges -->
          <div class="flex flex-col gap-2">
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
            </div>
          </div>

          <!-- Summary numbers -->
          <div class="flex flex-wrap gap-6 text-right">
            <div>
              <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Total Qty</p>
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

      <!-- ── Tab bar ─────────────────────────────────────────────────────── -->
      <div class="flex gap-1 rounded-xl bg-elevated p-1">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="flex-1 rounded-lg py-2 text-sm font-medium transition-colors"
          :class="activeTab === tab.key
            ? 'bg-surface text-ink shadow-sm'
            : 'text-ink-dim hover:text-ink'"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- ── Overview Tab ─────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'overview'" class="space-y-4">

        <!-- 4 summary cards -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AppCard>
            <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Total Qty</p>
            <p class="mt-1.5 font-mono text-2xl font-semibold text-ink">{{ fmtQty(totalQty) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Avg Buy Price</p>
            <p class="mt-1.5 font-mono text-2xl font-semibold text-ink">₹{{ fmt(weightedAvg) }}</p>
          </AppCard>
          <AppCard>
            <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Current Value</p>
            <p class="mt-1.5 font-mono text-2xl font-semibold text-ink">
              {{ currentValue !== null ? fmtCurrency(currentValue) : '—' }}
            </p>
          </AppCard>
          <AppCard>
            <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Unrealized P&amp;L</p>
            <div class="mt-1.5 flex items-baseline gap-1.5">
              <p
                class="font-mono text-2xl font-semibold"
                :class="unrealizedPnl !== null
                  ? (unrealizedPnl >= 0 ? 'text-gain' : 'text-loss')
                  : 'text-ink-ghost'"
              >
                <template v-if="unrealizedPnl !== null">
                  {{ unrealizedPnl >= 0 ? '+' : '' }}{{ fmtCurrency(unrealizedPnl) }}
                </template>
                <template v-else>—</template>
              </p>
              <span
                v-if="unrealizedPnlPct !== null"
                class="text-sm font-medium"
                :class="unrealizedPnl! >= 0 ? 'text-gain' : 'text-loss'"
              >
                {{ unrealizedPnl! >= 0 ? '+' : '' }}{{ fmt(unrealizedPnlPct) }}%
              </span>
            </div>
          </AppCard>
        </div>

        <!-- Per-platform breakdown -->
        <AppCard :padding="false">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
                <th class="py-3 pl-5 pr-3">Platform</th>
                <th class="py-3 px-3">Exchange</th>
                <th class="py-3 px-3 text-right">Qty</th>
                <th class="py-3 px-3 text-right">Avg Price</th>
                <th class="py-3 px-3 text-right">Value</th>
                <th class="py-3 pl-3 pr-5 text-right">% Share</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="h in holdings"
                :key="h.id"
                class="border-b border-border last:border-0"
              >
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
                <td class="py-3 px-3 text-right font-mono text-ink">
                  {{ fmtCurrency(h.quantity * h.avg_buy_price) }}
                </td>
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
      </div>

      <!-- ── Transactions Tab ────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'transactions'">
        <AppCard :padding="false">
          <div v-if="loading" class="flex items-center justify-center py-12 text-ink-dim">
            <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
          <div v-else-if="!mergedTransactions.length" class="py-12 text-center text-sm text-ink-dim">
            No transactions found.
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
                <th class="py-3 pl-5 pr-3">Date</th>
                <th class="py-3 px-3">Type</th>
                <th class="py-3 px-3 text-right">Qty</th>
                <th class="py-3 px-3 text-right">Price/unit</th>
                <th class="py-3 px-3 text-right">Amount</th>
                <th class="py-3 px-3">Platform</th>
                <th class="py-3 pl-3 pr-5">Exch</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="t in mergedTransactions"
                :key="t.id"
                class="border-b border-border last:border-0"
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
                <td class="py-3 pl-3 pr-5">
                  <span
                    class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    :class="t.exchange === 'NSE'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'"
                  >
                    {{ t.exchange }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </AppCard>
      </div>

      <!-- ── Lots Tab ────────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'lots'">
        <AppCard :padding="false">
          <div v-if="loading" class="flex items-center justify-center py-12 text-ink-dim">
            <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
          <div v-else-if="!mergedLots.length" class="py-12 text-center text-sm text-ink-dim">
            No lots found.
          </div>
          <table v-else class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
                <th class="py-3 pl-5 pr-3">Buy Date</th>
                <th class="py-3 px-3">Platform</th>
                <th class="py-3 px-3 text-right">Orig Qty</th>
                <th class="py-3 px-3 text-right">Remaining</th>
                <th class="py-3 pl-3 pr-5">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="lot in mergedLots"
                :key="lot.id"
                class="border-b border-border last:border-0"
              >
                <td class="py-3 pl-5 pr-3 font-mono text-xs text-ink-dim">
                  {{ fmtDate(lot.buy_date) }}
                </td>
                <td class="py-3 px-3 text-ink-dim">{{ lot.platform_name }}</td>
                <td class="py-3 px-3 text-right font-mono text-ink">
                  {{ fmtQty(lot.original_quantity) }}
                </td>
                <td class="py-3 px-3 text-right font-mono text-ink">
                  {{ fmtQty(lot.quantity_remaining) }}
                </td>
                <td class="py-3 pl-3 pr-5">
                  <span
                    class="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    :class="lot.is_locked
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : lot.is_exhausted
                        ? 'bg-elevated text-ink-ghost'
                        : 'bg-gain/10 text-gain'"
                  >
                    {{ lot.is_locked
                      ? `Locked until ${fmtDate(lot.locked_until!)}`
                      : lot.is_exhausted ? 'Exhausted' : 'Active' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </AppCard>
      </div>

      <!-- ── Tax Tab ─────────────────────────────────────────────────────── -->
      <div v-else-if="activeTab === 'tax'" class="space-y-4">
        <div v-if="loading" class="flex items-center justify-center py-12 text-ink-dim">
          <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading…
        </div>

        <template v-else-if="mergedTax">
          <!-- Tax summary -->
          <AppCard>
            <div class="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <div>
                <p class="text-xs text-ink-ghost">STCG Gain</p>
                <p class="mt-0.5 font-mono font-medium text-ink">
                  {{ fmtCurrency(mergedTax.stcg_gain) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-ink-ghost">STCG Tax (15%)</p>
                <p class="mt-0.5 font-mono font-medium text-ink">
                  {{ fmtCurrency(mergedTax.stcg_tax) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-ink-ghost">LTCG Gain</p>
                <p class="mt-0.5 font-mono font-medium text-ink">
                  {{ fmtCurrency(mergedTax.ltcg_gain) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-ink-ghost">LTCG Exemption (₹1L)</p>
                <p class="mt-0.5 font-mono font-medium text-ink">
                  {{ fmtCurrency(mergedTax.ltcg_exemption) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-ink-ghost">LTCG Taxable Gain</p>
                <p class="mt-0.5 font-mono font-medium text-ink">
                  {{ fmtCurrency(mergedTax.ltcg_taxable_gain) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-ink-ghost">LTCG Tax (10%)</p>
                <p class="mt-0.5 font-mono font-medium text-ink">
                  {{ fmtCurrency(mergedTax.ltcg_tax) }}
                </p>
              </div>
            </div>
            <div class="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p class="text-sm font-medium text-ink">Total Estimated Tax</p>
              <p class="font-mono text-lg font-semibold text-loss">
                {{ fmtCurrency(mergedTax.total_tax) }}
              </p>
            </div>
          </AppCard>

          <!-- Breakdown table -->
          <AppCard :padding="false">
            <div v-if="!mergedTax.breakdown.length" class="py-12 text-center text-sm text-ink-dim">
              No realised gains to report.
            </div>
            <table v-else class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
                  <th class="py-3 pl-5 pr-3">Buy Date</th>
                  <th class="py-3 px-3">Sell Date</th>
                  <th class="py-3 px-3 text-right">Months</th>
                  <th class="py-3 px-3 text-right">Qty</th>
                  <th class="py-3 px-3 text-right">Buy ₹</th>
                  <th class="py-3 px-3 text-right">Sell ₹</th>
                  <th class="py-3 px-3 text-right">Gain</th>
                  <th class="py-3 pl-3 pr-5">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in mergedTax.breakdown"
                  :key="row.lot_id"
                  class="border-b border-border last:border-0"
                >
                  <td class="py-3 pl-5 pr-3 font-mono text-xs text-ink-dim">
                    {{ fmtDate(row.buy_date) }}
                  </td>
                  <td class="py-3 px-3 font-mono text-xs text-ink-dim">
                    {{ fmtDate(row.sell_date) }}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-ink-dim">
                    {{ row.holding_months }}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-ink">
                    {{ fmtQty(row.quantity) }}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-ink-dim">
                    ₹{{ fmt(row.buy_price) }}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-ink-dim">
                    ₹{{ fmt(row.sell_price) }}
                  </td>
                  <td
                    class="py-3 px-3 text-right font-mono font-medium"
                    :class="row.gain >= 0 ? 'text-gain' : 'text-loss'"
                  >
                    {{ row.gain >= 0 ? '+' : '' }}{{ fmtCurrency(row.gain) }}
                  </td>
                  <td class="py-3 pl-3 pr-5">
                    <span
                      class="rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      :class="row.type === 'LTCG'
                        ? 'bg-gain/10 text-gain'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'"
                    >
                      {{ row.type }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </AppCard>
        </template>
      </div>

    </template>
  </div>
</template>
