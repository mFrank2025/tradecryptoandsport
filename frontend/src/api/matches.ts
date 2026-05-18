import client from './client';
import { Match, MatchEvent, MatchPlayer, CreateMatchForm, LogEventForm } from '../types';

export const matchesApi = {
  getAll: (params?: {
    status?: string;
    team_id?: number;
    competition?: string;
    season?: string;
    page?: number;
    page_size?: number;
  }) => client.get<Match[]>('/matches', { params }).then((r) => r.data),

  getById: (id: number) =>
    client.get<Match>(`/matches/${id}`).then((r) => r.data),

  create: (data: CreateMatchForm) =>
    client.post<Match>('/matches', data).then((r) => r.data),

  update: (id: number, data: Partial<Match>) =>
    client.put<Match>(`/matches/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/matches/${id}`).then((r) => r.data),

  // Lineup
  getLineup: (id: number) =>
    client.get<MatchPlayer[]>(`/matches/${id}/lineup`).then((r) => r.data),

  addToLineup: (id: number, data: Partial<MatchPlayer>) =>
    client.post<MatchPlayer>(`/matches/${id}/lineup`, data).then((r) => r.data),

  updateLineupPlayer: (matchId: number, playerId: number, data: Partial<MatchPlayer>) =>
    client.put<MatchPlayer>(`/matches/${matchId}/lineup/${playerId}`, data).then((r) => r.data),

  removeFromLineup: (matchId: number, playerId: number) =>
    client.delete(`/matches/${matchId}/lineup/${playerId}`).then((r) => r.data),

  // Events
  getEvents: (id: number) =>
    client.get<MatchEvent[]>(`/matches/${id}/events`).then((r) => r.data),

  logEvent: (id: number, data: LogEventForm) =>
    client.post<MatchEvent>(`/matches/${id}/events`, data).then((r) => r.data),

  deleteEvent: (matchId: number, eventId: number) =>
    client.delete(`/matches/${matchId}/events/${eventId}`).then((r) => r.data),

  // Match control
  startMatch: (id: number) =>
    client.post<Match>(`/matches/${id}/start`).then((r) => r.data),

  pauseMatch: (id: number) =>
    client.post<Match>(`/matches/${id}/pause`).then((r) => r.data),

  endHalfTime: (id: number) =>
    client.post<Match>(`/matches/${id}/halftime`).then((r) => r.data),

  startSecondHalf: (id: number) =>
    client.post<Match>(`/matches/${id}/second-half`).then((r) => r.data),

  endMatch: (id: number) =>
    client.post<Match>(`/matches/${id}/end`).then((r) => r.data),

  updateScore: (id: number, home_score: number, away_score: number) =>
    client.post<Match>(`/matches/${id}/score`, { home_score, away_score }).then((r) => r.data),

  updateMinute: (id: number, minute: number) =>
    client.post<Match>(`/matches/${id}/minute`, { minute }).then((r) => r.data),

  // Stats
  getStats: (id: number) =>
    client.get(`/matches/${id}/stats`).then((r) => r.data),

  getPlayerRatings: (id: number) =>
    client.get(`/matches/${id}/ratings`).then((r) => r.data),

  getRecent: (limit?: number) =>
    client.get<Match[]>('/matches/recent', { params: { limit } }).then((r) => r.data),
};
