"use client";

import { Suspense, useCallback, useState, lazy } from "react";
import { Settings, Bell, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import ErrorBoundary, { QueryErrorFallback } from "@/components/error-boundary";

// Optimized imports with lazy loading
import { useDashboardCore } from "@/hooks/useDashboardCore";
import { useDashboardBudgets } from "@/hooks/useDashboardBudgets";
import { useUserSelection } from "@/hooks/useUserSelection";
import { useDashboardPrefetch } from "@/hooks/useDashboardPrefetch";

// Lazy load heavy components
const UserSelector = lazy(() => import("@/components/user-selector"));
const BalanceSection = lazy(() => import("@/components/dashboard/balance-section"));
const BudgetSection = lazy(() => import("@/components/dashboard/budget-section"));
const RecurringSeriesSection = lazy(() => import("@/components/recurring-series-section"));

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
  const router = useRouter();
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  // User selection
  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading,
    updateUserCache,
  } = useUserSelection();

  // Core dashboard data (users, accounts, transactions)
  const {
    users: coreUsers,
    accounts,
    transactions,
    accountBalances,
    totalBalance,
    loading: coreLoading,
    errors: coreErrors,
    hasData: hasCoreData,
  } = useDashboardCore(selectedViewUserId, currentUser);

  // Budget data (loaded separately for better performance)
  const {
    budgets,
    budgetsByUser,
    isLoading: budgetsLoading,
    hasData: hasBudgetData,
  } = useDashboardBudgets(
    selectedViewUserId,
    currentUser,
    coreUsers,
    transactions,
    hasCoreData
  );

  // Prefetching strategies
  const { prefetchNextSelection: prefetchNext } = useDashboardPrefetch(currentUser, users);

  // Memoized callbacks
  const handleAccountClick = useCallback((id: string) => {
    setExpandedAccount(expandedAccount === id ? null : id);
  }, [expandedAccount]);

  const handleUserChange = useCallback((userId: string) => {
    // Update cache before switching
    if (selectedViewUserId !== 'all') {
      updateUserCache(selectedViewUserId, hasCoreData);
    }

    updateViewUserId(userId);

    // Prefetch next likely selection
    prefetchNext(userId);
  }, [selectedViewUserId, updateViewUserId, updateUserCache, hasCoreData, prefetchNext]);

  // Enhanced loading states - progressive loading
  const showInitialLoading = userSelectionLoading || coreLoading.isInitialLoading;
  const showPartialContent = !showInitialLoading && hasCoreData;
  const isFullyLoaded = coreLoading.isFullyLoaded && !budgetsLoading;

  // Critical error handling (blocks entire dashboard)
  if (coreErrors.criticalError) {
    return (
      <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 shadow-sm">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm sm:text-base font-bold tracking-tight text-red-600">
                  Errore di Connessione
                </p>
                <p className="text-xs sm:text-sm font-semibold text-red-500">
                  Dati non disponibili
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <QueryErrorFallback
            error={coreErrors.users || coreErrors.accounts}
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
        className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100"
        style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}
      >
        {/* Mobile-First Header */}
        <Suspense fallback={<DashboardHeaderSkeleton />}>
          <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Left - User Profile */}
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm">
                  <Settings className="h-4 w-4 text-[#7578EC]" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    {currentUser?.name || 'Utente'}
                  </p>
                  <p className="text-xs font-semibold text-[#7578EC]">
                    Premium Plan
                  </p>
                </div>
              </div>

              {/* Right - Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-[#7578EC]/10 text-[#7578EC] rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center group hover:scale-105"
                >
                  <Bell className="h-4 w-4 group-hover:animate-pulse" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-[#7578EC]/10 text-[#7578EC] rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center group hover:scale-105"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                </Button>
              </div>
            </div>
          </header>
        </Suspense>

        {/* User Selector - Progressive Loading */}
        <Suspense fallback={<UserSelectorSkeleton />}>
          <UserSelector
            users={users}
            currentUser={currentUser}
            selectedGroupFilter={selectedViewUserId}
            onGroupFilterChange={handleUserChange}
            isLoading={userSelectionLoading}
          />
        </Suspense>

        <main className="pb-16">
          {/* Balance Section - High Priority */}
          <Suspense fallback={<BalanceSectionSkeleton />}>
            {showPartialContent && (
              <BalanceSection
                accounts={accounts}
                accountBalances={accountBalances}
                totalBalance={totalBalance}
                onAccountClick={handleAccountClick}
                isLoading={coreLoading.accounts}
              />
            )}
          </Suspense>

          <div className="h-px bg-gray-200 mx-4"></div>

          {/* Budget Section - Secondary Priority */}
          <div className="bg-[#F8FAFC]">
            <Suspense fallback={<BudgetSectionSkeleton />}>
              {showPartialContent && (
                <BudgetSection
                  budgetsByUser={budgetsByUser}
                  budgets={budgets}
                  selectedViewUserId={selectedViewUserId}
                  isLoading={budgetsLoading || !hasBudgetData}
                />
              )}
            </Suspense>
          </div>

          {/* Recurring Series Section - Lower Priority */}
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            {isFullyLoaded && (
              <RecurringSeriesSection
                selectedUserId={selectedViewUserId}
                className="bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/30 rounded-xl border border-white/50 mx-4 mb-4"
                showStats={false}
                maxItems={5}
                showActions={false}
              />
            )}
          </Suspense>
        </main>

        <BottomNavigation />
      </div>
    </ErrorBoundary>
  );
}