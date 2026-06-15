import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { apiErrorDetail } from '../lib/apiError'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Missing or invalid reset link.')
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    try {
      await resetPassword(token, form.password)
      navigate('/login', { state: { notice: 'Password updated. You can now sign in.' }, replace: true })
    } catch (err) {
      setError(apiErrorDetail(err, 'Invalid or expired reset link.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Choose new password</h1>
          <p className="text-secondary text-sm mt-1">Must be at least 8 characters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="New password"
            autoComplete="new-password"
            disabled={!token}
            className="w-full bg-secondary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-3 border border-default focus:border-accent outline-none transition-colors disabled:opacity-50"
          />
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={!token}
            className="w-full bg-secondary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-3 border border-default focus:border-accent outline-none transition-colors disabled:opacity-50"
          />
          {error && (
            <p className="text-danger text-xs px-1">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !token || !form.password || !form.confirm}
            className="w-full py-3 bg-accent text-on-accent text-sm rounded-lg font-semibold disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
          >
            {loading ? 'Saving…' : 'Set new password'}
          </button>
          <p className="text-center text-secondary text-sm pt-1">
            <Link to="/login" className="text-accent hover:underline font-medium">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
