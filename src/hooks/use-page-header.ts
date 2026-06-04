'use client';

import { useLayoutEffect } from 'react';
import {
  type DashboardHeaderConfig,
  useDashboardHeaderStore,
} from '@/components/layout/dashboard-header-store';

export function usePageHeader(config: DashboardHeaderConfig): void {
  const setHeader = useDashboardHeaderStore((state) => state.setHeader);
  const resetHeader = useDashboardHeaderStore((state) => state.resetHeader);

  useLayoutEffect(() => {
    setHeader(config);
    return () => resetHeader();
  }, [
    setHeader,
    resetHeader,
    config.title,
    config.showBack,
    config.isDashboard,
    config.headerUser?.name,
    config.headerUser?.role,
    config.onAvatarClick,
    config.onBack,
    config,
  ]);
}
