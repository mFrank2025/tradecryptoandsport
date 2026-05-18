import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Users, Calendar, Dumbbell, MapPin, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { trainingApi } from '../../api/training';
import Card, { CardHeader, CardTitle } from '../../components/UI/Card';
import Badge from '../../components/UI/Badge';
import { FullPageSpinner } from '../../components/UI/Spinner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const INTENSITY_COLORS = {
  low: 'emerald',
  medium: 'yellow',
  high: 'orange',
  maximum: 'red',
} as const;

const TRAINING_TYPE_LABELS: Record<string, string> = {
  technical: 'Tecnica',
  tactical: 'Tattica',
  physical: 'Fisico',
  recovery: 'Recupero',
  match_simulation: 'Simulazione Partita',
  set_pieces: 'Calci Piazzati',
  goalkeeper: 'Portieri',
  strength: 'Forza',
};

export default function TrainingDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading } = useQuery({
    queryKey: ['training', Number(id)],
    queryFn: () => trainingApi.getById(Number(id)),
  });

  if (isLoading) return <FullPageSpinner />;
  if (!session) return (
    <div className="text-center py-16">
      <p className="text-gray-400">Sessione non trovata</p>
      <Link to="/training" className="text-emerald-400 mt-2 inline-block">← Torna agli allenamenti</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link to="/training" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" />
        Allenamenti
      </Link>

      {/* Header card */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge variant="blue" className="mb-2">
              {TRAINING_TYPE_LABELS[session.type] ?? session.type}
            </Badge>
            <h2 className="text-2xl font-bold text-white mt-1">
              Sessione del {format(new Date(session.date), 'd MMMM yyyy', { locale: it })}
            </h2>
            {session.team?.name && (
              <div className="text-gray-400 mt-1">{session.team.name}</div>
            )}
          </div>
          {session.intensity && (
            <Badge variant={INTENSITY_COLORS[session.intensity] ?? 'gray'}>
              Intensità: {session.intensity === 'low' ? 'Bassa' :
                         session.intensity === 'medium' ? 'Media' :
                         session.intensity === 'high' ? 'Alta' : 'Massima'}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4 text-gray-500" />
            {format(new Date(session.date), 'HH:mm')}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4 text-gray-500" />
            {session.duration_minutes} minuti
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4 text-gray-500" />
            {session.attendance_count ?? session.players_attended.length} presenti
          </div>
          {session.location && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-gray-500" />
              {session.location}
            </div>
          )}
          {session.coach && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <User className="w-4 h-4 text-gray-500" />
              {session.coach}
            </div>
          )}
        </div>

        {session.focus_topics && session.focus_topics.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-400 mb-2">Argomenti focus:</div>
            <div className="flex flex-wrap gap-2">
              {session.focus_topics.map((topic, i) => (
                <span key={i} className="text-sm bg-gray-800 text-gray-300 px-3 py-1 rounded-lg">{topic}</span>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Drills */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-orange-400" />
                Esercizi ({session.drills.length})
              </div>
            </CardTitle>
          </CardHeader>
          {session.drills.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Nessun esercizio registrato</p>
          ) : (
            <div className="space-y-3">
              {session.drills.map((drill, i) => (
                <div key={i} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="font-medium text-white text-sm">{drill.name}</div>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {drill.duration_minutes} min
                    </span>
                  </div>
                  {drill.description && (
                    <p className="text-xs text-gray-400 mt-1">{drill.description}</p>
                  )}
                  {drill.focus_area && (
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded mt-1 inline-block">
                      {drill.focus_area}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Note della Sessione</CardTitle>
          </CardHeader>
          {session.notes ? (
            <p className="text-sm text-gray-300 leading-relaxed">{session.notes}</p>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">Nessuna nota</p>
          )}

          {/* Duration breakdown */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="text-sm font-medium text-gray-400 mb-3">Ripartizione tempo:</div>
            {session.drills.length > 0 ? (
              <div className="space-y-2">
                {session.drills.map((drill, i) => {
                  const pct = Math.round((drill.duration_minutes / session.duration_minutes) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-400 truncate">{drill.name}</span>
                        <span className="text-gray-500">{drill.duration_minutes} min ({pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-600">Aggiungi esercizi per vedere la ripartizione</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
