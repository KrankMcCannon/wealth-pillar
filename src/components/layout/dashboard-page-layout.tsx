"use client";

import { PageContainer } from "./page-container";
import { BottomNavigation } from "./bottom-navigation";
import { cn } from "@/lib";

/**
 * Dashboard Page Layout Props
 */
interface DashboardPageLayoutProps {
  /** Optional header component (typically PageHeaderWithBack) */
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
 * import { PageHeaderWithBack } from "@/components/layout";
 * import { UserSelector } from "@/components/shared";
 *
 * <DashboardPageLayout
 *   header={<PageHeaderWithBack title="Transactions" />}
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
  mainClassName
}: DashboardPageLayoutProps) {
  return (
    <PageContainer>
      <div className="flex-1">
        {header}
        {userSelector}
        {tabs}
        <main className={cn("p-4 pb-24", mainClassName)}>
          {children}
        </main>
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}
