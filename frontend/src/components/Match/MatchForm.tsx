import { useState } from 'react';
import { CreateMatchForm } from '../../types';
import Button from '../UI/Button';
import { useTeams } from '../../hooks/useTeams';
import { format } from 'date-fns';

interface MatchFormProps {
  onSubmit: (data: CreateMatchForm) => void;
  loading?: boolean;
  onCancel?: () => void;
}

export default function MatchForm({ onSubmit, loading, onCancel }: MatchFormProps) {
  const { data: teams = [] } = useTeams();
  const [form, setForm] = useState<CreateMatchForm>({
    home_team_id: 0,
    away_team_id: 0,
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    venue: '',
    competition: '',
    season: '2024-25',
    matchday: undefined,
  });

  const set = (k: keyof CreateMatchForm, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.home_team_id || !form.away_team_id) return;
    if (form.home_team_id === form.away_team_id) {
      alert('Le due squadre devono essere diverse!');
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Squadra di casa *</label>
          <select
            className="input-field"
            value={form.home_team_id || ''}
            onChange={(e) => set('home_team_id', Number(e.target.value))}
            required
          >
            <option value="">Seleziona...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Squadra ospite *</label>
          <select
            className="input-field"
            value={form.away_team_id || ''}
            onChange={(e) => set('away_team_id', Number(e.target.value))}
            required
          >
            <option value="">Seleziona...</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Data e ora *</label>
          <input
            type="datetime-local"
            className="input-field"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Stadio / Venue</label>
          <input
            className="input-field"
            placeholder="es. Stadio San Siro"
            value={form.venue ?? ''}
            onChange={(e) => set('venue', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Competizione</label>
          <input
            className="input-field"
            placeholder="es. Serie A"
            value={form.competition ?? ''}
            onChange={(e) => set('competition', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Stagione</label>
          <input
            className="input-field"
            placeholder="es. 2024-25"
            value={form.season ?? ''}
            onChange={(e) => set('season', e.target.value)}
          />
        </div>
        <div>
          <label className="label">Giornata</label>
          <input
            type="number"
            className="input-field"
            min={1}
            value={form.matchday ?? ''}
            onChange={(e) => set('matchday', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={loading} className="flex-1">
          Crea Partita
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
