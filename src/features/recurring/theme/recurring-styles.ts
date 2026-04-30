export const recurringStyles = {
  section: {
    container: 'rounded-xl',
    emptyWrap: 'p-6',
    emptyActionIcon: 'h-4 w-4 mr-2',
    header:
      'rounded-2xl border border-[#3359c5]/25 bg-[#0b1f4f]/85 p-3.5 shadow-[0_12px_28px_rgba(0,7,30,0.22)]',
    headerRow: 'flex items-center justify-between',
    headerLeft: 'flex items-center gap-2',
    headerIconWrap:
      'flex size-10 items-center justify-center rounded-full border border-[#3359c5]/35 bg-[#11295f]/85',
    headerIcon: 'h-4 w-4 text-[#8fb0ff]',
    title: 'text-2xl font-bold tracking-tight text-[#8fb0ff]',
    subtitle: 'mt-1 text-sm text-[#8fa2dd]',
    subtitleMuted: 'text-[#6f8dd5]',
    stats: 'mt-3 grid grid-cols-1 gap-2 border-t border-[#3359c5]/20 pt-3 sm:grid-cols-3',
    statRow:
      'flex items-center justify-between gap-3 rounded-full border border-[#3359c5]/30 bg-[#11295f]/75 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
    statLeft: 'flex items-center gap-2 min-w-0',
    statIconWrapNeutral:
      'flex size-7 shrink-0 items-center justify-center rounded-full border border-[#5c77cc]/35 bg-[#1a2b6d]',
    statIconNeutral: 'h-3.5 w-3.5 text-[#b8c5ff]',
    statValueNeutral: 'text-[1.85rem] font-semibold leading-none tabular-nums text-[#e6ecff]',
    statIconWrapPositive:
      'flex size-7 items-center justify-center rounded-full border border-[#3f9f73]/35 bg-[#12342a]',
    statIconPositive: 'h-3.5 w-3.5 text-[#8fe2b4]',
    statIconWrapNegative:
      'flex size-7 items-center justify-center rounded-full border border-[#a94858]/35 bg-[#351926]',
    statIconNegative: 'h-3.5 w-3.5 text-[#f0a6a6]',
    statLabel: 'text-sm text-[#8fa2dd]',
    statValuePositive: 'text-[1.85rem] font-semibold leading-none tabular-nums text-[#8fe2b4]',
    statValueNegative: 'text-[1.85rem] font-semibold leading-none tabular-nums text-[#f0a6a6]',
    list: '',
    /** Home desktop: griglia al posto della lista verticale stretta. */
    listLayoutHome: 'grid grid-cols-1 md:grid-cols-2 md:gap-4 md:divide-y-0 xl:grid-cols-3 py-2',
    listLayoutPage: 'space-y-2.5',
    /** overflow-hidden: clip figli (SwipeableCard + Card rounded-none) al raggio del contenitore. */
    cardCellHome:
      'min-w-0 md:overflow-hidden md:rounded-xl md:border md:border-border/55 md:bg-card/60 md:shadow-sm',
    cardCellPage: 'min-w-0',
    listDivider: 'border-t border-primary/20 mx-2',
    footer: 'px-4 py-1.5',
    footerText: 'text-xs text-primary text-center',
    executeErrorBanner:
      'mx-2 mt-2 shrink-0 motion-reduce:animate-none motion-reduce:opacity-100 animate-in fade-in slide-in-from-top-1 duration-200',
  },
  form: {
    form: 'space-y-4',
    errorWrap: 'mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20',
    errorText: 'text-sm text-destructive',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  },
  formModal: {
    form: 'space-y-2',
    content: 'gap-2',
    error:
      'px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md',
    section: 'gap-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  },
  pauseModal: {
    container: 'space-y-4',
    card: 'rounded-lg bg-card/10 p-4 border border-primary/10',
    title: 'text-sm font-medium text-primary mb-2',
    description: 'text-sm text-muted-foreground space-y-2',
    descriptionStrong: 'font-medium',
    buttonIcon: 'mr-2 h-4 w-4',
    loadingIcon: 'mr-2 h-4 w-4 animate-spin',
  },
} as const;
