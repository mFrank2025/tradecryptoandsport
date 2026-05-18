from datetime import datetime, date
from pydantic import BaseModel, ConfigDict


class PlayerBase(BaseModel):
    first_name: str
    last_name: str
    birth_date: date | None = None
    team_id: int | None = None
    primary_position: str | None = None
    secondary_positions: list[str] = []
    height_cm: float | None = None
    weight_kg: float | None = None
    foot: str | None = None  # left/right/both
    notes: str | None = None


class PlayerCreate(PlayerBase):
    pass


class PlayerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    birth_date: date | None = None
    team_id: int | None = None
    primary_position: str | None = None
    secondary_positions: list[str] | None = None
    height_cm: float | None = None
    weight_kg: float | None = None
    foot: str | None = None
    photo_url: str | None = None
    notes: str | None = None


class PlayerRead(PlayerBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    photo_url: str | None = None
    age: int | None = None
    created_at: datetime
