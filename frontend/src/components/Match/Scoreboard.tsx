import { Clock, Radio } from 'lucide-react';
import { Match } from '../../types';

interface ScoreboardProps {
  match: Match;
  liveMinute?: number;
  compact?: boolean;
}

export default function Scoreboard({ match, liveMinute, compact = false }: ScoreboardProps) {
  const isLive = match.status === 'live';
  const isHalfTime = match.status === 'halftime';
  const minute = liveMinute ?? match.minute ?? 0;

  if (compact) {
    return (
      <div className="flex items-center gap-4 bg-gray-900 rounded-xl px-4 py-2 border border-gray-800">
        <span className="font-bold text-white truncate max-w-24 text-sm">{match.home_team?.name ?? 'Casa'}</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-white">{match.home_score}</span>
          <span className="text-gray-500">-</span>
          <span className="text-2xl font-black text-white">{match.away_score}</span>
        </div>
        <span className="font-bold text-white truncate max-w-24 text-sm text-right">{match.away_team?.name ?? 'Ospite'}</span>
      </div>
    );
  }

  return (
    <div className={`
      bg-gray-900 border rounded-2xl overflow-hidden
      ${isLive ? 'border-red-800/70' : 'border-gray-800'}
    `}>
      {/* Status bar */}
      <div className={`py-2 px-4 flex items-center justify-center gap-2 ${
        isLive ? 'bg-red-600/20' :
        isHalfTime ? 'bg-yellow-600/20' :
        'bg-gray-800'
      }`}>
        {isLive && <Radio className="w-4 h-4 text-red-400 animate-pulse" />}
        <span className={`text-sm font-bold ${
          isLive ? 'text-red-400' :
          isHalfTime ? 'text-yellow-400' :
          'text-gray-400'
        }`}>
          {isLive ? 'IN CORSO' :
           isHalfTime ? 'INTERVALLO' :
           match.status === 'finished' ? 'TERMINATA' :
           match.status === 'scheduled' ? 'PROGRAMMATA' :
           match.status.toUpperCase()}
        </span>
        {(isLive) && (
          <span className="text-sm font-bold text-red-300">{minute}'</span>
        )}
        {match.competition && (
          <span className="ml-2 text-xs text-gray-500">{match.competition}</span>
        )}
      </div>

      {/* Main scoreboard */}
      <div className="p-6 flex items-center justify-between gap-4">
        {/* Home */}
        <div className="flex-1 text-right">
          <div className="text-xl md:text-2xl font-black text-white">
            {match.home_team?.name ?? `Squadra ${match.home_team_id}`}
          </div>
          {match.home_team?.city && (
            <div className="text-sm text-gray-500">{match.home_team.city}</div>
          )}
          <div className="text-xs text-emerald-400 mt-1 font-medium">CASA</div>
        </div>

        {/* Score */}
        <div className="text-center">
          {match.status === 'scheduled' ? (
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 md:gap-4">
              <div className={`text-6xl md:text-8xl font-black ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                {match.home_score}
              </div>
              <div className="text-3xl text-gray-600 font-bold">:</div>
              <div className={`text-6xl md:text-8xl font-black ${isLive ? 'text-red-400' : 'text-white'}`}>
                {match.away_score}
              </div>
            </div>
          )}
          {/* Half time score */}
          {(match.home_score_ht !== undefined || match.away_score_ht !== undefined) && match.status !== 'scheduled' && (
            <div className="text-xs text-gray-500 mt-1">
              (PT: {match.home_score_ht ?? 0} - {match.away_score_ht ?? 0})
            </div>
          )}
        </div>

        {/* Away */}
        <div className="flex-1 text-left">
          <div className="text-xl md:text-2xl font-black text-white">
            {match.away_team?.name ?? `Squadra ${match.away_team_id}`}
          </div>
          {match.away_team?.city && (
            <div className="text-sm text-gray-500">{match.away_team.city}</div>
          )}
          <div className="text-xs text-red-400 mt-1 font-medium">OSPITE</div>
        </div>
      </div>

      {/* Match info */}
      {(match.venue || match.referee) && (
        <div className="px-4 pb-3 flex items-center justify-center gap-4 text-xs text-gray-500">
          {match.venue && <span>📍 {match.venue}</span>}
          {match.referee && <span>👨‍⚖️ {match.referee}</span>}
          {match.attendance && <span>👥 {match.attendance.toLocaleString()}</span>}
        </div>
      )}
    </div>
  );
}
