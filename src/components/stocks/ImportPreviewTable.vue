<script setup lang="ts">
import type { ImportRow, TransactionType } from '@/types/stocks'

defineProps<{ rows: ImportRow[] }>()

const types: TransactionType[] = ['buy', 'sell', 'dividend', 'bonus', 'split']

const inputClass =
  'w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-ink outline-none transition-colors focus:border-gold focus:bg-elevated'

const toNumberOrNull = (value: string): number | null => (value === '' ? null : Number(value))
</script>

<template>
  <div class="overflow-x-auto rounded-xl border border-border bg-surface">
    <table class="w-full min-w-[64rem] text-sm">
      <thead>
        <tr
          class="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-ink-ghost"
        >
          <th class="w-10 py-3 pl-4 pr-2">#</th>
          <th class="py-3 px-2">Date</th>
          <th class="py-3 px-2">Symbol</th>
          <th class="py-3 px-2">Exch</th>
          <th class="py-3 px-2">Type</th>
          <th class="py-3 px-2 text-right">Qty</th>
          <th class="py-3 px-2 text-right">Price</th>
          <th class="py-3 px-2">Platform</th>
          <th class="py-3 px-2">Reference</th>
          <th class="py-3 px-2">Nickname</th>
          <th class="py-3 pl-2 pr-4">Notes</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in rows"
          :key="i"
          class="border-b border-border last:border-0 hover:bg-elevated/50"
        >
          <td class="py-1.5 pl-4 pr-2 font-mono text-xs text-ink-ghost">{{ i + 1 }}</td>
          <td class="py-1.5 px-2">
            <input v-model="row.transaction_date" type="text" :class="inputClass" class="w-40 font-mono" />
          </td>
          <td class="py-1.5 px-2 font-mono text-ink">{{ row.symbol }}</td>
          <td class="py-1.5 px-2">
            <span
              class="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
              :class="
                row.exchange === 'NSE'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400'
              "
            >
              {{ row.exchange }}
            </span>
          </td>
          <td class="py-1.5 px-2">
            <select v-model="row.type" :class="inputClass" class="capitalize">
              <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
            </select>
          </td>
          <td class="py-1.5 px-2">
            <input
              :value="row.quantity ?? ''"
              type="number"
              :class="inputClass"
              class="w-20 text-right font-mono"
              @input="row.quantity = toNumberOrNull(($event.target as HTMLInputElement).value)"
            />
          </td>
          <td class="py-1.5 px-2">
            <input
              :value="row.price_per_unit ?? ''"
              type="number"
              step="0.01"
              :class="inputClass"
              class="w-24 text-right font-mono"
              @input="row.price_per_unit = toNumberOrNull(($event.target as HTMLInputElement).value)"
            />
          </td>
          <td class="py-1.5 px-2">
            <input v-model="row.platform" type="text" :class="inputClass" class="w-28" />
          </td>
          <td class="py-1.5 px-2">
            <input
              :value="row.reference ?? ''"
              type="text"
              :class="inputClass"
              class="w-28 font-mono"
              @input="row.reference = ($event.target as HTMLInputElement).value || null"
            />
          </td>
          <td class="py-1.5 px-2">
            <input
              :value="row.nickname ?? ''"
              type="text"
              :class="inputClass"
              class="w-28"
              @input="row.nickname = ($event.target as HTMLInputElement).value || null"
            />
          </td>
          <td class="py-1.5 pl-2 pr-4">
            <input
              :value="row.notes ?? ''"
              type="text"
              :class="inputClass"
              class="w-32"
              @input="row.notes = ($event.target as HTMLInputElement).value || null"
            />
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
