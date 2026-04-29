/**
 * Home-first design foundation.
 * Reusable primitives to standardize the migration of dashboard-like pages.
 */

/** Legacy light-mode card tokens (budget detail pages, mixed surfaces). */
export const homeDesignFoundation = {
  sectionCard:
    'rounded-2xl border border-[#001456]/20 bg-[#f8f9ff] shadow-sm dark:border-[#8ba3ff]/30 dark:bg-[#1a2b6d]/20',
  rowCard:
    'rounded-xl border border-[#001456]/15 bg-white/80 dark:border-[#8ba3ff]/25 dark:bg-[#132050]/40',
  actionButton:
    'rounded-lg bg-[#001456] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1a2b6d]',
  titleEyebrow:
    'text-[11px] font-bold uppercase tracking-wide text-[#001456]/70 dark:text-[#b8c5ff]',
  strongValue: 'text-sm font-semibold text-[#001456] dark:text-[#eef1ff]',
} as const;

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
  stickyHeader:
    'fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b border-[#8ba3ff]/22 shadow-sm bg-[#0c1738]/88',
  bottomBar:
    'fixed bottom-0 left-0 right-0 z-40 overflow-visible border-t border-[#8ba3ff]/22 bg-[#0c1738]/94 backdrop-blur-md',
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
  mainStack: 'flex flex-col gap-3 px-3 pb-28 pt-1',
  /** Toolbar tipo / filtri in pagina: meno aria vuota sopra/sotto la riga chip. */
  chipRow:
    'flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide -mx-3 px-3',
  listSkeleton: 'space-y-3',
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
  buttonIdle:
    'border border-[#3359c5]/35 bg-[#11295f]/80 text-[#9fb0d7] hover:bg-[#17336f]',
  buttonOpen:
    'bg-[#183166] text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
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
  quickPillIdle:
    'border-[#3359c5]/35 bg-[#11295f]/80 text-[#9fb0d7] hover:bg-[#17336f]',
  quickPillActive:
    'border-transparent bg-[#183166] text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(143,176,255,0.28)]',
  filterDrawerClearAll:
    'inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap bg-red-500/15 text-red-200 transition-all duration-200 hover:bg-red-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/35 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
} as const;

/**
 * Modale aggiunta/modifica transazione — struttura allineata a stitch/html/13-modal-add-transaction
 * (drawer “liquid glass”, importo hero, righe selettore, nota, CTA sticky). Palette dark coerente con stitchTransactions.
 */
export const stitchTransactionFormModal = {
  /** Shell passata a ModalWrapper (drawer / dialog) */
  drawerSurface:
    'flex max-h-[min(751px,92dvh)] flex-col overflow-hidden rounded-t-[32px] border border-[#3359c5]/25 bg-[#0b1f4f]/92 shadow-[0_-8px_40px_rgba(0,20,86,0.28)] ring-1 ring-inset ring-white/10 backdrop-blur-[24px] sm:max-w-lg sm:rounded-2xl',
  handle: 'mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-[#5c77cc]/35',
  /** Header drawer transazioni: niente bg “card” chiaro, bordo sottile come Stitch */
  drawerHeaderShell:
    'border-0 border-b border-[#3359c5]/25 bg-transparent px-4 pb-4 pt-2 shadow-none',
  headerRow: 'mb-6 flex shrink-0 items-center justify-between gap-3 px-1',
  headerTitle:
    'min-w-0 flex-1 text-left text-xl font-semibold leading-snug tracking-tight text-[#e6ecff]',
  headerClose:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#11295f]/90 text-[#e6ecff] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-[#17336f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6b9fff]/45 active:scale-[0.97] motion-reduce:active:scale-100',
  formColumn: 'flex min-h-0 flex-1 flex-col',
  scrollBody:
    'min-h-0 flex-1 space-y-6 overflow-y-auto px-1 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  amountSection: 'flex flex-col items-center py-1',
  amountEyebrow: 'mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
  amountRow: 'group/amount flex w-full max-w-[220px] items-center justify-center',
  amountCurrency:
    'mr-1 text-3xl font-semibold tabular-nums text-[#9fb0d7]/45 transition-colors group-focus-within/amount:text-[#8fb0ff]',
  amountInput:
    'min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-3xl font-semibold tabular-nums tracking-tight text-[#e6ecff] placeholder:text-[#9fb0d7]/35 focus:outline-none focus:ring-0',
  amountTrack: 'mt-3 h-0.5 w-32 overflow-hidden rounded-full bg-[#3359c5]/35',
  amountTrackFill:
    'h-full w-0 rounded-full bg-[#6b9fff] transition-all duration-300 ease-out group-focus-within/amount:w-full',
  fieldStack: 'space-y-3',
  selectorTrigger:
    'flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-[#11295f]/90 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-[#17336f] focus:outline-none focus-visible:border-[#5c77cc]/55 focus-visible:ring-2 focus-visible:ring-[#5c77cc]/25 data-[state=open]:border-[#5c77cc]/45',
  selectorIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1a2b6d] text-[#b8c5ff] shadow-sm shadow-black/20',
  selectorLabel: 'text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
  selectorValue: 'truncate text-base font-medium text-[#e6ecff]',
  selectorValueMuted: 'truncate text-base font-medium text-[#9fb0d7]/55',
  selectorChevron: 'h-5 w-5 shrink-0 text-[#9fb0d7]/70',
  noteShell:
    'rounded-xl border border-transparent bg-[#11295f]/85 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all focus-within:border-[#5c77cc]/50 focus-within:ring-1 focus-within:ring-[#5c77cc]/35',
  noteLabel: 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#9fb0d7]',
  noteInput:
    'w-full border-0 bg-transparent p-0 text-base font-medium text-[#e6ecff] placeholder:text-[#9fb0d7]/45 focus:outline-none focus:ring-0',
  errorBanner: 'rounded-xl border border-red-500/35 bg-red-950/35 px-3 py-2 text-sm text-red-200',
  fieldError: 'px-1 text-xs text-red-300',
  deleteButton:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-red-500/45 bg-red-950/25 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-red-200 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.12)] transition-colors hover:border-red-400/55 hover:bg-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/35 active:scale-[0.98] motion-reduce:active:scale-100',
  /** Colonna azioni nel footer (CTA principale, poi Elimina in modifica) */
  footerActionsStack: 'flex w-full flex-col gap-3',
  stickyFooter:
    'mt-auto shrink-0 border-t border-[#3359c5]/30 bg-[#080f28]/92 px-4 py-4 backdrop-blur-xl supports-backdrop-filter:bg-[#080f28]/88 pb-[max(env(safe-area-inset-bottom),1rem)] sm:pb-4 -mx-4',
  /** CTA come Stitch 13: primario scuro, tracking largo, alone */
  primaryCta:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-[#4d6fd0]/35 bg-[#183166] px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_32px_rgba(0,16,70,0.45)] ring-1 ring-inset ring-white/10 transition-all hover:border-[#6b8fff]/45 hover:bg-[#1f3d85] hover:shadow-[0_12px_36px_rgba(0,20,86,0.5)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100',
} as const;
