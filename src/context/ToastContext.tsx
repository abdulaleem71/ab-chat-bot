import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
  showToast: (title: string, type?: ToastType, message?: string, duration?: number) => string;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const duration = toast.duration ?? 4500;
    const newToast: ToastItem = { ...toast, id, duration };

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: useCallback((title: string, message?: string, duration?: number) => {
      return addToast({ type: 'success', title, message, duration });
    }, [addToast]),
    error: useCallback((title: string, message?: string, duration?: number) => {
      return addToast({ type: 'error', title, message, duration });
    }, [addToast]),
    info: useCallback((title: string, message?: string, duration?: number) => {
      return addToast({ type: 'info', title, message, duration });
    }, [addToast]),
    warning: useCallback((title: string, message?: string, duration?: number) => {
      return addToast({ type: 'warning', title, message, duration });
    }, [addToast]),
  };

  const showToast = useCallback((title: string, type: ToastType = 'info', message?: string, duration?: number) => {
    return addToast({ type, title, message, duration });
  }, [addToast]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
          bg: 'bg-white border-emerald-200/90 text-zinc-900 shadow-lg',
          accent: 'bg-emerald-500',
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
          bg: 'bg-white border-rose-200/90 text-zinc-900 shadow-lg',
          accent: 'bg-rose-500',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
          bg: 'bg-white border-amber-200/90 text-zinc-900 shadow-lg',
          accent: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-zinc-900 shrink-0" />,
          bg: 'bg-white border-zinc-200/90 text-zinc-900 shadow-lg',
          accent: 'bg-zinc-900',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, showToast, toast }}>
      {children}
      {/* Floating Toast Viewport */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="sync">
          {toasts.map(t => {
            const styles = getToastStyles(t.type);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className={`pointer-events-auto rounded-2xl border p-4 flex items-start justify-between gap-3 relative overflow-hidden backdrop-blur-md ${styles.bg}`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">{styles.icon}</div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-xs font-bold font-heading text-zinc-900 leading-snug">{t.title}</p>
                    {t.message && (
                      <p className="text-[11px] text-zinc-500 font-normal font-body leading-relaxed break-words">{t.message}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition cursor-pointer shrink-0"
                  aria-label="Close notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
