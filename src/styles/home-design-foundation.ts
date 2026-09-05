/**
 * Home-first design foundation.
 * Reusable primitives to standardize the migration of dashboard-like pages.
 */

/** Bottom padding for dashboard mains so content clears the fixed tab bar. */
export const dashboardContentBottomPadding =
  'pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]';

/** Superfici solide — token-driven (Daylight), no decorative gradients. */
export const stitchSurface = {
  card: 'rounded-xl border border-border/25 bg-card',
  cardLg: 'rounded-2xl border border-border/20 bg-card shadow-md',
  modalFooter: 'mt-auto shrink-0 border-t border-foreground/10 bg-background',
  primaryCta:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-primary/40 bg-primary px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground shadow-lg transition-all hover:border-primary/55 hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100',
  dangerButton:
    'border border-expense/35 bg-expense/12 text-expense transition-colors hover:border-expense/50 hover:bg-expense/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/35',
} as const;

/** Fixed page FAB — single source for home ActionMenu trigger and page-local add buttons. */
export const stitchFab = {
  pageAdd:
    'fixed bottom-24 right-5 z-30 flex h-14 w-14 min-h-11 min-w-11 items-center justify-center rounded-2xl border-0 bg-foreground text-background shadow-lg transition-transform hover:scale-105 hover:bg-foreground/90 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25',
  pageAddIcon: 'size-7',
} as const;

/**
 * Home sections — use via `HomeSectionCard` / `stitchHome.*` class strings.
 * Semantic tokens from app/globals.css.
 */
export const stitchHome = {
  sectionCard: 'space-y-3 rounded-2xl border border-border/20 bg-card p-3 shadow-sm sm:p-4',
  sectionHeaderTitle: 'text-primary',
  sectionHeaderSubtitle: 'text-muted-foreground',
  sectionEyebrow: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  balanceHero:
    'text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-primary',
  balanceHeroNegative:
    'text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-expense',
  balanceLink:
    'group flex items-center justify-between gap-3 rounded-xl px-1 py-1 transition-colors duration-300 motion-reduce:transition-none',
  balanceLinkIcon:
    'flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted ring-1 ring-border/35',
  balanceLinkLabel: 'mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary',
  balanceLinkArrow:
    'h-8 w-8 shrink-0 text-primary transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
  listRowInteractiveMinTouch:
    'flex min-h-11 items-center justify-between gap-3 rounded-xl bg-muted/90 px-3 py-2 ring-1 ring-inset ring-border/40 transition-colors hover:bg-accent motion-reduce:transition-none',
  viewAllLink:
    'inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:rounded-md',
  budgetRowAvatar:
    'flex size-9 shrink-0 items-center justify-center rounded-full border border-border/30 bg-muted text-sm font-bold text-primary',
  fab: stitchFab.pageAdd,
  balanceSection:
    'flex flex-col gap-2 overflow-hidden rounded-2xl border border-border/20 bg-card p-4 shadow-sm',
  listRow:
    'flex items-center justify-between gap-3 rounded-xl bg-muted/90 px-3 py-2 text-left ring-1 ring-inset ring-border/40 transition-colors hover:bg-accent',
  listRowInteractive:
    'flex items-center justify-between gap-3 rounded-xl bg-muted/90 px-3 py-2 ring-1 ring-inset ring-border/40 transition-colors hover:bg-accent',
  emptyWell:
    'rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-inset ring-border/40',
  rowTitle: 'truncate text-base font-semibold text-foreground',
  rowMeta: 'truncate text-sm text-muted-foreground',
  /** Home-density ledger rows — unstyled list, no card chrome. Do not reuse listRowInteractive. */
  plainList: 'm-0 flex list-none flex-col p-0',
  plainRow:
    'flex min-h-12 w-full items-center justify-between gap-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  plainRowTitle: 'block truncate text-base font-medium text-foreground',
  plainRowMeta: 'block truncate text-sm text-muted-foreground',
  amountIncome: 'text-income',
  amountExpense: 'text-expense',
  budgetUserCard:
    'w-full rounded-[20px] border border-border/35 bg-accent px-3.5 py-3 text-left text-foreground transition-colors hover:border-border/55 hover:bg-accent/95',
  budgetEyebrow: 'mb-2 text-xs font-semibold uppercase tracking-wide text-primary',
  budgetUserAvatar:
    'flex size-11 shrink-0 items-center justify-center rounded-full border border-border/30 bg-muted text-lg font-bold text-primary',
  budgetUserName: 'truncate text-lg font-semibold leading-tight text-foreground',
  budgetPeriod: 'mt-0.5 truncate text-xs text-muted-foreground',
  budgetTotal: 'text-2xl font-semibold leading-none text-foreground',
  budgetMetricLabel: 'text-muted-foreground',
  progressTrack: 'h-2 rounded-full bg-muted',
  /** Heading + list. No card chrome — one number, one meta line. */
  scanSection: 'flex flex-col gap-1.5',
  scanSectionHeader: 'flex items-center justify-between gap-3',
  scanSectionTitle: 'text-base font-semibold tracking-tight text-foreground',
} as const;

