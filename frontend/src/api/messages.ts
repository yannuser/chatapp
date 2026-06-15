import api from './client'
import type { DirectMessagePage, DirectMessageResponse } from '../types/api'

export const getMessages = (conversationId: string, before?: string, limit = 50) =>
  api
    .get<DirectMessagePage>('/direct-messages/', {
      params: { conversation_id: conversationId, before, limit },
    })
    .then((r) => r.data)

export const sendMessage = (
  conversationId: string,
  content: string,
  senderId: string,
  replyToId?: string,
) =>
  api
    .post<DirectMessageResponse>('/direct-messages/', {
      content,
      sender_id: senderId,
      linked_conversation_id: conversationId,
      reply_to_id: replyToId || undefined,
    })
    .then((r) => r.data)

export const editMessage = (id: string, content: string) =>
  api.put<DirectMessageResponse>(`/direct-messages/${id}`, { content }).then((r) => r.data)

export const deleteMessage = (id: string) =>
  api.delete(`/direct-messages/${id}`)

export const reactToMessage = (id: string, emoji: string) =>
  api.post<DirectMessageResponse>(`/direct-messages/${id}/react`, { emoji }).then((r) => r.data)
