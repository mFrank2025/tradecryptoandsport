from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MatchBase(BaseModel):
    sport_id: int
    home_team_id: int
    away_team_id: int
    date: datetime
    venue: str | None = None
    status: str = "scheduled"
    score_home: int = 0
    score_away: int = 0
    duration_minutes: int = 90
    match_type: str = "friendly"
    weather: str | None = None
    pitch_condition: str | None = None
    notes: str | None = None


class MatchCreate(MatchBase):
    pass


class MatchUpdate(BaseModel):
    date: datetime | None = None
    venue: str | None = None
    status: str | None = None
    score_home: int | None = None
    score_away: int | None = None
    duration_minutes: int | None = None
    match_type: str | None = None
    weather: str | None = None
    pitch_condition: str | None = None
    notes: str | None = None


class MatchRead(MatchBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class MatchPlayerBase(BaseModel):
    match_id: int
    player_id: int
    team_id: int
    position_played: str | None = None
    jersey_number: int | None = None
    is_starter: bool = True
    minutes_played: int = 0
    substituted_in_at: int | None = None
    substituted_out_at: int | None = None


class MatchPlayerCreate(BaseModel):
    player_id: int
    team_id: int
    position_played: str | None = None
    jersey_number: int | None = None
    is_starter: bool = True
    minutes_played: int = 0
    substituted_in_at: int | None = None
    substituted_out_at: int | None = None


class MatchPlayerRead(MatchPlayerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class LineupSetRequest(BaseModel):
    players: list[MatchPlayerCreate]
