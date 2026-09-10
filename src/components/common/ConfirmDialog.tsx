import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import { MotionButton } from './MotionButton';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description?: string;
  itemName: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  itemName,
  inputLabel,
  inputPlaceholder,
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const [typedValue, setTypedValue] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useClickOutside(modalRef, () => {
    if (isOpen && !isLoading) onClose();
  });

  useFocusTrap(modalRef, {
    isOpen,
    onClose,
    closeOnEsc: !isLoading,
  });

  useEffect(() => {
    if (isOpen) {
      setTypedValue('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, itemName]);

  const targetName = (itemName || '').trim();
  const isMatch = typedValue.trim() === targetName && targetName.length > 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isMatch || isLoading) return;
    await onConfirm();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!isLoading) onClose();
            }}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Modal Box */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-zinc-200 relative z-10 space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isDestructive
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}
                >
                  {isDestructive ? (
                    <Trash2 className="w-5 h-5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 id="confirm-dialog-title" className="text-base font-bold text-zinc-950 font-heading">
                    {title}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium font-body">
                    Requires manual confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                aria-label="Close confirmation dialog"
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            {description && (
              <p className="text-xs text-zinc-600 leading-relaxed font-body">
                {description}
              </p>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-2xl space-y-2">
                <label
                  htmlFor="confirm-item-input"
                  className="block text-xs font-semibold text-zinc-700 font-body"
                >
                  {inputLabel || (
                    <>
                      To confirm, please type{' '}
                      <span className="font-mono font-bold text-zinc-900 bg-zinc-200/80 px-1.5 py-0.5 rounded-md break-all">
                        {targetName}
                      </span>{' '}
                      below:
                    </>
                  )}
                </label>
                <input
                  id="confirm-item-input"
                  ref={inputRef}
                  type="text"
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  placeholder={inputPlaceholder || `Type "${targetName}" to confirm`}
                  disabled={isLoading}
                  autoComplete="off"
                  className="w-full px-3.5 py-2 text-xs border border-zinc-300 rounded-xl bg-white focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-hidden font-mono text-zinc-900 placeholder:text-zinc-400 disabled:opacity-50"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-1">
                <MotionButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {cancelButtonText}
                </MotionButton>
                <MotionButton
                  type="submit"
                  variant={isDestructive ? 'danger' : 'primary'}
                  size="sm"
                  shimmer={isMatch}
                  disabled={!isMatch || isLoading}
                  leftIcon={
                    isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isDestructive ? (
                      <Trash2 className="w-3.5 h-3.5" />
                    ) : undefined
                  }
                >
                  {isLoading ? 'Processing...' : confirmButtonText}
                </MotionButton>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
