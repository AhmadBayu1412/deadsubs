import { type ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { clsx } from 'clsx';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  hideClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  hideClose = false,
}: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={clsx(
          'relative w-full bg-surface rounded-xl shadow-xl border border-border',
          'animate-in fade-in zoom-in-95 duration-200',
          sizeClasses[size]
        )}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-primary">
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-secondary hover:text-primary hover:bg-border/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  loading?: boolean;
  confirmText?: string;       // Phrase the user must type to enable confirm
  readonly confirmValue?: string;      // Current input value
  readonly onConfirmChange?: (v: string) => void; // Called on input change
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
  loading = false,
  confirmText,
  confirmValue,
  onConfirmChange,
}: ConfirmDialogProps) {
  const isConfirmed = !confirmText || confirmValue?.trim().toLowerCase() === confirmText.toLowerCase();

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-secondary">{message}</p>
        {confirmText && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-secondary">
              Type <strong className="text-primary font-semibold">{confirmText}</strong> to confirm:
            </p>
            <input
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={confirmValue ?? ''}
              onChange={(e) => onConfirmChange?.(e.target.value)}
              placeholder={confirmText}
              className="w-full px-3 py-2 text-sm rounded-lg bg-bg border border-border text-primary placeholder:text-secondary/50 focus:outline-none focus:border-accent-red focus:ring-1 focus:ring-accent-red/30 transition-colors"
            />
          </div>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            disabled={!isConfirmed}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
