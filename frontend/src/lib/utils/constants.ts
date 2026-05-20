export const CARE_SETTINGS = ['INPATIENT', 'OUTPATIENT', 'DAYCARE', 'EMERGENCY'] as const;
export type CareSetting = (typeof CARE_SETTINGS)[number];

export const CARE_SETTING_LABELS: Record<CareSetting, string> = {
  INPATIENT: 'Inpatient',
  OUTPATIENT: 'Outpatient',
  DAYCARE: 'Day Care',
  EMERGENCY: 'Emergency',
};

export const BCP_LOCAL_SOURCE = 'BCP_LOCAL' as const;

export const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'PATIENT_SEARCHED',
  'PATIENT_VIEWED',
  'PDF_VIEWED',
  'LOGOUT',
  'BCP_NOTE_CREATED',
  'TEMP_PATIENT_CREATED',
  'TEMP_PATIENT_UPDATED',
] as const;

export const ROLES = ['DOCTOR', 'NURSE', 'ADMIN'] as const;
