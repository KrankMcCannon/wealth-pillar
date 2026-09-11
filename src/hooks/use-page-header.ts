'use client';

import { useLayoutEffect } from 'react';
import {
  type DashboardHeaderConfig,
  useDashboardHeaderStore,
} from '@/components/layout/dashboard-header-store';

export function usePageHeader(config: DashboardHeaderConfig = {}): void {
  const setHeader = useDashboardHeaderStore((state) => state.setHeader);

  const title = config.title;
  const showBack = config.showBack;
  const backHref = config.backHref;

  useLayoutEffect(() => {
    setHeader({
      ...(title !== undefined ? { title } : {}),
      ...(showBack !== undefined ? { showBack } : {}),
      ...(backHref !== undefined ? { backHref } : {}),
    });
    // Keep the last real title through Suspense fallbacks. Reseting to the app name
    // is fake chrome and flashes on every navigation.
  }, [title, showBack, backHref, setHeader]);
}
