from datetime import datetime
from pydantic import BaseModel, ConfigDict


class PlayerAnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player_id: int
    analysis_type: str
    content: dict
    video_url: str | None = None
    match_id: int | None = None
    created_at: datetime


class TrainingSessionBase(BaseModel):
    team_id: int
    date: datetime
    duration_minutes: int = 90
    focus_areas: list[str] = []
    notes: str | None = None
    video_url: str | None = None


class TrainingSessionCreate(TrainingSessionBase):
    pass


class TrainingSessionUpdate(BaseModel):
    date: datetime | None = None
    duration_minutes: int | None = None
    focus_areas: list[str] | None = None
    notes: str | None = None
    video_url: str | None = None


class TrainingSessionRead(TrainingSessionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class TrainingPlayerNoteBase(BaseModel):
    player_id: int
    observations: str | None = None


class TrainingPlayerNoteCreate(TrainingPlayerNoteBase):
    pass


class TrainingPlayerNoteRead(TrainingPlayerNoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    training_session_id: int
    ai_notes: dict = {}
    created_at: datetime


class LiveSuggestionRequest(BaseModel):
    match_id: int
    current_score_home: int
    current_score_away: int
    minute: int
    home_team_name: str
    away_team_name: str
    events_so_far: list[dict] = []
    home_lineup: list[dict] = []
    away_lineup: list[dict] = []
    home_stats: dict = {}
    away_stats: dict = {}
    tactical_notes: str | None = None
