'use client';

import type { Dispatch, SetStateAction } from 'react';
import type { Account, Category, RecurringTransactionSeries, Transaction } from '@/lib/types';
import type { TransactionFiltersState } from '@/server/use-cases/transactions/transaction.logic';

export interface TransactionsLedgerProps {
  readonly accounts: Account[];
  readonly transactions: Transaction[];
  readonly accountNames: Record<string, string>;
  readonly categories: Category[];
  readonly filters: TransactionFiltersState;
  readonly setFilters: Dispatch<SetStateAction<TransactionFiltersState>>;
  readonly hasMore: boolean;
  readonly isLoadingMore: boolean;
  readonly isNavigatingFilters: boolean;
  readonly onLoadMore: () => void;
  readonly onEditTransaction: (transaction: Transaction) => void;
  readonly onAddTransaction: () => void;
  readonly onImport: () => void;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly selectedUserId: string | undefined;
  readonly budgetName?: string | undefined;
  readonly onClearBudgetFilter?: (() => void) | undefined;
}

export interface RecurringLedgerProps {
  readonly series: RecurringTransactionSeries[];
  readonly selectedUserId: string | undefined;
  readonly onCreateRecurringSeries: () => void;
  readonly onEditRecurringSeries: (series: RecurringTransactionSeries) => void;
}
