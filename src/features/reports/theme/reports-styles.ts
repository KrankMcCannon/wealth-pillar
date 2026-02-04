import { typographyStyles, radiusStyles, shadowStyles } from '@/styles/system';

export const reportsStyles = {
  page: {
    container: 'relative flex w-full min-h-[100svh] flex-col bg-card text-primary',
    style: { fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' },
  },
  main: {
    container: 'px-3 sm:px-4 py-4 pb-20 space-y-6 sm:space-y-8 max-w-7xl mx-auto',
  },

  // --- HEADER & SELECTORS ---
  header: {
    container: 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between space-y-2',
    title: typographyStyles.heading,
    controls: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto',
    selectTrigger:
      'w-full sm:w-[180px] bg-card/50 backdrop-blur-sm border-primary/10 hover:bg-primary/5 transition-colors text-primary',
    iconButton: 'h-10 w-10 text-primary/70 hover:text-primary transition-colors',
  },

  // --- SUMMARY SECTION ---
  summary: {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    card: `py-3 relative overflow-hidden bg-card/80 backdrop-blur-md border border-primary/10 ${radiusStyles.xl} ${shadowStyles.card} hover:bg-card/90 transition-all duration-300 group`,
    cardHeader: 'flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative',
    cardTitle: 'text-sm font-medium capitalize text-primary/70 tracking-wide',
    cardIcon: 'h-4 w-4 text-primary/40 group-hover:text-primary transition-colors',
    cardContent: 'z-10 relative',
    balance: `text-2xl sm:text-3xl font-bold tracking-tight text-primary mt-1 mb-3`,
    metricsGrid: 'grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-primary/10',
    metricRow: 'flex flex-col gap-0.5',
    metricLabel: 'text-[10px] uppercase font-semibold text-primary/70',
    metricValueIncome: 'text-sm font-semibold text-emerald-600 dark:text-emerald-400',
    metricValueExpense: 'text-sm font-semibold text-red-600 dark:text-red-400',
    gradientBg:
      'absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none',
  },

  // --- PERIODS SECTION ---
  periods: {
    sectionTitle: 'text-lg font-semibold text-primary flex items-center gap-2',
    grid: 'grid gap-4 md:grid-cols-2 xl:grid-cols-3',
    card: `bg-card border border-primary/20 ${radiusStyles.lg} overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200 flex flex-col`,

    // Header
    cardHeader: 'p-4 bg-primary/5 border-b border-primary/20 flex items-start justify-between',
    cardTitleDetails: 'flex flex-col',
    cardTitle: 'font-semibold text-primary text-base',
    cardHeaderMetrics: 'text-right flex flex-col items-end gap-1',
    netLabel: 'text-[10px] uppercase font-bold text-primary/70',
    netValue: 'text-sm font-bold bg-primary/10 px-2 py-0.5 rounded-full text-primary',

    // Content
    cardContent: 'p-4 sm:p-5 space-y-5 flex-1',

    // Global Metrics (Income vs Expense)
    globalMetrics: 'grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5',
    globalMetricIncome:
      'flex flex-col gap-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20',
    globalMetricExpense:
      'flex flex-col gap-1.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20',
    globalMetricNet: 'flex flex-col gap-1.5 p-3 rounded-xl bg-primary/10 border border-primary/20',
    globalLabel: 'text-[11px] uppercase tracking-wider text-primary/70 font-semibold',
    globalValueIncome: 'text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums',
    globalValueExpense: 'text-lg font-bold text-red-600 dark:text-red-400 tabular-nums',
    globalValueNet: 'text-lg font-bold text-primary tabular-nums',

    // Account Types Breakdown
    breakdownContainer: 'space-y-3',
    breakdownTitle: 'text-[10px] font-bold uppercase tracking-wider text-primary/60 mb-3 px-1',
    breakdownList: 'space-y-3',
    breakdownItem:
      'grid grid-cols-2 sm:grid-cols-12 items-center gap-3 sm:gap-4 p-3 rounded-lg bg-card border border-primary/10 hover:border-primary/30 hover:shadow-sm transition-all',
    breakdownType:
      'col-span-2 sm:col-span-3 flex items-center gap-2.5 font-medium text-sm text-primary',
    breakdownDot: 'w-2.5 h-2.5 rounded-full ring-2 ring-background',
    breakdownBalance:
      'col-span-2 sm:col-span-2 flex flex-col items-center justify-center text-[11px] text-primary font-mono tabular-nums mt-1 sm:mt-0 whitespace-nowrap',

    // Flows: Full width on mobile, wider on desktop
    breakdownFlows:
      'col-span-2 sm:col-span-4 flex flex-col items-center sm:items-end gap-1 text-primary/80 font-medium tabular-nums sm:pr-2',
    breakdownIn: 'text-emerald-600/90 dark:text-emerald-400/90',
    breakdownOut: 'text-red-600/90 dark:text-red-400/90',

    // Net Badge: Full width on mobile, narrower on desktop
    breakdownNetBadge:
      'col-span-2 sm:col-span-3 justify-self-start sm:justify-self-end px-2.5 py-1 rounded-md text-[11px] font-bold tabular-nums min-w-[70px] text-center w-full sm:w-auto mt-2 sm:mt-0 whitespace-nowrap',
    breakdownNetPositive:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
    breakdownNetNegative: 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
    breakdownNetNeutral: 'bg-primary/10 text-primary border border-primary/20',
  },

  // --- CATEGORIES SECTION ---
  categories: {
    grid: 'grid gap-6 grid-cols-2',
    col: 'space-y-4',
    colHeader: 'flex items-center justify-between',
    colTitle: 'font-semibold text-primary',
    colTotal: 'text-sm font-bold text-primary/80',

    list: 'space-y-3',
    item: `flex items-center justify-between p-3 rounded-xl border border-transparent hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group`,
    itemLeft: 'flex items-center gap-3',
    iconBox:
      'w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-sm border border-primary/10',
    itemDetails: 'flex flex-col',
    itemName: 'text-sm font-medium text-primary group-hover:text-primary transition-colors',
    itemPercent: 'text-[10px] text-primary/60',
    itemAmount: 'font-semibold text-sm text-primary tabular-nums',

    // Bar visual
    barContainer: 'h-1.5 w-full bg-primary/10 rounded-full mt-2 overflow-hidden',
    barFill: 'h-full rounded-full opacity-80',
  },
};
