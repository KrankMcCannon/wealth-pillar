'use client';

import { PageContainer } from './page-container';
import { BottomNavigation } from './bottom-navigation';
import { cn } from '@/lib';
import { dashboardPageLayoutStyles } from './theme/dashboard-page-layout-styles';

/**
 * Dashboard Page Layout Props
 */
interface DashboardPageLayoutProps {
  /** Optional header component */
  header?: React.ReactNode;
  /** Optional user selector component */
  userSelector?: React.ReactNode;
  /** Optional tab navigation component */
  tabs?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Optional className for the main element */
  mainClassName?: string;
}

/**
 * DashboardPageLayout Component
 * Standardized layout structure for dashboard pages
 * Includes PageContainer, flexible header/selector/tabs slots, and BottomNavigation
 *
 * @example
 * ```tsx
 * import { DashboardPageLayout } from "@/components/layout";
 * import { Header } from "@/components/layout";
 * import { UserSelector } from "@/components/shared";
 *
 * <DashboardPageLayout
 *   header={<Header title="Transactions" />}
 *   userSelector={<UserSelector ... />}
 * >
 *   <TransactionsList />
 * </DashboardPageLayout>
 * ```
 */
export function DashboardPageLayout({
  header,
  userSelector,
  tabs,
  children,
  mainClassName,
}: Readonly<DashboardPageLayoutProps>) {
  return (
    <PageContainer>
      <div className={dashboardPageLayoutStyles.container}>
        {header}
        {userSelector}
        {tabs}
        <main className={cn(dashboardPageLayoutStyles.main, mainClassName)}>{children}</main>
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}
