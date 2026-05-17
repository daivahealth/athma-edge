import { create } from 'zustand';
import apiClient from '@/lib/api/client';
import type { AuthUser } from '@/modules/auth/types';

interface AuthState {
  user: AuthUser | null;
  hydrated: boolean;
  setAuth: (user: AuthUser) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setAuth: (user) => {
    set({ user, hydrated: true });
  },
  logout: () => {
    set({ user: null, hydrated: true });
  },
  hydrate: async () => {
    try {
      const response = await apiClient.get<{ data: AuthUser }>('/auth/me');
      set({ user: response.data.data, hydrated: true });
    } catch {
      set({ user: null, hydrated: true });
    }
  },
}));
