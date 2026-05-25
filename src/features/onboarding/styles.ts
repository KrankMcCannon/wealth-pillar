export const onboardingStyles = {
  overlay:
    'fixed inset-0 z-[9999] flex items-center justify-center bg-background/60 backdrop-blur-sm px-3 sm:px-4 py-6 sm:py-8 overflow-y-auto',
  modal:
    'w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl sm:rounded-3xl border border-border/22 bg-card shadow-[0_16px_36px_rgba(0,7,30,0.28)] p-4 sm:p-6 md:p-8 my-auto max-h-[90vh] flex flex-col',
  header: {
    container: 'mb-4 sm:mb-6 flex-shrink-0',
    content: 'flex items-start gap-3',
    icon: 'flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary',
    meta: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
    title: 'text-xl sm:text-2xl font-semibold text-foreground',
    description: 'text-xs sm:text-sm text-muted-foreground',
    progressTrack: 'mt-3 sm:mt-4 h-2 w-full rounded-full bg-muted/80',
    progressIndicator: 'h-full rounded-full bg-primary transition-all duration-200 ease-out',
  },
  stepContent: 'space-y-4 overflow-y-auto pr-1 scrollbar-thin flex-1 min-h-0',
  card: 'space-y-3 rounded-xl border border-border/25 bg-muted/35 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-muted/50',
  cardHeader: 'flex items-center justify-between',
  cardTitle: 'text-sm font-semibold text-foreground',
  deleteButton:
    'text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50',
  addButton:
    'flex w-full items-center justify-center gap-2 rounded-xl border border-border/30 bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90',
  backButton:
    'flex items-center gap-2 rounded-xl border border-border/30 bg-muted/80 px-4 py-3 font-medium text-foreground transition-colors hover:bg-accent',
  nextButton:
    'flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90',
  label: 'text-sm font-medium text-foreground',
  primaryLabel: 'text-sm font-medium text-foreground',
  input:
    'h-11 border border-border/35 bg-input/30 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  select:
    'h-11 border border-border/35 bg-input/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
  selectContent: 'border border-border/35 bg-popover',
  alert:
    'mt-4 sm:mt-5 flex shrink-0 items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive',
  loadingInfo: 'flex items-center gap-2 text-sm text-muted-foreground',
  warningMessage:
    'rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground',
  form: {
    section: 'space-y-4',
    field: 'space-y-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    gridField: 'space-y-2',
    fieldRow: 'flex items-center gap-2',
  },
  accounts: {
    infoBanner: 'mb-4 rounded-lg border border-border/25 bg-muted/35 p-3',
    infoText: 'mt-1 text-xs text-muted-foreground',
    defaultToggle: 'ml-2 rounded p-1 transition-colors',
    defaultActive: 'bg-warning/15 text-warning',
    defaultInactive: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
    defaultIcon: 'h-4 w-4',
    defaultIconFilled: 'fill-current',
    helpGroup: 'group relative',
    helpIcon: 'h-3.5 w-3.5 cursor-help text-muted-foreground',
    helpPopover:
      'invisible absolute left-0 top-6 z-50 w-64 rounded-lg border border-border/35 bg-card p-3 text-xs text-foreground shadow-xl group-hover:visible',
    helpTitle: 'mb-1 font-semibold',
    helpBody: 'text-muted-foreground',
    typeDescription: 'mt-1.5 min-h-[1.25rem] text-xs text-muted-foreground',
    addIcon: 'mr-2 h-4 w-4',
    deleteIcon: 'h-4 w-4',
    labelRow: 'flex items-center gap-2',
  },
  budgets: {
    infoBanner:
      'mb-4 rounded-xl border border-border/25 bg-muted/35 p-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    infoRow: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
    infoContent: 'flex min-w-0 flex-1 gap-3',
    infoIcon: 'mt-0.5 h-5 w-5 shrink-0 text-muted-foreground',
    infoBody: 'min-w-0 flex-1',
    infoTitle: 'text-sm font-semibold leading-snug text-foreground',
    infoText: 'mt-1 text-xs leading-relaxed text-muted-foreground',
    skipButton: 'w-full shrink-0 sm:w-auto sm:min-w-[7.5rem]',
    loadingIcon: 'h-4 w-4 animate-spin',
    deleteIcon: 'h-4 w-4',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    field: 'space-y-2',
    startDay: 'space-y-2 pt-2',
    addIcon: 'mr-2 h-4 w-4',
  },
  draftRestore: {
    container:
      'pointer-events-auto fixed top-4 left-1/2 z-[10001] w-[min(100%,24rem)] -translate-x-1/2 rounded-2xl border border-border/25 bg-card p-4 text-foreground shadow-[0_16px_36px_rgba(0,7,30,0.28)] backdrop-blur-sm sm:p-5',
    body: 'flex items-start gap-3',
    icon: 'mt-0.5 h-5 w-5 shrink-0 text-primary',
    content: 'min-w-0 flex-1',
    title: 'text-sm font-semibold text-foreground',
    text: 'mt-1 text-xs text-muted-foreground',
    actions: 'mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3',
    primaryButton:
      'h-9 flex-1 rounded-xl border border-primary/40 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90',
    secondaryButton:
      'h-9 flex-1 rounded-xl border border-border/30 bg-muted/80 text-sm font-medium text-foreground hover:bg-accent',
  },
  steps: {
    icon: 'h-5 w-5',
    dots: 'mb-2 flex items-center gap-2',
    dot: 'h-2 rounded-full transition-all duration-200 ease-out',
    dotActive: 'w-8 bg-primary',
    dotDone: 'w-2 bg-primary',
    dotIdle: 'w-2 bg-muted-foreground/35',
  },
  footer: {
    container: 'mt-4 sm:mt-6 flex shrink-0 flex-row items-center justify-between gap-3',
    buttonIcon: 'h-4 w-4',
  },
} as const;

export type OnboardingStyles = typeof onboardingStyles;

export function getOnboardingProgressStyle(currentStep: number, totalSteps: number) {
  const width = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  return { width: `${width}%` };
}
