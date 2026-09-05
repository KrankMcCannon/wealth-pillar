import type { CSSProperties } from 'react';
import type { Transaction } from '@/lib';

export const typographyStyles = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  heading: 'text-lg sm:text-xl font-bold tracking-tight',
  subheading: 'text-base font-semibold',
  body: 'text-sm',
  bodySmall: 'text-xs',
  label: 'text-xs font-medium',
  caption: 'text-xs text-primary/60',
  amount: 'text-lg sm:text-xl font-bold tracking-tight',
  amountLarge: 'text-2xl sm:text-3xl font-bold tracking-tight',
} as const;

export const spacingStyles = {
  page: {
    mobile: 'p-3',
    tablet: 'sm:p-4',
    desktop: 'md:p-6',
  },
  section: {
    mobile: 'px-3 py-4',
    tablet: 'sm:px-4 sm:py-6',
    desktop: 'md:px-6 md:py-8',
  },
  card: {
    compact: 'p-3',
    default: 'p-4',
    comfortable: 'p-6',
    large: 'p-8',
  },
} as const;

export const radiusStyles = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
  raw: {
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
} as const;

export const shadowStyles = {
  xs: 'shadow-xs',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  card: 'shadow-sm',
  elevated: 'shadow-lg',
  modal: 'shadow-xl',
} as const;

export const zIndexStyles = {
  classes: {
    raised: 'z-10',
    dropdown: 'z-20',
    sticky: 'z-30',
    bottomNav: 'z-[48]',
    modal: 'z-[150]',
    popover: 'z-[160]',
    tooltip: 'z-[170]',
  },
} as const;

export const animationStyles = {
  classes: {
    fast: 'duration-150',
    normal: 'duration-200',
    slow: 'duration-300',
    transition: 'transition-all duration-200',
    transitionFast: 'transition-all duration-150',
    transitionSlow: 'transition-all duration-300',
  },
} as const;

export const transactionTokens = {
  type: {
    expense: {
      icon: 'bg-expense/15 text-expense',
      badge: 'bg-expense/12 text-expense',
      text: 'text-destructive',
      color: 'bg-expense',
    },
    income: {
      icon: 'bg-income/15 text-income',
      badge: 'bg-income/12 text-income',
      text: 'text-income',
      color: 'bg-income',
    },
    transfer: {
      icon: 'bg-muted text-muted-foreground',
      badge: 'bg-muted/80 text-muted-foreground',
      text: 'text-muted-foreground',
      color: 'bg-muted',
    },
  },
  groupedCard: {
    spacing: {
      cardPadding: 'py-0',
      rowPadding: 'p-2',
      rowGap: 'gap-3',
      contentGap: 'gap-1.5',
    },
    borders: {
      rowDivider: 'divide-y divide-border/25',
      lastRowNoBorder: 'last:border-0',
    },
    row: {
      base: 'relative cursor-pointer rounded-lg bg-muted/90',
      hover: 'hover:bg-accent active:bg-accent',
      deleteLayer: 'absolute right-0 top-0 bottom-0 flex items-center justify-end',
    },
    icon: {
      container: `flex size-9 items-center justify-center ${radiusStyles.md} ${shadowStyles.sm} shrink-0`,
      hover: '',
    },
    text: {
      title: 'font-semibold truncate text-[15px] text-foreground',
      metadata: `${typographyStyles.xs} text-muted-foreground font-medium`,
      metadataSecondary: `${typographyStyles.xs} text-muted-foreground`,
      separator: `${typographyStyles.xs} text-border`,
      amount: 'text-[15px] font-bold tracking-tight',
      amountSecondary: 'mt-0.5 text-[10px] font-medium text-muted-foreground',
    },
    badge: {
      base: 'text-[10px] font-semibold px-1.5 py-0 border-primary/10',
    },
    deleteButton: {
      base: 'h-full px-4 font-semibold text-destructive-foreground flex items-center justify-center bg-destructive',
      active: 'active:opacity-90',
    },
  },
  cardVariants: {
    regular: {
      card: `py-0 bg-card ${shadowStyles.sm} ${radiusStyles.lg} overflow-hidden`,
      header: 'bg-primary/5 px-4 py-2',
    },
    recurrent: {
      card: `py-0 bg-primary/5 ${shadowStyles.md} ${radiusStyles.lg} overflow-hidden`,
      header: 'bg-primary/10 px-4 py-2',
    },
  },
  contextColors: {
    due: {
      urgent: 'bg-destructive/10 text-destructive',
      warning: 'bg-warning/10 text-warning',
      normal: 'bg-primary/10 text-primary',
    },
    dueBadge: {
      urgent: 'border-destructive/30 text-destructive bg-destructive/10',
      warning: 'border-warning/30 text-warning bg-warning/10',
      normal: 'border-primary/20 text-primary bg-primary/10',
    },
  },
  components: {
    header: {
      title: typographyStyles.heading,
      button: `text-primary hover:bg-primary hover:text-primary-foreground ${radiusStyles.md} ${animationStyles.classes.transition} p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center`,
    },
    userSelector: {
      container: `sticky top-[60px] ${zIndexStyles.classes.raised} bg-background border-b border-border/25 px-3 sm:px-4 py-2`,
    },
    tabNavigation: {
      container: 'flex gap-2 border-b border-border/25 px-3 sm:px-4 py-2',
      tab: `px-4 py-2 ${typographyStyles.sm} font-medium rounded-t-lg`,
      tabActive: 'text-primary border-b-2 border-primary',
      tabInactive: 'text-primary/60 hover:text-foreground',
    },
    dayGroup: {
      header: 'mb-2 flex items-center justify-between px-1',
      title: 'text-sm font-medium text-muted-foreground',
      stats: 'text-right',
      statsLabel: 'text-xs text-muted-foreground',
      statsValue: 'text-xs font-bold tabular-nums',
      statsValuePositive: 'text-income',
      statsValueNegative: 'text-expense',
      count: 'mt-0.5 text-xs text-muted-foreground',
    },
    modal: {
      content: 'bg-card',
    },
  },
} as const;

