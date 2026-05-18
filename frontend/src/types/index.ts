// ─── Sport ────────────────────────────────────────────────────────────────────
export type SportType = 'football' | 'basketball' | 'tennis' | 'volleyball';

export interface Sport {
  id: string;
  name: string;
  icon: string;
  type: SportType;
}

// ─── Team ─────────────────────────────────────────────────────────────────────
export interface Team {
  id: number;
  name: string;
  short_name?: string;
  city?: string;
  founded_year?: number;
  colors?: string;
  logo_url?: string;
  sport: SportType;
  coach_name?: string;
  stadium?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Player ───────────────────────────────────────────────────────────────────
export type PlayerPosition =
  | 'GK'
  | 'CB'
  | 'LB'
  | 'RB'
  | 'CDM'
  | 'CM'
  | 'CAM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'CF'
  | 'ST';

export interface Player {
  id: number;
  name: string;
  surname: string;
  full_name?: string;
  date_of_birth?: string;
  age?: number;
  nationality?: string;
  position: PlayerPosition;
  secondary_position?: PlayerPosition;
  jersey_number?: number;
  team_id?: number;
  team?: Team;
  height_cm?: number;
  weight_kg?: number;
  preferred_foot?: 'left' | 'right' | 'both';
  photo_url?: string;
  market_value?: number;
  contract_until?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

// ─── Match ────────────────────────────────────────────────────────────────────
export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished' | 'cancelled' | 'postponed';
export type MatchPhase = 'first_half' | 'second_half' | 'extra_time' | 'penalties';

export interface Match {
  id: number;
  home_team_id: number;
  away_team_id: number;
  home_team?: Team;
  away_team?: Team;
  date: string;
  venue?: string;
  competition?: string;
  season?: string;
  matchday?: number;
  status: MatchStatus;
  phase?: MatchPhase;
  home_score: number;
  away_score: number;
  home_score_ht?: number;
  away_score_ht?: number;
  minute?: number;
  attendance?: number;
  referee?: string;
  weather?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Match Player (Lineup) ────────────────────────────────────────────────────
export interface MatchPlayer {
  id: number;
  match_id: number;
  player_id: number;
  player?: Player;
  team_id: number;
  is_starter: boolean;
  position_played?: PlayerPosition;
  jersey_number?: number;
  rating?: number;
  minutes_played?: number;
  substituted_in_minute?: number;
  substituted_out_minute?: number;
  goals?: number;
  assists?: number;
  yellow_cards?: number;
  red_cards?: number;
  shots?: number;
  shots_on_target?: number;
  passes?: number;
  pass_accuracy?: number;
  tackles?: number;
  interceptions?: number;
  fouls_committed?: number;
  fouls_suffered?: number;
}

// ─── Event ────────────────────────────────────────────────────────────────────
export type EventType =
  | 'goal'
  | 'own_goal'
  | 'penalty_goal'
  | 'penalty_miss'
  | 'yellow_card'
  | 'red_card'
  | 'second_yellow'
  | 'substitution'
  | 'shot_on_target'
  | 'shot_off_target'
  | 'shot_blocked'
  | 'corner'
  | 'free_kick'
  | 'offside'
  | 'foul'
  | 'save'
  | 'tackle'
  | 'interception'
  | 'pass_key'
  | 'dribble'
  | 'header'
  | 'cross'
  | 'clearance'
  | 'var_check'
  | 'injury'
  | 'kickoff'
  | 'halftime'
  | 'fulltime'
  | 'extra_time_start'
  | 'penalty_shootout';

export interface MatchEvent {
  id: number;
  match_id: number;
  type: EventType;
  minute: number;
  added_time?: number;
  player_id?: number;
  player?: Player;
  assist_player_id?: number;
  assist_player?: Player;
  team_id?: number;
  team?: Team;
  x_position?: number;  // 0-100 (percentage of pitch width)
  y_position?: number;  // 0-100 (percentage of pitch height)
  description?: string;
  is_confirmed: boolean;
  created_at: string;
}

// ─── Player Statistics ────────────────────────────────────────────────────────
export interface PlayerStatistics {
  player_id: number;
  player?: Player;
  season?: string;
  matches_played: number;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  shots: number;
  shots_on_target: number;
  pass_accuracy: number;
  tackles: number;
  interceptions: number;
  dribbles_completed: number;
  fouls_committed: number;
  fouls_suffered: number;
  rating_avg: number;
  // Goalkeeper stats
  saves?: number;
  goals_conceded?: number;
  clean_sheets?: number;
}

// ─── Player Analysis (AI) ─────────────────────────────────────────────────────
export interface PlayerStrength {
  area: string;
  description: string;
  score: number;
}

export interface PlayerWeakness {
  area: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ImprovementTip {
  category: string;
  tip: string;
  drill?: string;
}

export interface RoleSuggestion {
  position: PlayerPosition;
  fit_percentage: number;
  explanation: string;
}

export interface PlayerAnalysis {
  id: number;
  player_id: number;
  player?: Player;
  analysis_date: string;
  overall_rating: number;
  potential_rating?: number;
  strengths: PlayerStrength[];
  weaknesses: PlayerWeakness[];
  improvement_tips: ImprovementTip[];
  role_suggestions: RoleSuggestion[];
  tactical_notes?: string;
  raw_analysis?: string;
  model_used?: string;
}

// ─── Training Session ─────────────────────────────────────────────────────────
export type TrainingType =
  | 'technical'
  | 'tactical'
  | 'physical'
  | 'recovery'
  | 'match_simulation'
  | 'set_pieces'
  | 'goalkeeper'
  | 'strength';

export interface TrainingDrill {
  name: string;
  duration_minutes: number;
  description?: string;
  focus_area?: string;
}

export interface TrainingSession {
  id: number;
  team_id: number;
  team?: Team;
  date: string;
  type: TrainingType;
  duration_minutes: number;
  location?: string;
  coach?: string;
  drills: TrainingDrill[];
  players_attended: number[];
  attendance_count?: number;
  notes?: string;
  intensity?: 'low' | 'medium' | 'high' | 'maximum';
  focus_topics?: string[];
  created_at: string;
}

// ─── Live Match State ─────────────────────────────────────────────────────────
export interface LiveMatchState {
  match_id: number;
  status: MatchStatus;
  minute: number;
  home_score: number;
  away_score: number;
  events: MatchEvent[];
  home_lineup: MatchPlayer[];
  away_lineup: MatchPlayer[];
  last_event?: MatchEvent;
}

// ─── AI Responses ─────────────────────────────────────────────────────────────
export interface LiveSuggestion {
  suggestion: string;
  tactical_advice: string;
  player_to_watch?: string;
  formation_tip?: string;
  confidence: number;
  generated_at: string;
}

export interface MatchReport {
  match_id: number;
  summary: string;
  home_team_performance: string;
  away_team_performance: string;
  key_moments: string[];
  mvp?: string;
  tactical_analysis: string;
  improvement_areas: Record<string, string[]>;
  generated_at: string;
}

// ─── API Response Wrappers ────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// ─── Form types ───────────────────────────────────────────────────────────────
export interface CreateMatchForm {
  home_team_id: number;
  away_team_id: number;
  date: string;
  venue?: string;
  competition?: string;
  season?: string;
  matchday?: number;
}

export interface CreatePlayerForm {
  name: string;
  surname: string;
  date_of_birth?: string;
  nationality?: string;
  position: PlayerPosition;
  secondary_position?: PlayerPosition;
  jersey_number?: number;
  team_id?: number;
  height_cm?: number;
  weight_kg?: number;
  preferred_foot?: 'left' | 'right' | 'both';
}

export interface LogEventForm {
  type: EventType;
  minute: number;
  player_id?: number;
  assist_player_id?: number;
  team_id?: number;
  x_position?: number;
  y_position?: number;
  description?: string;
}

// ─── UI State ─────────────────────────────────────────────────────────────────
export interface Tab {
  id: string;
  label: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';
