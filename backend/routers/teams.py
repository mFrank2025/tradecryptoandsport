"""
Teams router - /api/teams
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.team import Team
from models.sport import Sport
from schemas.team import TeamCreate, TeamRead, TeamUpdate

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.get("/", response_model=list[TeamRead])
async def list_teams(
    sport_id: int | None = Query(None, description="Filtra per sport"),
    age_group: str | None = Query(None, description="Filtra per fascia d'età"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Team).order_by(Team.name)
    if sport_id is not None:
        q = q.where(Team.sport_id == sport_id)
    if age_group is not None:
        q = q.where(Team.age_group == age_group)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
async def create_team(payload: TeamCreate, db: AsyncSession = Depends(get_db)):
    # Verify sport exists
    sport_result = await db.execute(select(Sport).where(Sport.id == payload.sport_id))
    if sport_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sport con id {payload.sport_id} non trovato",
        )
    team = Team(**payload.model_dump())
    db.add(team)
    await db.flush()
    await db.refresh(team)
    return team


@router.get("/{team_id}")
async def get_team(team_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Team).options(selectinload(Team.players)).where(Team.id == team_id)
    )
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Squadra non trovata")

    from schemas.player import PlayerRead
    from schemas.team import TeamRead

    team_data = TeamRead.model_validate(team).model_dump()
    team_data["players"] = [
        PlayerRead.model_validate(p).model_dump() for p in team.players
    ]
    return team_data


@router.put("/{team_id}", response_model=TeamRead)
async def update_team(
    team_id: int, payload: TeamUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Squadra non trovata")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team, field, value)

    await db.flush()
    await db.refresh(team)
    return team
