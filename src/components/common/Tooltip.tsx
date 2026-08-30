import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  showIcon?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = '',
  showIcon = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <span
      className={`relative inline-flex items-center gap-1 ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
      tabIndex={0}
      role="button"
      aria-label="Help information"
    >
      {children}
      {showIcon && (
        <Info className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 inline-block transition-colors cursor-help shrink-0" />
      )}
      <AnimatePresence>
        {isVisible && (
          <motion.span
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className={`absolute z-50 px-2.5 py-1.5 text-xs font-medium text-zinc-100 bg-zinc-900 dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 pointer-events-none max-w-xs whitespace-normal text-left font-sans leading-snug ${getPositionClasses()}`}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};
