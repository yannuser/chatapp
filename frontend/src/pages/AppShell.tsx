import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { WebSocketProvider } from '../contexts/WebSocketContext'
import { useQuery } from '@tanstack/react-query'
import { getSettings } from '../api/settings'
import { useThemeStore } from '../stores/themeStore'
import Sidebar from '../components/sidebar/Sidebar'
import Toast from '../components/ui/Toast'

export default function AppShell() {
  const { setTheme } = useThemeStore()
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  useEffect(() => {
    if (settings?.appearance?.theme) {
      setTheme(settings.appearance.theme)
    }
  }, [settings?.appearance?.theme, setTheme])

  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
    if (settings && !settings.notifications.enabled) return
    const ask = () => {
      window.removeEventListener('pointerdown', ask)
      window.removeEventListener('keydown', ask)
      Notification.requestPermission().catch(() => {})
    }
    window.addEventListener('pointerdown', ask)
    window.addEventListener('keydown', ask)
    return () => {
      window.removeEventListener('pointerdown', ask)
      window.removeEventListener('keydown', ask)
    }
  }, [settings])

  return (
    <WebSocketProvider>
      <div className="flex h-screen overflow-hidden bg-primary">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          <Outlet />
        </main>
        <Toast />
      </div>
    </WebSocketProvider>
  )
}
