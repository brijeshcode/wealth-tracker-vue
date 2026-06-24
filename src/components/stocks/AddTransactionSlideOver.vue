<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { X, Search } from 'lucide-vue-next'
import { useStocksStore } from '@/stores/useStocksStore'
import { usePlatformsStore } from '@/stores/usePlatformsStore'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import type { CreateTransactionPayload, StockMaster } from '@/types/stocks'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const stockStore = useStocksStore()
const platformStore = usePlatformsStore()

onMounted(() => platformStore.fetchPlatforms())

// ── Form state ────────────────────────────────────────────────────────────────

const selectedStock = ref<StockMaster | null>(null)
const stockQuery = ref('')
const showDropdown = ref(false)
const platformId = ref<number | ''>('')
const exchange = ref<'NSE' | 'BSE'>('NSE')
const txType = ref<'buy' | 'sell'>('buy')
const quantity = ref('')
const pricePerUnit = ref('')
const transactionDate = ref(new Date().toISOString().split('T')[0])
const reference = ref('')
const errors = ref<Record<string, string[]>>({})
const submitting = ref(false)

// ── Stock search ──────────────────────────────────────────────────────────────

let searchTimeout: ReturnType<typeof setTimeout>

const onStockInput = (q: string) => {
  stockQuery.value = q
  selectedStock.value = null
  errors.value = { ...errors.value, stock_id: [] }
  clearTimeout(searchTimeout)
  if (q.length >= 2) {
    searchTimeout = setTimeout(() => {
      stockStore.searchStocks(q)
      showDropdown.value = true
    }, 300)
  } else {
    showDropdown.value = false
    stockStore.clearStockSearch()
  }
}

