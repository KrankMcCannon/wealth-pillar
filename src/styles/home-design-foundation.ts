/**
 * Home-first design foundation.
 * Reusable primitives to standardize the migration of dashboard-like pages.
 */

/**
 * Dark “Stitch” home sections — use via `HomeSectionCard` / `stitchHome.*` class strings.
 * Centralizza hex ripetuti tra Balance, Budget, Recurring, Recent activity.
 */
export const stitchHome = {
  sectionCard:
    'space-y-4 rounded-2xl border border-[#3359c5]/20 bg-[#0b1f4f]/90 p-4 shadow-[0_16px_36px_rgba(0,7,30,0.28)] sm:p-5',
  sectionHeaderTitle: 'text-[#8fb0ff]',
  sectionHeaderSubtitle: 'text-[#8fa2dd]',
  balanceSection:
    'flex flex-col gap-3 overflow-hidden rounded-[30px] border border-[#3359c5]/20 bg-[#0b1f4f]/90 p-4 shadow-[0_16px_36px_rgba(0,7,30,0.28)] sm:gap-3.5 sm:p-5',
  listRow:
    'flex items-center justify-between gap-3 rounded-xl bg-[#11295f]/90 px-3 py-2.5 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-[#17336f]',
  listRowInteractive:
    'flex items-center justify-between gap-3 rounded-xl bg-[#11295f]/90 px-3 py-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-[#17336f]',
  emptyWell:
    'rounded-xl bg-[#11295f]/60 px-4 py-6 text-center text-sm text-[#9fb0d7] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
  rowTitle: 'truncate text-sm font-semibold text-[#e6ecff]',
  rowMeta: 'truncate text-xs text-[#9fb0d7]',
  amountIncome: 'text-[#8fe2b4]',
  amountExpense: 'text-[#f0a6a6]',
  budgetUserCard:
    'w-full rounded-[20px] border border-[#5c77cc]/35 bg-[#183166] px-3.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-[#1f3c75]',
  budgetEyebrow: 'mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#9fb9ff]',
  budgetUserAvatar:
    'flex size-11 shrink-0 items-center justify-center rounded-full bg-[#2a447f] text-lg font-bold text-[#9eb6ff]',
  budgetUserName: 'truncate text-lg font-semibold leading-tight text-[#9fb9ff]',
  budgetPeriod: 'mt-0.5 truncate text-xs text-[#6f8dd5]',
  budgetTotal: 'text-2xl font-semibold leading-none text-white',
  budgetMetricLabel: 'text-[#aab9df]',
  progressTrack: 'h-2 rounded-full bg-[#1a2b5f]',
} as const;

/** Shell dashboard mobile: sfondo pagina + chrome top/bottom (palette Stitch dark). */
export const stitchDashboardShell = {
  pageBackground: 'bg-[#050818]',
  /** z-[48]: sopra toolbar sticky (z-30) e contenuti, sotto overlay dialog desktop (z-50) e drawer (z-150). */
  stickyHeader:
    'fixed top-0 left-0 right-0 z-[48] backdrop-blur-xl border-b border-[#8ba3ff]/22 shadow-sm bg-[#0c1738]/88',
  bottomBar:
    'fixed bottom-0 left-0 right-0 z-[48] overflow-visible border-t border-[#8ba3ff]/22 bg-[#0c1738]/94 backdrop-blur-md',
} as const;

/**
 * Pagina Budgets — hero, lista categorie, FAB (dark Stitch, layout mobile-first).
 */
