'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';

export const DASHBOARD_WARM_HREFS = [
  '/home',
  '/transactions',
  '/budgets',
  '/investments',
  '/reports',
  '/settings',
  '/accounts',
] as const;

export function warmDashboardRoutes(prefetch: (href: string) => void): void {
  for (const href of DASHBOARD_WARM_HREFS) {
    prefetch(href);
  }
}

function warmDashboardModules(): void {
  void import('../../../app/[locale]/(dashboard)/home/home-content');
  void import('../../../app/[locale]/(dashboard)/transactions/transactions-content');
  void import('../../../app/[locale]/(dashboard)/budgets/budgets-content');
  void import('../../../app/[locale]/(dashboard)/investments/investments-content');
  void import('../../../app/[locale]/(dashboard)/reports/reports-content');
  void import('../../../app/[locale]/(dashboard)/settings/settings-content');
  void import('../../../app/[locale]/(dashboard)/accounts/accounts-content');
}

/** Compiles/prefetches sibling tabs after first paint. Viewport prefetch often never fires in embedded browsers. */
export function DashboardRouteWarmer() {
  const router = useRouter();

  useEffect(() => {
    const warm = () => {
      warmDashboardRoutes((href) => {
        router.prefetch(href);
      });
      warmDashboardModules();
    };
    const id = window.setTimeout(warm, 1);
    return () => window.clearTimeout(id);
  }, [router]);

  return null;
}
