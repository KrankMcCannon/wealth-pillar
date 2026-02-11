import {
  typographyStyles,
  radiusStyles,
  glassmorphism,
  vibrantGradients,
  microAnimations,
} from '@/styles/system';

export const reportsStyles = {
  page: {
    container: 'relative flex w-full min-h-[100svh] flex-col bg-background text-foreground',
    style: { fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' },
    gradientBg:
      'fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none z-[-1]',
  },
  main: {
    container: 'px-3 sm:px-4 py-4 pb-24 space-y-6 sm:space-y-8 max-w-7xl mx-auto',
    dashboardGrid: 'grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6',
  },

  // --- HEADER & TIME RANGE SELECTOR ---
  header: {
    container: 'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
    title: `${typographyStyles.heading} bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60`,
    controls: 'flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto',
    selectTrigger: `${glassmorphism.light} ${radiusStyles.full} w-full sm:w-[180px] hover:bg-white/10 transition-colors text-primary border-primary/10`,
    iconButton: `${glassmorphism.light} ${radiusStyles.full} h-10 w-10 text-primary/70 hover:text-primary ${microAnimations.hover.scale}`,
  },

  // --- TIME RANGE SELECTOR ---
  timeRange: {
    container: 'flex flex-wrap items-center gap-2',
    trigger: `${glassmorphism.light} ${radiusStyles.lg} px-4 py-2 text-sm font-medium text-foreground border border-white/10 hover:border-primary/30 hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2`,
    triggerActive: `${glassmorphism.base} ${radiusStyles.lg} px-4 py-2 text-sm font-medium text-primary border border-primary/30 bg-primary/10 flex items-center gap-2`,
    triggerIcon: 'w-4 h-4',
    dropdown: `${glassmorphism.heavy} ${radiusStyles.lg} p-2 shadow-xl min-w-[200px]`,
    option: `${radiusStyles.md} px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-primary/10 text-foreground`,
    optionActive: `${radiusStyles.md} px-3 py-2 text-sm cursor-pointer bg-primary/15 text-primary font-medium`,
    chipGroup: 'flex flex-wrap gap-1.5',
    chip: `${radiusStyles.full} px-3 py-1.5 text-xs font-medium border border-white/10 hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer text-primary/60`,
    chipActive: `${radiusStyles.full} px-3 py-1.5 text-xs font-medium border border-primary/30 bg-primary/10 text-primary cursor-pointer`,
  },

  // --- SUMMARY SECTION (Financial Command Center) ---
  summary: {
    grid: 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4',
    card: `${glassmorphism.card} ${radiusStyles.xl} relative overflow-hidden group transition-all duration-300 ${microAnimations.hover.lift} hover:border-primary/20`,
    cardHeader:
      'flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2 z-10 relative',
    cardTitle:
      'text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground',
    cardIcon:
      'h-6 w-6 sm:h-8 sm:w-8 p-1 sm:p-1.5 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300',
    cardContent: 'p-3 sm:p-4 pt-1 sm:pt-2 z-10 relative space-y-1',
    balance: `text-lg sm:text-2xl md:text-3xl font-bold tracking-tight ${vibrantGradients.text.primary} bg-clip-text text-transparent`,
    subtext: 'text-[10px] sm:text-xs text-muted-foreground',
    trendBadge:
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-500',
    trendBadgeNegative:
      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-red-500/10 text-red-500',
    gradientOverlay:
      'absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500',
  },

  // --- CHARTS & VISUALIZATIONS ---
  charts: {
    container: `${glassmorphism.card} ${radiusStyles.xl} p-4 sm:p-6 relative overflow-hidden`,
    header: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 sm:mb-6',
    title: 'text-base sm:text-lg font-semibold text-foreground',
    subtitle: 'text-xs sm:text-sm text-muted-foreground',
    chartArea: 'w-full h-[250px] sm:h-[300px] md:h-[350px]',
    tooltip: `${glassmorphism.heavy} ${radiusStyles.lg} p-3 text-sm shadow-xl border border-white/10`,
    legend: 'flex flex-wrap gap-3 sm:gap-4 mt-3 sm:mt-4 justify-center',
    legendItem: 'flex items-center gap-2 text-xs font-medium text-muted-foreground',
    legendDot: 'w-2.5 h-2.5 rounded-full',
  },

  // --- BUDGET FLOW VISUALIZER ---
  flow: {
    container: `${glassmorphism.card} ${radiusStyles.xl} p-4 sm:p-6 space-y-4 relative overflow-hidden`,
    scrollContainer: 'w-full overflow-x-auto -mx-1 px-1',
    svgWrapper: 'relative min-w-[600px]',
    node: `${glassmorphism.light} ${radiusStyles.lg} p-2 sm:p-3 flex items-center justify-between border-l-4 transition-all hover:bg-white/5`,
    nodeLabel: 'font-medium text-xs sm:text-sm text-foreground',
    nodeValue: 'font-bold text-xs sm:text-sm text-foreground tabular-nums',
    connector: 'h-8 w-0.5 bg-gradient-to-b from-primary/20 to-primary/5 ml-6 dashed',
    startNode: 'border-l-emerald-500',
    endNode: 'border-l-indigo-500',
    netFlow: 'mt-2 text-xs font-medium text-center text-muted-foreground',
    emptyState: 'flex h-[200px] items-center justify-center text-muted-foreground text-sm',
  },

  // --- PERIODS & TRANSACTIONS ---
  periods: {
    sectionTitle: 'text-lg sm:text-xl font-bold text-foreground mb-4 flex items-center gap-2',
    grid: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6',
    card: `${glassmorphism.base} ${radiusStyles.xl} p-0 overflow-hidden hover:border-primary/30 transition-all duration-300 ${microAnimations.hover.lift}`,
    cardHeader: 'p-3 sm:p-4 flex items-center justify-between border-b border-white/5 bg-white/5',
    cardTitleDetails: 'flex-1 min-w-0',
    cardTitle: 'font-semibold text-sm sm:text-base text-foreground truncate',
    cardDate: 'text-xs sm:text-sm text-muted-foreground',
    cardContent: 'p-3 sm:p-4 space-y-3 sm:space-y-4',
    // Global Metrics
    globalMetrics: 'space-y-2',
    globalTotalsRow: 'grid grid-cols-3 gap-2 sm:gap-3',
    globalMetricIncome:
      'flex flex-col items-center p-2 sm:p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10',
    globalMetricExpense:
      'flex flex-col items-center p-2 sm:p-3 rounded-xl bg-red-500/5 border border-red-500/10',
    globalMetricNet:
      'flex flex-col items-center p-2 sm:p-3 rounded-xl bg-primary/5 border border-primary/10',
    globalLabel: 'text-[10px] sm:text-xs font-semibold uppercase tracking-wider',
    globalLabelIncome: 'text-emerald-500/70',
    globalLabelExpense: 'text-red-500/70',
    globalLabelNet: 'text-primary/70',
    globalValueIncome: 'text-sm sm:text-base font-bold text-emerald-500 tabular-nums',
    globalValueExpense: 'text-sm sm:text-base font-bold text-red-500 tabular-nums',
    globalValueNet: 'text-sm sm:text-base font-bold text-foreground tabular-nums',
    // Breakdown
    breakdownContainer: 'space-y-2 sm:space-y-3',
    breakdownTitle: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
    breakdownList: 'space-y-2',
    breakdownItem: `${radiusStyles.lg} p-2 sm:p-3 border border-white/5 bg-white/[.02] space-y-2`,
    breakdownHeader: 'flex items-center justify-between',
    breakdownType: 'flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground',
    breakdownDot: 'w-2 h-2 rounded-full',
    breakdownStats: 'grid grid-cols-3 gap-1.5 sm:gap-2',
    breakdownStat: 'flex flex-col gap-0.5 p-1.5 sm:p-2 rounded-lg bg-white/[.03]',
    breakdownStatRow: 'flex flex-col gap-0.5',
    breakdownMetricLabel:
      'text-[9px] sm:text-[10px] uppercase font-semibold text-muted-foreground tracking-wide',
    breakdownBalanceStack: 'flex items-center gap-1',
    breakdownBalanceArrow: 'text-[10px] text-muted-foreground',
    breakdownAmount: 'text-xs sm:text-sm font-bold text-foreground tabular-nums',
    breakdownIn: 'text-xs sm:text-sm font-bold text-emerald-500 tabular-nums',
    breakdownOut: 'text-xs sm:text-sm font-bold text-red-500 tabular-nums',
    breakdownNetRow: 'border-t border-white/5 pt-2',
    // User badge
    userBadge: `absolute top-3 right-3 ${glassmorphism.light} px-2 py-1 ${radiusStyles.full} text-[10px] sm:text-xs font-medium border border-white/10 text-foreground/70`,
    // Empty state
    emptyContainer:
      'text-center py-8 sm:py-12 border border-dashed rounded-xl border-primary/20 bg-primary/5',
    emptyText: 'text-sm text-primary/60',
    metricsRow: 'flex items-center gap-4 sm:gap-6 text-sm',
    metricItem: 'flex flex-col',
    metricLabel: 'text-[10px] uppercase text-muted-foreground font-semibold',
    metricValue: 'font-bold text-foreground',
  },

  // --- CATEGORIES ---
  categories: {
    container: 'space-y-3 sm:space-y-4',
    flexLayout: 'flex flex-col gap-4 sm:gap-6',
    chartContainer: 'h-[200px] sm:h-[250px] w-full relative bg-transparent',
    legendContainer:
      'w-full space-y-2 sm:space-y-3 max-h-[200px] sm:max-h-[250px] overflow-y-auto pr-2',
    item: `flex items-center justify-between ${radiusStyles.lg} p-2 hover:bg-white/5 transition-colors cursor-pointer group`,
    itemLeft: 'flex items-center gap-2 sm:gap-3 flex-1 min-w-0',
    iconBox: `${radiusStyles.md} w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform`,
    details: 'flex flex-col flex-1 min-w-0',
    name: 'text-xs sm:text-sm font-medium text-foreground truncate',
    percent: 'text-[10px] sm:text-xs text-muted-foreground',
    amount: 'font-bold text-xs sm:text-sm text-foreground tabular-nums whitespace-nowrap',
    barBg: 'h-1 sm:h-1.5 w-full bg-white/5 rounded-full mt-1 overflow-hidden',
    barFill: 'h-full rounded-full',
    // Centered label for donut chart
    centerLabel: 'absolute inset-0 flex flex-col items-center justify-center pointer-events-none',
    centerLabelTitle: 'text-[10px] sm:text-xs text-muted-foreground uppercase',
    centerLabelValue: 'text-base sm:text-xl font-bold text-foreground',
  },
};
