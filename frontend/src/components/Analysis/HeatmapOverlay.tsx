import { MatchEvent } from '../../types';

interface HeatmapOverlayProps {
  events: MatchEvent[];
  homeTeamId?: number;
  width?: number;
  height?: number;
}

const EVENT_COLORS: Record<string, string> = {
  goal: '#10b981',
  own_goal: '#ef4444',
  penalty_goal: '#10b981',
  yellow_card: '#eab308',
  red_card: '#ef4444',
  shot_on_target: '#3b82f6',
  shot_off_target: '#6b7280',
  corner: '#8b5cf6',
  foul: '#f97316',
  save: '#06b6d4',
  tackle: '#ec4899',
};

export default function HeatmapOverlay({
  events,
  homeTeamId,
  width = 600,
  height = 400,
}: HeatmapOverlayProps) {
  const positionedEvents = events.filter(
    (e) => e.x_position !== undefined && e.y_position !== undefined
  );

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-800">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: '#166534' }}
      >
        {/* Pitch markings */}
        {/* Outline */}
        <rect x="20" y="20" width={width - 40} height={height - 40} fill="none" stroke="#22c55e" strokeWidth="2" />
        {/* Center line */}
        <line x1={width / 2} y1="20" x2={width / 2} y2={height - 20} stroke="#22c55e" strokeWidth="1.5" />
        {/* Center circle */}
        <circle cx={width / 2} cy={height / 2} r="50" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        {/* Center spot */}
        <circle cx={width / 2} cy={height / 2} r="3" fill="#22c55e" />

        {/* Left penalty area */}
        <rect x="20" y={height / 2 - 80} width="110" height="160" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        {/* Left goal area */}
        <rect x="20" y={height / 2 - 35} width="45" height="70" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        {/* Left goal */}
        <rect x="5" y={height / 2 - 20} width="15" height="40" fill="#22c55e" fillOpacity="0.3" stroke="#22c55e" strokeWidth="1.5" />
        {/* Left penalty spot */}
        <circle cx="90" cy={height / 2} r="3" fill="#22c55e" />

        {/* Right penalty area */}
        <rect x={width - 130} y={height / 2 - 80} width="110" height="160" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        {/* Right goal area */}
        <rect x={width - 65} y={height / 2 - 35} width="45" height="70" fill="none" stroke="#22c55e" strokeWidth="1.5" />
        {/* Right goal */}
        <rect x={width - 20} y={height / 2 - 20} width="15" height="40" fill="#22c55e" fillOpacity="0.3" stroke="#22c55e" strokeWidth="1.5" />
        {/* Right penalty spot */}
        <circle cx={width - 90} cy={height / 2} r="3" fill="#22c55e" />

        {/* Heatmap dots */}
        {positionedEvents.map((event) => {
          const x = (event.x_position! / 100) * (width - 40) + 20;
          const y = (event.y_position! / 100) * (height - 40) + 20;
          const color = EVENT_COLORS[event.type] ?? '#ffffff';
          const isHome = homeTeamId ? event.team_id === homeTeamId : true;

          return (
            <g key={event.id}>
              {/* Glow */}
              <circle cx={x} cy={y} r="14" fill={color} fillOpacity="0.15" />
              {/* Dot */}
              <circle cx={x} cy={y} r="6" fill={color} fillOpacity="0.85" />
              {/* Border */}
              <circle cx={x} cy={y} r="6" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
              {/* Minute label */}
              <text
                x={x}
                y={y - 10}
                fill="white"
                fontSize="9"
                textAnchor="middle"
                fontWeight="bold"
                opacity="0.8"
              >
                {event.minute}'
              </text>
              {/* Side indicator */}
              <text
                x={x}
                y={y + 18}
                fill={isHome ? '#10b981' : '#ef4444'}
                fontSize="7"
                textAnchor="middle"
                opacity="0.9"
              >
                {isHome ? 'C' : 'O'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 right-2 bg-black/60 rounded-lg p-2 text-xs">
        <div className="flex flex-wrap gap-2">
          {Object.entries(EVENT_COLORS).slice(0, 6).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-gray-300 capitalize">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