/** Shell dashboard: opaque paper chrome so the page is not a sky wash. */
export const stitchDashboardShell = {
  pageBackground: 'bg-background',
  /** z-[48]: sopra toolbar sticky (z-30) e contenuti, sotto overlay dialog desktop (z-50) e drawer (z-150). */
  stickyHeader:
    'fixed top-0 left-0 right-0 z-[48] border-b border-border/22 bg-background shadow-sm',
  bottomBar:
    'fixed bottom-0 left-0 right-0 z-[48] border-t border-border/22 bg-background',
  bottomBarPad: 'px-2 pt-1.5 pb-[calc(theme(spacing.1)+env(safe-area-inset-bottom))]',
  bottomNav: 'mx-auto grid max-w-xl grid-cols-5 items-stretch',
  bottomNavItem:
    'flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 motion-reduce:transition-none',
  bottomNavItemActive: 'text-foreground',
  bottomNavIconWell: 'flex size-8 items-center justify-center rounded-full',
  bottomNavIconWellActive: 'bg-accent ring-1 ring-inset ring-primary/35',
  bottomNavIcon: 'size-5 shrink-0',
  bottomNavLabel: 'max-w-full truncate text-center text-xs font-medium leading-none',
  bottomNavLabelActive: 'font-semibold',
} as const;

/** Capsule page tabs (Transazioni/Ricorrenti, Investimenti/Sandbox). */
export const stitchPageTabs = {
  wrap: 'px-2',
  list: 'grid h-12 w-full min-w-0 max-w-full grid-cols-2 place-items-center gap-1 rounded-full border border-border/35 bg-card p-1 shadow-md',
  trigger:
    'inline-flex h-9 min-w-0 w-full items-center justify-center truncate rounded-full px-2 text-[13px] font-semibold tracking-wide text-muted-foreground shadow-none transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:ring-1 data-[state=active]:ring-inset data-[state=active]:ring-primary/35 data-[state=active]:translate-y-0 motion-reduce:transition-none',
  stickyBar:
    'sticky z-30 w-full min-w-0 overflow-x-hidden border-b border-border/22 bg-background pb-2 pt-1',
  stickyStack: 'flex flex-col gap-1.5 pt-1',
  leading: 'px-4',
} as const;

/**
 * Pagina Budgets — hero, lista categorie, FAB (dark Stitch, layout mobile-first).
 */
