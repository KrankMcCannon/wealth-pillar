export const investmentsStyles = {
  container: 'space-y-5 sm:space-y-8 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]',
  card: {
    root: 'overflow-hidden rounded-2xl border border-border/20 bg-card/90 shadow-[0_16px_36px_rgba(0,7,30,0.28)]',
    header: 'px-4 pt-4 sm:px-5 sm:pt-5',
    headerWithBorder: 'px-4 pt-4 sm:px-5 sm:pt-5 border-b border-border/25 bg-muted/40',
    content: 'p-4 sm:p-5',
    contentNoPadding: 'p-0',
    title: 'text-lg sm:text-xl font-semibold text-primary',
    description: 'text-muted-foreground text-sm sm:text-base',
  },
  charts: {
    grid: 'grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 min-w-0 min-h-[260px]',
    container:
      'h-[220px] min-h-[220px] w-full min-w-0 shrink-0 sm:h-[300px] sm:min-h-[300px] relative',
    sandboxContainer:
      'h-[280px] min-h-[200px] w-full min-w-0 shrink-0 sm:h-[360px] sm:min-h-[280px]',
    fallback:
      'flex h-[220px] min-h-[180px] sm:h-[300px] sm:min-h-[260px] items-center justify-center text-muted-foreground bg-muted/60 rounded-xl px-3 text-center text-sm border border-white/[0.08]',
  },
  list: {
    item: 'flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 px-4 hover:bg-accent transition-colors duration-200 border-b border-border/15 last:border-0',
    itemContent: 'mb-2 sm:mb-0 min-w-0 flex-1',
    itemTitle: 'font-semibold text-[15px] text-foreground truncate',
    badgeWrapper: 'flex items-center gap-2 mt-1',
    badge:
      'inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/25',
    separator: 'text-[11px] text-muted-foreground',
    sharesText: 'text-[12px] text-muted-foreground',
    valueContainer:
      'text-left sm:text-right w-full sm:w-auto mt-2 sm:mt-0 bg-muted/60 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border border-white/[0.04] sm:border-0',
    valuePrimary: 'font-bold text-lg text-foreground tabular-nums',
    valueDetails: 'flex flex-row sm:flex-col justify-between sm:items-end gap-x-4',
    valueLabel: 'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-1',
    valueGain: (isPositive: boolean) =>
      `text-sm font-medium mt-0.5 tabular-nums ${isPositive ? 'text-income' : 'text-expense'}`,
  },
  sandbox: {
    grid: 'grid gap-4 sm:gap-6 md:grid-cols-3 p-4 sm:p-8 bg-card/95 rounded-2xl border border-border/25 shadow-xl',
    inputGroup: 'space-y-2',
    label: 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
    input:
      'font-medium text-lg h-12 bg-muted/80 border-border/35 text-foreground focus:ring-ring/35 focus:border-border/55 rounded-xl',
    chartSection: 'p-4 sm:p-6 border-t border-border/25 bg-card/80 rounded-b-2xl',
  },
  selector: {
    trigger:
      'flex h-11 w-full items-center justify-between rounded-xl border border-border/35 bg-muted/80 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-accent hover:border-border/55 focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border/55',
    triggerLabel: 'truncate text-foreground',
    triggerIcon: 'h-4 w-4 text-primary shrink-0',
    content:
      'z-[160] min-w-[280px] overflow-hidden rounded-2xl border border-border/40 bg-card/95 text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200',
    searchWrap: 'border-b border-border/25 p-3 bg-card/40',
    searchFieldWrap: 'relative flex items-center',
    searchIcon: 'absolute left-3 h-4 w-4 text-primary/60 pointer-events-none',
    searchInput:
      'h-10 w-full rounded-lg border border-border/25 bg-muted/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border/55 transition-all',
    viewport: 'max-h-[320px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border/30',
    groupHeader: 'px-2 py-2 mb-1',
    groupTitle: 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground',
    item: 'relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-border/30 data-[state=checked]:text-primary',
    itemLabel: 'block truncate',
    itemSublabel: 'text-[11px] text-muted-foreground/70 mt-0.5',
    empty: 'py-8 text-center text-sm text-muted-foreground/50',
    assetTypeButton: (isActive: boolean) =>
      `px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full border transition-all ${
        isActive
          ? 'bg-border border-border text-white shadow-[0_0_12px_rgba(51,89,197,0.3)]'
          : 'bg-muted/40 border-border/25 text-muted-foreground hover:border-border/50'
      }`,
  },
  pagination: {
    wrapper:
      'border-t border-border/10 px-4 py-3.5 flex items-center justify-between gap-3 bg-muted/20',
    info: 'text-[11px] text-muted-foreground/60 tabular-nums font-medium',
    infoHighlight: 'text-primary font-semibold',
    controls: 'flex items-center gap-1',
    button:
      'inline-flex items-center justify-center h-8 min-w-[2rem] px-2.5 rounded-full text-[13px] font-medium transition-all duration-150 border border-border/20 bg-muted/40 text-primary/70 hover:bg-accent hover:text-primary hover:border-border/50 disabled:opacity-30 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
    buttonActive:
      'bg-border text-white border-border shadow-[0_0_15px_rgba(51,89,197,0.3)] hover:bg-border/90 hover:text-white hover:border-border',
    buttonIcon: 'h-3.5 w-3.5',
    ellipsis:
      'inline-flex items-center justify-center h-8 min-w-[2rem] text-xs text-muted-foreground/40 select-none',
    loadingSpinner:
      'h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent',
    perPageWrapper: 'flex items-center gap-1.5 shrink-0',
    perPageLabel: 'text-[11px] text-muted-foreground/50 font-medium hidden sm:block',
    perPageSelect:
      'h-8 rounded-full border border-border/20 bg-muted/40 text-[13px] font-medium text-primary/80 px-2.5 pr-6 appearance-none cursor-pointer hover:border-border/50 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all duration-150',
    perPageChevron: 'text-primary/50',
    mobileIndicator: 'sm:hidden px-3 text-[13px] font-semibold text-primary tabular-nums',
  },
  skeletons: {
    header:
      'h-48 rounded-2xl bg-muted/40 animate-pulse border border-border/20 flex flex-col items-center justify-center space-y-4',
    allocation:
      'min-h-[400px] lg:min-h-[360px] rounded-2xl bg-muted/40 animate-pulse border border-border/20 p-6 flex flex-col lg:flex-row gap-8 items-center',
    donut:
      'relative h-[225px] w-[225px] lg:h-[280px] lg:w-[280px] rounded-full border-[24px] border-border/20 flex items-center justify-center',
    legend: 'flex-1 w-full space-y-3',
    legendItem:
      'h-16 rounded-2xl bg-muted/60 border border-white/[0.04] px-4 flex items-center justify-between',
    chart: 'h-[300px] rounded-2xl bg-muted/40 animate-pulse border border-border/20',
    list: 'space-y-3 mt-8',
    listItem:
      'h-20 rounded-2xl bg-muted/30 animate-pulse border border-border/15 px-4 flex items-center justify-between',
    itemPrimary: 'h-4 w-32 rounded bg-border/20 mb-2',
    itemSecondary: 'h-3 w-20 rounded bg-border/10',
    itemAmount: 'h-5 w-24 rounded bg-border/20',
  },
};
