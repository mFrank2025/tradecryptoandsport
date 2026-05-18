import { useState } from 'react';
import { Calendar, Plus, Filter, Radio } from 'lucide-react';
import { useMatches, useCreateMatch } from '../../hooks/useMatches';
import MatchCard from '../../components/Match/MatchCard';
import MatchForm from '../../components/Match/MatchForm';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import { FullPageSpinner } from '../../components/UI/Spinner';
import { CreateMatchForm } from '../../types';

const STATUS_OPTIONS = [
  { value: '', label: 'Tutte' },
  { value: 'live', label: 'In corso' },
  { value: 'scheduled', label: 'Programmate' },
  { value: 'finished', label: 'Terminate' },
  { value: 'halftime', label: 'Intervallo' },
];

export default function MatchesList() {
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const { data: matches = [], isLoading } = useMatches({
    status: statusFilter || undefined,
  });
  const createMatch = useCreateMatch();

  const handleCreate = (data: CreateMatchForm) => {
    createMatch.mutate(data, { onSuccess: () => setShowCreate(false) });
  };

  const liveMatches = matches.filter((m) => m.status === 'live' || m.status === 'halftime');
  const otherMatches = matches.filter((m) => m.status !== 'live' && m.status !== 'halftime');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Partite</h2>
          <p className="text-gray-400 text-sm">{matches.length} partite trovate</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          Nuova Partita
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {STATUS_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === value
                ? value === 'live' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            {value === 'live' && <Radio className="w-3 h-3 inline mr-1 animate-pulse" />}
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <FullPageSpinner />
      ) : matches.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nessuna partita trovata"
          description="Crea la prima partita per iniziare ad analizzare i dati"
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
              Nuova Partita
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Live section */}
          {liveMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-red-400 uppercase">In corso ora</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {liveMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}

          {/* Other matches */}
          {otherMatches.length > 0 && (
            <div>
              {liveMatches.length > 0 && (
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">Altre partite</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuova Partita">
        <MatchForm
          onSubmit={handleCreate}
          loading={createMatch.isPending}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
