import api from './client'
import type { ConversationResponse } from '../types/api'

export const getConversations = () =>
  api.get<ConversationResponse[]>('/conversations/').then((r) => r.data)

export const createConversation = (member_ids: [string, string]) =>
  api.post<ConversationResponse>('/conversations/', { member_ids }).then((r) => r.data)

export const getConversation = (id: string) =>
  api.get<ConversationResponse>(`/conversations/${id}`).then((r) => r.data)

export const deleteConversation = (id: string) =>
  api.delete(`/conversations/${id}`)
