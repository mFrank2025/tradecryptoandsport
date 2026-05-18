import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wifi, WifiOff, Sparkles, Loader2, X,
  ChevronDown, Search, UserCheck, Clock, Play, Pause, Square
} from 'lucide-react';
import { useMatch, useMatchLineup, useMatchEvents, useLogEvent, useMatchControl } from '../../hooks/useMatches';
import { useLiveMatch } from '../../hooks/useLiveMatch';
import { analysisApi } from '../../api/analysis';
import { MatchPlayer, EventType, LiveSuggestion, Player } from '../../types';
import PitchView from '../../components/Match/PitchView';
import EventLogger from '../../components/Match/EventLogger';
import { FullPageSpinner } from '../../components/UI/Spinner';
import Button from '../../components/UI/Button';
import { PositionBadge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const EVENT_LABELS: Record<string, string> = {
  goal: '⚽ Gol',
  own_goal: '😬 Autogol',
  penalty_goal: '✅ Rigore Gol',
  penalty_miss: '❌ Rigore Mancato',
  yellow_card: '🟨 Ammonizione',
  red_card: '🟥 Espulsione',
  second_yellow: '🟨🟥 Doppio Giallo',
  shot_on_target: '🎯 Tiro in Porta',
  shot_off_target: '↗️ Tiro Fuori',
  shot_blocked: '🛡️ Tiro Bloccato',
  corner: '🚩 Corner',
  free_kick: '⚡ Punizione',
  offside: '🏳️ Fuorigioco',
  foul: '⚠️ Fallo',
  save: '🧤 Parata',
  tackle: '🦵 Contrasto',
  interception: '✋ Intercettazione',
  substitution: '🔄 Sostituzione',
  injury: '🏥 Infortunio',
  var_check: '📺 VAR',
  pass_key: '🎖️ Passaggio Chiave',
};

interface EventModalState {
  type: EventType | null;
  teamSide: 'home' | 'away' | null;
  x?: number;
  y?: number;
}

// Player selector component
function PlayerSelector({
  players,
  onSelect,
  onClose,
  title,
}: {
  players: MatchPlayer[];
  onSelect: (player: MatchPlayer | null) => void;
  onClose: () => void;
  title: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = players.filter((mp) => {
    const name = mp.player?.full_name ?? mp.player?.name ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              autoFocus
              className="input-field pl-9"
              placeholder="Cerca giocatore..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="w-full text-left p-2 text-sm text-gray-400 hover:bg-gray-800 rounded-lg mb-1"
            onClick={() => onSelect(null)}
          >
            Nessun giocatore specifico
          </button>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filtered.map((mp) => (
              <button
                key={mp.id}
                className="w-full text-left p-2.5 hover:bg-gray-800 rounded-lg flex items-center gap-2 transition-colors"
                onClick={() => onSelect(mp)}
              >
                <div className="w-7 h-7 bg-gray-700 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {mp.jersey_number ?? mp.player?.jersey_number ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {mp.player?.full_name ?? mp.player?.name ?? `Giocatore ${mp.player_id}`}
                  </div>
                  <div className="text-xs text-gray-500">{mp.is_starter ? 'Titolare' : 'Riserva'}</div>
                </div>
                {mp.position_played && <PositionBadge position={mp.position_played} />}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">Nessun giocatore trovato</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveMatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const matchId = Number(id);

  const [liveMinute, setLiveMinute] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [eventModal, setEventModal] = useState<EventModalState>({ type: null, teamSide: null });
  const [aiSuggestion, setAiSuggestion] = useState<LiveSuggestion | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedPitchPos, setSelectedPitchPos] = useState<{ x: number; y: number } | null>(null);
  const [showSubPanel, setShowSubPanel] = useState(false);

  // Player selection state
  const [playerSelectStep, setPlayerSelectStep] = useState<'main' | 'assist' | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<MatchPlayer | null>(null);
  const [selectedAssist, setSelectedAssist] = useState<MatchPlayer | null>(null);

  const { data: match, isLoading: loadingMatch, refetch: refetchMatch } = useMatch(matchId);
  const { data: lineup = [], refetch: refetchLineup } = useMatchLineup(matchId);
  const { data: events = [], refetch: refetchEvents } = useMatchEvents(matchId, 10_000);
  const { connected } = useLiveMatch({ matchId, enabled: true });
  const logEvent = useLogEvent();
  const { startMatch, endHalfTime, startSecondHalf, endMatch } = useMatchControl();

  // Live minute timer
  useEffect(() => {
    if (match) {
      setLiveMinute(match.minute ?? 0);
      setIsRunning(match.status === 'live');
    }
  }, [match]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setLiveMinute((m) => m + 1);
      }, 60_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const homeLineup = lineup.filter((mp) => mp.team_id === match?.home_team_id);
  const awayLineup = lineup.filter((mp) => mp.team_id === match?.away_team_id);
  const homeStarters = homeLineup.filter((mp) => mp.is_starter);
  const awayStarters = awayLineup.filter((mp) => mp.is_starter);

  const handleEventClick = useCallback((type: EventType, side?: 'home' | 'away') => {
    setEventModal({ type, teamSide: side ?? null });
    setSelectedPlayer(null);
    setSelectedAssist(null);
    setSelectedPitchPos(null);
    // For certain events, skip player selector
    if (['kickoff', 'halftime', 'fulltime', 'var_check', 'offside'].includes(type)) {
      // Log directly
      logEvent.mutate({
        matchId,
        data: {
          type,
          minute: liveMinute,
          team_id: side === 'home' ? match?.home_team_id : side === 'away' ? match?.away_team_id : undefined,
        },
      }, {
        onSuccess: () => {
          toast.success(`${EVENT_LABELS[type] ?? type} registrato!`);
          refetchEvents();
          refetchMatch();
        },
      });
      return;
    }
    setPlayerSelectStep('main');
  }, [liveMinute, matchId, match, logEvent, refetchEvents, refetchMatch]);

  const handlePlayerSelect = (mp: MatchPlayer | null) => {
    setSelectedPlayer(mp);
    const needsAssist = ['goal', 'penalty_goal'].includes(eventModal.type ?? '');
    if (needsAssist) {
      setPlayerSelectStep('assist');
    } else {
      confirmLogEvent(mp, null);
    }
  };

  const handleAssistSelect = (mp: MatchPlayer | null) => {
    setSelectedAssist(mp);
    confirmLogEvent(selectedPlayer, mp);
  };

  const confirmLogEvent = useCallback((player: MatchPlayer | null, assist: MatchPlayer | null) => {
    if (!eventModal.type) return;
    const side = eventModal.teamSide;
    logEvent.mutate({
      matchId,
      data: {
        type: eventModal.type,
        minute: liveMinute,
        player_id: player?.player_id ?? undefined,
        assist_player_id: assist?.player_id ?? undefined,
        team_id: side === 'home' ? match?.home_team_id : side === 'away' ? match?.away_team_id : undefined,
        x_position: selectedPitchPos?.x,
        y_position: selectedPitchPos?.y,
      },
    }, {
      onSuccess: () => {
        toast.success(`${EVENT_LABELS[eventModal.type!] ?? eventModal.type} registrato!`);
        refetchEvents();
        refetchMatch();
      },
    });
    setEventModal({ type: null, teamSide: null });
    setPlayerSelectStep(null);
    setSelectedPlayer(null);
    setSelectedAssist(null);
    setSelectedPitchPos(null);
  }, [eventModal, liveMinute, matchId, match, logEvent, selectedPitchPos, refetchEvents, refetchMatch]);

  const handlePitchClick = (x: number, y: number) => {
    setSelectedPitchPos({ x, y });
  };

  const handleAISuggestion = async () => {
    setLoadingAI(true);
    try {
      const suggestion = await analysisApi.getLiveSuggestion(matchId);
      setAiSuggestion(suggestion);
    } catch {
      toast.error('Errore nella richiesta AI');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loadingMatch) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <FullPageSpinner />
    </div>
  );

  if (!match) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-400">Partita non trovata</p>
        <Link to="/matches" className="text-emerald-400 mt-2 inline-block">← Torna alle partite</Link>
      </div>
    </div>
  );

  const isLive = match.status === 'live';
  const isHalf = match.status === 'halftime';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to={`/matches/${matchId}`} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-sm font-medium text-white">Vista LIVE</div>
        </div>
        <div className="flex items-center gap-3">
          {/* WS status */}
          <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-emerald-400' : 'text-gray-500'}`}>
            {connected ? (
              <><Wifi className="w-3.5 h-3.5" /><div className="w-2 h-2 bg-emerald-400 rounded-full live-dot" />Connesso</>
            ) : (
              <><WifiOff className="w-3.5 h-3.5" />Disconnesso</>
            )}
          </div>
          {/* AI button */}
          <Button
            size="sm"
            variant="outline"
            icon={loadingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            loading={loadingAI}
            onClick={handleAISuggestion}
          >
            Suggerimento AI
          </Button>
        </div>
      </div>

      {/* AI Suggestion Banner */}
      {aiSuggestion && (
        <div className="bg-blue-900/30 border-b border-blue-800/50 px-4 py-3 animate-slide-up">
          <div className="flex items-start justify-between gap-3 max-w-6xl mx-auto">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-blue-400 mb-1">Suggerimento Tattico AI</div>
                <p className="text-sm text-gray-300">{aiSuggestion.suggestion}</p>
                {aiSuggestion.tactical_advice && (
                  <p className="text-sm text-blue-300 mt-1">{aiSuggestion.tactical_advice}</p>
                )}
                {aiSuggestion.formation_tip && (
                  <p className="text-xs text-gray-400 mt-1">Modulo: {aiSuggestion.formation_tip}</p>
                )}
                {aiSuggestion.player_to_watch && (
                  <p className="text-xs text-yellow-400 mt-1">👀 Giocatore da tenere d'occhio: {aiSuggestion.player_to_watch}</p>
                )}
              </div>
            </div>
            <button onClick={() => setAiSuggestion(null)} className="text-gray-500 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* SCOREBOARD */}
        <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
          <div className="max-w-6xl mx-auto">
            {/* Score display */}
            <div className="flex items-center justify-between">
              {/* Home */}
              <div className="flex-1 text-right">
                <div className="text-2xl font-black text-white">{match.home_team?.name ?? 'Casa'}</div>
                <div className="text-xs text-emerald-400 mt-0.5">CASA</div>
                <div className="text-xs text-gray-500 mt-1">
                  {homeStarters.length}/11 titolari
                </div>
              </div>

              {/* Score & Timer */}
              <div className="text-center px-6">
                {/* Live indicator + minute */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  {isLive && <div className="w-2.5 h-2.5 bg-red-500 rounded-full live-dot" />}
                  <span className={`text-sm font-bold ${
                    isLive ? 'text-red-400' : isHalf ? 'text-yellow-400' : 'text-gray-400'
                  }`}>
                    {isLive ? `${liveMinute}'` : isHalf ? 'INTERVALLO' : match.status.toUpperCase()}
                  </span>
                </div>
                {/* Score */}
                <div className="flex items-center gap-3">
                  <span className="text-7xl font-black text-emerald-400">{match.home_score}</span>
                  <span className="text-3xl text-gray-600 font-bold">:</span>
                  <span className="text-7xl font-black text-red-400">{match.away_score}</span>
                </div>
                {/* Timer controls */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  {match.status === 'scheduled' && (
                    <Button
                      size="sm"
                      icon={<Play className="w-3 h-3" />}
                      loading={startMatch.isPending}
                      onClick={() => {
                        startMatch.mutate(matchId, {
                          onSuccess: () => {
                            setIsRunning(true);
                            refetchMatch();
                          }
                        });
                      }}
                    >
                      Inizia
                    </Button>
                  )}
                  {isLive && (
                    <>
                      <button
                        onClick={() => setIsRunning((r) => !r)}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 ${
                          isRunning ? 'bg-yellow-600/20 text-yellow-400' : 'bg-emerald-600/20 text-emerald-400'
                        }`}
                      >
                        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {isRunning ? 'Pausa' : 'Avvia'}
                      </button>
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={endHalfTime.isPending}
                        onClick={() => { endHalfTime.mutate(matchId, { onSuccess: () => { setIsRunning(false); refetchMatch(); } }); }}
                      >
                        Intervallo
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<Square className="w-3 h-3" />}
                        loading={endMatch.isPending}
                        onClick={() => { endMatch.mutate(matchId, { onSuccess: () => { setIsRunning(false); refetchMatch(); } }); }}
                      >
                        Fine
                      </Button>
                    </>
                  )}
                  {isHalf && (
                    <Button
                      size="sm"
                      loading={startSecondHalf.isPending}
                      onClick={() => {
                        startSecondHalf.mutate(matchId, {
                          onSuccess: () => { setIsRunning(true); refetchMatch(); }
                        });
                      }}
                    >
                      2° Tempo
                    </Button>
                  )}
                </div>
              </div>

              {/* Away */}
              <div className="flex-1">
                <div className="text-2xl font-black text-white">{match.away_team?.name ?? 'Ospite'}</div>
                <div className="text-xs text-red-400 mt-0.5">OSPITE</div>
                <div className="text-xs text-gray-500 mt-1">
                  {awayStarters.length}/11 titolari
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT: Event Logger */}
            <div className="lg:col-span-1">
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-gray-800">
                  <div className="text-sm font-semibold text-white">Registra Evento</div>
                  <div className="text-xs text-gray-500 mt-0.5">Seleziona squadra e tipo di evento</div>
                </div>

                {/* Team selector for events */}
                <div className="p-3 border-b border-gray-800 flex gap-2">
                  <button
                    className="flex-1 py-2 bg-emerald-900/30 border border-emerald-700/50 rounded-lg text-emerald-400 text-sm font-medium hover:bg-emerald-900/50 transition-colors"
                    onClick={() => setEventModal((m) => ({ ...m, teamSide: 'home' }))}
                  >
                    {match.home_team?.short_name ?? 'CASA'}
                  </button>
                  <button
                    className="flex-1 py-2 bg-red-900/30 border border-red-700/50 rounded-lg text-red-400 text-sm font-medium hover:bg-red-900/50 transition-colors"
                    onClick={() => setEventModal((m) => ({ ...m, teamSide: 'away' }))}
                  >
                    {match.away_team?.short_name ?? 'OSPITE'}
                  </button>
                </div>

                {eventModal.teamSide && (
                  <div className="px-1 text-xs text-center py-1 font-medium" style={{
                    color: eventModal.teamSide === 'home' ? '#10b981' : '#ef4444'
                  }}>
                    {eventModal.teamSide === 'home' ? match.home_team?.name : match.away_team?.name}
                  </div>
                )}

                <div className="p-3 max-h-[calc(100vh-460px)] overflow-y-auto">
                  <EventLogger
                    onEventClick={(type) => handleEventClick(type, eventModal.teamSide ?? undefined)}
                    compact
                    disabled={!match || (!isLive && !isHalf)}
                  />
                </div>
              </div>
            </div>

            {/* CENTER: Pitch + Events feed */}
            <div className="lg:col-span-1 space-y-4">
              {/* Pitch view */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Campo</span>
                  {selectedPitchPos && (
                    <span className="text-xs text-emerald-400">
                      Posizione: {selectedPitchPos.x}%, {selectedPitchPos.y}%
                    </span>
                  )}
                </div>
                <PitchView
                  events={events}
                  homeTeamId={match.home_team_id}
                  onPitchClick={handlePitchClick}
                  showLastN={10}
                  interactive
                  height={240}
                />
              </div>

              {/* Recent events feed */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">
                    Ultimi eventi ({events.length})
                  </span>
                  <Clock className="w-4 h-4 text-gray-500" />
                </div>
                <div className="overflow-y-auto max-h-64">
                  {events.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      Nessun evento registrato
                    </div>
                  ) : (
                    [...events]
                      .sort((a, b) => b.minute - a.minute)
                      .map((event) => {
                        const isHome = event.team_id === match.home_team_id;
                        return (
                          <div
                            key={event.id}
                            className={`px-3 py-2 border-b border-gray-800/50 flex items-center gap-2 text-sm ${
                              isHome ? '' : 'flex-row-reverse'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-8 h-6 rounded flex items-center justify-center text-xs font-bold ${
                              isHome ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'
                            }`}>
                              {event.minute}'
                            </div>
                            <div className={`flex-1 min-w-0 ${isHome ? '' : 'text-right'}`}>
                              <div className="text-white text-xs font-medium">
                                {EVENT_LABELS[event.type] ?? event.type}
                              </div>
                              {event.player && (
                                <div className="text-gray-500 text-xs truncate">
                                  {event.player.name} {event.player.surname}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: Lineups + Substitutions */}
            <div className="lg:col-span-1 space-y-4">
              {/* Lineups */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-3 border-b border-gray-800">
                  <span className="text-sm font-semibold text-white">Formazioni</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-800">
                  {/* Home */}
                  <div className="p-3">
                    <div className="text-xs font-semibold text-emerald-400 mb-2 truncate">
                      {match.home_team?.name ?? 'Casa'}
                    </div>
                    <div className="space-y-1">
                      {homeStarters.slice(0, 11).map((mp) => (
                        <div key={mp.id} className="flex items-center gap-1.5 py-0.5">
                          <div className="w-5 h-5 bg-emerald-900/40 rounded text-xs text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">
                            {mp.jersey_number ?? mp.player?.jersey_number ?? '?'}
                          </div>
                          <span className="text-xs text-gray-300 truncate">
                            {mp.player?.surname ?? mp.player?.name ?? `#${mp.player_id}`}
                          </span>
                        </div>
                      ))}
                      {homeStarters.length === 0 && (
                        <div className="text-xs text-gray-600">Nessun titolare</div>
                      )}
                    </div>
                  </div>
                  {/* Away */}
                  <div className="p-3">
                    <div className="text-xs font-semibold text-red-400 mb-2 truncate">
                      {match.away_team?.name ?? 'Ospite'}
                    </div>
                    <div className="space-y-1">
                      {awayStarters.slice(0, 11).map((mp) => (
                        <div key={mp.id} className="flex items-center gap-1.5 py-0.5">
                          <div className="w-5 h-5 bg-red-900/40 rounded text-xs text-red-400 font-bold flex items-center justify-center flex-shrink-0">
                            {mp.jersey_number ?? mp.player?.jersey_number ?? '?'}
                          </div>
                          <span className="text-xs text-gray-300 truncate">
                            {mp.player?.surname ?? mp.player?.name ?? `#${mp.player_id}`}
                          </span>
                        </div>
                      ))}
                      {awayStarters.length === 0 && (
                        <div className="text-xs text-gray-600">Nessun titolare</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Substitutions */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                <button
                  className="w-full p-3 flex items-center justify-between text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                  onClick={() => setShowSubPanel((v) => !v)}
                >
                  <span>Sostituzioni</span>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showSubPanel ? 'rotate-180' : ''}`} />
                </button>
                {showSubPanel && (
                  <div className="p-3 border-t border-gray-800 space-y-2">
                    {/* Quick substitution buttons */}
                    <div className="text-xs text-gray-500 mb-2">Effettua sostituzione rapida:</div>
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2 bg-teal-900/30 border border-teal-700/50 rounded-lg text-teal-400 text-sm hover:bg-teal-900/50 transition-colors"
                      onClick={() => handleEventClick('substitution', 'home')}
                    >
                      🔄 Sostituzione {match.home_team?.short_name ?? 'Casa'}
                    </button>
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2 bg-teal-900/30 border border-teal-700/50 rounded-lg text-teal-400 text-sm hover:bg-teal-900/50 transition-colors"
                      onClick={() => handleEventClick('substitution', 'away')}
                    >
                      🔄 Sostituzione {match.away_team?.short_name ?? 'Ospite'}
                    </button>
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
                <div className="text-xs font-semibold text-gray-400 mb-2 uppercase">Statistiche Rapide</div>
                {(() => {
                  const goals = events.filter((e) => ['goal', 'penalty_goal'].includes(e.type));
                  const yellowCards = events.filter((e) => e.type === 'yellow_card');
                  const corners = events.filter((e) => e.type === 'corner');
                  const shots = events.filter((e) => ['shot_on_target', 'shot_off_target'].includes(e.type));

                  const stat = (label: string, home: number, away: number) => (
                    <div key={label} className="flex items-center justify-between text-xs py-1 border-b border-gray-800">
                      <span className="font-bold text-emerald-400">{home}</span>
                      <span className="text-gray-500">{label}</span>
                      <span className="font-bold text-red-400">{away}</span>
                    </div>
                  );

                  const count = (arr: typeof events, teamId: number) =>
                    arr.filter((e) => e.team_id === teamId).length;

                  return (
                    <>
                      {stat('Gol', count(goals, match.home_team_id), count(goals, match.away_team_id))}
                      {stat('Ammonizioni', count(yellowCards, match.home_team_id), count(yellowCards, match.away_team_id))}
                      {stat('Tiri', count(shots, match.home_team_id), count(shots, match.away_team_id))}
                      {stat('Corner', count(corners, match.home_team_id), count(corners, match.away_team_id))}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player selector modal */}
      {playerSelectStep === 'main' && eventModal.type && (
        <PlayerSelector
          players={eventModal.teamSide === 'home' ? homeLineup : awayLineup}
          title={`${EVENT_LABELS[eventModal.type] ?? eventModal.type} - Seleziona giocatore`}
          onSelect={handlePlayerSelect}
          onClose={() => { setPlayerSelectStep(null); setEventModal({ type: null, teamSide: null }); }}
        />
      )}

      {playerSelectStep === 'assist' && eventModal.type && (
        <PlayerSelector
          players={eventModal.teamSide === 'home' ? homeLineup : awayLineup}
          title="Seleziona assistman (opzionale)"
          onSelect={handleAssistSelect}
          onClose={() => confirmLogEvent(selectedPlayer, null)}
        />
      )}
    </div>
  );
}
