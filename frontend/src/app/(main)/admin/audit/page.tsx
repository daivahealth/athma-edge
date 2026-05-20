'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRoleGuard } from '@/hooks/use-auth-guard';
import { useAuditLog } from '@/modules/admin/hooks';
import type { AuditQueryParams } from '@/modules/admin/types';
import { EVENT_TYPES } from '@/lib/utils/constants';
import { formatDateTime } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const eventBadgeVariant: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  LOGIN_SUCCESS: 'default',
  LOGIN_FAILED: 'destructive',
  PATIENT_SEARCHED: 'secondary',
  PATIENT_VIEWED: 'secondary',
  PDF_VIEWED: 'secondary',
  LOGOUT: 'outline',
};

export default function AuditLogPage() {
  const { hasAccess } = useRoleGuard(['ADMIN']);
  const [params, setParams] = useState<AuditQueryParams>({ page: 1, limit: 30 });
  const { data, isLoading } = useAuditLog(params);

  if (!hasAccess) return null;

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.limit) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Event Type</label>
              <Select
                value={params.eventType || 'ALL'}
                onValueChange={(v) => setParams((p) => ({ ...p, eventType: v === 'ALL' ? undefined : v, page: 1 }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Events</SelectItem>
                  {EVENT_TYPES.map((et) => (
                    <SelectItem key={et} value={et}>
                      {et.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Username</label>
              <Input
                placeholder="Filter by user"
                value={params.username || ''}
                onChange={(e) => setParams((p) => ({ ...p, username: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">MRN</label>
              <Input
                placeholder="Filter by MRN"
                value={params.mrn || ''}
                onChange={(e) => setParams((p) => ({ ...p, mrn: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">From</label>
              <Input
                type="date"
                value={params.dateFrom || ''}
                onChange={(e) => setParams((p) => ({ ...p, dateFrom: e.target.value || undefined, page: 1 }))}
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">To</label>
              <Input
                type="date"
                value={params.dateTo || ''}
                onChange={(e) => setParams((p) => ({ ...p, dateTo: e.target.value || undefined, page: 1 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {data ? `${data.meta.total} entries` : 'Loading...'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data?.data.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No audit entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timestamp</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Username</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">MRN</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">IP Address</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.data.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(entry.eventTimestamp)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={eventBadgeVariant[entry.eventType] || 'outline'}>
                          {entry.eventType.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium">{entry.username || '—'}</td>
                      <td className="px-4 py-3">{entry.mrn || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{entry.ipAddress || '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {entry.additionalData ? JSON.stringify(entry.additionalData) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data!.meta.page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) - 1 }))} disabled={(params.page || 1) <= 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setParams((p) => ({ ...p, page: (p.page || 1) + 1 }))} disabled={(params.page || 1) >= totalPages}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
