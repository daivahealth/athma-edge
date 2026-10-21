import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, StickyNote, Search, ChevronLeft, ChevronRight, ChevronRight as ArrowRight, FileText } from 'lucide-react';
import { useAllClinicalNotes } from '@/modules/clinical-notes/hooks';
import type { BcpNoteType } from '@/modules/clinical-notes/types';
import { formatDateTime, timeAgo } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export default function ClinicalNotesListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;

  const params = {
    ...(searchQuery.trim() ? { q: searchQuery.trim() } : {}),
    ...(filterType !== 'ALL' ? { noteType: filterType as BcpNoteType } : {}),
    page,
    limit,
  };
  const { data, isLoading } = useAllClinicalNotes(params);

  const notes = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.meta.total / data.meta.limit) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinical Notes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            BCP clinical documentation across all patients
          </p>
        </div>
        <Link to="/clinical-notes/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" /> Create Note
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or MRN..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(v) => {
                setFilterType(v);
                setPage(1);
              }}
            >
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
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="py-8 text-center text-muted-foreground">Loading notes...</p>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <StickyNote className="h-7 w-7" />
              </div>
              <p className="text-lg font-medium text-foreground">No clinical notes yet</p>
              <p className="text-sm">Notes created during BCP events will appear here.</p>
              <Link to="/clinical-notes/new">
                <Button variant="outline" size="sm" className="mt-1">
                  <Plus className="mr-1.5 h-4 w-4" /> Create First Note
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {data?.meta.total} patient{data?.meta.total !== 1 ? 's' : ''} with notes
            </p>
          </div>

          <div className="space-y-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                to={`/clinical-notes/${note.mrn}`}
                className="group block"
              >
                <Card className="transition-all duration-150 hover:shadow-md hover:border-primary/20">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-foreground">{note.patientName || note.mrn}</span>
                            <span className="text-xs text-muted-foreground font-mono">{note.mrn}</span>
                            {(note.age || note.gender) && (
                              <span className="text-xs text-muted-foreground">
                                · {[note.age, note.gender].filter(Boolean).join(' / ')}
                              </span>
                            )}
                            {note.wardName && (
                              <span className="text-xs text-muted-foreground">
                                · {note.wardName}{note.bedNumber ? ` / ${note.bedNumber}` : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {(note.totalNotes ?? 0) > 1 && (
                              <Badge variant="secondary" className="text-[10px]">
                                {note.totalNotes} notes
                              </Badge>
                            )}
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                          <Badge variant={NOTE_TYPE_VARIANT[note.noteType]} className="text-[11px]">
                            {NOTE_TYPE_LABELS[note.noteType]}
                          </Badge>
                          <span className="text-xs text-muted-foreground" title={formatDateTime(note.createdAt)}>
                            {timeAgo(note.createdAt)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            by {note.authorFullName || note.authorUsername}
                          </span>
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
