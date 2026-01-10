/**
 * Transaction Feature Style Utilities
 * Reusable style combinations using design tokens
 *
 * This file exports className strings grouped by component.
 * Modify styles in one place and they apply everywhere.
 */

import type { CSSProperties } from "react";
import type { MotionValue } from "framer-motion";
import { transactionTokens } from './transaction-tokens';
import { coreTokens } from '@/styles/core-tokens';
import { Transaction } from '@/lib';

export const transactionStyles = {
  // ====================================
  // Page-level styles
  // ====================================
  page: {
    container: `relative flex size-full min-h-[100dvh] flex-col bg-card`,
    main: `flex-1 ${coreTokens.spacing.page.mobile} space-y-4 sm:space-y-6 pb-14`,
    loadingContent: 'space-y-6',
  },

  // ====================================
  // Header styles
  // ====================================
  header: {
    inner: 'flex items-center justify-between',
    title: transactionTokens.components.header.title,
    button: transactionTokens.components.header.button,
  },

  // ====================================
  // User Selector
  // ====================================
  userSelector: {
    container: transactionTokens.components.userSelector.container,
    className: 'bg-card border-border',
  },

  // ====================================
  // Tab Navigation
  // ====================================
  tabNavigation: {
    container: transactionTokens.components.tabNavigation.container,
    tab: transactionTokens.components.tabNavigation.tab,
    tabActive: transactionTokens.components.tabNavigation.tabActive,
    tabInactive: transactionTokens.components.tabNavigation.tabInactive,
    wrapper: 'px-3',
  },
  recurringSection: {
    container: 'bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg shadow-muted/30',
  },

  // ====================================
  // Day Group / Section Header
  // ====================================
  dayGroup: {
    header: transactionTokens.components.dayGroup.header,
    title: transactionTokens.components.dayGroup.title,
    stats: transactionTokens.components.dayGroup.stats,
    statsTotal: 'flex items-center gap-2 justify-end',
    statsTotalLabel: transactionTokens.components.dayGroup.statsLabel,
    statsTotalValue: transactionTokens.components.dayGroup.statsValue,
    statsTotalValuePositive: transactionTokens.components.dayGroup.statsValuePositive,
    statsTotalValueNegative: transactionTokens.components.dayGroup.statsValueNegative,
    statsCount: transactionTokens.components.dayGroup.count,
  },

  // ====================================
  // Empty State
  // ====================================
  emptyState: {
    container: transactionTokens.components.emptyState.container,
    icon: transactionTokens.components.emptyState.icon,
    title: transactionTokens.components.emptyState.title,
    text: transactionTokens.components.emptyState.text,
  },

  // ====================================
  // Modal Forms
  // ====================================
  modal: {
    content: transactionTokens.components.modal.content,
    title: transactionTokens.components.modal.title,
    description: transactionTokens.components.modal.description,
  },
  form: {
    container: "space-y-4",
    error: "bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4",
    errorText: "text-sm text-destructive font-medium",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-4",
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
    title: 'h-6 w-32 bg-slate-200 rounded animate-pulse',
  },
  skeletons: {
    header: 'sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm',
    headerRow: 'flex items-center justify-between',
    headerIcon: 'w-10 h-10 bg-primary/12 rounded-xl',
    headerTitle: 'h-6 bg-primary/15 rounded w-24',
    userSelector: 'sticky top-[60px] z-10 bg-card/80 backdrop-blur-sm border-b border-primary/20 px-3 sm:px-4 py-2',
    userSelectorListSpacing: 'flex items-center gap-2',
    userSelectorChip: 'shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10',
    userSelectorDot: 'w-5 h-5 bg-primary/25 rounded-full',
    userSelectorText: 'w-12 h-3 bg-primary/20 rounded',
    userSelectorListStyle: { height: 44 } satisfies CSSProperties,
    card: 'p-3 sm:p-4 rounded-lg border border-primary/20 bg-card',
    cardRow: 'flex items-center gap-3',
    cardIcon: 'w-10 h-10 bg-primary/10 rounded-lg shrink-0',
    cardBody: 'flex-1',
    cardLinePrimary: 'h-4 bg-primary/15 rounded w-3/4 mb-1',
    cardLineSecondary: 'h-3 bg-primary/15 rounded w-1/2',
    cardAmount: 'text-right shrink-0',
    cardAmountLine: 'h-4 bg-primary/15 rounded w-16 mb-1',
    cardAmountSub: 'h-3 bg-primary/15 rounded w-12',
    dayGroup: 'space-y-3',
    dayGroupHeader: 'flex items-center justify-between mb-2 px-1',
    dayGroupTitle: 'h-5 bg-primary/15 rounded w-24',
    dayGroupTotal: 'text-right',
    dayGroupTotalLine: 'h-4 bg-primary/15 rounded w-16 mb-1',
    dayGroupTotalSub: 'h-3 bg-primary/15 rounded w-12',
    tabNav: 'flex gap-2 border-b border-primary/20 px-3 py-2',
    tabListSpacing: 'flex gap-2 w-full',
    tabPill: 'bg-primary/12 rounded-lg',
    tabPillHeight: 'h-10',
    tabPillWidth: 'w-24',
    recurring: 'p-4 rounded-lg border border-primary/20 bg-card space-y-4',
    recurringListSpacing: 'space-y-4',
    recurringRow: 'flex items-center gap-3',
    recurringIcon: 'w-10 h-10 bg-primary/10 rounded-lg shrink-0',
    recurringBody: 'flex-1',
    recurringLinePrimary: 'h-4 bg-primary/15 rounded w-3/4 mb-1',
    recurringLineSecondary: 'h-3 bg-primary/15 rounded w-1/2',
    recurringAction: 'w-8 h-8 bg-primary/12 rounded-lg shrink-0',
    fullPage: 'flex flex-col min-h-dvh bg-card',
    main: 'flex-1 p-3 space-y-6 pb-20',
    dayGroupListSpacing: 'space-y-3',
    listSpacing: 'space-y-6',
  },

  // ====================================
  // Grouped Transaction Card
  // ====================================
  groupedCard: {
    // Variants
    variantRegular: transactionTokens.cardVariants.regular.card,
    variantRecurrent: transactionTokens.cardVariants.recurrent.card,

    // Header (when showHeader=true)
    headerRegular: transactionTokens.cardVariants.regular.header,
    headerRecurrent: transactionTokens.cardVariants.recurrent.header,
    headerContent: 'flex items-center justify-between',
    headerLabel: 'text-xs font-semibold text-primary/60 uppercase tracking-wider',
    headerAmount: 'text-base font-bold',

    // Row container
    rowContainer: transactionTokens.groupedCard.borders.rowDivider,
    backdrop: "fixed inset-0 z-10",
    openState: "relative z-20",
  },

  // ====================================
  // Transaction Filters
  // ====================================
  filters: {
    container: 'space-y-3',
    budgetBanner: 'flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20',
    budgetBannerLeft: 'flex items-center gap-2',
    budgetBannerDot: 'w-2 h-2 rounded-full bg-primary animate-pulse',
    budgetBannerText: 'text-sm font-medium text-primary',
    budgetBannerCount: 'text-xs text-primary/70',
    budgetBannerExit: 'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/20 text-primary hover:bg-primary/30 transition-colors',
    budgetBannerExitIcon: 'h-3 w-3',

    searchWrap: 'relative',
    searchIcon: 'absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200',
    searchIconActive: 'text-primary',
    searchIconInactive: 'text-primary/50',
    searchInput: 'pl-12 pr-10 py-3 h-12 rounded-2xl bg-card border-primary/20 text-primary placeholder:text-primary/40 transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lg',
    searchClear: 'absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors',
    searchClearIcon: 'h-4 w-4 text-primary',

    chipsRow: 'flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide',
    clearAll: 'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all duration-200 active:scale-[0.98] whitespace-nowrap',
    clearAllIcon: 'h-3.5 w-3.5',

    chip: {
      wrapper: 'relative inline-flex',
      buttonActive: 'inline-flex items-center gap-2 pl-3 pr-8 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap select-none bg-primary text-white shadow-md hover:bg-primary/90 active:scale-[0.98]',
      clearButton: 'absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 transition-colors',
      clearIcon: 'h-3 w-3 text-white',
      buttonBase: 'inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap select-none active:scale-[0.98]',
      buttonOpen: 'bg-primary text-white shadow-md',
      buttonIdle: 'bg-card text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/5',
      chevron: 'h-3.5 w-3.5 transition-transform duration-200',
      chevronOpen: 'rotate-180',
    },

    drawer: {
      content: 'rounded-t-3xl bg-card border-t border-primary/20',
      contentTall: 'rounded-t-3xl bg-card border-t border-primary/20 max-h-[70vh]',
      inner: 'p-4 space-y-4',
      header: 'flex items-center justify-between',
      title: 'text-lg font-bold text-primary',
      closeButton: 'text-primary hover:bg-primary/10 rounded-xl',
    },

    typeGrid: 'grid grid-cols-3 gap-2',
    typeButton: 'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border active:scale-95',
    typeButtonActive: 'bg-primary text-white border-primary shadow-md',
    typeButtonIdle: 'bg-card text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40',
    typeCheck: 'h-4 w-4',

    dateSection: 'space-y-4',
    dateGrid: 'grid grid-cols-2 gap-2',
    dateButton: 'flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border active:scale-95',
    dateButtonActive: 'bg-primary text-white border-primary shadow-md',
    dateButtonIdle: 'bg-card text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40',
    dateCustom: 'space-y-3 pt-2 border-t border-primary/10',
    dateTitle: 'text-sm font-medium text-primary',
    dateInputs: 'grid grid-cols-2 gap-3',
    dateField: 'space-y-1.5',
    dateLabel: 'text-xs text-primary/70',
    dateInput: 'bg-card border-primary/20 rounded-xl text-sm',
    dateApply: 'w-full rounded-xl',

    categorySection: 'space-y-3',
    categorySearchWrap: 'relative',
    categorySearchIcon: 'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50',
    categorySearchInput: 'pl-10 bg-card border-primary/20 rounded-xl',
    categoryGrid: 'grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1',
    categoryButton: 'flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-95',
    categoryButtonActive: 'bg-primary text-white border-primary shadow-md',
    categoryButtonIdle: 'bg-card text-primary border-primary/20 hover:bg-primary/10',
    categoryLabel: 'truncate',
    categoryLabelLeft: 'truncate flex-1 text-left',
    categoryCheck: 'h-4 w-4 shrink-0',
  },

  // ====================================
  // Transaction Row
  // ====================================
  transactionRow: {
    // Container
    wrapper: 'relative overflow-hidden touch-pan-y group',

    // Delete layer
    deleteLayer: `${transactionTokens.groupedCard.row.deleteLayer}`,
    deleteButton: `${transactionTokens.groupedCard.deleteButton.base} ${transactionTokens.groupedCard.deleteButton.active}`,

    // Foreground content
    content: `${transactionTokens.groupedCard.spacing.rowPadding} ${transactionTokens.groupedCard.row.base} ${transactionTokens.groupedCard.row.hover} ${transactionTokens.groupedCard.borders.lastRowNoBorder}`,
    contentLayout: `flex items-center justify-between ${transactionTokens.groupedCard.spacing.rowGap}`,

    // Left section (icon + details)
    leftSection: `flex items-center ${transactionTokens.groupedCard.spacing.rowGap} flex-1 min-w-0`,
    icon: `${transactionTokens.groupedCard.icon.container} ${transactionTokens.groupedCard.icon.hover}`,
    details: 'flex-1 min-w-0',
    title: transactionTokens.groupedCard.text.title,

    // Metadata row
    metadata: `flex items-center ${transactionTokens.groupedCard.spacing.contentGap} mt-0.5`,
    metadataText: transactionTokens.groupedCard.text.metadata,
    metadataSecondary: transactionTokens.groupedCard.text.metadataSecondary,
    separator: transactionTokens.groupedCard.text.separator,

    // Badge
    badge: transactionTokens.groupedCard.badge.base,

    // Right section (amount)
    rightSection: 'text-right shrink-0',
    amount: transactionTokens.groupedCard.text.amount,
    amountSecondary: transactionTokens.groupedCard.text.amountSecondary,
    deleteLayerStyle: (isOpen: boolean, actionWidth: number): CSSProperties => ({
      width: `${actionWidth}px`,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
    }),
    motionStyle: (x: MotionValue<number>) => ({ x }),
  },
  dayList: {
    container: "space-y-6",
    sectionHeader: "mb-4",
    viewAllWrap: "flex justify-center mt-6",
    viewAllButton: "group",
    viewAllLabel: "mr-2 text-primary",
    viewAllArrow: "group-hover:translate-x-0.5 transition-transform duration-200 text-primary",
    skeleton: {
      container: "space-y-6",
      header: "mb-4",
      headerTitle: "h-5 w-40 bg-primary/15 rounded animate-pulse",
      headerSubtitle: "h-4 w-32 bg-primary/10 rounded animate-pulse mt-1",
      group: "space-y-3",
      groupHeader: "flex justify-between items-center",
      groupTitle: "h-4 w-24 bg-primary/15 rounded animate-pulse",
      groupTotal: "text-right",
      groupTotalLine: "h-4 w-16 bg-primary/15 rounded animate-pulse",
      groupTotalSub: "h-3 w-20 bg-primary/10 rounded animate-pulse mt-1",
      card: "bg-card rounded-xl border border-primary/20 p-3 space-y-3",
      row: "flex items-center gap-3",
      rowIcon: "w-10 h-10 rounded-lg bg-primary/12 animate-pulse",
      rowBody: "flex-1 space-y-2",
      rowTitle: "h-4 w-32 bg-primary/15 rounded animate-pulse",
      rowSubtitle: "h-3 w-20 bg-primary/10 rounded animate-pulse",
      rowAmount: "h-5 w-16 bg-primary/15 rounded animate-pulse",
    },
  },
};

