"use client";

/**
 * Transactions Content - Client Component
 *
 * Handles interactive transactions UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useUserFilter,
  useDeleteConfirmation,
  useIdNameMap,
  useFilteredData,
  useInfiniteScroll,
} from "@/hooks";
import { loadMoreTransactionsAction } from "@/features/transactions/actions/load-more-transactions";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import TabNavigation from "@/components/shared/tab-navigation";
import UserSelector from "@/components/shared/user-selector";
import { ConfirmationDialog } from "@/components/shared";
import { RecurringSeriesSection, PauseSeriesModal } from "@/features/recurring";
import { RecurringTransactionSeries } from "@/lib";
import {
  TransactionDayList,
  TransactionFilters,
  defaultFiltersState,
  filterTransactions,
  type TransactionFiltersState,
  type GroupedTransaction,
} from "@/features/transactions";
import { transactionStyles } from "@/styles/system";
import { UserSelectorSkeleton } from "@/features/dashboard";
import { RecurringSeriesSkeleton } from "@/features/transactions/components/transaction-skeletons";
import type { Transaction, Budget, User, Account, Category } from "@/lib/types";
import { TransactionLogic } from "@/server/services/transaction.logic";
import { deleteTransactionAction } from "@/features/transactions/actions/transaction-actions";
import { deleteRecurringSeriesAction } from "@/features/recurring/actions/recurring-actions";
import { useModalState, useTabState } from "@/lib/navigation/url-state";
import { usePageDataStore } from "@/stores/page-data-store";

/**
 * Transactions Content Props
 */
interface TransactionsContentProps {
  transactions: Transaction[];
  totalTransactions?: number;
  hasMoreTransactions?: boolean;
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  categories: Category[];
}

/**
 * Transactions Content Component
 * Handles interactive transactions UI with state management
 */
