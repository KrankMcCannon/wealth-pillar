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

// Paginated Table
export { TransactionTable } from './components/transaction-table';
export { TransactionPagination } from './components/transaction-pagination';

// Filter Components
export { TransactionFilters } from './components/transaction-filters';
export { defaultFiltersState, hasActiveFilters } from './components/transaction-filters';

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
export {
  getAmountStyles,
  getDayTotalStyles,
  getIconStyles,
  getTransactionTypeStyles,
  transactionStyles,
} from '@/styles/system';
export {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from './actions/transaction-actions';
