<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue'
import { Search, ToggleLeft, ToggleRight, Loader2, Pencil, X } from 'lucide-vue-next'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppPaginate from '@/components/ui/AppPaginate.vue'
import { useAdminStocksStore } from '@/stores/useAdminStocksStore'
import type { StockMasterRecord } from '@/types/admin'

const store = useAdminStocksStore()

// Search
const searchDraft = ref('')
let searchTimer: ReturnType<typeof setTimeout>
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => store.search(searchDraft.value), 350)
}

// Edit modal
const editingStock = ref<StockMasterRecord | null>(null)
const editForm = reactive({
  company_name: '',
  nse_symbol: '',
  bse_symbol: '',
  bse_code: '',
  sector: '',
  industry: '',
})
const editLoading = ref(false)

function openEdit(stock: StockMasterRecord) {
  editingStock.value = stock
  editForm.company_name = stock.company_name
  editForm.nse_symbol = stock.nse_symbol ?? ''
  editForm.bse_symbol = stock.bse_symbol ?? ''
  editForm.bse_code = stock.bse_code ?? ''
  editForm.sector = stock.sector ?? ''
  editForm.industry = stock.industry ?? ''
}

function closeEdit() {
  editingStock.value = null
}

async function saveEdit() {
  if (!editingStock.value) return
  editLoading.value = true
  try {
    await store.updateStock(editingStock.value.id, {
      company_name: editForm.company_name,
      nse_symbol: editForm.nse_symbol || undefined,
      bse_symbol: editForm.bse_symbol || undefined,
      bse_code: editForm.bse_code || undefined,
      sector: editForm.sector || undefined,
      industry: editForm.industry || undefined,
    })
    closeEdit()
  } finally {
    editLoading.value = false
  }
}

onMounted(() => store.fetchStocks())
</script>