export const stitchBudgets = {
  decorWrap: 'pointer-events-none fixed inset-0 -z-10 overflow-hidden',
  decorBlobTL:
    'absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-[#183166]/22 blur-[100px]',
  decorBlobBR:
    'absolute -bottom-[10%] -right-[10%] h-[55%] w-[55%] rounded-full bg-[#11295f]/28 blur-[120px]',
  /** Spaziatura come Stitch (hero → CTA → lista). */
  mainStack: 'flex flex-col gap-5 pt-1',
  /** Liquid glass: inset highlight come mock Stitch (adattato al dark). */
  heroSection:
    'relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1f4f]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] backdrop-blur-[24px]',
  heroInner: 'relative z-[1] flex flex-col gap-4',
  heroEyebrow: 'text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
  heroAmountRow: 'mt-0.5 flex items-baseline gap-1',
  /** Importo hero: colore primary come Stitch `text-primary` sul numero principale. */
  heroAmount:
    'text-[32px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#8fb0ff]',
  heroAmountCents: 'text-base font-medium text-[#9fb0d7]',
  heroMetricsRow:
    'flex w-full gap-8 border-t border-[#3359c5]/25 pt-4 [&>div]:min-w-0 [&>div]:flex-1',
  heroMetricLabel: 'text-[11px] font-medium uppercase tracking-wide text-[#8fa2dd]',
  heroMetricValue: 'mt-1 text-[17px] font-semibold leading-tight tabular-nums text-[#e6ecff]',
  /** Striscia decorativa in basso come Stitch `from-primary via-tertiary`. */
  heroGradientBar:
    'pointer-events-none absolute bottom-0 left-0 z-0 h-[3px] w-full bg-gradient-to-r from-[#001456] via-[#005047] to-transparent opacity-30',
  closePeriodButton:
    'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-[#7c8aab]/55 bg-transparent px-6 py-3 text-sm font-medium tracking-wide text-[#c5cfe8] transition-all hover:bg-[#505f76]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35',
  listStack: 'flex flex-col gap-4',
  categoryCard:
    'group relative flex w-full flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#0b1f4f]/78 p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[24px] transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/45',
  categoryCardSelected: 'ring-2 ring-[#6b9fff]/55 ring-offset-2 ring-offset-[#050818]',
  categoryCardOver: 'border-red-400/25',
  categoryCardOverGlow:
    'pointer-events-none absolute right-0 top-0 z-0 h-32 w-32 rounded-bl-[100px] bg-red-500/[0.08]',
  categoryHeaderRow: 'relative z-[1] flex items-start justify-between gap-2',
  categoryTitleRow: 'flex min-w-0 items-center gap-2.5',
  /** Icon 40px — cerchio primary-fixed / secondary / error come Stitch. */
  iconWrapOnTrack:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8fb0ff]/35 bg-[#8fb0ff]/12 text-[#dde1ff]',
  iconWrapFixed:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#b7c8e1]/35 bg-[#505f76]/35 text-[#d3e4fe]',
  iconWrapOver:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15 text-red-300',
  categoryTitle:
    'truncate text-base font-semibold text-[#e6ecff] transition-colors group-hover:text-[#8fb0ff]',
  /** Badge On Track: tertiary/teal come Stitch (non emerald). */
  badgeOnTrack:
    'shrink-0 rounded-full border border-[#3cddc7]/28 bg-[#00211c]/55 px-2.5 py-1 text-[11px] font-medium text-[#62fae3]',
  badgeFixed:
    'shrink-0 rounded-full border border-[#c6c5d2]/25 bg-[#2a3145]/90 px-2.5 py-1 text-[11px] font-medium text-[#c6c5d2]',
  badgeOver:
    'shrink-0 rounded-full border border-red-400/35 bg-[#5c1a1a]/55 px-2.5 py-1 text-[11px] font-medium text-[#ffb4ab]',
  spentRow: 'relative z-[1] mt-2 flex flex-col gap-2',
  spentAmountRow: 'flex items-end justify-between gap-2',
  spentStrong: 'text-2xl font-semibold tabular-nums tracking-tight text-[#e6ecff]',
  spentLabel: 'text-sm font-normal text-[#9fb0d7]',
  spentOf: 'text-sm tabular-nums text-[#8fa2dd]',
  progressTrack: 'relative h-2 w-full overflow-hidden rounded-full bg-[#303545]',
  progressFillPrimary: 'h-full min-h-[8px] rounded-full bg-[#001456]',
  progressFillFixed: 'h-full min-h-[8px] rounded-full bg-[#505f76]',
  progressFillOver: 'h-full min-h-[8px] rounded-full bg-[#ba1a1a]',
  /** Marker limite budget quando si è oltre (come Stitch `left-[78%]`). */
  progressLimitMarker: 'absolute top-0 z-[2] h-full w-0.5 bg-[#ffb4ab]',
  footerRow: 'mt-1 flex items-start justify-between gap-2 text-[11px] leading-snug',
  footerMuted: 'text-[#8fa2dd]',
  footerAccent: 'font-medium text-[#8fb0ff]',
  footerDanger: 'font-medium text-[#ffb4ab]',
  fab: 'group fixed bottom-24 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#001456] text-white shadow-[0_8px_16px_-4px_rgba(0,20,86,0.45)] transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/45',
  fabIcon: 'h-7 w-7 transition-transform duration-300 group-hover:rotate-90',
  pageTitle: 'text-[32px] font-semibold tracking-tight text-[#e6ecff]',
  pageSubtitle: 'text-base text-[#8fa2dd]',
  detailsSection: 'flex flex-col gap-4 pt-4',

  /** Grafico andamento spese. */
  detailChartCard:
    'relative rounded-xl border border-white/[0.08] bg-[#0b1f4f]/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[24px]',
  detailChartHeader: 'border-b border-[#3359c5]/25 px-4 pb-3 pt-4',
  detailChartHeaderLabel: 'text-[11px] font-semibold uppercase tracking-wide text-[#9fb0d7]',
  detailChartHeaderAmount: 'mt-1 text-2xl font-semibold tabular-nums tracking-tight text-[#e6ecff]',
  detailChartEmpty: 'px-4 pb-4 pt-2 text-sm leading-relaxed text-[#9fb0d7]',
  /** Padding interno: griglia e linee non vanno a filo del bordo arrotondato. */
  detailChartSvgWrap: 'px-4 pb-1 pt-2',
  detailChartSvg: 'mx-auto block h-auto w-full max-h-[220px] overflow-visible',
  detailChartDayRow:
    'flex justify-between gap-1 px-4 pb-4 pt-2 text-[10px] font-medium tabular-nums text-[#9fb0d7]/95',
} as const;

