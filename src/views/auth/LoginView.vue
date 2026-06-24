<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push('/dashboard')
  } catch {
    error.value = 'Invalid email or password. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="mb-6 text-xl font-semibold text-ink">Sign in</h1>

    <form class="flex flex-col gap-4" @submit.prevent="handleLogin">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
      />

      <div class="relative">
        <AppInput
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          autocomplete="current-password"
        />
        <button
          type="button"
          class="absolute bottom-[10px] right-3 text-xs text-ink-ghost transition-colors hover:text-ink-dim"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Hide' : 'Show' }}
        </button>
      </div>

      <div
        v-if="error"
        class="rounded-lg border border-loss/20 bg-loss/10 px-3 py-2.5 text-sm text-loss"
      >
        {{ error }}
      </div>

      <AppButton type="submit" :loading="loading" class="mt-1 w-full">Sign in</AppButton>
    </form>

    <p class="mt-5 text-center text-sm text-ink-dim">
      No account?
      <RouterLink to="/register" class="text-gold transition-colors hover:text-gold-hi">
        Create one
      </RouterLink>
    </p>
  </AuthLayout>
</template>
