'use client';

import { use, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useTransactionsContent, type UseTransactionsContentProps } from '@/features/transactions';
import type { User, RecurringTransactionSeries } from '@/lib/types';
import type { TransactionsListData } from '@/server/use-cases/pages/transactions-page.use-case';
import { usePageHeader } from '@/hooks/use-page-header';
import { useRecurringEditStore } from '@/features/recurring/stores/recurring-edit-store';
import { TransactionsWorkspace } from '@/features/transactions/components/transactions-workspace';

interface TransactionsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageDataPromise: Promise<TransactionsListData>;
  recurringSeriesPromise: Promise<RecurringTransactionSeries[]>;
}

export default function TransactionsContent({
  currentUser,
  groupUsers,
  pageDataPromise,
  recurringSeriesPromise,
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

  const showUserPicker =
    (currentUser.role === 'admin' || currentUser.role === 'superadmin') && groupUsers.length > 1;

  usePageHeader({
    title: t('headerTitle'),
    showBack: true,
    isDashboard: false,
  });

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
    isNavigatingFilters,
  } = useTransactionsContent(props);

  const setRecurringEditSeed = useRecurringEditStore((state) => state.setSeed);

  const handleEditRecurringSeries = useCallback(
    (series: RecurringTransactionSeries) => {
      setRecurringEditSeed(series);
      openModal('recurring', series.id);
    },
    [openModal, setRecurringEditSeed]
  );

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

  return (
    <TransactionsWorkspace
      activeTab={activeTab}
      onTabChange={setActiveTab}
      seriesPromise={recurringSeriesPromise}
      ledger={{
        accounts,
        transactions: listItems,
        accountNames,
        categories,
        filters,
        setFilters,
        hasMore,
        isLoadingMore,
        isNavigatingFilters,
        onLoadMore: loadMore,
        onEditTransaction: handleEditTransaction,
        onAddTransaction: () => openModal('transaction'),
        onImport: () => openModal('import'),
        emptyTitle: t('empty.title'),
        emptyDescription: hasActiveFilters
          ? t('empty.noFilterResults')
          : selectedUserId
            ? t('empty.forUser')
            : t('empty.noTransactionsYet'),
        showUserPicker,
        groupUsers,
        selectedUserId,
        onUserFilterChange: handleUserFilterChange,
        ...(selectedBudget?.description !== undefined
          ? { budgetName: selectedBudget.description }
          : {}),
        ...(selectedBudget ? { onClearBudgetFilter: handleClearBudgetFilter } : {}),
      }}
      recurring={{
        showUserPicker,
        groupUsers,
        selectedUserId,
        onUserFilterChange: handleUserFilterChange,
        onCreateRecurringSeries: () => openModal('recurring'),
        onEditRecurringSeries: handleEditRecurringSeries,
      }}
    />
  );
}
