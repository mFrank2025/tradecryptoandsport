"""
Training router - /api/training
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models.analysis import TrainingSession, TrainingPlayerNote
from models.team import Team
from schemas.analysis import (
    TrainingSessionCreate,
    TrainingSessionRead,
    TrainingSessionUpdate,
    TrainingPlayerNoteCreate,
    TrainingPlayerNoteRead,
)

router = APIRouter(prefix="/api/training", tags=["training"])


@router.get("/", response_model=list[TrainingSessionRead])
async def list_training_sessions(
    team_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(TrainingSession).order_by(TrainingSession.date.desc())
    if team_id is not None:
        q = q.where(TrainingSession.team_id == team_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=TrainingSessionRead, status_code=status.HTTP_201_CREATED)
async def create_training_session(
    payload: TrainingSessionCreate, db: AsyncSession = Depends(get_db)
):
    team_result = await db.execute(select(Team).where(Team.id == payload.team_id))
    if team_result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Squadra con id {payload.team_id} non trovata",
        )
    session = TrainingSession(**payload.model_dump())
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/{training_id}")
async def get_training_session(training_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TrainingSession)
        .options(selectinload(TrainingSession.player_notes))
        .where(TrainingSession.id == training_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sessione di allenamento non trovata",
        )
    session_data = TrainingSessionRead.model_validate(session).model_dump()
    session_data["player_notes"] = [
        TrainingPlayerNoteRead.model_validate(n).model_dump() for n in session.player_notes
    ]
    return session_data


@router.put("/{training_id}", response_model=TrainingSessionRead)
async def update_training_session(
    training_id: int,
    payload: TrainingSessionUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == training_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sessione di allenamento non trovata",
        )
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(session, field, value)
    await db.flush()
    await db.refresh(session)
    return session


@router.post("/{training_id}/notes", response_model=TrainingPlayerNoteRead, status_code=status.HTTP_201_CREATED)
async def add_player_note(
    training_id: int,
    payload: TrainingPlayerNoteCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == training_id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sessione di allenamento non trovata",
        )

    note = TrainingPlayerNote(
        training_session_id=training_id,
        player_id=payload.player_id,
        observations=payload.observations,
    )
    db.add(note)
    await db.flush()
    await db.refresh(note)
    return note


@router.post("/{training_id}/video")
async def upload_training_video(
    training_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload a video for a training session."""
    result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == training_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sessione di allenamento non trovata",
        )

    from services.video_processor import save_video
    try:
        metadata = await save_video(file, subfolder="videos")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    session.video_url = metadata["url"]
    await db.flush()
    await db.refresh(session)

    return {
        "message": "Video allenamento caricato con successo",
        "training_session_id": training_id,
        "video_url": metadata["url"],
        "video_id": metadata["video_id"],
    }
