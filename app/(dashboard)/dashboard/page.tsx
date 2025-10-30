"use client";

import { Suspense } from "react";
import { Settings, Bell, AlertTriangle } from "lucide-react";
import BottomNavigation from "@/components/layout/bottom-navigation";
import { PageLoader, QueryErrorFallback } from "@/components/shared";
import ErrorBoundary from "@/components/shared/error-boundary";
import { Button, IconContainer, Text } from "@/components/ui";
import {
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  DashboardHeaderSkeleton,
  RecurringSeriesSkeleton,
  useDashboardData,
  useDashboardState,
  UserSelectorSkeleton,
  dashboardStyles,
} from "@/features/dashboard";
import { useUserSelection } from "@/src/lib";
import UserSelector from "@/components/shared/user-selector";
import { BalanceSection } from "@/features/accounts";
import { BudgetSection } from "@/features/budgets";
import { RecurringSeriesForm, RecurringSeriesSection } from "@/features/recurring";

/**
 * Dashboard Page
 * Refactored with split data/state hooks and centralized styling
 */
export default function DashboardPage() {
  // User selection hook
  const { currentUser, selectedViewUserId, users, updateViewUserId } = useUserSelection();

  // Data fetching with progressive loading
  const data = useDashboardData(selectedViewUserId, currentUser);

  // State management for UI
  const { state: uiState, actions } = useDashboardState();

  // Show full page loader during initial load
  if (data.isLoading && !data.hasCoreData) {
    return <PageLoader message="Caricamento dashboard..." />;
  }

  // Critical error handling (blocks entire dashboard)
  if (data.errors.criticalError) {
    return (
      <div className={dashboardStyles.page.container}>
        <header className="sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <IconContainer size="md" color="destructive" className="rounded-xl sm:rounded-2xl">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
              </IconContainer>
              <div className="flex flex-col">
                <Text variant="heading" size="sm" className="sm:text-base text-destructive">
                  Errore di Connessione
                </Text>
                <Text variant="emphasis" size="xs" className="sm:text-sm text-destructive">
                  Dati non disponibili
                </Text>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <QueryErrorFallback
            error={data.errors.users || data.errors.accounts}
            reset={() => window.location.reload()}
            title="Errore nel caricamento della dashboard"
            description="Si è verificato un errore durante il caricamento dei dati finanziari. Verifica la connessione internet e riprova."
          />
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard Error:', error, errorInfo);
      }}
    >
      <div
        className={dashboardStyles.page.container}
        style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
      >
        {/* Mobile-First Header */}
        <Suspense fallback={<DashboardHeaderSkeleton />}>
          <header className={dashboardStyles.header.container}>
            <div className={dashboardStyles.header.inner}>
              {/* Left - User Profile */}
              <div className={dashboardStyles.header.section.left}>
                <IconContainer size="sm" color="primary" className={dashboardStyles.header.section.profileIcon}>
                  <Settings className="h-4 w-4" />
                </IconContainer>
                <div className={dashboardStyles.header.section.profileName}>
                  <Text variant="heading" size="sm">
                    {currentUser?.name || 'Utente'}
                  </Text>
                  <Text variant="muted" size="xs" className="font-semibold">
                    Premium Plan
                  </Text>
                </div>
              </div>

              {/* Right - Actions */}
              <div className={dashboardStyles.header.section.right}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={dashboardStyles.header.button}
                >
                  <Bell className={dashboardStyles.header.section.notificationIcon} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={dashboardStyles.header.button}
                  onClick={actions.handleNavigateToSettings}
                >
                  <Settings className={dashboardStyles.header.section.settingsIcon} />
                </Button>
              </div>
            </div>
          </header>
        </Suspense>

        {/* User Selector */}
        <Suspense fallback={<UserSelectorSkeleton />}>
          <UserSelector
            users={data.users.data}
            currentUser={currentUser}
            selectedGroupFilter={selectedViewUserId}
            onGroupFilterChange={updateViewUserId}
            isLoading={false}
          />
        </Suspense>

        <main className={dashboardStyles.page.main}>
          {/* Balance Section */}
          <Suspense fallback={<BalanceSectionSkeleton />}>
            <BalanceSection
              accounts={data.accounts.data}
              users={data.users.data}
              accountBalances={data.accountBalances}
              totalBalance={data.totalBalance}
              onAccountClick={actions.handleAccountClick}
              isLoading={data.accounts.isLoading}
            />
          </Suspense>

          <div className={dashboardStyles.divider} />

          {/* Budget Section */}
          <div className="bg-[#F8FAFC]">
            <Suspense fallback={<BudgetSectionSkeleton />}>
              <BudgetSection
                budgetsByUser={data.budgetsByUser.data as any}
                budgets={data.budgets.data as any}
                selectedViewUserId={selectedViewUserId}
                isLoading={data.budgets.isLoading}
              />
            </Suspense>
          </div>

          {/* Recurring Series Section */}
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              selectedUserId={selectedViewUserId}
              className={dashboardStyles.recurringSection.container}
              showStats={false}
              maxItems={5}
              showActions={false}
              onCreateRecurringSeries={actions.handleCreateRecurringSeries}
              onEditRecurringSeries={actions.handleEditRecurringSeries}
            />
          </Suspense>
        </main>

        <BottomNavigation />

        {/* Recurring Series Form */}
        <Suspense fallback={null}>
          <RecurringSeriesForm
            isOpen={uiState.isRecurringFormOpen}
            onOpenChange={actions.setIsRecurringFormOpen}
            selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : currentUser?.id}
            series={uiState.editingSeries ?? undefined}
            mode={uiState.recurringFormMode}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
