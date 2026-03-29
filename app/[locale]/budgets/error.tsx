'use client';

import { useEffect, type JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export default function BudgetsError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>): JSX.Element {
  const t = useTranslations('ReportsError');

  useEffect(() => {
    console.error('[Budgets Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div
      className={cn(
        'flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4 py-10',
        'bg-background text-foreground'
      )}
      role="alert"
    >
      <h1 className="text-center text-lg font-semibold text-primary">{t('title')}</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">{t('description')}</p>
      {error.message ? (
        <p className="max-w-md text-center font-mono text-xs wrap-break-word text-muted-foreground/80">
          {error.message}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => reset()} size="default">
          {t('retry')}
        </Button>
        <Button variant="outline" asChild size="default">
          <Link href="/">{t('home')}</Link>
        </Button>
      </div>
    </div>
  );
}
