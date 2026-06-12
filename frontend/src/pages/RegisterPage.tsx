import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUser } from '../api/users'
import { login, getMe } from '../api/auth'
import { apiErrorDetail } from '../lib/apiError'
import { useAuthStore } from '../stores/authStore'
import { useToastStore } from '../stores/toastStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth, setToken } = useAuthStore()
  const { addToast } = useToastStore()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    birthdate: '',
    password: '',
    confirm: '',
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { addToast('Passwords do not match'); return }
    setLoading(true)
    try {
      await createUser({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        birthdate: form.birthdate,
        password: form.password,
      })
      const { access_token } = await login(form.email.trim(), form.password)
      setToken(access_token)
      const user = await getMe()
      setAuth(user, access_token)
      navigate('/', { replace: true })
    } catch (err) {
      addToast(apiErrorDetail(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const fields: Array<{ key: keyof typeof form; label: string; type: string; auto?: string }> = [
    { key: 'first_name', label: 'First name', type: 'text' },
    { key: 'last_name', label: 'Last name', type: 'text' },
    { key: 'username', label: 'Username', type: 'text', auto: 'username' },
    { key: 'email', label: 'Email', type: 'email', auto: 'email' },
    { key: 'birthdate', label: 'Birthdate', type: 'date' },
    { key: 'password', label: 'Password', type: 'password', auto: 'new-password' },
    { key: 'confirm', label: 'Confirm password', type: 'password', auto: 'new-password' },
  ]

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">Create account</h1>
          <p className="text-secondary text-sm mt-1">Get started for free</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map(({ key, label, type, auto }) => (
            <input
              key={key}
              type={type}
              value={form[key]}
              onChange={set(key)}
              placeholder={label}
              autoComplete={auto}
              className="w-full bg-secondary text-primary placeholder:text-secondary text-sm rounded-lg px-4 py-3 border border-default focus:border-accent outline-none transition-colors"
            />
          ))}
          <button
            type="submit"
            disabled={loading || Object.values(form).some((v) => !v.trim())}
            className="w-full py-3 bg-accent text-on-accent text-sm rounded-lg font-semibold disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-secondary text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
