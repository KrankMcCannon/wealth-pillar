/**
 * Reports Style Utilities
 * Organized by component section for consistency and maintainability
 * Follows design system tokens defined in reports-tokens.ts
 */

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
    label: 'text-xs font-medium text-muted-foreground mb-1',
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
    subtitle: 'text-xs text-muted-foreground mt-1',
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
    categoryAmount: 'text-xs text-muted-foreground mt-0.5',
    progressBar: 'w-full h-2 bg-primary/10 rounded-full overflow-hidden',
    progressFill: 'h-full bg-primary transition-all duration-300 rounded-full',
    percentageText: 'text-xs font-semibold text-muted-foreground',
  },

  // Trend chart
  trendChart: {
    container: 'p-3 sm:p-4 flex flex-col',
    chartArea: 'h-48 sm:h-64 mb-3',
    legend: 'flex items-center justify-center gap-4 flex-wrap text-xs',
    legendItem: 'flex items-center gap-2',
    legendColor: 'w-3 h-3 rounded-full',
    legendLabel: 'text-muted-foreground',
  },

  // Savings goal
  savingsGoal: {
    container: 'p-3 sm:p-4',
    topSection: 'flex items-center justify-between mb-4',
    goalTitle: 'text-base font-semibold text-black',
    goalStatus: 'text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary',
    progressSection: 'space-y-3',
    progressLabel: 'text-sm font-medium text-black flex justify-between',
    progressValue: 'text-xs text-muted-foreground',
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
    accountType: 'text-xs text-muted-foreground mt-0.5',
    accountValue: 'flex flex-col items-end',
    accountAmount: 'text-sm font-semibold text-black',
    accountPercent: 'text-xs text-muted-foreground mt-0.5',
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
    description: 'text-xs text-muted-foreground',
  },

  // Loading states
  skeleton: {
    base: 'animate-pulse bg-primary/10 rounded',
    text: 'h-4 bg-primary/10 rounded w-3/4',
    card: 'h-24 bg-primary/10 rounded-xl',
    line: 'h-2 bg-primary/10 rounded w-full',
  },
};
