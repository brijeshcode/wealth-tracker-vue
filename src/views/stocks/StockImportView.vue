<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-vue-next'
import { useStockImport } from '@/composables/useStockImport'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ImportErrorTable from '@/components/stocks/ImportErrorTable.vue'
import ImportPreviewTable from '@/components/stocks/ImportPreviewTable.vue'
import type { ImportBroker } from '@/types/stocks'

const router = useRouter()
const imp = useStockImport()

// ── Broker options ────────────────────────────────────────────────────────────

const brokers: { value: ImportBroker; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'zerodha', label: 'Zerodha' },
  { value: 'groww', label: 'Groww' },
  { value: 'upstox', label: 'Upstox' },
]

const brokerNotes: Record<ImportBroker, string> = {
  standard:
    'CSV columns must exactly match: transaction_date, symbol, exchange, type, quantity, price_per_unit, platform, reference',
  zerodha: 'Export from Console → Reports → Tradebook. F&O rows are filtered out automatically.',
  groww:
    'Export CSV from the Groww app → My Investments → P&L. Only "Executed" orders are imported.',
  upstox:
    'Export Excel from Upstox → Reports → Trade History. Replace abbreviated company names with correct NSE ticker symbols before uploading (e.g. PUNJAB NATBK → PNBBANK).',
}

// ── File selection ────────────────────────────────────────────────────────────

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['.csv', '.xlsx', '.xls']
const fileError = ref('')
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const selectFile = (f: File | undefined | null) => {
  fileError.value = ''
  if (!f) return
  const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase()
  if (!ACCEPTED.includes(ext)) {
    fileError.value = 'Only .csv, .xlsx and .xls files are supported.'
    return
  }
  if (f.size > MAX_SIZE) {
    fileError.value = 'File is larger than 10 MB.'
    return
  }
  imp.file.value = f
}

const onDrop = (e: DragEvent) => {
  dragOver.value = false
  selectFile(e.dataTransfer?.files[0])
}

const onFileInput = (e: Event) => {
  selectFile((e.target as HTMLInputElement).files?.[0])
  ;(e.target as HTMLInputElement).value = ''
}

const fileSizeLabel = computed(() => {
  const f = imp.file.value
  if (!f) return ''
  return f.size < 1024 * 1024
    ? `${(f.size / 1024).toFixed(1)} KB`
    : `${(f.size / (1024 * 1024)).toFixed(1)} MB`
})
</script>

