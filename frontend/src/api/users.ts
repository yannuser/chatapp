import api from './client'
import type { UserResponse } from '../types/api'

export const createUser = (data: {
  email: string
  first_name: string
  last_name: string
  birthdate: string
  username: string
  password: string
}) => api.post<UserResponse>('/users/', data).then((r) => r.data)

export const getUserById = (id: string) =>
  api.get<UserResponse>(`/users/${id}`).then((r) => r.data)

export const getUserByUsername = (username: string) =>
  api.get<UserResponse>(`/users/username/${username}`).then((r) => r.data)

export const searchUsers = (q: string) =>
  api.get<UserResponse[]>('/users/search', { params: { q } }).then((r) => r.data)

export const updateUser = (
  id: string,
  data: Partial<{
    email: string
    first_name: string
    last_name: string
    birthdate: string
    username: string
    password: string
  }>
) => api.put<UserResponse>(`/users/${id}`, data).then((r) => r.data)

export const deleteUser = (id: string) => api.delete(`/users/${id}`)
