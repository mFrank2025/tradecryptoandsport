import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 text-white disabled:bg-emerald-900',
  secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-100 disabled:bg-gray-900',
  danger: 'bg-red-600 hover:bg-red-500 text-white disabled:bg-red-900',
  ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 hover:text-white',
  outline: 'border border-gray-700 hover:border-gray-600 bg-transparent text-gray-300 hover:text-white hover:bg-gray-800',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-medium rounded-lg
          transition-colors duration-150 focus:outline-none focus:ring-2
          focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-950
          disabled:cursor-not-allowed disabled:opacity-60
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
