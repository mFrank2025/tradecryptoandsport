import { useState } from 'react';
import { Users, Plus, Search, Filter } from 'lucide-react';
import { usePlayers, useCreatePlayer } from '../../hooks/usePlayers';
import PlayerCard from '../../components/Players/PlayerCard';
import PlayerForm from '../../components/Players/PlayerForm';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import { FullPageSpinner } from '../../components/UI/Spinner';
import { CreatePlayerForm, PlayerPosition } from '../../types';
import { useTeams } from '../../hooks/useTeams';

const POSITIONS: (PlayerPosition | '')[] = ['', 'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'];

export default function PlayersList() {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState<PlayerPosition | ''>('');
  const [teamFilter, setTeamFilter] = useState<number | undefined>();

  const { data: players = [], isLoading } = usePlayers({
    search: search || undefined,
    position: positionFilter || undefined,
    team_id: teamFilter,
  });
  const { data: teams = [] } = useTeams();
  const createPlayer = useCreatePlayer();

  const handleCreate = (data: CreatePlayerForm) => {
    createPlayer.mutate(data, { onSuccess: () => setShowCreate(false) });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Giocatori</h2>
          <p className="text-gray-400 text-sm">{players.length} giocatori</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          Aggiungi Giocatore
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="input-field pl-9"
            placeholder="Cerca giocatore..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Position filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            className="input-field pl-9 pr-8 w-auto"
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value as PlayerPosition | '')}
          >
            <option value="">Tutte le posizioni</option>
            {POSITIONS.filter(Boolean).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Team filter */}
        <select
          className="input-field w-auto"
          value={teamFilter ?? ''}
          onChange={(e) => setTeamFilter(e.target.value ? Number(e.target.value) : undefined)}
        >
          <option value="">Tutte le squadre</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {/* Players grid */}
      {isLoading ? (
        <FullPageSpinner />
      ) : players.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nessun giocatore trovato"
          description={search || positionFilter ? 'Modifica i filtri di ricerca' : 'Aggiungi il primo giocatore alla rosa'}
          action={
            !search && !positionFilter ? (
              <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                Aggiungi Giocatore
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Aggiungi Giocatore">
        <PlayerForm
          onSubmit={handleCreate}
          loading={createPlayer.isPending}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
