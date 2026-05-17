'use client';

import { AlertTriangle } from 'lucide-react';
import { useSyncStatus } from '@/modules/sync/hooks';
import { cn } from '@/lib/utils/cn';

export function BcpBanner() {
  const { data } = useSyncStatus();
  const overall = data?.data?.overall ?? 'STALE';

  const bgColor =
    overall === 'HEALTHY'
      ? 'bg-amber-600'
      : overall === 'DEGRADED'
        ? 'bg-orange-600'
        : 'bg-red-600';

  return (
    <div className={cn('flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-semibold text-white', bgColor)}>
      <AlertTriangle className="h-4 w-4" />
      <span>BCP LOCAL MODE — This is offline clinical data. Do not use for real-time decisions.</span>
      {overall !== 'HEALTHY' && (
        <span className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs">
          Sync: {overall}
        </span>
      )}
    </div>
  );
}
