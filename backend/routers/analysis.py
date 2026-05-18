"""
Analysis router - /api/analysis
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.player import Player
from models.match import Match
from models.analysis import PlayerAnalysis, TrainingSession
from schemas.analysis import PlayerAnalysisRead, LiveSuggestionRequest

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


@router.post("/player/{player_id}", response_model=PlayerAnalysisRead)
async def trigger_player_analysis(
    player_id: int,
    analysis_type: str = "general",
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI analysis for a player and store results."""
    p = await db.execute(select(Player).where(Player.id == player_id))
    if p.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    from services.ai_analysis import analyze_player
    try:
        content = await analyze_player(player_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servizio AI non disponibile: {str(e)}",
        )

    analysis = PlayerAnalysis(
        player_id=player_id,
        analysis_type=analysis_type,
        content=content,
    )
    db.add(analysis)
    await db.flush()
    await db.refresh(analysis)
    return analysis


@router.post("/match/{match_id}")
async def trigger_match_analysis(match_id: int, db: AsyncSession = Depends(get_db)):
    """Trigger post-match AI analysis and return report."""
    m = await db.execute(select(Match).where(Match.id == match_id))
    match = m.scalar_one_or_none()
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partita non trovata")

    from services.ai_analysis import generate_post_match_report
    try:
        report = await generate_post_match_report(match_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servizio AI non disponibile: {str(e)}",
        )

    return {"match_id": match_id, "report": report}


@router.post("/live-suggestion")
async def get_live_suggestion(
    payload: LiveSuggestionRequest,
    db: AsyncSession = Depends(get_db),
):
    """Get a live tactical suggestion during a match."""
    from services.ai_analysis import get_live_suggestion
    try:
        suggestion = await get_live_suggestion(payload.model_dump())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servizio AI non disponibile: {str(e)}",
        )

    return {
        "match_id": payload.match_id,
        "minute": payload.minute,
        "suggestion": suggestion,
    }


@router.get("/player/{player_id}", response_model=list[PlayerAnalysisRead])
async def get_player_analyses(
    player_id: int,
    analysis_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all stored analyses for a player."""
    p = await db.execute(select(Player).where(Player.id == player_id))
    if p.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Giocatore non trovato")

    q = (
        select(PlayerAnalysis)
        .where(PlayerAnalysis.player_id == player_id)
        .order_by(PlayerAnalysis.created_at.desc())
    )
    if analysis_type:
        q = q.where(PlayerAnalysis.analysis_type == analysis_type)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("/training/{training_id}")
async def trigger_training_analysis(training_id: int, db: AsyncSession = Depends(get_db)):
    """Analyze a training session using AI."""
    ts = await db.execute(select(TrainingSession).where(TrainingSession.id == training_id))
    if ts.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sessione di allenamento non trovata",
        )

    from services.ai_analysis import analyze_training_session
    try:
        analysis_content = await analyze_training_session(training_id, db)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servizio AI non disponibile: {str(e)}",
        )

    return {"training_session_id": training_id, "analysis": analysis_content}