/** Colori SVG grafico budget (hex / rgba) — fuori da class Tailwind per attributi SVG. */
export const stitchBudgetsChartSvg = {
  gridLine: 'rgba(143,176,255,0.14)',
  lineStroke: '#8fb0ff',
  areaFillClass: 'fill-[#8fb0ff]/[0.12]',
  dotFill: '#8fb0ff',
} as const;

/**
 * Pagina Transazioni (dark, continuità con stitchHome) — chip, gruppi giorno, FAB.
 */
export const stitchTransactions = {
  chipBase:
    'flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-[12px] font-medium tracking-wide whitespace-nowrap transition-colors',
  chipActive: 'bg-[#183166] text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
  chipInactive: 'border border-[#3359c5]/35 bg-[#11295f]/80 text-[#9fb0d7] hover:bg-[#17336f]',
  filtersChipIcon: 'mr-1 inline h-4 w-4 shrink-0',
  daySectionOuter: 'space-y-2',
  dayHeaderRow: 'flex items-end justify-between px-1 pb-1',
  dayTitle: 'text-sm font-medium text-[#8fa2dd]',
  dayNet: 'text-[12px] font-medium tabular-nums',
  dayNetPositive: 'text-[#8fe2b4]',
  dayNetNegative: 'text-[#f0a6a6]',
  dayNetNeutral: 'text-[#9fb0d7]',
  dayCard:
    'rounded-xl border border-[#3359c5]/25 bg-[#0b1f4f]/85 p-1 shadow-[0_4px_24px_rgba(0,7,30,0.35)]',
  rowButton:
    'flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-[#11295f]/90',
  fab: 'fixed bottom-24 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#183166] text-white shadow-[0_8px_32px_rgba(0,20,86,0.45)] transition-transform hover:scale-105 active:scale-95',
  /** Padding orizzontale da `HomeDashboardMain` (px-4); qui solo gap verticale. */
  /** `pb` è solo su `HomeDashboardMain` (dashboardContentBottomPadding). */
  mainStack: 'flex flex-col gap-3 pb-0 pt-1',
  /** Toolbar tipo / filtri: bleed allineato al main dashboard (mx negativo = px-4). */
  chipRow: 'flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-4 px-4',
  /** Riga membri: scroll orizzontale con snap su mobile; wrap da `sm` per evitare overflow. */
  chipRowUserWrap: 'min-w-0 space-y-1',
  chipRowUserScroll:
    'flex min-h-[44px] min-w-0 gap-2 overflow-x-auto overscroll-x-contain scroll-smooth pb-1 pt-0.5 [-webkit-overflow-scrolling:touch] scrollbar-hide snap-x snap-mandatory motion-reduce:scroll-auto motion-reduce:snap-none sm:flex-wrap sm:overflow-visible sm:pb-0.5',
  chipSnapItem: 'snap-start shrink-0',
  chipScrollHint: 'px-1 text-[10px] font-medium leading-tight text-[#9fb0d7]/75 sm:hidden',
  /** Tab Transazioni / Ricorrenti — stessa lingua cromatica di stitchHome.sectionCard. */
  tabsList:
    'grid h-12 w-full grid-cols-2 place-items-center gap-1 rounded-full border border-[#3359c5]/35 bg-[#0b1f4f]/95 p-1 shadow-[0_14px_30px_rgba(0,7,30,0.3)]',
  tabsTrigger:
    'inline-flex h-9 w-full items-center justify-center rounded-full px-2 text-[13px] font-semibold tracking-wide text-[#9fb0d7] shadow-none transition-all duration-200 hover:text-[#e6ecff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35 data-[state=active]:bg-[#183166] data-[state=active]:text-[#e6ecff] data-[state=active]:shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)] data-[state=active]:translate-y-0 motion-reduce:transition-none',
  listSkeleton: 'space-y-3',
} as const;

