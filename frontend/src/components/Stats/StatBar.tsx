interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
  showPercent?: boolean;
  suffix?: string;
}

export default function StatBar({
  label,
  value,
  max = 100,
  color = 'bg-emerald-500',
  showPercent = false,
  suffix = '',
}: StatBarProps) {
  const percent = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm font-semibold text-white">
          {value}{suffix}
          {showPercent && ` (${percent.toFixed(0)}%)`}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

interface CompareBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  suffix?: string;
}

export function CompareBar({ label, homeValue, awayValue, suffix = '' }: CompareBarProps) {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = 100 - homePercent;

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-emerald-400">{homeValue}{suffix}</span>
        <span className="text-gray-400 text-xs">{label}</span>
        <span className="font-semibold text-red-400">{awayValue}{suffix}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 rounded-l-full transition-all duration-500"
          style={{ width: `${homePercent}%` }}
        />
        <div
          className="bg-red-500 rounded-r-full transition-all duration-500"
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
}
