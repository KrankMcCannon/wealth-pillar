"use client";

/**
 * Transactions Content - Client Component
 *
 * Handles interactive transactions UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MoreVertical, Plus } from "lucide-react";
import { useUserFilter, useFormModal, useDeleteConfirmation, useIdNameMap, usePermissions, useFilteredData } from "@/hooks";
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/src/components/ui";
import { BottomNavigation, PageContainer, PageHeaderWithBack } from "@/src/components/layout";
import TabNavigation from "@/src/components/shared/tab-navigation";
import UserSelector from "@/src/components/shared/user-selector";
import { ConfirmationDialog } from "@/components/shared";
import { RecurringSeriesSection, RecurringSeriesForm } from "@/src/features/recurring";
import { RecurringTransactionSeries } from "@/src/lib";
import {
  TransactionDayList,
  TransactionForm,
  TransactionFilters,
  defaultFiltersState,
  filterTransactions,
  type TransactionFiltersState,
  type GroupedTransaction,
} from "@/src/features/transactions";
import { transactionStyles } from "@/src/features/transactions/theme/transaction-styles";
import { UserSelectorSkeleton } from "@/src/features/dashboard";
import { RecurringSeriesSkeleton } from "@/src/features/transactions/components/transaction-skeletons";
import type { User, Transaction, Category, Account, Budget } from "@/lib/types";
import { TransactionService } from "@/lib/services";
import { insertTransactionSorted, updateTransactionSorted, removeTransaction } from "@/lib/utils/transaction-sorting";
import { deleteTransactionAction } from "@/features/transactions/actions/transaction-actions";
import { deleteRecurringSeriesAction } from "@/features/recurring/actions/recurring-actions";

/**
 * Transactions Content Props
 */
interface TransactionsContentProps {
  currentUser: User;
  groupUsers: User[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
}

/**
 * Transactions Content Component
 * Handles interactive transactions UI with state management
 */
export default function TransactionsContent({
  currentUser,
  groupUsers,
  transactions,
  categories,
  accounts,
  recurringSeries,
  budgets,
}: TransactionsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User filtering state management using shared hook
  const { selectedGroupFilter, setSelectedGroupFilter, selectedUserId } = useUserFilter();

  // Permission checks
  const { effectiveUserId, isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter !== "all" ? selectedGroupFilter : undefined,
  });

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

  // Tab state - initialize from URL params if present
  const initialTab = searchParams.get("tab") || "Transactions";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Modern filters state - initialized from URL or default
  const [filters, setFilters] = useState<TransactionFiltersState>(initialFilters);

  // Set user filter when coming from budgets
  useEffect(() => {
    if (fromBudgets && memberIdFromUrl) {
      setSelectedGroupFilter(memberIdFromUrl);
    }
  }, [fromBudgets, memberIdFromUrl, setSelectedGroupFilter]);

  // Sync tab state with URL params on mount and when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && (tabFromUrl === "Transactions" || tabFromUrl === "Recurrent")) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

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

  // Form modal state using hooks
  const transactionModal = useFormModal<Transaction>();
  const recurringModal = useFormModal<RecurringTransactionSeries>();

  // Delete confirmation state using hook
  const deleteConfirm = useDeleteConfirmation<Transaction>();
  const recurringDeleteConfirm = useDeleteConfirmation<RecurringTransactionSeries>();

