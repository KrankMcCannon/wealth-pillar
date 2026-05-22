/**
 * Shared form-modal layout tokens.
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
    'mr-1 text-3xl font-semibold tabular-nums text-modal-fg-muted/45 transition-colors group-focus-within/amount:text-modal-ring',
  amountInput:
    'min-w-0 flex-1 border-0 bg-transparent p-0 text-center text-3xl font-semibold tabular-nums tracking-tight text-modal-fg placeholder:text-modal-fg-muted/35 focus:outline-none focus:ring-0',
  amountTrack: 'mt-3 h-0.5 w-32 overflow-hidden rounded-full bg-modal-border/35',
  amountTrackFill:
    'h-full w-0 rounded-full bg-modal-ring transition-all duration-300 ease-out group-focus-within/amount:w-full',
  fieldStack: 'space-y-3',
  selectorTrigger:
    'flex min-h-[72px] w-full items-center justify-between gap-3 rounded-xl border border-transparent bg-modal-elevated/90 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-colors hover:bg-modal-elevated-hover focus:outline-none focus-visible:border-modal-ring/55 focus-visible:ring-2 focus-visible:ring-modal-ring/25 data-[state=open]:border-modal-ring/45',
  selectorIconWrap:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-modal-input-bg text-modal-ring shadow-sm shadow-black/20',
  selectorIcon: 'h-5 w-5 shrink-0 text-modal-ring/85',
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
  fieldError: 'px-1 text-xs text-modal-error-fg',
  deleteButton:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-red-500/45 bg-red-950/25 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-red-200 shadow-[inset_0_0_0_1px_rgba(248,113,113,0.12)] transition-colors hover:border-red-400/55 hover:bg-red-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/35 active:scale-[0.98] motion-reduce:active:scale-100',
  footerActionsStack: 'flex w-full flex-col gap-3',
  stickyFooter:
    'mt-auto shrink-0 border-t border-modal-border/30 bg-[oklch(0.12_0.04_265)]/92 px-4 py-4 backdrop-blur-xl supports-backdrop-filter:bg-[oklch(0.12_0.04_265)]/88 pb-[max(env(safe-area-inset-bottom),1rem)] -mx-4',
  primaryCta:
    'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-primary/35 bg-modal-elevated px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white shadow-[0_10px_32px_rgba(0,16,70,0.45)] ring-1 ring-inset ring-white/10 transition-all hover:border-modal-ring/45 hover:bg-modal-elevated-hover hover:shadow-[0_12px_36px_rgba(0,20,86,0.5)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none motion-reduce:active:scale-100',
  categoryShell:
    'rounded-xl border border-transparent bg-modal-elevated/85 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
  categoryToolbar: 'flex flex-col gap-3',
  categorySearchWrap: 'relative min-w-0 flex-1',
  categorySearchIcon:
    'pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-modal-fg-muted/65',
  categorySearchInput:
    'h-11 w-full rounded-xl border border-modal-border/35 bg-modal-input-bg pl-10 pr-3 text-sm text-modal-fg placeholder:text-modal-fg-muted/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors focus-visible:border-modal-ring/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/25',
  categoryQuickActions: 'flex shrink-0 items-center gap-2',
  categoryQuickBtn:
    'rounded-lg border border-modal-border/30 bg-modal-input-bg/50 px-3 py-2 text-[12px] font-semibold text-modal-fg-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors hover:border-modal-ring/45 hover:bg-modal-elevated-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/35 disabled:pointer-events-none disabled:opacity-35',
  selectedSection:
    'rounded-xl border border-modal-ring/20 bg-modal-elevated/35 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]',
  selectedSectionTitle:
    'mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-modal-fg-muted',
  selectedPillList: 'm-0 flex list-none flex-wrap gap-2 p-0',
  selectedPill:
    'inline-flex max-w-full min-h-[40px] min-w-0 items-center gap-2 rounded-xl border border-modal-ring/50 bg-modal-elevated/90 py-1.5 pl-3 pr-1 text-sm font-medium text-modal-fg shadow-[0_0_0_1px_rgba(107,159,255,0.18)] ring-1 ring-modal-ring/22',
  selectedPillLabel: 'min-w-0 flex-1 truncate text-left leading-snug',
  selectedPillRemove:
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-modal-fg-muted transition-colors hover:bg-white/[0.12] hover:text-modal-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/45 disabled:pointer-events-none disabled:opacity-35',
  categoryChipGrid: 'flex flex-wrap gap-2',
  categoryChip:
    'inline-flex min-h-[44px] max-w-full items-center gap-2 rounded-xl border border-white/[0.08] bg-modal-input-bg/50 px-3 py-2 text-left text-sm font-medium text-modal-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-all hover:border-modal-border/40 hover:bg-modal-elevated-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/35 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] motion-reduce:active:scale-100',
  categoryChipSelected: 'border-modal-ring/50 bg-modal-elevated/90 ring-1 ring-modal-ring/22',
  categoryChipLabel: 'min-w-0 truncate',
  categoryChipCheck: 'h-4 w-4 shrink-0 text-modal-fg',
  categoryColorDot: 'h-2.5 w-2.5 shrink-0 rounded-full',
  categoryEmpty: 'px-1 py-2 text-sm text-modal-fg-muted',
  select: {
    content:
      'relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-modal-border/40 bg-modal-elevated p-0 text-modal-fg shadow-[0_12px_40px_rgba(0,16,70,0.45)] ring-1 ring-inset ring-white/8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    searchWrap: 'sticky top-0 z-10 border-b border-modal-border/30 bg-modal-elevated p-2',
    searchFieldWrap: 'relative',
    searchIcon:
      'pointer-events-none absolute left-2 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-modal-fg-muted/65',
    searchInput:
      'h-10 w-full rounded-xl border border-modal-border/35 bg-modal-input-bg pl-8 pr-3 text-sm text-modal-fg placeholder:text-modal-fg-muted/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors focus-visible:border-modal-ring/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/25',
    optionsWrap: 'px-2 py-1',
    empty: 'py-6 text-center text-sm text-modal-fg-muted',
    optionRow: 'flex items-center gap-2 text-modal-fg',
    item: 'relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm text-modal-fg outline-none transition-colors focus:bg-modal-ring/20 focus:text-modal-fg data-[highlighted]:bg-modal-ring/20 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  },
  categoryDropdown: {
    content:
      'relative z-[10000] overflow-hidden rounded-xl border border-modal-border/40 bg-modal-elevated text-modal-fg shadow-[0_12px_40px_rgba(0,16,70,0.45)] ring-1 ring-inset ring-white/8',
    contentAnim:
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    searchWrap: 'border-b border-modal-border/30 bg-modal-elevated p-3',
    searchFieldWrap: 'relative',
    searchIcon:
      'pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-modal-fg-muted/65',
    viewport: 'max-h-[300px] overflow-y-auto p-3',
    recentWrap: 'mb-4',
    recentHeader: 'mb-2 flex items-center gap-2 px-1',
    recentIcon: 'h-3.5 w-3.5 text-modal-fg-muted',
    recentLabel: 'text-xs font-semibold uppercase tracking-wide text-modal-fg-muted',
    recentList: 'space-y-1',
    recentItem:
      'cursor-pointer rounded-lg outline-none hover:bg-modal-elevated-hover focus:outline-none',
    divider: 'my-3 h-px bg-modal-border/25',
    allHeader: 'mb-2 flex items-center gap-2 px-1',
    allIcon: 'h-3.5 w-3.5 text-modal-fg-muted',
    allLabel: 'text-xs font-semibold uppercase tracking-wide text-modal-fg-muted',
    empty: 'py-8 text-center text-sm text-modal-fg-muted',
    list: 'space-y-1',
    item: 'cursor-pointer rounded-lg outline-none focus:outline-none',
    itemRow: 'flex items-center gap-2 rounded-lg px-3 py-2 text-modal-fg transition-colors',
    itemSelected: 'bg-modal-ring/15',
    itemIcon: 'shrink-0',
    itemLabel: 'truncate text-sm font-medium text-modal-fg',
  },
  multiUser: {
    container:
      'space-y-2 rounded-xl border border-modal-border/30 bg-modal-elevated/35 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
    row: 'flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-modal-elevated-hover',
    rowActive: 'bg-modal-ring/12',
    userRow: 'flex flex-1 items-center gap-2',
    avatar:
      'flex size-8 items-center justify-center rounded-full bg-modal-ring text-sm font-medium text-modal-fg',
    name: 'text-sm font-medium text-modal-fg',
    current: 'text-xs text-modal-fg-muted',
  },
  preference: {
    list: 'space-y-2',
    itemBase:
      'flex w-full items-start gap-3 rounded-xl border border-transparent bg-modal-elevated/85 px-4 py-3 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all hover:border-modal-ring/35 hover:bg-modal-elevated-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/25 disabled:cursor-not-allowed disabled:opacity-50',
    itemActive: 'border-modal-ring/45 bg-modal-elevated ring-1 ring-modal-ring/22',
    itemIdle: 'border-transparent',
    radioBase:
      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-modal-border/40 bg-modal-input-bg transition-all',
    radioActive: 'border-modal-ring/55 bg-modal-ring',
    radioIdle: 'border-modal-border/40 bg-modal-input-bg',
    radioIcon: 'h-3 w-3 text-modal-fg',
    content: 'min-w-0 flex-1',
    titleRow: 'flex items-center gap-2',
    title: 'text-sm font-semibold text-modal-fg',
    titleActive: 'text-modal-fg',
    titleIdle: 'text-modal-fg',
    currentBadge:
      'rounded-full bg-modal-ring/20 px-2 py-0.5 text-xs font-medium text-modal-fg-muted',
    description: 'mt-0.5 break-words text-sm text-modal-fg-muted',
  },
} as const;

/** @deprecated Use formModalStyles — kept for incremental migration */
export const stitchTransactionFormModal = {
  drawerSurface: 'bg-card text-foreground',
  handle: 'mx-auto mb-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30',
  drawerHeaderShell: 'border-b border-border',
  headerTitle: formModalStyles.headerTitle,
  headerClose:
    'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
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
