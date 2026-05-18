"""
Video processor service - handles video uploads, metadata, and analysis triggers.
"""
from __future__ import annotations

import os
import uuid
import logging
from pathlib import Path

import aiofiles
from fastapi import UploadFile

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "500"))
ALLOWED_VIDEO_TYPES = {
    "video/mp4",
    "video/avi",
    "video/mov",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/mkv",
    "video/x-matroska",
}


def ensure_upload_dir() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / "videos").mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / "photos").mkdir(parents=True, exist_ok=True)


async def save_video(file: UploadFile, subfolder: str = "videos") -> dict:
    """
    Save an uploaded video to disk and return metadata dict.
    Raises ValueError on invalid file type or size exceeded.
    """
    ensure_upload_dir()

    content_type = file.content_type or ""
    if content_type not in ALLOWED_VIDEO_TYPES:
        raise ValueError(
            f"Tipo file non supportato: {content_type}. "
            f"Tipi ammessi: {', '.join(sorted(ALLOWED_VIDEO_TYPES))}"
        )

    original_filename = file.filename or "video"
    extension = Path(original_filename).suffix.lower() or ".mp4"
    video_id = str(uuid.uuid4())
    filename = f"{video_id}{extension}"
    dest_path = UPLOAD_DIR / subfolder / filename

    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    total_bytes = 0
    chunk_size = 1024 * 1024  # 1 MB chunks

    async with aiofiles.open(dest_path, "wb") as out_file:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                await out_file.close()
                dest_path.unlink(missing_ok=True)
                raise ValueError(
                    f"File troppo grande. Dimensione massima consentita: {MAX_FILE_SIZE_MB} MB"
                )
            await out_file.write(chunk)

    url = f"/uploads/{subfolder}/{filename}"
    logger.info(f"Video salvato: {dest_path} ({total_bytes} bytes)")

    return {
        "video_id": video_id,
        "filename": filename,
        "original_filename": original_filename,
        "url": url,
        "size_bytes": total_bytes,
        "content_type": content_type,
        "path": str(dest_path),
    }


async def save_photo(file: UploadFile) -> dict:
    """
    Save a player photo to disk and return metadata dict.
    """
    ensure_upload_dir()

    ALLOWED_IMAGE_TYPES = {
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    }
    content_type = file.content_type or ""
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise ValueError(
            f"Tipo immagine non supportato: {content_type}. "
            f"Tipi ammessi: jpeg, png, webp, gif"
        )

    original_filename = file.filename or "photo"
    extension = Path(original_filename).suffix.lower() or ".jpg"
    photo_id = str(uuid.uuid4())
    filename = f"{photo_id}{extension}"
    dest_path = UPLOAD_DIR / "photos" / filename

    max_bytes = 10 * 1024 * 1024  # 10 MB for photos
    total_bytes = 0
    chunk_size = 256 * 1024

    async with aiofiles.open(dest_path, "wb") as out_file:
        while True:
            chunk = await file.read(chunk_size)
            if not chunk:
                break
            total_bytes += len(chunk)
            if total_bytes > max_bytes:
                dest_path.unlink(missing_ok=True)
                raise ValueError("Immagine troppo grande. Massimo 10 MB consentiti.")
            await out_file.write(chunk)

    # Optionally resize with Pillow
    try:
        from PIL import Image
        with Image.open(dest_path) as img:
            max_dim = 800
            if img.width > max_dim or img.height > max_dim:
                img.thumbnail((max_dim, max_dim), Image.LANCZOS)
                img.save(dest_path)
    except Exception as exc:
        logger.warning(f"Impossibile ridimensionare l'immagine {filename}: {exc}")

    url = f"/uploads/photos/{filename}"
    return {
        "photo_id": photo_id,
        "filename": filename,
        "url": url,
        "size_bytes": total_bytes,
        "content_type": content_type,
    }


def get_video_metadata(video_id: str, subfolder: str = "videos") -> dict | None:
    """Return basic metadata for a stored video, or None if not found."""
    ensure_upload_dir()
    video_dir = UPLOAD_DIR / subfolder

    for path in video_dir.iterdir():
        if path.stem == video_id:
            stat = path.stat()
            return {
                "video_id": video_id,
                "filename": path.name,
                "url": f"/uploads/{subfolder}/{path.name}",
                "size_bytes": stat.st_size,
                "path": str(path),
            }
    return None


async def analyze_video_with_ai(video_metadata: dict, context: str = "") -> dict:
    """
    Trigger AI analysis of a video.
    Since Claude cannot directly view video files, this generates a
    structured analysis prompt based on metadata and any provided context.
    """
    from services.ai_analysis import _call_claude

    prompt = f"""Sei un allenatore e analista video di calcio professionista.
Un video di una partita/allenamento è stato caricato nel sistema con i seguenti dettagli:

## Metadati Video
- ID: {video_metadata.get("video_id")}
- File: {video_metadata.get("original_filename", video_metadata.get("filename", "N/D"))}
- Dimensione: {round(video_metadata.get("size_bytes", 0) / (1024*1024), 2)} MB
- Tipo: {video_metadata.get("content_type", "video")}

## Contesto Fornito
{context if context else "Nessun contesto specifico fornito."}

Basandoti sul contesto fornito, genera una checklist e un template di analisi video strutturato
che l'allenatore potrà compilare dopo aver visionato il video.

Rispondi ESCLUSIVAMENTE come JSON valido:
{{
  "checklist_analisi": ["elementi da osservare nel video"],
  "template_tattico": {{
    "organizzazione_difensiva": "da compilare",
    "organizzazione_offensiva": "da compilare",
    "transizioni": "da compilare",
    "calci_piazzati": "da compilare"
  }},
  "domande_chiave": ["domande a cui rispondere dopo la visione"],
  "metriche_da_tracciare": ["metriche da registrare durante la visione"],
  "note_preliminari": "note basate sul contesto fornito",
  "prossimi_passi": ["azioni consigliate dopo l'analisi del video"]
}}
"""

    try:
        response_text = _call_claude(prompt, max_tokens=1200)
        try:
            result = json.loads(response_text)
        except Exception:
            import re, json
            m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
            if m:
                result = json.loads(m.group(1))
            else:
                result = {"raw_analysis": response_text}
        return result
    except Exception as e:
        logger.error(f"Errore analisi video AI: {e}")
        raise


import json  # noqa: E402 - needed for module-level use in analyze_video_with_ai
