'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; message?: string; duration?: number }) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showInfo: () => {},
  showWarning: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({
      type = 'success',
      title,
      message,
      duration = 4000,
    }: {
      type?: ToastType;
      title: string;
      message?: string;
      duration?: number;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      toast({ type: 'success', title, message });
    },
    [toast]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      toast({ type: 'error', title, message });
    },
    [toast]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      toast({ type: 'info', title, message });
    },
    [toast]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      toast({ type: 'warning', title, message });
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      {/* Toast container floating at bottom right */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-300 ${
                isSuccess
                  ? 'bg-white/95 border-emerald-200 text-slate-800'
                  : isError
                  ? 'bg-white/95 border-rose-200 text-slate-800'
                  : isWarning
                  ? 'bg-white/95 border-amber-200 text-slate-800'
                  : 'bg-white/95 border-indigo-200 text-slate-800'
              }`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                {!isSuccess && !isError && !isWarning && <Info className="w-5 h-5 text-indigo-500" />}
              </div>
              <div className="flex-1 text-xs">
                <p className="font-bold text-slate-900 text-sm leading-tight">{t.title}</p>
                {t.message && <p className="text-slate-500 mt-1 leading-normal">{t.message}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 transition flex-shrink-0 -mt-1 -mr-1 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
