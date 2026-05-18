interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'red' | 'blue' | 'yellow' | 'gray' | 'purple' | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses: Record<string, string> = {
  emerald: 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
  red: 'bg-red-900/50 text-red-400 border-red-800',
  blue: 'bg-blue-900/50 text-blue-400 border-blue-800',
  yellow: 'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  gray: 'bg-gray-800 text-gray-400 border-gray-700',
  purple: 'bg-purple-900/50 text-purple-400 border-purple-800',
  orange: 'bg-orange-900/50 text-orange-400 border-orange-800',
};

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2.5 py-0.5',
};

export default function Badge({ children, variant = 'gray', size = 'md', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-md border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}

// Position-specific badge
export function PositionBadge({ position }: { position: string }) {
  const gkPositions = ['GK'];
  const defPositions = ['CB', 'LB', 'RB'];
  const midPositions = ['CDM', 'CM', 'CAM', 'LM', 'RM'];
  const attPositions = ['LW', 'RW', 'CF', 'ST'];

  let variant: BadgeProps['variant'] = 'gray';
  if (gkPositions.includes(position)) variant = 'yellow';
  else if (defPositions.includes(position)) variant = 'blue';
  else if (midPositions.includes(position)) variant = 'emerald';
  else if (attPositions.includes(position)) variant = 'red';

  return <Badge variant={variant} size="sm">{position}</Badge>;
}

// Match status badge
export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, BadgeProps['variant']> = {
    live: 'red',
    scheduled: 'blue',
    finished: 'gray',
    halftime: 'yellow',
    cancelled: 'gray',
    postponed: 'orange',
  };
  const labels: Record<string, string> = {
    live: 'IN CORSO',
    scheduled: 'Programmata',
    finished: 'Terminata',
    halftime: 'Intervallo',
    cancelled: 'Annullata',
    postponed: 'Rinviata',
  };
  return <Badge variant={variants[status] ?? 'gray'}>{labels[status] ?? status}</Badge>;
}
