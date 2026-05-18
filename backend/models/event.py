from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("players.id"), nullable=True)
    team_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("teams.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # goal/assist/yellow_card/red_card/substitution/shot_on_target/shot_off_target/
    # tackle/interception/pass/dribble/foul_committed/foul_received/corner/
    # free_kick/penalty/save/clearance/header/cross/key_pass
    minute: Mapped[int] = mapped_column(Integer, nullable=False)
    extra_time_minute: Mapped[int | None] = mapped_column(Integer, nullable=True)
    x_position: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-100
    y_position: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0-100
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    match: Mapped["Match"] = relationship("Match", back_populates="events")  # noqa: F821
    player: Mapped["Player"] = relationship("Player", back_populates="events")  # noqa: F821
    team: Mapped["Team"] = relationship("Team")  # noqa: F821


class PlayerStatistics(Base):
    __tablename__ = "player_statistics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey("players.id"), nullable=False)
    goals: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    assists: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    shots_on_target: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    shots_off_target: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tackles: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    interceptions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    passes_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    passes_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    dribbles_completed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    dribbles_attempted: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fouls_committed: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    fouls_received: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    yellow_cards: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    red_cards: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    minutes_played: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)  # 1-10
    distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)

    match: Mapped["Match"] = relationship("Match", back_populates="player_statistics")  # noqa: F821
    player: Mapped["Player"] = relationship("Player", back_populates="statistics")  # noqa: F821
