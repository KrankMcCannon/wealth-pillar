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

import { budgetTokens } from './budget-tokens';
import { coreTokens } from '@/styles/core-tokens';

export type BudgetStatus = 'safe' | 'warning' | 'danger';

export const budgetStyles = {
  // ====================================
  // Page-level styles
  // ====================================
  page: {
    container: `relative flex size-full min-h-dvh flex-col bg-card`,
    main: `flex-1 ${coreTokens.spacing.page.mobile} ${coreTokens.spacing.page.tablet} space-y-4 sm:space-y-6 pb-14`,
  },

  // ====================================
  // Header styles
  // ====================================
  header: {
    container: budgetTokens.components.header.container,
    inner: 'flex items-center justify-between',
    title: budgetTokens.components.header.title,
    button: budgetTokens.components.header.button,
  },

  // ====================================
  // User Selector
  // ====================================
  userSelector: {
    container: 'sticky top-12 z-10 bg-card/80 backdrop-blur-sm border-b border-primary/20 px-4 py-2',
    className: 'bg-card border-border',
  },

  // ====================================
  // Budget Selection Section
  // ====================================
  selectionSection: budgetTokens.components.card.base,
  sectionHeader: {
    container: 'mb-4',
    titleSpacing: 'space-y-1',
  },

  // ====================================
  // Budget Selector Dropdown
  // ====================================
  selector: {
    wrapper: 'mb-4',
    placeholder: 'text-primary/50',
    trigger: budgetTokens.components.select.trigger,
    content: budgetTokens.components.select.content,
    item: `${budgetTokens.components.select.item} pl-7 data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[state=checked]:bg-primary/15 data-[state=checked]:border data-[state=checked]:border-primary/25 data-[state=checked]:text-primary`,
    itemContent: 'flex items-center gap-2.5 w-full',
    itemIcon: 'flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0 group-hover:bg-primary/15 group-data-[state=checked]:bg-primary/20',
    itemIconContent: 'text-primary group-hover:text-primary group-data-[state=checked]:text-primary',
    itemTextRow: 'flex items-center gap-1.5 min-w-0',
    itemText: 'text-sm sm:text-base font-semibold truncate group-hover:text-primary',
    itemChip: 'text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap group-hover:bg-primary/15 group-hover:text-primary group-data-[state=checked]:bg-primary/20 group-data-[state=checked]:text-primary',
    itemSubtext: 'text-xs shrink-0 group-hover:text-primary',
  },

  // ====================================
  // Budget Display Card
  // ====================================
  budgetDisplay: {
    container: 'bg-primary/10 rounded-xl p-3 sm:p-4 relative',
    actionsMenu: 'absolute top-2 right-2',
    actionsButton: 'h-8 w-8 p-0 hover:bg-primary/20 rounded-lg transition-colors',
    actionIcon: 'h-4 w-4',
    headerRow: 'flex flex-col gap-3 mb-3 pr-10 sm:flex-row sm:items-center sm:justify-between',
    headerContent: 'flex items-center gap-3 flex-1 min-w-0',
    iconContainer: 'flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 shadow-sm shrink-0',
    iconText: 'flex-1 min-w-0',
    iconClass: 'text-primary h-4 w-4',
    budgetName: 'text-base sm:text-lg font-bold leading-tight truncate',
    budgetStatus: 'text-xs font-medium text-primary/70',
    periodContainer: 'text-left sm:text-right shrink-0',
    periodLabel: 'text-[10px] font-semibold uppercase tracking-wide text-black pl-1',
    periodValue: 'text-xs font-medium whitespace-nowrap text-black pl-1',
  },

  // ====================================
  // Financial Metrics
  // ====================================
  metrics: {
    container: budgetTokens.components.metrics.container,
    item: budgetTokens.components.metrics.item,
    label: budgetTokens.components.metrics.label,
    value: budgetTokens.components.metrics.value,
    labelDestructive: `${budgetTokens.components.metrics.label} text-destructive`,
    valueSafe: 'text-primary',
    valueDanger: 'text-destructive',
    fallbackGrid: 'grid grid-cols-2 gap-4',
  },

  // ====================================
  // Progress Section
  // ====================================
  progress: {
    container: budgetTokens.components.progress.container,
    header: 'flex justify-between items-center',
    indicatorRow: 'flex items-center gap-2',
    indicator: 'w-2 h-2 rounded-full',
    indicatorSafe: 'bg-primary',
    indicatorWarning: 'bg-warning',
    indicatorDanger: 'bg-red-500',
    label: 'text-sm font-semibold',
    percentage: 'text-xl font-bold',
    percentageSafe: 'text-primary',
    percentageWarning: 'text-warning',
    percentageDanger: 'text-destructive',
    barWrapper: 'relative',
    barContainer: budgetTokens.components.progress.bar,
    barFill: budgetTokens.components.progress.fill,
    barFillBase: 'h-full rounded-full transition-all duration-500',
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
    svgContainer: budgetTokens.components.chart.container,
    svg: 'w-full h-full',
    dayLabels: budgetTokens.components.chart.labels,
    dayLabel: budgetTokens.components.chart.label,
    dayRow: 'flex justify-between relative',
    dayLabelVisible: 'text-black/70',
    dayLabelHidden: 'text-transparent',
    dayLabelPosition: 'absolute',
  },

  // ====================================
  // Transactions Section
  // ====================================
  transactions: {
    container: 'space-y-6',
    dayGroup: undefined, // Defined below
    dayHeader: budgetTokens.components.transactionGroup.header,
    dayTitle: budgetTokens.components.transactionGroup.title,
    dayStats: 'text-right',
    dayStatsTotal: 'flex items-center gap-2 justify-end',
    dayStatsTotalLabel: 'text-sm',
    dayStatsTotalValue: budgetTokens.components.transactionGroup.total,
    dayStatsTotalValueNegative: 'text-destructive',
    dayStatsTotalValuePositive: 'text-primary',
    dayStatsCount: 'text-xs mt-0.5',
    emptyMessage: 'text-center py-8',
    seeAllButton: budgetTokens.components.button.primary,
    seeAllButtonContainer: 'flex justify-center mt-6',
  },

  // ====================================
  // Empty State
  // ====================================
  emptyState: {
    container: budgetTokens.components.emptyState.container,
    icon: budgetTokens.components.emptyState.icon,
    iconContent: 'w-8 h-8 text-[#7578EC]',
    title: budgetTokens.components.emptyState.title,
    text: budgetTokens.components.emptyState.text,
  },

  // ====================================
  // Dropdown Menu
  // ====================================
  dropdownMenu: {
    content: budgetTokens.components.dropdown.content,
    item: budgetTokens.components.dropdown.item,
    contentWide: 'w-48 bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-xl p-2',
    itemBase: 'text-sm font-medium rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
    itemEdit: 'hover:bg-primary/8 hover:text-primary',
    itemDelete: 'text-destructive hover:bg-destructive/10 hover:text-destructive',
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
    budgetCard: 'p-4 rounded-xl border border-primary/20 bg-card',
    budgetCardRow: 'flex items-center gap-3 mb-3',
    budgetCardIcon: 'w-10 h-10 bg-primary/10 rounded-xl',
    budgetCardBody: 'flex-1',
    budgetCardTitle: 'h-4 bg-primary/15 rounded w-2/3 mb-2',
    budgetCardMetaRow: 'flex items-center gap-2',
    budgetCardDot: 'w-2 h-2 bg-primary/25 rounded-full',
    budgetCardMeta: 'h-3 bg-primary/15 rounded w-8',
    budgetCardRight: 'text-right',
    budgetCardAmount: 'h-4 bg-primary/15 rounded w-16 mb-1',
    budgetCardSubAmount: 'h-3 bg-primary/15 rounded w-12',
    budgetCardBar: 'w-full h-2 bg-primary/12 rounded-full',
    detailsCard: 'p-6 rounded-xl border border-primary/20 bg-card space-y-4',
    detailsHeader: 'flex items-center justify-between',
    detailsLeft: 'text-left',
    detailsTitle: 'h-6 bg-primary/15 rounded w-32 mb-2',
    detailsSubtitle: 'h-4 bg-primary/15 rounded w-24',
    detailsRight: 'text-right',
    detailsAmount: 'h-8 bg-primary/15 rounded w-20 mb-1',
    detailsAmountSub: 'h-3 bg-primary/15 rounded w-16',
    detailsBar: 'w-full h-3 bg-primary/12 rounded-full',
    detailsStats: 'grid grid-cols-2 gap-4 pt-4 border-t border-primary/20',
    detailsStatLabel: 'h-3 bg-primary/15 rounded w-16 mb-1',
    detailsStatValue: 'h-5 bg-primary/15 rounded w-20',
    txCard: 'p-3 rounded-lg border border-primary/20 bg-card',
    txRow: 'flex items-center gap-3',
    txIcon: 'w-8 h-8 bg-primary/10 rounded-lg',
    txBody: 'flex-1',
    txTitle: 'h-4 bg-primary/15 rounded w-3/4 mb-1',
    txMeta: 'h-3 bg-primary/15 rounded w-1/2',
    txRight: 'text-right',
    txAmount: 'h-4 bg-primary/15 rounded w-16 mb-1',
    txAmountSub: 'h-3 bg-primary/15 rounded w-12',
    page: 'flex flex-col min-h-screen bg-card',
    pageHeader: 'sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-4 py-3 shadow-sm',
    pageHeaderRow: 'flex items-center justify-between',
    pageHeaderLeft: 'flex items-center gap-3',
    pageHeaderIcon: 'w-8 h-8 bg-primary/12 rounded-xl animate-pulse',
    pageHeaderText: 'h-5 bg-primary/15 rounded w-16 mb-1 animate-pulse',
    pageHeaderSubtext: 'h-3 bg-primary/15 rounded w-20 animate-pulse',
    pageHeaderAction: 'w-8 h-8 bg-primary/12 rounded-xl animate-pulse',
    selectorSection: 'bg-card/80 backdrop-blur-xl py-3 border-b border-primary/20 shadow-sm',
    selectorList: 'flex items-center gap-2 pl-4',
    selectorListStyle: { height: 44 },
    selectorItem: 'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10 animate-pulse',
    selectorIcon: 'w-5 h-5 bg-primary/25 rounded-full',
    selectorText: 'w-12 h-3 bg-primary/20 rounded',
    pageMain: 'flex-1 p-4 pb-20',
    pageMainBody: 'space-y-6',
    pageSectionTitle: 'h-6 bg-primary/15 rounded w-32 mb-2 animate-pulse',
    pageSectionSubtitle: 'h-4 bg-primary/15 rounded w-24 animate-pulse',
    pageDetails: 'space-y-4',
    pageDetailsActions: 'flex gap-2',
    pageDetailsAction: 'h-10 bg-primary/12 rounded-lg flex-1 animate-pulse',
  },
  loading: {
    header: 'sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-3',
    title: 'h-6 w-32 bg-slate-200 rounded animate-pulse',
    content: 'space-y-6 px-4 py-6',
    details: 'space-y-4',
  },

  // ====================================
  // Budget Section (Dashboard)
  // ====================================
  section: {
    container: 'bg-card',
    emptyContainer: 'bg-card rounded-2xl p-8 text-center border border-primary/20 shadow-sm',
    emptyIconWrap: 'flex size-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary/10 to-primary/5 mx-auto mb-4 shadow-sm',
    emptyIconInner: 'w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center',
    emptyIconText: 'text-primary font-bold text-lg',
    emptyTitle: 'font-semibold text-primary mb-2',
    emptyDescription: 'text-sm text-black/70 mb-4 max-w-sm mx-auto',
    emptyButton: 'inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 hover:scale-105',
    groupCard: 'bg-card shadow-sm border border-primary/20 rounded-xl overflow-hidden',
    groupHeader: 'bg-card p-3 border-b border-primary/20',
    groupRow: 'flex items-center justify-between mb-2',
    groupLeft: 'flex items-center gap-2',
    avatar: 'flex size-7 items-center justify-center rounded-lg bg-linear-to-br from-primary/10 to-primary/5 shadow-sm',
    avatarText: 'text-xs font-bold text-primary',
    groupText: 'text-sm font-semibold',
    periodText: 'text-xs',
    amount: 'text-sm font-bold',
    amountDivider: 'text-primary/50 font-normal',
    progressRow: 'flex items-center gap-2',
    progressBadge: 'flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10',
    progressBadgeDot: 'w-1.5 h-1.5 rounded-full',
    progressBadgeText: 'text-xs font-bold',
    cardsDivider: 'divide-y divide-primary/10',
    cardSkeleton: 'px-3 py-2 animate-pulse',
    cardSkeletonRow: 'flex items-center gap-3',
    cardSkeletonIcon: 'w-11 h-11 bg-primary/10 rounded-2xl',
    cardSkeletonBody: 'flex-1',
    cardSkeletonTitle: 'h-4 bg-primary/15 rounded w-24 mb-1',
    cardSkeletonSubtitle: 'h-3 bg-primary/15 rounded w-16',
    cardSkeletonRight: 'text-right',
    cardSkeletonAmount: 'h-4 bg-primary/15 rounded w-20 mb-1',
    cardSkeletonSubAmount: 'h-3 bg-primary/15 rounded w-12',
  },

  // ====================================
  // Budget Period Manager
  // ====================================
  periodManager: {
    error: 'px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md',
    body: 'space-y-4',
    userCard: 'rounded-xl p-3 border border-primary/10 bg-card',
    userRow: 'flex items-center gap-2',
    userIconWrap: 'p-1.5 bg-primary/10 rounded-lg',
    userIcon: 'h-4 w-4 text-primary',
    userName: 'text-sm font-bold text-primary',
    periodCard: 'bg-card rounded-xl p-4 border border-primary/10 shadow-sm',
    periodHeader: 'flex items-center gap-2 mb-3',
    periodTitle: 'text-base font-bold text-primary',
    periodContent: 'space-y-3',
    periodRow: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2',
    periodDate: 'text-sm font-medium text-black',
    periodBadge: 'bg-white text-primary shadow-sm self-start sm:self-auto',
    periodBadgeIcon: 'h-3 w-3 mr-1',
    metricsGrid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    metricCardSpent: 'rounded-lg p-3 border border-destructive/20 bg-destructive/5',
    metricCardSaved: 'rounded-lg p-3 border border-primary/20 bg-primary/5',
    metricRow: 'flex items-center gap-1.5 mb-1',
    metricIconSpent: 'h-3 w-3 text-destructive',
    metricIconSaved: 'h-3 w-3 text-primary',
    metricLabelSpent: 'text-xs font-bold text-destructive uppercase tracking-wide',
    metricLabelSaved: 'text-xs font-bold text-primary uppercase tracking-wide',
    metricValueSpent: 'text-base sm:text-lg font-bold text-destructive',
    metricValueSaved: 'text-base sm:text-lg font-bold text-primary',
    dateFieldWrap: 'space-y-2 overflow-hidden',
    alertText: 'text-black font-medium',
  },

  // ====================================
  // Budget Period Card
  // ====================================
  periodCard: {
    container: 'p-4 border border-primary/10 rounded-xl space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow',
    header: 'flex justify-between items-start gap-3',
    headerContent: 'flex-1',
    title: 'text-sm font-medium text-black',
    arrow: 'text-muted-foreground mx-1',
    badge: 'mt-1',
    badgeActive: 'bg-primary text-white mt-1',
    deleteButton: 'h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10',
    deleteIcon: 'h-4 w-4',
    metricsGrid: 'grid grid-cols-2 gap-2',
    metricSpent: 'p-3 bg-destructive/5 rounded-lg border border-destructive/20',
    metricSaved: 'p-3 bg-primary/5 rounded-lg border border-primary/20',
    metricLabelSpent: 'text-xs font-bold text-destructive uppercase tracking-wide mb-1',
    metricLabelSaved: 'text-xs font-bold text-primary uppercase tracking-wide mb-1',
    metricValueSpent: 'text-base font-bold text-destructive',
    metricValueSaved: 'text-base font-bold text-primary',
    categorySection: 'pt-2 border-t border-primary/10',
    categoryTitle: 'text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2',
    categoryList: 'space-y-1.5',
    categoryRow: 'flex justify-between items-center text-sm',
    categoryLabel: 'text-muted-foreground capitalize',
    categoryAmount: 'font-medium text-black',
  },

  // ====================================
  // Budget Period Info
  // ====================================
  periodInfo: {
    emptyText: 'text-xs text-primary/70',
    headerRow: 'flex items-center justify-between gap-2',
    headerLeft: 'flex items-center gap-2',
    headerIcon: 'h-3 w-3 text-primary/70',
    headerText: 'text-xs font-medium text-primary/70',
    badge: 'text-xs font-semibold',
    badgeIcon: 'h-3 w-3 mr-1',
    metricsGrid: 'grid grid-cols-2 gap-3',
    metricSpent: 'bg-primary/5 rounded-lg px-3 py-2 border border-primary/10',
    metricSaved: 'bg-success/5 rounded-lg px-3 py-2 border border-success/10',
    metricLabelSpent: 'text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1',
    metricLabelSaved: 'text-xs font-semibold text-success/70 uppercase tracking-wide mb-1',
    metricValueSpent: 'text-sm font-bold text-destructive',
    metricValueSaved: 'text-sm font-bold text-success',
    topCategories: 'pt-2 border-t border-primary/10',
    topCategoriesTitle: 'text-xs font-semibold text-primary/70 uppercase tracking-wide mb-2',
    topCategoriesList: 'space-y-1',
    topCategoryRow: 'flex items-center justify-between',
    topCategoryLabel: 'text-xs text-primary/70 capitalize',
    topCategoryAmount: 'text-xs font-semibold text-primary',
  },

  // ====================================
  // Budget Periods List
  // ====================================
  periodsList: {
    container: 'space-y-6',
    sectionTitle: 'text-lg font-bold text-black mb-3',
    sectionList: 'space-y-3',
    emptyContainer: 'text-center py-12',
    emptyTitle: 'text-muted-foreground text-base',
    emptySubtitle: 'text-sm text-muted-foreground mt-2',
    deletingToast: 'fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg',
    deletingText: 'text-sm font-medium',
  },

  // ====================================
  // Budget Loading Skeletons
  // ====================================
  loadingSkeletons: {
    header: 'mb-4',
    headerBody: 'flex-1',
    headerAction: 'shrink-0',
    row: 'flex items-center gap-2',
    emptyState: 'text-center',
    section: 'animate-pulse',
    chartHeader: 'px-6 pt-5 pb-2 flex items-start justify-between',
    chartFooter: 'px-6 pb-4 flex justify-between gap-4',
    list: 'space-y-4 sm:space-y-6',
    selectorTitle: 'mb-2 h-6',
    selectorSubtitle: 'h-4',
    selectorBox: 'h-14 rounded-xl',
    budgetCardText: 'flex-1',
    budgetCardTitle: 'h-5 mb-2',
    budgetCardSubtitle: 'h-3',
    budgetCardPeriod: 'shrink-0',
    budgetCardPeriodLine: 'h-3 mb-2',
    budgetCardPeriodValue: 'h-4 w-24',
    progressIndicatorRow: 'flex items-center gap-2',
    progressIndicator: 'w-2 h-2 rounded-full',
    progressValue: 'h-5',
    progressStatus: 'text-center',
    progressStatusLine: 'h-3 w-1/2 mx-auto',
    chartCard: 'p-0 rounded-2xl border border-primary/20 overflow-hidden',
    chartWrap: 'relative',
    chartArea: 'w-full h-32 rounded',
  },

  // ====================================
  // Budget Form Modal
  // ====================================
  formModal: {
    form: 'space-y-2',
    content: 'gap-2',
    error: 'px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md',
    section: 'gap-2',
    sectionTight: 'gap-1 shrink-0',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    categoryField: 'space-y-1',
    categoryBox: 'space-y-3 rounded-2xl border border-primary/15 bg-card/70 p-3',
    categoryHeader: 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
    categorySelect: 'h-9 text-sm',
    categoryMeta: 'flex items-center gap-3 text-xs text-muted-foreground',
    categoryMetaStrong: 'font-medium',
    categoryLink: 'text-primary hover:underline disabled:opacity-40',
    categoryList: 'max-h-60 overflow-y-auto space-y-2 pr-1',
    categoryEmpty: 'text-sm text-muted-foreground px-1 py-4',
    categoryItem: 'flex items-center gap-3 rounded-xl border border-primary/10 bg-card/80 px-3 py-2 text-sm hover:border-primary/40 cursor-pointer',
    categoryItemRow: 'flex items-center gap-2',
    categoryDot: 'h-2.5 w-2.5 rounded-full',
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
  return budgetTokens.status[status];
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

export function getBudgetCategoryColorStyle(color?: string) {
  return { backgroundColor: color || "#CBD5F5" };
}

/**
 * Get dashboard budget section color classes based on percentage
 */
export function getBudgetSectionProgressStyles(percentage: number): {
  amount: string;
  dot: string;
  text: string;
  bar: string;
} {
  if (percentage > 100) {
    return {
      amount: 'text-destructive',
      dot: 'bg-destructive',
      text: 'text-destructive',
      bar: 'bg-destructive',
    };
  }
  if (percentage > 75) {
    return {
      amount: 'text-warning',
      dot: 'bg-warning',
      text: 'text-warning',
      bar: 'bg-warning',
    };
  }
  return {
    amount: 'text-primary',
    dot: 'bg-primary',
    text: 'text-primary',
    bar: 'bg-primary',
  };
}

export function getBudgetGroupCardStyle(index: number) {
  return { animationDelay: `${index * 150}ms` };
}

export function getBudgetSectionProgressBarStyle(percentage: number) {
  return { width: `${Math.min(percentage, 100)}%` };
}

export function getChartGradientStartStyle() {
  return { stopColor: "#7578EC", stopOpacity: 0.08 };
}

export function getChartGradientEndStyle() {
  return { stopColor: "#7578EC", stopOpacity: 0 };
}

export function getChartDayRowStyle() {
  return { width: "100%" };
}

export function getChartDayLabelStyle(position: number) {
  return {
    left: `${position}%`,
    transform: "translateX(-50%)",
    fontVariantNumeric: "tabular-nums",
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
