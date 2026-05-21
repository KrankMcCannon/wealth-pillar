import { modalWrapperStyles } from '@/components/ui/theme/modal-wrapper-styles';

/**
 * Shared form-modal layout tokens (Stitch dark surfaces via modal-* theme colors).
 */
export const formModalStyles = {
  headerTitle:
    'min-w-0 flex-1 text-left text-xl font-semibold leading-snug tracking-tight text-modal-fg',
  formColumn: 'flex min-h-0 flex-1 flex-col',
  scrollBody:
    'min-h-0 flex-1 space-y-6 overflow-y-auto px-1 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  amountSection: 'flex flex-col items-center py-1',
  amountEyebrow: 'mb-2 text-[11px] font-semibold uppercase tracking-wider text-modal-fg-muted',
  amountRow: 'group/amount flex w-full max-w-[220px] items-center justify-center',
  amountCurrency:
    'mr-1 text-3xl font-semibold tabular-nums text-modal-fg-muted/45 transition-colors group-focus-within/amount:text-primary',
  amountInput:
    'min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-3xl font-semibold tabular-nums tracking-tight text-modal-fg placeholder:text-modal-fg-muted/35 focus:outline-none focus:ring-0',
  amountTrack: 'mt-3 h-0.5 w-32 overflow-hidden rounded-full bg-modal-border/35',
  amountTrackFill:
    'h-full w-0 rounded-full bg-modal-ring transition-all duration-300 ease-out group-focus-within/amount:w-full',
  fieldStack: 'space-y-3',
  selectorTrigger:
    'flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-modal-elevated/90 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-modal-elevated-hover focus:outline-none focus-visible:border-modal-ring/55 focus-visible:ring-2 focus-visible:ring-modal-ring/25 data-[state=open]:border-modal-ring/45',
  selectorIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-modal-input-bg text-primary shadow-sm shadow-black/20',
  selectorLabel: 'text-[11px] font-semibold uppercase tracking-wider text-modal-fg-muted',
  selectorValue: 'truncate text-base font-medium text-modal-fg',
  selectorValueMuted: 'truncate text-base font-medium text-modal-fg-muted/55',
  selectorChevron: 'h-5 w-5 shrink-0 text-modal-fg-muted/70',
  noteShell:
    'rounded-xl border border-transparent bg-modal-elevated/85 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all focus-within:border-modal-ring/50 focus-within:ring-1 focus-within:ring-modal-ring/35',
  noteLabel: 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-modal-fg-muted',
  noteInput:
    'w-full border-0 bg-transparent p-0 text-base font-medium text-modal-fg placeholder:text-modal-fg-muted/45 focus:outline-none focus:ring-0',
  errorBanner:
    'rounded-xl border border-modal-error-border/35 bg-modal-error-bg/35 px-3 py-2 text-sm text-modal-error-fg',
  fieldError: 'px-1 text-xs text-red-300',
  deleteButton:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-red-500/45 bg-red-950/25 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-red-200 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.12)] transition-colors hover:border-red-400/55 hover:bg-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/35 active:scale-[0.98] motion-reduce:active:scale-100',
  footerActionsStack: 'flex w-full flex-col gap-3',
  stickyFooter:
    'mt-auto shrink-0 border-t border-modal-border/30 bg-[oklch(0.12_0.04_265)]/92 px-4 py-4 backdrop-blur-xl supports-backdrop-filter:bg-[oklch(0.12_0.04_265)]/88 pb-[max(env(safe-area-inset-bottom),1rem)] -mx-4',
  primaryCta:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-primary/35 bg-modal-elevated px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_32px_rgba(0,16,70,0.45)] ring-1 ring-inset ring-white/10 transition-all hover:border-modal-ring/45 hover:bg-modal-elevated-hover hover:shadow-[0_12px_36px_rgba(0,20,86,0.5)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100',
} as const;

/** @deprecated Use formModalStyles — kept for incremental migration */
export const stitchTransactionFormModal = {
  drawerSurface: modalWrapperStyles.drawerSurface,
  handle: modalWrapperStyles.handle,
  drawerHeaderShell: modalWrapperStyles.drawerHeaderShell,
  headerTitle: formModalStyles.headerTitle,
  headerClose: modalWrapperStyles.headerClose,
  formColumn: formModalStyles.formColumn,
  scrollBody: formModalStyles.scrollBody,
  amountSection: formModalStyles.amountSection,
  amountEyebrow: formModalStyles.amountEyebrow,
  amountRow: formModalStyles.amountRow,
  amountCurrency: formModalStyles.amountCurrency,
  amountInput: formModalStyles.amountInput,
  amountTrack: formModalStyles.amountTrack,
  amountTrackFill: formModalStyles.amountTrackFill,
  fieldStack: formModalStyles.fieldStack,
  selectorTrigger: formModalStyles.selectorTrigger,
  selectorIconWrap: formModalStyles.selectorIconWrap,
  selectorLabel: formModalStyles.selectorLabel,
  selectorValue: formModalStyles.selectorValue,
  selectorValueMuted: formModalStyles.selectorValueMuted,
  selectorChevron: formModalStyles.selectorChevron,
  noteShell: formModalStyles.noteShell,
  noteLabel: formModalStyles.noteLabel,
  noteInput: formModalStyles.noteInput,
  errorBanner: formModalStyles.errorBanner,
  fieldError: formModalStyles.fieldError,
  deleteButton: formModalStyles.deleteButton,
  footerActionsStack: formModalStyles.footerActionsStack,
  stickyFooter: formModalStyles.stickyFooter,
  primaryCta: formModalStyles.primaryCta,
  headerRow: 'mb-6 flex shrink-0 items-center justify-between gap-3 px-1',
} as const;
