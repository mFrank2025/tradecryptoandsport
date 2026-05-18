import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playersApi } from '../api/players';
import { CreatePlayerForm } from '../types';
import toast from 'react-hot-toast';

export function usePlayers(params?: { team_id?: number; position?: string; search?: string }) {
  return useQuery({
    queryKey: ['players', params],
    queryFn: () => playersApi.getAll(params),
  });
}

export function usePlayer(id: number) {
  return useQuery({
    queryKey: ['players', id],
    queryFn: () => playersApi.getById(id),
    enabled: !!id,
  });
}

export function usePlayerStats(id: number, season?: string) {
  return useQuery({
    queryKey: ['players', id, 'stats', season],
    queryFn: () => playersApi.getStats(id, season),
    enabled: !!id,
  });
}

export function usePlayerAnalyses(id: number) {
  return useQuery({
    queryKey: ['players', id, 'analyses'],
    queryFn: () => playersApi.getAnalyses(id),
    enabled: !!id,
  });
}

export function usePlayerMatchHistory(id: number) {
  return useQuery({
    queryKey: ['players', id, 'matches'],
    queryFn: () => playersApi.getMatchHistory(id),
    enabled: !!id,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlayerForm) => playersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
      toast.success('Giocatore creato con successo!');
    },
    onError: () => toast.error('Errore nella creazione del giocatore'),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePlayerForm> }) =>
      playersApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['players', id] });
      qc.invalidateQueries({ queryKey: ['players'] });
      toast.success('Giocatore aggiornato!');
    },
    onError: () => toast.error('Errore nell\'aggiornamento del giocatore'),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => playersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['players'] });
      toast.success('Giocatore eliminato');
    },
    onError: () => toast.error('Errore nell\'eliminazione del giocatore'),
  });
}

export function useGeneratePlayerAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (playerId: number) => playersApi.generateAnalysis(playerId),
    onSuccess: (_, playerId) => {
      qc.invalidateQueries({ queryKey: ['players', playerId, 'analyses'] });
      toast.success('Analisi AI generata!');
    },
    onError: () => toast.error('Errore nella generazione dell\'analisi AI'),
  });
}
