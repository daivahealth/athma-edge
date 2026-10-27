export interface PatientSearchParams {
  q?: string;
  careSetting?: string;
  ward?: string;
  consultant?: string;
  businessDate?: string;
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface Patient {
  id: number;
  mrn: string;
  uhid: string | null;
  patientName: string;
  dateOfBirth: string | null;
  age: string | null;
  gender: string | null;
  mobileNumber: string | null;
  careSetting: string;
  wardName: string | null;
  bedNumber: string | null;
  roomNumber: string | null;
  consultantName: string | null;
  admissionDate: string | null;
  visitNumber: string | null;
  isActive: boolean;
  lastSyncedAt: string;
  sourceSystem?: string;
}

export interface PatientSearchResponse {
  data: Patient[];
  meta: { page: number; limit: number; total: number };
}

export interface ClinicalProfile {
  patient: Patient;
  clinicalProfile: {
    allergies: string | null;
    bloodGroup: string | null;
    primaryDiagnosis: string | null;
    highRiskFlags: string | null;
    latestVitals: Record<string, any>[] | Record<string, any> | null;
    activeMedications: any[] | null;
    pendingInvestigations: any[] | null;
    criticalResults: string | null;
    handoverNotes: string | null;
    lastClinicalUpdateAt: string | null;
    lastSyncedAt: string | null;
  } | null;
  documents: PdfDocument[];
}

export interface PdfDocument {
  id: number;
  documentType: string;
  documentName: string;
  documentDatetime: string | null;
  fileSize: number | null;
  lastSyncedAt: string;
}

export interface CreateTempPatientRequest {
  patientName: string;
  gender?: string;
  dateOfBirth?: string;
  age?: string;
  mobileNumber?: string;
  careSetting: string;
  wardName?: string;
  bedNumber?: string;
  consultantName?: string;
}

export type UpdateTempPatientRequest = Partial<CreateTempPatientRequest>;