export const transactionStyles = {
  page: {
    container: 'relative flex w-full min-h-[100svh] flex-col bg-background',
    main: `flex-1 ${spacingStyles.page.mobile} space-y-6 sm:space-y-8 pb-14`,
    loadingContent: 'space-y-6',
  },
  layout: {
    controlsStack: 'px-3 pt-2 pb-3 sm:px-4 sm:pt-3 sm:pb-3',
    controlsCard:
      'rounded-2xl border border-border/60 bg-card shadow-sm space-y-3 p-2.5 sm:space-y-4 sm:p-3.5',
    contentStack: 'space-y-4 sm:space-y-5',
    listBlock:
      'sm:rounded-2xl sm:border sm:border-border/50 sm:bg-card sm:p-4 sm:shadow-sm sm:shadow-muted/15',
    pageErrorBanner:
      'flex items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive/80 mb-3',
    pageErrorRetry:
      'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/30 motion-reduce:active:scale-100',
  },
  header: {
    inner: 'flex items-center justify-between',
    title: transactionTokens.components.header.title,
    button: transactionTokens.components.header.button,
  },
  userSelector: {
    container: transactionTokens.components.userSelector.container,
    className: 'bg-card border-border',
  },
  tabNavigation: {
    container: transactionTokens.components.tabNavigation.container,
    tab: transactionTokens.components.tabNavigation.tab,
    tabActive: transactionTokens.components.tabNavigation.tabActive,
    tabInactive: transactionTokens.components.tabNavigation.tabInactive,
    wrapper: 'w-full',
  },
  dayGroup: {
    header: 'flex items-end justify-between gap-3 border-b border-foreground/10 px-1 pb-1',
    title: 'text-base font-semibold leading-tight text-foreground',
    stats: 'text-right',
    statsTotal: 'flex items-baseline justify-end gap-1.5',
    statsTotalLabel: 'text-sm font-medium text-muted-foreground',
    statsTotalValue: 'text-base font-semibold tabular-nums leading-none text-foreground',
    statsTotalValuePositive: 'text-foreground',
    statsTotalValueNegative: 'text-foreground',
    statsCount: 'mt-0.5 text-sm text-muted-foreground',
  },
  modal: {
    content: transactionTokens.components.modal.content,
  },
  form: {
    container: 'space-y-4',
    error: 'bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4',
    errorText: 'text-sm text-destructive font-medium',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  },
  skeleton: {
    base: 'animate-pulse',
    card: 'bg-card rounded-lg p-3',
    line: 'h-4 bg-primary/15 rounded',
    lineShort: 'w-1/3 h-4 bg-primary/15 rounded',
    lineMedium: 'w-2/3 h-4 bg-primary/15 rounded',
    circle: 'w-10 h-10 rounded-lg bg-primary/12',
    rect: 'rounded bg-primary/12',
    title: 'h-6 w-32 bg-card/60 rounded animate-pulse',
  },
  skeletons: {
    header:
      'sticky top-0 z-20 bg-background border-b border-border/25 px-3 sm:px-4 py-2 sm:py-3 shadow-sm',
    headerRow: 'flex items-center justify-between',
    headerIcon: 'w-10 h-10 bg-primary/20 rounded-xl',
    headerTitle: 'h-6 bg-primary/15 rounded w-24',
    userSelector:
      'sticky top-[60px] z-10 bg-background border-b border-border/25 px-3 sm:px-4 py-2',
    userSelectorListSpacing: 'flex items-center gap-2',
    userSelectorChip: 'shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/15',
    userSelectorDot: 'w-5 h-5 bg-primary/25 rounded-full',
    userSelectorText: 'w-12 h-3 bg-primary/20 rounded',
    userSelectorListStyle: { height: 44 } satisfies CSSProperties,
    card: 'p-3 rounded-lg border border-primary/20 bg-card',
    cardRow: 'flex items-center gap-3',
    cardIcon: 'w-10 h-10 bg-primary/20 rounded-lg shrink-0',
    cardBody: 'flex-1',
    cardLinePrimary: 'h-4 bg-primary/25 rounded w-3/4 mb-1',
    cardLineSecondary: 'h-3 bg-primary/15 rounded w-1/2',
    cardAmount: 'text-right shrink-0',
    cardAmountLine: 'h-4 bg-primary/20 rounded w-16 mb-1',
    cardAmountSub: 'h-3 bg-primary/10 rounded w-12',
    dayGroup: 'space-y-3',
    dayGroupHeader: 'flex items-center justify-between mb-2 px-1',
    dayGroupTitle: 'h-5 bg-primary/20 rounded w-24',
    dayGroupTotal: 'text-right',
    dayGroupTotalLine: 'h-4 bg-primary/20 rounded w-16 mb-1',
    dayGroupTotalSub: 'h-3 bg-primary/10 rounded w-12',
    tabNav: 'flex gap-2 border-b border-border/25 px-3 py-2',
    tabListSpacing: 'flex gap-2 w-full',
    tabPill: 'bg-primary/15 rounded-lg',
    tabPillHeight: 'h-10',
    tabPillWidth: 'w-24',
    recurring: 'p-4 rounded-lg border border-primary/20 bg-card space-y-4',
    recurringListSpacing: 'space-y-4',
    recurringRow: 'flex items-center gap-3',
    recurringIcon: 'w-10 h-10 bg-primary/20 rounded-lg shrink-0',
    recurringBody: 'flex-1',
    recurringLinePrimary: 'h-4 bg-primary/25 rounded w-3/4 mb-1',
    recurringLineSecondary: 'h-3 bg-primary/15 rounded w-1/2',
    recurringAction: 'w-8 h-8 bg-primary/20 rounded-full',
    listSpacing: 'space-y-6',
    fullPage: 'flex flex-col min-h-screen bg-background',
    main: 'flex-1 px-4 py-4',
    dayGroupListSpacing: 'space-y-3',
    pagination: {
      container: 'flex justify-center gap-2 py-4',
      button: 'h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center',
      active: 'bg-primary/20',
    },
  },
  groupedCard: {
    variantRegular: 'overflow-hidden rounded-xl border border-border/25 bg-card',
    variantRecurrent: 'overflow-hidden rounded-xl border border-border/25 bg-muted/60',
    headerRegular: 'border-b border-border/25 px-3 py-2',
    headerRecurrent: 'border-b border-border/25 bg-muted/40 px-3 py-2',
    headerContent: 'flex items-center justify-between',
    headerLabel: 'text-[11px] font-semibold uppercase tracking-wide text-muted-foreground',
    headerAmount: 'text-base font-bold tabular-nums',
    rowContainer: transactionTokens.groupedCard.borders.rowDivider,
    backdrop: 'fixed inset-0 z-10',
    openState: 'relative z-20',
  },
  filters: {
    container: 'flex flex-col gap-4',
    searchStack: 'min-w-0 shrink-0',
    toolsCluster: 'flex min-w-0 flex-col gap-2.5 border-t border-border/25 pt-3',
    chipsCluster: 'border-t border-border/25 pt-2.5',
    budgetBanner:
      'flex items-center justify-between gap-3 rounded-2xl border border-border/30 bg-muted/60 px-4 py-3',
    budgetBannerLeft: 'flex min-w-0 items-center gap-2',
    budgetBannerDot:
      'h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse motion-reduce:animate-none',
    budgetBannerText: 'truncate text-sm font-medium text-foreground',
    budgetBannerCount: 'text-xs text-muted-foreground',
    budgetBannerExit:
      'inline-flex items-center gap-1 rounded-lg border border-border/35 bg-muted/80 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
    budgetBannerExitIcon: 'h-3 w-3',
    searchWrap: 'relative',
    searchIcon: 'absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors duration-200',
    searchIconActive: 'text-primary',
    searchIconInactive: 'text-muted-foreground',
    searchInput:
      'min-h-11 w-full rounded-2xl border border-border/35 bg-muted/85 py-3 pl-12 pr-10 text-sm font-medium text-foreground ring-1 ring-inset ring-border/40 placeholder:text-muted-foreground/55 transition-colors outline-none focus-visible:border-border/45 focus-visible:outline-none focus-visible:ring-0 motion-reduce:transition-none',
    quickPeriodRow: 'flex flex-wrap gap-1.5 sm:gap-2',
    quickPeriodPill:
      'inline-flex min-h-10 shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 sm:min-h-11 sm:text-sm',
    quickPeriodPillIdle: 'border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
    quickPeriodPillActive:
      'border-transparent bg-accent text-foreground ring-1 ring-inset ring-primary/35',
    searchClear:
      'absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
    searchClearIcon: 'h-4 w-4 text-foreground',
    chipsRow: 'flex items-center gap-2 overflow-x-auto pb-0.5 pl-0.5 pr-1 scrollbar-hide sm:pl-0',
    advancedControlsRow:
      'flex flex-wrap items-start justify-between gap-2.5 sm:items-center sm:gap-3',
    advancedToggle:
      'inline-flex min-h-11 items-center gap-2 rounded-full border border-border/35 bg-muted/80 px-3 py-2 text-sm font-medium text-foreground transition-all duration-150 hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 motion-reduce:transition-none motion-reduce:active:scale-100',
    advancedToggleChevron:
      'h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none',
    advancedToggleChevronOpen: 'rotate-180',
    advancedCountBadge: 'rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-foreground',
    advancedClearWrap: 'ml-auto flex items-center gap-2',
    clearAll:
      'inline-flex items-center gap-1.5 rounded-full border border-expense/35 bg-expense/12 px-3 py-2 text-sm font-medium whitespace-nowrap text-expense transition-all duration-200 hover:bg-expense/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-expense/35 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    clearAllIcon: 'h-3.5 w-3.5',
    chip: {
      wrapper: 'relative inline-flex',
      buttonActive:
        'inline-flex min-h-11 items-center gap-2 rounded-full bg-accent py-2 pl-3 pr-8 text-sm font-medium whitespace-nowrap text-foreground ring-1 ring-inset ring-primary/35 transition-all duration-200 select-none hover:bg-accent/95 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
      clearButton:
        'absolute right-1 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-accent/80 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
      clearIcon: 'h-3 w-3 text-foreground',
      buttonBase:
        'inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border/35 bg-muted/80 px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200 select-none hover:bg-accent active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 sm:min-h-11',
      buttonOpen: 'bg-accent text-foreground ring-1 ring-inset ring-primary/35',
      buttonIdle: 'text-muted-foreground',
      chevron: 'h-3.5 w-3.5 transition-transform duration-200',
      chevronOpen: 'rotate-180',
    },
    drawer: {
      content: 'rounded-t-3xl border-t border-border bg-card shadow-xl',
      contentTall: 'max-h-[70vh] rounded-t-3xl border-t border-border bg-card shadow-xl',
      inner: 'space-y-4 p-4',
      header: 'flex items-center justify-between',
      title: 'text-lg font-semibold tracking-tight text-foreground',
      closeButton:
        'rounded-xl text-muted-foreground transition-colors hover:bg-muted/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35',
    },
    typeGrid: 'grid grid-cols-3 gap-2',
    typeButton:
      'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    typeButtonActive:
      'border-transparent bg-accent text-foreground ring-1 ring-inset ring-primary/35',
    typeButtonIdle: 'border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
    typeCheck: 'h-4 w-4',
    dateSection: 'space-y-4',
    dateGrid: 'grid grid-cols-2 gap-2',
    dateButton:
      'flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    dateButtonActive:
      'border-transparent bg-accent text-foreground ring-1 ring-inset ring-primary/35',
    dateButtonIdle: 'border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
    dateCustom: 'space-y-3 border-t border-border/25 pt-2',
    dateTitle: 'text-sm font-medium text-foreground',
    dateInputs: 'grid grid-cols-2 gap-3',
    dateField: 'space-y-1.5',
    dateLabel: 'text-xs text-muted-foreground',
    dateInput: 'rounded-xl border border-border/35 bg-muted/85 text-sm',
    dateApply: 'w-full rounded-xl',
    categorySection: 'space-y-3',
    categorySearchWrap: 'relative',
    categorySearchIcon: 'absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground',
    categorySearchInput: 'rounded-xl border border-border/35 bg-muted/85 pl-10',
    categoryGrid: 'grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1',
    categoryButton:
      'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
    categoryButtonActive:
      'border-transparent bg-accent text-foreground ring-1 ring-inset ring-primary/35',
    categoryButtonIdle: 'border-border/35 bg-muted/80 text-muted-foreground hover:bg-accent',
    categoryLabel: 'truncate',
    categoryLabelLeft: 'flex-1 truncate text-left',
    categoryCheck: 'h-4 w-4 shrink-0',
  },
  transactionRow: {
    wrapper: 'relative overflow-hidden touch-pan-y group',
    deleteLayer: `${transactionTokens.groupedCard.row.deleteLayer}`,
    deleteButton: `${transactionTokens.groupedCard.deleteButton.base} ${transactionTokens.groupedCard.deleteButton.active}`,
    content: `${transactionTokens.groupedCard.spacing.rowPadding} ${transactionTokens.groupedCard.row.base} ${transactionTokens.groupedCard.row.hover} ${transactionTokens.groupedCard.borders.lastRowNoBorder}`,
    contentLayout: `flex items-center justify-between ${transactionTokens.groupedCard.spacing.rowGap}`,
    leftSection: `flex items-center ${transactionTokens.groupedCard.spacing.rowGap} flex-1 min-w-0`,
    icon: `${transactionTokens.groupedCard.icon.container} ${transactionTokens.groupedCard.icon.hover}`,
    details: 'flex-1 min-w-0',
    title: transactionTokens.groupedCard.text.title,
    metadata: `flex items-center ${transactionTokens.groupedCard.spacing.contentGap} mt-0.5`,
    metadataText: transactionTokens.groupedCard.text.metadata,
    metadataSecondary: transactionTokens.groupedCard.text.metadataSecondary,
    separator: transactionTokens.groupedCard.text.separator,
    badge: transactionTokens.groupedCard.badge.base,
    rightSection: 'text-right shrink-0',
    amount: transactionTokens.groupedCard.text.amount,
    amountSecondary: transactionTokens.groupedCard.text.amountSecondary,
    deleteLayerStyle: (isOpen: boolean, actionWidth: number): CSSProperties => ({
      width: `${actionWidth}px`,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
    }),
  },
  dayList: {
    container: 'space-y-6',
    sectionHeader: 'mb-4',
    viewAllWrap: 'flex justify-center mt-6',
    viewAllButton: 'group',
    viewAllLabel: 'mr-2 text-primary',
    viewAllArrow:
      'text-primary transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
    skeleton: {
      container: 'space-y-6',
      header: 'mb-4',
      headerTitle: 'h-5 w-40 rounded animate-pulse bg-muted/60',
      headerSubtitle: 'mt-1 h-4 w-32 rounded animate-pulse bg-muted/50',
      group: 'space-y-3',
      groupHeader: 'flex items-center justify-between',
      groupTitle: 'h-4 w-24 rounded animate-pulse bg-muted/60',
      groupTotal: 'text-right',
      groupTotalLine: 'h-4 w-16 rounded animate-pulse bg-muted/60',
      groupTotalSub: 'mt-1 h-3 w-20 rounded animate-pulse bg-muted/50',
      card: 'space-y-3 rounded-xl border border-border/25 bg-card p-3',
      row: 'flex items-center gap-3',
      rowIcon: 'h-10 w-10 shrink-0 rounded-xl animate-pulse bg-muted/60',
      rowBody: 'flex-1 space-y-2',
      rowTitle: 'h-4 w-32 rounded animate-pulse bg-muted/60',
      rowSubtitle: 'h-3 w-20 rounded animate-pulse bg-muted/50',
      rowAmount: 'h-5 w-16 rounded animate-pulse bg-muted/60',
    },
  },
} as const;

