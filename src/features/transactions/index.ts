/**
 * Transactions Feature - Public API
 * Organized by: Components → Hooks → Services → Utilities
 */

// ====================================
// Components
// ====================================
// Main Form Component
export { TransactionForm } from './components/transaction-form';

// Display Components
export { GroupedTransactionCard } from './components/grouped-transaction-card';

// Dialog Components
export { FilterDialog } from './components/filter-dialog';

// Loading Skeletons
export {
  TransactionHeaderSkeleton,
  UserSelectorSkeleton,
  TransactionCardSkeleton,
  TransactionDayGroupSkeleton,
  TransactionListSkeleton,
  SearchFilterSkeleton,
  TabNavigationSkeleton,
  RecurringSeriesSkeleton,
  FullTransactionsPageSkeleton,
} from './components/transaction-skeletons';

// ====================================
// Hooks
// ====================================
// Data Loading
export { useTransactionsData, isSectionReady } from './hooks/useTransactionsData';
export type { TransactionsDataSection, TransactionsDataState } from './hooks/useTransactionsData';

// State Management
export { useTransactionsState } from './hooks/useTransactionsState';
export type { TransactionsPageState, TransactionsPageActions } from './hooks/useTransactionsState';

// Form Controllers
export { useTransactionFormController } from './hooks/use-transaction-form-controller';
export type {
  TransactionFormState,
  TransactionFormMode,
  UseTransactionFormControllerOptions,
  UseTransactionFormControllerResult,
} from './hooks/use-transaction-form-controller';

// Form Logic Utilities
export * from './hooks/use-transaction-form-logic';

// Mutations
export {
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from './hooks/use-transaction-mutations';

// ====================================
// Services
// ====================================
// View Models
export {
  createTransactionsViewModel,
  createEmptyTransactionsViewModel,
  type TransactionsViewModel,
  type TransactionFilters,
} from './services/transactions-view-model';

// ====================================
// Theme
// ====================================
export { transactionStyles, getTransactionTypeStyles, getAmountStyles, getIconStyles, getDayTotalStyles } from './theme/transaction-styles';
export { transactionColors, transactionSpacing, transactionTypography, transactionComponents } from './theme/transaction-tokens';
