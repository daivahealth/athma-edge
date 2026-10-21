import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { usePatientSearch } from '@/modules/patients/hooks';
import { useCreateClinicalNote } from '@/modules/clinical-notes/hooks';
import type { BcpNoteType } from '@/modules/clinical-notes/types';
import { CARE_SETTING_LABELS } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const NOTE_TYPE_LABELS: Record<BcpNoteType, string> = {
  ORDER: 'Order',
  MEDICATION: 'Medication',
  INVESTIGATION: 'Investigation / Diagnostics',
  PROGRESS: 'Progress Note',
  ASSESSMENT: 'Assessment',
  NURSING: 'Nursing Note',
  HANDOVER: 'Shift Handover',
  INCIDENT: 'Incident Report',
  COMMUNICATION: 'Communication',
  OTHER: 'Other',
};

const MAX_CONTENT_LENGTH = 5000;

export default function CreateClinicalNotePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMrn, setSelectedMrn] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState('');
  const [selectedPatientInfo, setSelectedPatientInfo] = useState('');
  const [noteType, setNoteType] = useState<BcpNoteType | ''>('');
  const [content, setContent] = useState('');

  const { data: searchData, isLoading: searchLoading } = usePatientSearch({
    q: searchQuery,
    activeOnly: true,
    limit: 6,
  });

  const mutation = useCreateClinicalNote(selectedMrn || '');
  const patients = searchData?.data ?? [];
  const canSubmit = selectedMrn && noteType !== '' && content.trim().length > 0 && content.length <= MAX_CONTENT_LENGTH;

  const handleSelectPatient = (mrn: string, name: string, info: string) => {
    setSelectedMrn(mrn);
    setSelectedPatientName(name);
    setSelectedPatientInfo(info);
  };

  const handleClearPatient = () => {
    setSelectedMrn(null);
    setSelectedPatientName('');
    setSelectedPatientInfo('');
  };

  const handleSubmit = () => {
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate(
      { noteType: noteType as BcpNoteType, content: content.trim() },
      {
        onSuccess: () => {
          navigate('/clinical-notes');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clinical-notes" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Notes
        </Link>
        <h1 className="text-2xl font-bold">Create Clinical Note</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Step 1: Select Patient */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. Select Patient</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMrn ? (
              <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-4">
                <div>
                  <p className="font-semibold">{selectedPatientName}</p>
                  <p className="text-sm text-muted-foreground">{selectedMrn} · {selectedPatientInfo}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearPatient}>
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by MRN, name, mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchLoading && (
                  <p className="text-xs text-muted-foreground">Searching...</p>
                )}
                {patients.length > 0 && (
                  <div className="max-h-[280px] space-y-1 overflow-y-auto rounded-md border p-1">
                    {patients.map((p) => {
                      const info = [
                        CARE_SETTING_LABELS[p.careSetting as keyof typeof CARE_SETTING_LABELS] || p.careSetting,
                        p.wardName,
                        p.age,
                        p.gender,
                      ].filter(Boolean).join(' · ');
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPatient(p.mrn, p.patientName, info)}
                          className="w-full rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{p.patientName}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              {CARE_SETTING_LABELS[p.careSetting as keyof typeof CARE_SETTING_LABELS] || p.careSetting}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <span>{p.mrn}</span>
                            {p.age && <span>· {p.age}</span>}
                            {p.gender && <span>· {p.gender}</span>}
                            {p.wardName && <span>· {p.wardName}{p.bedNumber ? ` / ${p.bedNumber}` : ''}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {!searchLoading && patients.length === 0 && searchQuery.length > 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">No patients found.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Note Details */}
        <Card className={!selectedMrn ? 'opacity-50 pointer-events-none' : ''}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Note Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Type</label>
              <Select value={noteType} onValueChange={(v) => setNoteType(v as BcpNoteType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select note type..." />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(NOTE_TYPE_LABELS) as [BcpNoteType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Enter note details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[150px]"
                maxLength={MAX_CONTENT_LENGTH}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length} / {MAX_CONTENT_LENGTH}
              </p>
            </div>

            {mutation.isError && (
              <p className="text-sm text-destructive">Failed to save note. Please try again.</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Link to="/clinical-notes">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={!canSubmit || mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Note
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
