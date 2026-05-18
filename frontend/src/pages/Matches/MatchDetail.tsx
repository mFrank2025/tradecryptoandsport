import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Radio, BarChart2, Clock, List, Users,
  Sparkles, Loader2, FileText
} from 'lucide-react';
import { useMatch, useMatchEvents, useMatchStats, useMatchControl } from '../../hooks/useMatches';
import { analysisApi } from '../../api/analysis';
import Scoreboard from '../../components/Match/Scoreboard';
import HeatmapOverlay from '../../components/Analysis/HeatmapOverlay';
import TeamStatsPanel from '../../components/Stats/TeamStatsPanel';
import Button from '../../components/UI/Button';
import Card, { CardHeader, CardTitle } from '../../components/UI/Card';
import { FullPageSpinner } from '../../components/UI/Spinner';
import { StatusBadge } from '../../components/UI/Badge';
import { MatchReport } from '../../types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

const EVENT_LABELS: Record<string, string> = {
  goal: 'Gol ⚽',
  own_goal: 'Autogol 😬',
  penalty_goal: 'Rigore Gol ✅',
  penalty_miss: 'Rigore Mancato ❌',
  yellow_card: 'Ammonizione 🟨',
  red_card: 'Espulsione 🟥',
  second_yellow: '2° Giallo 🟥',
  substitution: 'Sostituzione 🔄',
  shot_on_target: 'Tiro in Porta 🎯',
  shot_off_target: 'Tiro Fuori ↗️',
  shot_blocked: 'Tiro Bloccato 🛡️',
  corner: 'Corner 🚩',
  free_kick: 'Punizione ⚡',
  offside: 'Fuorigioco 🏳️',
  foul: 'Fallo ⚠️',
  save: 'Parata 🧤',
  tackle: 'Contrasto 🦵',
  interception: 'Intercettazione ✋',
  injury: 'Infortunio 🏥',
  var_check: 'VAR 📺',
  halftime: 'Fine Primo Tempo',
  fulltime: 'Fine Partita',
  kickoff: 'Calcio d\'inizio',
};