/**
 * Pagina Accounts (dark Stitch) — struttura come stitch/html/03-account-list, palette coerente con stitchHome.
 */
export const stitchAccounts = {
  /** Stack sotto header fissato; padding bottom allineato a home dashboard / bottom nav. */
  mainStack:
    'flex flex-col gap-7 px-4 py-4 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))]',
  /** Contesto / selettore utente. */
  surfaceQuiet:
    'rounded-2xl border border-[#3359c5]/20 bg-[#0b1f4f]/60 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
  /** Lista conti (enfasi). */
  surfaceEmphasis:
    'rounded-2xl border border-[#5c77cc]/30 bg-[#0b1f4f]/95 p-3 shadow-[0_16px_36px_rgba(0,7,30,0.32)]',
  /** Hero “Total net worth” — liquid glass dark (come stitchBudgets.heroSection). */
  heroNetWorthCard:
    'relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1f4f]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[24px]',
  heroNetWorthDecor:
    'pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#001456]/22 blur-2xl',
  sectionEyebrow: 'text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
  sectionTitle: 'text-base font-semibold tracking-tight text-[#e6ecff]',
  sectionSubtitle: 'text-sm text-[#8fa2dd]',
  /** Righe skeleton lista — allineate a stitchHome.listRow. */
  listRowSkeleton:
    'flex items-center justify-between gap-3 rounded-xl bg-[#11295f]/90 px-3 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
  listStack: 'flex flex-col gap-2',
  /** Chip utente placeholder (scroll orizzontale). */
  userChipRow: 'flex gap-2 overflow-hidden',
  /** Banner vista membro (contesto). */
  memberBanner:
    'rounded-lg border border-[#3359c5]/30 bg-[#11295f]/60 px-3 py-2.5 text-sm leading-snug text-[#c5d4ff]',
  /** Importo saldo totale (hero unico, senza card annidata). */
  balanceAmount:
    'text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#8fb0ff]',
  balanceAmountNegative:
    'text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#f0a6a6]',
  /** Griglia statistiche sotto il saldo. */
  statsGrid: 'mt-4 grid gap-2 border-t border-[#3359c5]/25 pt-4 grid-cols-3',
  statItem:
    'flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2.5 text-center',
  statItemPrimary: 'border-[#5c77cc]/35 bg-[#11295f]/70',
  statItemSuccess: 'border-[#3cddc7]/28 bg-[#00211c]/45',
  statItemDestructive: 'border-red-400/30 bg-[#5c1a1a]/35',
  statLabel: 'text-[10px] font-semibold uppercase tracking-wide text-[#9fb0d7]',
  statValue: 'text-sm font-bold tabular-nums text-[#e6ecff]',
  statValueSuccess: 'text-sm font-bold tabular-nums text-[#8fe2b4]',
  statValueDestructive: 'text-sm font-bold tabular-nums text-[#f0a6a6]',
  accountListIconWrap: 'border border-[#3359c5]/35 bg-[#11295f]/85 !text-[#8fb0ff]',
  accountListTitle: 'font-semibold text-[15px] leading-snug text-[#e6ecff]',
  accountListSubtitle: 'mt-0.5 text-[11px] font-medium text-[#9fb0d7]',
  accountListAmount: 'text-sm font-bold tabular-nums tracking-tight text-[#e6ecff]',
  accountListAmountSuccess: 'text-sm font-bold tabular-nums tracking-tight text-[#8fe2b4]',
  accountListAmountPrimary: 'text-sm font-bold tabular-nums tracking-tight text-[#8fb0ff]',
  accountListAmountNegative: 'text-sm font-bold tabular-nums tracking-tight text-[#f0a6a6]',
  accountListAmountSecondary: 'mt-0.5 text-[10px] font-semibold tabular-nums text-[#f0a6a6]',
  /** CTA secondaria in testa lista (es. “Aggiungi conto”). */
  outlineAction:
    'border-[#3359c5]/40 bg-[#11295f]/50 text-[#e6ecff] hover:bg-[#17336f] hover:text-[#e6ecff]',
} as const;

