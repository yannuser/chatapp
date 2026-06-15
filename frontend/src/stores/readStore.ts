import { create } from 'zustand'

interface ReadState {
  reads: Record<string, Record<string, string>>
  setRead: (conversationId: string, userId: string, readAt: string) => void
  seed: (conversationId: string, map: Record<string, string>) => void
}

export const useReadStore = create<ReadState>((set) => ({
  reads: {},
  setRead: (conversationId, userId, readAt) =>
    set((s) => {
      const existing = s.reads[conversationId]?.[userId]
      if (existing && new Date(existing) >= new Date(readAt)) return s
      return {
        reads: {
          ...s.reads,
          [conversationId]: { ...s.reads[conversationId], [userId]: readAt },
        },
      }
    }),
  seed: (conversationId, map) =>
    set((s) => {
      const merged = { ...s.reads[conversationId] }
      for (const [userId, readAt] of Object.entries(map)) {
        const existing = merged[userId]
        if (!existing || new Date(readAt) > new Date(existing)) merged[userId] = readAt
      }
      return { reads: { ...s.reads, [conversationId]: merged } }
    }),
}))