type TabId = 'overview' | 'events' | 'heatmap' | 'stats' | 'ratings';

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const matchId = Number(id);

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [report, setReport] = useState<MatchReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  const { data: match, isLoading: loadingMatch } = useMatch(matchId);
  const { data: events = [] } = useMatchEvents(matchId);
  const { data: stats } = useMatchStats(matchId);
  const { startMatch, endHalfTime, startSecondHalf, endMatch } = useMatchControl();

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const r = await analysisApi.generateMatchReport(matchId);
      setReport(r);
      toast.success('Report generato!');
    } catch {
      toast.error('Errore nella generazione del report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loadingMatch) return <FullPageSpinner />;
  if (!match) return (
    <div className="text-center py-16">
      <p className="text-gray-400">Partita non trovata</p>
      <Link to="/matches" className="text-emerald-400 mt-2 inline-block">← Torna alle partite</Link>
    </div>
  );

  const isLive = match.status === 'live' || match.status === 'halftime';
  const isFinished = match.status === 'finished';

  const homeEvents = events.filter((e) => e.team_id === match.home_team_id);
  const awayEvents = events.filter((e) => e.team_id === match.away_team_id);

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Panoramica', icon: BarChart2 },
    { id: 'events', label: 'Timeline', icon: List },
    { id: 'heatmap', label: 'Heatmap', icon: Clock },
    { id: 'stats', label: 'Statistiche', icon: BarChart2 },
    { id: 'ratings', label: 'Rating', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link to="/matches" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />
          Partite
        </Link>
        {isLive && (
          <Button
            variant="danger"
            icon={<Radio className="w-4 h-4 animate-pulse" />}
            onClick={() => navigate(`/matches/${matchId}/live`)}
          >
            Vai LIVE
          </Button>
        )}
      </div>

      {/* Scoreboard */}
      <Scoreboard match={match} />

      {/* Match controls */}
      {!isFinished && (
        <Card>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">Controllo partita:</span>
            {match.status === 'scheduled' && (
              <Button
                size="sm"
                variant="primary"
                loading={startMatch.isPending}
                onClick={() => startMatch.mutate(matchId)}
              >
                Inizia Partita
              </Button>
            )}
            {match.status === 'live' && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  loading={endHalfTime.isPending}
                  onClick={() => endHalfTime.mutate(matchId)}
                >
                  Fine 1° Tempo
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  loading={endMatch.isPending}
                  onClick={() => endMatch.mutate(matchId)}
                >
                  Termina Partita
                </Button>
              </>
            )}
            {match.status === 'halftime' && (
              <Button
                size="sm"
                variant="primary"
                loading={startSecondHalf.isPending}
                onClick={() => startSecondHalf.mutate(matchId)}
              >
                Inizia 2° Tempo
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* AI Report (finished matches) */}
      {isFinished && (
        <Card className="border-blue-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-blue-400">Report Post-Partita AI</span>
            </div>
            <Button
              icon={generatingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              loading={generatingReport}
              onClick={handleGenerateReport}
            >
              Genera Report
            </Button>
          </div>
          {report && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div className="p-4 bg-gray-800 rounded-xl">
                <div className="text-sm font-semibold text-gray-300 mb-2">Sommario</div>
                <p className="text-sm text-gray-400">{report.summary}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-900/20 border border-emerald-800/50 rounded-xl">
                  <div className="text-sm font-semibold text-emerald-400 mb-2">
                    {match.home_team?.name ?? 'Casa'}
                  </div>
                  <p className="text-sm text-gray-400">{report.home_team_performance}</p>
                </div>
                <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-xl">
                  <div className="text-sm font-semibold text-red-400 mb-2">
                    {match.away_team?.name ?? 'Ospite'}
                  </div>
                  <p className="text-sm text-gray-400">{report.away_team_performance}</p>
                </div>
              </div>
              {report.key_moments.length > 0 && (
                <div className="p-4 bg-gray-800 rounded-xl">
                  <div className="text-sm font-semibold text-gray-300 mb-2">Momenti Chiave</div>
                  <ul className="space-y-1">
                    {report.key_moments.map((m, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-emerald-400">•</span> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.mvp && (
                <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded-xl flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="text-xs text-yellow-400 font-semibold">MVP della Partita</div>
                    <div className="text-white font-bold">{report.mvp}</div>
                  </div>
                </div>
              )}
              <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
                <div className="text-sm font-semibold text-blue-400 mb-2">Analisi Tattica</div>
                <p className="text-sm text-gray-400">{report.tactical_analysis}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap
              ${activeTab === id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}
            `}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Match info */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni Partita</CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Stato', value: <StatusBadge status={match.status} /> },
                { label: 'Data', value: format(new Date(match.date), 'd MMMM yyyy, HH:mm', { locale: it }) },
                { label: 'Competizione', value: match.competition ?? '-' },
                { label: 'Stagione', value: match.season ?? '-' },
                { label: 'Giornata', value: match.matchday ? `${match.matchday}ª` : '-' },
                { label: 'Stadio', value: match.venue ?? '-' },
                { label: 'Arbitro', value: match.referee ?? '-' },
                { label: 'Spettatori', value: match.attendance?.toLocaleString() ?? '-' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-gray-800">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-white">{value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Goal scorers */}
          <Card>
            <CardHeader>
              <CardTitle>Marcatori</CardTitle>
            </CardHeader>
            {events.filter((e) => ['goal', 'own_goal', 'penalty_goal'].includes(e.type)).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nessun gol registrato</p>
            ) : (
              <div className="space-y-2">
                {events
                  .filter((e) => ['goal', 'own_goal', 'penalty_goal'].includes(e.type))
                  .map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                      <span className="text-lg">⚽</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">
                          {event.player?.full_name ?? event.player?.name ?? `Giocatore ${event.player_id}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {event.type === 'own_goal' ? 'Autogol' :
                           event.type === 'penalty_goal' ? 'Rigore' : 'Gol'}
                          {event.assist_player && ` (assist: ${event.assist_player.name})`}
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${event.team_id === match.home_team_id ? 'text-emerald-400' : 'text-red-400'}`}>
                        {event.minute}'
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'events' && (
        <Card padding={false}>
          <CardHeader className="p-4">
            <CardTitle>Timeline Eventi ({events.length})</CardTitle>
          </CardHeader>
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nessun evento registrato</div>
          ) : (
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-800" />
              <div className="space-y-2 p-4">
                {[...events].sort((a, b) => a.minute - b.minute).map((event) => {
                  const isHome = event.team_id === match.home_team_id;
                  return (
                    <div key={event.id} className={`flex items-center gap-3 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}>
                      {/* Event content */}
                      <div className={`flex-1 p-3 rounded-lg text-sm ${
                        isHome ? 'bg-emerald-900/20 border border-emerald-800/30 text-right' : 'bg-red-900/20 border border-red-800/30'
                      }`}>
                        <div className="font-medium text-white">
                          {EVENT_LABELS[event.type] ?? event.type}
                        </div>
                        {event.player && (
                          <div className={`text-xs text-gray-400 mt-0.5 ${isHome ? 'text-right' : ''}`}>
                            {event.player.name} {event.player.surname}
                            {event.assist_player && ` • assist: ${event.assist_player.name}`}
                          </div>
                        )}
                        {event.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{event.description}</div>
                        )}
                      </div>

                      {/* Minute badge */}
                      <div className="z-10 w-12 h-8 bg-gray-900 border-2 border-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-300">{event.minute}'</span>
                      </div>

                      {/* Placeholder for other side */}
                      <div className="flex-1" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'heatmap' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mappa degli eventi</CardTitle>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> {match.home_team?.name}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> {match.away_team?.name}</span>
              </div>
            </CardHeader>
            <HeatmapOverlay events={events} homeTeamId={match.home_team_id} />
          </Card>
        </div>
      )}

      {activeTab === 'stats' && stats && (
        <TeamStatsPanel
          homeTeamName={match.home_team?.name ?? 'Casa'}
          awayTeamName={match.away_team?.name ?? 'Ospite'}
          homeStats={stats.home ?? {}}
          awayStats={stats.away ?? {}}
        />
      )}

      {activeTab === 'ratings' && (
        <Card padding={false}>
          <CardHeader className="p-4">
            <CardTitle>Rating Giocatori</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  {['Giocatore', 'Squadra', 'Pos.', 'Min.', 'Gol', 'Assist', 'Rating'].map((h) => (
                    <th key={h} className="px-4 py-3 text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="text-center py-6 text-gray-500">
                    Dati di rating disponibili dopo la partita
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
