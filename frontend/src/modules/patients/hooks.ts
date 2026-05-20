'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientService } from './services';
import type { PatientSearchParams, CreateTempPatientRequest, UpdateTempPatientRequest } from './types';

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

export function useCreateTempPatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTempPatientRequest) => patientService.createTempPatient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}

export function useUpdateTempPatient(mrn: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTempPatientRequest) => patientService.updateTempPatient(mrn, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
    },
  });
}
