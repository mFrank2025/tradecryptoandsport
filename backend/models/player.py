from datetime import datetime, date
from sqlalchemy import Integer, String, ForeignKey, DateTime, Date, Float, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    team_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("teams.id"), nullable=True)
    primary_position: Mapped[str | None] = mapped_column(String(10), nullable=True)
    secondary_positions: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    height_cm: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    foot: Mapped[str | None] = mapped_column(String(10), nullable=True)  # left/right/both
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    team: Mapped["Team"] = relationship("Team", back_populates="players")  # noqa: F821
    match_participations: Mapped[list["MatchPlayer"]] = relationship(  # noqa: F821
        "MatchPlayer", back_populates="player"
    )
    events: Mapped[list["Event"]] = relationship("Event", back_populates="player")  # noqa: F821
    statistics: Mapped[list["PlayerStatistics"]] = relationship(  # noqa: F821
        "PlayerStatistics", back_populates="player"
    )
    analyses: Mapped[list["PlayerAnalysis"]] = relationship(  # noqa: F821
        "PlayerAnalysis", back_populates="player"
    )
    training_notes: Mapped[list["TrainingPlayerNote"]] = relationship(  # noqa: F821
        "TrainingPlayerNote", back_populates="player"
    )

    @property
    def age(self) -> int | None:
        if self.birth_date is None:
            return None
        today = date.today()
        return (
            today.year
            - self.birth_date.year
            - ((today.month, today.day) < (self.birth_date.month, self.birth_date.day))
        )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
