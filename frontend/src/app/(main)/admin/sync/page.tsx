'use client';

import { Activity, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useSyncStatus } from '@/modules/sync/hooks';
import { formatDateTime, timeAgo, syncAgeBg } from '@/lib/utils/formatters';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const statusIcons: Record<string, typeof CheckCircle> = {
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  PARTIAL: AlertTriangle,
  RUNNING: Clock,
};

const statusColors: Record<string, string> = {
  SUCCESS: 'text-green-600',
  FAILED: 'text-red-600',
  PARTIAL: 'text-yellow-600',
  RUNNING: 'text-blue-600',
};

const componentLabels: Record<string, string> = {
  ACTIVE_PATIENT: 'Active Patient Sync',
  CLINICAL_PROFILE: 'Clinical Profile Sync',
  PDF_DOCUMENT: 'PDF Document Sync',
};

export default function SyncStatusPage() {
  const { hasAccess } = useRoleGuard(['ADMIN']);
  const { data, isLoading } = useSyncStatus();

  if (!hasAccess) return null;

  const syncData = data?.data;
  const overall = syncData?.overall;
  const components = syncData?.components;

  const overallColor =
    overall === 'HEALTHY'
      ? 'bg-green-100 text-green-800'
      : overall === 'DEGRADED'
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sync Status</h1>
        {overall && (
          <Badge className={overallColor}>
            Overall: {overall}
          </Badge>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading sync status...</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components?.map((comp) => {
          const Icon = statusIcons[comp.syncStatus] || Activity;
          const color = statusColors[comp.syncStatus] || 'text-muted-foreground';

          return (
            <Card key={comp.syncComponent} className={syncAgeBg(comp.lastSuccessfulSyncAt)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {componentLabels[comp.syncComponent] || comp.syncComponent}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <CardDescription className={color}>{comp.syncStatus}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Success</span>
                  <span>{comp.lastSuccessfulSyncAt ? timeAgo(comp.lastSuccessfulSyncAt) : 'Never'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Attempt</span>
                  <span>{formatDateTime(comp.lastAttemptAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Records</span>
                  <span>{comp.recordsProcessed ?? '—'}</span>
                </div>
                {comp.errorMessage && (
                  <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">{comp.errorMessage}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
