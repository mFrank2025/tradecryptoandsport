import { useState } from 'react';
import { BarChart2, Sparkles, Loader2, TrendingUp, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../../api/analysis';
import { usePlayers, useGeneratePlayerAnalysis } from '../../hooks/usePlayers';
import { useTeams } from '../../hooks/useTeams';
import { useMatches } from '../../hooks/useMatches';
import Card, { CardHeader, CardTitle } from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import { FullPageSpinner } from '../../components/UI/Spinner';
import PlayerCard from '../../components/Players/PlayerCard';
import AIInsightCard from '../../components/Analysis/AIInsightCard';
import PlayerRadarChart from '../../components/Analysis/RadarChart';
import { Player, PlayerStatistics } from '../../types';
import { playersApi } from '../../api/players';
import toast from 'react-hot-toast';

export default function AnalysisDashboard() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [compareTeamA, setCompareTeamA] = useState<number | null>(null);
  const [compareTeamB, setCompareTeamB] = useState<number | null>(null);
  const [teamCompare, setTeamCompare] = useState<Record<string, unknown> | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const { data: players = [] } = usePlayers();
  const { data: teams = [] } = useTeams();
  const { data: matches = [] } = useMatches();

  const generateAnalysis = useGeneratePlayerAnalysis();

  const { data: playerAnalyses } = useQuery({
    queryKey: ['analysis', 'player', selectedPlayerId],
    queryFn: () => selectedPlayerId ? playersApi.getAnalyses(selectedPlayerId) : Promise.resolve([]),
    enabled: !!selectedPlayerId,
  });

  const { data: playerStats } = useQuery({
    queryKey: ['players', selectedPlayerId, 'stats'],
    queryFn: () => selectedPlayerId ? playersApi.getStats(selectedPlayerId) : Promise.resolve(null),
    enabled: !!selectedPlayerId,
  });

  const latestAnalysis = playerAnalyses?.[0];

  const handleCompareTeams = async () => {
    if (!compareTeamA || !compareTeamB) {
      toast.error('Seleziona due squadre da confrontare');
      return;
    }
    setLoadingCompare(true);
    try {
      const result = await analysisApi.compareTeams(compareTeamA, compareTeamB) as Record<string, unknown>;
      setTeamCompare(result);
    } catch {
      toast.error('Errore nel confronto squadre');
    } finally {
      setLoadingCompare(false);
    }
  };

  const buildRadarData = (stats: PlayerStatistics) => [
    { subject: 'Gol', value: Math.min(100, stats.goals * 5) },
    { subject: 'Assist', value: Math.min(100, stats.assists * 5) },
    { subject: 'Tiri', value: Math.min(100, stats.shots) },
    { subject: 'Passaggi%', value: stats.pass_accuracy },
    { subject: 'Contrasti', value: Math.min(100, stats.tackles * 3) },
    { subject: 'Intercettazioni', value: Math.min(100, stats.interceptions * 4) },
    { subject: 'Dribbling', value: Math.min(100, stats.dribbles_completed * 4) },
    { subject: 'Rating', value: stats.rating_avg * 10 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-400" />
          Centro Analisi AI
        </h2>
        <p className="text-gray-400 text-sm mt-1">Analisi tattiche e statistiche avanzate con intelligenza artificiale</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Giocatori analizzati', value: players.filter((p) => p).length, icon: BarChart2, color: 'text-blue-400' },
          { label: 'Squadre', value: teams.length, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Partite analizzate', value: matches.filter((m) => m.status === 'finished').length, icon: AlertCircle, color: 'text-purple-400' },
          { label: 'Analisi generate', value: 0, icon: Lightbulb, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <div className={`text-3xl font-black ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Player Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Analisi Giocatore
              </div>
            </CardTitle>
          </CardHeader>

          {/* Player selector */}
          <div className="mb-4">
            <label className="label">Seleziona giocatore</label>
            <select
              className="input-field"
              value={selectedPlayerId ?? ''}
              onChange={(e) => setSelectedPlayerId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Scegli un giocatore...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.jersey_number ?? '?'} {p.full_name ?? `${p.name} ${p.surname}`} ({p.position})
                </option>
              ))}
            </select>
          </div>

          {selectedPlayerId && (
            <div className="space-y-4">
              {/* Generate button */}
              <Button
                icon={generateAnalysis.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                loading={generateAnalysis.isPending}
                onClick={() => generateAnalysis.mutate(selectedPlayerId)}
                className="w-full"
              >
                Genera Nuova Analisi AI
              </Button>

              {/* Radar chart */}
              {playerStats && (
                <PlayerRadarChart data={buildRadarData(playerStats)} />
              )}

              {/* Latest analysis */}
              {latestAnalysis ? (
                <AIInsightCard analysis={latestAnalysis} />
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <Sparkles className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  Nessuna analisi disponibile. Generane una!
                </div>
              )}
            </div>
          )}

          {!selectedPlayerId && (
            <div className="text-center py-8 text-gray-500">
              <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p>Seleziona un giocatore per vedere l'analisi AI</p>
            </div>
          )}
        </Card>

        {/* Team Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-purple-400" />
                Confronto Squadre
              </div>
            </CardTitle>
          </CardHeader>

          <div className="space-y-3 mb-4">
            <div>
              <label className="label">Squadra A</label>
              <select
                className="input-field"
                value={compareTeamA ?? ''}
                onChange={(e) => setCompareTeamA(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Seleziona squadra A...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Squadra B</label>
              <select
                className="input-field"
                value={compareTeamB ?? ''}
                onChange={(e) => setCompareTeamB(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Seleziona squadra B...</option>
                {teams.filter((t) => t.id !== compareTeamA).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <Button
              className="w-full"
              variant="secondary"
              icon={loadingCompare ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              loading={loadingCompare}
              onClick={handleCompareTeams}
            >
              Confronta Squadre
            </Button>
          </div>

          {teamCompare && (
            <div className="space-y-3 animate-fade-in">
              {Object.entries(teamCompare).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-800 rounded-lg">
                  <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-gray-300">
                    {typeof value === 'string' ? value : typeof value === 'number' ? String(value) : JSON.stringify(value)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!teamCompare && !loadingCompare && (
            <div className="text-center py-8 text-gray-500">
              <BarChart2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p>Seleziona due squadre per confrontarle</p>
            </div>
          )}
        </Card>
      </div>

      {/* Players with analyses */}
      <Card>
        <CardHeader>
          <CardTitle>Giocatori da Analizzare</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.slice(0, 9).map((player) => (
            <div
              key={player.id}
              className="cursor-pointer"
              onClick={() => setSelectedPlayerId(player.id)}
            >
              <PlayerCard player={player} selected={selectedPlayerId === player.id} onClick={() => setSelectedPlayerId(player.id)} />
            </div>
          ))}
        </div>
        {players.length > 9 && (
          <p className="text-center text-gray-500 text-sm mt-3">E altri {players.length - 9} giocatori...</p>
        )}
        {players.length === 0 && (
          <p className="text-center text-gray-500 py-4">Nessun giocatore disponibile</p>
        )}
      </Card>
    </div>
  );
}
