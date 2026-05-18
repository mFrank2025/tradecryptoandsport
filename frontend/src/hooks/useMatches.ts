import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { matchesApi } from '../api/matches';
import { CreateMatchForm, LogEventForm } from '../types';
import toast from 'react-hot-toast';

export function useMatches(params?: {
  status?: string;
  team_id?: number;
  competition?: string;
  season?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ['matches', params],
    queryFn: () => matchesApi.getAll(params),
  });
}

export function useRecentMatches(limit = 5) {
  return useQuery({
    queryKey: ['matches', 'recent', limit],
    queryFn: () => matchesApi.getRecent(limit),
  });
}

export function useMatch(id: number) {
  return useQuery({
    queryKey: ['matches', id],
    queryFn: () => matchesApi.getById(id),
    enabled: !!id,
  });
}

export function useMatchLineup(matchId: number) {
  return useQuery({
    queryKey: ['matches', matchId, 'lineup'],
    queryFn: () => matchesApi.getLineup(matchId),
    enabled: !!matchId,
  });
}

export function useMatchEvents(matchId: number, refetchInterval?: number) {
  return useQuery({
    queryKey: ['matches', matchId, 'events'],
    queryFn: () => matchesApi.getEvents(matchId),
    enabled: !!matchId,
    refetchInterval,
  });
}

export function useMatchStats(matchId: number) {
  return useQuery({
    queryKey: ['matches', matchId, 'stats'],
    queryFn: () => matchesApi.getStats(matchId),
    enabled: !!matchId,
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMatchForm) => matchesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      toast.success('Partita creata con successo!');
    },
    onError: () => toast.error('Errore nella creazione della partita'),
  });
}

export function useLogEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, data }: { matchId: number; data: LogEventForm }) =>
      matchesApi.logEvent(matchId, data),
    onSuccess: (_, { matchId }) => {
      qc.invalidateQueries({ queryKey: ['matches', matchId, 'events'] });
      qc.invalidateQueries({ queryKey: ['matches', matchId] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ matchId, eventId }: { matchId: number; eventId: number }) =>
      matchesApi.deleteEvent(matchId, eventId),
    onSuccess: (_, { matchId }) => {
      qc.invalidateQueries({ queryKey: ['matches', matchId, 'events'] });
      toast.success('Evento rimosso');
    },
  });
}

export function useMatchControl() {
  const qc = useQueryClient();
  const invalidate = (id: number) => {
    qc.invalidateQueries({ queryKey: ['matches', id] });
  };

  const startMatch = useMutation({
    mutationFn: (id: number) => matchesApi.startMatch(id),
    onSuccess: (_, id) => { invalidate(id); toast.success('Partita iniziata!'); },
  });

  const endHalfTime = useMutation({
    mutationFn: (id: number) => matchesApi.endHalfTime(id),
    onSuccess: (_, id) => { invalidate(id); toast.success('Intervallo!'); },
  });

  const startSecondHalf = useMutation({
    mutationFn: (id: number) => matchesApi.startSecondHalf(id),
    onSuccess: (_, id) => { invalidate(id); toast.success('Secondo tempo iniziato!'); },
  });

  const endMatch = useMutation({
    mutationFn: (id: number) => matchesApi.endMatch(id),
    onSuccess: (_, id) => { invalidate(id); toast.success('Partita terminata!'); },
  });

  return { startMatch, endHalfTime, startSecondHalf, endMatch };
}