const selectStock = (stock: StockMaster) => {
  selectedStock.value = stock
  stockQuery.value = stock.company_name
  showDropdown.value = false
  stockStore.clearStockSearch()
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

const reset = () => {
  selectedStock.value = null
  stockQuery.value = ''
  showDropdown.value = false
  platformId.value = ''
  exchange.value = 'NSE'
  txType.value = 'buy'
  quantity.value = ''
  pricePerUnit.value = ''
  transactionDate.value = new Date().toISOString().split('T')[0]
  reference.value = ''
  errors.value = {}
  submitting.value = false
  stockStore.clearStockSearch()
}

watch(
  () => props.modelValue,
  (open) => { if (!open) reset() },
)

const close = () => emit('update:modelValue', false)

// ── Submit ────────────────────────────────────────────────────────────────────

const submit = async () => {
  errors.value = {}

  if (!selectedStock.value) {
    errors.value.stock_id = ['Please select a stock.']
    return
  }
  if (!platformId.value) {
    errors.value.platform_id = ['Please select a platform.']
    return
  }

  submitting.value = true
  try {
    const payload: CreateTransactionPayload = {
      stock_id: selectedStock.value.id,
      platform_id: Number(platformId.value),
      exchange: exchange.value,
      type: txType.value,
      quantity: Number(quantity.value),
      price_per_unit: Number(pricePerUnit.value),
      transaction_date: transactionDate.value as string,
      reference: reference.value || null,
      source: 'manual',
    }
    await stockStore.createTransaction(payload)
    // push.success triggered by axios interceptor
    close()
  } catch (err: any) {
    const apiErrors = err?.response?.data?.errors
    if (apiErrors) {
      errors.value = apiErrors
    }
    // push.error for non-422 triggered by axios interceptor
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        @click="close"
      />
    </Transition>

    <!-- Panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-200 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl"
      >
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 class="text-base font-semibold text-ink">Add Transaction</h2>
          <button
            class="rounded-lg p-1.5 text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
            @click="close"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Form -->
        <form class="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5" @submit.prevent="submit">

          <!-- Stock search -->
          <div class="relative flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-dim">Stock</label>
            <div class="relative">
              <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-ghost" />
              <input
                :value="stockQuery"
                type="text"
                placeholder="Search by name or symbol…"
                autocomplete="off"
                class="w-full rounded-lg border bg-elevated py-2.5 pl-9 pr-3 text-sm text-ink placeholder-ink-ghost outline-none transition-colors focus:ring-1"
                :class="errors.stock_id?.length ? 'border-loss focus:border-loss focus:ring-loss' : 'border-border focus:border-gold focus:ring-gold'"
                :disabled="!!selectedStock"
                @input="onStockInput(($event.target as HTMLInputElement).value)"
              />
              <button
                v-if="selectedStock"
                type="button"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-ink-ghost hover:text-ink"
                @click="() => { selectedStock = null; stockQuery = '' }"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <!-- Dropdown -->
            <ul
              v-if="showDropdown && stockStore.stockSearchResults.length"
              class="absolute top-full z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
            >
              <li
                v-for="s in stockStore.stockSearchResults"
                :key="s.id"
                class="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm hover:bg-elevated"
                @click="selectStock(s)"
              >
                <span class="font-medium text-ink">{{ s.company_name }}</span>
                <span v-if="s.nse_symbol" class="font-mono text-xs text-ink-ghost">{{ s.nse_symbol }}</span>
              </li>
            </ul>
            <p v-if="errors.stock_id?.length" class="text-xs text-loss">{{ errors.stock_id[0] }}</p>
          </div>

          <!-- Platform -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-dim">Platform</label>
            <select
              v-model="platformId"
              class="w-full rounded-lg border bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:ring-1"
              :class="errors.platform_id?.length ? 'border-loss focus:border-loss focus:ring-loss' : 'border-border focus:border-gold focus:ring-gold'"
            >
              <option value="" disabled>Select platform…</option>
              <option v-for="p in platformStore.platforms" :key="p.id" :value="p.id">
                {{ p.display_name }}
              </option>
            </select>
            <p v-if="errors.platform_id?.length" class="text-xs text-loss">{{ errors.platform_id[0] }}</p>
          </div>

          <!-- Exchange -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-dim">Exchange</label>
            <div class="flex gap-2">
              <label
                v-for="ex in (['NSE', 'BSE'] as const)"
                :key="ex"
                class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium transition-colors"
                :class="exchange === ex ? 'border-gold bg-gold/10 text-gold' : 'border-border text-ink-dim hover:bg-elevated'"
              >
                <input v-model="exchange" type="radio" :value="ex" class="sr-only" />
                {{ ex }}
              </label>
            </div>
          </div>

          <!-- Type -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-dim">Type</label>
            <div class="flex gap-2">
              <label
                v-for="t in (['buy', 'sell'] as const)"
                :key="t"
                class="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium capitalize transition-colors"
                :class="txType === t ? 'border-gold bg-gold/10 text-gold' : 'border-border text-ink-dim hover:bg-elevated'"
              >
                <input v-model="txType" type="radio" :value="t" class="sr-only" />
                {{ t }}
              </label>
            </div>
          </div>

          <!-- Quantity -->
          <AppInput
            v-model="quantity"
            label="Quantity"
            type="number"
            placeholder="e.g. 10"
            :error="errors.quantity?.[0]"
          />

          <!-- Price per unit -->
          <AppInput
            v-model="pricePerUnit"
            label="Price per Unit (₹)"
            type="number"
            placeholder="e.g. 1500.50"
            :error="errors.price_per_unit?.[0]"
          />

          <!-- Date -->
          <AppInput
            v-model="transactionDate"
            label="Transaction Date"
            type="date"
            :error="errors.transaction_date?.[0]"
          />

          <!-- Reference (optional) -->
          <AppInput
            v-model="reference"
            label="Reference (optional)"
            placeholder="Order ID, note…"
            :error="errors.reference?.[0]"
          />
        </form>

        <!-- Footer -->
        <div class="flex gap-3 border-t border-border px-6 py-4">
          <AppButton variant="ghost" class="flex-1" @click="close">Cancel</AppButton>
          <AppButton class="flex-1" :loading="submitting" @click="submit">Save Transaction</AppButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
