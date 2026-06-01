export const onboardingStyles = {
  container:
    'flex min-h-0 flex-1 w-full max-w-md mx-auto flex-col animate-in fade-in slide-in-from-bottom-2 duration-200',
  header: {
    container: 'flex shrink-0 flex-col gap-3 px-4 pt-4 pb-3',
    content: 'flex items-start gap-3',
    icon: 'flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary',
    meta: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
    title: 'text-xl font-semibold text-foreground',
    description: 'text-xs text-muted-foreground',
    progressTrack: 'h-1.5 w-full rounded-full bg-muted/80',
    progressIndicator: 'h-full rounded-full bg-primary transition-all duration-200 ease-out',
  },
  stepContent: 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4',
  card: 'flex flex-col gap-3 rounded-xl border border-border/25 bg-muted/35 p-4',
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
    'mx-4 mb-3 flex shrink-0 items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive',
  warningMessage:
    'rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-warning-foreground',
  form: {
    section: 'flex flex-col gap-4',
    field: 'flex flex-col gap-2',
  },
  accounts: {
    infoBanner: 'rounded-lg border border-border/25 bg-muted/35 p-3',
    infoText: 'mt-1 text-xs text-muted-foreground',
    defaultToggle: 'ml-2 rounded p-1 transition-colors',
    defaultActive: 'bg-warning/15 text-warning',
    defaultInactive: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
    defaultIcon: 'size-4',
    defaultIconFilled: 'fill-current',
    typeDescription: 'mt-1.5 min-h-5 text-xs text-muted-foreground',
    addIcon: 'size-4',
    deleteIcon: 'size-4',
    labelRow: 'flex items-center gap-2',
  },
  budgets: {
    infoBanner:
      'rounded-xl border border-border/25 bg-muted/35 p-4 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]',
    infoRow: 'flex flex-col gap-3',
    infoContent: 'flex min-w-0 flex-1 gap-3',
    infoIcon: 'mt-0.5 size-5 shrink-0 text-muted-foreground',
    infoBody: 'min-w-0 flex-1',
    infoTitle: 'text-sm font-semibold leading-snug text-foreground',
    infoText: 'mt-1 text-xs leading-relaxed text-muted-foreground',
    skipButton: 'w-full shrink-0',
    deleteIcon: 'size-4',
    grid: 'grid grid-cols-2 gap-3',
    field: 'flex flex-col gap-2',
    startDay: 'flex flex-col gap-2 pt-2',
    addIcon: 'size-4',
  },
  steps: {
    icon: 'size-5',
    dots: 'mb-2 flex items-center gap-2',
    dot: 'h-2 rounded-full transition-all duration-200 ease-out',
    dotActive: 'w-8 bg-primary',
    dotDone: 'w-2 bg-primary',
    dotIdle: 'w-2 bg-muted-foreground/35',
  },
  footer: {
    container:
      'flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border/20 px-4 py-4 pb-[calc(theme(spacing.4)+env(safe-area-inset-bottom))]',
    buttonIcon: 'size-4',
  },
} as const;

export type OnboardingStyles = typeof onboardingStyles;

export function getOnboardingProgressStyle(currentStep: number, totalSteps: number) {
  const width = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  return { width: `${width}%` };
}
