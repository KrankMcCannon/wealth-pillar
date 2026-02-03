'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui';
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
}): React.JSX.Element {
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
          <Button
            onClick={() => reset()}
            className="w-full"
            size="default"
          >
            Riprova
          </Button>
          <Button
            variant="ghost"
            asChild
            className="w-full"
          >
            <Link href="/auth">
              Torna alla pagina di accesso
            </Link>
          </Button>
        </div>
      </AuthCard>
    </>
  );
}
