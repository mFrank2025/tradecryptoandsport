import { Link } from 'react-router-dom';
import { User, ChevronRight } from 'lucide-react';
import { Player } from '../../types';
import { PositionBadge } from '../UI/Badge';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
}

export default function PlayerCard({ player, onClick, selected }: PlayerCardProps) {
  const content = (
    <div
      className={`
        bg-gray-900 border rounded-xl p-4 hover:border-gray-700 transition-all cursor-pointer
        ${selected ? 'border-emerald-500 bg-emerald-900/10' : 'border-gray-800'}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.full_name ?? player.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-6 h-6 text-gray-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white truncate">
              {player.jersey_number && (
                <span className="text-gray-500 mr-1">#{player.jersey_number}</span>
              )}
              {player.full_name ?? `${player.name} ${player.surname}`}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <PositionBadge position={player.position} />
            {player.age && <span className="text-xs text-gray-500">{player.age} anni</span>}
            {player.team?.name && (
              <span className="text-xs text-gray-500 truncate">{player.team.name}</span>
            )}
          </div>
        </div>

        {!onClick && <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />}
      </div>
    </div>
  );

  if (onClick) return content;
  return <Link to={`/players/${player.id}`}>{content}</Link>;
}
