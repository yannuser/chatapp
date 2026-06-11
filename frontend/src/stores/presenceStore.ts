import { create } from 'zustand'

interface PresenceState {
  onlineUsers: Set<string>
  setOnline: (userId: string) => void
  setOffline: (userId: string) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: new Set(),
  setOnline: (userId) =>
    set((s) => ({ onlineUsers: new Set([...s.onlineUsers, userId]) })),
  setOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers)
      next.delete(userId)
      return { onlineUsers: next }
    }),
}))
