"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div
        aria-live="polite"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-[16px] border transition-all duration-300 animate-in fade-in slide-in-from-top-3 ${
              toast.type === "error"
                ? "bg-[#141414] text-white border-red-500/30"
                : toast.type === "success"
                ? "bg-[#141414] text-white border-[#333333]"
                : toast.type === "warning"
                ? "bg-[#141414] text-white border-yellow-500/30"
                : "bg-[#141414] text-white border-[#333333]"
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.type === "error" && (
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">
                  !
                </span>
              )}
              {toast.type === "success" && (
                <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
              )}
              {toast.type === "warning" && (
                <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center text-xs font-bold">
                  ▲
                </span>
              )}
              {toast.type === "info" && (
                <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">
                  i
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 text-left min-w-0">
              {toast.title && (
                <p className="text-[13px] font-semibold text-white tracking-tight leading-tight mb-0.5">
                  {toast.title}
                </p>
              )}
              <p className="text-[12px] text-[#e0e0e0] leading-snug break-words">
                {toast.message}
              </p>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 text-[#707070] hover:text-white transition-colors cursor-pointer text-sm leading-none p-1"
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}