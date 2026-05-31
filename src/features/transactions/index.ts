/**
 * Transactions Feature - Public API
 * Organized by: Components → Hooks → Services → Utilities
 */

// ====================================
// Components
// ====================================
// Display Components
export { RecentActivitySection } from './components/recent-activity-section';
export { GroupedTransactionCard } from './components/grouped-transaction-card';
export {
  TransactionDayList,
  TransactionDayListSkeleton,
  type GroupedTransaction,
  type TransactionDayListProps,
} from './components/transaction-day-list';

export { TransactionPagination } from './components/transaction-pagination';

// Filter Components
export { TransactionFilters } from './components/transaction-filters';
export { defaultFiltersState, hasActiveFilters } from './components/transaction-filters';
export { TransactionFilterChips } from './components/transaction-filter-chips';
export { TransactionsScreenList } from './components/transactions-screen-list';
export { RecurrentTabPanel } from './components/recurrent-tab-panel';

// Filter Logic & Types
export {
  filterTransactions,
  type DateRangeFilter,
  type TransactionFiltersState,
  type TransactionTypeFilter,
} from '@/server/use-cases/transactions/transaction.logic';

// Loading Skeletons
export {
  FullTransactionsPageSkeleton,
  RecurringSeriesSkeleton,
  TabNavigationSkeleton,
  TransactionCardSkeleton,
  TransactionDayGroupSkeleton,
  TransactionHeaderSkeleton,
  TransactionListSkeleton,
  UserSelectorSkeleton,
} from './components/transaction-skeletons';

// ====================================
// Hooks
// ====================================
export {
  useTransactionsContent,
  type UseTransactionsContentProps,
  type UseTransactionsContentReturn,
} from './hooks';

// ====================================
// Theme
// ====================================
export { transactionStyles } from './theme/transaction-styles';
export {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  loadMoreTransactionsAction,
  loadRecurringTabAction,
} from './actions/transaction-actions';