type TransactionTypeKey = 'expense' | 'income' | 'transfer';

export function getTransactionTypeStyles(type: TransactionTypeKey) {
  return transactionTokens.type[type];
}

export function getAmountStyles(type: 'expense' | 'income' | 'transfer') {
  const typeStyles = transactionTokens.type[type];
  let prefix = '';
  if (type === 'expense') {
    prefix = '-';
  } else if (type === 'income') {
    prefix = '+';
  }

  return {
    text: typeStyles.text,
    prefix,
  };
}

export function getIconStyles(type: 'expense' | 'income' | 'transfer') {
  return transactionTokens.type[type].icon;
}

export function getDayTotalStyles(total: number) {
  return {
    value:
      total >= 0
        ? transactionStyles.dayGroup.statsTotalValuePositive
        : transactionStyles.dayGroup.statsTotalValueNegative,
  };
}

export function getCardVariantStyles(variant: 'regular' | 'recurrent') {
  return variant === 'recurrent'
    ? transactionStyles.groupedCard.variantRecurrent
    : transactionStyles.groupedCard.variantRegular;
}

export function getHeaderVariantStyles(variant: 'regular' | 'recurrent') {
  return variant === 'recurrent'
    ? transactionStyles.groupedCard.headerRecurrent
    : transactionStyles.groupedCard.headerRegular;
}

