import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, Plus, StickyNote } from 'lucide-react';
import { useClinicalNotes } from '@/modules/clinical-notes/hooks';
import { useClinicalProfile } from '@/modules/patients/hooks';
import type { BcpNoteType } from '@/modules/clinical-notes/types';
import { formatDateTime, timeAgo } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CreateNoteDialog } from '@/components/patients/create-note-dialog';

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

const NOTE_TYPE_VARIANT: Record<BcpNoteType, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  ORDER: 'destructive',
  MEDICATION: 'warning',
  INVESTIGATION: 'default',
  PROGRESS: 'default',
  ASSESSMENT: 'secondary',
  NURSING: 'success',
  HANDOVER: 'warning',
  INCIDENT: 'destructive',
  COMMUNICATION: 'outline',
  OTHER: 'outline',
};

export default function PatientNotesDetailPage() {
  // The route pattern cannot match without :mrn, but React Router
  // still types params as optional.
  const mrn = useParams<{ mrn: string }>().mrn!;
  const [filterType, setFilterType] = useState<string>('ALL');
  const [dialogOpen, setDialogOpen] = useState(false);

  const noteParams = filterType !== 'ALL' ? { noteType: filterType as BcpNoteType } : undefined;
  const { data: notesData, isLoading: notesLoading } = useClinicalNotes(mrn, noteParams);
  const { data: profileData } = useClinicalProfile(mrn);

  const notes = notesData?.data ?? [];
  const patientName = profileData?.patient?.patientName;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/clinical-notes" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Notes
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{patientName || mrn}</h1>
          <p className="text-sm text-muted-foreground">
            <Link to={`/patients/${mrn}`} className="text-primary hover:underline">{mrn}</Link>
            {' '}· Clinical Notes
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Note
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {notesData ? `${notesData.meta.total} note${notesData.meta.total !== 1 ? 's' : ''}` : 'Notes'}
            </CardTitle>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {(Object.entries(NOTE_TYPE_LABELS) as [BcpNoteType, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {notesLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading notes...</p>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
              <StickyNote className="h-8 w-8" />
              <p>No clinical notes recorded yet.</p>
              <p className="text-xs">Click &quot;Add Note&quot; to document activity during this BCP event.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge variant={NOTE_TYPE_VARIANT[note.noteType]}>
                      {NOTE_TYPE_LABELS[note.noteType]}
                    </Badge>
                    <span className="text-sm font-medium">
                      {note.authorFullName || note.authorUsername}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {note.authorRole}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto" title={formatDateTime(note.createdAt)}>
                      {timeAgo(note.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateNoteDialog mrn={mrn} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