  // Optimistic UI state - local copy of transactions
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);

  // Debounced refresh to prevent race conditions and flickering
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      router.refresh();
    }, 300); // 300ms debounce
  }, [router]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Create account names map for display using hook
  const accountNames = useIdNameMap(accounts);

  // Filter transactions by selected user (centralized permission-based filtering)
  const { filteredData: userFilteredTransactions } = useFilteredData({
    data: localTransactions,
    currentUser,
    selectedUserId,
  });

  // Apply domain-specific filters (type, date, category, search)
  const filteredTransactions = useMemo(() => {
    return filterTransactions(userFilteredTransactions, filters, categories);
  }, [userFilteredTransactions, filters, categories]);

  // Group transactions by date and calculate daily totals using service layer
  const dayTotals = useMemo((): GroupedTransaction[] => {
    const grouped = TransactionService.groupTransactionsByDate(filteredTransactions);
    return TransactionService.calculateDailyTotals(grouped);
  }, [filteredTransactions]);

  // Handlers for transaction actions
  const handleCreateTransaction = () => {
    transactionModal.openCreate();
  };

  const handleEditTransaction = (transaction: Transaction) => {
    transactionModal.openEdit(transaction);
  };

  const handleDeleteClick = (transactionId: string) => {
    const transaction = localTransactions.find((t) => t.id === transactionId);
    if (transaction) {
      deleteConfirm.openDialog(transaction);
    }
  };

  // Helper functions for optimistic updates (extracted to avoid deep nesting)
  const removeTransactionFromList = (transactionToRemove: Transaction) => {
    setLocalTransactions((prev) => removeTransaction(prev, transactionToRemove.id));
  };

  const addTransactionToList = (transactionToAdd: Transaction) => {
    setLocalTransactions((prev) => insertTransactionSorted(prev, transactionToAdd));
  };

  const handleDeleteConfirm = async () => {
    await deleteConfirm.executeDelete(async (transaction) => {
      // Optimistic UI update - remove immediately
      removeTransactionFromList(transaction);

      try {
        // Call server action to delete
        const result = await deleteTransactionAction(transaction.id);

        if (result.error) {
          // Revert on error
          addTransactionToList(transaction);
          console.error("Failed to delete transaction:", result.error);
          throw new Error(result.error);
        }
        // Success - cache revalidation happens in service, UI will refresh with server data
        debouncedRefresh();
      } catch (error) {
        // Revert on error
        addTransactionToList(transaction);
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
      router.refresh();
    });
  };

  const handleFormSuccess = (transaction: Transaction, action: "create" | "update") => {
    // Optimistic UI update with sorted insertion
    if (action === "create") {
      setLocalTransactions((prev) => insertTransactionSorted(prev, transaction));
    } else {
      setLocalTransactions((prev) => updateTransactionSorted(prev, transaction));
    }

    // Debounced cache revalidation to prevent flickering during rapid operations
    debouncedRefresh();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRecurringFormSuccess = () => {
    // Refresh to get updated recurring series data
    router.refresh();
  };

  return (
    <PageContainer className={transactionStyles.page.container}>
      {/* Header */}
      <PageHeaderWithBack
        title="Transazioni"
        onBack={() => router.back()}
        className={transactionStyles.header.container}
        contentClassName={transactionStyles.header.inner}
        titleClassName={transactionStyles.header.title}
        backButtonClassName={transactionStyles.header.button}
        variant="secondary"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={transactionStyles.header.button}>
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
              sideOffset={8}
            >
              <DropdownMenuItem
                className="text-sm font-medium text-primary hover:bg-primary hover:text-white rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                onClick={handleCreateTransaction}
              >
                <Plus className="mr-3 h-4 w-4" />
                Aggiungi Transazione
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={setSelectedGroupFilter}
          className="bg-card border-border"
        />
      </Suspense>

      {/* Tab Navigation */}
      <div className="px-3">
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
        )}

        {/* Recurring Tab Content */}
        {activeTab === "Recurrent" && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              series={recurringSeries}
              selectedUserId={isMember ? currentUser.id : selectedGroupFilter === "all" ? undefined : effectiveUserId}
              className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-muted/30"
              showStats={true}
              maxItems={10}
              showActions={true}
              showDelete={true}
              onCreateRecurringSeries={recurringModal.openCreate}
              onEditRecurringSeries={recurringModal.openEdit}
              onDeleteRecurringSeries={handleRecurringDeleteClick}
            />
          </Suspense>
        )}
      </main>

      <BottomNavigation />

      {/* Modal Forms */}
      <TransactionForm
        isOpen={transactionModal.isOpen}
        onOpenChange={transactionModal.setIsOpen}
        transaction={transactionModal.entity}
        mode={transactionModal.mode}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
        groupId={currentUser.group_id}
        selectedUserId={effectiveUserId === "all" ? undefined : effectiveUserId}
        onSuccess={handleFormSuccess}
      />
      <RecurringSeriesForm
        isOpen={recurringModal.isOpen}
        onOpenChange={recurringModal.setIsOpen}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
        selectedUserId={effectiveUserId === "all" ? undefined : effectiveUserId}
        series={recurringModal.entity}
        mode={recurringModal.mode}
        onSuccess={handleRecurringFormSuccess}
      />

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
    </PageContainer>
  );
}
