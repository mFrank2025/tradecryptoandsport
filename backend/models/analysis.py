from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class PlayerAnalysis(Base):
    __tablename__ = "player_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey("players.id"), nullable=False)
    analysis_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="general"
    )  # general/training/match/role_suggestion
    content: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    match_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("matches.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    player: Mapped["Player"] = relationship("Player", back_populates="analyses")  # noqa: F821
    match: Mapped["Match"] = relationship("Match", back_populates="analyses")  # noqa: F821


class TrainingSession(Base):
    __tablename__ = "training_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    team_id: Mapped[int] = mapped_column(Integer, ForeignKey("teams.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    focus_areas: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped["Team"] = relationship("Team", back_populates="training_sessions")  # noqa: F821
    player_notes: Mapped[list["TrainingPlayerNote"]] = relationship(
        "TrainingPlayerNote", back_populates="training_session"
    )


class TrainingPlayerNote(Base):
    __tablename__ = "training_player_notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    training_session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("training_sessions.id"), nullable=False
    )
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey("players.id"), nullable=False)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_notes: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    training_session: Mapped["TrainingSession"] = relationship(
        "TrainingSession", back_populates="player_notes"
    )
    player: Mapped["Player"] = relationship("Player", back_populates="training_notes")  # noqa: F821


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(300), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(300), nullable=False)
    is_active: Mapped[bool] = mapped_column(Integer, nullable=False, default=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="coach")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
