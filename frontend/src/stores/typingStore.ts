import { create } from 'zustand'

interface TypingState {
  typing: Record<string, string[]>
  setTyping: (roomId: string, userId: string, isTyping: boolean) => void
}

export const useTypingStore = create<TypingState>((set) => ({
  typing: {},
  setTyping: (roomId, userId, isTyping) =>
    set((s) => {
      const current = s.typing[roomId] ?? []
      const next = isTyping
        ? current.includes(userId) ? current : [...current, userId]
        : current.filter((id) => id !== userId)
      return { typing: { ...s.typing, [roomId]: next } }
    }),
}))
