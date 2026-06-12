import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { usePresenceStore } from '../stores/presenceStore'
import { useTypingStore } from '../stores/typingStore'
import { appendMessage } from '../lib/messageCache'
import type { WsEvent, DirectMessageResponse, GroupMessageResponse } from '../types/api'

const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`
const MAX_RETRIES = 5

export function useWebSocket() {
  const qc = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRef = useRef<() => void>(() => {})
  const { accessToken } = useAuthStore()
  const { activeConversationId, activeGroupId, incrementUnread, setLastMessage } = useChatStore()
  const { setOnline, setManyOnline, setOffline } = usePresenceStore()
  const { setTyping } = useTypingStore()

  const activeConvRef = useRef(activeConversationId)
  const activeGroupRef = useRef(activeGroupId)
  useEffect(() => { activeConvRef.current = activeConversationId }, [activeConversationId])
  useEffect(() => { activeGroupRef.current = activeGroupId }, [activeGroupId])

  const handleEvent = useCallback((evt: WsEvent) => {
    switch (evt.type) {
      case 'new_direct_message': {
        const convId = evt.linked_conversation.id
        appendMessage(qc, ['messages', convId], evt)
        setLastMessage(convId, { kind: 'dm', msg: evt })
        qc.invalidateQueries({ queryKey: ['conversations'] })
        if (activeConvRef.current !== convId) incrementUnread(convId)
        break
      }
      case 'updated_direct_message': {
        const convId = evt.linked_conversation.id
        qc.setQueryData<{ pages: { messages: DirectMessageResponse[]; next_cursor: string | null }[] }>(
          ['messages', convId],
          (old) => {
            if (!old) return old
            const pages = old.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) => (m.id === evt.id ? evt : m)),
            }))
            return { ...old, pages }
          }
        )
        break
      }
      case 'deleted_direct_message': {
        qc.setQueryData<{ pages: { messages: DirectMessageResponse[]; next_cursor: string | null }[] }>(
          ['messages', evt.conversation_id],
          (old) => {
            if (!old) return old
            const pages = old.pages.map((p) => ({
              ...p,
              messages: p.messages.filter((m) => m.id !== evt.id),
            }))
            return { ...old, pages }
          }
        )
        break
      }
      case 'new_group_message': {
        const groupId = evt.group.id
        appendMessage(qc, ['group-messages', groupId], evt)
        setLastMessage(groupId, { kind: 'group', msg: evt })
        qc.invalidateQueries({ queryKey: ['groups'] })
        if (activeGroupRef.current !== groupId) incrementUnread(groupId)
        break
      }
      case 'updated_group_message': {
        const groupId = evt.group.id
        qc.setQueryData<{ pages: { messages: GroupMessageResponse[]; next_cursor: string | null }[] }>(
          ['group-messages', groupId],
          (old) => {
            if (!old) return old
            const pages = old.pages.map((p) => ({
              ...p,
              messages: p.messages.map((m) => (m.id === evt.id ? evt : m)),
            }))
            return { ...old, pages }
          }
        )
        break
      }
      case 'deleted_group_message': {
        qc.setQueryData<{ pages: { messages: GroupMessageResponse[]; next_cursor: string | null }[] }>(
          ['group-messages', evt.group_id],
          (old) => {
            if (!old) return old
            const pages = old.pages.map((p) => ({
              ...p,
              messages: p.messages.filter((m) => m.id !== evt.id),
            }))
            return { ...old, pages }
          }
        )
        break
      }
      case 'typing':
        setTyping(evt.conversation_id, evt.user_id, evt.is_typing)
        break
      case 'typing_group':
        setTyping(evt.group_id, evt.user_id, evt.is_typing)
        break
      case 'user_online':
        setOnline(evt.user_id)
        break
      case 'user_offline':
        setOffline(evt.user_id)
        break
      case 'online_contacts':
        setManyOnline(evt.user_ids)
        break
      case 'group_created':
      case 'group_updated':
      case 'group_deleted':
      case 'removed_from_group':
        qc.invalidateQueries({ queryKey: ['groups'] })
        break
    }
  }, [qc, incrementUnread, setLastMessage, setOnline, setManyOnline, setOffline, setTyping])

  const connect = useCallback(() => {
    if (!accessToken) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => { retriesRef.current = 0 }

    ws.onmessage = (e) => {
      try {
        const evt = JSON.parse(e.data) as WsEvent
        handleEvent(evt)
      } catch {
        // Ignore malformed frames
      }
    }

    ws.onclose = () => {
      wsRef.current = null
      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30000)
        retriesRef.current++
        timerRef.current = setTimeout(() => connectRef.current(), delay)
      }
    }

    ws.onerror = () => ws.close()
  }, [accessToken, handleEvent])

  useEffect(() => { connectRef.current = connect }, [connect])

  useEffect(() => {
    if (!accessToken) return
    connect()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [accessToken, connect])

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { send }
}
