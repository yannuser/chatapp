import api from './client'
import type { GroupResponse } from '../types/api'

export const getGroups = () =>
  api.get<GroupResponse[]>('/groups/').then((r) => r.data)

export const createGroup = (data: {
  title: string
  description?: string
  member_ids: string[]
  creator_id: string
}) => api.post<GroupResponse>('/groups/', data).then((r) => r.data)

export const getGroup = (id: string) =>
  api.get<GroupResponse>(`/groups/${id}`).then((r) => r.data)

export const updateGroup = (
  id: string,
  data: { title?: string; description?: string; member_ids: string[] }
) => api.put<GroupResponse>(`/groups/${id}`, data).then((r) => r.data)

export const deleteGroup = (id: string) => api.delete(`/groups/${id}`)

export const leaveGroup = (id: string) => api.post(`/groups/${id}/leave`)
