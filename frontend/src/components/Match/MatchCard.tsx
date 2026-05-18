import { Link } from 'react-router-dom';
import { Calendar, MapPin, ChevronRight, Radio } from 'lucide-react';
import { Match } from '../../types';
import { StatusBadge } from '../UI/Badge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === 'live' || match.status === 'halftime';

  return (
    <Link to={`/matches/${match.id}`}>
      <div className={`
        bg-gray-900 border rounded-xl p-4 hover:border-gray-700 transition-all group
        ${isLive ? 'border-red-800/70' : 'border-gray-800'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusBadge status={match.status} />
            {isLive && match.minute !== undefined && (
              <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                <Radio className="w-3 h-3" />
                {match.minute}'
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
        </div>

        {/* Teams & Score */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex-1">
            <div className="font-bold text-white text-lg truncate">
              {match.home_team?.name ?? `Squadra ${match.home_team_id}`}
            </div>
            {match.home_team?.short_name && (
              <div className="text-xs text-gray-500">{match.home_team.short_name}</div>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center gap-3 px-4">
            {match.status === 'scheduled' ? (
              <span className="text-gray-400 font-medium">vs</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-black ${isLive ? 'text-emerald-400' : 'text-white'}`}>
                  {match.home_score}
                </span>
                <span className="text-gray-500 font-bold">-</span>
                <span className={`text-3xl font-black ${isLive ? 'text-red-400' : 'text-white'}`}>
                  {match.away_score}
                </span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-right">
            <div className="font-bold text-white text-lg truncate">
              {match.away_team?.name ?? `Squadra ${match.away_team_id}`}
            </div>
            {match.away_team?.short_name && (
              <div className="text-xs text-gray-500">{match.away_team.short_name}</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            {format(new Date(match.date), "d MMM yyyy", { locale: it })}
          </div>
          {match.venue && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-32">{match.venue}</span>
            </div>
          )}
          {match.competition && (
            <span className="text-xs text-gray-500">{match.competition}</span>
          )}
        </div>

        {/* Live action button */}
        {isLive && (
          <Link
            to={`/matches/${match.id}/live`}
            onClick={(e) => e.stopPropagation()}
            className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 bg-red-600/20 border border-red-600/40 rounded-lg text-red-400 text-sm font-medium hover:bg-red-600/30 transition-colors"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Vai alla partita LIVE
          </Link>
        )}
      </div>
    </Link>
  );
}
