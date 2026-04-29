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
  titleEyebrow: 'text-[11px] font-bold uppercase tracking-wide text-[#001456]/70 dark:text-[#b8c5ff]',
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
