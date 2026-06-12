import axios, { isAxiosError } from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const drainQueue = (err: unknown, token: string | null) => {
  queue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token!)))
  queue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (
      err.response?.status === 401 &&
      !original._retry &&
      original.url !== '/auth/refresh'
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) =>
          queue.push({ resolve, reject })
        ).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      isRefreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        const token: string = data.access_token
        useAuthStore.getState().setToken(token)
        drainQueue(null, token)
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch (e) {
        drainQueue(e, null)
        const refreshStatus = isAxiosError(e) ? e.response?.status : undefined
        if (refreshStatus === 401 || refreshStatus === 403) {
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
        }
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
