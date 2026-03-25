'use client';

import React, { useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

/**
 * Error Boundary for main app routes (home, accounts, transactions, budgets, reports, investments, settings).
 * Catches errors and shows a fallback UI with retry and "Torna alla home" actions.
 */
export default function LocaleError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>): React.JSX.Element {
  useEffect(() => {
    console.error('[App Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div
      className={cn(
        'flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 py-8',
        'bg-background text-foreground'
      )}
      role="alert"
    >
      <h1 className="text-xl font-semibold">Si è verificato un errore</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {error.message || 'Errore imprevisto. Riprova o torna alla home.'}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()} size="default">
          Riprova
        </Button>
        <Button variant="outline" asChild size="default">
          <Link href="/">Torna alla home</Link>
        </Button>
      </div>
    </div>
  );
}
