import client from './client';
import { TrainingSession } from '../types';

export interface CreateTrainingPayload {
  team_id: number;
  date: string;
  type: string;
  duration_minutes: number;
  location?: string;
  coach?: string;
  notes?: string;
  intensity?: string;
  focus_topics?: string[];
  players_attended?: number[];
}

export const trainingApi = {
  getAll: (params?: { team_id?: number; type?: string; from_date?: string; to_date?: string }) =>
    client.get<TrainingSession[]>('/training', { params }).then((r) => r.data),

  getById: (id: number) =>
    client.get<TrainingSession>(`/training/${id}`).then((r) => r.data),

  create: (data: CreateTrainingPayload) =>
    client.post<TrainingSession>('/training', data).then((r) => r.data),

  update: (id: number, data: Partial<CreateTrainingPayload>) =>
    client.put<TrainingSession>(`/training/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/training/${id}`).then((r) => r.data),

  getStats: (teamId: number) =>
    client.get(`/training/stats`, { params: { team_id: teamId } }).then((r) => r.data),

  addDrill: (id: number, drill: { name: string; duration_minutes: number; description?: string }) =>
    client.post(`/training/${id}/drills`, drill).then((r) => r.data),

  generatePlan: (teamId: number, focus?: string) =>
    client.post('/training/generate-plan', { team_id: teamId, focus }).then((r) => r.data),
};
