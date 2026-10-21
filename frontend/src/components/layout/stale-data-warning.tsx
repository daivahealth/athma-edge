import { AlertTriangle } from 'lucide-react';
import { timeAgo, syncAgeColor } from '@/lib/utils/formatters';

interface StaleDataWarningProps {
  lastSyncedAt: string | null;
  label?: string;
}

export function StaleDataWarning({ lastSyncedAt, label = 'Data' }: StaleDataWarningProps) {
  if (!lastSyncedAt) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{label} has never been synced.</span>
      </div>
    );
  }

  const ageMs = Date.now() - new Date(lastSyncedAt).getTime();
  if (ageMs < 5 * 60_000) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        {label} last synced {timeAgo(lastSyncedAt)} — data may be stale.
      </span>
    </div>
  );
}

export function SyncTimestamp({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  return (
    <span className={syncAgeColor(lastSyncedAt)}>
      Last synced: {lastSyncedAt ? timeAgo(lastSyncedAt) : 'Never'}
    </span>
  );
}
