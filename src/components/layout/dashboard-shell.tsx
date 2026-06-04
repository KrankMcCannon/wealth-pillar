'use client';

import type { ReactNode } from 'react';
import { BottomNavigation } from './bottom-navigation';
import { Header } from './header';
import { PageContainer } from './page-container';
import { useDashboardHeaderStore } from './dashboard-header-store';
import { useCurrentUser } from '@/providers/user-provider';
import { toAppPageHeaderUser } from './app-page';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: Readonly<DashboardShellProps>) {
  const currentUser = useCurrentUser();
  const headerConfig = useDashboardHeaderStore((state) => state.config);

  const headerUser =
    headerConfig.headerUser ?? (currentUser ? toAppPageHeaderUser(currentUser) : undefined);

  return (
    <PageContainer>
      <Header
        {...(headerConfig.title !== undefined ? { title: headerConfig.title } : {})}
        showBack={headerConfig.showBack ?? false}
        isDashboard={headerConfig.isDashboard ?? true}
        {...(headerUser ? { currentUser: headerUser } : {})}
        {...(headerConfig.onAvatarClick !== undefined
          ? { onAvatarClick: headerConfig.onAvatarClick }
          : {})}
        {...(headerConfig.onBack !== undefined ? { onBack: headerConfig.onBack } : {})}
      />
      {children}
      <BottomNavigation />
    </PageContainer>
  );
}
