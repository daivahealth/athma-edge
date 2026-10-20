export type InvestigationResultCategory = 'LAB' | 'RAD' | 'OTHER';

export interface InvestigationServiceMeta {
  serviceName: string;
  serviceCode?: string;
  investigationCode?: string;
  displayOrder?: number;
  serviceDimensionSortType?: string;
  childServices?: InvestigationServiceMeta[];
}

export interface InvestigationResultValue {
  id?: number;
  value?: string | number | null;
  name?: string;
  code?: string;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: string;
  orderedDate?: string;
  collectedDate?: string;
  certifiedDate?: string;
  reportStatus?: string;
}

export interface InvestigationServiceDataNode {
  serviceName: string;
  serviceCode?: string;
  investigationCode?: string;
  // Leaf nodes carry `results` (by date); parent nodes carry `childServices` instead.
  childServices?: Record<string, InvestigationServiceDataNode>;
  results?: Record<string, { date: string; result: InvestigationResultValue }>;
}

export interface InvestigationResultPayload {
  dates: string[];
  services: InvestigationServiceMeta[];
  data: Record<string, InvestigationServiceDataNode>;
}

export interface InvestigationResult {
  category: InvestigationResultCategory;
  mrn: string;
  resultData: InvestigationResultPayload;
  lastSyncedAt: string;
}