export const stitchBudgets = {
  decorWrap: 'hidden',
  decorBlobTL: 'hidden',
  decorBlobBR: 'hidden',
  /** Spaziatura come Stitch (hero → CTA → lista). */
  mainStack: 'flex flex-col gap-5 pt-1',
  heroSection: 'relative overflow-hidden rounded-xl border border-border/25 bg-card p-4',
  heroInner: 'relative z-[1]',
  heroTopRow: 'flex items-end justify-between gap-3',
  heroPrimaryBlock: 'min-w-0 flex-1 flex flex-col gap-1',
  heroEyebrow: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  heroAmountRow: 'mt-0.5 flex flex-wrap items-baseline gap-x-1 gap-y-0.5',
  heroAmount: 'text-[28px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-income',
  heroAmountCents: 'text-sm font-medium tabular-nums text-income/80',
  heroAmountBudget: 'text-sm font-medium tabular-nums text-primary',
  heroSpentBlock:
    'flex shrink-0 flex-col items-end gap-0.5 border-l border-border/25 pl-3 text-right',
  heroSpentValue: 'text-[15px] font-semibold tabular-nums leading-tight text-expense',
  heroMetricsRow: 'flex w-full gap-8 border-t border-border/25 pt-4 [&>div]:min-w-0 [&>div]:flex-1',
  heroMetricLabel: 'text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
  heroMetricValue: 'mt-1 text-[17px] font-semibold leading-tight tabular-nums text-foreground',
  heroGradientBar: 'hidden',
  heroStatMiniRow: 'mt-2',
  periodHeader:
    'flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-card px-2 py-1.5',
  periodHeaderDates:
    'flex min-w-0 items-center gap-2 px-2 text-sm font-semibold tabular-nums tracking-tight text-foreground',
  periodHeaderIcon: 'h-4 w-4 shrink-0 text-primary',
  overflowTrigger:
    'flex size-11 shrink-0 items-center justify-center rounded-lg border border-border/45 bg-secondary/40 text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 disabled:pointer-events-none disabled:opacity-45',
  closePeriodButton:
    'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-border/55 bg-transparent px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground transition-all hover:bg-secondary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  listStack: 'flex flex-col gap-4',
  categoryCard:
    'group relative flex w-full flex-col gap-2 rounded-xl border border-border/25 bg-card px-3 py-3 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  categoryCardSelected: 'ring-2 ring-ring/55 ring-offset-2 ring-offset-background',
  categoryCardOver: 'border-expense/35',
  categoryCardOverGlow: 'hidden',
  categoryHeaderRow: 'relative z-[1] flex items-start justify-between gap-2',
  categoryTitleRow: 'flex min-w-0 items-center gap-2.5',
  /** Icon 40px — cerchio primary-fixed / secondary / error come Stitch. */
  iconWrapOnTrack:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/12 text-primary',
  iconWrapFixed:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border/35 bg-secondary/35 text-primary-foreground',
  iconWrapOver:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-expense/35 bg-expense/15 text-expense',
  categoryTitle:
    'truncate text-base font-semibold text-foreground transition-colors group-hover:text-primary',
  /** Badge On Track: tertiary/teal come Stitch (non emerald). */
  badgeOnTrack:
    'shrink-0 rounded-full border border-teal-accent/28 bg-teal-accent/15 px-2.5 py-1 text-[11px] font-medium text-teal-accent',
  badgeFixed:
    'shrink-0 rounded-full border border-border/25 bg-muted/90 px-2.5 py-1 text-[11px] font-medium text-muted-foreground',
  badgeOver:
    'shrink-0 rounded-full border border-expense/35 bg-expense/15 px-2.5 py-1 text-[11px] font-medium text-expense',
  spentRow: 'relative z-[1] mt-2 flex flex-col gap-2',
  spentAmountRow: 'flex items-end justify-between gap-2',
  spentStrong: 'text-xl font-semibold tabular-nums tracking-tight text-foreground',
  spentLabel: 'text-sm font-normal text-muted-foreground',
  spentOf: 'text-sm tabular-nums text-muted-foreground',
  progressTrack: 'relative h-2 w-full overflow-hidden rounded-full bg-muted',
  progressFillPrimary: 'h-full min-h-[8px] rounded-full bg-primary',
  progressFillFixed: 'h-full min-h-[8px] rounded-full bg-secondary',
  progressFillOver: 'h-full min-h-[8px] rounded-full bg-expense',
  progressLimitMarker: 'absolute top-0 z-[2] h-full w-0.5 bg-expense',
  footerRow: 'mt-1 flex items-start justify-between gap-2 text-[11px] leading-snug',
  footerMuted: 'text-muted-foreground',
  footerAccent: 'font-medium text-primary',
  footerDanger: 'font-medium text-expense',
  detailsSection: 'flex flex-col gap-4 pt-4',

  /** Grafico andamento spese. */
  detailChartCard: 'relative rounded-xl border border-border/25 bg-card',
  detailChartHeader: 'border-b border-border/25 px-4 pb-3 pt-4',
  detailChartHeaderLabel: 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
  detailChartHeaderAmount:
    'mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground',
  detailChartEmpty: 'px-4 pb-4 pt-2 text-sm leading-relaxed text-muted-foreground',
  /** Padding interno: griglia e linee non vanno a filo del bordo arrotondato. */
  detailChartSvgWrap: 'px-4 pb-1 pt-2',
  detailChartSvg: 'mx-auto block h-auto w-full max-h-[220px] overflow-visible',
  detailChartDayRow:
    'flex justify-between gap-1 px-4 pb-4 pt-2 text-[10px] font-medium tabular-nums text-muted-foreground/95',
} as const;

