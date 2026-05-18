import { MatchEvent } from '../../types';

interface PitchViewProps {
  events?: MatchEvent[];
  homeTeamId?: number;
  onPitchClick?: (x: number, y: number) => void;
  showLastN?: number;
  height?: number;
  interactive?: boolean;
}

const EVENT_STYLES: Record<string, { color: string; emoji: string }> = {
  goal: { color: '#10b981', emoji: '⚽' },
  own_goal: { color: '#ef4444', emoji: '⚽' },
  penalty_goal: { color: '#10b981', emoji: '⚽' },
  penalty_miss: { color: '#f97316', emoji: '❌' },
  yellow_card: { color: '#eab308', emoji: '🟨' },
  red_card: { color: '#ef4444', emoji: '🟥' },
  shot_on_target: { color: '#3b82f6', emoji: '🎯' },
  shot_off_target: { color: '#6b7280', emoji: '↗️' },
  shot_blocked: { color: '#8b5cf6', emoji: '🚫' },
  corner: { color: '#ec4899', emoji: '🚩' },
  foul: { color: '#f97316', emoji: '⚠️' },
  save: { color: '#06b6d4', emoji: '🧤' },
  tackle: { color: '#84cc16', emoji: '🦵' },
  interception: { color: '#a78bfa', emoji: '✋' },
  free_kick: { color: '#fbbf24', emoji: '⚡' },
  offside: { color: '#fb923c', emoji: '🚩' },
  substitution: { color: '#22d3ee', emoji: '🔄' },
};

