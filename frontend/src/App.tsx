import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import AppShell from './pages/AppShell'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SettingsPage from './pages/SettingsPage'
import ChatPanel from './components/chat/ChatPanel'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <Navigate to="/" replace /> : <>{children}</>
}

export default function App() {
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
