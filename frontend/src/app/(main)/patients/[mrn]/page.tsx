'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileDown, Loader2, Pencil } from 'lucide-react';
import { useClinicalProfile } from '@/modules/patients/hooks';
import { patientService } from '@/modules/patients/services';
import { formatDateTime, formatDate, syncAgeColor, timeAgo } from '@/lib/utils/formatters';
import { CARE_SETTING_LABELS, BCP_LOCAL_SOURCE } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StaleDataWarning, SyncTimestamp } from '@/components/layout/stale-data-warning';
import { NotesTabContent } from '@/components/patients/notes-tab-content';
import { EditDemographicsDialog } from '@/components/patients/edit-demographics-dialog';

export default function ClinicalProfilePage() {
  const { mrn } = useParams<{ mrn: string }>();
  const { data, isLoading, error } = useClinicalProfile(mrn);
  const [editOpen, setEditOpen] = useState(false);

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
  const isTempPatient = (patient as any).sourceSystem === BCP_LOCAL_SOURCE;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{patient.patientName}</h1>
        <Badge variant={patient.isActive ? 'success' : 'outline'}>
          {patient.isActive ? 'Active' : 'Inactive'}
        </Badge>
        {isTempPatient && (
          <Badge variant="warning">BCP Temporary</Badge>
        )}
      </div>

      {!isTempPatient && <StaleDataWarning lastSyncedAt={patient.lastSyncedAt} label="Patient data" />}

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Demographics</CardTitle>
          {isTempPatient && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
          {!isTempPatient && (
            <div className="col-span-2 sm:col-span-4">
              <span className={`text-xs ${syncAgeColor(patient.lastSyncedAt)}`}>
                Last synced: {timeAgo(patient.lastSyncedAt)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue={isTempPatient ? 'clinical-notes' : 'vitals'}>
        <TabsList>
          {!isTempPatient && (
            <>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="investigations">Investigations</TabsTrigger>
              <TabsTrigger value="documents">Documents ({documents.length})</TabsTrigger>
            </>
          )}
          <TabsTrigger value="clinical-notes">Clinical Notes</TabsTrigger>
        </TabsList>

        {!isTempPatient && (
          <>
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
                        <tr className="border-b bg-muted/30 text-left">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {documents.map((doc) => (
                          <tr key={doc.id} className="transition-colors hover:bg-muted/40">
                            <td className="px-4 py-3 font-medium">{doc.documentName}</td>
                            <td className="px-4 py-3">
                              <Badge variant="secondary">{doc.documentType.replace(/_/g, ' ')}</Badge>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(doc.documentDatetime)}</td>
                            <td className="px-4 py-3">
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
          </>
        )}

        <TabsContent value="clinical-notes">
          <NotesTabContent mrn={mrn} />
        </TabsContent>
      </Tabs>

      {isTempPatient && (
        <EditDemographicsDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mrn={mrn}
          patient={patient}
        />
      )}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value || '—'}</p>
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
          <div key={key} className="rounded-lg border bg-muted/40 px-3.5 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</p>
            <p className="mt-0.5 text-sm font-semibold">{String(value)}</p>
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
        <tr className="border-b bg-muted/30 text-left">
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medication</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dose</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Route</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frequency</th>
        </tr>
      </thead>
      <tbody>
        {data.map((med, i) => (
          <tr key={i} className="border-b last:border-0 transition-colors hover:bg-muted/40">
            <td className="px-4 py-3 font-medium">{med.name || '—'}</td>
            <td className="px-4 py-3">{med.dose || '—'}</td>
            <td className="px-4 py-3">
              <Badge variant="secondary">{med.route || '—'}</Badge>
            </td>
            <td className="px-4 py-3">{med.frequency || '—'}</td>
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
        <tr className="border-b bg-muted/30 text-left">
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Test</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ordered At</th>
        </tr>
      </thead>
      <tbody>
        {data.map((inv, i) => (
          <tr key={i} className="border-b last:border-0 transition-colors hover:bg-muted/40">
            <td className="px-4 py-3 font-medium">{inv.test || inv.name || '—'}</td>
            <td className="px-4 py-3">
              <Badge variant={inv.status === 'Pending' ? 'warning' : inv.status === 'Sent' ? 'secondary' : 'outline'}>
                {inv.status || '—'}
              </Badge>
            </td>
            <td className="px-4 py-3 text-muted-foreground">{inv.orderedAt ? formatDateTime(inv.orderedAt) : '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
