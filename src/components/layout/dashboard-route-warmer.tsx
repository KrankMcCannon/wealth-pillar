'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/routing';

export const DASHBOARD_WARM_HREFS = [
  '/home',
  '/transactions',
  '/budgets',
  '/investments',
  '/reports',
  '/settings',
  '/accounts',
] as const;

export function warmDashboardRoutes(
  prefetch: (href: string) => void,
  currentPath?: string
): void {
  for (const href of DASHBOARD_WARM_HREFS) {
    if (href === currentPath) continue;
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

function runWhenIdle(work: () => void): () => void {
  const win = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  if (typeof win.requestIdleCallback === 'function') {
    const id = win.requestIdleCallback(work, { timeout: 4000 });
    return () => win.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(work, 2000);
  return () => window.clearTimeout(id);
}

/** Prefetch sibling tabs after the current page has had a chance to load. */
export function DashboardRouteWarmer() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    return runWhenIdle(() => {
      warmDashboardRoutes((href) => {
        router.prefetch(href);
      }, pathname);
      warmDashboardModules();
    });
  }, [router, pathname]);

  return null;
}
