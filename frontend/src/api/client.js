import axios from 'axios'

/**
 * In Vite dev, `import.meta.env.VITE_API_BASE_URL` can still be an absolute URL (e.g. Render)
 * if it was set in the shell, in a cached transform, or pulled by another tool. Using that
 * from localhost causes CORS failures. Same-origin `/api/v1` always goes through the proxy.
 */
function resolveApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  if (import.meta.env.DEV && typeof raw === 'string' && /^https?:\/\//i.test(raw)) {
    return '/api/v1'
  }
  return raw
}

const baseURL = resolveApiBaseUrl()

const client = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  // Render free tier can take up to 50s to cold-start — give it plenty of room.
  timeout: 60000,
})

// Attach JWT to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 — redirect to login
// Handle network errors with a friendly message
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    if (!error.response) {
      // Network error or timeout — backend may be waking up
      error.isNetworkError = true
    }
    return Promise.reject(error)
  }
)

/**
 * Fire-and-forget health ping (local: `/actuator/health` via Vite proxy; prod: same host as API).
 * On hosted backends that sleep (e.g. Render free tier), this can warm the instance before login.
 */
export function pingBackend() {
  const healthUrl = baseURL.replace(/\/api\/v1\/?$/, '/actuator/health')
  fetch(healthUrl, { method: 'GET' }).catch(() => { /* intentionally silent */ })
}

export default client