/** Colori SVG grafico budget — token, non hex Stitch. */
export const stitchBudgetsChartSvg = {
  gridLine: 'color-mix(in oklch, var(--color-primary) 14%, transparent)',
  lineStroke: 'var(--color-primary)',
  areaFillClass: 'fill-primary/12',
  dotFill: 'var(--color-primary)',
} as const;

/**
 * Pagina Investimenti — mobile-only, single column, no md/lg breakpoints.
 */
export const stitchInvestments = {
  mainStack: 'flex flex-col gap-5 pt-1',
  heroSection: 'relative overflow-hidden rounded-xl border border-border/25 bg-card p-4',
  heroInner: 'relative z-[1] flex gap-3',
  heroPrimaryColumn: 'flex min-w-0 flex-1 flex-col justify-between gap-1',
  heroReturnColumn:
    'flex shrink-0 flex-col items-start justify-between gap-1 border-l border-border/25 pl-3 text-left',
  heroEyebrow: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  heroAmountRow: 'flex flex-wrap items-baseline gap-x-1 gap-y-0.5',
  heroAmount: 'text-[28px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-primary',
  heroAmountCents: 'text-sm font-medium tabular-nums text-primary/80',
  heroReturnValueRow: 'flex items-center justify-start gap-1',
  heroReturnValue: 'text-[15px] font-semibold tabular-nums leading-tight text-income',
  heroReturnValueNegative: 'text-[15px] font-semibold tabular-nums leading-tight text-expense',
  chartCard: stitchSurface.card,
  chartCardHeader: 'border-b border-border/25 px-4 pb-3 pt-4',
  chartCardTitle: 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
  chartCardContent: 'p-4',
  emptyState: 'rounded-xl border border-border/25 bg-card p-6 text-center',
  emptyTitle: 'text-base font-medium text-foreground',
  emptyDescription: 'mt-2 text-sm text-muted-foreground',
  emptyActions: 'mt-6 flex flex-col gap-2',
  emptyCtaPrimary: stitchSurface.primaryCta,
  holdingRow:
    'flex min-h-14 w-full items-start justify-between gap-3 py-3 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  holdingTicker: 'block text-base font-semibold tracking-tight text-foreground',
  holdingMeta: 'mt-1 block text-sm tabular-nums text-muted-foreground',
  holdingValueCol: 'flex shrink-0 flex-col items-end gap-0.5 pt-0.5',
  holdingChange: 'inline-flex items-center gap-1 text-sm font-medium tabular-nums',
} as const;

/**
 * Pagina Transazioni (dark, continuità con stitchHome) — chip, gruppi giorno, FAB.
 */
