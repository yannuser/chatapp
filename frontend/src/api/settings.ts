import api from './client'
import type { SettingsResponse } from '../types/api'

export const getSettings = () =>
  api.get<SettingsResponse>('/settings/').then((r) => r.data)

export const updateSettings = (data: {
  language?: string
  notifications?: Partial<{ enabled: boolean; message_preview: boolean; group_messages: boolean; contact_requests: boolean }>
  privacy?: Partial<{ who_can_add_me: 'everyone' | 'nobody'; show_online_status: boolean; read_receipts: boolean }>
  appearance?: Partial<{ theme: 'light' | 'dark' | 'system' }>
}) => api.patch<SettingsResponse>('/settings/', data).then((r) => r.data)

export const blockUser = (targetId: string) =>
  api.post<SettingsResponse>(`/settings/block/${targetId}`).then((r) => r.data)

export const unblockUser = (targetId: string) =>
  api.delete<SettingsResponse>(`/settings/block/${targetId}`).then((r) => r.data)

export const muteConversation = (id: string) =>
  api.post<SettingsResponse>(`/settings/mute/conversation/${id}`).then((r) => r.data)

export const unmuteConversation = (id: string) =>
  api.delete<SettingsResponse>(`/settings/mute/conversation/${id}`).then((r) => r.data)

export const muteGroup = (id: string) =>
  api.post<SettingsResponse>(`/settings/mute/group/${id}`).then((r) => r.data)

export const unmuteGroup = (id: string) =>
  api.delete<SettingsResponse>(`/settings/mute/group/${id}`).then((r) => r.data)
