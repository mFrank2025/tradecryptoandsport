import client from './client';
import { Player, PlayerStatistics, PlayerAnalysis, CreatePlayerForm } from '../types';

export const playersApi = {
  getAll: (params?: { team_id?: number; position?: string; search?: string; page?: number; page_size?: number }) =>
    client.get<Player[]>('/players', { params }).then((r) => r.data),

  getById: (id: number) =>
    client.get<Player>(`/players/${id}`).then((r) => r.data),

  create: (data: CreatePlayerForm) =>
    client.post<Player>('/players', data).then((r) => r.data),

  update: (id: number, data: Partial<CreatePlayerForm>) =>
    client.put<Player>(`/players/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/players/${id}`).then((r) => r.data),

  getStats: (id: number, season?: string) =>
    client.get<PlayerStatistics>(`/players/${id}/stats`, { params: { season } }).then((r) => r.data),

  getAnalyses: (id: number) =>
    client.get<PlayerAnalysis[]>(`/players/${id}/analyses`).then((r) => r.data),

  generateAnalysis: (id: number) =>
    client.post<PlayerAnalysis>(`/players/${id}/analyze`).then((r) => r.data),

  getMatchHistory: (id: number) =>
    client.get(`/players/${id}/matches`).then((r) => r.data),

  getRoleSuggestions: (id: number) =>
    client.get(`/players/${id}/role-suggestions`).then((r) => r.data),
};
