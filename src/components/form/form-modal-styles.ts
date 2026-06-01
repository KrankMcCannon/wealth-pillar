import { stitchSurface } from '@/styles/home-design-foundation';

/**
 * Shared form-modal layout tokens.
 */
export const formModalStyles = {
  drawerShell: {
    content:
      'fixed bottom-0 left-0 right-0 z-150 flex max-h-[96dvh] flex-col gap-0 overflow-hidden rounded-t-3xl border-t border-border/22 bg-card pb-[env(safe-area-inset-bottom)] shadow-xl',
    header: 'flex flex-col gap-2 border-b border-border/22 px-4 py-3 text-left',
    footer: 'mt-auto flex flex-col gap-3 p-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
  },
  shell: {
    content: 'gap-0 px-0 pb-0',
    handle:
      'mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full border-0 bg-modal-handle/40 opacity-100',
    header: 'flex flex-col gap-2 border-b border-border/22 px-4 py-3 text-left',
    title: 'min-w-0 flex-1 text-left text-lg font-semibold leading-snug text-modal-fg',
    description: 'text-left text-sm leading-relaxed text-modal-fg-muted',
    body: 'min-h-0 flex-1 overflow-y-auto bg-card px-4 py-2',
    closeButton:
      'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-modal-fg-muted transition-colors hover:bg-modal-elevated-hover hover:text-modal-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/35',
    loadingWrap: 'flex min-h-40 items-center justify-center bg-card py-8',
    sectionEyebrow: 'text-xs font-semibold uppercase tracking-wider text-modal-fg-muted',
  },
  field: {
    textShell:
      'rounded-xl border border-transparent bg-modal-elevated/85 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all focus-within:border-modal-ring/50 focus-within:ring-1 focus-within:ring-modal-ring/35',
    textLabel:
      'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-modal-fg-muted',
    textInput:
      'h-auto w-full border-0 bg-transparent p-0 text-base font-medium text-modal-fg shadow-none placeholder:text-modal-fg-muted/45 focus-visible:ring-0',
  },
  footer: {
    actionsStack: 'flex w-full flex-col gap-3',
    dualRow: 'flex w-full flex-col-reverse gap-3',
    dualCancel:
      'min-h-11 w-full border border-modal-border/30 bg-modal-elevated/85 font-semibold text-modal-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] hover:bg-modal-elevated-hover hover:text-modal-fg',
    dualSubmit: 'min-h-11 w-full font-semibold',
    secondaryAction:
      'flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-modal-ring/35 bg-modal-elevated/85 px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-modal-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:bg-modal-elevated-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/35 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:active:scale-100',
    confirmMessage: 'text-sm leading-relaxed text-modal-fg',
  },
  headerTitle:
    'min-w-0 flex-1 text-left text-xl font-semibold leading-snug tracking-tight text-modal-fg',
  formColumn: 'flex min-h-0 flex-1 flex-col',
  scrollBody:
    'flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-1 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
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
  fieldStack: 'flex flex-col gap-3',
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
  deleteButton: `flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] ${stitchSurface.dangerButton} active:scale-[0.98] motion-reduce:active:scale-100`,
  footerActionsStack: 'flex w-full flex-col gap-3', // alias — prefer footer.actionsStack
  stickyFooter: `${stitchSurface.modalFooter} px-4 py-4 -mx-4`,
  primaryCta: stitchSurface.primaryCta,
  categoryShell:
    'rounded-xl border border-transparent bg-modal-elevated/85 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
  categoryToolbar: 'flex flex-col gap-3',
  categorySearchWrap: 'relative min-w-0 flex-1',
  categorySearchIcon:
    'pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-modal-fg-muted/65',
  categorySearchInput:
    'h-11 w-full rounded-xl border border-modal-border/35 bg-modal-input-bg pl-10 pr-3 text-base text-modal-fg placeholder:text-modal-fg-muted/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors focus-visible:border-modal-ring/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/25',
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
      'h-10 w-full rounded-xl border border-modal-border/35 bg-modal-input-bg pl-8 pr-3 text-base text-modal-fg placeholder:text-modal-fg-muted/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors focus-visible:border-modal-ring/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/25',
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