/**
 * Pagina Reports — dark Stitch, mobile-only (single column, niente md/lg).
 */
export const stitchReports = {
  /** No `-mx-4` bleed: negative margin can widen past the viewport, cause horizontal scroll on `body`, and break `fixed` header/bottom bar on iOS Safari. */
  stickyFilterBar:
    'sticky z-30 w-full border-b border-[#3359c5]/25 bg-[#050818]/90 px-4 py-2 backdrop-blur-sm',
  chipRow: 'flex gap-2 overflow-x-auto pb-1 scrollbar-hide',
  sectionStack: 'flex flex-col gap-5 pt-1',
  sectionTitle: 'text-lg font-semibold tracking-tight text-[#e6ecff]',
  /** Hero bento — card principale flusso netto */
  heroNetCard:
    'relative col-span-1 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0b1f4f]/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[24px]',
  heroNetDecor:
    'pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#001456]/25 blur-2xl',
  heroEyebrow: 'text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
  heroNetAmount:
    'text-[30px] font-semibold tabular-nums leading-none tracking-[-0.02em] text-[#8fb0ff]',
  heroSmallCard:
    'rounded-xl border border-white/[0.08] bg-[#0b1f4f]/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[20px]',
  heroSmallAmount: 'text-xl font-semibold tabular-nums text-[#e6ecff]',
  trendRow: 'mt-1 flex items-center gap-1 text-[12px] font-medium',
  trendPositive: 'text-[#62fae3]',
  trendNegative: 'text-[#ffb4ab]',
  /** Top expenses — contenitore lista */
  rankingCard:
    'rounded-xl border border-white/[0.08] bg-[#0b1f4f]/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[20px]',
  rankingRow: 'relative space-y-1.5',
  rankingRowHeader: 'flex items-end justify-between gap-2',
  rankingIconWrap:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#11295f]/90 text-[#9fb0d7]',
  rankingLabel: 'text-sm font-medium text-[#e6ecff]',
  rankingAmount: 'text-sm font-semibold tabular-nums text-[#e6ecff]',
  progressTrack: 'h-1.5 w-full overflow-hidden rounded-full bg-[#1a2b5f]',
  progressFillPrimary: 'h-full rounded-full bg-[#001456]',
  progressFillSecondary: 'h-full rounded-full bg-[#505f76]',
  progressFillMuted: 'h-full rounded-full bg-[#5c77cc]/50',
  /** Account breakdown */
  accountRow:
    'flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#0b1f4f]/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[20px]',
  accountIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#8fb0ff]/25 bg-[#8fb0ff]/12 text-[#dde1ff]',
  accountIconWrapMuted:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#3359c5]/35 bg-[#11295f]/80 text-[#9fb0d7]',
  accountMeta: 'text-[11px] text-[#9fb0d7]',
  accountAmount: 'text-base font-semibold tabular-nums text-[#e6ecff]',
  /** Historical budget card */
  historyCard:
    'flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-[#0b1f4f]/78 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-[20px]',
  historyHeaderRow: 'flex items-center justify-between gap-2 border-b border-[#3359c5]/25 pb-2',
  historyMonthLabel: 'text-sm font-medium text-[#e6ecff]',
  historyMetricsRow: 'flex items-start justify-between gap-3 pt-1',
  historyMetricLabel: 'text-[11px] text-[#9fb0d7]',
  historyMetricValue: 'text-base font-semibold tabular-nums text-[#e6ecff]',
  emptyWell:
    'rounded-xl bg-[#11295f]/60 px-4 py-6 text-center text-sm text-[#9fb0d7] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
} as const;

