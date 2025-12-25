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

import {
  transactionComponents,
  transactionSpacing,
  transactionTypeStyles,
  cardVariants,
  groupedCardTokens,
  contextColors
} from './transaction-tokens';
import { Transaction } from '@/src/lib';

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
    title: transactionComponents.modal.title,
    description: transactionComponents.modal.description,
  },

  // ====================================
  // Loading Skeletons
  // ====================================
  skeleton: {
    base: 'animate-pulse',
    card: 'bg-card rounded-lg p-3 sm:p-4',
    line: 'h-4 bg-primary/15 rounded',
    lineShort: 'w-1/3 h-4 bg-primary/15 rounded',
    lineMedium: 'w-2/3 h-4 bg-primary/15 rounded',
    circle: 'w-10 h-10 rounded-lg bg-primary/12',
    rect: 'rounded bg-primary/12',
  },

  // ====================================
  // Grouped Transaction Card
  // ====================================
  groupedCard: {
    // Variants
    variantRegular: cardVariants.regular.card,
    variantRecurrent: cardVariants.recurrent.card,

    // Header (when showHeader=true)
    headerRegular: cardVariants.regular.header,
    headerRecurrent: cardVariants.recurrent.header,
    headerContent: 'flex items-center justify-between',
    headerLabel: 'text-xs font-semibold text-muted-foreground uppercase tracking-wider',
    headerAmount: 'text-base font-bold',

    // Row container
    rowContainer: groupedCardTokens.borders.rowDivider,
  },

  // ====================================
  // Transaction Row
  // ====================================
  transactionRow: {
    // Container
    wrapper: 'relative overflow-hidden touch-pan-y group',

    // Delete layer
    deleteLayer: `${groupedCardTokens.row.deleteLayer}`,
    deleteButton: `${groupedCardTokens.deleteButton.base} ${groupedCardTokens.deleteButton.active}`,

    // Foreground content
    content: `${groupedCardTokens.spacing.rowPadding} ${groupedCardTokens.row.base} ${groupedCardTokens.row.hover} border-b border-border/50 ${groupedCardTokens.borders.lastRowNoBorder}`,
    contentLayout: `flex items-center justify-between ${groupedCardTokens.spacing.rowGap}`,

    // Left section (icon + details)
    leftSection: `flex items-center ${groupedCardTokens.spacing.rowGap} flex-1 min-w-0`,
    icon: `${groupedCardTokens.icon.container} ${groupedCardTokens.icon.hover}`,
    details: 'flex-1 min-w-0',
    title: groupedCardTokens.text.title,

    // Metadata row
    metadata: `flex items-center ${groupedCardTokens.spacing.contentGap} mt-0.5`,
    metadataText: groupedCardTokens.text.metadata,
    metadataSecondary: groupedCardTokens.text.metadataSecondary,
    separator: groupedCardTokens.text.separator,

    // Badge
    badge: groupedCardTokens.badge.base,

    // Right section (amount)
    rightSection: 'text-right shrink-0',
    amount: groupedCardTokens.text.amount,
    amountSecondary: groupedCardTokens.text.amountSecondary,
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

// ====================================
// Grouped Transaction Card Helper Functions
// ====================================

/**
 * Get card variant styles
 */
export function getCardVariantStyles(variant: 'regular' | 'recurrent') {
  return variant === 'recurrent'
    ? transactionStyles.groupedCard.variantRecurrent
    : transactionStyles.groupedCard.variantRegular;
}

/**
 * Get header variant styles
 */
export function getHeaderVariantStyles(variant: 'regular' | 'recurrent') {
  return variant === 'recurrent'
    ? transactionStyles.groupedCard.headerRecurrent
    : transactionStyles.groupedCard.headerRegular;
}

/**
 * Get total amount color based on variant and value
 */
export function getTotalAmountColor(variant: 'regular' | 'recurrent', amount: number) {
  if (variant === 'recurrent') return 'text-primary';
  return amount >= 0 ? 'text-primary' : 'text-destructive';
}

/**
 * Get transaction amount color
 */
export function getTransactionAmountColor(
  transaction: Pick<Transaction, 'type'>,
  variant: 'regular' | 'recurrent'
) {
  if (variant === 'recurrent') return 'text-primary';
  if (transaction.type === 'transfer') return 'text-primary';
  return transaction.type === 'income' ? 'text-success' : 'text-destructive';
}

/**
 * Get icon color based on transaction context and urgency
 */
export function getTransactionIconColor(
  variant: 'regular' | 'recurrent',
  context: 'due' | 'informative',
  daysUntilDue: number
) {
  if (variant === 'recurrent' && context === 'due') {
    if (daysUntilDue <= 1) return contextColors.due.urgent;
    if (daysUntilDue <= 3) return contextColors.due.warning;
    return contextColors.due.normal;
  }
  return 'bg-primary/10 text-primary';
}

/**
 * Get badge color based on transaction context and urgency
 */
export function getTransactionBadgeColor(
  variant: 'regular' | 'recurrent',
  context: 'due' | 'informative',
  daysUntilDue: number
) {
  if (variant === 'recurrent' && context === 'due') {
    if (daysUntilDue <= 1) return contextColors.dueBadge.urgent;
    if (daysUntilDue <= 3) return contextColors.dueBadge.warning;
    return contextColors.dueBadge.normal;
  }
  return '';
}
