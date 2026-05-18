"""
AI analysis service - uses Anthropic Claude to generate player/match analysis.
All prompts are written in Italian as the user is Italian.
"""
from __future__ import annotations

import json
import os
import logging

import anthropic
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_client: anthropic.Anthropic | None = None


def get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY non è impostata nelle variabili d'ambiente")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def _call_claude(prompt: str, max_tokens: int = 2000) -> str:
    """Call Claude and return the text response."""
    client = get_client()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return message.content[0].text


async def analyze_player(player_id: int, db: AsyncSession) -> dict:
    """
    Generate a comprehensive player analysis using Claude.
    Returns a structured dict with: punti_di_forza, punti_deboli,
    consigli_miglioramento, ruoli_adatti, focus_allenamento.
    """
    from models.player import Player
    from models.event import PlayerStatistics
    from models.analysis import TrainingPlayerNote
    from services.statistics import get_player_career_stats

    # Fetch player
    p_result = await db.execute(select(Player).where(Player.id == player_id))
    player = p_result.scalar_one_or_none()
    if player is None:
        raise ValueError(f"Giocatore con id {player_id} non trovato")

    career_stats = await get_player_career_stats(player_id, db)

    # Fetch recent per-match stats (last 10)
    stats_result = await db.execute(
        select(PlayerStatistics)
        .where(PlayerStatistics.player_id == player_id)
        .order_by(PlayerStatistics.id.desc())
        .limit(10)
    )
    recent_stats = stats_result.scalars().all()

    # Fetch training notes
    tn_result = await db.execute(
        select(TrainingPlayerNote)
        .where(TrainingPlayerNote.player_id == player_id)
        .order_by(TrainingPlayerNote.id.desc())
        .limit(5)
    )
    training_notes = tn_result.scalars().all()
    training_observations = [
        tn.observations for tn in training_notes if tn.observations
    ]

    recent_stats_list = [
        {
            "gol": s.goals,
            "assist": s.assists,
            "tiri_in_porta": s.shots_on_target,
            "tiri_fuori": s.shots_off_target,
            "tackle": s.tackles,
            "intercetti": s.interceptions,
            "passaggi_completati": s.passes_completed,
            "passaggi_tentati": s.passes_attempted,
            "dribbling_completati": s.dribbles_completed,
            "falli_commessi": s.fouls_committed,
            "ammonizioni": s.yellow_cards,
            "espulsioni": s.red_cards,
            "minuti_giocati": s.minutes_played,
            "valutazione": s.rating,
        }
        for s in recent_stats
    ]

    prompt = f"""Sei un esperto analista di calcio. Analizza il seguente profilo di un giocatore e fornisci una valutazione completa e dettagliata in italiano.

## Profilo Giocatore
- **Nome**: {player.full_name}
- **Posizione primaria**: {player.primary_position or "Non specificata"}
- **Posizioni secondarie**: {", ".join(player.secondary_positions) if player.secondary_positions else "Nessuna"}
- **Età**: {player.age or "Non specificata"} anni
- **Piede preferito**: {player.foot or "Non specificato"}
- **Altezza**: {player.height_cm or "N/D"} cm
- **Peso**: {player.weight_kg or "N/D"} kg
- **Note del tecnico**: {player.notes or "Nessuna nota"}

## Statistiche Complessive di Carriera
- Partite giocate: {career_stats["matches_played"]}
- Gol totali: {career_stats["total_goals"]}
- Assist totali: {career_stats["total_assists"]}
- Tiri in porta: {career_stats["total_shots_on_target"]}
- Tackle totali: {career_stats["total_tackles"]}
- Intercetti totali: {career_stats["total_interceptions"]}
- Passaggi completati: {career_stats["total_passes_completed"]} / {career_stats["total_passes_attempted"]} ({career_stats["pass_accuracy_pct"]}%)
- Falli commessi: {career_stats["total_fouls_committed"]}
- Ammonizioni: {career_stats["total_yellow_cards"]}
- Espulsioni: {career_stats["total_red_cards"]}
- Valutazione media: {career_stats["average_rating"] or "N/D"}

## Statistiche Ultime Partite
{json.dumps(recent_stats_list, ensure_ascii=False, indent=2)}

## Osservazioni Allenamento
{chr(10).join(f"- {obs}" for obs in training_observations) if training_observations else "Nessuna osservazione di allenamento disponibile"}

## Istruzioni
Fornisci la tua analisi ESCLUSIVAMENTE come oggetto JSON valido con questa struttura esatta (senza testo prima o dopo il JSON):
{{
  "punti_di_forza": ["elenco di punti di forza specifici"],
  "punti_deboli": ["elenco di aree di miglioramento"],
  "consigli_miglioramento": ["consigli pratici e specifici per migliorare"],
  "ruoli_adatti": ["ruoli in cui il giocatore eccelle o potrebbe eccellere"],
  "focus_allenamento": ["esercizi o aree su cui concentrarsi in allenamento"],
  "valutazione_complessiva": "un paragrafo di valutazione generale del giocatore",
  "potenziale": "alto/medio/basso",
  "note_tattiche": "considerazioni tattiche specifiche"
}}
"""

    try:
        response_text = _call_claude(prompt, max_tokens=2000)
        # Try to parse as JSON
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # Extract JSON from markdown code blocks if present
            import re
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
            if match:
                result = json.loads(match.group(1))
            else:
                result = {"raw_analysis": response_text}
        return result
    except Exception as e:
        logger.error(f"Errore analisi AI giocatore {player_id}: {e}")
        raise


