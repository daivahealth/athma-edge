'use client';

import { useState } from 'react';
import { Plus, StickyNote, FileDown } from 'lucide-react';
import { useClinicalNotes } from '@/modules/clinical-notes/hooks';
import type { BcpNoteType, ClinicalNote } from '@/modules/clinical-notes/types';
import { formatDateTime, timeAgo } from '@/lib/utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CreateNoteDialog } from './create-note-dialog';

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

const BCP_SOURCE = 'BCP';

function downloadBcpNotesAsPdf(mrn: string, notes: ClinicalNote[]) {
  const bcpNotes = notes.filter((n) => n.source === BCP_SOURCE);
  if (bcpNotes.length === 0) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rows = bcpNotes
    .map(
      (n) => `
        <tr>
          <td>${formatDateTime(n.recordedAt)}</td>
          <td>${NOTE_TYPE_LABELS[n.noteType]}</td>
          <td>${n.authorFullName || n.authorUsername} (${n.authorRole})</td>
          <td>${n.source}</td>
          <td style="white-space: pre-wrap;">${n.content.replace(/</g, '&lt;')}</td>
        </tr>`,
    )
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Clinical Notes - ${mrn}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 24px; }
          h1 { font-size: 16px; margin-bottom: 4px; }
          p.meta { color: #555; margin-top: 0; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #f3f3f3; }
        </style>
      </head>
      <body>
        <h1>BCP Clinical Notes — ${mrn}</h1>
        <p class="meta">Source: BCP · ${bcpNotes.length} note${bcpNotes.length !== 1 ? 's' : ''} · Generated ${formatDateTime(new Date())}</p>
        <table>
          <thead>
            <tr>
              <th>Recorded At</th>
              <th>Type</th>
              <th>Author</th>
              <th>Source</th>
              <th>Content</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

interface NotesTabContentProps {
  mrn: string;
}

export function NotesTabContent({ mrn }: NotesTabContentProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSource, setFilterSource] = useState<string>('ALL');
  const params = {
    ...(filterType !== 'ALL' ? { noteType: filterType as BcpNoteType } : {}),
    ...(filterSource !== 'ALL' ? { source: filterSource } : {}),
  };
  const { data, isLoading } = useClinicalNotes(mrn, params);

  const notes = data?.data ?? [];
  const hasBcpNotes = notes.some((n) => n.source === BCP_SOURCE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Clinical Notes</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!hasBcpNotes}
              onClick={() => downloadBcpNotesAsPdf(mrn, notes)}
            >
              <FileDown className="mr-1 h-4 w-4" /> Download PDF
            </Button>
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add Note
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
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
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Sources</SelectItem>
              <SelectItem value={BCP_SOURCE}>BCP</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="py-4 text-center text-muted-foreground">Loading notes...</p>
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
                  <Badge variant="outline" className="text-xs">
                    {note.source}
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto" title={formatDateTime(note.recordedAt)}>
                    {timeAgo(note.recordedAt)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
            {data?.meta && data.meta.total > data.meta.limit && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Showing {notes.length} of {data.meta.total} notes
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CreateNoteDialog mrn={mrn} open={dialogOpen} onOpenChange={setDialogOpen} />
    </Card>
  );
}
