export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(date: string | Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function syncAgeColor(lastSyncedAt: string | Date | null): string {
  if (!lastSyncedAt) return 'text-red-600';
  const ageMs = Date.now() - new Date(lastSyncedAt).getTime();
  const ageMin = ageMs / 60_000;
  if (ageMin < 2) return 'text-green-600';
  if (ageMin < 5) return 'text-yellow-600';
  return 'text-red-600';
}

export function syncAgeBg(lastSyncedAt: string | Date | null): string {
  if (!lastSyncedAt) return 'bg-red-100 border-red-300';
  const ageMs = Date.now() - new Date(lastSyncedAt).getTime();
  const ageMin = ageMs / 60_000;
  if (ageMin < 2) return 'bg-green-100 border-green-300';
  if (ageMin < 5) return 'bg-yellow-100 border-yellow-300';
  return 'bg-red-100 border-red-300';
}

export function timeAgo(date: string | Date | null): string {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}
