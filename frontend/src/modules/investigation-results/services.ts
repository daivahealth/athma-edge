import apiClient from '@/lib/api/client';
import type { InvestigationResult, InvestigationResultCategory } from './types';

export const investigationResultService = {
  getByMrn: (mrn: string, category: InvestigationResultCategory = 'LAB') =>
    apiClient
      .get<{ data: InvestigationResult | null }>(`/bcp/patients/${mrn}/investigation-results`, {
        params: { category },
      })
      .then((r) => r.data.data),
};
