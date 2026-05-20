import apiClient from '@/lib/api/client';
import type { ClinicalNote, ClinicalNoteListParams, ClinicalNoteListResponse, CreateClinicalNoteRequest } from './types';

export const clinicalNoteService = {
  listAll: (params?: ClinicalNoteListParams) =>
    apiClient.get<ClinicalNoteListResponse>('/bcp/clinical-notes', { params }).then((r) => r.data),

  listByMrn: (mrn: string, params?: ClinicalNoteListParams) =>
    apiClient.get<ClinicalNoteListResponse>(`/bcp/patients/${mrn}/notes`, { params }).then((r) => r.data),

  create: (mrn: string, data: CreateClinicalNoteRequest) =>
    apiClient.post<{ data: ClinicalNote }>(`/bcp/patients/${mrn}/notes`, data).then((r) => r.data.data),
};
