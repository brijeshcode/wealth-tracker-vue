<template>
  <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-page">
    <!-- Noise texture overlay -->
    <div class="pointer-events-none absolute inset-0 bg-noise opacity-[0.03]" />
    <!-- Radial gold glow top-right -->
    <div
      class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold opacity-5 blur-3xl"
    />

    <div class="relative z-10 w-full max-w-md px-4 py-12">
      <!-- Logo mark -->
      <div class="mb-8 flex flex-col items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 text-gold ring-1 ring-gold/10"
        >
          <span class="font-mono text-xl font-bold">₹</span>
        </div>
        <span class="text-base font-semibold text-ink">Wealth Tracker</span>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-border bg-surface/80 p-8 shadow-xl backdrop-blur-sm">
        <slot />
      </div>
    </div>
  </div>
</template>
