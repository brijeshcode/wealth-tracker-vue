<script setup lang="ts">
import { ref, reactive } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { adminService } from '@/services/adminService'
import type { StockUpsertPayload, StockMasterRecord } from '@/types/admin'

const form = reactive<StockUpsertPayload>({
  isin: '',
  company_name: '',
  nse_symbol: '',
  bse_symbol: '',
  bse_code: '',
  sector: '',
  industry: '',
  is_active: true,
})

const submitting = ref(false)
const successStock = ref<StockMasterRecord | null>(null)
const wasCreated = ref(false)
const fieldErrors = ref<Record<string, string>>({})
const generalError = ref('')

const submit = async () => {
  submitting.value = true
  fieldErrors.value = {}
  generalError.value = ''
  successStock.value = null

  const payload: StockUpsertPayload = {
    isin: form.isin,
    company_name: form.company_name,
    ...(form.nse_symbol && { nse_symbol: form.nse_symbol }),
    ...(form.bse_symbol && { bse_symbol: form.bse_symbol }),
    ...(form.bse_code && { bse_code: form.bse_code }),
    ...(form.sector && { sector: form.sector }),
    ...(form.industry && { industry: form.industry }),
    is_active: form.is_active,
  }

  try {
    const result = await adminService.upsertStock(payload)
    successStock.value = result.stock
    wasCreated.value = result.created
  } catch (err) {
    const data = (err as any)?.response?.data
    if (data?.errors && typeof data.errors === 'object') {
      fieldErrors.value = Object.fromEntries(
        Object.entries(data.errors as Record<string, string[]>).map(([k, v]) => [k, v[0]]),
      )
    } else {
      generalError.value = data?.message ?? 'Something went wrong.'
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <h1 class="text-xl font-semibold text-ink">Add / Edit Stock</h1>
      <p class="mt-0.5 text-sm text-ink-dim">
        Upserts by ISIN. Use this for ETFs or any stock missing from the NSE CSV.
      </p>
    </div>

    <!-- Success banner -->
    <div
      v-if="successStock"
      class="flex items-center gap-2 rounded-xl border border-gain/40 bg-gain/10 px-4 py-3"
    >
      <CheckCircle2 class="h-4 w-4 shrink-0 text-gain" />
      <p class="text-sm font-medium text-gain">
        Stock {{ wasCreated ? 'created' : 'updated' }} — {{ successStock.company_name }}
      </p>
    </div>

    <!-- General error -->
    <div
      v-if="generalError"
      class="rounded-xl border border-loss/40 bg-loss/10 px-4 py-3 text-sm text-loss"
    >
      {{ generalError }}
    </div>

    <AppCard class="max-w-2xl">
      <form class="flex flex-col gap-4" @submit.prevent="submit">
        <!-- Required fields -->
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.isin"
            label="ISIN *"
            placeholder="INF204KB14I2"
            :error="fieldErrors.isin"
          />
          <AppInput
            v-model="form.company_name"
            label="Company Name *"
            placeholder="Nippon India ETF Nifty 50 BeES"
            :error="fieldErrors.company_name"
          />
        </div>

        <!-- Optional fields -->
        <div class="grid grid-cols-2 gap-4">
          <AppInput
            v-model="form.nse_symbol"
            label="NSE Symbol"
            placeholder="NIFTYBEES"
            :error="fieldErrors.nse_symbol"
          />
          <AppInput
            v-model="form.bse_symbol"
            label="BSE Symbol"
            placeholder="NIFTYBEES"
            :error="fieldErrors.bse_symbol"
          />
        </div>

        <div class="grid grid-cols-3 gap-4">
          <AppInput
            v-model="form.bse_code"
            label="BSE Code"
            placeholder="500325"
            :error="fieldErrors.bse_code"
          />
          <AppInput
            v-model="form.sector"
            label="Sector"
            placeholder="ETF"
            :error="fieldErrors.sector"
          />
          <AppInput
            v-model="form.industry"
            label="Industry"
            placeholder="Index ETF"
            :error="fieldErrors.industry"
          />
        </div>

        <!-- Active toggle -->
        <div class="flex items-center gap-3">
          <button
            type="button"
            role="switch"
            :aria-checked="form.is_active"
            class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            :class="form.is_active ? 'bg-gold' : 'bg-border'"
            @click="form.is_active = !form.is_active"
          >
            <span
              class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform"
              :class="form.is_active ? 'translate-x-4' : 'translate-x-0'"
            />
          </button>
          <label class="text-sm text-ink-dim">Active</label>
        </div>

        <div class="pt-1">
          <AppButton
            type="submit"
            :loading="submitting"
            :disabled="!form.isin || !form.company_name"
          >
            Save Stock
          </AppButton>
        </div>
      </form>
    </AppCard>
  </div>
</template>
