"""
Statistics service - calculates match/player/team statistics.
"""
from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    pass


async def calculate_team_stats(match_id: int, team_id: int, db: AsyncSession) -> dict:
    """Calculate aggregate team statistics for a match."""
    from models.event import Event, PlayerStatistics
    from models.match import MatchPlayer

    # Fetch all events for the team in this match
    events_result = await db.execute(
        select(Event).where(Event.match_id == match_id, Event.team_id == team_id)
    )
    events = events_result.scalars().all()

    # Fetch all player stats for the team in this match
    # First get match player IDs
    mp_result = await db.execute(
        select(MatchPlayer.player_id).where(
            MatchPlayer.match_id == match_id, MatchPlayer.team_id == team_id
        )
    )
    player_ids = mp_result.scalars().all()

    stats_result = await db.execute(
        select(PlayerStatistics).where(
            PlayerStatistics.match_id == match_id,
            PlayerStatistics.player_id.in_(player_ids),
        )
    )
    stats_list = stats_result.scalars().all()

    # Aggregate event counts
    event_counts: dict[str, int] = {}
    for ev in events:
        event_counts[ev.event_type] = event_counts.get(ev.event_type, 0) + 1

    # Aggregate player stats
    total_passes_completed = sum(s.passes_completed for s in stats_list)
    total_passes_attempted = sum(s.passes_attempted for s in stats_list)
    total_shots_on = sum(s.shots_on_target for s in stats_list)
    total_shots_off = sum(s.shots_off_target for s in stats_list)
    total_tackles = sum(s.tackles for s in stats_list)
    total_interceptions = sum(s.interceptions for s in stats_list)
    total_fouls = sum(s.fouls_committed for s in stats_list)
    total_dribbles_completed = sum(s.dribbles_completed for s in stats_list)
    total_dribbles_attempted = sum(s.dribbles_attempted for s in stats_list)
    total_yellow_cards = sum(s.yellow_cards for s in stats_list)
    total_red_cards = sum(s.red_cards for s in stats_list)
    total_goals = sum(s.goals for s in stats_list)
    total_assists = sum(s.assists for s in stats_list)

    pass_accuracy = (
        round(total_passes_completed / total_passes_attempted * 100, 1)
        if total_passes_attempted > 0
        else 0.0
    )
    dribble_success = (
        round(total_dribbles_completed / total_dribbles_attempted * 100, 1)
        if total_dribbles_attempted > 0
        else 0.0
    )
    total_shots = total_shots_on + total_shots_off
    shot_accuracy = (
        round(total_shots_on / total_shots * 100, 1) if total_shots > 0 else 0.0
    )

    return {
        "team_id": team_id,
        "match_id": match_id,
        "goals": total_goals,
        "assists": total_assists,
        "shots_on_target": total_shots_on,
        "shots_off_target": total_shots_off,
        "total_shots": total_shots,
        "shot_accuracy_pct": shot_accuracy,
        "passes_completed": total_passes_completed,
        "passes_attempted": total_passes_attempted,
        "pass_accuracy_pct": pass_accuracy,
        "tackles": total_tackles,
        "interceptions": total_interceptions,
        "fouls_committed": total_fouls,
        "dribbles_completed": total_dribbles_completed,
        "dribbles_attempted": total_dribbles_attempted,
        "dribble_success_pct": dribble_success,
        "yellow_cards": total_yellow_cards,
        "red_cards": total_red_cards,
        "corners": event_counts.get("corner", 0),
        "free_kicks": event_counts.get("free_kick", 0),
        "penalties": event_counts.get("penalty", 0),
    }


def calculate_player_rating(player_stats: dict) -> float:
    """
    Calculate a rating (1-10) for a player based on weighted metrics.
    player_stats is a dict with keys matching PlayerStatistics fields.
    """
    base_rating = 6.0

    goals = player_stats.get("goals", 0)
    assists = player_stats.get("assists", 0)
    shots_on = player_stats.get("shots_on_target", 0)
    tackles = player_stats.get("tackles", 0)
    interceptions = player_stats.get("interceptions", 0)
    passes_completed = player_stats.get("passes_completed", 0)
    passes_attempted = player_stats.get("passes_attempted", 0)
    dribbles_completed = player_stats.get("dribbles_completed", 0)
    fouls_committed = player_stats.get("fouls_committed", 0)
    yellow_cards = player_stats.get("yellow_cards", 0)
    red_cards = player_stats.get("red_cards", 0)
    minutes_played = player_stats.get("minutes_played", 90)

    rating = base_rating

    # Positive contributions
    rating += goals * 1.0
    rating += assists * 0.7
    rating += shots_on * 0.15
    rating += tackles * 0.1
    rating += interceptions * 0.1
    rating += dribbles_completed * 0.08

    pass_accuracy = (passes_completed / passes_attempted) if passes_attempted > 0 else 0
    if pass_accuracy >= 0.9:
        rating += 0.5
    elif pass_accuracy >= 0.8:
        rating += 0.3
    elif pass_accuracy < 0.65:
        rating -= 0.3

    # Negative contributions
    rating -= fouls_committed * 0.1
    rating -= yellow_cards * 0.3
    rating -= red_cards * 1.5

    # Reduce for very short appearances
    if minutes_played < 45:
        rating -= 0.3

    # Clamp to 1-10
    rating = max(1.0, min(10.0, rating))
    return round(rating, 1)


