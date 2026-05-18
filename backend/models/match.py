from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime, Boolean, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sport_id: Mapped[int] = mapped_column(Integer, ForeignKey("sports.id"), nullable=False)
    home_team_id: Mapped[int] = mapped_column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id: Mapped[int] = mapped_column(Integer, ForeignKey("teams.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    venue: Mapped[str | None] = mapped_column(String(300), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="scheduled"
    )  # scheduled/live/completed
    score_home: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    score_away: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    match_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="friendly"
    )  # friendly/league/cup
    weather: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pitch_condition: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sport: Mapped["Sport"] = relationship("Sport", back_populates="matches")  # noqa: F821
    home_team: Mapped["Team"] = relationship(  # noqa: F821
        "Team", foreign_keys=[home_team_id], back_populates="home_matches"
    )
    away_team: Mapped["Team"] = relationship(  # noqa: F821
        "Team", foreign_keys=[away_team_id], back_populates="away_matches"
    )
    players: Mapped[list["MatchPlayer"]] = relationship("MatchPlayer", back_populates="match")  # noqa: F821
    events: Mapped[list["Event"]] = relationship("Event", back_populates="match")  # noqa: F821
    player_statistics: Mapped[list["PlayerStatistics"]] = relationship(  # noqa: F821
        "PlayerStatistics", back_populates="match"
    )
    analyses: Mapped[list["PlayerAnalysis"]] = relationship(  # noqa: F821
        "PlayerAnalysis", back_populates="match"
    )


class MatchPlayer(Base):
    __tablename__ = "match_players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    match_id: Mapped[int] = mapped_column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id: Mapped[int] = mapped_column(Integer, ForeignKey("players.id"), nullable=False)
    team_id: Mapped[int] = mapped_column(Integer, ForeignKey("teams.id"), nullable=False)
    position_played: Mapped[str | None] = mapped_column(String(10), nullable=True)
    jersey_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_starter: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    minutes_played: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    substituted_in_at: Mapped[int | None] = mapped_column(Integer, nullable=True)
    substituted_out_at: Mapped[int | None] = mapped_column(Integer, nullable=True)

    match: Mapped["Match"] = relationship("Match", back_populates="players")
    player: Mapped["Player"] = relationship("Player", back_populates="match_participations")  # noqa: F821
    team: Mapped["Team"] = relationship("Team")  # noqa: F821
