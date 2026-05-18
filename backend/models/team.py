from datetime import datetime
from sqlalchemy import Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sport_id: Mapped[int] = mapped_column(Integer, ForeignKey("sports.id"), nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    age_group: Mapped[str] = mapped_column(
        String(20), nullable=False, default="adult"
    )  # youth/adult/U8/U10/U12/U14/U16/U18/adult
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sport: Mapped["Sport"] = relationship("Sport", back_populates="teams")  # noqa: F821
    players: Mapped[list["Player"]] = relationship("Player", back_populates="team")  # noqa: F821
    home_matches: Mapped[list["Match"]] = relationship(  # noqa: F821
        "Match", foreign_keys="Match.home_team_id", back_populates="home_team"
    )
    away_matches: Mapped[list["Match"]] = relationship(  # noqa: F821
        "Match", foreign_keys="Match.away_team_id", back_populates="away_team"
    )
    training_sessions: Mapped[list["TrainingSession"]] = relationship(  # noqa: F821
        "TrainingSession", back_populates="team"
    )
