'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { BottomNavigation } from './bottom-navigation';
import { Header } from './header';
import { PageContainer } from './page-container';
import { useDashboardHeaderStore } from './dashboard-header-store';
import { DashboardRouteWarmer } from './dashboard-route-warmer';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: Readonly<DashboardShellProps>) {
  const headerConfig = useDashboardHeaderStore((state) => state.config);
  const t = useTranslations('BottomNav');

  return (
    <PageContainer>
      <a
        href="#content-start"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {t('skipToContent')}
      </a>
      <Header
        ready={headerConfig.ready === true}
        {...(headerConfig.title !== undefined ? { title: headerConfig.title } : {})}
        showBack={headerConfig.showBack ?? false}
        {...(headerConfig.backHref !== undefined ? { backHref: headerConfig.backHref } : {})}
      />
      <div id="content-start" tabIndex={-1} className="outline-none">
        {children}
      </div>
      <BottomNavigation />
      <DashboardRouteWarmer />
    </PageContainer>
  );
}
