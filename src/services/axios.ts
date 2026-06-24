import axios, { type AxiosRequestConfig, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { push } from 'notivue'
import router from '@/router'

export interface ApiResponse<T = any> {
  data?: T
  message?: string
  errors?: Record<string, string[]>
  pagination?: {
    current_page: number
    per_page: number
    total: number
    last_page: number
    from: number | null
    to: number | null
    has_more_pages: boolean
    next_page_url: string | null
    prev_page_url: string | null
    first_page_url: string
    last_page_url: string
  }
}

interface ExtendedRequestConfig extends AxiosRequestConfig {
  loadingMessage?: string
  showLoading?: boolean
  showSuccessNotification?: boolean
  successMessage?: string
}

interface ExtendedInternalConfig extends InternalAxiosRequestConfig {
  loadingMessage?: string
  showLoading?: boolean
  showSuccessNotification?: boolean
  successMessage?: string
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config: ExtendedInternalConfig) => {
  const token = localStorage.getItem('wt_token')
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  return config
})

api.interceptors.response.use(
  (response) => {
    const config = response.config as ExtendedInternalConfig
    if (config.showSuccessNotification) {
      push.success(config.successMessage ?? 'Done')
    }
    return response
  },
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response

      if (status === 401) {
        localStorage.removeItem('wt_token')
        localStorage.removeItem('wt_user')
        if (router.currentRoute.value.name !== 'login') {
          router.push('/login')
        }
      } else if (status !== 422) {
        push.error((data as any)?.message ?? 'Something went wrong')
      }
    } else {
      push.error('Network error — check your connection')
    }
    return Promise.reject(error)
  },
)

export const get = <T = any>(
  url: string,
  config?: ExtendedRequestConfig,
): Promise<AxiosResponse<ApiResponse<T>>> => api.get<ApiResponse<T>>(url, config)

export const post = <T = any>(
  url: string,
  data?: any,
  config?: ExtendedRequestConfig,
): Promise<AxiosResponse<ApiResponse<T>>> => api.post<ApiResponse<T>>(url, data, config)

export const put = <T = any>(
  url: string,
  data?: any,
  config?: ExtendedRequestConfig,
): Promise<AxiosResponse<ApiResponse<T>>> => api.put<ApiResponse<T>>(url, data, config)

export const patch = <T = any>(
  url: string,
  data?: any,
  config?: ExtendedRequestConfig,
): Promise<AxiosResponse<ApiResponse<T>>> => api.patch<ApiResponse<T>>(url, data, config)

export const del = <T = any>(
  url: string,
  config?: ExtendedRequestConfig,
): Promise<AxiosResponse<ApiResponse<T>>> => api.delete<ApiResponse<T>>(url, config)

export { api }
export default api