export const stitchTransactions = {
  chipBase:
    'flex h-7 min-h-7 shrink-0 items-center justify-center rounded-full px-2.5 py-0 text-xs font-medium leading-none tracking-normal whitespace-nowrap transition-colors',
  chipActive: 'bg-accent text-foreground ring-1 ring-inset ring-primary/35',
  chipInactive: 'border border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
  filtersChipIcon: 'mr-1 inline h-3 w-3 shrink-0',
  /** Row list wrapper — layout only; surface lives on section card + individual rows. */
  dayCard: 'flex flex-col gap-2',
  emptyState: 'rounded-xl border border-border/25 bg-card p-6 text-center',
  emptyTitle: 'text-base font-medium text-foreground',
  emptyDescription: 'mt-2 text-sm text-muted-foreground',
  emptyActions: 'mt-6 flex flex-col gap-2',
  emptyCtaPrimary: stitchSurface.primaryCta,
  emptyCtaSecondary:
    'flex min-h-11 w-full items-center justify-center rounded-xl border border-border/40 bg-muted/80 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  pageErrorBanner:
    'rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-sm text-foreground',
  pageErrorRetry:
    'ml-2 font-semibold underline text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 rounded-sm',
  paginationBar: 'flex items-center justify-between gap-3 border-t border-border/25 px-0 py-3.5',
  dayHeaderRow: 'flex items-end justify-between gap-3 border-b border-foreground/10 px-1 pb-1',
  dayHeaderTitle: 'text-base font-semibold leading-tight text-foreground',
  dayHeaderStats: 'text-right',
  dayHeaderTotalRow: 'flex items-baseline justify-end gap-1.5',
  dayHeaderTotalLabel: 'text-sm font-medium text-muted-foreground',
  dayHeaderTotalValue: 'text-base font-semibold tabular-nums leading-none text-foreground',
  dayHeaderCount: 'mt-0.5 text-sm text-muted-foreground',
  tabsStickyBar: stitchPageTabs.stickyBar,
  stickyFilterStack: stitchPageTabs.stickyStack,
  chipInset: stitchPageTabs.leading,
  /** Wider than chip row (`px-4`) without going edge-to-edge. */
  pageTabsWrap: stitchPageTabs.wrap,
  /** Padding orizzontale da `HomeDashboardMain` (px-4); qui solo gap verticale. */
  /** `pb` è solo su `HomeDashboardMain` (dashboardContentBottomPadding). */
  mainStack: 'flex flex-col gap-3 pb-0 pt-1',
  /** Toolbar tipo / filtri: bleed allineato al main dashboard (mx negativo = px-4). */
  chipRow: 'flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4',
  /** Riga membri: scroll orizzontale con snap su mobile; wrap da `sm` per evitare overflow. */
  chipRowUserWrap: 'min-w-0',
  chipRowUserScroll:
    'flex min-h-8 min-w-0 gap-1.5 overflow-x-auto overscroll-x-contain scroll-smooth pb-0.5 pt-0 [-webkit-overflow-scrolling:touch] scrollbar-hide snap-x snap-mandatory motion-reduce:scroll-auto motion-reduce:snap-none sm:flex-wrap sm:overflow-visible sm:pb-0.5',
  chipSnapItem: 'snap-start shrink-0',
  /** Tab Transazioni / Ricorrenti — stessa lingua cromatica di stitchHome.sectionCard. */
  tabsList: stitchPageTabs.list,
  tabsTrigger: stitchPageTabs.trigger,
  listSkeleton: 'space-y-3',
} as const;

/** Grouped list inside dashboard section cards (home activity, recurring preview, transaction day groups). */
export const stitchDashboardGroupedList = stitchTransactions.dayCard;

