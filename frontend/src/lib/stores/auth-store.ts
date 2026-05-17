import { create } from 'zustand';

interface User {
  sub: string;
  username: string;
  tenantId: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('bcp_token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('bcp_token');
    set({ token: null, user: null });
  },
  hydrate: () => {
    const token = localStorage.getItem('bcp_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        set({
          token,
          user: {
            sub: payload.sub,
            username: payload.username,
            tenantId: payload.tenantId,
            roles: payload.roles,
          },
        });
      } catch {
        localStorage.removeItem('bcp_token');
      }
    }
  },
}));