async def get_live_suggestion(match_state: dict) -> str:
    """
    Get an immediate tactical suggestion during a live match.
    match_state dict includes: current_score, minute, events_so_far,
    home_lineup, away_lineup, home_stats, away_stats, tactical_notes.
    """
    home_team = match_state.get("home_team_name", "Squadra Casa")
    away_team = match_state.get("away_team_name", "Squadra Ospite")
    score_h = match_state.get("current_score_home", 0)
    score_a = match_state.get("current_score_away", 0)
    minute = match_state.get("minute", 0)
    events = match_state.get("events_so_far", [])
    home_stats = match_state.get("home_stats", {})
    away_stats = match_state.get("away_stats", {})
    tactical_notes = match_state.get("tactical_notes", "")

    # Summarize recent events (last 10)
    recent_events = events[-10:] if len(events) > 10 else events
    events_summary = json.dumps(recent_events, ensure_ascii=False, indent=2)

    prompt = f"""Sei un allenatore di calcio esperto e un analista tattico. Sei in panchina durante una partita in corso.

## Situazione Attuale
- **Minuto**: {minute}'
- **Risultato**: {home_team} {score_h} - {score_a} {away_team}
- **Statistiche {home_team}**: {json.dumps(home_stats, ensure_ascii=False)}
- **Statistiche {away_team}**: {json.dumps(away_stats, ensure_ascii=False)}
- **Note tattiche**: {tactical_notes or "Nessuna"}

## Ultimi eventi
{events_summary}

Fornisci un suggerimento tattico IMMEDIATO e PRATICO in italiano (2-4 frasi concise).
Il suggerimento deve essere specifico, attuabile adesso, e adatto alla situazione attuale della partita.
Considera: sostituzioni, cambi di modulo, pressione/difesa, posizionamento specifico.
Rispondi SOLO con il suggerimento tattico, senza intestazioni o formattazioni."""

    try:
        return _call_claude(prompt, max_tokens=500)
    except Exception as e:
        logger.error(f"Errore suggerimento live: {e}")
        raise


