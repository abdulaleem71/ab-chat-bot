import React from 'react';
import { X } from 'lucide-react';

export type BadgeVariant =
  | 'brand'
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'outline'
  | 'ghost';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  onRemove?: () => void;
  roundedPill?: boolean;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  size = 'md',
  dot = false,
  pulse = false,
  icon,
  onRemove,
  roundedPill = true,
  children,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    brand: {
      container: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
      dot: 'bg-indigo-600',
    },
    primary: {
      container: 'bg-zinc-900 text-white border border-zinc-900',
      dot: 'bg-white',
    },
    secondary: {
      container: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
      dot: 'bg-zinc-500',
    },
    destructive: {
      container: 'bg-red-50 text-red-700 border border-red-200',
      dot: 'bg-red-600',
    },
    success: {
      container: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      dot: 'bg-emerald-600',
    },
    warning: {
      container: 'bg-amber-50 text-amber-700 border border-amber-200',
      dot: 'bg-amber-600',
    },
    outline: {
      container: 'bg-white text-zinc-800 border border-zinc-300 shadow-2xs',
      dot: 'bg-zinc-400',
    },
    ghost: {
      container: 'bg-zinc-100/60 text-zinc-600 border border-transparent',
      dot: 'bg-zinc-400',
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[10px] font-semibold px-2 py-0.5 gap-1 leading-none',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5 leading-none',
    lg: 'text-xs font-bold px-3 py-1.5 gap-2 leading-none',
  };

  const selected = variantStyles[variant] || variantStyles.secondary;
  const roundedClass = roundedPill ? 'rounded-full' : 'rounded-lg';
  const computedLabel = typeof children === 'string' ? `Status: ${children}` : undefined;

  return (
    <span
      role="status"
      aria-label={computedLabel}
      className={`inline-flex items-center justify-center font-heading select-none transition-colors whitespace-nowrap ${roundedClass} ${selected.container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selected.dot}`}
            />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${selected.dot}`}
          />
        </span>
      )}

      {icon && <span className="shrink-0 leading-none">{icon}</span>}

      <span className="leading-tight">{children}</span>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 transition cursor-pointer text-current opacity-70 hover:opacity-100"
          aria-label="Remove badge"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
