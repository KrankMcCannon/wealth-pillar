"use client";

import { Suspense, lazy } from "react";
import { Settings, Bell, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconContainer, Text } from "@/components/ui/primitives";
import BottomNavigation from "@/components/bottom-navigation";
import ErrorBoundary, { QueryErrorFallback } from "@/components/error-boundary";
import { PageLoader } from "@/components/page-loader";
import { useDashboardController } from "@/hooks/controllers/useDashboardController";

// Lazy load heavy components
const UserSelector = lazy(() => import("@/components/user-selector"));
const BalanceSection = lazy(() => import("@/components/dashboard/balance-section"));
const BudgetSection = lazy(() => import("@/components/dashboard/budget-section"));
const RecurringSeriesSection = lazy(() => import("@/components/recurring-series-section"));
const RecurringSeriesForm = lazy(() => import("@/components/recurring-series-form").then(module => ({ default: module.RecurringSeriesForm })));

// Import skeletons
import {
  DashboardHeaderSkeleton,
  UserSelectorSkeleton,
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  RecurringSeriesSkeleton
} from "@/components/dashboard/dashboard-skeleton";

/**
 * Dashboard Page
 */
export default function DashboardPage() {
  // Controller orchestrates all business logic
  const {
    currentUser,
    selectedViewUserId,
    users,
    accounts,
    accountBalances,
    totalBalance,
    budgets,
    budgetsByUser,
    isRecurringFormOpen,
    editingSeries,
    recurringFormMode,
    showInitialLoading,
    hasCriticalError,
    criticalErrorDetail,
    setIsRecurringFormOpen,
    handleAccountClick,
    handleCreateRecurringSeries,
    handleEditRecurringSeries,
    handleUserChange,
    handleNavigateToSettings,
  } = useDashboardController();

  // Show full page loader during initial load
  if (showInitialLoading) {
    return <PageLoader message="Caricamento dashboard..." />;
  }

  // Critical error handling (blocks entire dashboard)
  if (hasCriticalError) {
    return (
      <div className="relative flex size-full min-h-[100dvh] flex-col bg-card">
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
            error={criticalErrorDetail}
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
        className="relative flex size-full min-h-[100dvh] flex-col bg-card"
        style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
      >
        {/* Mobile-First Header */}
        <Suspense fallback={<DashboardHeaderSkeleton />}>
          <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left - User Profile */}
              <div className="flex items-center gap-3">
                <IconContainer size="sm" color="primary" className="rounded-xl">
                  <Settings className="h-4 w-4" />
                </IconContainer>
                <div className="flex flex-col">
                  <Text variant="heading" size="sm">
                    {currentUser?.name || 'Utente'}
                  </Text>
                  <Text variant="muted" size="xs" className="font-semibold">
                    Premium Plan
                  </Text>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/8 text-primary rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center group hover:scale-[1.02]"
                >
                  <Bell className="h-4 w-4 group-hover:animate-pulse" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/8 text-primary rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center group hover:scale-[1.02]"
                  onClick={handleNavigateToSettings}
                >
                  <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                </Button>
              </div>
            </div>
          </header>
        </Suspense>

        {/* User Selector */}
        <Suspense fallback={<UserSelectorSkeleton />}>
          <UserSelector
            users={users}
            currentUser={currentUser}
            selectedGroupFilter={selectedViewUserId}
            onGroupFilterChange={handleUserChange}
            isLoading={false}
          />
        </Suspense>

        <main className="pb-16">
          {/* Balance Section */}
          <Suspense fallback={<BalanceSectionSkeleton />}>
            <BalanceSection
              accounts={accounts}
              accountBalances={accountBalances}
              totalBalance={totalBalance}
              onAccountClick={handleAccountClick}
              isLoading={false}
            />
          </Suspense>

          <div className="h-px bg-muted mx-4"></div>

          {/* Budget Section */}
          <div className="bg-[#F8FAFC]">
            <Suspense fallback={<BudgetSectionSkeleton />}>
              <BudgetSection
                budgetsByUser={budgetsByUser}
                budgets={budgets}
                selectedViewUserId={selectedViewUserId}
                isLoading={false}
              />
            </Suspense>
          </div>

          {/* Recurring Series Section */}
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              selectedUserId={selectedViewUserId}
              className="bg-card/80 backdrop-blur-sm shadow-lg shadow-muted/30 rounded-xl border border-white/50 mx-4 mb-4"
              showStats={false}
              maxItems={5}
              showActions={false}
              onCreateRecurringSeries={handleCreateRecurringSeries}
              onEditRecurringSeries={handleEditRecurringSeries}
            />
          </Suspense>
        </main>

        <BottomNavigation />

        {/* Recurring Series Form */}
        <Suspense fallback={null}>
          <RecurringSeriesForm
            isOpen={isRecurringFormOpen}
            onOpenChange={setIsRecurringFormOpen}
            selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : currentUser?.id}
            series={editingSeries ?? undefined}
            mode={recurringFormMode}
          />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}
