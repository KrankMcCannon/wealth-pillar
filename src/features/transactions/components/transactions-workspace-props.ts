'use client';

import type { Dispatch, SetStateAction, ReactNode } from 'react';
import type { Account, Category, RecurringTransactionSeries, Transaction, User } from '@/lib/types';
import type { TransactionFiltersState } from '@/server/use-cases/transactions/transaction.logic';

export interface TransactionsLedgerProps {
  readonly tabs: ReactNode;
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
  readonly showUserPicker: boolean;
  readonly groupUsers: User[];
  readonly selectedUserId: string | undefined;
  readonly onUserFilterChange: (userId: string) => void;
  readonly budgetName?: string | undefined;
  readonly onClearBudgetFilter?: (() => void) | undefined;
}

export interface RecurringLedgerProps {
  readonly tabs: ReactNode;
  readonly series: RecurringTransactionSeries[];
  readonly showUserPicker: boolean;
  readonly groupUsers: User[];
  readonly selectedUserId: string | undefined;
  readonly onUserFilterChange: (userId: string) => void;
  readonly onCreateRecurringSeries: () => void;
  readonly onEditRecurringSeries: (series: RecurringTransactionSeries) => void;
}