<template>
  <div class="p-6">
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold text-ink">Stock Master</h1>
        <p class="mt-0.5 text-sm text-ink-dim">
          {{ store.meta.total.toLocaleString() }} stocks total
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative w-72">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
        <input
          v-model="searchDraft"
          type="text"
          placeholder="Search symbol, company, ISIN…"
          class="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-ghost focus:border-gold focus:outline-none"
          @input="onSearch"
        />
      </div>

      <!-- Status filter -->
      <div class="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
        <button
          v-for="opt in [
            { value: '' as const, label: 'All' },
            { value: 'active' as const, label: 'Active' },
            { value: 'inactive' as const, label: 'Inactive' },
          ]"
          :key="opt.value"
          class="cursor-pointer rounded px-3 py-1 text-sm transition-colors"
          :class="
            store.statusFilter === opt.value
              ? 'bg-elevated text-ink font-medium'
              : 'text-ink-dim hover:text-ink'
          "
          @click="store.setStatus(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Holders filter -->
      <div class="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
        <button
          v-for="opt in [
            { value: null, label: 'Any holders' },
            { value: true, label: 'Has holders' },
            { value: false, label: 'No holders' },
          ]"
          :key="String(opt.value)"
          class="cursor-pointer rounded px-3 py-1 text-sm transition-colors"
          :class="
            store.hasHoldersFilter === opt.value
              ? 'bg-elevated text-ink font-medium'
              : 'text-ink-dim hover:text-ink'
          "
          @click="store.setHasHolders(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Page size -->
      <div class="flex items-center gap-2 ml-auto">
        <span class="text-xs text-ink-ghost">Per page</span>
        <select
          :value="store.pageSize"
          class="rounded-lg border border-border bg-surface px-2 py-1.5 text-sm text-ink focus:border-gold focus:outline-none"
          @change="store.setPageSize(Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="n in [50, 100, 200]" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <AppCard :padding="false">
      <div v-if="store.loading" class="flex items-center justify-center py-16">
        <Loader2 class="h-6 w-6 animate-spin text-ink-dim" />
      </div>

      <div v-else-if="store.stocks.length === 0" class="py-16 text-center text-sm text-ink-dim">
        No stocks found.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border text-left text-xs uppercase tracking-wide text-ink-ghost">
              <th class="px-4 py-3">NSE</th>
              <th class="px-4 py-3">BSE</th>
              <th class="px-4 py-3">BSE Code</th>
              <th class="px-4 py-3">Company</th>
              <th class="px-4 py-3">Sector</th>
              <th class="px-4 py-3">Industry</th>
              <th class="px-4 py-3">ISIN</th>
              <th class="px-4 py-3 text-right">Holders</th>
              <th class="px-4 py-3 text-right">Total Shares</th>
              <th class="px-4 py-3 text-center">Status</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="stock in store.stocks"
              :key="stock.id"
              class="border-b border-border/50 transition-colors hover:bg-elevated/40"
            >
              <td class="px-4 py-3 font-mono font-medium text-ink">
                {{ stock.nse_symbol ?? '—' }}
              </td>
              <td class="px-4 py-3 font-mono text-ink-dim">
                {{ stock.bse_symbol ?? '—' }}
              </td>
              <td class="px-4 py-3 font-mono text-ink-dim">
                {{ stock.bse_code ?? '—' }}
              </td>
              <td class="px-4 py-3 text-ink">{{ stock.company_name }}</td>
              <td class="px-4 py-3 text-ink-dim">{{ stock.sector ?? '—' }}</td>
              <td class="px-4 py-3 text-ink-dim">{{ stock.industry ?? '—' }}</td>
              <td class="px-4 py-3 font-mono text-xs text-ink-ghost">{{ stock.isin }}</td>
              <td class="px-4 py-3 text-right tabular-nums text-ink-dim">
                {{ stock.holder_count }}
              </td>
              <td class="px-4 py-3 text-right tabular-nums text-ink-dim">
                {{ parseFloat(stock.total_shares).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-center">
                <button
                  class="inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                  :class="
                    stock.is_active
                      ? 'bg-gain/10 text-gain hover:bg-gain/20'
                      : 'bg-loss/10 text-loss hover:bg-loss/20'
                  "
                  :title="stock.is_active ? 'Click to disable' : 'Click to enable'"
                  @click="store.toggleActive(stock.id)"
                >
                  <ToggleRight v-if="stock.is_active" class="h-3.5 w-3.5" />
                  <ToggleLeft v-else class="h-3.5 w-3.5" />
                  {{ stock.is_active ? 'Active' : 'Inactive' }}
                </button>
              </td>
              <td class="px-4 py-3">
                <button
                  class="cursor-pointer rounded p-1.5 text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
                  title="Edit stock"
                  @click="openEdit(stock)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="store.meta.last_page > 1" class="border-t border-border px-4 py-3">
        <AppPaginate
          :current-page="store.meta.current_page"
          :last-page="store.meta.last_page"
          :total="store.meta.total"
          @page-change="store.goToPage"
        />
      </div>
    </AppCard>
  </div>

  <!-- Edit Modal -->
  <Teleport to="body">
    <div
      v-if="editingStock"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="closeEdit"
    >
      <div class="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h2 class="font-semibold text-ink">Edit Stock</h2>
            <p class="mt-0.5 text-xs text-ink-ghost font-mono">{{ editingStock.isin }}</p>
          </div>
          <button
            class="cursor-pointer rounded p-1.5 text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
            @click="closeEdit"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="flex flex-col gap-4">
          <AppInput v-model="editForm.company_name" label="Company Name" placeholder="Infosys Ltd" />
          <div class="grid grid-cols-2 gap-3">
            <AppInput v-model="editForm.nse_symbol" label="NSE Symbol" placeholder="INFY" />
            <AppInput v-model="editForm.bse_symbol" label="BSE Symbol" placeholder="INFY" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <AppInput v-model="editForm.bse_code" label="BSE Code" placeholder="500209" />
            <AppInput v-model="editForm.sector" label="Sector" placeholder="IT" />
          </div>
          <AppInput v-model="editForm.industry" label="Industry" placeholder="Software" />
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <AppButton variant="ghost" @click="closeEdit">Cancel</AppButton>
          <AppButton :loading="editLoading" @click="saveEdit">Save</AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>
