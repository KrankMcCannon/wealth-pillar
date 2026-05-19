'use client';

import { useMemo, type ReactNode } from 'react';
import type { User } from '@/lib/types';
import { BottomNavigation } from './bottom-navigation';
import { Header } from './header';
import { HomeDashboardMain, SkipToMainLink } from './home-dashboard-layout';
import { PageContainer } from './page-container';

export type AppPageHeaderUser = {
  name?: string;
  role?: string;
};

export function toAppPageHeaderUser(currentUser: User): AppPageHeaderUser {
  return {
    ...(currentUser.name != null ? { name: currentUser.name } : {}),
    role: currentUser.role || 'member',
  };
}

export interface AppPageProps {
  currentUser: User;
  children?: ReactNode;
  /** Override default header user derived from currentUser */
  headerUser?: AppPageHeaderUser;
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  showActions?: boolean;
  isDashboard?: boolean;
  onAvatarClick?: () => void;
  onBack?: () => void;
  skipToMainHref?: string;
  skipToMainLabel?: string;
  mainId?: string;
  mainClassName?: string;
  /** Wrap children in HomeDashboardMain */
  dashboardMain?: boolean;
  decor?: ReactNode;
  beforeHeader?: ReactNode;
  beforeMain?: ReactNode;
  betweenHeaderAndMain?: ReactNode;
  afterMain?: ReactNode;
  pageContainerClassName?: string;
  showBottomNav?: boolean;
}

export function AppPage({
  currentUser,
  children,
  headerUser,
  title,
  subtitle,
  showBack,
  showActions,
  isDashboard,
  onAvatarClick,
  onBack,
  skipToMainHref,
  skipToMainLabel,
  mainId,
  mainClassName,
  dashboardMain = false,
  decor,
  beforeHeader,
  beforeMain,
  betweenHeaderAndMain,
  afterMain,
  pageContainerClassName,
  showBottomNav = true,
}: AppPageProps) {
  const headerCurrentUser = useMemo(
    () => headerUser ?? toAppPageHeaderUser(currentUser),
    [headerUser, currentUser]
  );

  const mainContent = dashboardMain ? (
    <HomeDashboardMain
      {...(mainId ? { id: mainId } : {})}
      {...(mainClassName ? { className: mainClassName } : {})}
    >
      {decor}
      {children}
    </HomeDashboardMain>
  ) : (
    children
  );

  return (
    <PageContainer {...(pageContainerClassName ? { className: pageContainerClassName } : {})}>
      {beforeHeader}
      {skipToMainHref && skipToMainLabel ? (
        <SkipToMainLink href={skipToMainHref}>{skipToMainLabel}</SkipToMainLink>
      ) : null}
      <Header
        currentUser={headerCurrentUser}
        {...(title !== undefined ? { title } : {})}
        {...(subtitle !== undefined ? { subtitle } : {})}
        {...(showBack !== undefined ? { showBack } : {})}
        {...(showActions !== undefined ? { showActions } : {})}
        {...(isDashboard !== undefined ? { isDashboard } : {})}
        {...(onAvatarClick !== undefined ? { onAvatarClick } : {})}
        {...(onBack !== undefined ? { onBack } : {})}
      />
      {beforeMain}
      {betweenHeaderAndMain ?? mainContent}
      {afterMain}
      {showBottomNav ? <BottomNavigation /> : null}
    </PageContainer>
  );
}
