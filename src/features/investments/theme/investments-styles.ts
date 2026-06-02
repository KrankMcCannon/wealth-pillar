export const investmentsStyles = {
  card: {
    root: 'overflow-hidden rounded-xl border border-border/25 bg-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    header: 'px-4 pt-4',
    headerWithBorder: 'border-b border-border/25 bg-muted/40 px-4 pt-4',
    content: 'p-4',
    contentNoPadding: 'p-0',
    title: 'text-base font-semibold text-foreground',
    description: 'text-sm text-muted-foreground',
  },
  charts: {
    container: 'relative h-[220px] min-h-[220px] w-full min-w-0 shrink-0',
    sandboxContainer: 'h-[280px] min-h-[200px] w-full min-w-0 shrink-0',
    fallback:
      'flex h-[220px] min-h-[180px] items-center justify-center rounded-xl border border-border/20 bg-muted/60 px-3 text-center text-sm text-muted-foreground',
  },
  container: 'flex flex-col gap-5 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]',
  sandbox: {
    fieldsWrap: 'flex flex-col gap-4 border-b border-border/25 bg-card/95 p-4',
    chartSection: 'border-t border-border/25 bg-card/80 p-4',
    input:
      'h-12 rounded-xl border-border/35 bg-muted/80 text-lg font-medium text-foreground focus:border-border/55 focus:ring-ring/35',
  },
  selector: {
    trigger:
      'flex h-11 w-full items-center justify-between rounded-xl border border-border/35 bg-muted/80 px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-border/55 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring/35 focus:border-border/55',
    triggerLabel: 'truncate text-foreground',
    triggerIcon: 'h-4 w-4 shrink-0 text-primary',
    content:
      'z-[160] min-w-[280px] overflow-hidden rounded-2xl border border-border/40 bg-card/95 text-foreground shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200',
    searchWrap: 'border-b border-border/25 bg-card/40 p-3',
    searchFieldWrap: 'relative flex items-center',
    searchIcon: 'pointer-events-none absolute left-3 h-4 w-4 text-primary/60',
    searchInput:
      'h-10 w-full rounded-lg border border-border/25 bg-muted/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all focus:border-border/55 focus:outline-none focus:ring-2 focus:ring-ring/35',
    viewport: 'max-h-[320px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border/30',
    groupHeader: 'mb-1 px-2 py-2',
    groupTitle: 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground',
    item: 'relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[state=checked]:bg-border/30 data-[state=checked]:text-primary',
    itemLabel: 'block truncate',
    itemSublabel: 'mt-0.5 text-[11px] text-muted-foreground/70',
    empty: 'py-8 text-center text-sm text-muted-foreground/50',
    assetTypeButton: (isActive: boolean) =>
      `rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
        isActive
          ? 'border-border bg-border text-foreground shadow-sm'
          : 'border-border/25 bg-muted/40 text-muted-foreground hover:border-border/50'
      }`,
  },
};
