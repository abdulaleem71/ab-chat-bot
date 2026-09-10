import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  prefixText?: React.ReactNode;
  suffixText?: React.ReactNode;
  inputSize?: InputSize;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      prefixText,
      suffixText,
      inputSize = 'md',
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = id || (typeof label === 'string' ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const sizeStyles: Record<InputSize, string> = {
      sm: 'py-1.5 text-xs min-h-[34px]',
      md: 'py-2 text-xs min-h-[40px]',
      lg: 'py-2.5 text-sm min-h-[46px]',
    };

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'} space-y-1.5`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={generatedId}
            className="block text-xs font-bold text-zinc-900 font-heading"
          >
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        <div
          className={`relative flex items-center rounded-xl border transition-all duration-150 ${
            error
              ? 'border-rose-300 bg-rose-50/30 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20'
              : 'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 focus-within:bg-white focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-zinc-950/10'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-zinc-100' : ''}`}
        >
          {/* Prefix Text */}
          {prefixText && (
            <span className="pl-3 pr-1 text-xs text-zinc-400 font-medium select-none border-r border-zinc-200/80 my-1 mr-1">
              {prefixText}
            </span>
          )}

          {/* Left Icon */}
          {leftIcon && (
            <div className="pl-3 pr-1.5 text-zinc-400 shrink-0 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Actual Input */}
          <input
            id={generatedId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={`w-full px-3 text-zinc-900 bg-transparent font-body placeholder:text-zinc-400 focus:outline-hidden disabled:cursor-not-allowed ${sizeStyles[inputSize]} ${
              leftIcon ? 'pl-1' : ''
            } ${rightIcon || error ? 'pr-2' : ''} ${className}`}
            {...props}
          />

          {/* Right Icon or Error indicator */}
          {error ? (
            <div className="pr-3 text-rose-500 shrink-0 pointer-events-none">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : rightIcon ? (
            <div className="pr-3 text-zinc-400 shrink-0">{rightIcon}</div>
          ) : null}

          {/* Suffix Text */}
          {suffixText && (
            <span className="pr-3 pl-1 text-xs text-zinc-400 font-medium select-none border-l border-zinc-200/80 my-1 ml-1">
              {suffixText}
            </span>
          )}
        </div>

        {/* Error or Helper text */}
        {error ? (
          <p className="text-[11px] font-medium text-rose-600 font-body flex items-center gap-1 mt-1">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-zinc-500 font-body mt-1">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
