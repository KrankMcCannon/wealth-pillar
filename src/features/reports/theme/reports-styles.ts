/**
 * Reports Style Utilities
 * Organized by component section for consistency and maintainability
 * Follows design system tokens defined in reports-tokens.ts
 */

import type { CSSProperties } from "react";

export const reportsStyles = {
  // Page layout
  page: {
    container: 'relative flex size-full min-h-[100dvh] flex-col bg-card',
    style: { fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' },
  },

  // Header section
  header: {
    container:
      'sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 shadow-sm px-3 sm:px-4 py-2 sm:py-3',
    inner: 'flex items-center justify-between',
    button:
      'text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center',
    title: 'text-lg sm:text-xl font-bold tracking-tight text-black',
    spacer: 'min-w-[44px] min-h-[44px]',
  },

  // Main content
  main: {
    container: 'px-3 sm:px-4 py-4 pb-20 space-y-4 sm:space-y-6',
  },

  // Card section
  card: {
    container:
      'gap-0 bg-card/95 backdrop-blur-sm shadow-xl shadow-primary/10 border border-primary/10 rounded-2xl overflow-hidden',
    divider: 'divide-y divide-primary/10',
    dividerLine: 'h-px bg-primary/10',
  },

  // Header info section (month/year selector, export button)
  headerInfo: {
    container: 'flex items-center justify-between',
    title: 'text-lg sm:text-xl font-bold text-black',
    selector: 'flex items-center gap-2',
    button: 'text-primary hover:bg-primary/10 transition-colors duration-200 rounded-lg p-2 min-h-[44px] min-w-[44px]',
  },

  // Overview card
  overview: {
    container: 'p-3 sm:p-4',
    grid: 'grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4',
    item: 'flex flex-col items-start',
    label: 'text-xs font-medium text-primary/70 mb-1',
    value: 'text-lg sm:text-2xl font-bold text-black',
    change: 'text-xs mt-1 flex items-center gap-1',
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-muted-foreground',
  },

  // Section header
  sectionHeader: {
    container: 'mb-2',
    title: 'text-base sm:text-lg font-semibold text-black',
    subtitle: 'text-xs text-primary/70 mt-1',
  },

  // Category breakdown
  categoryBreakdown: {
    container: 'p-3 sm:p-4 space-y-3',
    item: 'flex items-center justify-between gap-3',
    categoryInfo: 'flex items-center gap-3 flex-1 min-w-0',
    categoryIcon:
      'flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0',
    categoryDetails: 'flex-1 min-w-0',
    categoryName: 'text-sm font-semibold text-black truncate',
    categoryAmount: 'text-xs text-primary/70 mt-0.5',
    progressBar: 'w-full h-2 bg-primary/10 rounded-full overflow-hidden',
    progressFill: 'h-full bg-primary transition-all duration-300 rounded-full',
    percentageText: 'text-xs font-semibold text-primary/70',

    // Expandable category section
    categoryRow: 'border-b border-primary/10 last:border-0',
    categoryHeader: 'flex items-center justify-between gap-3 cursor-pointer hover:bg-primary/5 transition-colors duration-200 p-3',
    expandIcon: 'shrink-0',
    expandIconExpanded: 'h-5 w-5 text-primary',
    expandIconCollapsed: 'h-5 w-5 text-primary/60',

    // Transaction list (expandable content)
    transactionList: 'px-3 pb-3 space-y-2 bg-primary/5',
    transactionItem: 'flex items-center justify-between gap-2 p-2 bg-card rounded-lg border border-primary/10',
    transactionContent: 'flex flex-col flex-1 min-w-0',
    transactionDescription: 'text-sm text-black truncate',
    transactionMeta: 'text-xs text-primary/70 mt-0.5',
    transactionAmount: 'text-sm font-semibold text-destructive shrink-0',

    // Empty state for expanded category
    transactionEmpty: 'px-3 pb-3 bg-primary/5',
    transactionEmptyText: 'text-xs text-primary/70 text-center py-2',
  },

  // Trend chart
  trendChart: {
    container: 'p-3 sm:p-4 flex flex-col',
    chartArea: 'h-48 sm:h-64 mb-3',
    legend: 'flex items-center justify-center gap-4 flex-wrap text-xs',
    legendItem: 'flex items-center gap-2',
    legendColor: 'w-3 h-3 rounded-full',
    legendLabel: 'text-primary/70',
  },

  // Savings goal
  savingsGoal: {
    container: 'p-3 sm:p-4',
    topSection: 'flex items-center justify-between mb-4',
    goalTitle: 'text-base font-semibold text-black',
    goalStatus: 'text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary',
    progressSection: 'space-y-3',
    progressLabel: 'text-sm font-medium text-black flex justify-between',
    progressValue: 'text-xs text-primary/70',
    progressBar: 'w-full h-3 bg-primary/10 rounded-full overflow-hidden',
    progressFill: 'h-full bg-primary transition-all duration-300 rounded-full',
    projection: 'p-3 bg-primary/5 rounded-xl border border-primary/10 mt-3',
    projectionLabel: 'text-xs font-medium text-muted-foreground mb-1',
    projectionValue: 'text-sm font-semibold text-black',
  },

  // Account distribution
  accountDistribution: {
    container: 'p-3 sm:p-4 space-y-3',
    item: 'flex items-center justify-between',
    accountInfo: 'flex items-center gap-3 flex-1 min-w-0',
    accountIcon: 'flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0',
    accountDetails: 'flex-1 min-w-0',
    accountName: 'text-sm font-semibold text-black truncate',
    accountType: 'text-xs text-primary/70 mt-0.5',
    accountValue: 'flex flex-col items-end',
    accountAmount: 'text-sm font-semibold text-black',
    accountPercent: 'text-xs text-primary/70 mt-0.5',
  },

  // Action buttons
  actionButtons: {
    container: 'grid grid-cols-2 gap-2 sm:gap-3 p-3 sm:p-4',
    button:
      'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all duration-200 text-sm font-medium',
  },

  // Empty state
  emptyState: {
    container: 'flex flex-col items-center justify-center min-h-[200px] py-8 text-center',
    icon: 'text-primary/20 mb-3',
    title: 'text-base font-semibold text-black mb-1',
    description: 'text-xs text-primary/70',
  },

  // Period Metrics Card
  periodMetricsCard: {
    container: 'overflow-hidden',

    // Tab navigation
    tabContainer: 'flex border-b border-slate-200 dark:border-slate-800',
    tabButton: 'flex-1 px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-2',
    tabActive: 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100',
    tabInactive: 'text-slate-600 dark:text-slate-400 hover:bg-slate-50/50 dark:hover:bg-slate-900/50',
    tabIcon: 'h-4 w-4',

    // Content
    content: 'p-4',
    viewContainer: 'space-y-4',
    description: 'text-xs text-slate-600 dark:text-slate-400',

    // Metric row
    metricRow: 'flex items-center justify-between',
    metricLabel: 'text-sm text-slate-600 dark:text-slate-400',
    metricValueIncome: 'text-emerald-600 dark:text-emerald-400',
    metricValueExpense: 'text-red-600 dark:text-red-400',

    // Internal transfers row
    transfersRow: 'flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800',
    transfersLabel: 'text-xs text-slate-500 dark:text-slate-500',
    transfersValue: 'text-slate-500 dark:text-slate-500',

    // Balance row
    balanceRow: 'flex items-center justify-between pt-3 border-t-2 border-slate-300 dark:border-slate-700',
    balanceLabel: 'text-base font-semibold text-slate-700 dark:text-slate-300',
    balanceValuePositive: 'text-emerald-700 dark:text-emerald-400',
    balanceValueNegative: 'text-red-700 dark:text-red-400',
  },

  // Reports Overview Card
  reportsOverviewCard: {
    container: 'grid grid-cols-2 gap-3 sm:gap-4',

    // Earned card
    earnedCard: 'p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-all',
    earnedIcon: 'flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0',
    earnedValue: 'text-emerald-700 dark:text-emerald-400',
    earnedDescription: 'text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2',

    // Spent card
    spentCard: 'p-4 bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/50 hover:shadow-lg transition-all',
    spentIcon: 'flex items-center justify-center h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0',
    spentValue: 'text-red-700 dark:text-red-400',
    spentDescription: 'text-xs text-red-600/70 dark:text-red-400/70 mt-2',

    // Transferred card
    transferredCard: 'p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all',
    transferredIcon: 'flex items-center justify-center h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0',
    transferredValue: 'text-blue-700 dark:text-blue-400',
    transferredDescription: 'text-xs text-blue-600/70 dark:text-blue-400/70 mt-2',

    // Balance card (conditional styles)
    balanceCard: 'p-4 transition-all hover:shadow-lg',
    balanceCardPositive: 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50',
    balanceCardNegative: 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/50',
    balanceIconPositive: 'flex items-center justify-center h-8 w-8 rounded-lg shrink-0 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    balanceIconNegative: 'flex items-center justify-center h-8 w-8 rounded-lg shrink-0 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    balanceValuePositive: 'text-emerald-700 dark:text-emerald-400',
    balanceValueNegative: 'text-red-700 dark:text-red-400',
    balanceDescriptionPositive: 'text-xs mt-2 text-emerald-600/70 dark:text-emerald-400/70',
    balanceDescriptionNegative: 'text-xs mt-2 text-red-600/70 dark:text-red-400/70',

    // Common
    headerRow: 'flex items-start justify-between mb-3',
    headerContent: 'flex-1',
    iconSize: 'h-4 w-4',
  },

  // Budget Period Card
  budgetPeriodCard: {
    // Card container
    container: 'overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow',

    // Header
    header: 'w-full px-3 py-2.5 flex items-center gap-2 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors',
    headerIcon: 'flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0',
    headerIconSize: 'h-4 w-4',
    headerContent: 'flex-1 text-left min-w-0',
    headerTitleRow: 'flex items-center gap-1.5 flex-wrap',
    headerTitle: 'text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight',
    headerBadge: 'text-xs',
    headerSubtitle: 'text-xs text-slate-500 dark:text-slate-400',
    headerChevronContainer: 'flex items-center gap-1.5 shrink-0',
    headerChevron: 'shrink-0 self-center',
    headerChevronIcon: 'h-5 w-5 text-slate-400',
    headerDetailLabel: 'text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block',

    // Metrics grid
    metricsContainer: 'px-3 pb-3 space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-1.5',

    // Metric card base
    metricCard: 'p-2.5 rounded-lg border',
    metricCardAccount: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700',
    metricCardBudget: 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700',
    metricCardTransfer: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800',

    // Metric header - horizontal layout with icon left, label+amount right
    metricHeader: 'flex items-center gap-1.5',
    metricIconBadge: 'p-1 rounded-md shadow-sm shrink-0',
    metricIconBadgeDefault: 'bg-white dark:bg-slate-800',
    metricIconBadgeTransfer: 'bg-white dark:bg-blue-900',
    metricIcon: 'h-3.5 w-3.5',
    metricIconDefault: 'text-slate-700 dark:text-slate-300',
    metricIconTransfer: 'text-blue-700 dark:text-blue-300',

    // Label and amount stacked vertically, left-aligned
    metricContent: 'flex justify-between items-center gap-0.5 flex-1 min-w-0',
    metricLabel: 'text-[10px] font-medium uppercase tracking-wider leading-none',
    metricLabelDefault: 'text-slate-600 dark:text-slate-400',
    metricLabelTransfer: 'text-blue-700 dark:text-blue-300',

    // Metric value
    metricValue: 'text-lg font-bold leading-none',
    metricValuePositive: 'text-emerald-600 dark:text-emerald-400',
    metricValueNegative: 'text-red-600 dark:text-red-400',
    metricValueTransfer: 'text-blue-700 dark:text-blue-300',
    metricValuePrimary: 'text-primary',
    metricValueIncome: 'text-emerald-500',
    metricValueExpense: 'text-red-500',
    metricValueWarning: 'text-amber-500',

    // Expandable transactions section
    transactionsContainer: 'border-t border-primary/10',
    transactionsBody: 'p-4 bg-card/50',
    transactionsTitle: 'text-xs font-semibold text-muted-foreground mb-3',
    transactionsEmpty: 'text-sm text-muted-foreground text-center py-8',
    transactionsList: 'space-y-2',
    transactionRow: 'flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-primary/5 hover:border-primary/20 transition-colors',
    transactionIconWrap: 'flex items-center justify-center h-9 w-9 rounded-lg shrink-0',
    transactionIcon: 'h-4 w-4',
    transactionBody: 'flex-1 min-w-0',
    transactionTitle: 'text-sm font-medium text-black truncate',
    transactionMetaRow: 'flex items-center gap-2 mt-0.5',
    transactionMeta: 'text-xs text-muted-foreground',
    transactionMetaSeparator: 'text-xs text-muted-foreground/50',
    transactionAmount: 'shrink-0',
  },

  // Budget Periods Section
  budgetPeriodsSection: {
    loadingContainer: 'space-y-3',
    loadingCard: 'h-32 bg-card/50 rounded-2xl animate-pulse border border-primary/10',
    emptyContainer: 'flex flex-col items-center justify-center py-12 px-4 text-center',
    emptyIconWrap: 'flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4',
    emptyIcon: 'h-8 w-8',
    emptyTitle: 'text-lg font-semibold text-black mb-2',
    emptyDescription: 'text-sm text-muted-foreground max-w-sm',
    list: 'space-y-3 sm:space-y-4',
  },

  // Annual Category Section
  annualCategory: {
    container: 'space-y-4',
    card: 'p-4',
    list: 'space-y-4',
    item: 'space-y-1.5',
    row: 'flex items-center justify-between text-sm',
    rowLeft: 'flex items-center gap-2',
    iconWrap: 'p-1 rounded-md shrink-0',
    name: 'font-medium text-black',
    count: 'text-xs text-muted-foreground',
    amount: 'font-semibold',
    bar: 'h-1.5 w-full bg-muted/30 rounded-full overflow-hidden',
    barFill: 'h-full rounded-full transition-all duration-500 ease-out',
  },

  // Loading states
  skeleton: {
    base: 'animate-pulse bg-primary/10 rounded',
    text: 'h-4 bg-primary/10 rounded w-3/4',
    card: 'h-24 bg-primary/10 rounded-xl',
    line: 'h-2 bg-primary/10 rounded w-full',
  },
};

export function getAnnualCategoryIconStyle(color: string): CSSProperties {
  return { backgroundColor: `${color}20`, color };
}

export function getAnnualCategoryBarStyle(color: string, width: number): CSSProperties {
  return { width: `${width}%`, backgroundColor: color };
}

export function getBudgetPeriodTransactionIconStyle(color: string): CSSProperties {
  return {
    backgroundColor: `oklch(from ${color} calc(l + 0.35) c h / 0.15)`,
    color,
  };
}
