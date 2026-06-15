import api from './client'
import type { GroupMessagePage, GroupMessageResponse } from '../types/api'

export const getGroupMessages = (groupId: string, before?: string, limit = 50) =>
  api
    .get<GroupMessagePage>('/group-messages/', {
      params: { group_id: groupId, before, limit },
    })
    .then((r) => r.data)

export const sendGroupMessage = (
  groupId: string,
  content: string,
  senderId: string,
  replyToId?: string,
) =>
  api
    .post<GroupMessageResponse>('/group-messages/', {
      group_id: groupId,
      content,
      sender_id: senderId,
      reply_to_id: replyToId || undefined,
    })
    .then((r) => r.data)

export const editGroupMessage = (id: string, content: string) =>
  api.put<GroupMessageResponse>(`/group-messages/${id}`, { content }).then((r) => r.data)

export const deleteGroupMessage = (id: string) =>
  api.delete(`/group-messages/${id}`)

export const reactToGroupMessage = (id: string, emoji: string) =>
  api
    .post<GroupMessageResponse>(`/group-messages/${id}/react`, { emoji })
    .then((r) => r.data)
