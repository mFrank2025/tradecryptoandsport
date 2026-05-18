from datetime import datetime
from pydantic import BaseModel, ConfigDict


class EventBase(BaseModel):
    match_id: int
    player_id: int | None = None
    team_id: int | None = None
    event_type: str
    minute: int
    extra_time_minute: int | None = None
    x_position: float | None = None
    y_position: float | None = None
    notes: str | None = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    player_id: int | None = None
    team_id: int | None = None
    event_type: str | None = None
    minute: int | None = None
    extra_time_minute: int | None = None
    x_position: float | None = None
    y_position: float | None = None
    notes: str | None = None


class EventRead(EventBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class PlayerStatisticsBase(BaseModel):
    match_id: int
    player_id: int
    goals: int = 0
    assists: int = 0
    shots_on_target: int = 0
    shots_off_target: int = 0
    tackles: int = 0
    interceptions: int = 0
    passes_completed: int = 0
    passes_attempted: int = 0
    dribbles_completed: int = 0
    dribbles_attempted: int = 0
    fouls_committed: int = 0
    fouls_received: int = 0
    yellow_cards: int = 0
    red_cards: int = 0
    minutes_played: int = 0
    rating: float | None = None
    distance_km: float | None = None


class PlayerStatisticsCreate(PlayerStatisticsBase):
    pass


class PlayerStatisticsRead(PlayerStatisticsBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
