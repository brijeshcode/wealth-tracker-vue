<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  RefreshCw,
  CalendarRange,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MinusCircle,
  Clock,
} from 'lucide-vue-next'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPaginate from '@/components/ui/AppPaginate.vue'
import { useAdminPriceSyncStore } from '@/stores/useAdminPriceSyncStore'
import type { PriceSyncStatus } from '@/types/admin'

const store = useAdminPriceSyncStore()

// Single sync
const syncDate = ref('')

function runSync() {
  store.syncPrices(syncDate.value || undefined)
}

// Backfill
const backfillFrom = ref('')
const backfillTo = ref('')

function runBackfill() {
  if (!backfillFrom.value || !backfillTo.value) return
  store.backfillPrices(backfillFrom.value, backfillTo.value)
}

// Helpers
const statusConfig: Record<PriceSyncStatus, { label: string; classes: string }> = {
  success: { label: 'Success', classes: 'bg-gain/10 text-gain' },
  skipped: { label: 'Skipped', classes: 'bg-gold/10 text-gold' },
  failed: { label: 'Failed', classes: 'bg-loss/10 text-loss' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => store.fetchLogs())
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <h1 class="text-xl font-semibold text-ink">Price Sync</h1>
      <p class="mt-0.5 text-sm text-ink-dim">
        Sync NSE Bhavcopy prices. Scheduler runs automatically on weekdays at 16:05 IST.
      </p>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <!-- Single date sync -->
      <AppCard>
        <div class="mb-4 flex items-center gap-2">
          <RefreshCw class="h-4 w-4 text-ink-dim" />
          <h2 class="font-medium text-ink">Sync Single Date</h2>
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-dim">Date (leave blank for today)</label>
            <input
              v-model="syncDate"
              type="date"
              class="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>

          <AppButton :loading="store.syncLoading" @click="runSync">
            <RefreshCw class="h-4 w-4" />
            Sync Prices
          </AppButton>

          <!-- Sync result -->
          <div
            v-if="store.syncResult"
            class="flex items-start gap-3 rounded-lg border p-3"
            :class="{
              'border-gain/30 bg-gain/5': store.syncResult.status === 'success',
              'border-gold/30 bg-gold/5': store.syncResult.status === 'skipped',
              'border-loss/30 bg-loss/5': store.syncResult.status === 'failed',
            }"
          >
            <CheckCircle2
              v-if="store.syncResult.status === 'success'"
              class="mt-0.5 h-4 w-4 shrink-0 text-gain"
            />
            <MinusCircle
              v-else-if="store.syncResult.status === 'skipped'"
              class="mt-0.5 h-4 w-4 shrink-0 text-gold"
            />
            <AlertCircle v-else class="mt-0.5 h-4 w-4 shrink-0 text-loss" />
            <div>
              <p
                class="text-sm font-medium capitalize"
                :class="{
                  'text-gain': store.syncResult.status === 'success',
                  'text-gold': store.syncResult.status === 'skipped',
                  'text-loss': store.syncResult.status === 'failed',
                }"
              >
                {{ store.syncResult.status }}
              </p>
              <p class="mt-0.5 text-xs text-ink-dim">{{ store.syncResult.message }}</p>
              <p
                v-if="store.syncResult.stocks_updated > 0"
                class="mt-0.5 text-xs text-ink-ghost"
              >
                {{ store.syncResult.stocks_updated }} stocks updated
              </p>
            </div>
          </div>
        </div>
      </AppCard>

      <!-- Backfill -->
      <AppCard>
        <div class="mb-4 flex items-center gap-2">
          <CalendarRange class="h-4 w-4 text-ink-dim" />
          <h2 class="font-medium text-ink">Backfill Date Range</h2>
        </div>

        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-dim">From</label>
              <input
                v-model="backfillFrom"
                type="date"
                class="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-medium text-ink-dim">To</label>
              <input
                v-model="backfillTo"
                type="date"
                class="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
              />
            </div>
          </div>

          <AppButton
            :loading="store.backfillLoading"
            :disabled="!backfillFrom || !backfillTo"
            @click="runBackfill"
          >
            <CalendarRange class="h-4 w-4" />
            Run Backfill
          </AppButton>

          <!-- Backfill summary -->
          <div v-if="store.backfillResult" class="flex flex-col gap-3">
            <div class="grid grid-cols-3 gap-2 text-center">
              <div class="rounded-lg border border-gain/20 bg-gain/5 p-3">
                <p class="text-lg font-semibold tabular-nums text-gain">
                  {{ store.backfillResult.success }}
                </p>
                <p class="mt-0.5 text-xs text-ink-ghost">Success</p>
              </div>
              <div class="rounded-lg border border-gold/20 bg-gold/5 p-3">
                <p class="text-lg font-semibold tabular-nums text-gold">
                  {{ store.backfillResult.skipped }}
                </p>
                <p class="mt-0.5 text-xs text-ink-ghost">Skipped</p>
              </div>
              <div class="rounded-lg border border-loss/20 bg-loss/5 p-3">
                <p class="text-lg font-semibold tabular-nums text-loss">
                  {{ store.backfillResult.failed }}
                </p>
                <p class="mt-0.5 text-xs text-ink-ghost">Failed</p>
              </div>
            </div>

            <!-- Per-day detail -->
            <div class="max-h-48 overflow-y-auto rounded-lg border border-border">
              <div
                v-for="(detail, date) in store.backfillResult.detail"
                :key="date"
                class="flex items-center justify-between border-b border-border/50 px-3 py-2 last:border-0"
              >
                <span class="font-mono text-xs text-ink-dim">{{ date }}</span>
                <div class="flex items-center gap-2">
                  <span
                    v-if="detail.stocks_updated > 0"
                    class="text-xs text-ink-ghost"
                  >{{ detail.stocks_updated }} stocks</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                    :class="statusConfig[detail.status].classes"
                  >
                    {{ detail.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Sync Logs -->
    <div>
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Clock class="h-4 w-4 text-ink-dim" />
          <h2 class="font-medium text-ink">Sync History</h2>
        </div>
        <div class="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <button
            v-for="opt in [
              { value: '' as const, label: 'All' },
              { value: 'success' as const, label: 'Success' },
              { value: 'skipped' as const, label: 'Skipped' },
              { value: 'failed' as const, label: 'Failed' },
            ]"
            :key="opt.value"
            class="cursor-pointer rounded px-3 py-1 text-sm transition-colors"
            :class="
              store.logsStatusFilter === opt.value
                ? 'bg-elevated text-ink font-medium'
                : 'text-ink-dim hover:text-ink'
            "
            @click="store.setLogsStatus(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <AppCard :padding="false">
        <div v-if="store.logsLoading" class="flex items-center justify-center py-12">
          <Loader2 class="h-6 w-6 animate-spin text-ink-dim" />
        </div>

        <div v-else-if="store.logs.length === 0" class="py-12 text-center text-sm text-ink-dim">
          No sync logs found.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-border text-left text-xs uppercase tracking-wide text-ink-ghost">
                <th class="px-4 py-3">Date</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Stocks Updated</th>
                <th class="px-4 py-3">Message</th>
                <th class="px-4 py-3">Triggered By</th>
                <th class="px-4 py-3">Synced At</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in store.logs"
                :key="log.id"
                class="border-b border-border/50 transition-colors hover:bg-elevated/40"
              >
                <td class="px-4 py-3 font-mono text-ink">{{ log.price_date }}</td>
                <td class="px-4 py-3">
                  <span
                    class="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                    :class="statusConfig[log.status].classes"
                  >
                    {{ log.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right tabular-nums text-ink-dim">
                  {{ log.stocks_updated }}
                </td>
                <td class="px-4 py-3 text-ink-dim">{{ log.message }}</td>
                <td class="px-4 py-3">
                  <span
                    class="rounded px-2 py-0.5 text-xs"
                    :class="
                      log.triggered_by === 'scheduler'
                        ? 'bg-elevated text-ink-dim'
                        : 'bg-gold/10 text-gold'
                    "
                  >
                    {{ log.triggered_by }}
                  </span>
                </td>
                <td class="px-4 py-3 text-xs text-ink-ghost">{{ formatDate(log.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="store.logsPagination.last_page > 1" class="border-t border-border px-4 py-3">
          <AppPaginate
            :current-page="store.logsPagination.current_page"
            :last-page="store.logsPagination.last_page"
            :total="store.logsPagination.total"
            @page-change="store.goToLogsPage"
          />
        </div>
      </AppCard>
    </div>
  </div>
</template>
