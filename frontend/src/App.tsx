import { useEffect, useRef } from 'react'
import { isAxiosError } from 'axios'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { refresh, getMe } from './api/auth'
import AppShell from './pages/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import ChatPanel from './components/chat/ChatPanel'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuthStore()
  if (status === 'loading') return null
  return status === 'authenticated' ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { status } = useAuthStore()
  if (status === 'loading') return null
  return status === 'authenticated' ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
  const { status, setAuth, setToken, clearAuth } = useAuthStore()
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    const bootstrap = async (attempt = 0) => {
      try {
        const { access_token } = await refresh()
        setToken(access_token)
        const user = await getMe()
        setAuth(user, access_token)
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 429 && attempt < 4) {
          const retryAfter = Number(err.response.headers['retry-after'])
          const delay = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : 15000 * 2 ** attempt
          setTimeout(() => bootstrap(attempt + 1), delay)
          return
        }
        clearAuth()
      }
    }

    bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (status === 'loading') {
    return <div className="min-h-screen bg-primary" />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<GuestRoute><LoginPage /></GuestRoute>}
        />
        <Route
          path="/register"
          element={<GuestRoute><RegisterPage /></GuestRoute>}
        />
        <Route
          path="/"
          element={<ProtectedRoute><AppShell /></ProtectedRoute>}
        >
          <Route index element={<EmptyState />} />
          <Route path="conversations/:id" element={<ChatPanel type="dm" />} />
          <Route path="groups/:id" element={<ChatPanel type="group" />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-secondary text-sm">Select a conversation to start chatting</p>
      </div>
    </div>
  )
}
