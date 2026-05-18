"""
Events router - /api/events
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.event import Event
from models.match import Match
from schemas.event import EventCreate, EventRead, EventUpdate

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("/match/{match_id}", response_model=list[EventRead])
async def list_events_for_match(match_id: int, db: AsyncSession = Depends(get_db)):
    m = await db.execute(select(Match).where(Match.id == match_id))
    if m.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    result = await db.execute(
        select(Event)
        .where(Event.match_id == match_id)
        .order_by(Event.minute, Event.extra_time_minute)
    )
    return result.scalars().all()


@router.post("/", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(payload: EventCreate, db: AsyncSession = Depends(get_db)):
    m = await db.execute(select(Match).where(Match.id == payload.match_id))
    match = m.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    event = Event(**payload.model_dump())
    db.add(event)
    await db.flush()
    await db.refresh(event)

    # Broadcast to WebSocket clients if match is live
    if match.status == "live":
        from services.live_match import manager
        event_data = EventRead.model_validate(event).model_dump()
        event_data["match_id"] = event.match_id
        await manager.broadcast_event(match.id, event_data)

        # If it's a goal, update the score broadcast
        if payload.event_type == "goal":
            # Re-read match to get current score
            await db.refresh(match)
            await manager.broadcast_score_update(
                match.id, match.score_home, match.score_away, payload.minute
            )

    return event


@router.put("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: int, payload: EventUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento non trovato")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    await db.flush()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(event_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento non trovato")
    await db.delete(event)
