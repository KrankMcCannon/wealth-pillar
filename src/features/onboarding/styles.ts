export const onboardingStyles = {
  overlay:
    'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-3 sm:px-4 py-6 sm:py-8 overflow-y-auto',
  modal:
    'w-full max-w-md sm:max-w-lg md:max-w-2xl rounded-2xl sm:rounded-3xl bg-card shadow-2xl p-4 sm:p-6 md:p-8 my-auto max-h-[90vh] flex flex-col',
  header: {
    container: 'mb-4 sm:mb-6 flex-shrink-0',
    content: 'flex items-start gap-3',
    icon: 'h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0',
    meta: 'text-xs uppercase tracking-wide text-primary/70',
    title: 'text-xl sm:text-2xl font-semibold text-primary',
    description: 'text-xs sm:text-sm text-primary/70',
    progressTrack: 'mt-3 sm:mt-4 h-2 w-full rounded-full bg-primary/10',
    progressIndicator: 'h-full rounded-full bg-primary transition-all',
  },
  stepContent: 'space-y-4 overflow-y-auto pr-1 scrollbar-thin flex-1 min-h-0',
  card: 'rounded-xl border-2 border-primary/20 p-5 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow',
  cardHeader: 'flex items-center justify-between',
  cardTitle: 'text-sm font-semibold text-primary',
  deleteButton: 'text-primary/70 hover:text-destructive transition-colors disabled:opacity-50',
  addButton:
    'w-full bg-primary text-primary-foreground hover:bg-card hover:text-primary border-2 border-primary/20 transition-all font-medium flex items-center justify-center gap-2',
  backButton:
    'bg-primary text-primary-foreground hover:bg-card hover:text-primary border-2 border-primary/20 transition-all font-medium flex items-center gap-2',
  nextButton:
    'bg-primary text-primary-foreground hover:bg-card hover:text-primary border-2 border-primary/20 transition-all font-medium flex items-center justify-center gap-2',
  label: 'text-sm font-medium text-primary',
  primaryLabel: 'text-sm font-medium text-primary',
  input:
    'h-11 bg-input border-2 border-primary/20 focus:border-primary/20 text-primary placeholder:text-primary/40',
  select: 'h-11 bg-input border-2 border-primary/20 focus:border-primary/20',
  selectContent: 'bg-popover border-2 border-primary/20',
  alert:
    'mt-4 sm:mt-5 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs sm:text-sm text-destructive flex items-start gap-2 flex-shrink-0',
  loadingInfo: 'flex items-center gap-2 text-sm text-primary/70',
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
    infoBanner: 'bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4',
    infoText: 'text-xs text-primary/70 mt-1',
    defaultToggle: 'ml-2 p-1 rounded transition-colors',
    defaultActive: 'text-yellow-500 bg-yellow-50',
    defaultInactive: 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-50',
    defaultIcon: 'h-4 w-4',
    defaultIconFilled: 'fill-current',
    helpGroup: 'group relative',
    helpIcon: 'h-3.5 w-3.5 text-primary/60 cursor-help',
    helpPopover:
      'invisible group-hover:visible absolute left-0 top-6 z-50 w-64 rounded-lg bg-primary text-white p-3 text-xs shadow-lg',
    helpTitle: 'font-semibold mb-1',
    helpBody: 'text-white/90',
    typeDescription: 'text-xs text-primary/60 mt-1.5 min-h-[1.25rem]',
    addIcon: 'h-4 w-4 mr-2',
    deleteIcon: 'h-4 w-4',
    labelRow: 'flex items-center gap-2',
  },
  budgets: {
    infoBanner: 'mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-primary shadow-sm',
    /** Colonna su mobile, riga su desktop: testo + CTA allineata */
    infoRow: 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
    infoContent: 'flex min-w-0 flex-1 gap-3',
    infoIcon: 'mt-0.5 h-5 w-5 shrink-0 text-primary/80',
    infoBody: 'min-w-0 flex-1',
    infoTitle: 'text-sm font-semibold leading-snug text-primary',
    infoText: 'mt-1 text-xs leading-relaxed text-primary/70',
    /** Solo layout; variant/outline sul Button */
    skipButton: 'w-full shrink-0 sm:w-auto sm:min-w-[7.5rem]',
    loadingIcon: 'h-4 w-4 animate-spin',
    deleteIcon: 'h-4 w-4',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
    field: 'space-y-2',
    startDay: 'space-y-2 pt-2',
    addIcon: 'h-4 w-4 mr-2',
  },
  draftRestore: {
    /** Sopra la card onboarding (stacking + pointer-events) */
    container:
      'pointer-events-auto fixed top-4 left-1/2 z-[10001] w-[min(100%,24rem)] -translate-x-1/2 rounded-2xl border-2 border-primary/20 bg-card p-4 text-card-foreground shadow-2xl backdrop-blur-sm sm:p-5',
    body: 'flex items-start gap-3',
    icon: 'h-5 w-5 shrink-0 text-primary mt-0.5',
    content: 'min-w-0 flex-1',
    title: 'text-sm font-semibold text-primary',
    text: 'mt-1 text-xs text-primary/70',
    actions: 'mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3',
    primaryButton:
      'h-9 flex-1 border-2 border-primary/20 bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90',
    secondaryButton:
      'h-9 flex-1 border-2 border-primary/20 bg-card text-sm font-medium text-primary hover:bg-primary/5',
  },
  steps: {
    icon: 'h-5 w-5',
    dots: 'flex items-center gap-2 mb-2',
    dot: 'h-2 rounded-full transition-all duration-300',
    dotActive: 'w-8 bg-primary',
    dotDone: 'w-2 bg-primary',
    dotIdle: 'w-2 bg-primary/20',
  },
  footer: {
    container: 'mt-4 sm:mt-6 flex flex-row items-center justify-between gap-3 flex-shrink-0',
    buttonIcon: 'h-4 w-4',
  },
};

export type OnboardingStyles = typeof onboardingStyles;

export function getOnboardingProgressStyle(currentStep: number, totalSteps: number) {
  const width = totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : 0;
  return { width: `${width}%` };
}
