export interface SyncComponent {
  syncComponent: string;
  syncStatus: string;
  lastSuccessfulSyncAt: string | null;
  lastAttemptAt: string | null;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage: string | null;
  syncCursor: string | null;
}

export interface SyncStatusResponse {
  data: {
    overall: 'HEALTHY' | 'DEGRADED' | 'STALE';
    components: SyncComponent[];
  };
}