/** Compact 3-up stat tiles (accounts breakdown, recurring monthly summary). */
export const stitchStatMini = {
  grid: 'grid grid-cols-3 gap-2 border-t border-border/25 pt-2.5',
  item: 'flex min-w-0 flex-col gap-1 rounded-xl border px-2.5 py-2 text-left',
  itemRow: 'flex min-w-0 items-center justify-between gap-2 rounded-xl border px-2.5 py-2',
  itemPrimary: 'border-border/35 bg-muted/70',
  itemSuccess: 'border-teal-accent/28 bg-teal-accent/15',
  itemDestructive: 'border-expense/35 bg-expense/15',
  header: 'flex min-w-0 items-center gap-1.5',
  iconWrap:
    'flex size-5 shrink-0 items-center justify-center rounded-full border border-border/35 bg-accent',
  iconWrapSuccess:
    'flex size-5 shrink-0 items-center justify-center rounded-full border border-teal-accent/35 bg-teal-accent/15',
  iconWrapDestructive:
    'flex size-5 shrink-0 items-center justify-center rounded-full border border-expense/35 bg-expense/15',
  icon: 'h-2.5 w-2.5 text-primary',
  iconSuccess: 'h-2.5 w-2.5 text-income',
  iconDestructive: 'h-2.5 w-2.5 text-expense',
  label:
    'line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground',
  value: 'text-base font-semibold tabular-nums leading-tight text-foreground',
  valuePrimary: 'text-base font-semibold tabular-nums leading-tight text-primary',
  valueSuccess: 'text-base font-semibold tabular-nums leading-tight text-income',
  valueDestructive: 'text-base font-semibold tabular-nums leading-tight text-expense',
} as const;

/**
 * Tab Ricorrenti (Transazioni) — summary, gruppi, empty state, FAB wrapper.
 */
export const stitchRecurring = {
  relativeWrap: 'relative flex flex-col gap-4',
  summaryCard: 'space-y-2 rounded-2xl border border-border/20 bg-card p-4 shadow-md',
  summaryTopRow: 'flex flex-wrap items-start justify-between gap-x-3 gap-y-2',
  summaryHeaderLeft: 'flex min-w-0 items-center gap-2',
  summaryIconWrap:
    'flex size-8 shrink-0 items-center justify-center rounded-full border border-border/35 bg-muted/85',
  summaryIcon: 'h-3.5 w-3.5 text-primary',
  summaryTitle: 'text-sm font-semibold tracking-tight text-foreground',
  summarySubtitle: 'text-xs text-muted-foreground',
  statMiniGrid: stitchStatMini.grid,
  statMiniItem: stitchStatMini.item,
  statMiniItemPrimary: stitchStatMini.itemPrimary,
  statMiniItemSuccess: stitchStatMini.itemSuccess,
  statMiniItemDestructive: stitchStatMini.itemDestructive,
  statMiniHeader: stitchStatMini.header,
  statMiniIconWrap: stitchStatMini.iconWrap,
  statMiniIconWrapSuccess: stitchStatMini.iconWrapSuccess,
  statMiniIconWrapDestructive: stitchStatMini.iconWrapDestructive,
  statMiniIcon: stitchStatMini.icon,
  statMiniIconSuccess: stitchStatMini.iconSuccess,
  statMiniIconDestructive: stitchStatMini.iconDestructive,
  statMiniLabel: stitchStatMini.label,
  statMiniValue: stitchStatMini.value,
  statMiniValuePrimary: stitchStatMini.valuePrimary,
  statMiniValueSuccess: stitchStatMini.valueSuccess,
  statMiniValueDestructive: stitchStatMini.valueDestructive,
  groupSection: 'space-y-2',
  groupLabel: stitchTransactions.dayHeaderTitle,
  groupCard: stitchTransactions.dayCard,
  listStack: stitchTransactions.dayCard,
  emptyState: stitchTransactions.emptyState,
  emptyTitle: stitchTransactions.emptyTitle,
  emptyDescription: stitchTransactions.emptyDescription,
  emptyActions: stitchTransactions.emptyActions,
  emptyCtaPrimary: stitchTransactions.emptyCtaPrimary,
  executeErrorBanner: stitchTransactions.pageErrorBanner,
  footerDivider: 'mx-2 border-t border-border/25',
  footer: 'px-4 py-1.5',
  footerText: 'text-xs text-primary text-center',
} as const;

/**
 * Pagina Accounts — row tokens only; page layout uses stitchHome / stitchRecurring / stitchFab.
 */
export const stitchAccounts = {
  /** Banner vista membro (contesto). */
  memberBanner:
    'rounded-lg border border-border/30 bg-muted/60 px-3 py-2 text-sm leading-snug text-muted-foreground',
} as const;

/**
 * Pagina Reports — dark Stitch, mobile-only (single column, niente md/lg).
 */
