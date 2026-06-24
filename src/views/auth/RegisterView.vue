<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const auth = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const passwordMismatch = computed(
  () => confirmPassword.value.length > 0 && password.value !== confirmPassword.value,
)

async function handleRegister() {
  if (!name.value || !email.value || !password.value) return
  if (passwordMismatch.value) return
  error.value = ''
  loading.value = true
  try {
    await auth.register(name.value, email.value, password.value)
    router.push('/dashboard')
  } catch {
    error.value = 'Registration failed. The email may already be in use.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="mb-6 text-xl font-semibold text-ink">Create account</h1>

    <form class="flex flex-col gap-4" @submit.prevent="handleRegister">
      <AppInput
        v-model="name"
        label="Full name"
        type="text"
        placeholder="Your name"
        autocomplete="name"
      />
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        autocomplete="email"
      />
      <AppInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="Min. 8 characters"
        autocomplete="new-password"
      />
      <AppInput
        v-model="confirmPassword"
        label="Confirm password"
        type="password"
        placeholder="Same password again"
        autocomplete="new-password"
        :error="passwordMismatch ? 'Passwords do not match' : undefined"
      />

      <div
        v-if="error"
        class="rounded-lg border border-loss/20 bg-loss/10 px-3 py-2.5 text-sm text-loss"
      >
        {{ error }}
      </div>

      <AppButton type="submit" :loading="loading" class="mt-1 w-full">Create account</AppButton>
    </form>

    <p class="mt-5 text-center text-sm text-ink-dim">
      Already have an account?
      <RouterLink to="/login" class="text-gold transition-colors hover:text-gold-hi">
        Sign in
      </RouterLink>
    </p>
  </AuthLayout>
</template>
