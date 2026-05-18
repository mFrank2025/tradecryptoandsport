"""
Matches router - /api/matches
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.match import Match, MatchPlayer
from models.team import Team
from models.sport import Sport
from schemas.match import (
    MatchCreate,
    MatchRead,
    MatchUpdate,
    MatchPlayerCreate,
    MatchPlayerRead,
    LineupSetRequest,
)

router = APIRouter(prefix="/api/matches", tags=["matches"])


@router.get("/", response_model=list[MatchRead])
async def list_matches(
    team_id: int | None = Query(None, description="Filtra partite di questa squadra"),
    status_filter: str | None = Query(None, alias="status", description="scheduled/live/completed"),
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    sport_id: int | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Match).order_by(Match.date.desc())
    if team_id is not None:
        q = q.where(or_(Match.home_team_id == team_id, Match.away_team_id == team_id))
    if status_filter is not None:
        q = q.where(Match.status == status_filter)
    if sport_id is not None:
        q = q.where(Match.sport_id == sport_id)
    if date_from is not None:
        q = q.where(Match.date >= date_from)
    if date_to is not None:
        q = q.where(Match.date <= date_to)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=MatchRead, status_code=status.HTTP_201_CREATED)
async def create_match(payload: MatchCreate, db: AsyncSession = Depends(get_db)):
    for team_id in [payload.home_team_id, payload.away_team_id]:
        t = await db.execute(select(Team).where(Team.id == team_id))
        if t.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Squadra con id {team_id} non trovata",
            )
    s = await db.execute(select(Sport).where(Sport.id == payload.sport_id))
    if s.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sport con id {payload.sport_id} non trovato",
        )
    match = Match(**payload.model_dump())
    db.add(match)
    await db.flush()
    await db.refresh(match)
    return match


@router.get("/{match_id}")
async def get_match(match_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Match)
        .options(
            selectinload(Match.players).selectinload(MatchPlayer.player),
            selectinload(Match.events),
            selectinload(Match.home_team),
            selectinload(Match.away_team),
        )
        .where(Match.id == match_id)
    )
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    from schemas.event import EventRead
    match_data = MatchRead.model_validate(match).model_dump()
    match_data["home_team_name"] = match.home_team.name if match.home_team else None
    match_data["away_team_name"] = match.away_team.name if match.away_team else None
    match_data["lineup"] = [MatchPlayerRead.model_validate(mp).model_dump() for mp in match.players]
    match_data["events"] = [EventRead.model_validate(e).model_dump() for e in match.events]
    return match_data


@router.put("/{match_id}", response_model=MatchRead)
async def update_match(
    match_id: int, payload: MatchUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(match, field, value)

    await db.flush()
    await db.refresh(match)
    return match


@router.post("/{match_id}/start", response_model=MatchRead)
async def start_match(match_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")
    if match.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="La partita è già conclusa"
        )
    match.status = "live"
    await db.flush()
    await db.refresh(match)

    from services.live_match import manager
    await manager.broadcast_match_status(match_id, "live")

    return match


@router.post("/{match_id}/end", response_model=MatchRead)
async def end_match(match_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")
    match.status = "completed"
    await db.flush()
    await db.refresh(match)

    from services.live_match import manager
    await manager.broadcast_match_status(match_id, "completed")

    return match


@router.get("/{match_id}/lineup", response_model=list[MatchPlayerRead])
async def get_lineup(match_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    mp_result = await db.execute(
        select(MatchPlayer).where(MatchPlayer.match_id == match_id)
    )
    return mp_result.scalars().all()


@router.post("/{match_id}/lineup", response_model=list[MatchPlayerRead])
async def set_lineup(
    match_id: int, payload: LineupSetRequest, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Match).where(Match.id == match_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    created = []
    for player_entry in payload.players:
        # Check if already in lineup
        existing = await db.execute(
            select(MatchPlayer).where(
                MatchPlayer.match_id == match_id,
                MatchPlayer.player_id == player_entry.player_id,
            )
        )
        mp = existing.scalar_one_or_none()
        if mp:
            # Update
            for field, value in player_entry.model_dump().items():
                setattr(mp, field, value)
        else:
            mp = MatchPlayer(match_id=match_id, **player_entry.model_dump())
            db.add(mp)
        await db.flush()
        await db.refresh(mp)
        created.append(mp)

    return created


@router.get("/{match_id}/statistics")
async def get_match_statistics(match_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    from services.statistics import calculate_team_stats
    home_stats = await calculate_team_stats(match_id, match.home_team_id, db)
    away_stats = await calculate_team_stats(match_id, match.away_team_id, db)

    return {
        "match_id": match_id,
        "home_team_id": match.home_team_id,
        "away_team_id": match.away_team_id,
        "score": {"home": match.score_home, "away": match.score_away},
        "home_stats": home_stats,
        "away_stats": away_stats,
    }


@router.get("/{match_id}/heatmap")
async def get_heatmap_data(
    match_id: int,
    team_id: int | None = Query(None),
    player_id: int | None = Query(None),
    event_type: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return event positions for heatmap visualization (x, y coordinates 0-100)."""
    from models.event import Event

    result = await db.execute(select(Match).where(Match.id == match_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    q = select(Event).where(
        Event.match_id == match_id,
        Event.x_position.is_not(None),
        Event.y_position.is_not(None),
    )
    if team_id is not None:
        q = q.where(Event.team_id == team_id)
    if player_id is not None:
        q = q.where(Event.player_id == player_id)
    if event_type is not None:
        q = q.where(Event.event_type == event_type)

    ev_result = await db.execute(q)
    events = ev_result.scalars().all()

    return {
        "match_id": match_id,
        "filters": {
            "team_id": team_id,
            "player_id": player_id,
            "event_type": event_type,
        },
        "points": [
            {
                "x": e.x_position,
                "y": e.y_position,
                "event_type": e.event_type,
                "minute": e.minute,
                "player_id": e.player_id,
                "team_id": e.team_id,
            }
            for e in events
        ],
        "total_points": len(events),
    }
