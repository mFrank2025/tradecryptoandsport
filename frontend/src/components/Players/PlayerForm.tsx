import { useState } from 'react';
import { CreatePlayerForm, PlayerPosition } from '../../types';
import Button from '../UI/Button';
import { useTeams } from '../../hooks/useTeams';

const POSITIONS: PlayerPosition[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST'];

interface PlayerFormProps {
  initial?: Partial<CreatePlayerForm>;
  onSubmit: (data: CreatePlayerForm) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export default function PlayerForm({ initial, onSubmit, loading, onCancel }: PlayerFormProps) {
  const { data: teams = [] } = useTeams();
  const [form, setForm] = useState<CreatePlayerForm>({
    name: initial?.name ?? '',
    surname: initial?.surname ?? '',
    position: initial?.position ?? 'CM',
    date_of_birth: initial?.date_of_birth ?? '',
    nationality: initial?.nationality ?? '',
    jersey_number: initial?.jersey_number,
    team_id: initial?.team_id,
    height_cm: initial?.height_cm,
    weight_kg: initial?.weight_kg,
    preferred_foot: initial?.preferred_foot ?? 'right',
  });

  const set = (k: keyof CreatePlayerForm, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Nome *</label>
          <input className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className="label">Cognome *</label>
          <input className="input-field" value={form.surname} onChange={(e) => set('surname', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Posizione *</label>
          <select className="input-field" value={form.position} onChange={(e) => set('position', e.target.value)}>
            {POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Numero maglia</label>
          <input
            type="number" className="input-field" min={1} max={99}
            value={form.jersey_number ?? ''} onChange={(e) => set('jersey_number', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Data di nascita</label>
          <input type="date" className="input-field" value={form.date_of_birth ?? ''} onChange={(e) => set('date_of_birth', e.target.value)} />
        </div>
        <div>
          <label className="label">Nazionalità</label>
          <input className="input-field" value={form.nationality ?? ''} onChange={(e) => set('nationality', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Squadra</label>
        <select className="input-field" value={form.team_id ?? ''} onChange={(e) => set('team_id', e.target.value ? Number(e.target.value) : undefined)}>
          <option value="">Nessuna squadra</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Altezza (cm)</label>
          <input type="number" className="input-field" value={form.height_cm ?? ''} onChange={(e) => set('height_cm', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div>
          <label className="label">Peso (kg)</label>
          <input type="number" className="input-field" value={form.weight_kg ?? ''} onChange={(e) => set('weight_kg', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
        <div>
          <label className="label">Piede preferito</label>
          <select className="input-field" value={form.preferred_foot ?? 'right'} onChange={(e) => set('preferred_foot', e.target.value)}>
            <option value="right">Destro</option>
            <option value="left">Sinistro</option>
            <option value="both">Entrambi</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          {initial ? 'Aggiorna Giocatore' : 'Crea Giocatore'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Annulla
          </Button>
        )}
      </div>
    </form>
  );
}
