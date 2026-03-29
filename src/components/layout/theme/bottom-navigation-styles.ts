export const bottomNavigationStyles = {
  container:
    'fixed bottom-0 left-0 right-0 z-40 overflow-visible border-t border-border/60 bg-card/95 px-2 pt-1 pb-[calc(theme(spacing.1)+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden',
  inner:
    'mx-auto grid max-w-xl grid-cols-5 items-end gap-x-0.5 gap-y-0 overflow-visible px-0.5 pb-0.5 pt-0',
  item: 'relative z-0 flex min-h-11 min-w-0 flex-col items-center justify-end gap-0 rounded-xl px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-reduce:transition-none active:bg-primary/5',
  itemActive:
    'bg-primary/[0.14] text-primary shadow-sm ring-1 ring-inset ring-primary/20 dark:bg-primary/20',
  itemInactive:
    'text-primary/75 hover:bg-primary/10 hover:text-primary motion-reduce:transition-none',
  icon: 'h-5 w-5 shrink-0',
  /** Etichetta sotto l’icona; `overflow-wrap` per stringhe lunghe (i18n). */
  caption:
    'min-w-0 max-w-[5.25rem] text-center text-[clamp(0.625rem,2.6vw,0.75rem)] font-medium leading-none text-current [overflow-wrap:anywhere]',
  addColumn:
    'relative z-10 flex flex-col items-center justify-end gap-0 justify-self-center overflow-visible pb-0 text-primary/75',
  /**
   * Il FAB ha translateY a metà altezza ma occupa ancora tutta l’altezza nel flusso: -mb compensa
   * così «Aggiungi» resta vicino al cerchio e in linea con le altre etichette.
   */
  addButtonWrap: '-mb-[1.375rem] flex justify-center sm:-mb-6',
  /** Metà del FAB sopra il bordo top della barra: translateY = metà altezza (incl. border-box). */
  addButton:
    'h-11 w-11 min-h-11 min-w-11 -translate-y-[1.375rem] rounded-full border-[3px] border-card bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-150 ease-out hover:bg-primary/90 active:scale-[0.97] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:h-12 sm:w-12 sm:min-h-12 sm:min-w-12 sm:-translate-y-6 sm:border-4',
  addIcon: 'h-5 w-5 sm:h-6 sm:w-6',
  /** Stessa scala tipografica delle altre voci (caption); colore da `addColumn`. */
  addCaption:
    'min-w-0 max-w-[5.25rem] text-center text-[clamp(0.625rem,2.6vw,0.75rem)] font-medium leading-none text-current [overflow-wrap:anywhere]',
  /** Larghezza comoda al pollice; non supera il viewport su schermi stretti. */
  menu: 'w-56 max-w-[calc(100vw-2rem)]',
} as const;
