import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

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
 * Fire-and-forget health ping to wake the Render backend from sleep.
 * Called once on app start so the backend is warm by the time the user logs in.
 */
export function pingBackend() {
  const healthUrl = baseURL.replace(/\/api\/v1\/?$/, '/actuator/health')
  fetch(healthUrl, { method: 'GET' }).catch(() => { /* intentionally silent */ })
}

export default client