export function getTotalAmountColor(variant: 'regular' | 'recurrent', amount: number) {
  if (variant === 'recurrent') return 'text-primary';
  return amount >= 0 ? 'text-income' : 'text-expense';
}

export function getTransactionAmountColor(
  transaction: Pick<Transaction, 'type'>,
  variant: 'regular' | 'recurrent'
) {
  if (variant === 'recurrent') return 'text-primary';
  if (transaction.type === 'transfer') return 'text-muted-foreground';
  return transaction.type === 'income' ? 'text-income' : 'text-expense';
}

export function getTransactionIconColor(
  variant: 'regular' | 'recurrent',
  context: 'due' | 'informative',
  daysUntilDue: number
) {
  if (variant === 'recurrent' && context === 'due') {
    if (daysUntilDue <= 1) return transactionTokens.contextColors.due.urgent;
    if (daysUntilDue <= 3) return transactionTokens.contextColors.due.warning;
    return transactionTokens.contextColors.due.normal;
  }
  return 'bg-primary/10 text-primary';
}

export function getTransactionBadgeColor(
  variant: 'regular' | 'recurrent',
  context: 'due' | 'informative',
  daysUntilDue: number
) {
  if (variant === 'recurrent' && context === 'due') {
    if (daysUntilDue <= 1) return transactionTokens.contextColors.dueBadge.urgent;
    if (daysUntilDue <= 3) return transactionTokens.contextColors.dueBadge.warning;
    return transactionTokens.contextColors.dueBadge.normal;
  }
  return '';
}
