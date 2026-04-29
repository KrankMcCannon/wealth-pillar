'use client';

import { Suspense, use, useCallback, useEffect, useMemo, useState } from 'react';
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
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui';
import TabNavigation from '@/components/shared/tab-navigation';
import UserSelector from '@/components/shared/user-selector';
import { ConfirmationDialog } from '@/components/shared';
import { RecurringSeriesSection, PauseSeriesModal } from '@/features/recurring';
import {
  TransactionFilterChips,
  TransactionsScreenList,
  registerTransactionDeleteHandler,
  unregisterTransactionDeleteHandler,
} from '@/features/transactions';
import { RecurringSeriesSkeleton } from '@/features/transactions/components/transaction-skeletons';
import { stitchTransactions } from '@/styles/home-design-foundation';

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
    hasMore = false,
    recurringSeries = [],
    budgets = [],
    accounts = [],
    categories = [],
  } = pageData;

  const props: UseTransactionsContentProps = {
    currentUser,
    groupUsers,
    transactions,
    totalTransactions: total,
    hasMoreTransactions: hasMore,
    recurringSeries,
    budgets,
    accounts,
    categories,
  };

  const t = useTranslations('TransactionsContent');
  const tHome = useTranslations('HomeContent');
  const [userPickerOpen, setUserPickerOpen] = useState(false);

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
    filters,
    setFilters,
    selectedBudget,
    handleClearBudgetFilter,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    isChangingPage,
    isLoadingFullDatasetForFilters,
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
    recurringDeleteConfirm,
    handleRecurringCancelDelete,
    handleRecurringDeleteClick,
    handleRecurringDeleteConfirm,
    showPauseModal,
    selectedSeriesForPause,
    handleRecurringPauseClick,
    handlePauseSuccess,
    handlePauseModalChange,
    openModal,
    router,
  } = useTransactionsContent(props);

  useEffect(() => {
    registerTransactionDeleteHandler(handleDeleteClick);
    return () => unregisterTransactionDeleteHandler();
  }, [handleDeleteClick]);

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
  const deleteRecurringDescription =
    recurringDeleteConfirm.itemToDelete?.description?.trim() ||
    t('dialogs.deleteRecurring.fallbackDescription');

  return (
    <PageContainer>
      <SkipToMainLink href="#main-transactions">{t('skipToMain')}</SkipToMainLink>

      <Header
        title={t('headerTitle')}
        showBack
        currentUser={headerCurrentUser}
        showActions
        {...(showUserPicker ? { onAvatarClick: () => setUserPickerOpen(true) } : {})}
      />

      {showUserPicker && (
        <Drawer open={userPickerOpen} onOpenChange={setUserPickerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{tHome('userPickerTitle')}</DrawerTitle>
            </DrawerHeader>
            <UserSelector
              currentUser={currentUser}
              users={groupUsers}
              hideTitle
              isLoading={false}
            />
          </DrawerContent>
        </Drawer>
      )}

      <div className="px-3 pb-1 pt-1">
        <TabNavigation
          tabs={[
            { id: 'Transactions', label: t('tabs.transactions') },
            { id: 'Recurrent', label: t('tabs.recurrent') },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          variant="stitch"
        />
      </div>

      <HomeDashboardMain id="main-transactions">
        {activeTab === 'Transactions' && (
          <div className={stitchTransactions.mainStack}>
            <TransactionFilterChips
              filters={filters}
              onFiltersChange={setFilters}
              categories={categories}
              accounts={accounts}
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
              isChangingPage={isChangingPage || isLoadingFullDatasetForFilters}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
              onEditTransaction={handleEditTransaction}
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
        )}

        {activeTab === 'Recurrent' && (
          <Suspense fallback={<RecurringSeriesSkeleton />}>
            <div className="px-3 pb-28 pt-2">
              <RecurringSeriesSection
                series={recurringSeries}
                selectedUserId={selectedUserId ?? undefined}
                className="space-y-4"
                showStats
                maxItems={10}
                showActions
                showDelete
                onCreateRecurringSeries={() => openModal('recurring')}
                onEditRecurringSeries={(series) => openModal('recurring', series.id)}
                onDeleteRecurringSeries={handleRecurringDeleteClick}
                onPauseRecurringSeries={handleRecurringPauseClick}
                groupUsers={groupUsers}
                onSeriesUpdate={() => router.refresh()}
              />
            </div>
          </Suspense>
        )}
      </HomeDashboardMain>

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

      <ConfirmationDialog
        isOpen={recurringDeleteConfirm.isOpen}
        onConfirm={handleRecurringDeleteConfirm}
        onCancel={handleRecurringCancelDelete}
        title={t('dialogs.deleteRecurring.title')}
        message={t('dialogs.deleteRecurring.message', {
          description: deleteRecurringDescription,
        })}
        confirmText={t('dialogs.deleteRecurring.confirm')}
        cancelText={t('dialogs.cancel')}
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