export default function TransactionsContent({
  transactions,
  totalTransactions = 0,
  hasMoreTransactions = false,
  recurringSeries,
  budgets,
  currentUser,
  groupUsers,
  accounts,
  categories,
}: TransactionsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User filtering state management (global context)
  const { setSelectedGroupFilter, selectedUserId } = useUserFilter();

  // Modal state management (URL-based)
  const { openModal } = useModalState();

  // Check if coming from budgets page
  const fromBudgets = searchParams.get("from") === "budgets";
  const budgetIdFromUrl = searchParams.get("budget");
  const memberIdFromUrl = searchParams.get("member");
  const startDateFromUrl = searchParams.get("startDate");
  const endDateFromUrl = searchParams.get("endDate");

  // Get selected budget for display
  const selectedBudget = useMemo(() => {
    if (budgetIdFromUrl) {
      return budgets.find((b) => b.id === budgetIdFromUrl) || null;
    }
    return null;
  }, [budgetIdFromUrl, budgets]);

  // Initialize filters from URL params (budget navigation)
  const initialFilters = useMemo((): TransactionFiltersState => {
    if (fromBudgets && selectedBudget) {
      return {
        ...defaultFiltersState,
        budgetId: selectedBudget.id,
        categoryKeys: selectedBudget.categories,
        // Budgets typically track expenses
        type: "expense",
        // Use custom date range if period dates are provided
        dateRange: startDateFromUrl || endDateFromUrl ? "custom" : defaultFiltersState.dateRange,
        startDate: startDateFromUrl || undefined,
        endDate: endDateFromUrl || undefined,
      };
    }
    return defaultFiltersState;
  }, [fromBudgets, selectedBudget, startDateFromUrl, endDateFromUrl]);

  // Tab state - managed via URL params for shareable links
  const { activeTab, setActiveTab } = useTabState("Transactions");

  // Modern filters state - initialized from URL or default
  const [filters, setFilters] = useState<TransactionFiltersState>(initialFilters);

  // Pause modal state
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedSeriesForPause, setSelectedSeriesForPause] = useState<RecurringTransactionSeries | null>(null);

  // Set user filter when coming from budgets
  useEffect(() => {
    if (fromBudgets && memberIdFromUrl) {
      setSelectedGroupFilter(memberIdFromUrl);
    }
  }, [fromBudgets, memberIdFromUrl, setSelectedGroupFilter]);

  // Scroll to top on page mount (navigation to transactions page)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []); // Empty dependency array = run once on mount

  // Scroll to top when tab changes
  useEffect(() => {
    if (activeTab) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeTab]); // Run when activeTab changes

  // Handler to clear budget filter and reset URL
  const handleClearBudgetFilter = () => {
    setFilters(defaultFiltersState);
    setSelectedGroupFilter("all");
    // Clear URL params by navigating to base transactions page
    router.push("/transactions");
  };

  // Delete confirmation state using hook
  const deleteConfirm = useDeleteConfirmation<Transaction>();
  const recurringDeleteConfirm = useDeleteConfirmation<RecurringTransactionSeries>();

  // Page data store - for optimistic updates
  const storeTransactions = usePageDataStore((state) => state.transactions);
  const setTransactions = usePageDataStore((state) => state.setTransactions);
  const setRecurringSeries = usePageDataStore((state) => state.setRecurringSeries);
  const removeTransactionFromStore = usePageDataStore((state) => state.removeTransaction);
  const addTransactionToStore = usePageDataStore((state) => state.addTransaction);

  // Infinite scroll - load more transactions callback
  const loadMoreCallback = useCallback(async (offset: number, limit: number) => {
    const result = await loadMoreTransactionsAction(offset, limit);
    if (result.error) throw new Error(result.error);
    return { data: result.data, hasMore: result.hasMore };
  }, []);

  // Infinite scroll hook
  const {
    items: infiniteTransactions,
    isLoading: isLoadingMore,
    hasMore: canLoadMore,
    sentinelRef,
  } = useInfiniteScroll({
    initialItems: transactions,
    totalCount: totalTransactions,
    hasMore: hasMoreTransactions,
    pageSize: 50,
    loadMore: loadMoreCallback,
  });

  // Initialize store with infinite scroll data
  useEffect(() => {
    setTransactions(infiniteTransactions);
  }, [infiniteTransactions, setTransactions]);

  useEffect(() => {
    setRecurringSeries(recurringSeries);
  }, [recurringSeries, setRecurringSeries]);

  // Create account names map for display using hook
  const accountNames = useIdNameMap(accounts);

  // Filter transactions by selected user (centralized permission-based filtering)
  const { filteredData: userFilteredTransactions } = useFilteredData({
    data: storeTransactions,
    currentUser,
    selectedUserId,
  });

  // Apply domain-specific filters (type, date, category, search)
  const filteredTransactions = useMemo(() => {
    return filterTransactions(userFilteredTransactions, filters, categories);
  }, [userFilteredTransactions, filters, categories]);

  // Group transactions by date and calculate daily totals using service layer
  const dayTotals = useMemo((): GroupedTransaction[] => {
    const grouped = TransactionLogic.groupTransactionsByDate(filteredTransactions);
    // Transform Record<string, Transaction[]> to GroupedTransaction[]
    return Object.entries(grouped).map(([date, transactions]) => {
      const totals = transactions.reduce(
        (acc, t) => {
          if (t.type === 'income') acc.income += t.amount;
          else if (t.type === 'expense') acc.expense += t.amount;
          return acc;
        },
        { income: 0, expense: 0 }
      );

      return {
        date,
        transactions,
        income: totals.income,
        expense: totals.expense,
        total: totals.income - totals.expense
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions]);

  const handleEditTransaction = (transaction: Transaction) => {
    openModal("transaction", transaction.id);
  };

  const handleDeleteClick = (transactionId: string) => {
    const transaction = storeTransactions.find((t) => t.id === transactionId);
    if (transaction) {
      deleteConfirm.openDialog(transaction);
    }
  };

  const handleDeleteConfirm = async () => {
    await deleteConfirm.executeDelete(async (transaction) => {
      // Optimistic UI update - remove immediately from store
      removeTransactionFromStore(transaction.id);

      try {
        // Call server action to delete
        const result = await deleteTransactionAction(transaction.id);

        if (result.error) {
          // Revert on error - add back to store
          addTransactionToStore(transaction);
          console.error("Failed to delete transaction:", result.error);
          throw new Error(result.error);
        }
        // Success - no router.refresh() needed, store already updated!
      } catch (error) {
        // Revert on error
        addTransactionToStore(transaction);
        console.error("Error deleting transaction:", error);
        throw error;
      }
    });
  };

  const handleRecurringDeleteClick = (series: RecurringTransactionSeries) => {
    recurringDeleteConfirm.openDialog(series);
  };

  const handleRecurringDeleteConfirm = async () => {
    await recurringDeleteConfirm.executeDelete(async (series) => {
      const result = await deleteRecurringSeriesAction(series.id);
      if (result.error) {
        console.error("Failed to delete recurring series:", result.error);
        throw new Error(result.error);
      }
      // Success - recurring series deleted
      // Note: Page will be refreshed naturally when user navigates
    });
  };

  const handleRecurringPauseClick = (series: RecurringTransactionSeries) => {
    setSelectedSeriesForPause(series);
    setShowPauseModal(true);
  };

  const handlePauseSuccess = () => {
    router.refresh();
    setShowPauseModal(false);
    setSelectedSeriesForPause(null);
  };

  const handlePauseModalChange = (open: boolean) => {
    setShowPauseModal(open);
    if (!open) {
      setSelectedSeriesForPause(null);
    }
  };

  return (
    <PageContainer className={transactionStyles.page.container}>
      {/* Header */}
      <Header
        title="Transazioni"
        showBack={true}
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions={true}
      />

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          className={transactionStyles.userSelector.className}
          currentUser={currentUser}
          users={groupUsers}
        />
      </Suspense>

      {/* Tab Navigation */}
      <div className={transactionStyles.tabNavigation.wrapper}>
        <TabNavigation
          tabs={[
            { id: "Transactions", label: "Transazioni" },
            { id: "Recurrent", label: "Ricorrenti" },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="modern"
        />
      </div>

      {/* Main Content */}
      <main className={transactionStyles.page.main}>
        {/* Transaction Filters - Modern 2025 UX */}
        {activeTab === "Transactions" && (
          <TransactionFilters
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            budgetName={selectedBudget?.description}
            onClearBudgetFilter={selectedBudget ? handleClearBudgetFilter : undefined}
          />
        )}

        {/* Transactions Tab Content */}
        {activeTab === "Transactions" && (
          <>
            <TransactionDayList
              groupedTransactions={dayTotals}
              accountNames={accountNames}
              categories={categories}
              emptyTitle="Nessuna Transazione"
              emptyDescription={
                selectedUserId
                  ? "Non ci sono transazioni per questo utente"
                  : "Non ci sono ancora transazioni. Inizia aggiungendone una!"
              }
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteClick}
            />
            {/* Infinite scroll sentinel */}
            {canLoadMore && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                {isLoadingMore && (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                )}
              </div>
            )}
            {!canLoadMore && storeTransactions.length > 0 && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Tutte le transazioni caricate ({storeTransactions.length})
              </p>
            )}
          </>
        )}

        {/* Recurring Tab Content */}
        {activeTab === "Recurrent" && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              series={recurringSeries}
              selectedUserId={selectedUserId}
              className={transactionStyles.recurringSection.container}
              showStats={true}
              maxItems={10}
              showActions={true}
              showDelete={true}
              onCreateRecurringSeries={() => openModal("recurring")}
              onEditRecurringSeries={(series) => openModal("recurring", series.id)}
              onDeleteRecurringSeries={handleRecurringDeleteClick}
              onPauseRecurringSeries={handleRecurringPauseClick}
              groupUsers={groupUsers}
              onSeriesUpdate={() => router.refresh()}
            />
          </Suspense>
        )}
      </main>

      <BottomNavigation />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteConfirm.closeDialog}
        title="Elimina transazione"
        message={`Sei sicuro di voler eliminare la transazione "${deleteConfirm.itemToDelete?.description}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />

      <ConfirmationDialog
        isOpen={recurringDeleteConfirm.isOpen}
        onConfirm={handleRecurringDeleteConfirm}
        onCancel={recurringDeleteConfirm.closeDialog}
        title="Elimina serie ricorrente"
        message={`Sei sicuro di voler eliminare la serie "${recurringDeleteConfirm.itemToDelete?.description}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        isLoading={recurringDeleteConfirm.isDeleting}
      />

      <PauseSeriesModal
        isOpen={showPauseModal}
        onOpenChange={handlePauseModalChange}
        series={selectedSeriesForPause}
        onSuccess={handlePauseSuccess}
      />
    </PageContainer>
  );
}
