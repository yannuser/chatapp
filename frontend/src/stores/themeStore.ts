import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

const applyTheme = (theme: Theme) => {
  const el = document.documentElement
  if (theme === 'system') {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    el.setAttribute('data-theme', dark ? 'dark' : 'light')
  } else {
    el.setAttribute('data-theme', theme)
  }
}

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
}))

applyTheme(useThemeStore.getState().theme)

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (useThemeStore.getState().theme === 'system') {
    applyTheme('system')
  }
})
