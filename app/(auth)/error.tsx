'use client';

import { useEffect } from 'react';
import { AuthCard } from '@/features/auth';

/**
 * Error Boundary for Authentication Pages
 *
 * Catches and displays errors that occur during the auth flow
 * Provides user-friendly error messages and a retry option
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for debugging
    console.error('[Auth Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <>
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />
      <AuthCard
        title="Si è verificato un errore"
        subtitle="Riprova o contatta il supporto"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            {error.message || "Errore imprevisto durante l'autenticazione"}
          </p>
          <button
            onClick={() => reset()}
            className="w-full px-4 py-2 bg-[hsl(var(--color-primary))] text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Riprova
          </button>
          <a
            href="/auth"
            className="block text-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Torna alla pagina di accesso
          </a>
        </div>
      </AuthCard>
    </>
  );
}
