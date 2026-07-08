<script setup lang="ts">
import { ref, computed } from 'vue'
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'
import AppCard from '@/components/ui/AppCard.vue'
import { adminService } from '@/services/adminService'
import type { NseImportResult } from '@/types/admin'

const MAX_SIZE = 10 * 1024 * 1024
const ACCEPTED = ['.csv', '.txt']

const file = ref<File | null>(null)
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const fileError = ref('')
const importing = ref(false)
const result = ref<NseImportResult | null>(null)
const importError = ref('')

const fileSizeLabel = computed(() => {
  if (!file.value) return ''
  const s = file.value.size
  return s < 1024 * 1024
    ? `${(s / 1024).toFixed(1)} KB`
    : `${(s / (1024 * 1024)).toFixed(1)} MB`
})

const selectFile = (f: File | undefined | null) => {
  fileError.value = ''
  importError.value = ''
  result.value = null
  if (!f) return
  const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase()
  if (!ACCEPTED.includes(ext)) {
    fileError.value = 'Only .csv and .txt files are supported.'
    return
  }
  if (f.size > MAX_SIZE) {
    fileError.value = 'File is larger than 10 MB.'
    return
  }
  file.value = f
}

const onDrop = (e: DragEvent) => {
  dragOver.value = false
  selectFile(e.dataTransfer?.files[0])
}

const onFileInput = (e: Event) => {
  selectFile((e.target as HTMLInputElement).files?.[0])
  ;(e.target as HTMLInputElement).value = ''
}

const reset = () => {
  file.value = null
  result.value = null
  importError.value = ''
  fileError.value = ''
}

const runImport = async () => {
  if (!file.value) return
  importing.value = true
  importError.value = ''
  try {
    result.value = await adminService.importNse(file.value)
  } catch (err) {
    const data = (err as any)?.response?.data
    importError.value = data?.message ?? 'Import failed — please try again.'
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <h1 class="text-xl font-semibold text-ink">NSE Equity Import</h1>
      <p class="mt-0.5 text-sm text-ink-dim">
        Upload EQUITY_L.csv from NSE India to refresh the stock master. Safe to re-run anytime.
      </p>
      <a
        href="https://www.nseindia.com/market-data/securities-available-for-trading"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-2 inline-flex items-center gap-1.5 text-sm text-gold hover:underline"
      >
        <ExternalLink class="h-3.5 w-3.5" />
        Download EQUITY_L.csv from NSE India
      </a>
    </div>

    <!-- Result -->
    <template v-if="result">
      <AppCard>
        <div class="mb-4 flex items-center gap-2">
          <CheckCircle2 class="h-5 w-5 text-gain" />
          <p class="font-medium text-gain">NSE stock master updated</p>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-lg border border-border bg-elevated p-4 text-center">
            <p class="text-2xl font-semibold tabular-nums text-ink">{{ result.inserted }}</p>
            <p class="mt-1 text-xs uppercase tracking-wide text-ink-ghost">Inserted</p>
          </div>
          <div class="rounded-lg border border-border bg-elevated p-4 text-center">
            <p class="text-2xl font-semibold tabular-nums text-ink">{{ result.updated }}</p>
            <p class="mt-1 text-xs uppercase tracking-wide text-ink-ghost">Updated</p>
          </div>
          <div class="rounded-lg border border-border bg-elevated p-4 text-center">
            <p class="text-2xl font-semibold tabular-nums text-ink">{{ result.skipped }}</p>
            <p class="mt-1 text-xs uppercase tracking-wide text-ink-ghost">Skipped</p>
          </div>
        </div>
      </AppCard>
      <AppButton variant="ghost" @click="reset">Upload another file</AppButton>
    </template>

    <!-- Upload form -->
    <template v-else>
      <AppCard class="max-w-xl">
        <div class="flex flex-col gap-4">
          <!-- Drop zone -->
          <div
            v-if="!file"
            class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-10 transition-colors"
            :class="dragOver ? 'border-gold bg-gold/5' : 'border-border hover:border-ink-ghost'"
            @click="fileInput?.click()"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="onDrop"
          >
            <UploadCloud class="h-8 w-8 text-ink-ghost" />
            <p class="text-sm text-ink-dim">
              Drop EQUITY_L.csv here or <span class="text-gold">browse</span>
            </p>
            <p class="text-xs text-ink-ghost">.csv or .txt — max 10 MB</p>
          </div>

          <!-- Selected file -->
          <div
            v-else
            class="flex items-center gap-3 rounded-xl border border-border bg-elevated px-4 py-3"
          >
            <FileSpreadsheet class="h-5 w-5 shrink-0 text-gold" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-ink">{{ file.name }}</p>
              <p class="text-xs text-ink-ghost">{{ fileSizeLabel }}</p>
            </div>
            <button class="rounded p-1 text-ink-ghost hover:text-ink" @click="file = null">
              <X class="h-4 w-4" />
            </button>
          </div>

          <input ref="fileInput" type="file" accept=".csv,.txt" class="hidden" @change="onFileInput" />

          <p v-if="fileError" class="text-xs text-loss">{{ fileError }}</p>

          <!-- 422 error -->
          <div
            v-if="importError"
            class="flex items-center gap-2 rounded-lg border border-loss/40 bg-loss/10 px-3 py-2.5"
          >
            <AlertCircle class="h-4 w-4 shrink-0 text-loss" />
            <p class="text-sm text-loss">{{ importError }}</p>
          </div>

          <AppButton :disabled="!file" :loading="importing" @click="runImport">
            Upload &amp; Import
          </AppButton>
        </div>
      </AppCard>
    </template>
  </div>
</template>
