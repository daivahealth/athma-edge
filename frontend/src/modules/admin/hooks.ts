import { useQuery } from '@tanstack/react-query';
import { adminService } from './services';
import type { AuditQueryParams } from './types';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: adminService.getUsers,
  });
}

export function useAuditLog(params: AuditQueryParams) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => adminService.getAuditLog(params),
  });
}
