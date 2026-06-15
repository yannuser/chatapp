import api from './client'
import type { MessageSearchResult } from '../types/api'

export const searchMessages = (q: string, limit = 20) =>
  api
    .get<MessageSearchResult[]>('/search/messages', { params: { q, limit } })
    .then((r) => r.data)
