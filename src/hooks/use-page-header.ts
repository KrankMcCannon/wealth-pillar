'use client';

import { useLayoutEffect, useRef } from 'react';
import {
  type DashboardHeaderConfig,
  useDashboardHeaderStore,
} from '@/components/layout/dashboard-header-store';

export function usePageHeader(config: DashboardHeaderConfig = {}): void {
  const setHeader = useDashboardHeaderStore((state) => state.setHeader);
  const onBackRef = useRef(config.onBack);
  onBackRef.current = config.onBack;

  const title = config.title;
  const showBack = config.showBack;
  const hasOnBack = config.onBack !== undefined;

  useLayoutEffect(() => {
    setHeader({
      ...(title !== undefined ? { title } : {}),
      ...(showBack !== undefined ? { showBack } : {}),
      ...(hasOnBack ? { onBack: () => onBackRef.current?.() } : {}),
    });
    // Keep the last real title through Suspense fallbacks. Reseting to the app name
    // is fake chrome and flashes on every navigation.
  }, [title, showBack, hasOnBack, setHeader]);
}
