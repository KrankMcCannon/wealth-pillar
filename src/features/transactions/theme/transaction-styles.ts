/**
 * Transaction Feature Style Utilities
 * Reusable style combinations using design tokens
 *
 * This file exports className strings grouped by component.
 * Modify styles in one place and they apply everywhere.
 *
 * Usage:
 * import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
 * className={transactionStyles.header.container}
 */

import { transactionComponents, transactionSpacing, transactionTypeStyles } from './transaction-tokens';

export const transactionStyles = {
  // ====================================
  // Page-level styles
  // ====================================
  page: {
    container: `relative flex size-full min-h-[100dvh] flex-col bg-card`,
    main: `flex-1 ${transactionSpacing.page.mobile} space-y-4 sm:space-y-6 pb-20 sm:pb-24`,
  },

  // ====================================
  // Header styles
  // ====================================
  header: {
    container: transactionComponents.header.container,
    inner: 'flex items-center justify-between',
    title: transactionComponents.header.title,
    button: transactionComponents.header.button,
  },

  // ====================================
  // User Selector
  // ====================================
  userSelector: {
    container: transactionComponents.userSelector.container,
  },

  // ====================================
  // Tab Navigation
  // ====================================
  tabNavigation: {
    container: transactionComponents.tabNavigation.container,
    tab: transactionComponents.tabNavigation.tab,
    tabActive: transactionComponents.tabNavigation.tabActive,
    tabInactive: transactionComponents.tabNavigation.tabInactive,
  },

  // ====================================
  // Search and Filter Section
  // ====================================
  searchFilter: {
    container: 'flex items-center gap-3',
    searchContainer: transactionComponents.search.container,
    searchIcon: transactionComponents.search.icon,
    searchInput: transactionComponents.search.input,
    filterButton: transactionComponents.filter.button,
  },

  // ====================================
  // Active Filters Display
  // ====================================
  activeFilters: {
    container: transactionComponents.activeFilters.container,
    header: transactionComponents.activeFilters.header,
    icon: transactionComponents.activeFilters.icon,
    label: transactionComponents.activeFilters.label,
    badges: transactionComponents.activeFilters.badges,
    clearButton: 'text-primary hover:text-primary hover:bg-primary/8 text-sm',
  },

  // ====================================
  // Day Group / Section Header
  // ====================================
  dayGroup: {
    header: transactionComponents.dayGroup.header,
    title: transactionComponents.dayGroup.title,
    stats: transactionComponents.dayGroup.stats,
    statsTotal: 'flex items-center gap-2 justify-end',
    statsTotalLabel: transactionComponents.dayGroup.statsLabel,
    statsTotalValue: transactionComponents.dayGroup.statsValue,
    statsTotalValuePositive: transactionComponents.dayGroup.statsValuePositive,
    statsTotalValueNegative: transactionComponents.dayGroup.statsValueNegative,
    statsCount: transactionComponents.dayGroup.count,
  },

  // ====================================
  // Transaction Card
  // ====================================
  transactionCard: {
    container: transactionComponents.transactionCard.container,
    header: transactionComponents.transactionCard.header,
    icon: transactionComponents.transactionCard.icon,
    content: transactionComponents.transactionCard.content,
    title: transactionComponents.transactionCard.title,
    category: transactionComponents.transactionCard.category,
    amount: transactionComponents.transactionCard.amount,
    amountValue: transactionComponents.transactionCard.amountValue,
    deleteButton: transactionComponents.transactionCard.deleteButton,
  },

  // ====================================
  // Empty State
  // ====================================
  emptyState: {
    container: transactionComponents.emptyState.container,
    icon: transactionComponents.emptyState.icon,
    title: transactionComponents.emptyState.title,
    text: transactionComponents.emptyState.text,
  },

  // ====================================
  // Modal Forms
  // ====================================
  modal: {
    content: transactionComponents.modal.content,
  },

  // ====================================
  // Loading Skeletons
  // ====================================
  skeleton: {
    base: 'animate-pulse',
    card: 'bg-card rounded-lg p-3 sm:p-4',
    line: 'h-4 bg-muted rounded',
    lineShort: 'w-1/3 h-4 bg-muted rounded',
    lineMedium: 'w-2/3 h-4 bg-muted rounded',
    circle: 'w-10 h-10 rounded-lg bg-muted',
    rect: 'rounded bg-muted',
  },
};

// ====================================
// Dynamic Style Generators
// ====================================

/**
 * Get styles based on transaction type
 */
export function getTransactionTypeStyles(type: 'expense' | 'income' | 'transfer') {
  return transactionTypeStyles[type];
}

/**
 * Get amount text styles based on transaction type
 */
export function getAmountStyles(type: 'expense' | 'income' | 'transfer') {
  const typeStyles = transactionTypeStyles[type];
  return {
    text: typeStyles.text,
    prefix: type === 'expense' ? '-' : type === 'income' ? '+' : '',
  };
}

/**
 * Get icon background styles based on transaction type
 */
export function getIconStyles(type: 'expense' | 'income' | 'transfer') {
  return transactionTypeStyles[type].icon;
}

/**
 * Get day total styles based on whether it's positive or negative
 */
export function getDayTotalStyles(total: number) {
  return {
    value: total >= 0 ? transactionStyles.dayGroup.statsTotalValuePositive : transactionStyles.dayGroup.statsTotalValueNegative,
  };
}
