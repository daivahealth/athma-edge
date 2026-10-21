import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCreateClinicalNote } from '@/modules/clinical-notes/hooks';
import type { BcpNoteType } from '@/modules/clinical-notes/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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

interface CreateNoteDialogProps {
  mrn: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateNoteDialog({ mrn, open, onOpenChange }: CreateNoteDialogProps) {
  const [noteType, setNoteType] = useState<BcpNoteType | ''>('');
  const [content, setContent] = useState('');
  const mutation = useCreateClinicalNote(mrn);

  const canSubmit = noteType !== '' && content.trim().length > 0 && content.length <= MAX_CONTENT_LENGTH;

  const handleSubmit = () => {
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate(
      { noteType: noteType as BcpNoteType, content: content.trim() },
      {
        onSuccess: () => {
          setNoteType('');
          setContent('');
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Clinical Note</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
