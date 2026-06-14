import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { usePresenceStore } from '../stores/presenceStore'
import { useTypingStore } from '../stores/typingStore'
import { useReadStore } from '../stores/readStore'
import { appendMessage } from '../lib/messageCache'
import { showBrowserNotification } from '../lib/notify'
import type { WsEvent, DirectMessageResponse, GroupMessageResponse, SettingsResponse } from '../types/api'

const WS_URL = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/ws`
const MAX_RETRIES = 5

export function useWebSocket() {
  const qc = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectRef = useRef<() => void>(() => {})
  const closingRef = useRef(false)
  // The socket authenticates via the access_token cookie, so it only depends on
  // login status — not the rotating JS token (which would churn the connection).
  const status = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const { activeConversationId, activeGroupId, incrementUnread, setLastMessage } = useChatStore()
  const { setOnline, setManyOnline, setOffline } = usePresenceStore()
  const { setTyping } = useTypingStore()
  const setRead = useReadStore((s) => s.setRead)

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
        const settings = qc.getQueryData<SettingsResponse>(['settings'])
        const muted = settings?.muted_conversations.includes(convId)
        if (activeConvRef.current !== convId && !muted) incrementUnread(convId)
        if (
          (document.hidden || activeConvRef.current !== convId) &&
          evt.sender.id !== user?.id && !muted && settings?.notifications.enabled
        ) {
          showBrowserNotification(
            `${evt.sender.first_name} ${evt.sender.last_name}`,
            settings.notifications.message_preview ? evt.content : 'New message',
            { tag: convId, dedupeKey: evt.id },
          )
        }
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
        const gSettings = qc.getQueryData<SettingsResponse>(['settings'])
        const mutedGroup = gSettings?.muted_groups.includes(groupId)
        if (activeGroupRef.current !== groupId && !mutedGroup) incrementUnread(groupId)
        if (
          (document.hidden || activeGroupRef.current !== groupId) &&
          evt.sender.id !== user?.id && !mutedGroup &&
          gSettings?.notifications.enabled && gSettings?.notifications.group_messages
        ) {
          showBrowserNotification(
            evt.group.title,
            gSettings.notifications.message_preview
              ? `${evt.sender.first_name}: ${evt.content}`
              : 'New message',
            { tag: groupId, dedupeKey: evt.id },
          )
        }
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
      case 'read_receipt':
        setRead(evt.conversation_id, evt.user_id, evt.read_at)
        break
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
  }, [qc, user, incrementUnread, setLastMessage, setRead, setOnline, setManyOnline, setOffline, setTyping])

  // Keep the socket's message handler current without recreating the socket.
  const handleEventRef = useRef(handleEvent)
  useEffect(() => { handleEventRef.current = handleEvent }, [handleEvent])

  const connect = useCallback(() => {
    // Never open a second socket alongside a live/connecting one.
    const current = wsRef.current
    if (current && (current.readyState === WebSocket.OPEN || current.readyState === WebSocket.CONNECTING)) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => { retriesRef.current = 0 }

    ws.onmessage = (e) => {
      try {
        handleEventRef.current(JSON.parse(e.data) as WsEvent)
      } catch {
        // Ignore malformed frames
      }
    }

    ws.onclose = () => {
      // A stale socket (already replaced, e.g. StrictMode remount) must not reconnect.
      if (wsRef.current !== ws) return
      wsRef.current = null
      if (closingRef.current) return
      if (retriesRef.current < MAX_RETRIES) {
        const delay = Math.min(1000 * 2 ** retriesRef.current, 30000)
        retriesRef.current++
        timerRef.current = setTimeout(() => connectRef.current(), delay)
      }
    }

    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => { connectRef.current = connect }, [connect])

  useEffect(() => {
    if (status !== 'authenticated') return
    closingRef.current = false
    connect()
    return () => {
      closingRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      const ws = wsRef.current
      wsRef.current = null
      if (ws) ws.close()
    }
  }, [status, connect])

  const send = useCallback((payload: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }, [])

  return { send }
}
