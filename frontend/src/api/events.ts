import client from './client';
import { MatchEvent, EventType } from '../types';

export const eventsApi = {
  getByMatch: (matchId: number) =>
    client.get<MatchEvent[]>(`/matches/${matchId}/events`).then((r) => r.data),

  create: (matchId: number, data: {
    type: EventType;
    minute: number;
    player_id?: number;
    assist_player_id?: number;
    team_id?: number;
    x_position?: number;
    y_position?: number;
    description?: string;
  }) => client.post<MatchEvent>(`/matches/${matchId}/events`, data).then((r) => r.data),

  delete: (matchId: number, eventId: number) =>
    client.delete(`/matches/${matchId}/events/${eventId}`).then((r) => r.data),

  getTypes: () =>
    client.get<{ type: EventType; label: string }[]>('/events/types').then((r) => r.data),
};