/**
 * Barra ricerca transazioni sulla pagina (sopra le chip) — stile Stitch coerente con la toolbar.
 */
export const stitchTransactionPageSearch = {
  stack: 'min-w-0 shrink-0',
  wrap: 'relative w-full',
  icon: 'pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9fb0d7] transition-colors',
  iconActive: 'text-[#8fb0ff]',
  input:
    'min-h-11 w-full rounded-2xl border border-[#3359c5]/35 bg-[#11295f]/85 py-2.5 pl-10 pr-10 text-sm font-medium text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] placeholder:text-[#9fb0d7]/55 transition-colors focus-visible:border-[#5c77cc]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/25',
  clear:
    'absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-[#9fb0d7] transition-colors hover:bg-white/10 hover:text-[#e6ecff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35',
  clearIcon: 'h-4 w-4',
} as const;

/**
 * Trigger chip nel drawer filtri (conto, tipo, periodo, categoria) — stesso linguaggio di stitchTransactions.
 */
export const stitchTransactionFilterTriggers = {
  wrapper: 'relative inline-flex',
  buttonBase:
    'inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium tracking-wide whitespace-nowrap transition-colors active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35',
  buttonIdle: 'border border-[#3359c5]/35 bg-[#11295f]/80 text-[#9fb0d7] hover:bg-[#17336f]',
  buttonOpen: 'bg-[#183166] text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
  buttonHasValue:
    'inline-flex min-h-10 items-center rounded-full bg-[#183166] px-3 py-2 pr-8 text-[12px] font-medium tracking-wide text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)] transition-colors',
  clearButton:
    'absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[#e6ecff] transition-colors hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/40',
  clearIcon: 'h-3 w-3',
  chevron:
    'h-3.5 w-3.5 shrink-0 text-[#9fb0d7] transition-transform duration-200 motion-reduce:transition-none',
  chevronOpen: 'rotate-180 text-[#e6ecff]',
  /** Periodi rapidi nel drawer (All / Oggi / Mese / Altro) */
  quickPill:
    'inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 py-2 text-[12px] font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35',
  quickPillIdle: 'border-[#3359c5]/35 bg-[#11295f]/80 text-[#9fb0d7] hover:bg-[#17336f]',
  quickPillActive:
    'border-transparent bg-[#183166] text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
  filterDrawerClearAll:
    'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap bg-red-500/15 text-red-200 transition-all duration-200 hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/35 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
} as const;

