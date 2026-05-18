"""
Players router - /api/players
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.player import Player
from models.team import Team
from schemas.player import PlayerCreate, PlayerRead, PlayerUpdate
from schemas.event import PlayerStatisticsRead
from schemas.analysis import PlayerAnalysisRead

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("/", response_model=list[PlayerRead])
async def list_players(
    team_id: int | None = Query(None),
    position: str | None = Query(None),
    age_group: str | None = Query(None, description="Filtra per fascia d'età (tramite team)"),
    db: AsyncSession = Depends(get_db),
):
    q = select(Player).order_by(Player.last_name, Player.first_name)
    if team_id is not None:
        q = q.where(Player.team_id == team_id)
    if position is not None:
        q = q.where(Player.primary_position == position)
    if age_group is not None:
        q = q.join(Team, Player.team_id == Team.id).where(Team.age_group == age_group)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=PlayerRead, status_code=status.HTTP_201_CREATED)
async def create_player(payload: PlayerCreate, db: AsyncSession = Depends(get_db)):
    if payload.team_id is not None:
        team_result = await db.execute(select(Team).where(Team.id == payload.team_id))
        if team_result.scalar_one_or_none() is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Squadra con id {payload.team_id} non trovata",
            )
    player = Player(**payload.model_dump())
    db.add(player)
    await db.flush()
    await db.refresh(player)
    return player


@router.get("/{player_id}")
async def get_player(player_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    from services.statistics import get_player_career_stats
    career_stats = await get_player_career_stats(player_id, db)
    player_data = PlayerRead.model_validate(player).model_dump()
    player_data["career_stats"] = career_stats
    return player_data


@router.put("/{player_id}", response_model=PlayerRead)
async def update_player(
    player_id: int, payload: PlayerUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(player, field, value)

    await db.flush()
    await db.refresh(player)
    return player


@router.post("/{player_id}/photo", response_model=PlayerRead)
async def upload_player_photo(
    player_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if player is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    from services.video_processor import save_photo
    try:
        photo_meta = await save_photo(file)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    player.photo_url = photo_meta["url"]
    await db.flush()
    await db.refresh(player)
    return player


@router.get("/{player_id}/statistics", response_model=list[PlayerStatisticsRead])
async def get_player_statistics(player_id: int, db: AsyncSession = Depends(get_db)):
    from models.event import PlayerStatistics

    result = await db.execute(select(Player).where(Player.id == player_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    stats_result = await db.execute(
        select(PlayerStatistics)
        .where(PlayerStatistics.player_id == player_id)
        .order_by(PlayerStatistics.id.desc())
    )
    return stats_result.scalars().all()


@router.get("/{player_id}/analysis", response_model=list[PlayerAnalysisRead])
async def get_player_analyses(player_id: int, db: AsyncSession = Depends(get_db)):
    from models.analysis import PlayerAnalysis

    result = await db.execute(select(Player).where(Player.id == player_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    analysis_result = await db.execute(
        select(PlayerAnalysis)
        .where(PlayerAnalysis.player_id == player_id)
        .order_by(PlayerAnalysis.created_at.desc())
    )
    return analysis_result.scalars().all()


@router.get("/{player_id}/role-suggestion")
async def get_role_suggestion(player_id: int, db: AsyncSession = Depends(get_db)):
    """AI-powered role suggestion based on player stats."""
    result = await db.execute(select(Player).where(Player.id == player_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    from services.ai_analysis import suggest_player_role
    try:
        suggestion = await suggest_player_role(player_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servizio AI non disponibile: {str(e)}",
        )

    # Store the analysis
    from models.analysis import PlayerAnalysis
    from datetime import datetime
    analysis = PlayerAnalysis(
        player_id=player_id,
        analysis_type="role_suggestion",
        content=suggestion,
    )
    db.add(analysis)
    await db.flush()

    return suggestion
