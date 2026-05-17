'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePatientSearch } from '@/modules/patients/hooks';
import type { PatientSearchParams } from '@/modules/patients/types';
import { CARE_SETTINGS, CARE_SETTING_LABELS } from '@/lib/utils/constants';
import { formatDateTime, syncAgeColor, timeAgo } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function PatientSearchPage() {
  const [params, setParams] = useState<PatientSearchParams>({
    q: '',
    careSetting: '',
    activeOnly: true,
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isFetching } = usePatientSearch(params);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((p) => ({ ...p, page: 1 }));
  };

  const changePage = (newPage: number) => {
    setParams((p) => ({ ...p, page: newPage }));
  };

  const totalPages = data ? Math.ceil(data.meta.total / data.meta.limit) : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Patient Search</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-sm font-medium">Search</label>
              <Input
                placeholder="MRN, UHID, name, or mobile..."
                value={params.q || ''}
                onChange={(e) => setParams((p) => ({ ...p, q: e.target.value }))}
              />
            </div>
            <div className="w-48">
              <label className="mb-1 block text-sm font-medium">Care Setting</label>
              <Select
                value={params.careSetting || 'ALL'}
                onValueChange={(v) => setParams((p) => ({ ...p, careSetting: v === 'ALL' ? '' : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Settings</SelectItem>
                  {CARE_SETTINGS.map((cs) => (
                    <SelectItem key={cs} value={cs}>
                      {CARE_SETTING_LABELS[cs]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">
              Results ({data.meta.total} patient{data.meta.total !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.data.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No patients found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">MRN</th>
                      <th className="pb-3 pr-4 font-medium">Patient Name</th>
                      <th className="pb-3 pr-4 font-medium">Care Setting</th>
                      <th className="pb-3 pr-4 font-medium">Ward / Bed</th>
                      <th className="pb-3 pr-4 font-medium">Consultant</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((patient) => (
                      <tr key={patient.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 pr-4">
                          <Link href={`/patients/${patient.mrn}`} className="font-medium text-primary hover:underline">
                            {patient.mrn}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{patient.patientName}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">
                            {CARE_SETTING_LABELS[patient.careSetting as keyof typeof CARE_SETTING_LABELS] || patient.careSetting}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {patient.wardName || '—'}
                          {patient.bedNumber ? ` / ${patient.bedNumber}` : ''}
                        </td>
                        <td className="py-3 pr-4">{patient.consultantName || '—'}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={patient.isActive ? 'success' : 'outline'}>
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className={`py-3 text-xs ${syncAgeColor(patient.lastSyncedAt)}`}>
                          {timeAgo(patient.lastSyncedAt)}
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
                  Page {data.meta.page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => changePage(data.meta.page - 1)} disabled={data.meta.page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => changePage(data.meta.page + 1)} disabled={data.meta.page >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <p className="text-center text-muted-foreground">Loading patients...</p>
      )}
    </div>
  );
}
