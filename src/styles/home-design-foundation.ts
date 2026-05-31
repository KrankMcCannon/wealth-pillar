/**
 * Home-first design foundation.
 * Reusable primitives to standardize the migration of dashboard-like pages.
 */

/** Superfici Stitch solide — navy uniforme, senza gradienti/blur decorativi. */
export const stitchSurface = {
  card: 'rounded-xl border border-border/25 bg-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  cardLg: 'rounded-2xl border border-border/20 bg-card/90 shadow-[0_16px_36px_rgba(0,7,30,0.28)]',
  modalFooter:
    'mt-auto shrink-0 border-t border-border/30 bg-card/95 backdrop-blur-xl supports-backdrop-filter:bg-card/90',
  primaryCta:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-primary/40 bg-primary px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground shadow-[0_10px_32px_rgba(0,16,70,0.45)] transition-all hover:border-primary/55 hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100',
  dangerButton:
    'border border-expense/35 bg-expense/12 text-expense transition-colors hover:border-expense/50 hover:bg-expense/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/35',
} as const;

/** Fixed page FAB — single source for home ActionMenu trigger and page-local add buttons. */
export const stitchFab = {
  pageAdd:
    'fixed bottom-24 right-5 z-30 flex h-14 w-14 min-h-11 min-w-11 items-center justify-center rounded-2xl bg-accent text-white shadow-[0_8px_32px_rgba(0,20,86,0.45)] transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  pageAddIcon: 'size-7',
} as const;

/**
 * Dark “Stitch” home sections — use via `HomeSectionCard` / `stitchHome.*` class strings.
 * Semantic tokens from app/globals.css (Stitch dark palette).
 */
export const stitchHome = {
  sectionCard:
    'space-y-4 rounded-2xl border border-border/20 bg-card/90 p-4 shadow-[0_16px_36px_rgba(0,7,30,0.28)] sm:p-5',
  sectionHeaderTitle: 'text-primary',
  sectionHeaderSubtitle: 'text-muted-foreground',
  sectionEyebrow: 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
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
    'flex min-h-11 items-center justify-between gap-3 rounded-xl bg-muted/90 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-accent motion-reduce:transition-none',
  viewAllLink:
    'inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 focus-visible:rounded-md',
  budgetRowAvatar:
    'flex size-9 shrink-0 items-center justify-center rounded-full border border-border/30 bg-muted text-sm font-bold text-primary',
  fab: stitchFab.pageAdd,
  balanceSection:
    'flex flex-col gap-3 overflow-hidden rounded-[30px] border border-border/20 bg-card/90 p-4 shadow-[0_16px_36px_rgba(0,7,30,0.28)] sm:gap-3.5 sm:p-5',
  listRow:
    'flex items-center justify-between gap-3 rounded-xl bg-muted/90 px-3 py-2 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-accent',
  listRowInteractive:
    'flex items-center justify-between gap-3 rounded-xl bg-muted/90 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-accent',
  emptyWell:
    'rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
  rowTitle: 'truncate text-sm font-semibold text-foreground',
  rowMeta: 'truncate text-xs text-muted-foreground',
  amountIncome: 'text-income',
  amountExpense: 'text-expense',
  budgetUserCard:
    'w-full rounded-[20px] border border-border/35 bg-accent px-3.5 py-3 text-left text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:border-border/55 hover:bg-accent/95',
  budgetEyebrow: 'mb-2 text-[11px] font-semibold uppercase tracking-wide text-primary',
  budgetUserAvatar:
    'flex size-11 shrink-0 items-center justify-center rounded-full border border-border/30 bg-muted text-lg font-bold text-primary',
  budgetUserName: 'truncate text-lg font-semibold leading-tight text-foreground',
  budgetPeriod: 'mt-0.5 truncate text-xs text-muted-foreground',
  budgetTotal: 'text-2xl font-semibold leading-none text-foreground',
  budgetMetricLabel: 'text-muted-foreground',
  progressTrack: 'h-2 rounded-full bg-muted',
} as const;