import { stitchTransactionFormModal } from '@/components/form/form-modal-styles';

export { stitchTransactionFormModal };

/**
 * Modale creazione/modifica budget — stesso shell/footer/CTA di {@link stitchTransactionFormModal};
 * pannello categorie allineato a stitchBudgets (liquid glass, bordi #3359c5).
 */
export const stitchBudgetFormModal = {
  drawerSurface: stitchTransactionFormModal.drawerSurface,
  handle: stitchTransactionFormModal.handle,
  drawerHeaderShell: stitchTransactionFormModal.drawerHeaderShell,
  headerTitle: stitchTransactionFormModal.headerTitle,
  headerClose: stitchTransactionFormModal.headerClose,
  formColumn: stitchTransactionFormModal.formColumn,
  scrollBody: stitchTransactionFormModal.scrollBody,
  fieldStack: stitchTransactionFormModal.fieldStack,
  errorBanner: stitchTransactionFormModal.errorBanner,
  fieldError: stitchTransactionFormModal.fieldError,
  stickyFooter: stitchTransactionFormModal.stickyFooter,
  footerActionsStack: stitchTransactionFormModal.footerActionsStack,
  primaryCta: stitchTransactionFormModal.primaryCta,
  deleteButton: stitchTransactionFormModal.deleteButton,
  noteShell: stitchTransactionFormModal.noteShell,
  noteLabel: stitchTransactionFormModal.noteLabel,
  noteInput: stitchTransactionFormModal.noteInput,
  amountSection: stitchTransactionFormModal.amountSection,
  amountEyebrow: stitchTransactionFormModal.amountEyebrow,
  amountRow: stitchTransactionFormModal.amountRow,
  amountCurrency: stitchTransactionFormModal.amountCurrency,
  amountInput: stitchTransactionFormModal.amountInput,
  amountTrack: stitchTransactionFormModal.amountTrack,
  amountTrackFill: stitchTransactionFormModal.amountTrackFill,
  gridTwoCol: 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3',
  /** Pannello categorie: stesso “glass card” della nota / campi Stitch. */
  categoryShell: stitchTransactionFormModal.noteShell,
  categoryToolbar: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
  categorySearchWrap: 'relative min-w-0 flex-1',
  categorySearchIcon:
    'pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-[#9fb0d7]/65',
  categorySearchInput:
    'h-11 w-full rounded-xl border border-[#3359c5]/35 bg-[#0b1f4f]/90 pl-10 pr-3 text-sm text-[#e6ecff] placeholder:text-[#9fb0d7]/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors focus-visible:border-[#5c77cc]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c77cc]/25',
  categoryQuickActions: 'flex shrink-0 items-center gap-2 sm:pt-0',
  categoryQuickBtn:
    'rounded-lg border border-[#3359c5]/30 bg-[#0b1f4f]/50 px-3 py-2 text-[12px] font-semibold text-[#c5cfe8] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors hover:border-[#5c77cc]/45 hover:bg-[#11295f]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c77cc]/35 disabled:pointer-events-none disabled:opacity-35',
  /** Sezione categorie incluse: chip “pill” come la griglia (coerenza visiva), wrap senza scroll orizzontale. */
  selectedSection:
    'rounded-xl border border-[#6b9fff]/20 bg-[linear-gradient(180deg,rgba(26,52,120,0.35)_0%,rgba(7,21,54,0.65)_100%)] p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
  selectedSectionTitle:
    'mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#b8c5ff]',
  selectedPillList: 'list-none flex flex-wrap gap-2 p-0 m-0',
  /** Allineata a `categoryChip` in stato selezionato; chiusura con X. */
  selectedPill:
    'inline-flex max-w-full min-h-[40px] min-w-0 items-center gap-2 rounded-xl border border-[#6b9fff]/50 bg-[#1a3478]/90 py-1.5 pl-3 pr-1 text-sm font-medium text-[#e6ecff] shadow-[0_0_0_1px_rgba(107,159,255,0.18)] ring-1 ring-[#6b9fff]/22',
  selectedPillLabel: 'min-w-0 flex-1 truncate text-left leading-snug',
  selectedPillRemove:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#c5d8ff]/90 transition-colors hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8fb0ff]/45 disabled:pointer-events-none disabled:opacity-35',
  categoryChipGrid: 'flex flex-wrap gap-2',
  categoryChip:
    'inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0b1f4f]/50 px-3 py-2 text-left text-sm font-medium text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-all hover:border-[#3359c5]/40 hover:bg-[#11295f]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5c77cc]/35 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] motion-reduce:active:scale-100',
  categoryChipSelected:
    'border-[#6b9fff]/50 bg-[#1a3478]/85 shadow-[0_0_0_1px_rgba(107,159,255,0.2)] ring-1 ring-[#6b9fff]/25',
  categoryChipLabel: 'min-w-0 flex-1 truncate',
  categoryChipCheck: 'h-4 w-4 shrink-0 text-[#9ec0ff]',
  categoryColorDot: 'h-2.5 w-2.5 shrink-0 rounded-full',
  categoryEmpty: 'w-full py-8 text-center text-sm text-[#9fb0d7]',
} as const;

