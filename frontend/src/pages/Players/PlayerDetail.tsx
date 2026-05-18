import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, User, Sparkles, BarChart2, Calendar, Target,
  Pencil, Trash2, Loader2, RefreshCw
} from 'lucide-react';
import {
  usePlayer, usePlayerStats, usePlayerAnalyses,
  usePlayerMatchHistory, useGeneratePlayerAnalysis,
  useUpdatePlayer, useDeletePlayer,
} from '../../hooks/usePlayers';
import { PositionBadge } from '../../components/UI/Badge';
import PlayerStats from '../../components/Players/PlayerStats';
import PlayerAnalysisCard from '../../components/Players/PlayerAnalysisCard';
import PlayerRadarChart from '../../components/Analysis/RadarChart';
import Button from '../../components/UI/Button';
import Card, { CardHeader, CardTitle } from '../../components/UI/Card';
import Modal from '../../components/UI/Modal';
import PlayerForm from '../../components/Players/PlayerForm';
import { FullPageSpinner } from '../../components/UI/Spinner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CreatePlayerForm, PlayerStatistics } from '../../types';

type TabId = 'stats' | 'analysis' | 'history' | 'roles';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'stats', label: 'Statistiche', icon: BarChart2 },
  { id: 'analysis', label: 'Analisi AI', icon: Sparkles },
  { id: 'history', label: 'Storico Partite', icon: Calendar },
  { id: 'roles', label: 'Suggerimento Ruolo', icon: Target },
];

