import { create } from 'zustand'
import type { UserResponse } from '../types/api'

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  setAuth: (user: UserResponse, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'loading',
  setAuth: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  clearAuth: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
}));