/** Shell dashboard mobile: sfondo pagina + chrome top/bottom (palette Stitch dark). */
export const stitchDashboardShell = {
  pageBackground: 'bg-background',
  /** z-[48]: sopra toolbar sticky (z-30) e contenuti, sotto overlay dialog desktop (z-50) e drawer (z-150). */
  stickyHeader:
    'fixed top-0 left-0 right-0 z-[48] backdrop-blur-xl border-b border-border/22 shadow-sm bg-background/88',
  bottomBar:
    'fixed bottom-0 left-0 right-0 z-[48] overflow-visible border-t border-border/22 bg-background/94 backdrop-blur-md',
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
  heroSection: 'relative overflow-hidden rounded-xl border border-border/25 bg-card/90 p-4',
  heroInner: 'relative z-[1] flex flex-col gap-4',
  heroEyebrow: 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
  heroAmountRow: 'mt-0.5 flex items-baseline gap-1',
  /** Importo hero: colore primary come Stitch `text-primary` sul numero principale. */
  heroAmount: 'text-[32px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-primary',
  heroAmountCents: 'text-base font-medium text-muted-foreground',
  heroMetricsRow: 'flex w-full gap-8 border-t border-border/25 pt-4 [&>div]:min-w-0 [&>div]:flex-1',
  heroMetricLabel: 'text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
  heroMetricValue: 'mt-1 text-[17px] font-semibold leading-tight tabular-nums text-foreground',
  heroGradientBar: 'hidden',
  closePeriodButton:
    'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-border/55 bg-transparent px-6 py-3 text-sm font-medium tracking-wide text-muted-foreground transition-all hover:bg-secondary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  listStack: 'flex flex-col gap-4',
  categoryCard:
    'group relative flex w-full flex-col gap-3 rounded-xl border border-border/25 bg-card/90 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  categoryCardSelected: 'ring-2 ring-ring/55 ring-offset-2 ring-offset-background',
  categoryCardOver: 'border-expense/35',
  categoryCardOverGlow: 'hidden',
  categoryHeaderRow: 'relative z-[1] flex items-start justify-between gap-2',
  categoryTitleRow: 'flex min-w-0 items-center gap-2.5',
  /** Icon 40px — cerchio primary-fixed / secondary / error come Stitch. */
  iconWrapOnTrack:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/12 text-primary-foreground',
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
  spentStrong: 'text-2xl font-semibold tabular-nums tracking-tight text-foreground',
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
  detailChartCard:
    'relative rounded-xl border border-border/25 bg-card/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
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

/** Colori SVG grafico budget (hex / rgba) — fuori da class Tailwind per attributi SVG. */
export const stitchBudgetsChartSvg = {
  gridLine: 'rgba(143,176,255,0.14)',
  lineStroke: 'var(--color-primary)',
  areaFillClass: 'fill-primary/12',
  dotFill: 'var(--color-primary)',
} as const;

/**
 * Pagina Transazioni (dark, continuità con stitchHome) — chip, gruppi giorno, FAB.
 */
export const stitchTransactions = {
  chipBase:
    'flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-[12px] font-medium tracking-wide whitespace-nowrap transition-colors',
  chipActive: 'bg-accent text-foreground shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
  chipInactive: 'border border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
  filtersChipIcon: 'mr-1 inline h-4 w-4 shrink-0',
  /** Row list wrapper — layout only; surface lives on section card + individual rows. */
  dayCard: 'flex flex-col gap-2',
  emptyState:
    'rounded-xl border border-border/25 bg-card/90 p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
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
  dayHeaderRow: 'mb-2 flex items-center justify-between px-1',
  dayHeaderTitle: 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
  dayHeaderStats: 'text-right',
  dayHeaderTotalRow: 'flex items-center gap-2 justify-end',
  dayHeaderTotalLabel: 'text-xs text-muted-foreground',
  dayHeaderTotalValue: 'text-xs font-bold tabular-nums',
  dayHeaderCount: 'mt-0.5 text-xs text-muted-foreground',
  tabsStickyBar:
    'sticky z-30 border-b border-border/22 bg-background/88 pb-2 pt-1 backdrop-blur-xl',
  /** Padding orizzontale da `HomeDashboardMain` (px-4); qui solo gap verticale. */
  /** `pb` è solo su `HomeDashboardMain` (dashboardContentBottomPadding). */
  mainStack: 'flex flex-col gap-3 pb-0 pt-1',
  /** Toolbar tipo / filtri: bleed allineato al main dashboard (mx negativo = px-4). */
  chipRow: 'flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4',
  /** Riga membri: scroll orizzontale con snap su mobile; wrap da `sm` per evitare overflow. */
  chipRowUserWrap: 'min-w-0',
  chipRowUserScroll:
    'flex min-h-[44px] min-w-0 gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 pt-0.5 [-webkit-overflow-scrolling:touch] scrollbar-hide snap-x snap-mandatory motion-reduce:scroll-auto motion-reduce:snap-none sm:flex-wrap sm:overflow-visible sm:pb-0.5',
  chipSnapItem: 'snap-start shrink-0',
  /** Tab Transazioni / Ricorrenti — stessa lingua cromatica di stitchHome.sectionCard. */
  tabsList:
    'grid h-12 w-full grid-cols-2 place-items-center gap-1 rounded-full border border-border/35 bg-card/95 p-1 shadow-[0_14px_30px_rgba(0,7,30,0.3)]',
  tabsTrigger:
    'inline-flex h-9 w-full items-center justify-center rounded-full px-2 text-[13px] font-semibold tracking-wide text-muted-foreground shadow-none transition-all duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 data-[state=active]:bg-accent data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)] data-[state=active]:translate-y-0 motion-reduce:transition-none',
  listSkeleton: 'space-y-3',
} as const;

/** Grouped list inside dashboard section cards (home activity, recurring preview, transaction day groups). */
export const stitchDashboardGroupedList = stitchTransactions.dayCard;

/**
 * Tab Ricorrenti (Transazioni) — summary, gruppi, empty state, FAB wrapper.
 */
export const stitchRecurring = {
  relativeWrap: 'relative flex flex-col gap-4',
  summaryCard:
    'rounded-2xl border border-border/20 bg-card/90 p-4 shadow-[0_16px_36px_rgba(0,7,30,0.28)]',
  summaryHeaderRow: 'flex items-center gap-2',
  summaryIconWrap:
    'flex size-10 shrink-0 items-center justify-center rounded-full border border-border/35 bg-muted/85',
  summaryIcon: 'h-4 w-4 text-primary',
  summaryTitle: 'text-base font-semibold tracking-tight text-foreground',
  summarySubtitle: 'mt-0.5 text-sm text-muted-foreground',
  statsGrid: 'mt-3 grid grid-cols-3 gap-2 border-t border-border/25 pt-3',
  statItem:
    'flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-center',
  statItemPrimary: 'border-border/35 bg-muted/70',
  statItemSuccess: 'border-teal-accent/28 bg-teal-accent/15',
  statItemDestructive: 'border-expense/35 bg-expense/15',
  statIconWrap:
    'flex size-7 shrink-0 items-center justify-center rounded-full border border-border/35 bg-accent',
  statIconWrapSuccess:
    'flex size-7 shrink-0 items-center justify-center rounded-full border border-teal-accent/35 bg-teal-accent/15',
  statIconWrapDestructive:
    'flex size-7 shrink-0 items-center justify-center rounded-full border border-expense/35 bg-expense/15',
  statIcon: 'h-3.5 w-3.5 text-primary',
  statIconSuccess: 'h-3.5 w-3.5 text-income',
  statIconDestructive: 'h-3.5 w-3.5 text-expense',
  statLabel: 'text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
  statValue: 'text-[17px] font-semibold tabular-nums leading-tight text-foreground',
  statValueSuccess: 'text-[17px] font-semibold tabular-nums leading-tight text-income',
  statValueDestructive: 'text-[17px] font-semibold tabular-nums leading-tight text-expense',
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
  accountListIconWrap: 'border border-border/35 bg-muted/85 !text-primary',
  accountListTitle: 'font-semibold text-[15px] leading-snug text-foreground',
  accountListSubtitle: 'mt-0.5 text-[11px] font-medium text-muted-foreground',
  accountListAmountSuccess: 'text-sm font-bold tabular-nums tracking-tight text-income',
  accountListAmountPrimary: 'text-sm font-bold tabular-nums tracking-tight text-primary',
  accountListAmountNegative: 'text-sm font-bold tabular-nums tracking-tight text-expense',
  accountListAmountSecondary: 'mt-0.5 text-[10px] font-semibold tabular-nums text-expense',
} as const;

/**
 * Pagina Reports — dark Stitch, mobile-only (single column, niente md/lg).
 */
export const stitchReports = {
  /** No `-mx-4` bleed: negative margin can widen past the viewport, cause horizontal scroll on `body`, and break `fixed` header/bottom bar on iOS Safari. */
  stickyFilterBar:
    'sticky z-30 w-full border-b border-border/25 bg-background/90 px-4 py-2 backdrop-blur-sm',
  chipRow: 'flex gap-2 overflow-x-auto pb-1 scrollbar-hide',
  sectionStack: 'flex flex-col gap-5 pt-1',
  sectionTitle: 'text-lg font-semibold tracking-tight text-foreground',
  /** Hero bento — card principale flusso netto */
  heroNetCard:
    'relative col-span-1 overflow-hidden rounded-xl border border-border/25 bg-card/90 p-4',
  heroNetDecor: 'hidden',
  heroEyebrow: 'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
  heroNetAmount:
    'text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-primary',
  heroSmallCard: 'rounded-xl border border-border/25 bg-card/90 p-3',
  heroSmallAmount: 'text-xl font-semibold tabular-nums text-foreground',
  trendRow: 'mt-1 flex items-center gap-1 text-[12px] font-medium',
  trendPositive: 'text-teal-accent',
  trendNegative: 'text-expense',
  rankingCard: 'rounded-xl border border-border/25 bg-card/90 p-3',
  rankingRow: 'relative space-y-1.5',
  rankingRowHeader: 'flex items-end justify-between gap-2',
  rankingIconWrap:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/90 text-muted-foreground',
  rankingLabel: 'text-sm font-medium text-foreground',
  rankingAmount: 'text-sm font-semibold tabular-nums text-foreground',
  progressTrack: 'h-1.5 w-full overflow-hidden rounded-full bg-muted',
  progressFillPrimary: 'h-full rounded-full bg-primary',
  progressFillSecondary: 'h-full rounded-full bg-secondary',
  progressFillMuted: 'h-full rounded-full bg-border/50',
  /** Account breakdown */
  accountRow:
    'flex items-center justify-between gap-3 rounded-xl border border-border/25 bg-card/90 p-3',
  accountIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/12 text-primary-foreground',
  accountIconWrapMuted:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/35 bg-muted/80 text-muted-foreground',
  accountMeta: 'text-[11px] text-muted-foreground',
  accountAmount: 'text-base font-semibold tabular-nums text-foreground',
  /** Budget period card (reports) */
  periodCard: 'flex flex-col gap-3 rounded-xl border border-border/25 bg-card/90 p-3',
  periodHeaderRow: 'flex items-center justify-between gap-2',
  periodRangeLabel: 'text-sm font-medium text-foreground',
  periodMetricLabel: 'text-[11px] text-muted-foreground',
  periodMetricValue: 'text-base font-semibold tabular-nums text-foreground',
  emptyWell:
    'rounded-xl bg-muted/60 px-4 py-6 text-center text-sm text-muted-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
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
    'min-h-11 w-full rounded-2xl border border-border/35 bg-muted/85 py-2 pl-10 pr-10 text-sm font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] placeholder:text-muted-foreground/55 transition-colors focus-visible:border-border/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25',
  clear:
    'absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  clearIcon: 'h-4 w-4',
} as const;

/**
 * Trigger chip nel drawer filtri (conto, tipo, periodo, categoria) — stesso linguaggio di stitchTransactions.
 */
export const stitchTransactionFilterTriggers = {
  wrapper: 'relative inline-flex',
  buttonBase:
    'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium tracking-wide whitespace-nowrap transition-colors active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  buttonIdle: 'border border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
  buttonOpen: 'bg-accent text-foreground shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
  buttonHasValue:
    'inline-flex min-h-10 items-center rounded-full bg-accent px-3 py-2 pr-8 text-[12px] font-medium tracking-wide text-foreground shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)] transition-colors',
  clearButton:
    'absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-foreground transition-colors hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
  clearIcon: 'h-3 w-3',
  chevron:
    'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none',
  chevronOpen: 'rotate-180 text-foreground',
  /** Periodi rapidi nel drawer (All / Oggi / Mese / Altro) */
  quickPill:
    'inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 py-2 text-[12px] font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  quickPillIdle: 'border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
  quickPillActive:
    'border-transparent bg-accent text-foreground shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
  filterDrawerClearAll:
    'inline-flex items-center gap-1.5 rounded-full border border-expense/35 bg-expense/12 px-3 py-2 text-sm font-medium whitespace-nowrap text-expense transition-all duration-200 hover:bg-expense/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/35 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
} as const;

/**
 * Settings page — dark Stitch (aligned with stitchHome / stitchDashboardShell).
 */
export const stitchSettings = {
  pageMain: 'flex flex-col gap-5 px-4 pt-1 pb-20',
  sectionEyebrow: 'px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground',
  sectionCard:
    'overflow-hidden rounded-2xl border border-border/20 bg-card/90 shadow-[0_16px_36px_rgba(0,7,30,0.28)]',
  row: 'flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45',
  rowDivider: 'border-b border-white/[0.06]',
  rowLeft: 'flex min-w-0 flex-1 items-center gap-3',
  rowIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/35 bg-primary/12 text-primary-foreground',
  rowIcon: 'h-5 w-5 shrink-0 text-primary',
  rowLabel: 'truncate text-base font-medium text-foreground',
  rowValue: 'shrink-0 text-sm text-muted-foreground',
  rowChevron: 'h-5 w-5 shrink-0 text-muted-foreground',
  profileCard:
    'flex flex-col items-center gap-4 rounded-2xl border border-border/20 bg-card/90 p-4 shadow-[0_16px_36px_rgba(0,7,30,0.28)] sm:flex-row sm:items-start sm:p-5',
  profileAvatar:
    'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-bold text-primary',
  profileInfo: 'min-w-0 flex-1 text-center sm:text-left',
  profileName: 'truncate text-xl font-semibold tracking-tight text-primary',
  profileEmail: 'mt-1 truncate text-sm text-muted-foreground',
  editButton:
    'inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-border/35 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-border/45 hover:bg-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
  darkModeTrack:
    'flex h-6 w-11 shrink-0 items-center rounded-full bg-muted p-0.5 transition-colors',
  darkModeTrackOn: 'bg-accent',
  darkModeKnob: 'size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
  darkModeKnobOn: 'translate-x-5',
  logoutButton: `mt-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold uppercase tracking-wide ${stitchSurface.dangerButton} disabled:pointer-events-none disabled:opacity-50`,
} as const;
