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
    sectionTitle: 'text-base md:text-lg font-semibold text-primary flex items-center gap-2',
    usersGrid: 'grid grid-cols-1 gap-5 md:grid-cols-[var(--reports-user-columns)]',
    userColumn:
      'space-y-4 rounded-2xl border border-primary/15 bg-card/40 p-3 backdrop-blur-sm shadow-sm',
    userHeader: 'flex items-center gap-3 border-b border-primary/15 pb-3',
    userAvatar:
      'flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary',
    userName: 'text-base font-semibold text-primary',
    userPeriods: 'space-y-4',
    card: `overflow-hidden rounded-2xl border border-primary/20 bg-card/80 ${shadowStyles.card} transition-all duration-200 hover:border-primary/35 hover:shadow-md`,
    cardHeader:
      'flex items-center justify-between gap-3 border-b border-primary/15 bg-primary/5 px-4 py-3',
    cardTitleDetails: 'min-w-0',
    cardTitle: 'truncate text-sm font-semibold text-primary md:text-base',
    cardNet:
      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums whitespace-nowrap',
    cardNetPositive:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    cardNetNegative: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400',
    cardNetNeutral: 'border-primary/20 bg-primary/10 text-primary',
    cardContent: 'space-y-4 p-3',
    globalMetrics: 'space-y-2',
    globalTotalsRow: 'grid grid-cols-1 gap-2',
    globalMetricIncome:
      'rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex items-center justify-between gap-3 min-w-0',
    globalMetricExpense:
      'rounded-xl border border-red-500/20 bg-red-500/10 p-3 flex items-center justify-between gap-3 min-w-0',
    globalMetricNet:
      'rounded-xl border border-primary/20 bg-primary/10 p-3 flex items-center justify-between gap-3 min-w-0',
    globalNetRow: 'flex justify-end',
    globalLabel: 'text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap',
    globalLabelIncome: 'text-emerald-700/85 dark:text-emerald-300/85',
    globalLabelExpense: 'text-red-700/85 dark:text-red-300/85',
    globalLabelNet: 'text-primary/80',
    globalValueIncome:
      'text-sm lg:text-base font-bold tabular-nums leading-tight text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-right',
    globalValueExpense:
      'text-sm lg:text-base font-bold tabular-nums leading-tight text-red-600 dark:text-red-400 whitespace-nowrap text-right',
    globalValueNet:
      'text-sm lg:text-base font-bold tabular-nums leading-tight text-primary whitespace-nowrap text-right',
    breakdownContainer: 'space-y-3',
    breakdownTitle: 'px-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary/65',
    breakdownList: 'space-y-2.5',
    breakdownItem:
      'rounded-xl border border-primary/15 bg-card/70 p-3 transition-colors hover:border-primary/30',
    breakdownHeader: 'flex items-center gap-3',
    breakdownType: 'flex items-center gap-2 text-sm font-semibold text-primary',
    breakdownDot: 'h-2.5 w-2.5 rounded-full ring-2 ring-background',
    breakdownStats: 'mt-2.5 grid grid-cols-1 gap-2',
    breakdownStat:
      'rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-2 min-w-0 overflow-hidden',
    breakdownStatRow: 'grid grid-cols-[1fr_auto] items-center gap-2',
    breakdownMetricLabel: 'text-[10px] uppercase tracking-wide text-primary/60 whitespace-nowrap',
    breakdownBalanceStack: 'flex flex-col items-center leading-tight gap-0.5',
    breakdownAmount:
      'text-[11px] lg:text-sm font-semibold tabular-nums leading-tight text-primary whitespace-nowrap',
    breakdownBalanceArrow: 'text-[10px] text-primary/45',
    breakdownIn:
      'text-[11px] lg:text-sm font-semibold tabular-nums leading-tight text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-right min-w-[6.75rem]',
    breakdownOut:
      'text-[11px] lg:text-sm font-semibold tabular-nums leading-tight text-red-600 dark:text-red-400 whitespace-nowrap text-right min-w-[6.75rem]',
    breakdownNetBadge:
      'mt-3 inline-flex max-w-full items-center rounded-md border px-2.5 py-1 text-xs font-semibold tabular-nums leading-tight',
    breakdownNetRow: 'mt-2 flex justify-end',
    breakdownNetPositive:
      'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    breakdownNetNegative: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-400',
    breakdownNetNeutral: 'border-primary/20 bg-primary/10 text-primary',
  },

  // --- CATEGORIES SECTION ---
  categories: {
    grid: 'grid gap-6 grid-cols-2',
    col: 'space-y-4',
    colHeader: 'flex items-center justify-between',
    colTitle: 'font-semibold text-primary',
    colTotal: 'text-sm font-bold text-primary/80',

    list: 'space-y-3',
    item: `flex items-center justify-between rounded-xl border border-transparent hover:bg-primary/5 hover:border-primary/20 transition-all duration-200 group`,
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
