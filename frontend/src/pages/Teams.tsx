import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2, Users, Trophy } from 'lucide-react';
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from '../hooks/useTeams';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Modal from '../components/UI/Modal';
import EmptyState from '../components/UI/EmptyState';
import { FullPageSpinner } from '../components/UI/Spinner';
import { Team } from '../types';
import { CreateTeamPayload } from '../api/teams';

interface TeamFormData extends CreateTeamPayload {}

function TeamForm({
  initial,
  onSubmit,
  loading,
  onCancel,
}: {
  initial?: Partial<TeamFormData>;
  onSubmit: (data: TeamFormData) => void;
  loading?: boolean;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState<TeamFormData>({
    name: initial?.name ?? '',
    short_name: initial?.short_name ?? '',
    city: initial?.city ?? '',
    founded_year: initial?.founded_year,
    colors: initial?.colors ?? '',
    sport: initial?.sport ?? 'football',
    coach_name: initial?.coach_name ?? '',
    stadium: initial?.stadium ?? '',
  });

  const set = (k: keyof TeamFormData, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Nome squadra *</label>
          <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Abbreviazione</label>
          <input className="input-field" maxLength={5} value={form.short_name ?? ''} onChange={(e) => set('short_name', e.target.value)} placeholder="es. MIL" />
        </div>
        <div>
          <label className="label">Città</label>
          <input className="input-field" value={form.city ?? ''} onChange={(e) => set('city', e.target.value)} />
        </div>
        <div>
          <label className="label">Anno fondazione</label>
          <input type="number" className="input-field" value={form.founded_year ?? ''} onChange={(e) => set('founded_year', e.target.value ? Number(e.target.value) : undefined)} placeholder="es. 1899" />
        </div>
        <div>
          <label className="label">Colori sociali</label>
          <input className="input-field" value={form.colors ?? ''} onChange={(e) => set('colors', e.target.value)} placeholder="es. Rosso e Nero" />
        </div>
        <div>
          <label className="label">Allenatore</label>
          <input className="input-field" value={form.coach_name ?? ''} onChange={(e) => set('coach_name', e.target.value)} />
        </div>
        <div>
          <label className="label">Stadio</label>
          <input className="input-field" value={form.stadium ?? ''} onChange={(e) => set('stadium', e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="submit" loading={loading} className="flex-1">
          {initial?.name ? 'Aggiorna Squadra' : 'Crea Squadra'}
        </Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>}
      </div>
    </form>
  );
}

export default function Teams() {
  const { data: teams = [], isLoading } = useTeams();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();

  const [showCreate, setShowCreate] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);

  const handleCreate = (data: TeamFormData) => {
    createTeam.mutate(data, { onSuccess: () => setShowCreate(false) });
  };

  const handleUpdate = (data: TeamFormData) => {
    if (!editTeam) return;
    updateTeam.mutate({ id: editTeam.id, data }, { onSuccess: () => setEditTeam(null) });
  };

  const handleDelete = (team: Team) => {
    if (confirm(`Eliminare la squadra "${team.name}"?`)) {
      deleteTeam.mutate(team.id);
    }
  };

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Squadre</h2>
          <p className="text-gray-400 text-sm">{teams.length} squadre registrate</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          Nuova Squadra
        </Button>
      </div>

      {teams.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Nessuna squadra"
          description="Crea la tua prima squadra per iniziare ad analizzare le partite"
          action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Crea Squadra</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-gray-800 border border-gray-700 rounded-xl flex items-center justify-center text-xl font-black text-emerald-400">
                  {team.short_name?.[0] ?? team.name[0]}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditTeam(team)}
                    className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(team)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white">{team.name}</h3>
              {team.short_name && <div className="text-sm text-emerald-400 font-semibold">{team.short_name}</div>}

              <div className="mt-3 space-y-1">
                {team.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>📍</span> {team.city}
                    {team.founded_year && <span className="text-gray-600">· {team.founded_year}</span>}
                  </div>
                )}
                {team.coach_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-3.5 h-3.5" /> {team.coach_name}
                  </div>
                )}
                {team.stadium && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Trophy className="w-3.5 h-3.5" /> {team.stadium}
                  </div>
                )}
                {team.colors && (
                  <div className="text-sm text-gray-500">Colori: {team.colors}</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuova Squadra">
        <TeamForm onSubmit={handleCreate} loading={createTeam.isPending} onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTeam} onClose={() => setEditTeam(null)} title="Modifica Squadra">
        {editTeam && (
          <TeamForm
            initial={editTeam}
            onSubmit={handleUpdate}
            loading={updateTeam.isPending}
            onCancel={() => setEditTeam(null)}
          />
        )}
      </Modal>
    </div>
  );
}
