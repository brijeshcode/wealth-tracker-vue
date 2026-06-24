<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useStocksStore } from '@/stores/useStocksStore'
import type { StockHolding } from '@/types/stocks'
import AppCard from '@/components/ui/AppCard.vue'

const store = useStocksStore()
onMounted(() => store.fetchHoldings())

// ── Grouped data ──────────────────────────────────────────────────────────────

interface PlatformRow {
  holdingId: number
  platformName: string
  exchange: string
  quantity: number
  avgBuyPrice: number
  pct: number
}

interface StockGroup {
  stockId: number
  companyName: string
  symbol: string | null
  totalQty: number
  weightedAvg: number
  currentPrice: number | null
  priceDate: string | null
  currentValue: number | null
  unrealizedPnl: number | null
  unrealizedPnlPct: number | null
  platforms: PlatformRow[]
}

const groups = computed<StockGroup[]>(() => {
  const map = new Map<number, StockHolding[]>()

  for (const h of store.holdings) {
    const existing = map.get(h.stock_id) ?? []
    existing.push(h)
    map.set(h.stock_id, existing)
  }

  return Array.from(map.values()).map((holdings) => {
    const first = holdings[0]!
    const totalQty = holdings.reduce((s, h) => s + h.quantity, 0)
    const weightedAvg =
      totalQty > 0
        ? holdings.reduce((s, h) => s + h.quantity * h.avg_buy_price, 0) / totalQty
        : 0

    const latestPrice = first.stock?.latest_price as any
    const currentPrice: number | null = latestPrice?.price ?? null
    const currentValue = currentPrice !== null ? totalQty * currentPrice : null
    const costBasis = totalQty * weightedAvg
    const unrealizedPnl = currentValue !== null ? currentValue - costBasis : null
    const unrealizedPnlPct =
      unrealizedPnl !== null && costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : null

    const platforms: PlatformRow[] = holdings.map((h) => ({
      holdingId: h.id,
      platformName: (h.holding?.platform as any)?.display_name ?? 'Unknown',
      exchange: h.exchange,
      quantity: h.quantity,
      avgBuyPrice: h.avg_buy_price,
      pct: totalQty > 0 ? (h.quantity / totalQty) * 100 : 0,
    }))

    return {
      stockId: first.stock_id,
      companyName: first.stock?.company_name ?? '—',
      symbol: first.stock?.nse_symbol ?? null,
      totalQty,
      weightedAvg,
      currentPrice,
      priceDate: latestPrice?.price_date ?? null,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPct,
      platforms,
    }
  })
})

// ── Summary stats ─────────────────────────────────────────────────────────────

const totalInvested = computed(() =>
  groups.value.reduce((s, g) => s + g.totalQty * g.weightedAvg, 0),
)
const totalValue = computed(() =>
  groups.value.reduce((s, g) => s + (g.currentValue ?? g.totalQty * g.weightedAvg), 0),
)
const totalPnl = computed(() => totalValue.value - totalInvested.value)
const totalPnlPct = computed(() =>
  totalInvested.value > 0 ? (totalPnl.value / totalInvested.value) * 100 : 0,
)

// ── Expand / collapse ─────────────────────────────────────────────────────────

