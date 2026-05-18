"""
Football Match Analyzer - FastAPI backend
Main application entry point.
"""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))


async def seed_database():
    """Seed the database with default sports if not already present."""
    from database import AsyncSessionLocal
    from models.sport import Sport
    from sqlalchemy import select

    football_config = {
        "positions": [
            "GK", "CB", "LB", "RB",
            "CDM", "CM", "CAM", "LM", "RM",
            "LW", "RW", "CF", "ST",
        ],
        "position_groups": {
            "portiere": ["GK"],
            "difesa": ["CB", "LB", "RB"],
            "centrocampo": ["CDM", "CM", "CAM", "LM", "RM"],
            "attacco": ["LW", "RW", "CF", "ST"],
        },
        "event_types": [
            "goal", "assist", "yellow_card", "red_card", "substitution",
            "shot_on_target", "shot_off_target", "tackle", "interception",
            "pass", "dribble", "foul_committed", "foul_received", "corner",
            "free_kick", "penalty", "save", "clearance", "header", "cross",
            "key_pass",
        ],
        "stat_types": [
            "goals", "assists", "shots_on_target", "shots_off_target",
            "tackles", "interceptions", "passes_completed", "passes_attempted",
            "dribbles_completed", "fouls_committed", "minutes_played", "rating",
        ],
    }

    default_sports = [
        {
            "name": "Calcio",
            "config": football_config,
        },
        {
            "name": "Basket",
            "config": {
                "positions": ["PG", "SG", "SF", "PF", "C"],
                "event_types": ["2pt", "3pt", "free_throw", "rebound", "assist", "steal", "block", "turnover", "foul"],
                "stat_types": ["points", "rebounds", "assists", "steals", "blocks", "fouls", "minutes_played"],
            },
        },
        {
            "name": "Rugby",
            "config": {
                "positions": [
                    "loosehead_prop", "hooker", "tighthead_prop",
                    "lock_1", "lock_2", "blindside_flanker", "openside_flanker",
                    "number_8", "scrum_half", "fly_half",
                    "left_wing", "inside_centre", "outside_centre", "right_wing", "fullback",
                ],
                "event_types": ["try", "conversion", "penalty_kick", "drop_goal", "tackle", "carry", "lineout", "scrum"],
                "stat_types": ["tries", "tackles", "carries", "metres_gained", "lineouts_won", "minutes_played"],
            },
        },
        {
            "name": "Pallavolo",
            "config": {
                "positions": ["libero", "setter", "opposite", "outside_hitter", "middle_blocker"],
                "event_types": ["spike", "block", "serve", "receive", "set", "dig", "ace", "error"],
                "stat_types": ["kills", "blocks", "aces", "errors", "digs", "assists", "minutes_played"],
            },
        },
        {
            "name": "Tennis",
            "config": {
                "positions": ["singolare", "doppio"],
                "event_types": ["ace", "double_fault", "winner", "unforced_error", "forced_error", "break_point"],
                "stat_types": ["aces", "double_faults", "first_serve_pct", "winners", "unforced_errors", "break_points_won"],
            },
        },
    ]

    async with AsyncSessionLocal() as session:
        for sport_data in default_sports:
            result = await session.execute(
                select(Sport).where(Sport.name == sport_data["name"])
            )
            if result.scalar_one_or_none() is None:
                sport = Sport(name=sport_data["name"], config=sport_data["config"])
                session.add(sport)
                logger.info(f"Sport seed: {sport_data['name']}")
        await session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - init DB and seed data on startup."""
    logger.info("Avvio del server Football Match Analyzer...")

    # Create upload directories
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / "videos").mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / "photos").mkdir(parents=True, exist_ok=True)

    # Initialize database
    from database import init_db
    await init_db()
    logger.info("Database inizializzato.")

    # Seed default data
    await seed_database()
    logger.info("Database popolato con dati iniziali.")

    logger.info("Server pronto. Documentazione: http://localhost:8000/docs")
    yield

    logger.info("Spegnimento del server...")


app = FastAPI(
    title="Football Match Analyzer API",
    description=(
        "API per l'analisi di partite di calcio, gestione giocatori, "
        "squadre, eventi in tempo reale e analisi AI con Claude."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
if UPLOAD_DIR.exists():
    app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Include routers
from routers.auth import router as auth_router
from routers.sports import router as sports_router
from routers.teams import router as teams_router
from routers.players import router as players_router
from routers.matches import router as matches_router
from routers.events import router as events_router
from routers.analysis import router as analysis_router
from routers.videos import router as videos_router
from routers.training import router as training_router

app.include_router(auth_router)
app.include_router(sports_router)
app.include_router(teams_router)
app.include_router(players_router)
app.include_router(matches_router)
app.include_router(events_router)
app.include_router(analysis_router)
app.include_router(videos_router)
app.include_router(training_router)


# ─── WebSocket endpoint ───────────────────────────────────────────────────────

@app.websocket("/ws/match/{match_id}")
async def websocket_match(websocket: WebSocket, match_id: int):
    """
    WebSocket endpoint for live match updates.
    Connect to receive real-time events, score updates, and status changes.
    Messages are JSON objects with a 'type' field:
      - new_event: a new match event
      - score_update: score changed
      - status_change: match started/ended
      - state_sync: full state sync on connection
    """
    from services.live_match import manager

    await manager.connect(match_id, websocket)
    logger.info(
        f"WebSocket connesso: partita {match_id}, "
        f"totale connessi: {manager.get_connected_count(match_id)}"
    )

    try:
        while True:
            # Keep connection alive; clients can also send pings
            data = await websocket.receive_text()
            # Echo ping/pong
            if data.strip().lower() == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        manager.disconnect(match_id, websocket)
        logger.info(f"WebSocket disconnesso: partita {match_id}")


# ─── Health check ─────────────────────────────────────────────────────────────

@app.get("/health", tags=["system"])
async def health_check():
    return {"status": "ok", "service": "Football Match Analyzer API", "version": "1.0.0"}


@app.get("/", tags=["system"])
async def root():
    return {
        "message": "Benvenuto nel Football Match Analyzer API",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
