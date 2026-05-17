import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SyncStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(tenantId: string) {
    const components = await this.prisma.bcpSyncStatus.findMany({
      where: { tenantId },
      orderBy: { syncComponent: 'asc' },
    });

    const staleThresholdMs = 10 * 60 * 1000; // 10 minutes
    const now = Date.now();

    let overall: 'HEALTHY' | 'DEGRADED' | 'STALE' = 'HEALTHY';

    const formatted = components.map((c) => {
      const lastSync = c.lastSuccessfulSyncAt?.getTime() || 0;
      const isStale = now - lastSync > staleThresholdMs;

      if (c.syncStatus === 'FAILED' || c.syncStatus === 'PARTIAL') {
        overall = 'DEGRADED';
      } else if (isStale && overall !== 'DEGRADED') {
        overall = 'STALE';
      }

      return {
        syncComponent: c.syncComponent,
        syncStatus: c.syncStatus,
        lastSuccessfulSyncAt: c.lastSuccessfulSyncAt,
        lastAttemptAt: c.lastAttemptAt,
        recordsProcessed: Number(c.recordsProcessed),
        recordsFailed: Number(c.recordsFailed),
        errorMessage: c.errorMessage,
        syncCursor: c.syncCursor,
      };
    });

    return { overall, components: formatted };
  }
}
