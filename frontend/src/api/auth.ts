import api from './client'
import type { TokenResponse, UserResponse } from '../types/api'

export const login = (login: string, password: string) =>
  api.post<TokenResponse>('/auth/login', { login, password }).then((r) => r.data)

export const logout = () => api.post('/auth/logout')

export const refresh = () =>
  api.post<TokenResponse>('/auth/refresh').then((r) => r.data)

export const getMe = () =>
  api.get<UserResponse>('/auth/me').then((r) => r.data)

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data)

export const resetPassword = (token: string, new_password: string) =>
  api.post('/auth/reset-password', { token, new_password }).then((r) => r.data)