// ====================================
// Dynamic Style Generators
// ====================================

/**
 * Get styles based on transaction type
 */
export function getTransactionTypeStyles(type: 'expense' | 'income' | 'transfer') {
  return transactionTokens.type[type];
}

/**
 * Get amount text styles based on transaction type
 */
export function getAmountStyles(type: 'expense' | 'income' | 'transfer') {
  const typeStyles = transactionTokens.type[type];
  return {
    text: typeStyles.text,
    prefix: type === 'expense' ? '-' : type === 'income' ? '+' : '',
  };
}

/**
 * Get icon background styles based on transaction type
 */
export function getIconStyles(type: 'expense' | 'income' | 'transfer') {
  return transactionTokens.type[type].icon;
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
  return amount >= 0 ? 'text-success' : 'text-destructive';
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
    if (daysUntilDue <= 1) return transactionTokens.contextColors.due.urgent;
    if (daysUntilDue <= 3) return transactionTokens.contextColors.due.warning;
    return transactionTokens.contextColors.due.normal;
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
    if (daysUntilDue <= 1) return transactionTokens.contextColors.dueBadge.urgent;
    if (daysUntilDue <= 3) return transactionTokens.contextColors.dueBadge.warning;
    return transactionTokens.contextColors.dueBadge.normal;
  }
  return '';
}
