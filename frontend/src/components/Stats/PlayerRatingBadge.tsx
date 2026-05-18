interface PlayerRatingBadgeProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

function getRatingColor(rating: number): string {
  if (rating >= 8.5) return 'bg-emerald-500 text-white';
  if (rating >= 7.5) return 'bg-green-600 text-white';
  if (rating >= 6.5) return 'bg-yellow-500 text-black';
  if (rating >= 5.5) return 'bg-orange-500 text-white';
  return 'bg-red-600 text-white';
}

const sizeClasses = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function PlayerRatingBadge({ rating, size = 'md' }: PlayerRatingBadgeProps) {
  return (
    <div
      className={`
        ${sizeClasses[size]} ${getRatingColor(rating)}
        rounded-lg font-bold flex items-center justify-center
      `}
    >
      {rating.toFixed(1)}
    </div>
  );
}
