'use client';

import { useEffect } from 'react';
import { AuthCard, authStyles } from '@/features/auth';

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
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <AuthCard
        title="Si è verificato un errore"
        subtitle="Riprova o contatta il supporto"
      >
        <div className={authStyles.errorPage.container}>
          <p className={authStyles.errorPage.description}>
            {error.message || "Errore imprevisto durante l'autenticazione"}
          </p>
          <button
            onClick={() => reset()}
            className={authStyles.errorPage.retryButton}
          >
            Riprova
          </button>
          <a
            href="/auth"
            className={authStyles.errorPage.backLink}
          >
            Torna alla pagina di accesso
          </a>
        </div>
      </AuthCard>
    </>
  );
}
