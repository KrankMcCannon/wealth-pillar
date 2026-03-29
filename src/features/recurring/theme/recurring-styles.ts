export const recurringStyles = {
  section: {
    container: 'rounded-xl',
    emptyWrap: 'p-6',
    emptyActionIcon: 'h-4 w-4 mr-2',
    header: 'p-2.5 border-b border-primary/20',
    headerRow: 'flex items-center justify-between',
    headerLeft: 'flex items-center gap-2',
    headerIconWrap: 'flex size-8 items-center justify-center rounded-xl bg-primary/10',
    headerIcon: 'w-4 h-4 text-primary',
    title: 'text-base text-primary font-bold tracking-tight',
    subtitle: 'text-xs text-primary/70',
    subtitleMuted: 'text-primary/50',
    stats: 'mt-3 pt-3 border-t border-primary/10 grid grid-cols-2 gap-2',
    statRow: 'flex flex-col gap-1 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2',
    statLeft: 'flex items-center gap-2 min-w-0',
    statIconWrapPositive: 'flex size-6 items-center justify-center rounded-lg bg-success/10',
    statIconPositive: 'w-3 h-3 text-success',
    statIconWrapNegative: 'flex size-6 items-center justify-center rounded-lg bg-destructive/10',
    statIconNegative: 'w-3 h-3 text-destructive',
    statLabel: 'text-xs text-primary/70',
    statValuePositive: 'text-sm font-semibold text-success',
    statValueNegative: 'text-sm font-semibold text-destructive',
    list: 'px-2',
    /** Home desktop: griglia al posto della lista verticale stretta. */
    listLayoutHome: 'grid grid-cols-1 md:grid-cols-2 md:gap-4 md:divide-y-0 xl:grid-cols-3 py-2',
    /** overflow-hidden: clip figli (SwipeableCard + Card rounded-none) al raggio del contenitore. */
    cardCellHome:
      'min-w-0 md:overflow-hidden md:rounded-xl md:border md:border-border/55 md:bg-card/60 md:shadow-sm',
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
