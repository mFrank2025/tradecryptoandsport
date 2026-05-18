"""
Videos router - /api/videos
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

router = APIRouter(prefix="/api/videos", tags=["videos"])


@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    context: str = Form("", description="Contesto del video (partita, allenamento, ecc.)"),
    db: AsyncSession = Depends(get_db),
):
    """Upload a video file (training or match footage)."""
    from services.video_processor import save_video
    try:
        metadata = await save_video(file)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return {
        "message": "Video caricato con successo",
        "video_id": metadata["video_id"],
        "url": metadata["url"],
        "filename": metadata["filename"],
        "original_filename": metadata["original_filename"],
        "size_bytes": metadata["size_bytes"],
        "content_type": metadata["content_type"],
        "context": context,
    }


@router.get("/{video_id}")
async def get_video_metadata(video_id: str, db: AsyncSession = Depends(get_db)):
    """Get metadata for a stored video."""
    from services.video_processor import get_video_metadata
    metadata = get_video_metadata(video_id)
    if metadata is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video con id '{video_id}' non trovato",
        )
    return metadata


@router.post("/{video_id}/analyze")
async def analyze_video(
    video_id: str,
    context: str = Form("", description="Contesto aggiuntivo per l'analisi"),
    db: AsyncSession = Depends(get_db),
):
    """Trigger AI analysis of a video."""
    from services.video_processor import get_video_metadata, analyze_video_with_ai

    metadata = get_video_metadata(video_id)
    if metadata is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video con id '{video_id}' non trovato",
        )

    try:
        analysis = await analyze_video_with_ai(metadata, context=context)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Servizio AI non disponibile: {str(e)}",
        )

    return {
        "video_id": video_id,
        "url": metadata["url"],
        "analysis": analysis,
    }
