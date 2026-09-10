import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

export type SelectSize = 'sm' | 'md' | 'lg';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  leftIcon?: React.ReactNode;
  options?: SelectOption[];
  selectSize?: SelectSize;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      options,
      selectSize = 'md',
      fullWidth = true,
      className = '',
      id,
      disabled,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = id || (typeof label === 'string' ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const sizeStyles: Record<SelectSize, string> = {
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

        {/* Container */}
        <div
          className={`relative flex items-center rounded-xl border transition-all duration-150 ${
            error
              ? 'border-rose-300 bg-rose-50/30 focus-within:border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/20'
              : 'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 focus-within:bg-white focus-within:border-zinc-950 focus-within:ring-2 focus-within:ring-zinc-950/10'
          } ${disabled ? 'opacity-60 cursor-not-allowed bg-zinc-100' : ''}`}
        >
          {/* Left Icon */}
          {leftIcon && (
            <div className="pl-3 pr-1 text-zinc-400 shrink-0 pointer-events-none">
              {leftIcon}
            </div>
          )}

          {/* Select Element */}
          <select
            id={generatedId}
            ref={ref}
            disabled={disabled}
            required={required}
            className={`w-full px-3 pr-8 text-zinc-900 bg-transparent font-body appearance-none focus:outline-hidden cursor-pointer disabled:cursor-not-allowed ${sizeStyles[selectSize]} ${
              leftIcon ? 'pl-1' : ''
            } ${className}`}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>

          {/* Custom Chevron Indicator */}
          <div className="absolute right-2.5 pointer-events-none text-zinc-400 shrink-0 flex items-center">
            {error ? (
              <AlertCircle className="w-4 h-4 text-rose-500 mr-1" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
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

Select.displayName = 'Select';
