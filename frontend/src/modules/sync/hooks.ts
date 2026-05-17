'use client';

import { useQuery } from '@tanstack/react-query';
import { syncService } from './services';

export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync', 'status'],
    queryFn: syncService.getStatus,
    refetchInterval: 30_000,
  });
}
