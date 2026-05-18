import { EventType } from '../../types';

interface EventButton {
  type: EventType;
  label: string;
  emoji: string;
  color: string;
}

const EVENT_GROUPS: { group: string; events: EventButton[] }[] = [
  {
    group: 'Gol & Rigori',
    events: [
      { type: 'goal', label: 'Gol', emoji: '⚽', color: 'bg-emerald-600 hover:bg-emerald-500' },
      { type: 'own_goal', label: 'Autogol', emoji: '😬', color: 'bg-red-600 hover:bg-red-500' },
      { type: 'penalty_goal', label: 'Rigore Gol', emoji: '✅', color: 'bg-emerald-700 hover:bg-emerald-600' },
      { type: 'penalty_miss', label: 'Rigore Mancato', emoji: '❌', color: 'bg-orange-600 hover:bg-orange-500' },
    ],
  },
  {
    group: 'Cartellini',
    events: [
      { type: 'yellow_card', label: 'Ammonizione', emoji: '🟨', color: 'bg-yellow-600 hover:bg-yellow-500' },
      { type: 'second_yellow', label: '2° Giallo', emoji: '🟨🟥', color: 'bg-orange-600 hover:bg-orange-500' },
      { type: 'red_card', label: 'Espulsione', emoji: '🟥', color: 'bg-red-700 hover:bg-red-600' },
    ],
  },
  {
    group: 'Tiri',
    events: [
      { type: 'shot_on_target', label: 'Tiro in porta', emoji: '🎯', color: 'bg-blue-600 hover:bg-blue-500' },
      { type: 'shot_off_target', label: 'Tiro fuori', emoji: '↗️', color: 'bg-gray-600 hover:bg-gray-500' },
      { type: 'shot_blocked', label: 'Tiro bloccato', emoji: '🛡️', color: 'bg-purple-600 hover:bg-purple-500' },
      { type: 'save', label: 'Parata', emoji: '🧤', color: 'bg-cyan-600 hover:bg-cyan-500' },
    ],
  },
  {
    group: 'Gioco',
    events: [
      { type: 'corner', label: 'Corner', emoji: '🚩', color: 'bg-pink-600 hover:bg-pink-500' },
      { type: 'free_kick', label: 'Punizione', emoji: '⚡', color: 'bg-amber-600 hover:bg-amber-500' },
      { type: 'offside', label: 'Fuorigioco', emoji: '🏳️', color: 'bg-gray-600 hover:bg-gray-500' },
      { type: 'foul', label: 'Fallo', emoji: '⚠️', color: 'bg-orange-600 hover:bg-orange-500' },
    ],
  },
  {
    group: 'Difesa',
    events: [
      { type: 'tackle', label: 'Contrasto', emoji: '🦵', color: 'bg-lime-600 hover:bg-lime-500' },
      { type: 'interception', label: 'Intercettazione', emoji: '✋', color: 'bg-violet-600 hover:bg-violet-500' },
      { type: 'clearance', label: 'Rinvio', emoji: '💨', color: 'bg-gray-600 hover:bg-gray-500' },
      { type: 'header', label: 'Colpo di testa', emoji: '🤸', color: 'bg-indigo-600 hover:bg-indigo-500' },
    ],
  },
  {
    group: 'Altro',
    events: [
      { type: 'substitution', label: 'Sostituzione', emoji: '🔄', color: 'bg-teal-600 hover:bg-teal-500' },
      { type: 'injury', label: 'Infortunio', emoji: '🏥', color: 'bg-red-800 hover:bg-red-700' },
      { type: 'var_check', label: 'VAR', emoji: '📺', color: 'bg-gray-700 hover:bg-gray-600' },
      { type: 'pass_key', label: 'Passaggio chiave', emoji: '🎖️', color: 'bg-blue-700 hover:bg-blue-600' },
    ],
  },
];

interface EventLoggerProps {
  onEventClick: (type: EventType) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function EventLogger({ onEventClick, disabled, compact = false }: EventLoggerProps) {
  return (
    <div className="space-y-3">
      {EVENT_GROUPS.map((group) => (
        <div key={group.group}>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{group.group}</div>
          <div className={`grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-4 md:grid-cols-2 lg:grid-cols-4'}`}>
            {group.events.map((btn) => (
              <button
                key={btn.type}
                onClick={() => onEventClick(btn.type)}
                disabled={disabled}
                className={`
                  ${btn.color}
                  text-white font-medium rounded-lg px-2 py-2
                  flex items-center gap-1.5 transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed
                  text-xs active:scale-95
                `}
              >
                <span className="text-sm flex-shrink-0">{btn.emoji}</span>
                <span className="truncate">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
