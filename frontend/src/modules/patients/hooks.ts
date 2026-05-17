'use client';

import { useQuery } from '@tanstack/react-query';
import { patientService } from './services';
import type { PatientSearchParams } from './types';

export function usePatientSearch(params: PatientSearchParams) {
  return useQuery({
    queryKey: ['patients', 'search', params],
    queryFn: () => patientService.search(params),
  });
}

export function useClinicalProfile(mrn: string) {
  return useQuery({
    queryKey: ['patients', 'profile', mrn],
    queryFn: () => patientService.getProfile(mrn),
    enabled: !!mrn,
  });
}
