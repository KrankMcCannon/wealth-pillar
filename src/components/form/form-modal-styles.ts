import { stitchSurface } from '@/styles/home-design-foundation';

/**
 * Shared form-modal layout tokens.
 * Chrome: adaptive dialog (prototype C). Palette: composer (prototype B).
 */
export const formModalStyles = {
  drawerShell: {
    content:
      'fixed bottom-0 left-0 right-0 z-150 flex max-h-[96dvh] flex-col gap-0 overflow-hidden rounded-t-3xl border-t border-foreground/10 bg-background shadow-xl',
    alertContent:
      'bottom-auto left-1/2 right-auto top-1/2 max-h-[90dvh] w-[min(100%-2rem,24rem)] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-foreground/10 bg-background shadow-[0_24px_64px_rgba(0,8,40,0.35)]',
    header: 'flex flex-col gap-1 border-b border-foreground/10 px-3 pt-2 pb-2 text-center',
    footer: 'mt-auto flex flex-col gap-2 p-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
  },
  shell: {
    content: 'gap-0 bg-background px-0 pb-0',
    formContent:
      'mx-auto h-auto max-h-[90dvh] min-h-0 w-full max-w-lg gap-0 border border-foreground/10 bg-background px-0 pb-0 shadow-[0_24px_64px_rgba(0,8,40,0.45)] md:bottom-auto md:left-1/2 md:right-auto md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl',
    handle:
      'mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full border-0 bg-muted-foreground/35 opacity-100',
    header: 'flex shrink-0 flex-col gap-1 px-3 pt-3 pb-2 text-center',
    title: 'min-w-0 flex-1 text-center text-base font-semibold leading-snug text-foreground',
    description: 'text-center text-sm leading-relaxed text-muted-foreground',
    body: 'flex min-h-0 flex-1 flex-col overflow-hidden bg-background',
    closeButton:
      'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25',
    leadingButton:
      'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-expense transition-colors hover:bg-expense/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/40',
    loadingWrap: 'flex min-h-40 items-center justify-center bg-background py-8',
    sectionEyebrow: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground',
  },
  field: {
    textShell: 'flex min-h-12 items-center justify-between gap-3 px-4 py-2',
    textLabel:
      'mb-0 min-w-0 max-w-[70%] shrink-0 text-[15px] font-normal leading-snug text-muted-foreground',
    textInput:
      'h-auto w-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-right text-[15px] font-medium tabular-nums text-foreground shadow-none placeholder:text-foreground/35 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent',
  },
  footer: {
    actionsStack: 'flex w-full flex-col gap-2',
    dualRow: 'grid w-full grid-cols-2 gap-2',
    dualCancel:
      'inline-flex min-h-11 w-full items-center justify-center rounded-xl border-0 bg-muted text-sm font-semibold text-foreground shadow-none hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:pointer-events-none disabled:opacity-45',
    dualSubmit:
      'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-foreground text-sm font-semibold text-background shadow-none hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:pointer-events-none disabled:opacity-45',
    dualSubmitDanger: 'bg-expense text-white hover:bg-expense/90 focus-visible:ring-expense/50',
    secondaryAction:
      'flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 motion-reduce:active:scale-100',
    confirmMessage: 'text-sm leading-relaxed text-muted-foreground',
  },
  headerTitle:
    'min-w-0 flex-1 text-center text-base font-semibold leading-snug tracking-tight text-foreground',
  formColumn: 'flex min-h-0 flex-1 flex-col',
  fieldsColumn: 'flex flex-col gap-3',
  scrollBody:
    'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-0 pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
  amountSection: 'flex flex-col items-center py-2',
  amountEyebrow: 'sr-only',
  amountRow: 'flex items-baseline justify-center gap-1 text-foreground/45',
  amountCurrency: 'text-3xl font-medium tabular-nums',
  amountInput:
    'w-[8ch] max-w-full border-0 bg-transparent p-0 text-center text-5xl font-semibold tabular-nums tracking-tight text-foreground shadow-none outline-none placeholder:text-foreground/35 focus:ring-0 focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent',
  fieldStack: 'divide-y divide-foreground/10',
  selectorTrigger:
    'flex min-h-12 w-full items-center justify-between gap-3 bg-transparent px-4 py-2 text-left transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
  selectorLabel: 'min-w-0 max-w-[70%] shrink-0 text-[15px] leading-snug text-muted-foreground',
  selectorValue: 'min-w-0 flex-1 text-right text-[15px] font-medium leading-snug text-foreground',
  selectorValueMuted: 'min-w-0 flex-1 text-right text-[15px] font-medium leading-snug text-foreground/40',
  selectorChevron: 'h-4 w-4 shrink-0 text-foreground/35',
  noteShell: 'flex min-h-12 items-center justify-between gap-3 px-4 py-2',
  noteLabel: 'mb-0 shrink-0 text-[15px] font-normal text-muted-foreground',
  noteInput:
    'min-w-0 flex-1 border-0 bg-transparent p-0 text-right text-[15px] font-medium text-foreground placeholder:text-foreground/35 focus:outline-none focus:ring-0 dark:bg-transparent',
  errorBanner:
    'rounded-xl border border-modal-error-border/35 bg-modal-error-bg/35 px-3 py-2 text-sm text-modal-error-fg',
  fieldError: 'px-1 text-xs text-modal-error-fg',
  deleteButton: `flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl px-5 py-4 text-sm font-semibold uppercase tracking-[0.18em] ${stitchSurface.dangerButton} active:scale-[0.98] motion-reduce:active:scale-100`,
  footerActionsStack: 'flex w-full flex-col gap-3', // alias — prefer footer.actionsStack
  stickyFooter:
    'mt-0 shrink-0 border-t border-foreground/10 bg-background px-4 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
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
    'inline-flex min-h-9 flex-1 items-center justify-center rounded-xl bg-muted px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25 disabled:pointer-events-none disabled:opacity-35',
  categoryPicker:
    'flex min-h-0 flex-1 flex-col overflow-hidden max-h-[calc(90dvh-5rem)]',
  categoryPickerToolbar:
    'shrink-0 space-y-3 border-b border-foreground/10 bg-background px-4 py-3',
  categoryPickerSearchIcon:
    'pointer-events-none absolute left-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground',
  categoryPickerSearchInput:
    'h-11 w-full rounded-xl border border-foreground/10 bg-muted pl-10 pr-3 text-base text-foreground placeholder:text-foreground/35 shadow-none transition-colors focus-visible:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
  categoryPickerList:
    'min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(env(safe-area-inset-bottom),0.75rem)]',
  categoryColorDot: 'h-2.5 w-2.5 shrink-0 rounded-full',
  categoryEmpty: 'px-4 py-6 text-center text-sm text-muted-foreground',
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
  select: {
    content:
      'relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-foreground/10 bg-background p-0 text-foreground shadow-[0_12px_40px_rgba(0,8,40,0.45)] ring-1 ring-inset ring-white/8 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
    searchWrap: 'sticky top-0 z-10 border-b border-foreground/10 bg-background p-2',
    searchFieldWrap: 'relative',
    searchIcon:
      'pointer-events-none absolute left-2 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-modal-fg-muted/65',
    searchInput:
      'h-10 w-full rounded-xl border border-foreground/10 bg-muted pl-8 pr-3 text-base text-foreground placeholder:text-foreground/35 shadow-none transition-colors focus-visible:border-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20',
    optionsWrap: 'px-2 py-1',
    empty: 'py-6 text-center text-sm text-muted-foreground',
    optionRow: 'flex items-center gap-2 text-foreground',
    item: 'relative flex w-full cursor-default select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm text-foreground outline-none transition-colors focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
  },
  categoryDropdown: {
    content:
      'relative z-[10000] overflow-hidden rounded-xl border border-foreground/10 bg-background text-foreground shadow-[0_12px_40px_rgba(0,8,40,0.45)] ring-1 ring-inset ring-white/8',
    contentAnim:
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    searchWrap: 'border-b border-foreground/10 bg-background p-3',
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
    itemRow: 'flex items-center gap-2 rounded-lg px-3 py-2 text-foreground transition-colors',
    itemSelected: 'bg-muted',
    itemIcon: 'shrink-0',
    itemLabel: 'truncate text-sm font-medium text-modal-fg',
  },
  multiUser: {
    container: 'divide-y divide-foreground/10',
    row: 'flex min-h-12 cursor-pointer items-center justify-between gap-3 px-4 py-2 transition-colors hover:bg-muted/60',
    rowActive: 'bg-muted/60',
    singleOption:
      'flex w-full cursor-pointer items-center gap-3 rounded-xl border border-modal-border/30 bg-modal-elevated/35 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] transition-colors hover:bg-modal-elevated-hover',
    singleOptionActive: 'border-modal-ring/30 bg-modal-ring/12',
    userRow: 'flex min-w-0 flex-1 items-baseline gap-1.5',
    avatar:
      'flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground',
    name: 'truncate text-[15px] font-medium text-foreground',
    current: 'shrink-0 text-[15px] text-muted-foreground',
    checkbox:
      'border-foreground/25 shadow-none data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background',
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
