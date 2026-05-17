import apiClient from '@/lib/api/client';
import type { SyncStatusResponse } from './types';

export const syncService = {
  getStatus: () => apiClient.get<SyncStatusResponse>('/bcp/sync/status').then((r) => r.data),
};
