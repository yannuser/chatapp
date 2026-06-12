import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { logout } from '../api/auth'
import { useAuthStore } from '../stores/authStore'
import ProfileTab from '../components/settings/ProfileTab'
import NotificationsTab from '../components/settings/NotificationsTab'
import PrivacyTab from '../components/settings/PrivacyTab'
import AppearanceTab from '../components/settings/AppearanceTab'
import BlockedUsersTab from '../components/settings/BlockedUsersTab'
import MutedTab from '../components/settings/MutedTab'

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'blocked', label: 'Blocked users' },
  { id: 'muted', label: 'Muted' },
] as const

type Tab = typeof TABS[number]['id']

export default function SettingsPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('profile')
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Server-side revocation failed
    }
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-full bg-primary">
      <aside className="w-56 flex-shrink-0 border-r border-default flex flex-col">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-default">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover-bg text-secondary hover:text-primary transition-colors"
            title="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="font-semibold text-primary text-base">Settings</h1>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-accent text-on-accent'
                  : 'text-primary hover-bg'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="p-2 border-t border-default">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover-bg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'privacy' && <PrivacyTab />}
        {tab === 'appearance' && <AppearanceTab />}
        {tab === 'blocked' && <BlockedUsersTab />}
        {tab === 'muted' && <MutedTab />}
      </main>
    </div>
  )
}
