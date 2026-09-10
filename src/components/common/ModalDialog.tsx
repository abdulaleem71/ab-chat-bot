import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnEsc?: boolean;
  closeOnClickOutside?: boolean;
  className?: string;
  bodyClassName?: string;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnEsc = true,
  closeOnClickOutside = true,
  className = '',
  bodyClassName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useClickOutside(modalRef, () => {
    if (isOpen && closeOnClickOutside) {
      onClose();
    }
  });

  useFocusTrap(modalRef, {
    isOpen,
    onClose,
    closeOnEsc,
  });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const sizeStyles: Record<ModalSize, string> = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    full: 'max-w-6xl w-full h-[90vh]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          {/* Backdrop with frosted blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              if (closeOnClickOutside) onClose();
            }}
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className={`relative w-full ${sizeStyles[size]} bg-white border border-zinc-200/90 rounded-3xl shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden ${className}`}
          >
            {/* Header (if title or close button provided) */}
            {(title || showCloseButton) && (
              <div className="px-6 py-5 border-b border-zinc-100 flex items-start justify-between gap-4 shrink-0 bg-white">
                <div className="flex items-start gap-3 min-w-0">
                  {icon && (
                    <div className="w-10 h-10 rounded-2xl bg-zinc-100 border border-zinc-200/80 flex items-center justify-center shrink-0 text-zinc-900 mt-0.5">
                      {icon}
                    </div>
                  )}
                  <div className="min-w-0">
                    {title && (
                      <h3 className="text-base sm:text-lg font-bold text-zinc-950 font-heading leading-snug truncate">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs sm:text-sm text-zinc-500 font-normal font-body mt-0.5">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition cursor-pointer shrink-0 -mr-1"
                    aria-label="Close dialog"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Scrollable Content Body */}
            <div className={`p-6 overflow-y-auto flex-1 font-body text-zinc-800 ${bodyClassName}`}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 rounded-b-3xl flex items-center justify-end gap-3 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
