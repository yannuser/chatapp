import { useEffect } from 'react'
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
  const { status, setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { access_token } = await refresh()
        // Set an empty user first so the interceptor has the token for getMe
        setAuth({} as any, access_token)
        const user = await getMe()
        setAuth(user, access_token)
      } catch (err) {
        clearAuth()
      }
    }

    if (status === 'loading') {
      bootstrap()
    }
  }, [status, setAuth, clearAuth])

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
