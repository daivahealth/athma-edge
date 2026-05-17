export const CARE_SETTINGS = ['INPATIENT', 'OUTPATIENT', 'DAYCARE', 'EMERGENCY'] as const;
export type CareSetting = (typeof CARE_SETTINGS)[number];

export const CARE_SETTING_LABELS: Record<CareSetting, string> = {
  INPATIENT: 'Inpatient',
  OUTPATIENT: 'Outpatient',
  DAYCARE: 'Day Care',
  EMERGENCY: 'Emergency',
};

export const EVENT_TYPES = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'PATIENT_SEARCHED',
  'PATIENT_VIEWED',
  'PDF_VIEWED',
  'LOGOUT',
] as const;

export const ROLES = ['DOCTOR', 'NURSE', 'ADMIN'] as const;
