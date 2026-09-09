'use client';

import { useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/routing';
import { Link } from '@/i18n/routing';
import { HomeDashboardMain } from '@/components/layout';
import { RouteEmptyState } from '@/components/shared/route-empty-state';
import { stitchSurface, stitchTransactions } from '@/styles/home-design-foundation';

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
    <HomeDashboardMain id="main-locale-error">
      <RouteEmptyState title={t('title')} description={t('description')}>
        <button type="button" onClick={() => reset()} className={stitchSurface.primaryCta}>
          {t('retry')}
        </button>
        <Link href="/" className={stitchTransactions.emptyCtaSecondary}>
          {t('home')}
        </Link>
      </RouteEmptyState>
    </HomeDashboardMain>
  );
}
