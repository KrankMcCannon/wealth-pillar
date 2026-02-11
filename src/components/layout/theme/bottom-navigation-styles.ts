export const bottomNavigationStyles = {
  container:
    'fixed bottom-0 left-0 right-0 z-40 border-t border-primary/20 bg-card/95 px-3 py-2 pb-[calc(theme(spacing.2)+env(safe-area-inset-bottom))] backdrop-blur md:hidden',
  inner: 'mx-auto grid max-w-xl grid-cols-5 items-center gap-1',
  item: 'flex min-h-11 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 transition-colors',
  itemActive: 'bg-primary text-primary-foreground',
  itemInactive: 'text-primary/70 hover:bg-primary/10 hover:text-primary',
  icon: 'h-6 w-6',
  label: 'text-[10px] font-medium leading-none',
  addButton:
    'h-14 w-14 -translate-y-4 justify-self-center rounded-full border-4 border-card bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90',
  addIcon: 'h-7 w-7',
  menu: 'w-56',
} as const;
