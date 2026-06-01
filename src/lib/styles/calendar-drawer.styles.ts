/** Calendar panel layout tokens — day styling lives in date-drawer-variants.ts */

export const calendarDrawerStyles = {
  panel: {
    container: 'space-y-0',
  },
  header: {
    container: 'flex items-center gap-2 px-3 py-3 mb-1',
    pickerRow: 'flex min-w-0 flex-1 items-center gap-2',
    selectTrigger:
      'min-h-11 rounded-xl border border-modal-border/30 bg-modal-elevated/90 text-sm font-semibold text-modal-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] focus:ring-2 focus:ring-modal-ring/25 focus:border-modal-ring/45',
    selectTriggerMonth: 'min-w-0 flex-1 [&>span]:truncate',
    selectTriggerYear: 'w-[5.25rem] shrink-0 tabular-nums',
    selectContent: 'max-h-[240px]',
    selectItem: 'text-sm font-medium',
    selectItemYear: 'text-sm font-medium tabular-nums',
    navButton: {
      icon: 'size-5 stroke-[2.5]',
    },
  },
  weekdays: {
    container: 'grid grid-cols-7 gap-1 pb-2 px-2',
    label: 'text-xs font-bold text-primary uppercase text-center py-2 tracking-wider',
  },
  grid: {
    container: 'grid grid-cols-7 gap-2 place-items-center pb-4 px-2',
  },
} as const;
