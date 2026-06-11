import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSettings } from '../../api/settings'
import { useThemeStore } from '../../stores/themeStore'
import { useToastStore } from '../../stores/toastStore'

const THEMES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
]

export default function AppearanceTab() {
  const qc = useQueryClient()
  const { addToast } = useToastStore()
  const { theme: localTheme, setTheme } = useThemeStore()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const update = useMutation({
    mutationFn: (data: Parameters<typeof updateSettings>[0]) => updateSettings(data),
    onSuccess: (updated) => {
      qc.setQueryData(['settings'], updated)
    },
    onError: () => addToast('Failed to update appearance settings'),
  })

  if (isLoading || !settings) {
    return <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-12 bg-secondary rounded-lg animate-pulse" />)}</div>
  }

  return (
    <div className="space-y-6 max-w-md">
      <div>
        <p className="text-secondary text-xs mb-2">Theme</p>
        <div className="flex gap-2">
          {THEMES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => {
                setTheme(value)
                update.mutate({ appearance: { theme: value } })
              }}
              className={`flex-1 py-2.5 text-sm rounded-lg border font-medium transition-colors ${
                localTheme === value
                  ? 'bg-accent text-on-accent border-accent'
                  : 'bg-primary text-primary border-default hover-bg'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-secondary text-xs mb-1 block">Language</label>
        <select
          value={settings.language}
          onChange={(e) => update.mutate({ language: e.target.value })}
          className="w-full bg-primary text-primary text-sm rounded-lg px-3 py-2.5 border border-default focus:border-accent outline-none transition-colors"
        >
          {LANGUAGES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
