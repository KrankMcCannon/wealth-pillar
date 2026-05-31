'use client';

import { use, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useTransactionsContent, type UseTransactionsContentProps } from '@/features/transactions';
import type { User } from '@/lib/types';
import type { TransactionsListData } from '@/server/use-cases/pages/transactions-page.use-case';
import { AppPage, HomeDashboardMain, PageFab } from '@/components/layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  TransactionFilterChips,
  TransactionsScreenList,
  RecurrentTabPanel,
} from '@/features/transactions';
import { stitchTransactions } from '@/styles/home-design-foundation';

interface TransactionsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageDataPromise: Promise<TransactionsListData>;
}

export default function TransactionsContent({
  currentUser,
  groupUsers,
  pageDataPromise,
}: TransactionsContentProps) {
  const pageData = use(pageDataPromise);
  const {
    transactions = [],
    hasMore: initialHasMore = false,
    nextCursor: initialNextCursor,
    appliedQuery,
    budgets = [],
    accounts = [],
    categories = [],
  } = pageData;

  const props: UseTransactionsContentProps = {
    transactions,
    hasMore: initialHasMore,
    budgets,
    accounts,
    appliedQuery,
    ...(initialNextCursor ? { nextCursor: initialNextCursor } : {}),
  };

  const t = useTranslations('TransactionsContent');
  const tTable = useTranslations('Transactions.Table');

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
    hasMore,
    isLoadingMore,
    loadMore,
    listItems,
    accountNames,
    handleEditTransaction,
    openModal,
    router,
    isNavigatingFilters,
  } = useTransactionsContent(props);

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

  return (
    <AppPage
      currentUser={currentUser}
      title={t('headerTitle')}
      showBack
      skipToMainHref="#main-transactions"
      skipToMainLabel={t('skipToMain')}
      afterMain={
        <PageFab
          onClick={() => openModal('transaction')}
          ariaLabel={tTable('empty.addCta')}
          testId="transactions-fab-add"
          hidden={activeTab !== 'Transactions'}
        />
      }
      betweenHeaderAndMain={
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-col">
          <div className={stitchTransactions.tabsStickyBar}>
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

                <TransactionsScreenList
                  transactions={listItems}
                  accountNames={accountNames}
                  categories={categories}
                  hasMore={hasMore}
                  isLoadingMore={isLoadingMore}
                  isNavigatingFilters={isNavigatingFilters}
                  onLoadMore={loadMore}
                  onEditTransaction={handleEditTransaction}
                  onAddTransaction={() => openModal('transaction')}
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
              <RecurrentTabPanel
                isActive={activeTab === 'Recurrent'}
                groupUsers={groupUsers}
                selectedUserId={selectedUserId}
                onUserFilterChange={handleUserFilterChange}
                showUserPicker={showUserPicker}
                onCreateRecurringSeries={() => openModal('recurring')}
                onEditRecurringSeries={(series) => openModal('recurring', series.id)}
                onSeriesUpdate={() => router.refresh()}
              />
            </TabsContent>
          </HomeDashboardMain>
        </Tabs>
      }
    />
  );
}