const expanded = ref<Set<number>>(new Set())
const toggle = (stockId: number) => {
  if (expanded.value.has(stockId)) expanded.value.delete(stockId)
  else expanded.value.add(stockId)
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
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-ink">Stocks</h1>
        <p class="mt-0.5 text-sm text-ink-dim">{{ groups.length }} stocks across all platforms</p>
      </div>
    </div>

    <!-- Summary cards -->
    <div class="grid grid-cols-3 gap-4">
      <AppCard>
        <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Invested</p>
        <p class="mt-1.5 text-2xl font-semibold tabular-nums text-ink">
          {{ fmtCurrency(totalInvested) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Current Value</p>
        <p class="mt-1.5 text-2xl font-semibold tabular-nums text-ink">
          {{ fmtCurrency(totalValue) }}
        </p>
      </AppCard>
      <AppCard>
        <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Overall P&amp;L</p>
        <div class="mt-1.5 flex items-baseline gap-2">
          <p
            class="text-2xl font-semibold tabular-nums"
            :class="totalPnl >= 0 ? 'text-gain' : 'text-loss'"
          >
            {{ totalPnl >= 0 ? '+' : '' }}{{ fmtCurrency(totalPnl) }}
          </p>
          <span
            class="text-sm font-medium"
            :class="totalPnl >= 0 ? 'text-gain' : 'text-loss'"
          >
            {{ totalPnl >= 0 ? '+' : '' }}{{ fmt(totalPnlPct) }}%
          </span>
        </div>
      </AppCard>
    </div>

    <!-- Holdings table -->
    <AppCard :padding="false">
      <!-- Loading -->
      <div v-if="store.loading" class="flex items-center justify-center py-16 text-ink-dim">
        <svg class="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading holdings…
      </div>

      <!-- Empty -->
      <div
        v-else-if="groups.length === 0"
        class="flex flex-col items-center justify-center py-16 text-center"
      >
        <p class="text-ink-dim">No stock holdings yet.</p>
      </div>

      <!-- Table -->
      <table v-else class="w-full text-sm">
        <thead>
          <tr class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost">
            <th class="py-3 pl-5 pr-3 w-6"></th>
            <th class="py-3 px-3">Stock</th>
            <th class="py-3 px-3 text-right">Qty</th>
            <th class="py-3 px-3 text-right">Avg Price</th>
            <th class="py-3 px-3 text-right">Current Price</th>
            <th class="py-3 px-3 text-right">Value</th>
            <th class="py-3 pl-3 pr-5 text-right">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="group in groups" :key="group.stockId">
            <!-- Stock row -->
            <tr
              class="cursor-pointer border-b border-border transition-colors hover:bg-elevated"
              :class="expanded.has(group.stockId) ? 'bg-elevated' : ''"
              @click="toggle(group.stockId)"
            >
              <!-- Chevron -->
              <td class="py-3.5 pl-5 pr-3">
                <svg
                  class="h-4 w-4 text-ink-ghost transition-transform duration-200"
                  :class="expanded.has(group.stockId) ? 'rotate-90' : ''"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M7.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </td>

              <!-- Name + symbol -->
              <td class="py-3.5 px-3">
                <p class="font-medium text-ink">{{ group.companyName }}</p>
                <p v-if="group.symbol" class="mt-0.5 text-xs text-ink-ghost font-mono">
                  {{ group.symbol }}
                </p>
              </td>

              <!-- Qty -->
              <td class="py-3.5 px-3 text-right font-mono text-ink">
                {{ fmtQty(group.totalQty) }}
              </td>

              <!-- Avg price -->
              <td class="py-3.5 px-3 text-right font-mono text-ink-dim">
                ₹{{ fmt(group.weightedAvg) }}
              </td>

              <!-- Current price -->
              <td class="py-3.5 px-3 text-right font-mono">
                <span v-if="group.currentPrice !== null" class="text-ink">
                  ₹{{ fmt(group.currentPrice) }}
                </span>
                <span v-else class="text-ink-ghost">—</span>
              </td>

              <!-- Value -->
              <td class="py-3.5 px-3 text-right font-mono font-medium text-ink">
                {{ fmtCurrency(group.currentValue ?? group.totalQty * group.weightedAvg) }}
              </td>

              <!-- P&L -->
              <td class="py-3.5 pl-3 pr-5 text-right">
                <template v-if="group.unrealizedPnl !== null">
                  <p
                    class="font-mono font-medium"
                    :class="group.unrealizedPnl >= 0 ? 'text-gain' : 'text-loss'"
                  >
                    {{ group.unrealizedPnl >= 0 ? '+' : '' }}{{ fmt(group.unrealizedPnlPct!) }}%
                  </p>
                  <p
                    class="text-xs font-mono"
                    :class="group.unrealizedPnl >= 0 ? 'text-gain' : 'text-loss'"
                  >
                    {{ group.unrealizedPnl >= 0 ? '+' : '' }}{{ fmtCurrency(group.unrealizedPnl) }}
                  </p>
                </template>
                <span v-else class="text-ink-ghost">—</span>
              </td>
            </tr>

            <!-- Platform breakdown rows (expanded) -->
            <template v-if="expanded.has(group.stockId)">
              <tr
                v-for="platform in group.platforms"
                :key="platform.holdingId"
                class="border-b border-border bg-page text-ink-dim"
              >
                <!-- Indent spacer -->
                <td class="pl-5 pr-3"></td>

                <!-- Platform name + exchange badge -->
                <td class="py-2.5 px-3">
                  <div class="flex items-center gap-2">
                    <!-- indent line -->
                    <span class="ml-3 mr-1 inline-block h-3 w-px bg-border"></span>
                    <span class="text-ink-dim">{{ platform.platformName }}</span>
                    <span
                      class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                      :class="
                        platform.exchange === 'NSE'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
                      "
                    >
                      {{ platform.exchange }}
                    </span>
                  </div>
                </td>

                <!-- Qty -->
                <td class="py-2.5 px-3 text-right font-mono">
                  {{ fmtQty(platform.quantity) }}
                </td>

                <!-- Avg price -->
                <td class="py-2.5 px-3 text-right font-mono">
                  ₹{{ fmt(platform.avgBuyPrice) }}
                </td>

                <!-- Current price (same, leave empty for sub-row) -->
                <td class="py-2.5 px-3"></td>

                <!-- Value -->
                <td class="py-2.5 px-3 text-right font-mono">
                  {{ fmtCurrency(platform.quantity * platform.avgBuyPrice) }}
                </td>

                <!-- % share -->
                <td class="py-2.5 pl-3 pr-5">
                  <div class="flex items-center justify-end gap-2">
                    <div class="h-1.5 w-20 overflow-hidden rounded-full bg-elevated">
                      <div
                        class="h-full rounded-full bg-gold"
                        :style="{ width: `${platform.pct}%` }"
                      ></div>
                    </div>
                    <span class="w-10 text-right font-mono text-xs">
                      {{ fmt(platform.pct) }}%
                    </span>
                  </div>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </AppCard>
  </div>
</template>
