import apiClient from '@/lib/api/client';
import type { PatientSearchParams, PatientSearchResponse, ClinicalProfile } from './types';

export const patientService = {
  search: (params: PatientSearchParams) =>
    apiClient.get<PatientSearchResponse>('/bcp/patients/search', { params }).then((r) => r.data),

  getProfile: (mrn: string) =>
    apiClient.get<{ data: ClinicalProfile }>(`/bcp/patients/${mrn}/profile`).then((r) => r.data.data),

  downloadDocument: (documentId: number) =>
    apiClient.get(`/bcp/documents/${documentId}/download`, { responseType: 'blob' }).then((r) => r),
};