async def suggest_player_role(player_id: int, db: AsyncSession) -> dict:
    """
    Analyze a player's stats and suggest the best-fit positions.
    Returns ordered list of positions with explanations.
    """
    from models.player import Player
    from models.match import MatchPlayer
    from services.statistics import get_player_career_stats

    p_result = await db.execute(select(Player).where(Player.id == player_id))
    player = p_result.scalar_one_or_none()
    if player is None:
        raise ValueError(f"Giocatore con id {player_id} non trovato")

    career_stats = await get_player_career_stats(player_id, db)

    # Fetch positions played
    mp_result = await db.execute(
        select(MatchPlayer.position_played, MatchPlayer.minutes_played)
        .where(MatchPlayer.player_id == player_id)
    )
    positions_data = mp_result.all()
    positions_summary: dict[str, int] = {}
    for pos, mins in positions_data:
        if pos:
            positions_summary[pos] = positions_summary.get(pos, 0) + (mins or 0)

    prompt = f"""Sei un talent scout e analista tattico di calcio professionista. Analizza il profilo di questo giocatore e suggerisci i ruoli più adatti.

## Profilo
- **Nome**: {player.full_name}
- **Posizione dichiarata**: {player.primary_position or "Non specificata"}
- **Piede**: {player.foot or "Non specificato"}
- **Altezza**: {player.height_cm or "N/D"} cm
- **Peso**: {player.weight_kg or "N/D"} kg
- **Età**: {player.age or "N/D"} anni

## Statistiche Carriera ({career_stats["matches_played"]} partite)
- Gol: {career_stats["total_goals"]}
- Assist: {career_stats["total_assists"]}
- Tiri in porta: {career_stats["total_shots_on_target"]}
- Tackle: {career_stats["total_tackles"]}
- Intercetti: {career_stats["total_interceptions"]}
- Accuratezza passaggi: {career_stats["pass_accuracy_pct"]}%
- Dribbling completati: {career_stats["total_dribbles_completed"]}
- Falli commessi: {career_stats["total_fouls_committed"]}
- Ammonizioni: {career_stats["total_yellow_cards"]}
- Minuti totali: {career_stats["total_minutes_played"]}
- Valutazione media: {career_stats["average_rating"] or "N/D"}

## Ruoli già coperti (posizione: minuti)
{json.dumps(positions_summary, ensure_ascii=False)}

## Istruzioni
Rispondi ESCLUSIVAMENTE con un JSON valido (senza testo aggiuntivo):
{{
  "ruoli_consigliati": [
    {{
      "posizione": "codice posizione (es. ST, CM, CB)",
      "compatibilita": "alta/media/bassa",
      "spiegazione": "spiegazione dettagliata del perché questo ruolo è adatto",
      "punti_chiave": ["caratteristiche che lo rendono adatto a questo ruolo"]
    }}
  ],
  "ruolo_ideale": "il ruolo principale consigliato",
  "ruoli_da_evitare": ["ruoli non adatti con breve motivazione"],
  "commento_scout": "valutazione complessiva da scout professionista"
}}
"""

    try:
        response_text = _call_claude(prompt, max_tokens=1500)
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            import re
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
            if match:
                result = json.loads(match.group(1))
            else:
                result = {"raw_suggestion": response_text}
        return result
    except Exception as e:
        logger.error(f"Errore suggerimento ruolo giocatore {player_id}: {e}")
        raise


async def analyze_training_session(training_id: int, db: AsyncSession) -> dict:
    """Analyze a training session using Claude."""
    from models.analysis import TrainingSession, TrainingPlayerNote
    from models.player import Player

    ts_result = await db.execute(
        select(TrainingSession).where(TrainingSession.id == training_id)
    )
    session = ts_result.scalar_one_or_none()
    if session is None:
        raise ValueError(f"Sessione di allenamento {training_id} non trovata")

    notes_result = await db.execute(
        select(TrainingPlayerNote).where(
            TrainingPlayerNote.training_session_id == training_id
        )
    )
    notes = notes_result.scalars().all()

    player_observations = []
    for note in notes:
        p_result = await db.execute(select(Player).where(Player.id == note.player_id))
        p = p_result.scalar_one_or_none()
        player_name = p.full_name if p else f"Giocatore {note.player_id}"
        player_observations.append(
            f"- {player_name}: {note.observations or 'Nessuna osservazione'}"
        )

    prompt = f"""Sei un preparatore atletico e allenatore di calcio esperto. Analizza la seguente sessione di allenamento.

## Sessione di Allenamento
- **Data**: {session.date.strftime("%d/%m/%Y")}
- **Durata**: {session.duration_minutes} minuti
- **Aree di focus**: {", ".join(session.focus_areas) if session.focus_areas else "Non specificate"}
- **Note generali**: {session.notes or "Nessuna"}

## Osservazioni Individuali dei Giocatori
{chr(10).join(player_observations) if player_observations else "Nessuna osservazione individuale disponibile"}

## Istruzioni
Fornisci un'analisi completa della sessione ESCLUSIVAMENTE come JSON valido:
{{
  "valutazione_sessione": "ottima/buona/sufficiente/insufficiente",
  "punti_positivi": ["aspetti positivi della sessione"],
  "aree_miglioramento": ["aspetti da migliorare nelle prossime sessioni"],
  "progressi_rilevati": ["progressi notati rispetto a sessioni precedenti"],
  "raccomandazioni": ["raccomandazioni per le prossime sessioni"],
  "focus_prossima_sessione": ["suggerimenti per la prossima sessione di allenamento"],
  "note_individuali": {{"commento generale sui giocatori osservati"}},
  "analisi_complessiva": "paragrafo riassuntivo dell'allenamento"
}}
"""

    try:
        response_text = _call_claude(prompt, max_tokens=1500)
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            import re
            match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
            if match:
                result = json.loads(match.group(1))
            else:
                result = {"raw_analysis": response_text}
        return result
    except Exception as e:
        logger.error(f"Errore analisi sessione allenamento {training_id}: {e}")
        raise