async def get_player_career_stats(player_id: int, db: AsyncSession) -> dict:
    """Get aggregated career statistics for a player across all matches."""
    from models.event import PlayerStatistics

    result = await db.execute(
        select(PlayerStatistics).where(PlayerStatistics.player_id == player_id)
    )
    stats_list = result.scalars().all()

    if not stats_list:
        return {
            "player_id": player_id,
            "matches_played": 0,
            "total_goals": 0,
            "total_assists": 0,
            "total_shots_on_target": 0,
            "total_shots_off_target": 0,
            "total_tackles": 0,
            "total_interceptions": 0,
            "total_passes_completed": 0,
            "total_passes_attempted": 0,
            "pass_accuracy_pct": 0.0,
            "total_dribbles_completed": 0,
            "total_fouls_committed": 0,
            "total_yellow_cards": 0,
            "total_red_cards": 0,
            "total_minutes_played": 0,
            "average_rating": None,
            "total_distance_km": 0.0,
        }

    n = len(stats_list)
    total_passes_completed = sum(s.passes_completed for s in stats_list)
    total_passes_attempted = sum(s.passes_attempted for s in stats_list)
    ratings = [s.rating for s in stats_list if s.rating is not None]
    distances = [s.distance_km for s in stats_list if s.distance_km is not None]

    return {
        "player_id": player_id,
        "matches_played": n,
        "total_goals": sum(s.goals for s in stats_list),
        "total_assists": sum(s.assists for s in stats_list),
        "total_shots_on_target": sum(s.shots_on_target for s in stats_list),
        "total_shots_off_target": sum(s.shots_off_target for s in stats_list),
        "total_tackles": sum(s.tackles for s in stats_list),
        "total_interceptions": sum(s.interceptions for s in stats_list),
        "total_passes_completed": total_passes_completed,
        "total_passes_attempted": total_passes_attempted,
        "pass_accuracy_pct": (
            round(total_passes_completed / total_passes_attempted * 100, 1)
            if total_passes_attempted > 0
            else 0.0
        ),
        "total_dribbles_completed": sum(s.dribbles_completed for s in stats_list),
        "total_fouls_committed": sum(s.fouls_committed for s in stats_list),
        "total_yellow_cards": sum(s.yellow_cards for s in stats_list),
        "total_red_cards": sum(s.red_cards for s in stats_list),
        "total_minutes_played": sum(s.minutes_played for s in stats_list),
        "average_rating": round(sum(ratings) / len(ratings), 2) if ratings else None,
        "total_distance_km": round(sum(distances), 2),
    }


async def compare_players(player_id_1: int, player_id_2: int, db: AsyncSession) -> dict:
    """Return a side-by-side comparison of two players' career stats."""
    stats1 = await get_player_career_stats(player_id_1, db)
    stats2 = await get_player_career_stats(player_id_2, db)

    from models.player import Player

    p1_result = await db.execute(select(Player).where(Player.id == player_id_1))
    p2_result = await db.execute(select(Player).where(Player.id == player_id_2))
    p1 = p1_result.scalar_one_or_none()
    p2 = p2_result.scalar_one_or_none()

    def per_match(stats: dict, key: str) -> float:
        n = stats.get("matches_played", 0)
        if n == 0:
            return 0.0
        return round(stats.get(key, 0) / n, 2)

    return {
        "player_1": {
            "id": player_id_1,
            "name": p1.full_name if p1 else str(player_id_1),
            "position": p1.primary_position if p1 else None,
            "career_stats": stats1,
            "per_match": {
                "goals": per_match(stats1, "total_goals"),
                "assists": per_match(stats1, "total_assists"),
                "tackles": per_match(stats1, "total_tackles"),
                "passes_completed": per_match(stats1, "total_passes_completed"),
            },
        },
        "player_2": {
            "id": player_id_2,
            "name": p2.full_name if p2 else str(player_id_2),
            "position": p2.primary_position if p2 else None,
            "career_stats": stats2,
            "per_match": {
                "goals": per_match(stats2, "total_goals"),
                "assists": per_match(stats2, "total_assists"),
                "tackles": per_match(stats2, "total_tackles"),
                "passes_completed": per_match(stats2, "total_passes_completed"),
            },
        },
    }
