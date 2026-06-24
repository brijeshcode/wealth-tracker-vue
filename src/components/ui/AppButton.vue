<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
}
withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  loading: false,
  disabled: false,
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="relative inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    :class="{
      'border border-gold bg-gold/10 text-gold hover:bg-gold/20 focus-visible:outline-gold': variant === 'primary',
      'border border-border text-ink-dim hover:bg-elevated hover:text-ink focus-visible:outline-border': variant === 'ghost',
      'bg-loss text-white hover:opacity-90 focus-visible:outline-loss': variant === 'danger',
    }"
  >
    <span v-if="loading" class="absolute inset-0 flex items-center justify-center">
      <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </span>
    <span :class="{ 'opacity-0': loading }"><slot /></span>
  </button>
</template>