async def generate_post_match_report(match_id: int, db: AsyncSession) -> dict:
    """Generate a comprehensive post-match report using Claude."""
    from models.match import Match, MatchPlayer
    from models.event import Event, PlayerStatistics
    from models.team import Team
    from services.statistics import calculate_team_stats

    m_result = await db.execute(select(Match).where(Match.id == match_id))
    match = m_result.scalar_one_or_none()
    if match is None:
        raise ValueError(f"Partita {match_id} non trovata")

    ht_result = await db.execute(select(Team).where(Team.id == match.home_team_id))
    at_result = await db.execute(select(Team).where(Team.id == match.away_team_id))
    home_team = ht_result.scalar_one_or_none()
    away_team = at_result.scalar_one_or_none()

    home_stats = await calculate_team_stats(match_id, match.home_team_id, db)
    away_stats = await calculate_team_stats(match_id, match.away_team_id, db)

    events_result = await db.execute(
        select(Event).where(Event.match_id == match_id).order_by(Event.minute)
    )
    events = events_result.scalars().all()
    events_list = [
        {
            "minuto": e.minute,
            "tipo": e.event_type,
            "squadra_id": e.team_id,
            "note": e.notes,
        }
        for e in events
    ]

    # Best rated players
    stats_result = await db.execute(
        select(PlayerStatistics)
        .where(PlayerStatistics.match_id == match_id)
        .order_by(PlayerStatistics.rating.desc().nullslast())
        .limit(3)
    )
    top_players = stats_result.scalars().all()
    top_players_info = [
        {
            "player_id": ps.player_id,
            "gol": ps.goals,
            "assist": ps.assists,
            "valutazione": ps.rating,
        }
        for ps in top_players
    ]

    home_name = home_team.name if home_team else f"Squadra {match.home_team_id}"
    away_name = away_team.name if away_team else f"Squadra {match.away_team_id}"

    prompt = f"""Sei un giornalista sportivo e analista tattico di calcio. Scrivi un report post-partita dettagliato e professionale in italiano.

## Partita
- **{home_name}** {match.score_home} - {match.score_away} **{away_name}**
- **Data**: {match.date.strftime("%d/%m/%Y %H:%M")}
- **Stadio**: {match.venue or "Non specificato"}
- **Tipo**: {match.match_type}
- **Durata**: {match.duration_minutes} minuti
- **Meteo**: {match.weather or "N/D"}
- **Condizioni campo**: {match.pitch_condition or "N/D"}

## Statistiche {home_name}
{json.dumps(home_stats, ensure_ascii=False, indent=2)}

## Statistiche {away_name}
{json.dumps(away_stats, ensure_ascii=False, indent=2)}

## Cronologia eventi
{json.dumps(events_list, ensure_ascii=False, indent=2)}

## Migliori giocatori in campo
{json.dumps(top_players_info, ensure_ascii=False, indent=2)}

## Istruzioni
Fornisci il report ESCLUSIVAMENTE come JSON valido:
{{
  "titolo": "titolo accattivante del report",
  "risultato_commento": "commento sul risultato finale",
  "analisi_tattica": {{
    "squadra_casa": "analisi tattica della squadra di casa",
    "squadra_ospite": "analisi tattica della squadra ospite"
  }},
  "momenti_chiave": ["descrizione dei momenti decisivi della partita"],
  "migliori_in_campo": ["valutazione dei migliori giocatori"],
  "punti_di_svolta": ["episodi che hanno cambiato l'andamento della gara"],
  "analisi_difensiva": "analisi della fase difensiva di entrambe le squadre",
  "analisi_offensiva": "analisi della fase offensiva di entrambe le squadre",
  "valutazione_arbitrale": "breve commento sull'arbitraggio (neutro)",
  "prospettive": "cosa questo risultato significa per le due squadre",
  "voto_partita": "voto complessivo allo spettacolo (1-10)"
}}
"""

    try:
        response_text = _call_claude(prompt, max_tokens=2500)
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            import re
            match_re = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
            if match_re:
                result = json.loads(match_re.group(1))
            else:
                result = {"raw_report": response_text}
        return result
    except Exception as e:
        logger.error(f"Errore report post-partita {match_id}: {e}")
        raise
