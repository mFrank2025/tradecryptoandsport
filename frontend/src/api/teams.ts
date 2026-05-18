import client from './client';
import { Team } from '../types';

export interface CreateTeamPayload {
  name: string;
  short_name?: string;
  city?: string;
  founded_year?: number;
  colors?: string;
  sport?: string;
  coach_name?: string;
  stadium?: string;
}

export const teamsApi = {
  getAll: (params?: { sport?: string; search?: string }) =>
    client.get<Team[]>('/teams', { params }).then((r) => r.data),

  getById: (id: number) =>
    client.get<Team>(`/teams/${id}`).then((r) => r.data),

  create: (data: CreateTeamPayload) =>
    client.post<Team>('/teams', data).then((r) => r.data),

  update: (id: number, data: Partial<CreateTeamPayload>) =>
    client.put<Team>(`/teams/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/teams/${id}`).then((r) => r.data),

  getPlayers: (id: number) =>
    client.get(`/teams/${id}/players`).then((r) => r.data),

  getMatches: (id: number) =>
    client.get(`/teams/${id}/matches`).then((r) => r.data),
};
