import apiClient from '@/lib/api/client';
import type {
  PatientSearchParams,
  PatientSearchResponse,
  ClinicalProfile,
  CreateTempPatientRequest,
  UpdateTempPatientRequest,
} from './types';

export const patientService = {
  search: (params: PatientSearchParams) =>
    apiClient.get<PatientSearchResponse>('/bcp/patients/search', { params }).then((r) => r.data),

  getProfile: (mrn: string) =>
    apiClient.get<{ data: ClinicalProfile }>(`/bcp/patients/${mrn}/profile`).then((r) => r.data.data),

  downloadDocument: (documentId: number) =>
    apiClient.get(`/bcp/documents/${documentId}/download`, { responseType: 'blob' }).then((r) => r),

  createTempPatient: (data: CreateTempPatientRequest) =>
    apiClient.post<{ data: any }>('/bcp/patients/register-temp', data).then((r) => r.data.data),

  updateTempPatient: (mrn: string, data: UpdateTempPatientRequest) =>
    apiClient.patch<{ data: any }>(`/bcp/patients/${mrn}/demographics`, data).then((r) => r.data.data),
};
