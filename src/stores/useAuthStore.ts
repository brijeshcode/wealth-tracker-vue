import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '@/lib/axios'

interface User {
  id: number
  name: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('wt_token'))
  const user = ref<User | null>(
    JSON.parse(localStorage.getItem('wt_user') ?? 'null'),
  )

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('wt_token', newToken)
    localStorage.setItem('wt_user', JSON.stringify(newUser))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('wt_token')
    localStorage.removeItem('wt_user')
  }

  async function login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password })
    setAuth(res.data.data.token, res.data.data.user)
  }

  async function register(name: string, email: string, password: string) {
    const res = await api.post('/auth/register', { name, email, password, password_confirmation: password })
    setAuth(res.data.data.token, res.data.data.user)
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {})
    clearAuth()
  }

  return { token, user, isAuthenticated, login, register, logout, clearAuth }
})
