import type { CSSProperties } from 'react';

export const cardStyles = {
  account: {
    container: 'min-w-[180px] shrink-0 px-3',
    /** Slider home: compatto; sovrascrive min-w lista (180px). */
    /** Larghezza da contenuto (slider); limite solo a viewport in slider.card */
    sliderTight: '!w-max !min-w-[8.75rem] py-0 sm:!min-w-[9rem]',
    negativeLabel: 'text-destructive/80 font-medium',
    actionsButton: 'h-8 w-8 text-primary hover:text-primary/80',
    actionsIcon: 'h-4 w-4 text-primary',
    actionItemIcon: 'mr-2 h-4 w-4',
    deleteItem: 'text-destructive focus:text-destructive',
    icon: 'h-5 w-5',
    sliderIcon: 'h-3.5 w-3.5',
  },
  budget: {
    container:
      'p-3 hover:bg-accent/10 transition-colors duration-200 cursor-pointer w-full text-left text-primary',
    row: 'flex items-start justify-between gap-2 mb-2',
    left: 'flex min-w-0 flex-1 items-start gap-3',
    content: 'flex-1',
    title: 'mb-1 line-clamp-2 min-h-[2.25rem] max-w-[11rem] min-w-0 text-balance sm:max-w-[15rem]',
    statusBadge: 'w-fit',
    right: 'text-right shrink-0 ml-2',
    progress: 'relative',
  },
  series: {
    base: 'p-2 bg-card rounded-xl transition-colors duration-200 group cursor-pointer',
    /** Dentro lista raggruppata / griglia: niente bordo proprio (gestito dal contenitore). */
    embedded: 'rounded-none border-0 shadow-none bg-transparent ring-0',
    inactive: 'border border-primary/20 opacity-60',
    overdue: 'border border-destructive/30 hover:border-destructive/40',
    dueToday: 'border border-warning/40 hover:border-warning/50',
    dueSoon: 'border border-warning/30 hover:border-warning/40',
    default: 'border border-primary/20 hover:border-primary/30',
    layout: 'flex items-center justify-between gap-3',
    left: 'flex items-center gap-3 flex-1 min-w-0',
    icon: 'rounded-lg shrink-0',
    content: 'flex-1 min-w-0',
    titleRow: 'flex items-center gap-2 mb-0.5',
    title: 'group-hover:text-primary/80 transition-colors truncate',
    details: 'space-y-0.5',
    frequency: 'font-base text-primary/60',
    dueDate: 'text-primary/60',
    userBadges: 'flex items-center gap-1 mt-1.5',
    userBadge:
      'w-5 h-5 rounded-full border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary-foreground',
    userBadgeOverflow: 'text-[10px] text-muted-foreground font-medium',
    right: 'flex flex-col items-end shrink-0',
    actions: 'flex items-center gap-2',
    actionButton:
      'h-11 w-11 min-h-11 min-w-11 p-0 rounded-md transition-all duration-200 touch-manipulation',
    actionPrimary: 'hover:bg-primary/8',
    actionWarning: 'hover:bg-warning/10',
    actionNeutral: 'hover:bg-primary/5',
    actionDestructive: 'hover:bg-destructive/10',
    actionIcon: 'h-4 w-4',
    actionIconAccent: 'text-accent',
    actionIconWarning: 'text-warning',
    actionIconPrimary: 'text-primary',
    actionIconDestructive: 'text-destructive',
  },
} as const;

export function getBudgetStatusTextClass(status: 'success' | 'warning' | 'danger') {
  if (status === 'success') return 'text-success';
  if (status === 'warning') return 'text-warning';
  return 'text-destructive';
}

export function getBudgetProgressStyle(progress: number): CSSProperties {
  return { width: `${Math.min(progress, 100)}%` };
}

export function getSeriesCardClassName(params: {
  isActive: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
}) {
  const { isActive, isOverdue, isDueToday, isDueSoon } = params;
  if (!isActive) return `${cardStyles.series.base} ${cardStyles.series.inactive}`;
  if (isOverdue) return `${cardStyles.series.base} ${cardStyles.series.overdue}`;
  if (isDueToday) return `${cardStyles.series.base} ${cardStyles.series.dueToday}`;
  if (isDueSoon) return `${cardStyles.series.base} ${cardStyles.series.dueSoon}`;
  return `${cardStyles.series.base} ${cardStyles.series.default}`;
}

export function getSeriesUserBadgeStyle(color: string | undefined): CSSProperties {
  return { backgroundColor: color || 'oklch(var(--color-primary))' };
}
