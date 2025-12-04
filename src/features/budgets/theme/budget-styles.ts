/**
 * Budget Feature Style Utilities
 * Reusable style combinations using design tokens
 *
 * This file exports className strings grouped by component.
 * Modify styles in one place and they apply everywhere.
 *
 * Usage:
 * import { budgetStyles } from '@/features/budgets/theme/budget-styles';
 * className={budgetStyles.header.container}
 */

import { budgetComponents, budgetSpacing, budgetStatus } from './budget-tokens';

export type BudgetStatus = 'safe' | 'warning' | 'danger';

export const budgetStyles = {
  // ====================================
  // Page-level styles
  // ====================================
  page: {
    container: `relative flex size-full min-h-dvh flex-col bg-card`,
    main: `flex-1 ${budgetSpacing.page.mobile} ${budgetSpacing.page.tablet} space-y-4 sm:space-y-6 pb-20 sm:pb-24`,
  },

  // ====================================
  // Header styles
  // ====================================
  header: {
    container: budgetComponents.header.container,
    inner: 'flex items-center justify-between',
    title: budgetComponents.header.title,
    button: budgetComponents.header.button,
  },

  // ====================================
  // User Selector
  // ====================================
  userSelector: {
    container: 'sticky top-12 z-10 bg-card/80 backdrop-blur-sm border-b border-primary/20 px-4 py-2',
  },

  // ====================================
  // Budget Selection Section
  // ====================================
  selectionSection: budgetComponents.card.base,
  sectionHeader: {
    container: 'mb-4',
  },

  // ====================================
  // Budget Selector Dropdown
  // ====================================
  selector: {
    trigger: budgetComponents.select.trigger,
    content: budgetComponents.select.content,
    item: budgetComponents.select.item,
    itemContent: 'flex items-center gap-3 w-full',
    itemIcon: 'flex items-center justify-center w-9 h-9 rounded-lg bg-[#7578EC]/10 shrink-0 group-hover:bg-white/10',
    itemIconContent: 'text-[#7578EC] group-hover:text-white',
    itemText: 'font-semibold truncate group-hover:text-white',
    itemSubtext: 'text-xs shrink-0 group-hover:text-white',
  },

  // ====================================
  // Budget Display Card
  // ====================================
  budgetDisplay: {
    container: 'bg-primary/10 rounded-xl p-4 relative',
    actionsMenu: 'absolute top-3 right-3',
    actionsButton: 'h-8 w-8 p-0 hover:bg-primary/20 rounded-lg transition-colors',
    headerRow: 'flex items-center justify-between gap-3 mb-4 pr-10',
    headerContent: 'flex items-center gap-3 flex-1 min-w-0',
    iconContainer: 'flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shadow-sm shrink-0',
    iconText: 'flex-1 min-w-0',
    budgetName: 'text-lg font-bold leading-tight truncate',
    budgetStatus: 'text-xs font-medium',
    periodContainer: 'text-right shrink-0',
    periodLabel: 'text-xs font-semibold uppercase tracking-wide',
    periodValue: 'text-xs font-medium whitespace-nowrap',
  },

  // ====================================
  // Financial Metrics
  // ====================================
  metrics: {
    container: budgetComponents.metrics.container,
    item: budgetComponents.metrics.item,
    label: budgetComponents.metrics.label,
    value: budgetComponents.metrics.value,
    valueSafe: 'text-primary',
    valueDanger: 'text-destructive',
  },

  // ====================================
  // Progress Section
  // ====================================
  progress: {
    container: budgetComponents.progress.container,
    header: 'flex justify-between items-center',
    indicator: 'w-2 h-2 rounded-full',
    indicatorSafe: 'bg-primary',
    indicatorWarning: 'bg-warning',
    indicatorDanger: 'bg-red-500',
    label: 'text-sm font-semibold',
    percentage: 'text-xl font-bold',
    percentageSafe: 'text-primary',
    percentageWarning: 'text-warning',
    percentageDanger: 'text-destructive',
    barContainer: budgetComponents.progress.bar,
    barFill: budgetComponents.progress.fill,
    barFillSafe: 'bg-linear-to-r from-green-400 to-green-500',
    barFillWarning: 'bg-linear-to-r from-amber-400 to-amber-500',
    barFillDanger: 'bg-linear-to-r from-red-500 to-red-600',
    status: 'text-center',
    statusText: 'text-xs',
  },

  // ====================================
  // Chart Section
  // ====================================
  chart: {
    card: 'p-0 bg-card shadow-sm rounded-2xl border border-primary/20 overflow-hidden',
    header: 'px-6 pt-5 pb-2 flex items-start justify-between',
    headerLabel: 'text-xs mb-1',
    headerAmount: 'text-2xl font-bold',
    comparisonContainer: 'px-3 py-1.5 rounded-lg',
    comparisonNegative: 'bg-red-50',
    comparisonPositive: 'bg-green-50',
    comparisonText: 'text-sm font-semibold',
    comparisonTextNegative: 'text-destructive',
    comparisonTextPositive: 'text-primary',
    svgContainer: budgetComponents.chart.container,
    dayLabels: budgetComponents.chart.labels,
    dayLabel: budgetComponents.chart.label,
  },

  // ====================================
  // Transactions Section
  // ====================================
  transactions: {
    container: 'space-y-6',
    dayGroup: undefined, // Defined below
    dayHeader: budgetComponents.transactionGroup.header,
    dayTitle: budgetComponents.transactionGroup.title,
    dayStats: 'text-right',
    dayStatsTotal: 'flex items-center gap-2 justify-end',
    dayStatsTotalLabel: 'text-sm',
    dayStatsTotalValue: budgetComponents.transactionGroup.total,
    dayStatsTotalValueNegative: 'text-destructive',
    dayStatsTotalValuePositive: 'text-primary',
    dayStatsCount: 'text-xs mt-0.5',
    emptyMessage: 'text-center py-8',
    seeAllButton: budgetComponents.button.primary,
    seeAllButtonContainer: 'flex justify-center mt-6',
  },

  // ====================================
  // Empty State
  // ====================================
  emptyState: {
    container: budgetComponents.emptyState.container,
    icon: budgetComponents.emptyState.icon,
    iconContent: 'w-8 h-8 text-[#7578EC]',
    title: budgetComponents.emptyState.title,
    text: budgetComponents.emptyState.text,
  },

  // ====================================
  // Dropdown Menu
  // ====================================
  dropdownMenu: {
    content: budgetComponents.dropdown.content,
    item: budgetComponents.dropdown.item,
    itemWithIcon: 'flex items-center',
    itemIcon: 'mr-2',
  },

  // ====================================
  // Loading Skeletons
  // ====================================
  skeleton: {
    base: 'animate-pulse',
    card: 'bg-card rounded-xl p-4 sm:p-6',
    line: 'h-4 bg-primary/15 rounded',
    lineShort: 'w-1/3 h-4 bg-primary/15 rounded',
    lineMedium: 'w-2/3 h-4 bg-primary/15 rounded',
    circle: 'rounded-full bg-primary/12',
    rect: 'rounded bg-primary/12',
  },

  // ====================================
  // Status Badge
  // ====================================
  statusBadge: {
    safe: 'bg-primary/10 text-primary',
    warning: 'bg-warning/10 text-warning',
    danger: 'bg-destructive/10 text-destructive',
  },
};

