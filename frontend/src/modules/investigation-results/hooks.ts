import { useQuery } from '@tanstack/react-query';
import { investigationResultService } from './services';
import type { InvestigationResultCategory } from './types';

export function useInvestigationResults(mrn: string, category: InvestigationResultCategory = 'LAB') {
  return useQuery({
    queryKey: ['investigation-results', mrn, category],
    queryFn: () => investigationResultService.getByMrn(mrn, category),
    enabled: !!mrn,
  });
}
