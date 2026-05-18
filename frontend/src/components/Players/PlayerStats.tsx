import { PlayerStatistics } from '../../types';
import StatBar from '../Stats/StatBar';
import Card, { CardHeader, CardTitle } from '../UI/Card';

interface PlayerStatsProps {
  stats: PlayerStatistics;
}

export default function PlayerStats({ stats }: PlayerStatsProps) {
  const isGK = stats.saves !== undefined;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Partite', value: stats.matches_played },
          { label: 'Minuti', value: stats.minutes_played },
          { label: 'Gol', value: stats.goals, accent: true },
          { label: 'Assist', value: stats.assists, accent: true },
        ].map(({ label, value, accent }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
            <div className={`text-3xl font-black ${accent ? 'text-emerald-400' : 'text-white'}`}>
              {value}
            </div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Attacking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attacco</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <StatBar label="Tiri" value={stats.shots} max={Math.max(stats.shots, 50)} />
          <StatBar label="Tiri in porta" value={stats.shots_on_target} max={Math.max(stats.shots, 50)} />
          <StatBar
            label="Precisione tiri"
            value={stats.shots > 0 ? Math.round((stats.shots_on_target / stats.shots) * 100) : 0}
            max={100}
            suffix="%"
            color="bg-blue-500"
          />
        </div>
      </Card>

      {/* Passing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passaggi</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <StatBar label="Passaggi totali" value={stats.passes_attempted ?? stats.matches_played * 40} max={500} color="bg-blue-500" />
          <StatBar label="Precisione passaggi" value={stats.pass_accuracy} max={100} suffix="%" color="bg-blue-500" />
          <StatBar label="Dribbling riusciti" value={stats.dribbles_completed} max={50} color="bg-purple-500" />
        </div>
      </Card>

      {/* Defense */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Difesa</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          <StatBar label="Contrasti" value={stats.tackles} max={100} color="bg-yellow-500" />
          <StatBar label="Intercettazioni" value={stats.interceptions} max={50} color="bg-yellow-500" />
          <StatBar label="Falli commessi" value={stats.fouls_committed} max={50} color="bg-red-500" />
        </div>
      </Card>

      {/* Discipline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disciplina</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-yellow-900/30 border border-yellow-800/50 rounded-lg">
            <div className="text-2xl font-black text-yellow-400">{stats.yellow_cards}</div>
            <div className="text-xs text-gray-400 mt-1">Ammonizioni</div>
          </div>
          <div className="text-center p-3 bg-red-900/30 border border-red-800/50 rounded-lg">
            <div className="text-2xl font-black text-red-400">{stats.red_cards}</div>
            <div className="text-xs text-gray-400 mt-1">Espulsioni</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <div className="text-2xl font-black text-gray-200">
              {stats.rating_avg > 0 ? stats.rating_avg.toFixed(1) : '-'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Rating medio</div>
          </div>
        </div>
      </Card>

      {/* GK stats */}
      {isGK && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portiere</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-black text-blue-400">{stats.saves ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">Parate</div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-black text-red-400">{stats.goals_conceded ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">Gol subiti</div>
            </div>
            <div className="text-center p-3 bg-gray-800 rounded-lg">
              <div className="text-2xl font-black text-emerald-400">{stats.clean_sheets ?? 0}</div>
              <div className="text-xs text-gray-400 mt-1">Clean sheets</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
