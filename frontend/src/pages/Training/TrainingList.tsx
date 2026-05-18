import { useState } from 'react';
import { Dumbbell, Plus, Calendar, Clock, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingApi, CreateTrainingPayload } from '../../api/training';
import { useTeams } from '../../hooks/useTeams';
import { TrainingSession } from '../../types';
import Card from '../../components/UI/Card';
import Button from '../../components/UI/Button';
import Modal from '../../components/UI/Modal';
import EmptyState from '../../components/UI/EmptyState';
import Badge from '../../components/UI/Badge';
import { FullPageSpinner } from '../../components/UI/Spinner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

const TRAINING_TYPES = [
  { value: 'technical', label: 'Tecnica', color: 'blue' },
  { value: 'tactical', label: 'Tattica', color: 'purple' },
  { value: 'physical', label: 'Fisico', color: 'orange' },
  { value: 'recovery', label: 'Recupero', color: 'emerald' },
  { value: 'match_simulation', label: 'Simulazione', color: 'red' },
  { value: 'set_pieces', label: 'Calci piazzati', color: 'yellow' },
  { value: 'goalkeeper', label: 'Portieri', color: 'gray' },
  { value: 'strength', label: 'Forza', color: 'orange' },
] as const;

const INTENSITIES = [
  { value: 'low', label: 'Bassa' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'maximum', label: 'Massima' },
];

function TrainingCard({ session }: { session: TrainingSession }) {
  const typeInfo = TRAINING_TYPES.find((t) => t.value === session.type);
  return (
    <Link to={`/training/${session.id}`}>
      <Card className="hover:border-gray-700 transition-colors cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <Badge variant={(typeInfo?.color ?? 'gray') as Parameters<typeof Badge>[0]['variant']}>
            {typeInfo?.label ?? session.type}
          </Badge>
          {session.intensity && (
            <span className="text-xs text-gray-500">{INTENSITIES.find((i) => i.value === session.intensity)?.label ?? session.intensity}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Calendar className="w-3.5 h-3.5" />
          {format(new Date(session.date), 'd MMMM yyyy', { locale: it })}
        </div>
        {session.team?.name && (
          <div className="text-sm font-medium text-white mb-2">{session.team.name}</div>
        )}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {session.duration_minutes} min
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {session.attendance_count ?? session.players_attended.length} giocatori
          </div>
        </div>
        {session.focus_topics && session.focus_topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {session.focus_topics.slice(0, 3).map((topic, i) => (
              <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{topic}</span>
            ))}
          </div>
        )}
      </Card>
    </Link>
  );
}

function TrainingForm({ onSubmit, loading, onCancel }: {
  onSubmit: (data: CreateTrainingPayload) => void;
  loading?: boolean;
  onCancel?: () => void;
}) {
  const { data: teams = [] } = useTeams();
  const [form, setForm] = useState<Partial<CreateTrainingPayload>>({
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    type: 'technical',
    duration_minutes: 90,
    intensity: 'medium',
  });

  const set = (k: keyof CreateTrainingPayload, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form as CreateTrainingPayload); }} className="space-y-4">
      <div>
        <label className="label">Squadra *</label>
        <select className="input-field" value={form.team_id ?? ''} onChange={(e) => set('team_id', Number(e.target.value))} required>
          <option value="">Seleziona squadra</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Data e ora *</label>
          <input type="datetime-local" className="input-field" value={form.date ?? ''} onChange={(e) => set('date', e.target.value)} required />
        </div>
        <div>
          <label className="label">Durata (minuti)</label>
          <input type="number" className="input-field" min={15} value={form.duration_minutes ?? 90} onChange={(e) => set('duration_minutes', Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Tipo allenamento</label>
          <select className="input-field" value={form.type ?? 'technical'} onChange={(e) => set('type', e.target.value)}>
            {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Intensità</label>
          <select className="input-field" value={form.intensity ?? 'medium'} onChange={(e) => set('intensity', e.target.value)}>
            {INTENSITIES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="label">Luogo</label>
        <input className="input-field" placeholder="es. Campo Principale" value={form.location ?? ''} onChange={(e) => set('location', e.target.value)} />
      </div>
      <div>
        <label className="label">Allenatore</label>
        <input className="input-field" value={form.coach ?? ''} onChange={(e) => set('coach', e.target.value)} />
      </div>
      <div>
        <label className="label">Note</label>
        <textarea className="input-field h-20 resize-none" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={loading} className="flex-1">Crea Sessione</Button>
        {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>Annulla</Button>}
      </div>
    </form>
  );
}

export default function TrainingList() {
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['training'],
    queryFn: () => trainingApi.getAll(),
  });

  const createSession = useMutation({
    mutationFn: (data: CreateTrainingPayload) => trainingApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training'] });
      toast.success('Sessione creata!');
      setShowCreate(false);
    },
    onError: () => toast.error('Errore nella creazione'),
  });

  if (isLoading) return <FullPageSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Allenamenti</h2>
          <p className="text-gray-400 text-sm">{sessions.length} sessioni registrate</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
          Nuova Sessione
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Nessun allenamento registrato"
          description="Inizia a tracciare le sessioni di allenamento della squadra"
          action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nuova Sessione</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <TrainingCard key={session.id} session={session} />
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nuova Sessione di Allenamento" size="lg">
        <TrainingForm
          onSubmit={(data) => createSession.mutate(data)}
          loading={createSession.isPending}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
