import type { BadgeTone } from '@/components/ui/tone-badge';
import type { BcpNoteType } from '@/modules/clinical-notes/types';

/**
 * One tone per note type. Kinds a reader must not confuse are given colours
 * that are not neighbours: Order and Medication act on a patient, Incident is
 * the one that should catch the eye, and the observational types share the
 * cool end of the range.
 */
export const NOTE_TYPE_TONE: Record<BcpNoteType, BadgeTone> = {
  ORDER: 'violet',
  MEDICATION: 'fuchsia',
  INVESTIGATION: 'cyan',
  PROGRESS: 'blue',
  ASSESSMENT: 'indigo',
  NURSING: 'teal',
  HANDOVER: 'amber',
  INCIDENT: 'red',
  COMMUNICATION: 'sky',
  OTHER: 'slate',
};

/** One tone per care setting, in rough order of acuity. */
export const CARE_SETTING_TONE: Record<string, BadgeTone> = {
  INPATIENT: 'indigo',
  OUTPATIENT: 'teal',
  DAYCARE: 'cyan',
  EMERGENCY: 'rose',
};
