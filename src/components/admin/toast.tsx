'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { AlertIcon, CheckIcon, CloseIcon } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error';

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<((tone: ToastTone, message: string) => void) | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>.');
  return context;
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (tone: ToastTone, message: string) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, tone, message }]);
      // Errors stay longer — they usually need reading.
      window.setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        aria-live so screen readers announce results without stealing focus.
        pointer-events-none on the container keeps the page clickable behind it.
      */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border p-3 shadow-lg',
              toast.tone === 'success'
                ? 'border-border bg-success-subtle'
                : 'border-border bg-danger-subtle',
            )}
          >
            {toast.tone === 'success' ? (
              <CheckIcon width="16" height="16" className="mt-0.5 shrink-0 text-success" />
            ) : (
              <AlertIcon width="16" height="16" className="mt-0.5 shrink-0 text-danger" />
            )}
            <p className="flex-1 text-sm text-fg">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded p-0.5 text-fg-subtle hover:text-fg"
            >
              <CloseIcon width="14" height="14" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
