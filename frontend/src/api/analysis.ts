import client from './client';
import { LiveSuggestion, MatchReport, PlayerAnalysis } from '../types';

export const analysisApi = {
  getLiveSuggestion: (matchId: number) =>
    client.post<LiveSuggestion>(`/analysis/live-suggestion`, { match_id: matchId }).then((r) => r.data),

  generateMatchReport: (matchId: number) =>
    client.post<MatchReport>(`/analysis/match-report`, { match_id: matchId }).then((r) => r.data),

  analyzePlayer: (playerId: number) =>
    client.post<PlayerAnalysis>(`/analysis/player/${playerId}`).then((r) => r.data),

  getPlayerAnalyses: (playerId: number) =>
    client.get<PlayerAnalysis[]>(`/analysis/player/${playerId}`).then((r) => r.data),

  getDashboardInsights: () =>
    client.get('/analysis/dashboard').then((r) => r.data),

  compareTeams: (homeTeamId: number, awayTeamId: number) =>
    client.post('/analysis/compare-teams', { home_team_id: homeTeamId, away_team_id: awayTeamId }).then((r) => r.data),
};
