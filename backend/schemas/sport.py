from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SportBase(BaseModel):
    name: str
    config: dict = {}


class SportCreate(SportBase):
    pass


class SportUpdate(BaseModel):
    name: str | None = None
    config: dict | None = None


class SportRead(SportBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
