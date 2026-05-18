from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TeamBase(BaseModel):
    name: str
    sport_id: int
    logo_url: str | None = None
    age_group: str = "adult"


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = None
    sport_id: int | None = None
    logo_url: str | None = None
    age_group: str | None = None


class TeamRead(TeamBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class TeamReadWithPlayers(TeamRead):
    from schemas.player import PlayerRead
    players: list["PlayerRead"] = []
