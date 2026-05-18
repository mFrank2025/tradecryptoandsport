import { useState } from 'react';
import { MatchPlayer, Player } from '../../types';
import { PositionBadge } from '../UI/Badge';
import { User, Plus, X } from 'lucide-react';
import Button from '../UI/Button';

interface LineupEditorProps {
  homeTeamId: number;
  awayTeamId: number;
  homeLineup: MatchPlayer[];
  awayLineup: MatchPlayer[];
  homePlayers: Player[];
  awayPlayers: Player[];
  onAddPlayer: (teamId: number, playerId: number, isStarter: boolean) => void;
  onRemovePlayer: (matchPlayerId: number) => void;
}

export default function LineupEditor({
  homeTeamId,
  awayTeamId,
  homeLineup,
  awayLineup,
  homePlayers,
  awayPlayers,
  onAddPlayer,
  onRemovePlayer,
}: LineupEditorProps) {
  const [activeTeam, setActiveTeam] = useState<'home' | 'away'>('home');

  const lineup = activeTeam === 'home' ? homeLineup : awayLineup;
  const players = activeTeam === 'home' ? homePlayers : awayPlayers;
  const teamId = activeTeam === 'home' ? homeTeamId : awayTeamId;

  const lineupPlayerIds = new Set(lineup.map((lp) => lp.player_id));
  const starters = lineup.filter((lp) => lp.is_starter);
  const substitutes = lineup.filter((lp) => !lp.is_starter);

  const availablePlayers = players.filter((p) => !lineupPlayerIds.has(p.id));

  return (
    <div>
      {/* Team selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTeam('home')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTeam === 'home' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Casa ({homeLineup.length})
        </button>
        <button
          onClick={() => setActiveTeam('away')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTeam === 'away' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Ospite ({awayLineup.length})
        </button>
      </div>

      {/* Current lineup */}
      <div className="space-y-3 mb-4">
        <div className="text-xs font-semibold text-gray-500 uppercase">Titolari ({starters.length}/11)</div>
        {starters.map((mp) => (
          <div key={mp.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
            <User className="w-4 h-4 text-gray-500" />
            <span className="flex-1 text-sm text-white">
              {mp.jersey_number && <span className="text-gray-500 mr-1">#{mp.jersey_number}</span>}
              {mp.player?.full_name ?? mp.player?.name ?? `Giocatore ${mp.player_id}`}
            </span>
            {mp.position_played && <PositionBadge position={mp.position_played} />}
            <button onClick={() => onRemovePlayer(mp.id)} className="text-gray-600 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {substitutes.length > 0 && (
          <>
            <div className="text-xs font-semibold text-gray-500 uppercase">Riserve ({substitutes.length})</div>
            {substitutes.map((mp) => (
              <div key={mp.id} className="flex items-center gap-2 p-2 bg-gray-900 border border-gray-800 rounded-lg opacity-70">
                <User className="w-4 h-4 text-gray-600" />
                <span className="flex-1 text-sm text-gray-300">
                  {mp.player?.full_name ?? `Giocatore ${mp.player_id}`}
                </span>
                {mp.position_played && <PositionBadge position={mp.position_played} />}
                <button onClick={() => onRemovePlayer(mp.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add players */}
      {availablePlayers.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Aggiungi giocatore</div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {availablePlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg">
                <span className="flex-1 text-sm text-gray-300">
                  {player.jersey_number && <span className="text-gray-500 mr-1">#{player.jersey_number}</span>}
                  {player.full_name ?? `${player.name} ${player.surname}`}
                </span>
                <PositionBadge position={player.position} />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus className="w-3 h-3" />}
                  onClick={() => onAddPlayer(teamId, player.id, starters.length < 11)}
                >
                  Titolare
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onAddPlayer(teamId, player.id, false)}
                >
                  Riserva
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
