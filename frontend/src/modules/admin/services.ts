import apiClient from '@/lib/api/client';
import type {
  BcpUser,
  CreateUserRequest,
  UpdateUserRequest,
  AssignRolesRequest,
  AuditQueryParams,
  AuditResponse,
} from './types';

export const adminService = {
  getUsers: () => apiClient.get<{ data: BcpUser[] }>('/users').then((r) => r.data),
  createUser: (data: CreateUserRequest) => apiClient.post<{ data: BcpUser }>('/users', data).then((r) => r.data),
  updateUser: (id: number, data: UpdateUserRequest) =>
    apiClient.patch<{ data: BcpUser }>(`/users/${id}`, data).then((r) => r.data),
  assignRoles: (id: number, data: AssignRolesRequest) =>
    apiClient.post<{ data: BcpUser }>(`/users/${id}/roles`, data).then((r) => r.data),
  getAuditLog: (params: AuditQueryParams) =>
    apiClient.get<AuditResponse>('/bcp/audit', { params }).then((r) => r.data),
};
