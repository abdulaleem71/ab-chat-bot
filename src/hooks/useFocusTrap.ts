import { useEffect, useRef, RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface UseFocusTrapOptions {
  isOpen: boolean;
  onClose?: () => void;
  closeOnEsc?: boolean;
  autoFocus?: boolean;
  restoreFocus?: boolean;
}

export function useFocusTrap<T extends HTMLElement = HTMLElement>(
  containerRef: RefObject<T | null>,
  optionsOrIsOpen: UseFocusTrapOptions | boolean,
  legacyOnClose?: () => void
) {
  const options: UseFocusTrapOptions =
    typeof optionsOrIsOpen === 'boolean'
      ? { isOpen: optionsOrIsOpen, onClose: legacyOnClose }
      : optionsOrIsOpen;

  const {
    isOpen,
    onClose,
    closeOnEsc = true,
    autoFocus = true,
    restoreFocus = true,
  } = options;

  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore upon modal close
    if (document.activeElement && document.activeElement instanceof HTMLElement) {
      previousActiveElement.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    if (autoFocus) {
      const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const timer = setTimeout(() => {
        if (focusable.length > 0) {
          focusable[0]?.focus();
        } else {
          container.setAttribute('tabindex', '-1');
          container.focus();
        }
      }, 40);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoFocus, containerRef]);

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape') {
        if (closeOnEsc && onClose) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      // Handle Tab key focus trapping
      if (e.key === 'Tab') {
        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter(el => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement || !container.contains(document.activeElement)) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, closeOnEsc, onClose, containerRef]);

  // Restore focus when modal closes
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus?.();
      }
    };
  }, [restoreFocus]);
}
