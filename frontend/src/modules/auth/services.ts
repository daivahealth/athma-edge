import apiClient from '@/lib/api/client';
import type { AuthUser, LoginRequest, LoginResponse } from './types';

export const authService = {
  login: (data: LoginRequest) => apiClient.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  me: () => apiClient.get<{ data: AuthUser }>('/auth/me').then((r) => r.data),
  logout: () => apiClient.post('/auth/logout'),
};