export const stitchReports = {
  /** No `-mx-4` bleed: negative margin can widen past the viewport, cause horizontal scroll on `body`, and break `fixed` header/bottom bar on iOS Safari. */
  stickyFilterBar:
    'sticky z-30 flex w-full flex-col gap-1.5 border-b border-border/25 bg-background px-4 py-1.5',
  chipRow: 'flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide',
  sectionStack: 'flex flex-col gap-5 pt-0',
  incompleteNotice:
    'rounded-xl border border-warning/35 bg-warning/10 px-3 py-2 text-sm text-foreground',
  sectionTitle: 'text-base font-semibold tracking-tight text-foreground',
  /** Hero — same paper as home spendable. */
  heroNetCard: stitchHome.balanceSection,
  heroNetDecor: 'hidden',
  heroEyebrow: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  heroNetAmount: 'text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em]',
  heroSmallCard:
    'flex min-w-0 items-baseline justify-between gap-3 py-0.5 sm:flex-col sm:items-stretch sm:justify-start sm:py-0',
  heroSmallAmount:
    'shrink-0 text-right text-base font-semibold tabular-nums text-foreground sm:text-left sm:text-lg',
  trendRow: 'mt-1 flex items-center gap-1 text-sm font-medium',
  trendPositive: 'text-income',
  trendNegative: 'text-expense',
  rankingCard: 'rounded-xl border border-border/25 bg-card p-3',
  rankingRow: 'relative space-y-1 py-1',
  rankingRowLink:
    'relative block space-y-1 rounded-md px-0 py-1 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  rankingRowHeader: 'flex items-end justify-between gap-2',
  rankingIconWrap:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/90 text-muted-foreground',
  rankingChevron: 'h-4 w-4 shrink-0 text-muted-foreground',
  rankingLabel: 'text-base font-medium text-foreground',
  rankingAmount: 'text-base font-semibold tabular-nums text-foreground',
  rankingMeta: 'text-sm tabular-nums text-muted-foreground',
  savingsGrid: 'grid grid-cols-1 gap-2 sm:grid-cols-3',
  snapshotGrid: 'grid grid-cols-2 gap-2',
  kpiPair: 'mt-2 text-sm text-muted-foreground',
  progressTrack: 'h-1.5 w-full overflow-hidden rounded-full bg-muted',
  progressFillPrimary: 'h-full rounded-full bg-primary',
  progressFillSecondary: 'h-full rounded-full bg-secondary',
  progressFillMuted: 'h-full rounded-full bg-border/50',
  /** Account breakdown */
  accountRow:
    'flex items-center justify-between gap-3 rounded-xl border border-border/25 bg-card p-3',
  accountCard: 'flex flex-col gap-3 rounded-xl border border-border/25 bg-card p-3',
  accountMetricGrid: 'grid grid-cols-2 gap-x-3 gap-y-3',
  accountMetricLabel: 'text-xs font-medium text-muted-foreground',
  accountMetricValue: 'mt-0.5 text-base font-semibold tabular-nums leading-tight text-foreground',
  accountIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary-foreground',
  accountIconWrapMuted:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/35 bg-muted/80 text-muted-foreground',
  accountMeta: 'text-xs text-muted-foreground',
  accountAmount: 'text-base font-semibold tabular-nums text-foreground',
  /** Budget period card (reports) */
  periodCard: 'flex flex-col gap-3 rounded-xl border border-border/25 bg-card p-3',
  periodHeaderRow: 'flex items-center justify-between gap-2',
  periodRangeLabel: 'text-sm font-medium text-foreground',
  periodMetricLabel: 'text-xs text-muted-foreground',
  periodMetricValue: 'text-base font-semibold tabular-nums text-foreground',
  emptyWell:
    'rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-inset ring-border/40',
} as const;

/**
 * Barra ricerca transazioni sulla pagina (sopra le chip) — stile Stitch coerente con la toolbar.
 */
