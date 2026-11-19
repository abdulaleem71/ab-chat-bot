import React, { forwardRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost' | 'outline' | 'brand';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon-sm' | 'icon-md' | 'icon-lg';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'size'> {
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  shimmer?: boolean;
  glow?: boolean;
  ripple?: boolean;
  roundedPill?: boolean;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = 'button',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      shimmer = true,
      glow = false,
      ripple = true,
      roundedPill = false,
      fullWidth = false,
      children,
      className = '',
      disabled,
      onClick,
      ...motionProps
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      if (ripple) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const newRipple = { x, y, id: Date.now() };

        setRipples((prev) => [...prev.slice(-3), newRipple]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 600);
      }

      if (onClick) {
        onClick(e);
      }
    };

    // Standardized variants adhering strictly to the design tokens and Zinc palette
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-zinc-950 hover:bg-black text-white shadow-xs hover:shadow-md border border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-950',
      brand:
        'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-indigo-500/25 border border-indigo-600 focus-visible:ring-2 focus-visible:ring-indigo-500',
      secondary:
        'bg-zinc-100 hover:bg-zinc-200/90 text-zinc-900 border border-zinc-200/90 shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-400',
      destructive:
        'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-rose-500/25 border border-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500',
      outline:
        'bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-200 hover:border-zinc-400 shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-950',
      ghost:
        'bg-transparent hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-transparent',
    };

    // Standardized size tokens
    const sizeStyles: Record<ButtonSize, string> = {
      xs: 'px-2.5 py-1 text-[11px] gap-1.5 min-h-[28px]',
      sm: 'px-3 py-1.5 text-xs gap-1.5 min-h-[34px]',
      md: 'px-4 py-2 text-xs font-bold gap-2 min-h-[40px]',
      lg: 'px-5 py-2.5 text-sm font-bold gap-2.5 min-h-[46px]',
      xl: 'px-6 py-3.5 text-base font-bold gap-3 min-h-[52px]',
      'icon-sm': 'p-1.5 w-8 h-8 justify-center min-h-[32px]',
      'icon-md': 'p-2 w-9 h-9 justify-center min-h-[36px]',
      'icon-lg': 'p-2.5 w-11 h-11 justify-center min-h-[44px]',
    };

    const isLightVariant = variant === 'secondary' || variant === 'outline' || variant === 'ghost';
    const shimmerClass = shimmer && !disabled && !isLoading
      ? isLightVariant
        ? 'btn-shimmer-dark-hover'
        : 'btn-shimmer-hover'
      : '';

    const roundedClass = roundedPill ? 'rounded-full' : 'rounded-xl';

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onClick={handleButtonClick}
        whileHover={
          disabled || isLoading
            ? undefined
            : {
                y: -1.5,
                scale: 1.015,
                transition: { type: 'spring', stiffness: 450, damping: 20 },
              }
        }
        whileTap={
          disabled || isLoading
            ? undefined
            : {
                scale: 0.96,
                y: 0.5,
                transition: { type: 'spring', stiffness: 500, damping: 15 },
              }
        }
        className={`group relative ${fullWidth ? 'w-full flex' : 'inline-flex'} items-center justify-center font-heading select-none cursor-pointer overflow-hidden transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${roundedClass} ${variantStyles[variant]} ${sizeStyles[size]} ${shimmerClass} ${glow ? 'btn-pulse-glow' : ''} ${className}`}
        {...motionProps}
      >
        {/* Tactile Ripple Effect elements */}
        {ripples.map((rip) => (
          <span
            key={rip.id}
            style={{
              left: rip.x,
              top: rip.y,
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
            }}
            className={`absolute rounded-full pointer-events-none animate-[rippleWave_0.6s_ease-out_forwards] ${
              isLightVariant ? 'bg-zinc-950/20' : 'bg-white/30'
            }`}
          />
        ))}

        {/* Loading Spinner */}
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        )}

        {/* Left Icon */}
        {!isLoading && leftIcon && (
          <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
            {leftIcon}
          </span>
        )}

        {/* Label Content */}
        {children && <span className="truncate">{children}</span>}

        {/* Right Icon */}
        {!isLoading && rightIcon && (
          <span className="shrink-0 transition-transform duration-200 group-hover:translate-x-1">
            {rightIcon}
          </span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
