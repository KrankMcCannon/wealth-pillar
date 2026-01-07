"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/src/lib";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | undefined>(
  undefined
);

// ============================================================================
// TOAST PROVIDER
// ============================================================================

/**
 * Toast Provider Component
 * Wraps the app to provide toast notification functionality
 *
 * @example
 * ```tsx
 * // In app/layout.tsx:
 * <ToastProvider>
 *   {children}
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted after hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const value: ToastContextValue = {
    toasts,
    addToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isMounted &&
        createPortal(
          <ToastContainer toasts={toasts} removeToast={removeToast} />,
          document.body
        )}
    </ToastContext.Provider>
  );
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// TOAST ITEM
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const { type, title, description } = toast;

  // Icon mapping
  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  };

  // Background color mapping
  const bgColors: Record<ToastType, string> = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "min-w-[320px] max-w-md rounded-lg border shadow-lg p-4",
        "flex items-start gap-3",
        "pointer-events-auto",
        bgColors[type]
      )}
      role="alert"
    >
      {/* Icon */}
      {icons[type]}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "shrink-0 rounded-md p-1",
          "text-gray-400 hover:text-gray-600",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          type === "success" && "focus:ring-green-500",
          type === "error" && "focus:ring-red-500",
          type === "info" && "focus:ring-blue-500"
        )}
        aria-label="Chiudi notifica"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * useToast Hook
 * Provides toast notification functionality
 *
 * @example
 * ```tsx
 * const { showToast } = useToast();
 *
 * // Success toast
 * showToast({
 *   type: "success",
 *   title: "Profilo aggiornato",
 *   description: "Le modifiche sono state salvate con successo",
 * });
 *
 * // Error toast
 * showToast({
 *   type: "error",
 *   title: "Errore",
 *   description: "Impossibile aggiornare il profilo",
 * });
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      context.addToast(toast);
    },
    [context]
  );

  return {
    showToast,
    toasts: context.toasts,
  };
}
