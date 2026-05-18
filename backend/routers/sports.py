"""
Sports router - /api/sports
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.sport import Sport
from schemas.sport import SportCreate, SportRead, SportUpdate

router = APIRouter(prefix="/api/sports", tags=["sports"])


@router.get("/", response_model=list[SportRead])
async def list_sports(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Sport).order_by(Sport.name))
    return result.scalars().all()


@router.post("/", response_model=SportRead, status_code=status.HTTP_201_CREATED)
async def create_sport(payload: SportCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Sport).where(Sport.name == payload.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Uno sport con nome '{payload.name}' esiste già",
        )
    sport = Sport(name=payload.name, config=payload.config)
    db.add(sport)
    await db.flush()
    await db.refresh(sport)
    return sport


@router.get("/{sport_id}", response_model=SportRead)
async def get_sport(sport_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Sport).where(Sport.id == sport_id))
    sport = result.scalar_one_or_none()
    if sport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sport non trovato")
    return sport


@router.put("/{sport_id}", response_model=SportRead)
async def update_sport(
    sport_id: int, payload: SportUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Sport).where(Sport.id == sport_id))
    sport = result.scalar_one_or_none()
    if sport is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sport non trovato")
    if payload.name is not None:
        sport.name = payload.name
    if payload.config is not None:
        sport.config = payload.config
    await db.flush()
    await db.refresh(sport)
    return sport
