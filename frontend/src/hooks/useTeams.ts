import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi, CreateTeamPayload } from '../api/teams';
import toast from 'react-hot-toast';

export function useTeams(params?: { sport?: string; search?: string }) {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: () => teamsApi.getAll(params),
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: ['teams', id],
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
  });
}

export function useTeamPlayers(id: number) {
  return useQuery({
    queryKey: ['teams', id, 'players'],
    queryFn: () => teamsApi.getPlayers(id),
    enabled: !!id,
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTeamPayload) => teamsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Squadra creata con successo!');
    },
    onError: () => toast.error('Errore nella creazione della squadra'),
  });
}

export function useUpdateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateTeamPayload> }) =>
      teamsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['teams', id] });
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Squadra aggiornata!');
    },
    onError: () => toast.error('Errore nell\'aggiornamento'),
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => teamsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Squadra eliminata');
    },
    onError: () => toast.error('Errore nell\'eliminazione'),
  });
}
