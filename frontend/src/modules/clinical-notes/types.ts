export type BcpNoteType =
  | 'ORDER'
  | 'MEDICATION'
  | 'INVESTIGATION'
  | 'PROGRESS'
  | 'ASSESSMENT'
  | 'NURSING'
  | 'HANDOVER'
  | 'INCIDENT'
  | 'COMMUNICATION'
  | 'OTHER';

export interface ClinicalNote {
  id: number;
  mrn: string;
  patientName?: string | null;
  age?: string | null;
  gender?: string | null;
  wardName?: string | null;
  bedNumber?: string | null;
  encounterId: string | null;
  visitNumber: string | null;
  noteType: BcpNoteType;
  content: string;
  authorUsername: string;
  authorFullName: string | null;
  authorRole: string;
  createdAt: string;
  totalNotes?: number;
}

export interface CreateClinicalNoteRequest {
  noteType: BcpNoteType;
  content: string;
  encounterId?: string;
  visitNumber?: string;
}

export interface ClinicalNoteListParams {
  q?: string;
  noteType?: BcpNoteType;
  page?: number;
  limit?: number;
}

export interface ClinicalNoteListResponse {
  data: ClinicalNote[];
  meta: { page: number; limit: number; total: number };
}