function buildRadarData(stats: PlayerStatistics) {
  return [
    { subject: 'Gol', value: Math.min(100, stats.goals * 5) },
    { subject: 'Assist', value: Math.min(100, stats.assists * 5) },
    { subject: 'Tiri', value: Math.min(100, stats.shots) },
    { subject: 'Passaggi%', value: stats.pass_accuracy },
    { subject: 'Contrasti', value: Math.min(100, stats.tackles * 3) },
    { subject: 'Intercettazioni', value: Math.min(100, stats.interceptions * 4) },
    { subject: 'Dribbling', value: Math.min(100, stats.dribbles_completed * 4) },
    { subject: 'Rating', value: stats.rating_avg * 10 },
  ];
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const playerId = Number(id);
  const [activeTab, setActiveTab] = useState<TabId>('stats');
  const [showEdit, setShowEdit] = useState(false);

  const { data: player, isLoading: loadingPlayer } = usePlayer(playerId);
  const { data: stats } = usePlayerStats(playerId);
  const { data: analyses = [] } = usePlayerAnalyses(playerId);
  const { data: matchHistory = [] } = usePlayerMatchHistory(playerId);

  const generateAnalysis = useGeneratePlayerAnalysis();
  const updatePlayer = useUpdatePlayer();
  const deletePlayer = useDeletePlayer();

  const handleUpdate = (data: CreatePlayerForm) => {
    updatePlayer.mutate({ id: playerId, data }, { onSuccess: () => setShowEdit(false) });
  };

  const handleDelete = () => {
    if (confirm(`Eliminare ${player?.full_name}?`)) {
      deletePlayer.mutate(playerId, { onSuccess: () => navigate('/players') });
    }
  };

  if (loadingPlayer) return <FullPageSpinner />;
  if (!player) return (
    <div className="text-center py-16">
      <p className="text-gray-400">Giocatore non trovato</p>
      <Link to="/players" className="text-emerald-400 mt-2 inline-block">← Torna ai giocatori</Link>
    </div>
  );

  const latestAnalysis = analyses[0];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/players" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Giocatori
      </Link>

      {/* Player header */}
      <Card>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.full_name ?? ''} className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-500" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  {player.jersey_number && (
                    <span className="text-gray-500 mr-2">#{player.jersey_number}</span>
                  )}
                  {player.full_name ?? `${player.name} ${player.surname}`}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <PositionBadge position={player.position} />
                  {player.secondary_position && (
                    <>
                      <span className="text-gray-600 text-xs">·</span>
                      <PositionBadge position={player.secondary_position} />
                    </>
                  )}
                  {player.team?.name && (
                    <span className="text-sm text-gray-400">{player.team.name}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={() => setShowEdit(true)}>
                  Modifica
                </Button>
                <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>
                  Elimina
                </Button>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {[
                { label: 'Età', value: player.age ? `${player.age} anni` : '-' },
                { label: 'Nazionalità', value: player.nationality ?? '-' },
                { label: 'Altezza', value: player.height_cm ? `${player.height_cm} cm` : '-' },
                { label: 'Piede', value: player.preferred_foot === 'right' ? 'Destro' : player.preferred_foot === 'left' ? 'Sinistro' : player.preferred_foot ?? '-' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-800 rounded-lg p-2">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors
              ${activeTab === id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}
            `}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'stats' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            {stats ? (
              <PlayerStats stats={stats} />
            ) : (
              <Card className="text-center py-8">
                <p className="text-gray-400">Nessuna statistica disponibile</p>
              </Card>
            )}
          </div>
          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Profilo Attributi</CardTitle>
              </CardHeader>
              <PlayerRadarChart data={buildRadarData(stats)} />
            </Card>
          )}
        </div>
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Analisi AI ({analyses.length})</h3>
            <Button
              icon={generateAnalysis.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              loading={generateAnalysis.isPending}
              onClick={() => generateAnalysis.mutate(playerId)}
            >
              Genera Nuova Analisi
            </Button>
          </div>
          {analyses.length === 0 ? (
            <Card className="text-center py-8">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-gray-400">Nessuna analisi AI disponibile</p>
              <p className="text-gray-500 text-sm mt-1">Genera la prima analisi per questo giocatore</p>
            </Card>
          ) : (
            analyses.map((analysis, idx) => (
              <PlayerAnalysisCard key={analysis.id} analysis={analysis} isLatest={idx === 0} />
            ))
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <Card padding={false}>
          <CardHeader className="p-4">
            <CardTitle>Storico Partite</CardTitle>
          </CardHeader>
          {matchHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400">Nessuna partita registrata</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    {['Data', 'Partita', 'Pos.', 'Min.', 'Gol', 'Assist', 'Rating'].map((h) => (
                      <th key={h} className="px-4 py-3 text-gray-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(matchHistory as Array<Record<string, unknown>>).map((mp: Record<string, unknown>) => {
                    const matchData = mp.match as Record<string, unknown> | undefined;
                    const homeTeam = matchData?.home_team as Record<string, unknown> | undefined;
                    const awayTeam = matchData?.away_team as Record<string, unknown> | undefined;
                    return (
                    <tr key={String(mp.id ?? '')} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-gray-400">
                        {matchData?.date ? format(new Date(String(matchData.date)), 'd MMM', { locale: it }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-white">
                        {String(homeTeam?.name ?? '-')} vs {String(awayTeam?.name ?? '-')}
                      </td>
                      <td className="px-4 py-3">
                        {mp.position_played ? <PositionBadge position={String(mp.position_played)} /> : '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{String(mp.minutes_played ?? '-')}'</td>
                      <td className="px-4 py-3 font-bold text-emerald-400">{String(mp.goals ?? 0)}</td>
                      <td className="px-4 py-3 font-bold text-blue-400">{String(mp.assists ?? 0)}</td>
                      <td className="px-4 py-3">
                        {mp.rating ? (
                          <span className="font-bold text-white">{Number(mp.rating).toFixed(1)}</span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suggerimenti Ruolo AI</CardTitle>
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                loading={generateAnalysis.isPending}
                onClick={() => generateAnalysis.mutate(playerId)}
              >
                Aggiorna
              </Button>
            </CardHeader>
            {latestAnalysis?.role_suggestions && latestAnalysis.role_suggestions.length > 0 ? (
              <div className="space-y-3">
                {latestAnalysis.role_suggestions.map((role, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                    <div className="text-3xl font-black text-gray-600">#{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <PositionBadge position={role.position} />
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${role.fit_percentage}%` }}
                          />
                        </div>
                        <span className="text-emerald-400 font-bold text-sm">{role.fit_percentage}%</span>
                      </div>
                      <p className="text-sm text-gray-400">{role.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">Nessun suggerimento disponibile</p>
                <p className="text-gray-500 text-sm mt-1">Genera un'analisi AI per ottenere suggerimenti sul ruolo</p>
                <Button
                  className="mt-3"
                  icon={<Sparkles className="w-4 h-4" />}
                  loading={generateAnalysis.isPending}
                  onClick={() => generateAnalysis.mutate(playerId)}
                >
                  Genera Analisi
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifica Giocatore">
        <PlayerForm
          initial={player}
          onSubmit={handleUpdate}
          loading={updatePlayer.isPending}
          onCancel={() => setShowEdit(false)}
        />
      </Modal>
    </div>
  );
}
