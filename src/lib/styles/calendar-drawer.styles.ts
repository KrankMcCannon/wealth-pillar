/** Calendar panel layout tokens — day styling lives in date-drawer-variants.ts */

export const calendarDrawerStyles = {
  panel: {
    container: 'flex min-h-0 flex-1 flex-col',
  },
  header: {
    container: 'flex items-center gap-2 px-4 py-3',
    pickerRow: 'flex min-w-0 flex-1 items-center gap-2',
    selectTrigger:
      'min-h-11 rounded-xl border border-foreground/10 bg-muted text-sm font-semibold text-foreground shadow-none outline-none focus:ring-0 focus:border-foreground/20',
    selectTriggerMonth: 'min-w-0 flex-1 [&>span]:truncate',
    selectTriggerYear: 'w-[5.25rem] shrink-0 tabular-nums',
    selectContent: 'max-h-[240px] border-foreground/10 bg-background text-foreground',
    selectItem: 'text-sm font-medium',
    selectItemYear: 'text-sm font-medium tabular-nums',
    navButton: {
      icon: 'size-5 stroke-[2.5]',
    },
  },
  weekdays: {
    container: 'grid grid-cols-7 gap-1 px-4 pb-1',
    label: 'py-1.5 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground',
  },
  grid: {
    container:
      'grid grid-cols-7 gap-1 place-items-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
  },
} as const;
