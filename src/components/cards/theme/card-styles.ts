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
} as const;
