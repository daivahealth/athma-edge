import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { usePatientSearch } from '@/modules/patients/hooks';
import type { PatientSearchParams } from '@/modules/patients/types';
import { CARE_SETTINGS, CARE_SETTING_LABELS, BCP_LOCAL_SOURCE } from '@/lib/utils/constants';
import { RegisterTempPatientDialog } from '@/components/patients/register-temp-patient-dialog';
import { formatDateTime, syncAgeColor, timeAgo } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ToneBadge } from '@/components/ui/tone-badge';
import { CARE_SETTING_TONE } from '@/lib/ui/tones';

export default function PatientSearchPage() {
  const [params, setParams] = useState<PatientSearchParams>({
    q: '',
    careSetting: '',
    activeOnly: true,
    page: 1,
    limit: 10,
  });

  const [registerOpen, setRegisterOpen] = useState(false);
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
      <h1 className="text-2xl font-semibold tracking-tight">Patient Search</h1>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
              <Input
                placeholder="MRN, UHID, name, or mobile..."
                value={params.q || ''}
                onChange={(e) => setParams((p) => ({ ...p, q: e.target.value }))}
              />
            </div>
            <div className="w-48">
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Care Setting</label>
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
            <Button type="button" variant="outline" onClick={() => setRegisterOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </form>
        </CardContent>
      </Card>

      {data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-semibold">
              {data.meta.total} patient{data.meta.total !== 1 ? 's' : ''} found
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.data.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <p className="text-lg font-medium">No patients found</p>
                <p className="text-sm">Can&apos;t find the patient? Register a walk-in for BCP.</p>
                <Button variant="outline" size="sm" onClick={() => setRegisterOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Patient
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left">
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">MRN</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient Name</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Age / Gender</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Care Setting</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ward / Bed</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Consultant</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Synced</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.data.map((patient) => (
                      <tr key={patient.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <Link to={`/patients/${patient.mrn}`} className="font-medium text-primary hover:underline">
                            {patient.mrn}
                          </Link>
                          {(patient as any).sourceSystem === BCP_LOCAL_SOURCE && (
                            <ToneBadge tone="orange" strong className="ml-2">TEMP</ToneBadge>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{patient.patientName}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {[patient.age, patient.gender].filter(Boolean).join(' / ') || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <ToneBadge tone={CARE_SETTING_TONE[patient.careSetting] ?? 'slate'} withDot>
                            {CARE_SETTING_LABELS[patient.careSetting as keyof typeof CARE_SETTING_LABELS] || patient.careSetting}
                          </ToneBadge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {patient.wardName || '—'}
                          {patient.bedNumber ? ` / ${patient.bedNumber}` : ''}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{patient.consultantName || '—'}</td>
                        <td className="px-4 py-3">
                          <ToneBadge tone={patient.isActive ? 'green' : 'slate'} withDot>
                            {patient.isActive ? 'Active' : 'Inactive'}
                          </ToneBadge>
                        </td>
                        <td className={`px-4 py-3 text-xs ${syncAgeColor(patient.lastSyncedAt)}`}>
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

      <RegisterTempPatientDialog open={registerOpen} onOpenChange={setRegisterOpen} />
    </div>
  );
}