export const stitchTransactionPageSearch = {
  stack: 'min-w-0 shrink-0',
  wrap: 'relative w-full',
  icon: 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors',
  iconActive: 'text-primary',
  input:
    'min-h-11 w-full rounded-2xl border border-border/35 bg-muted/85 py-2 pl-10 pr-10 text-sm font-medium text-foreground ring-1 ring-inset ring-border/40 placeholder:text-muted-foreground/55 transition-colors outline-none focus-visible:border-border/45 focus-visible:outline-none focus-visible:ring-0',
  clear:
    'absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  clearIcon: 'h-4 w-4',
} as const;

/**
 * Trigger chip nel drawer filtri (conto, tipo, periodo, categoria) — stesso linguaggio di stitchTransactions.
 */
export const stitchTransactionFilterTriggers = {
  wrapper: 'relative inline-flex',
  buttonBase:
    'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium tracking-wide whitespace-nowrap transition-colors active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  buttonIdle: 'border border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
  buttonOpen: 'bg-accent text-foreground ring-1 ring-inset ring-primary/35',
  buttonHasValue:
    'inline-flex min-h-10 items-center rounded-full bg-accent px-3 py-2 pr-8 text-sm font-medium tracking-wide text-foreground ring-1 ring-inset ring-primary/35 transition-colors',
  clearButton:
    'absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-accent/80 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  clearIcon: 'h-3 w-3',
  chevron:
    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
  chevronOpen: 'rotate-180 text-foreground',
  /** Periodi rapidi nel drawer (All / Oggi / Mese / Altro) */
  quickPill:
    'inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 py-2 text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  quickPillIdle: 'border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
  quickPillActive: 'border-transparent bg-accent text-foreground ring-1 ring-inset ring-primary/35',
  filterDrawerClearAll:
    'inline-flex items-center gap-1.5 rounded-full border border-expense/35 bg-expense/12 px-3 py-2 text-sm font-medium whitespace-nowrap text-expense transition-all duration-200 hover:bg-expense/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/35 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
} as const;

/**
 * Settings page — dark Stitch (aligned with stitchHome / stitchDashboardShell).
 */
export const stitchSettings = {
  pageMain: `flex min-h-0 w-full flex-col gap-5 px-4 pt-2 ${dashboardContentBottomPadding}`,
  sectionEyebrow: 'px-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
  sectionCard: 'overflow-hidden rounded-xl border border-border/25 bg-card',
  formCard: 'overflow-hidden rounded-xl border border-border/25 bg-card divide-y divide-border/25',
  modalFormBody: '[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  row: 'flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  rowDivider: 'border-b border-border/25',
  rowLeft: 'flex min-w-0 flex-1 items-center gap-2.5',
  rowIconWrap:
    'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary',
  rowIcon: 'size-4 shrink-0 text-primary',
  rowLabel: 'truncate text-base font-medium text-foreground',
  rowValue: 'shrink-0 text-sm text-muted-foreground',
  rowChevron: 'size-4 shrink-0 text-muted-foreground',
  profileCard: 'flex flex-row items-center gap-3 rounded-xl border border-border/25 bg-card p-3',
  profileAvatar:
    'flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-bold text-primary',
  profileInfo: 'min-w-0 flex-1',
  profileName: 'truncate text-base font-semibold tracking-tight text-foreground',
  profileEmail: 'mt-0.5 truncate text-sm text-muted-foreground',
  editButton: stitchHome.viewAllLink,
  darkModeTrack:
    'flex h-6 w-11 shrink-0 items-center rounded-full bg-muted p-0.5 transition-colors',
  darkModeTrackOn: 'bg-accent',
  darkModeKnob: 'size-4 rounded-full bg-background shadow-sm transition-transform duration-200',
  darkModeKnobOn: 'translate-x-5',
  logoutButton: `mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${stitchSurface.dangerButton} disabled:pointer-events-none disabled:opacity-50`,
  emptyHint: 'px-3 py-2.5 text-sm text-muted-foreground',
  memberRow: 'flex min-h-12 items-center justify-between gap-3 px-3 py-2.5',
  memberAvatar:
    'flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold tabular-nums text-primary',
  memberName: 'truncate text-base font-medium text-foreground',
  memberRole: 'shrink-0 text-base text-muted-foreground',
} as const;
