import { create } from 'zustand'
import type { DirectMessageResponse, GroupMessageResponse } from '../types/api'

type LastMessage =
  | { kind: 'dm'; msg: DirectMessageResponse }
  | { kind: 'group'; msg: GroupMessageResponse }

interface ChatState {
  activeConversationId: string | null
  activeGroupId: string | null
  unreadCounts: Record<string, number>
  lastMessages: Record<string, LastMessage>
  setActiveConversation: (id: string | null) => void
  setActiveGroup: (id: string | null) => void
  incrementUnread: (id: string) => void
  clearUnread: (id: string) => void
  setLastMessage: (id: string, msg: LastMessage) => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  activeGroupId: null,
  unreadCounts: {},
  lastMessages: {},

  setActiveConversation: (id) =>
    set({ activeConversationId: id, activeGroupId: null }),

  setActiveGroup: (id) =>
    set({ activeGroupId: id, activeConversationId: null }),

  incrementUnread: (id) =>
    set((s) => ({
      unreadCounts: { ...s.unreadCounts, [id]: (s.unreadCounts[id] ?? 0) + 1 },
    })),

  clearUnread: (id) =>
    set((s) => {
      const next = { ...s.unreadCounts }
      delete next[id]
      return { unreadCounts: next }
    }),

  setLastMessage: (id, msg) =>
    set((s) => ({ lastMessages: { ...s.lastMessages, [id]: msg } })),
}))
