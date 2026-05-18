import { CompareBar } from './StatBar';
import Card, { CardHeader, CardTitle } from '../UI/Card';

interface TeamStats {
  shots?: number;
  shots_on_target?: number;
  possession?: number;
  corners?: number;
  fouls?: number;
  yellow_cards?: number;
  red_cards?: number;
  offsides?: number;
  passes?: number;
  tackles?: number;
  interceptions?: number;
}

interface TeamStatsPanelProps {
  homeTeamName: string;
  awayTeamName: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
}

export default function TeamStatsPanel({ homeTeamName, awayTeamName, homeStats, awayStats }: TeamStatsPanelProps) {
  const stats: { label: string; home: number; away: number; suffix?: string }[] = [
    { label: 'Tiri', home: homeStats.shots ?? 0, away: awayStats.shots ?? 0 },
    { label: 'Tiri in porta', home: homeStats.shots_on_target ?? 0, away: awayStats.shots_on_target ?? 0 },
    { label: 'Possesso %', home: homeStats.possession ?? 50, away: awayStats.possession ?? 50, suffix: '%' },
    { label: 'Calci d\'angolo', home: homeStats.corners ?? 0, away: awayStats.corners ?? 0 },
    { label: 'Falli', home: homeStats.fouls ?? 0, away: awayStats.fouls ?? 0 },
    { label: 'Ammonizioni', home: homeStats.yellow_cards ?? 0, away: awayStats.yellow_cards ?? 0 },
    { label: 'Espulsioni', home: homeStats.red_cards ?? 0, away: awayStats.red_cards ?? 0 },
    { label: 'Fuorigioco', home: homeStats.offsides ?? 0, away: awayStats.offsides ?? 0 },
    { label: 'Passaggi', home: homeStats.passes ?? 0, away: awayStats.passes ?? 0 },
    { label: 'Contrasti', home: homeStats.tackles ?? 0, away: awayStats.tackles ?? 0 },
    { label: 'Intercettazioni', home: homeStats.interceptions ?? 0, away: awayStats.interceptions ?? 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistiche Partita</CardTitle>
      </CardHeader>
      {/* Team headers */}
      <div className="flex justify-between mb-4 text-sm font-semibold">
        <span className="text-emerald-400">{homeTeamName}</span>
        <span className="text-red-400">{awayTeamName}</span>
      </div>
      {/* Stats */}
      <div className="space-y-3">
        {stats.map((s) => (
          <CompareBar
            key={s.label}
            label={s.label}
            homeValue={s.home}
            awayValue={s.away}
            suffix={s.suffix}
          />
        ))}
      </div>
    </Card>
  );
}
