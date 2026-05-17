'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileDown, Loader2 } from 'lucide-react';
import { useClinicalProfile } from '@/modules/patients/hooks';
import { patientService } from '@/modules/patients/services';
import { formatDateTime, formatDate, syncAgeColor, timeAgo } from '@/lib/utils/formatters';
import { CARE_SETTING_LABELS } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StaleDataWarning, SyncTimestamp } from '@/components/layout/stale-data-warning';

export default function ClinicalProfilePage() {
  const { mrn } = useParams<{ mrn: string }>();
  const { data, isLoading, error } = useClinicalProfile(mrn);

  const handleDownload = async (documentId: number, documentName: string) => {
    try {
      const response = await patientService.downloadDocument(documentId);
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download document.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to search
        </Link>
        <p className="text-destructive">Failed to load patient profile.</p>
      </div>
    );
  }

  const { patient, clinicalProfile, documents } = data;
  const cp = clinicalProfile;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold">{patient.patientName}</h1>
        <Badge variant={patient.isActive ? 'success' : 'outline'}>
          {patient.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <StaleDataWarning lastSyncedAt={patient.lastSyncedAt} label="Patient data" />

      <Card>
        <CardContent className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-4">
          <InfoItem label="MRN" value={patient.mrn} />
          <InfoItem label="UHID" value={patient.uhid} />
          <InfoItem label="Gender" value={patient.gender} />
          <InfoItem label="DOB" value={formatDate(patient.dateOfBirth)} />
          <InfoItem
            label="Care Setting"
            value={CARE_SETTING_LABELS[patient.careSetting as keyof typeof CARE_SETTING_LABELS] || patient.careSetting}
          />
          <InfoItem label="Ward / Bed" value={`${patient.wardName || '—'} / ${patient.bedNumber || '—'}`} />
          <InfoItem label="Consultant" value={patient.consultantName} />
          <InfoItem label="Admission" value={formatDateTime(patient.admissionDate)} />
          <InfoItem label="Visit #" value={patient.visitNumber} />
          <InfoItem label="Mobile" value={patient.mobileNumber} />
          <div className="col-span-2 sm:col-span-4">
            <span className={`text-xs ${syncAgeColor(patient.lastSyncedAt)}`}>
              Last synced: {timeAgo(patient.lastSyncedAt)}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="vitals">
        <TabsList>
          <TabsTrigger value="vitals">Vitals</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="investigations">Investigations</TabsTrigger>
          <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="vitals">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Latest Vitals</CardTitle>
              {cp?.lastSyncedAt && <SyncTimestamp lastSyncedAt={cp.lastSyncedAt} />}
            </CardHeader>
            <CardContent>
              <VitalsDisplay data={cp?.latestVitals} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Active Medications</CardTitle>
              {cp?.lastSyncedAt && <SyncTimestamp lastSyncedAt={cp.lastSyncedAt} />}
            </CardHeader>
            <CardContent>
              <MedicationTable data={cp?.activeMedications} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investigations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Investigations</CardTitle>
              {cp?.lastSyncedAt && <SyncTimestamp lastSyncedAt={cp.lastSyncedAt} />}
            </CardHeader>
            <CardContent>
              <InvestigationTable data={cp?.pendingInvestigations} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">PDF Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground">No documents available.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Document</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">{doc.documentName}</td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{doc.documentType.replace(/_/g, ' ')}</Badge>
                        </td>
                        <td className="py-3 pr-4">{formatDate(doc.documentDatetime)}</td>
                        <td className="py-3">
                          <Button size="sm" variant="outline" onClick={() => handleDownload(doc.id, doc.documentName)}>
                            <FileDown className="mr-1 h-3 w-3" /> Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );
}

function VitalsDisplay({ data }: { data: Record<string, any> | null | undefined }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="py-4 text-center text-muted-foreground">No vitals data available.</p>;
  }

  const { recordedAt, ...vitals } = data;

  return (
    <div className="space-y-3">
      {recordedAt && (
        <p className="text-xs text-muted-foreground">Recorded: {formatDateTime(recordedAt)}</p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Object.entries(vitals).map(([key, value]) => (
          <div key={key} className="rounded-lg border bg-muted/30 px-3 py-2">
            <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</p>
            <p className="text-sm font-semibold">{String(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MedicationTable({ data }: { data: any[] | null | undefined }) {
  if (!data || data.length === 0) {
    return <p className="py-4 text-center text-muted-foreground">No medication data available.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-3 pr-4 font-medium">Medication</th>
          <th className="pb-3 pr-4 font-medium">Dose</th>
          <th className="pb-3 pr-4 font-medium">Route</th>
          <th className="pb-3 font-medium">Frequency</th>
        </tr>
      </thead>
      <tbody>
        {data.map((med, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-3 pr-4 font-medium">{med.name || '—'}</td>
            <td className="py-3 pr-4">{med.dose || '—'}</td>
            <td className="py-3 pr-4">
              <Badge variant="secondary">{med.route || '—'}</Badge>
            </td>
            <td className="py-3">{med.frequency || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InvestigationTable({ data }: { data: any[] | null | undefined }) {
  if (!data || data.length === 0) {
    return <p className="py-4 text-center text-muted-foreground">No investigation data available.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-3 pr-4 font-medium">Test</th>
          <th className="pb-3 pr-4 font-medium">Status</th>
          <th className="pb-3 font-medium">Ordered At</th>
        </tr>
      </thead>
      <tbody>
        {data.map((inv, i) => (
          <tr key={i} className="border-b last:border-0">
            <td className="py-3 pr-4 font-medium">{inv.test || inv.name || '—'}</td>
            <td className="py-3 pr-4">
              <Badge variant={inv.status === 'Pending' ? 'warning' : inv.status === 'Sent' ? 'secondary' : 'outline'}>
                {inv.status || '—'}
              </Badge>
            </td>
            <td className="py-3 text-muted-foreground">{inv.orderedAt ? formatDateTime(inv.orderedAt) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
