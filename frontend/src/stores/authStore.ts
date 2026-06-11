import { create } from 'zustand'
import type { UserResponse } from '../types/api'

interface AuthState {
  user: UserResponse | null
  accessToken: string | null
  setAuth: (user: UserResponse, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  setAuth: (user, accessToken) => set({ user, accessToken }),
  clearAuth: () => set({ user: null, accessToken: null }),
}))
