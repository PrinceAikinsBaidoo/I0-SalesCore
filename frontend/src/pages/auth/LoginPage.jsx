import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Toaster, toast } from 'sonner'
import { pingBackend } from '@/api/client'
import { Loader2, Wifi } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: '', password: '' })

  // Wake up the Render backend as soon as the login page mounts.
  // Render free tier sleeps after inactivity — this gives it a head start
  // so login is fast the moment the user submits the form.
  const [warming, setWarming] = useState(true)
  useEffect(() => {
    pingBackend()
    // Give the backend ~4 seconds of warming time, then remove the banner
    // regardless of whether it replied (we don't block on it).
    const t = setTimeout(() => setWarming(false), 4000)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(form)
      const role = data.role
      if (role === 'CASHIER') navigate('/pos')
      else navigate('/dashboard')
    } catch (err) {
      if (err.isNetworkError || err.code === 'ECONNABORTED') {
        toast.error(
          'Server is starting up — this can take up to 60 seconds on first load. Please try again in a moment.',
          { duration: 8000 }
        )
      } else {
        toast.error(err.response?.data?.message || 'Invalid credentials')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Toaster richColors position="top-center" />

      <div className="w-full max-w-md animate-fade-in">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500 mb-4">
            <span className="text-white font-bold text-xl">I0</span>
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">I0 SalesCore</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Warm-up banner — shown briefly on first visit */}
        {warming && (
          <div className="flex items-center gap-2 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs rounded-xl px-4 py-3 mb-4 animate-fade-in">
            <Wifi size={13} className="flex-shrink-0 animate-pulse" />
            <span>Connecting to server — ready in a few seconds…</span>
          </div>
        )}

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="username">
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={form.username}
                onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150"
                placeholder="admin"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-150"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="press-feedback w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-150"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          I0 LABS · I0 SalesCore v1.0
        </p>
      </div>
    </div>
  )
}
