"use client";

/**
 * Transactions Content - Client Component
 *
 * Handles interactive transactions UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { Suspense, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, Plus, Filter } from "lucide-react";
import { useUserFilter } from "@/hooks";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui";
import { BottomNavigation, PageContainer } from "@/src/components/layout";
import TabNavigation from "@/src/components/shared/tab-navigation";
import UserSelector from "@/src/components/shared/user-selector";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { RecurringSeriesSection, RecurringSeriesForm } from "@/src/features/recurring";
import { GroupedTransactionCard, TransactionForm } from "@/src/features/transactions";
import { transactionStyles } from "@/src/features/transactions/theme/transaction-styles";
import { UserSelectorSkeleton } from "@/src/features/dashboard";
import { RecurringSeriesSkeleton } from "@/src/features/transactions/components/transaction-skeletons";
import type { User, Transaction, Category, Account } from "@/lib/types";
import { TransactionService } from "@/lib/services";
import { deleteTransactionAction } from "@/features/transactions/actions/transaction-actions";
import { formatCurrency } from "@/lib/utils";

/**
 * Transactions Content Props
 */
interface TransactionsContentProps {
  currentUser: User;
  groupUsers: User[];
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
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
}: TransactionsContentProps) {
  const router = useRouter();

  // User filtering state management using shared hook
  const { selectedGroupFilter, setSelectedGroupFilter, selectedUserId } = useUserFilter();
  const [activeTab, setActiveTab] = useState<string>('Transactions');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Optimistic UI state - local copy of transactions
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);

  // Create account names map for display
  const accountNames = useMemo(() => {
    const names: Record<string, string> = {};
    accounts.forEach((account) => {
      names[account.id] = account.name;
    });
    return names;
  }, [accounts]);

  // Filter transactions by selected user (use local state for optimistic updates)
  const filteredTransactions = useMemo(() => {
    return selectedUserId
      ? localTransactions.filter((t) => t.user_id === selectedUserId)
      : localTransactions;
  }, [selectedUserId, localTransactions]);

  // Group transactions by date and calculate daily totals using service layer
  const dayTotals = useMemo(() => {
    const grouped = TransactionService.groupTransactionsByDate(filteredTransactions);
    return TransactionService.calculateDailyTotals(grouped);
  }, [filteredTransactions]);

  // Handlers for transaction actions
  const handleCreateTransaction = () => {
    setFormMode('create');
    setSelectedTransaction(undefined);
    setIsTransactionFormOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setFormMode('edit');
    setSelectedTransaction(transaction);
    setIsTransactionFormOpen(true);
  };

  const handleDeleteClick = (transactionId: string) => {
    const transaction = localTransactions.find((t) => t.id === transactionId);
    if (transaction) {
      setTransactionToDelete(transaction);
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!transactionToDelete) return;

    setIsDeleting(true);

    // Optimistic UI update - remove immediately
    const removedTransaction = transactionToDelete;
    setLocalTransactions((prev) => prev.filter((t) => t.id !== removedTransaction.id));

    try {
      // Call server action to delete
      const result = await deleteTransactionAction(removedTransaction.id);

      if (result.error) {
        // Revert on error
        setLocalTransactions((prev) => [...prev, removedTransaction]);
        console.error('Failed to delete transaction:', result.error);
        // TODO: Show error toast/message to user
      }
      // Success - cache revalidation happens in service, UI will refresh with server data
    } catch (error) {
      // Revert on error
      setLocalTransactions((prev) => [...prev, removedTransaction]);
      console.error('Error deleting transaction:', error);
      // TODO: Show error toast/message to user
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
      setTransactionToDelete(null);
      // Refresh data from server
      router.refresh();
    }
  };

  const handleFormSuccess = (transaction: Transaction, action: 'create' | 'update') => {
    // Optimistic UI update
    if (action === 'create') {
      setLocalTransactions((prev) => [transaction, ...prev]);
    } else {
      setLocalTransactions((prev) =>
        prev.map((t) => (t.id === transaction.id ? transaction : t))
      );
    }

    // Cache revalidation happens in service, UI will refresh with server data
    router.refresh();
  };

  return (
    <PageContainer className={transactionStyles.page.container}>
      {/* Header */}
      <header className={transactionStyles.header.container}>
        <div className={transactionStyles.header.inner}>
          {/* Back button */}
          <Button variant="ghost" size="sm" className={transactionStyles.header.button} onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          {/* Title */}
          <h1 className={transactionStyles.header.title}>Transazioni</h1>

          {/* Actions menu */}
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
        </div>
      </header>

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
        {/* Active Filters Display - Show when filters are active */}
        {activeTab === 'Transactions' && (searchQuery || isFilterOpen) && (
          <div className={transactionStyles.activeFilters.container}>
            <div className={transactionStyles.activeFilters.header}>
              <Filter className={transactionStyles.activeFilters.icon} />
              <span className={transactionStyles.activeFilters.label}>Filtri Attivi:</span>
              <div className={transactionStyles.activeFilters.badges}>
                {searchQuery && (
                  <Badge variant="secondary" className="bg-primary/15 text-primary border-primary/30">
                    Ricerca: {searchQuery}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setIsFilterOpen(false);
              }}
              className={transactionStyles.activeFilters.clearButton}
            >
              Cancella Tutto
            </Button>
          </div>
        )}

        {/* Transactions Tab Content */}
        {activeTab === 'Transactions' && (
          <>
            {/* Search and Filter - Commented out until needed */}
            {/* <Suspense fallback={<SearchFilterSkeleton />}>
              <div className={transactionStyles.searchFilter.container}>
                <div className={transactionStyles.searchFilter.searchContainer}>
                  <Search className={transactionStyles.searchFilter.searchIcon} />
                  <Input
                    type="text"
                    placeholder="Cerca transazioni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={transactionStyles.searchFilter.searchInput}
                  />
                </div>
                <FilterDialog
                  isOpen={isFilterOpen}
                  onOpenChange={setIsFilterOpen}
                  selectedFilter={""}
                  selectedCategory={""}
                  categories={[]}
                  onFilterChange={() => {}}
                  onCategoryChange={() => {}}
                  onReset={() => {}}
                  hasActiveFilters={false}
                />
              </div>
            </Suspense> */}

            {/* Transactions List */}
            {dayTotals.length > 0 ? (
              <div className="space-y-6">
                {dayTotals.map(({ date, total, count, transactions: dayTransactions }) => (
                  <section key={date}>
                    <div className={transactionStyles.dayGroup.header}>
                      <h2 className={transactionStyles.dayGroup.title}>{date}</h2>
                      <div className={transactionStyles.dayGroup.stats}>
                        <div className={transactionStyles.dayGroup.statsTotal}>
                          <span className={transactionStyles.dayGroup.statsTotalLabel}>Totale:</span>
                          <span
                            className={`${transactionStyles.dayGroup.statsTotalValue} ${
                              total >= 0
                                ? transactionStyles.dayGroup.statsTotalValuePositive
                                : transactionStyles.dayGroup.statsTotalValueNegative
                            }`}
                          >
                            {formatCurrency(Math.abs(total))}
                          </span>
                        </div>
                        <div className={transactionStyles.dayGroup.statsCount}>
                          {count} {count === 1 ? "transazione" : "transazioni"}
                        </div>
                      </div>
                    </div>
                    <GroupedTransactionCard
                      transactions={dayTransactions}
                      accountNames={accountNames}
                      variant="regular"
                      categories={categories}
                      onEditTransaction={handleEditTransaction}
                      onDeleteTransaction={handleDeleteClick}
                    />
                  </section>
                ))}
              </div>
            ) : (
              <div className={transactionStyles.emptyState.container}>
                <div className={transactionStyles.emptyState.icon}>
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className={transactionStyles.emptyState.title}>Nessuna Transazione</h3>
                <p className={transactionStyles.emptyState.text}>
                  {selectedUserId
                    ? "Non ci sono transazioni per questo utente"
                    : "Non ci sono ancora transazioni. Inizia aggiungendone una!"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Recurring Tab Content */}
        {activeTab === 'Recurrent' && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <RecurringSeriesSection
              selectedUserId={selectedUserId}
              className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-muted/30"
              showStats={true}
              maxItems={10}
              showActions={true}
              onCreateRecurringSeries={() => setIsRecurringFormOpen(true)}
              onEditRecurringSeries={() => setIsRecurringFormOpen(true)}
            />
          </Suspense>
        )}
      </main>

      <BottomNavigation />

      {/* Modal Forms */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        transaction={selectedTransaction}
        mode={formMode}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
        groupId={currentUser.group_id}
        selectedUserId={selectedUserId}
        onSuccess={handleFormSuccess}
      />
      <RecurringSeriesForm
        isOpen={isRecurringFormOpen}
        onOpenChange={setIsRecurringFormOpen}
        selectedUserId={selectedUserId}
        series={undefined}
        mode={undefined}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setTransactionToDelete(null);
        }}
        title="Elimina transazione"
        message={`Sei sicuro di voler eliminare la transazione "${transactionToDelete?.description}"? Questa azione non può essere annullata.`}
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        isLoading={isDeleting}
      />
    </PageContainer>
  );
}