<template>
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button
        class="rounded-lg p-1.5 text-ink-ghost transition-colors hover:bg-elevated hover:text-ink"
        title="Back to stocks"
        @click="router.push('/stocks')"
      >
        <ArrowLeft class="h-5 w-5" />
      </button>
      <div>
        <h1 class="text-xl font-semibold text-ink">Import Transactions</h1>
        <p class="mt-0.5 text-sm text-ink-dim">
          Upload a broker file, review the rows, then import
        </p>
      </div>
    </div>

    <!-- ── Upload step ─────────────────────────────────────────────────── -->
    <template v-if="imp.step.value === 'upload'">
      <AppCard class="max-w-2xl">
        <div class="flex flex-col gap-5">
          <!-- Broker -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-dim">Broker</label>
            <select
              v-model="imp.broker.value"
              class="w-full rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
            >
              <option v-for="b in brokers" :key="b.value" :value="b.value">{{ b.label }}</option>
            </select>
            <p class="text-xs text-ink-ghost">{{ brokerNotes[imp.broker.value] }}</p>
          </div>

          <!-- File drop zone -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-medium text-ink-dim">File</label>
            <div
              v-if="!imp.file.value"
              class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 transition-colors"
              :class="
                dragOver ? 'border-gold bg-gold/5' : 'border-border hover:border-ink-ghost'
              "
              @click="fileInput?.click()"
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="onDrop"
            >
              <UploadCloud class="h-8 w-8 text-ink-ghost" />
              <p class="text-sm text-ink-dim">
                Drop your file here or <span class="text-gold">browse</span>
              </p>
              <p class="text-xs text-ink-ghost">.csv, .xlsx or .xls — max 10 MB</p>
            </div>
            <div
              v-else
              class="flex items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3"
            >
              <FileSpreadsheet class="h-5 w-5 shrink-0 text-gold" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-ink">{{ imp.file.value.name }}</p>
                <p class="text-xs text-ink-ghost">{{ fileSizeLabel }}</p>
              </div>
              <button
                class="rounded p-1 text-ink-ghost hover:text-ink"
                title="Remove file"
                @click="imp.file.value = null"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept=".csv,.xlsx,.xls"
              class="hidden"
              @change="onFileInput"
            />
            <p v-if="fileError" class="text-xs text-loss">{{ fileError }}</p>
          </div>

          <!-- Preview button -->
          <AppButton
            :disabled="!imp.file.value"
            :loading="imp.previewing.value"
            @click="imp.preview()"
          >
            Preview Import
          </AppButton>
        </div>
      </AppCard>

      <!-- Validation errors -->
      <ImportErrorTable :errors="imp.rowErrors.value" />
    </template>

    <!-- ── Preview step ────────────────────────────────────────────────── -->
    <template v-else-if="imp.step.value === 'preview' && imp.summary.value">
      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4">
        <AppCard>
          <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Total Rows</p>
          <p class="mt-1.5 text-2xl font-semibold tabular-nums text-ink">
            {{ imp.summary.value.total }}
          </p>
        </AppCard>
        <AppCard>
          <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Buy</p>
          <p class="mt-1.5 text-2xl font-semibold tabular-nums text-gain">
            {{ imp.summary.value.buy }}
          </p>
        </AppCard>
        <AppCard>
          <p class="text-xs font-medium uppercase tracking-wide text-ink-ghost">Sell</p>
          <p class="mt-1.5 text-2xl font-semibold tabular-nums text-loss">
            {{ imp.summary.value.sell }}
          </p>
        </AppCard>
      </div>

      <!-- All rows duplicate — blocking error -->
      <div
        v-if="imp.allRowsDuplicate.value"
        class="overflow-hidden rounded-xl border border-loss/40"
      >
        <div class="flex items-center gap-2 border-b border-loss/40 bg-loss/10 px-4 py-3">
          <AlertCircle class="h-4 w-4 shrink-0 text-loss" />
          <p class="text-sm font-medium text-loss">
            All {{ imp.definiteDuplicates.value.length }} transaction{{
              imp.definiteDuplicates.value.length === 1 ? '' : 's'
            }}
            already exist — nothing to import
          </p>
        </div>
        <ul class="divide-y divide-border">
          <li
            v-for="(w, i) in imp.definiteDuplicates.value"
            :key="i"
            class="px-4 py-2.5 text-xs text-ink-dim"
          >
            Row {{ w.row }}: {{ w.message }}
          </li>
        </ul>
      </div>

      <!-- Partial duplicates — will be skipped -->
      <div
        v-else-if="imp.hasDefinitiveDuplicates.value"
        class="overflow-hidden rounded-xl border border-amber-500/40"
      >
        <div class="flex items-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3">
          <AlertTriangle class="h-4 w-4 shrink-0 text-amber-500" />
          <p class="text-sm font-medium text-amber-600 dark:text-amber-400">
            {{ imp.definiteDuplicates.value.length }} row{{
              imp.definiteDuplicates.value.length === 1 ? '' : 's'
            }}
            will be skipped — {{ imp.importableRows.value.length }} new transaction{{
              imp.importableRows.value.length === 1 ? '' : 's'
            }}
            will be imported
          </p>
        </div>
        <ul class="divide-y divide-border">
          <li
            v-for="(w, i) in imp.definiteDuplicates.value"
            :key="i"
            class="px-4 py-2.5 text-xs text-ink-dim"
          >
            Row {{ w.row }}: {{ w.message }}
          </li>
        </ul>
      </div>

      <!-- Regular warnings banner / ready state -->
      <template v-else>
        <div
          v-if="imp.warnings.value.length"
          class="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3"
        >
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 shrink-0 text-amber-500" />
            <p class="text-sm font-medium text-amber-600 dark:text-amber-400">
              {{ imp.warnings.value.length }} warning{{
                imp.warnings.value.length === 1 ? '' : 's'
              }}
              — review before importing
            </p>
          </div>
          <ul class="mt-2 space-y-1 pl-6">
            <li
              v-for="(w, i) in imp.warnings.value"
              :key="i"
              class="text-xs text-amber-600/90 dark:text-amber-400/90"
            >
              Row {{ w.row }}: {{ w.message }}
            </li>
          </ul>
        </div>
        <div
          v-else
          class="flex items-center gap-2 rounded-xl border border-gain/40 bg-gain/10 px-4 py-3"
        >
          <CheckCircle2 class="h-4 w-4 shrink-0 text-gain" />
          <p class="text-sm font-medium text-gain">No warnings — ready to import</p>
        </div>
      </template>

      <!-- Confirm 422 errors -->
      <ImportErrorTable :errors="imp.rowErrors.value" />

      <!-- Editable rows -->
      <ImportPreviewTable :rows="imp.rows.value" />

      <!-- Footer actions -->
      <div class="flex justify-end gap-3">
        <AppButton variant="ghost" @click="imp.reset()">Back</AppButton>
        <AppButton
          :disabled="imp.allRowsDuplicate.value"
          :loading="imp.confirming.value"
          @click="imp.confirmImport(false)"
        >
          Import {{ imp.importableRows.value.length }} transaction{{
            imp.importableRows.value.length === 1 ? '' : 's'
          }}
        </AppButton>
      </div>
    </template>

    <!-- ── Duplicate dialog ────────────────────────────────────────────── -->
    <Teleport to="body">
      <div
        v-if="imp.showDuplicateDialog.value"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        @click.self="imp.showDuplicateDialog.value = false"
      >
        <div class="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
          <div class="flex items-center gap-2">
            <AlertTriangle class="h-5 w-5 shrink-0 text-amber-500" />
            <h2 class="text-base font-semibold text-ink">
              {{ imp.duplicateWarnings.value.length }} duplicate{{
                imp.duplicateWarnings.value.length === 1 ? '' : 's'
              }}
              found — import anyway?
            </h2>
          </div>
          <ul class="mt-3 max-h-48 space-y-1.5 overflow-y-auto text-sm text-ink-dim">
            <li v-for="(w, i) in imp.duplicateWarnings.value" :key="i">
              Row {{ w.row }}: {{ w.message }}
            </li>
          </ul>
          <div class="mt-5 flex justify-end gap-3">
            <AppButton variant="ghost" @click="imp.showDuplicateDialog.value = false">
              Cancel
            </AppButton>
            <AppButton :loading="imp.confirming.value" @click="imp.confirmImport(true)">
              Import anyway
            </AppButton>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
