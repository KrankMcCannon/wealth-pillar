'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

const ROUTE_ERROR_NAMESPACE: Record<string, string> = {
  accounts: 'AccountsError',
  budgets: 'BudgetsError',
  reports: 'ReportsError',
};

function resolveErrorNamespace(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const routeSegment = segments.find((s) => ROUTE_ERROR_NAMESPACE[s]);
  if (routeSegment) return ROUTE_ERROR_NAMESPACE[routeSegment]!;
  return 'LocaleError';
}

export default function LocaleError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const pathname = usePathname();
  const namespace = useMemo(() => resolveErrorNamespace(pathname), [pathname]);
  const t = useTranslations(namespace);

  useEffect(() => {
    console.error(`[${namespace}]`, {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error, namespace]);

  return (
    <div
      className={cn(
        'flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4 py-10',
        'bg-background text-foreground'
      )}
      role="alert"
    >
      <h1 className="text-center text-lg font-semibold text-primary">{t('title')}</h1>
      <p className="max-w-md text-center text-sm leading-relaxed text-muted-foreground wrap-break-word">
        {t('description')}
      </p>
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
