"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { Button } from "@/src/components/ui";

interface DeleteAccountModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Modal for confirming account deletion
 * Shows warning and list of what will be deleted
 */
export function DeleteAccountModal({
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-card shadow-2xl p-6 sm:p-8 my-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-red-600">
                Elimina Account
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Questa azione è irreversibile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="text-primary/80 hover:text-primary p-1 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <p className="text-sm text-foreground">
            Sei sicuro di voler eliminare il tuo account?
          </p>

          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900 mb-2">
              Verranno eliminati permanentemente:
            </p>
            <ul className="space-y-2 text-sm text-red-700">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Il tuo account utente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Tutti i tuoi conti bancari</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Tutte le tue transazioni</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">•</span>
                <span>Tutti i tuoi budget</span>
              </li>
            </ul>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Eliminazione...
              </>
            ) : (
              "Elimina Account"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
