import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clinicalNoteService } from './services';
import type { ClinicalNoteListParams, CreateClinicalNoteRequest } from './types';

export function useAllClinicalNotes(params?: ClinicalNoteListParams) {
  return useQuery({
    queryKey: ['clinical-notes', 'all', params],
    queryFn: () => clinicalNoteService.listAll(params),
  });
}

export function useClinicalNotes(mrn: string, params?: ClinicalNoteListParams) {
  return useQuery({
    queryKey: ['clinical-notes', 'patient', mrn, params],
    queryFn: () => clinicalNoteService.listByMrn(mrn, params),
    enabled: !!mrn,
  });
}

export function useCreateClinicalNote(mrn: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClinicalNoteRequest) => clinicalNoteService.create(mrn, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-notes'] });
    },
  });
}
