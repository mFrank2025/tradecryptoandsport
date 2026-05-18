import { useNavigate } from 'react-router-dom';
import { Users, Shield, Calendar, Dumbbell, Plus, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import { useTeams } from '../hooks/useTeams';
import { usePlayers } from '../hooks/usePlayers';
import { useRecentMatches } from '../hooks/useMatches';
import MatchCard from '../components/Match/MatchCard';
import Card, { CardHeader, CardTitle } from '../components/UI/Card';
import Button from '../components/UI/Button';
import { FullPageSpinner } from '../components/UI/Spinner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: teams = [] } = useTeams();
  const { data: players = [] } = usePlayers();
  const { data: recentMatches = [], isLoading: loadingMatches } = useRecentMatches(5);

  const liveMatches = recentMatches.filter((m) => m.status === 'live' || m.status === 'halftime');
  const finishedMatches = recentMatches.filter((m) => m.status === 'finished');

  const stats = [
    { label: 'Giocatori', value: players.length, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800' },
    { label: 'Squadre', value: teams.length, icon: Shield, color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800' },
    { label: 'Partite Totali', value: recentMatches.length, icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-900/30 border-purple-800' },
    { label: 'In Corso', value: liveMatches.length, icon: Zap, color: 'text-red-400', bg: 'bg-red-900/30 border-red-800' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-black text-white">Benvenuto, Coach! 👋</h2>
          <p className="text-gray-400 mt-1">Analisi tattica avanzata con intelligenza artificiale</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2">
          <span className="text-2xl">⚽</span>
          <span className="text-sm font-medium text-gray-300">Calcio</span>
          <ChevronRight className="w-4 h-4 text-gray-500" />
        </div>
      </div>

      {/* Live matches alert */}
      {liveMatches.length > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 flex items-center justify-between animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full live-dot" />
            <span className="font-semibold text-red-400">
              {liveMatches.length === 1
                ? `Partita in corso: ${liveMatches[0].home_team?.name} vs ${liveMatches[0].away_team?.name}`
                : `${liveMatches.length} partite in corso`}
            </span>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => navigate(`/matches/${liveMatches[0].id}/live`)}
          >
            Vai LIVE
          </Button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`border rounded-xl p-4 ${bg}`}>
            <div className="flex items-start justify-between mb-3">
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-4xl font-black ${color}`}>{value}</div>
            <div className="text-sm text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent matches */}
        <div className="lg:col-span-2">
          <Card padding={false}>
            <CardHeader className="p-4 pb-0">
              <CardTitle>Partite Recenti</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/matches')}>
                Vedi tutte <ChevronRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <div className="p-4 space-y-3">
              {loadingMatches ? (
                <FullPageSpinner />
              ) : recentMatches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p>Nessuna partita registrata</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate('/matches')}
                  >
                    Crea la prima partita
                  </Button>
                </div>
              ) : (
                recentMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick actions + AI insights */}
        <div className="space-y-4">
          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Azioni Rapide</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {[
                {
                  label: 'Nuova Partita',
                  icon: Plus,
                  color: 'text-emerald-400',
                  bg: 'hover:bg-emerald-900/20 border-emerald-800/50',
                  action: () => navigate('/matches'),
                },
                {
                  label: 'Aggiungi Giocatore',
                  icon: Users,
                  color: 'text-blue-400',
                  bg: 'hover:bg-blue-900/20 border-blue-800/50',
                  action: () => navigate('/players'),
                },
                {
                  label: 'Nuova Sessione Allenamento',
                  icon: Dumbbell,
                  color: 'text-purple-400',
                  bg: 'hover:bg-purple-900/20 border-purple-800/50',
                  action: () => navigate('/training'),
                },
                {
                  label: 'Analisi AI',
                  icon: TrendingUp,
                  color: 'text-orange-400',
                  bg: 'hover:bg-orange-900/20 border-orange-800/50',
                  action: () => navigate('/analysis'),
                },
              ].map(({ label, icon: Icon, color, bg, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg border border-gray-800
                    transition-all text-left ${bg}
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-gray-200">{label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
                </button>
              ))}
            </div>
          </Card>

          {/* Team overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Squadre ({teams.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/teams')}>
                Gestisci
              </Button>
            </CardHeader>
            <div className="space-y-2">
              {teams.slice(0, 4).map((team) => (
                <div
                  key={team.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                  onClick={() => navigate('/teams')}
                >
                  <div className="w-8 h-8 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center text-sm font-bold text-emerald-400">
                    {team.short_name?.[0] ?? team.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{team.name}</div>
                    {team.city && <div className="text-xs text-gray-500">{team.city}</div>}
                  </div>
                </div>
              ))}
              {teams.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">Nessuna squadra</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
