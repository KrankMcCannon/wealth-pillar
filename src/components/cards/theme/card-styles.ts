import type { CSSProperties } from 'react';

export const cardStyles = {
  account: {
    container: 'min-w-[180px] shrink-0 px-3',
    /**
     * Pagina Conti: stessa shell delle righe transazioni / investimenti mobile
     * (`cardGroup` + bordo tra righe).
     */
    listRow: 'w-full min-w-0 shrink px-4 py-3.5 !py-3.5 rounded-none bg-card shadow-none',
    /** Tipografia allineata a `investment-list` (mobile card rows). */
    listTitle: 'font-semibold text-[15px] leading-snug text-primary/90',
    listSubtitle: 'mt-0.5 text-[11px] font-medium text-primary/45',
    listAmount: 'text-sm font-bold tabular-nums tracking-tight',
    listAmountSecondary: 'mt-0.5 text-[10px] font-semibold tabular-nums',
    /** Slider home: compatto; sovrascrive min-w lista (180px). */
    /** Larghezza da contenuto (slider); limite solo a viewport in slider.card */
    sliderTight: '!w-max !min-w-[8.75rem] py-0 sm:!min-w-[9rem]',
    negativeLabel: 'text-destructive/80 font-medium',
    actionsButton:
      'inline-flex size-11 shrink-0 items-center justify-center text-primary hover:text-primary/80',
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
    content: 'flex-1 min-w-0',
    title: 'mb-0.5 line-clamp-2 min-w-0 text-balance pr-2 font-semibold text-[15px] leading-tight',
    statusBadge: 'w-fit mt-1',
    right: 'text-right shrink-0 ml-2 space-y-1',
    progress: 'relative',
  },
  series: {
    base: 'group cursor-pointer rounded-[24px] border p-2.5 transition-colors duration-200',
    /** Dentro lista raggruppata / griglia: niente bordo proprio (gestito dal contenitore). */
    embedded: 'rounded-none border-0 shadow-none bg-transparent ring-0',
    inactive: 'border-[#3359c5]/25 bg-[#0f2e69]/82 opacity-70',
    overdue: 'border-red-400/40 bg-[#163773]/92 hover:bg-[#1a3d7e]',
    dueToday: 'border-amber-300/45 bg-[#163773]/94 hover:bg-[#1b3f82]',
    dueSoon: 'border-[#5c77cc]/45 bg-[#163773]/92 hover:bg-[#1b3f82]',
    default: 'border-[#3359c5]/35 bg-[#163773]/92 hover:bg-[#1b3f82]',
    layout: 'flex items-center justify-between gap-2.5',
    left: 'flex min-w-0 flex-1 items-center gap-2.5',
    icon: 'shrink-0 rounded-full',
    content: 'flex-1 min-w-0',
    titleRow: 'mb-0.5 flex items-center gap-1.5',
    title: 'truncate text-[#e6ecff] transition-colors group-hover:text-white',
    details: 'space-y-0.5',
    frequency: 'font-base text-[#9fb0d7]',
    dueDate: 'text-[#9fb0d7]',
    userBadges: 'mt-1 flex items-center gap-1',
    userBadge:
      'flex h-5 w-5 items-center justify-center rounded-full border border-[#3359c5]/35 text-[10px] font-bold text-[#e6ecff]',
    userBadgeOverflow: 'text-[10px] font-medium text-[#9fb0d7]',
    right: 'flex shrink-0 flex-col items-end gap-0.5',
    actions: 'flex items-center gap-1',
    actionButton:
      'h-9 w-9 min-h-9 min-w-9 rounded-md p-0 transition-all duration-200 touch-manipulation',
    actionPrimary: 'hover:bg-[#8fb0ff]/12',
    actionWarning: 'hover:bg-[#f0a6a6]/12',
    actionNeutral: 'hover:bg-[#8fb0ff]/10',
    actionDestructive: 'hover:bg-[#f0a6a6]/12',
    actionIcon: 'h-4 w-4',
    actionIconAccent: 'text-[#8fb0ff]',
    actionIconWarning: 'text-[#f0a6a6]',
    actionIconPrimary: 'text-[#8fb0ff]',
    actionIconDestructive: 'text-[#8fb0ff]',
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
