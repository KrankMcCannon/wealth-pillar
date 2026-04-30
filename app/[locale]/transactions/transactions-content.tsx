'use client';

import { Suspense, use, useCallback, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useTransactionsContent, type UseTransactionsContentProps } from '@/features/transactions';
import type { User } from '@/lib/types';
import type { TransactionsPageData } from '@/server/use-cases/pages/transactions-page.use-case';
import {
  BottomNavigation,
  PageContainer,
  Header,
  HomeDashboardMain,
  SkipToMainLink,
} from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { ConfirmationDialog } from '@/components/shared';
import { RecurringSeriesSection } from '@/features/recurring';
import { TransactionFilterChips, TransactionsScreenList } from '@/features/transactions';
import { RecurringSeriesSkeleton } from '@/features/transactions/components/transaction-skeletons';
import { stitchTransactions } from '@/styles/home-design-foundation';
import { useTransactionDeleteRequestStore } from '@/stores/transaction-delete-request-store';

interface TransactionsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageDataPromise: Promise<TransactionsPageData>;
}

export default function TransactionsContent({
  currentUser,
  groupUsers,
  pageDataPromise,
}: TransactionsContentProps) {
  const pageData = use(pageDataPromise);
  const {
    transactions = [],
    total = 0,
    currentPage: initialCurrentPage = 1,
    totalPages: initialTotalPages = 1,
    pageSize: initialPageSize = 30,
    nextCursor: initialNextCursor,
    appliedQuery,
    recurringSeries = [],
    budgets = [],
    accounts = [],
    categories = [],
  } = pageData;

  const props: UseTransactionsContentProps = {
    transactions,
    totalTransactions: total,
    recurringSeries,
    budgets,
    accounts,
    currentPage: initialCurrentPage,
    totalPages: initialTotalPages,
    pageSize: initialPageSize,
    ...(initialNextCursor ? { nextCursor: initialNextCursor } : {}),
    appliedQuery,
  };

  const t = useTranslations('TransactionsContent');
  const pendingTransactionDeleteId = useTransactionDeleteRequestStore(
    (state) => state.pendingTransactionId
  );
  const consumePendingDelete = useTransactionDeleteRequestStore(
    (state) => state.consumePendingDelete
  );

  const headerCurrentUser = useMemo(
    () => ({
      ...(currentUser.name != null ? { name: currentUser.name } : {}),
      role: currentUser.role || 'member',
    }),
    [currentUser.name, currentUser.role]
  );

  const showUserPicker =
    (currentUser.role === 'admin' || currentUser.role === 'superadmin') && groupUsers.length > 1;

  const {
    activeTab,
    setActiveTab,
    selectedUserId,
    handleUserFilterChange,
    filters,
    setFilters,
    selectedBudget,
    handleClearBudgetFilter,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    isChangingPage,
    pageError,
    goToPage,
    currentPageItems,
    filteredCount,
    accountNames,
    handleEditTransaction,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteConfirm,
    handleCancelDelete,
    openModal,
    router,
  } = useTransactionsContent(props);

  useEffect(() => {
    if (!pendingTransactionDeleteId) return;
    const deleteId = consumePendingDelete();
    if (deleteId) {
      handleDeleteClick(deleteId);
    }
  }, [pendingTransactionDeleteId, consumePendingDelete, handleDeleteClick]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        filters.searchQuery ||
        filters.type !== 'all' ||
        filters.dateRange !== 'all' ||
        filters.categoryKey !== 'all' ||
        (filters.categoryKeys && filters.categoryKeys.length > 0) ||
        filters.budgetId ||
        filters.accountId !== 'all'
      ),
    [filters]
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      searchQuery: '',
      type: 'all',
      dateRange: 'all',
      categoryKey: 'all',
      accountId: 'all',
    });
    if (selectedBudget) handleClearBudgetFilter();
  }, [setFilters, selectedBudget, handleClearBudgetFilter]);

  const deleteTransactionDescription =
    deleteConfirm.itemToDelete?.description?.trim() ||
    t('dialogs.deleteTransaction.fallbackDescription');

  return (
    <PageContainer>
      <SkipToMainLink href="#main-transactions">{t('skipToMain')}</SkipToMainLink>

      <Header title={t('headerTitle')} showBack currentUser={headerCurrentUser} showActions />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-col">
        <div className="sticky top-[64px] z-30 bg-[#050818]/85 pb-2 pt-1 backdrop-blur-sm">
          <TabsList className={stitchTransactions.tabsList}>
            <TabsTrigger className={stitchTransactions.tabsTrigger} value="Transactions">
              {t('tabs.transactions')}
            </TabsTrigger>
            <TabsTrigger className={stitchTransactions.tabsTrigger} value="Recurrent">
              {t('tabs.recurrent')}
            </TabsTrigger>
          </TabsList>
        </div>
        <HomeDashboardMain id="main-transactions">
          <TabsContent value="Transactions" className="mt-0">
            <div className={stitchTransactions.mainStack}>
              <TransactionFilterChips
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
                accounts={accounts}
                {...(showUserPicker
                  ? {
                      currentUser,
                      groupUsers,
                      selectedUserId,
                      onUserFilterChange: handleUserFilterChange,
                    }
                  : {})}
                {...(selectedBudget?.description !== undefined
                  ? { budgetName: selectedBudget.description }
                  : {})}
                {...(selectedBudget ? { onClearBudgetFilter: handleClearBudgetFilter } : {})}
              />

              {pageError && (
                <div
                  role="alert"
                  className="rounded-xl border border-amber-500/40 bg-amber-950/30 px-3 py-2 text-sm text-amber-100"
                >
                  <span>{t('paginationError')}</span>
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage)}
                    className="ml-2 font-semibold underline"
                  >
                    {t('paginationRetry')}
                  </button>
                </div>
              )}

              <TransactionsScreenList
                transactions={currentPageItems}
                totalFilteredCount={filteredCount}
                accountNames={accountNames}
                categories={categories}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                isChangingPage={isChangingPage}
                onPageChange={goToPage}
                onPageSizeChange={setPageSize}
                onEditTransaction={handleEditTransaction}
                onDeleteTransaction={handleDeleteClick}
                {...(!hasActiveFilters && { onAddTransaction: () => openModal('transaction') })}
                {...(hasActiveFilters && { onClearFilters: handleClearFilters })}
                emptyTitle={t('empty.title')}
                emptyDescription={
                  hasActiveFilters
                    ? t('empty.noFilterResults')
                    : selectedUserId
                      ? t('empty.forUser')
                      : t('empty.noTransactionsYet')
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="Recurrent" className="mt-0">
            <Suspense fallback={<RecurringSeriesSkeleton />}>
              <div className="pt-1">
                <RecurringSeriesSection
                  series={recurringSeries}
                  selectedUserId={selectedUserId ?? undefined}
                  className="space-y-4"
                  showStats
                  maxItems={10}
                  showActions={false}
                  showDelete={false}
                  onCreateRecurringSeries={() => openModal('recurring')}
                  onEditRecurringSeries={(series) => openModal('recurring', series.id)}
                  groupUsers={groupUsers}
                  onSeriesUpdate={() => router.refresh()}
                />
              </div>
            </Suspense>
          </TabsContent>
        </HomeDashboardMain>
      </Tabs>

      <BottomNavigation />

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
        title={t('dialogs.deleteTransaction.title')}
        message={t('dialogs.deleteTransaction.message', {
          description: deleteTransactionDescription,
        })}
        confirmText={t('dialogs.deleteTransaction.confirm')}
        cancelText={t('dialogs.cancel')}
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