// ====================================
// Dynamic Style Generators
// ====================================

/**
 * Get styles based on budget status
 */
export function getStatusStyles(status: BudgetStatus) {
  return budgetStatus[status];
}

/**
 * Get metrics item styles with optional value color
 */
export function getMetricsItemStyles(isNegative?: boolean) {
  return {
    container: budgetStyles.metrics.item,
    label: budgetStyles.metrics.label,
    value: `${budgetStyles.metrics.value} ${isNegative ? budgetStyles.metrics.valueDanger : budgetStyles.metrics.valueSafe}`,
  };
}

/**
 * Get progress indicator styles based on status
 */
export function getProgressIndicatorStyles(status: BudgetStatus) {
  const baseStyles = budgetStyles.progress.indicator;
  const statusStyles = {
    safe: budgetStyles.progress.indicatorSafe,
    warning: budgetStyles.progress.indicatorWarning,
    danger: budgetStyles.progress.indicatorDanger,
  };
  return `${baseStyles} ${statusStyles[status]}`;
}

/**
 * Get progress bar fill styles based on status
 */
export function getProgressBarFillStyles(status: BudgetStatus, percentage: number) {
  const baseStyles = budgetStyles.progress.barFill;
  const statusStyles = {
    safe: budgetStyles.progress.barFillSafe,
    warning: budgetStyles.progress.barFillWarning,
    danger: budgetStyles.progress.barFillDanger,
  };
  return {
    className: `${baseStyles} ${statusStyles[status]}`,
    style: { width: `${Math.min(percentage, 100)}%` },
  };
}

/**
 * Get comparison badge styles
 */
export function getComparisonStyles(isHigher: boolean) {
  return {
    container: `${budgetStyles.chart.comparisonContainer} ${isHigher ? budgetStyles.chart.comparisonNegative : budgetStyles.chart.comparisonPositive}`,
    text: `${budgetStyles.chart.comparisonText} ${isHigher ? budgetStyles.chart.comparisonTextNegative : budgetStyles.chart.comparisonTextPositive}`,
  };
}