/**
 * Settings page — dark Stitch (aligned with stitchHome / stitchDashboardShell).
 */
export const stitchSettings = {
  pageMain: 'flex flex-col gap-5 px-4 pt-1 pb-20',
  sectionEyebrow: 'px-2 text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
  sectionCard:
    'overflow-hidden rounded-2xl border border-[#3359c5]/20 bg-[#0b1f4f]/90 shadow-[0_16px_36px_rgba(0,7,30,0.28)]',
  row: 'flex w-full cursor-pointer items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[#11295f]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/45',
  rowDivider: 'border-b border-white/[0.06]',
  rowLeft: 'flex min-w-0 flex-1 items-center gap-3',
  rowIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#8fb0ff]/35 bg-[#8fb0ff]/12 text-[#dde1ff]',
  rowIcon: 'h-5 w-5 shrink-0 text-[#8fb0ff]',
  rowLabel: 'truncate text-base font-medium text-[#e6ecff]',
  rowValue: 'shrink-0 text-sm text-[#9fb0d7]',
  rowChevron: 'h-5 w-5 shrink-0 text-[#6f8dd5]',
  profileCard:
    'flex flex-col items-center gap-4 rounded-2xl border border-[#3359c5]/20 bg-[#0b1f4f]/90 p-4 shadow-[0_16px_36px_rgba(0,7,30,0.28)] sm:flex-row sm:items-start sm:p-5',
  profileAvatar:
    'flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#2a447f] text-2xl font-bold text-[#9eb6ff]',
  profileInfo: 'min-w-0 flex-1 text-center sm:text-left',
  profileName: 'truncate text-xl font-semibold tracking-tight text-[#8fb0ff]',
  profileEmail: 'mt-1 truncate text-sm text-[#9fb0d7]',
  editButton:
    'inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#3359c5]/35 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#c5cfe8] transition-colors hover:border-[#5c77cc]/45 hover:bg-[#11295f]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/35',
  darkModeTrack:
    'flex h-6 w-11 shrink-0 items-center rounded-full bg-[#11295f] p-0.5 transition-colors',
  darkModeTrackOn: 'bg-[#1a3478]',
  darkModeKnob: 'size-4 rounded-full bg-white shadow-sm transition-transform duration-200',
  darkModeKnobOn: 'translate-x-5',
  logoutButton:
    'mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-[#5c1a1a]/55 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#ffb4ab] transition-colors hover:border-red-400/45 hover:bg-[#5c1a1a]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/35 disabled:pointer-events-none disabled:opacity-50',
  skeletonShimmer: 'animate-pulse bg-[#11295f]/80',
  skeletonEyebrow: 'mx-2 h-3 w-24 rounded',
  skeletonCard: 'h-28 rounded-2xl',
  skeletonRow: 'h-14 rounded-xl',
} as const;