export default function PitchView({
  events = [],
  homeTeamId,
  onPitchClick,
  showLastN = 10,
  height = 320,
  interactive = false,
}: PitchViewProps) {
  const W = 600;
  const H = height;
  const PAD = 15;
  const PW = W - PAD * 2;
  const PH = H - PAD * 2;

  const positionedEvents = events
    .filter((e) => e.x_position !== undefined && e.y_position !== undefined)
    .slice(-showLastN);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onPitchClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const svgY = ((e.clientY - rect.top) / rect.height) * H;
    const pitchX = Math.max(0, Math.min(100, ((svgX - PAD) / PW) * 100));
    const pitchY = Math.max(0, Math.min(100, ((svgY - PAD) / PH) * 100));
    onPitchClick(Math.round(pitchX), Math.round(pitchY));
  };

  return (
    <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className={`w-full ${interactive ? 'cursor-crosshair' : ''}`}
        onClick={handleSvgClick}
      >
        {/* Grass background */}
        <rect width={W} height={H} fill="#166534" />
        {/* Grass stripes */}
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect key={i} x={PAD + (i * PW / 8)} y={PAD} width={PW / 8} height={PH}
            fill={i % 2 === 0 ? '#15803d' : '#166534'} />
        ))}

        {/* Pitch outline */}
        <rect x={PAD} y={PAD} width={PW} height={PH} fill="none" stroke="#4ade80" strokeWidth="2" />

        {/* Halfway line */}
        <line x1={PAD + PW / 2} y1={PAD} x2={PAD + PW / 2} y2={PAD + PH} stroke="#4ade80" strokeWidth="1.5" />

        {/* Center circle */}
        <circle cx={PAD + PW / 2} cy={PAD + PH / 2} r={PH * 0.18} fill="none" stroke="#4ade80" strokeWidth="1.5" />
        <circle cx={PAD + PW / 2} cy={PAD + PH / 2} r={3} fill="#4ade80" />

        {/* Left penalty area */}
        <rect x={PAD} y={PAD + PH * 0.2} width={PW * 0.17} height={PH * 0.6} fill="none" stroke="#4ade80" strokeWidth="1.5" />
        {/* Left 6-yard box */}
        <rect x={PAD} y={PAD + PH * 0.35} width={PW * 0.065} height={PH * 0.3} fill="none" stroke="#4ade80" strokeWidth="1" />
        {/* Left goal */}
        <rect x={PAD - 10} y={PAD + PH * 0.4} width={10} height={PH * 0.2} fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
        {/* Left penalty spot */}
        <circle cx={PAD + PW * 0.12} cy={PAD + PH / 2} r={3} fill="#4ade80" />
        {/* Left penalty arc */}
        <path
          d={`M ${PAD + PW * 0.17} ${PAD + PH * 0.34} Q ${PAD + PW * 0.22} ${PAD + PH * 0.5} ${PAD + PW * 0.17} ${PAD + PH * 0.66}`}
          fill="none" stroke="#4ade80" strokeWidth="1.5"
        />

        {/* Right penalty area */}
        <rect x={PAD + PW * 0.83} y={PAD + PH * 0.2} width={PW * 0.17} height={PH * 0.6} fill="none" stroke="#4ade80" strokeWidth="1.5" />
        {/* Right 6-yard box */}
        <rect x={PAD + PW * 0.935} y={PAD + PH * 0.35} width={PW * 0.065} height={PH * 0.3} fill="none" stroke="#4ade80" strokeWidth="1" />
        {/* Right goal */}
        <rect x={PAD + PW} y={PAD + PH * 0.4} width={10} height={PH * 0.2} fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
        {/* Right penalty spot */}
        <circle cx={PAD + PW * 0.88} cy={PAD + PH / 2} r={3} fill="#4ade80" />
        {/* Right penalty arc */}
        <path
          d={`M ${PAD + PW * 0.83} ${PAD + PH * 0.34} Q ${PAD + PW * 0.78} ${PAD + PH * 0.5} ${PAD + PW * 0.83} ${PAD + PH * 0.66}`}
          fill="none" stroke="#4ade80" strokeWidth="1.5"
        />

        {/* Corner arcs */}
        {[
          { cx: PAD, cy: PAD, sweep: 1 },
          { cx: PAD + PW, cy: PAD, sweep: 0 },
          { cx: PAD, cy: PAD + PH, sweep: 0 },
          { cx: PAD + PW, cy: PAD + PH, sweep: 1 },
        ].map(({ cx, cy, sweep }, i) => {
          const dx = i < 2 ? 8 : -8;
          const dy = i % 2 === 0 ? 8 : -8;
          return (
            <path
              key={i}
              d={`M ${cx + dx} ${cy} A 8 8 0 0 ${sweep} ${cx} ${cy + dy}`}
              fill="none" stroke="#4ade80" strokeWidth="1"
            />
          );
        })}

        {/* Event dots */}
        {positionedEvents.map((event, idx) => {
          const x = PAD + (event.x_position! / 100) * PW;
          const y = PAD + (event.y_position! / 100) * PH;
          const style = EVENT_STYLES[event.type] ?? { color: '#ffffff', emoji: '●' };
          const isHome = homeTeamId ? event.team_id === homeTeamId : true;
          const opacity = 0.5 + (idx / positionedEvents.length) * 0.5;

          return (
            <g key={event.id} opacity={opacity}>
              {/* Glow ring */}
              <circle cx={x} cy={y} r="12" fill={style.color} fillOpacity="0.2" />
              {/* Main dot */}
              <circle cx={x} cy={y} r="6" fill={style.color} stroke="white" strokeWidth="1.5" />
              {/* Team indicator */}
              <circle
                cx={x + 6}
                cy={y - 6}
                r="4"
                fill={isHome ? '#10b981' : '#ef4444'}
                stroke="#030712"
                strokeWidth="1"
              />
              {/* Minute label */}
              <text x={x} y={y - 14} fill="white" fontSize="9" textAnchor="middle" fontWeight="bold">
                {event.minute}'
              </text>
            </g>
          );
        })}

        {/* Interactive click hint */}
        {interactive && (
          <text x={W / 2} y={H - 5} fill="#4ade8060" fontSize="10" textAnchor="middle">
            Clicca per posizionare l'evento
          </text>
        )}
      </svg>

      {/* Legend */}
      {positionedEvents.length > 0 && (
        <div className="bg-gray-900 px-3 py-2 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs text-gray-500 flex-shrink-0">Legenda:</span>
          {Object.entries(EVENT_STYLES).slice(0, 6).map(([type, style]) => (
            <div key={type} className="flex items-center gap-1 flex-shrink-0">
              <div className="w-3 h-3 rounded-full" style={{ background: style.color }} />
              <span className="text-xs text-gray-400">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
