import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { apiErrorDetail } from '../lib/apiError'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(apiErrorDetail(err, 'Something went wrong. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Forgot password</h1>
          <p className="text-secondary text-sm mt-1">
            Enter your email and we'll send a reset link
          </p>
        </div>

        {sent ? (
          <div className="space-y-4">
            <p className="text-sm text-primary text-center bg-secondary rounded-lg px-4 py-3 border border-default">
              If that email is registered, a reset link has been sent. Check your inbox.
            </p>
            <Link
              to="/login"
              className="block text-center text-accent hover:underline text-sm font-medium"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="w-full bg-secondary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-3 border border-default focus:border-accent outline-none transition-colors"
            />
            {error && (
              <p className="text-danger text-xs px-1">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-accent text-on-accent text-sm rounded-lg font-semibold disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <p className="text-center text-secondary text-sm pt-1">
              <Link to="/login" className="text-accent hover:underline font-medium">
                Back to sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
