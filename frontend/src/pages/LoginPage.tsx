import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login, getMe } from '../api/auth'
import { apiErrorDetail } from '../lib/apiError'
import { useAuthStore } from '../stores/authStore'
import { useToastStore } from '../stores/toastStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setToken } = useAuthStore()
  const { addToast } = useToastStore()
  const [form, setForm] = useState({ login: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.login.trim() || !form.password) return
    setLoading(true)
    try {
      const { access_token } = await login(form.login.trim(), form.password)
      setToken(access_token)
      const user = await getMe()
      setAuth(user, access_token)
      navigate('/', { replace: true })
    } catch (err) {
      addToast(apiErrorDetail(err, 'Invalid credentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Welcome back</h1>
          <p className="text-secondary text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={form.login}
            onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
            placeholder="Email or username"
            autoComplete="username"
            className="w-full bg-secondary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-3 border border-default focus:border-accent outline-none transition-colors"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full bg-secondary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-3 border border-default focus:border-accent outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !form.login.trim() || !form.password}
            className="w-full py-3 bg-accent text-on-accent text-sm rounded-lg font-semibold disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-secondary text-sm">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
