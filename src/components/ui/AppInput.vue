<script setup lang="ts">
interface Props {
  label?: string
  error?: string
  type?: string
  placeholder?: string
  modelValue?: string
  autocomplete?: string
}
defineProps<Props>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-xs font-medium text-ink-dim">{{ label }}</label>
    <input
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      class="w-full rounded-lg border bg-elevated px-3 py-2.5 text-sm text-ink placeholder-ink-ghost outline-none transition-colors focus:ring-1"
      :class="
        error
          ? 'border-loss focus:border-loss focus:ring-loss'
          : 'border-border focus:border-gold focus:ring-gold'
      "
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="text-xs text-loss">{{ error }}</p>
  </div>
</template>
