export const layoutStyles = {
  section: {
    container: 'space-y-4',
    headerRow: 'flex items-center justify-between gap-3',
    title: 'text-lg font-semibold text-primary',
    subtitle: 'text-sm text-primary',
    /** Sotto-sezioni (es. grafici sotto una panoramica) — peso inferiore al titolo sezione */
    subsectionTitle: 'text-base font-semibold text-foreground',
    subsectionSubtitle: 'text-xs text-muted-foreground leading-relaxed',
    actions: 'flex items-center gap-2',
    surface: {
      plain: 'bg-transparent',
      card: 'bg-card border border-primary/15 rounded-2xl',
      muted: 'bg-card/40 border border-border/60 rounded-2xl backdrop-blur-sm',
    },
    padding: {
      none: '',
      sm: 'p-2',
      md: 'p-3',
      lg: 'p-4',
    },
  },
  list: {
    container: 'space-y-3',
    divided: 'divide-y divide-primary/10',
    item: 'py-3 first:pt-0 last:pb-0',
  },
  footer: {
    base: 'w-full flex items-center justify-between gap-3',
    static: 'mt-auto px-4 py-3 pb-[calc(theme(spacing.3)+env(safe-area-inset-bottom))]',
    sticky:
      'sticky bottom-0 bg-card/90 backdrop-blur border-t border-primary/15 px-4 py-3 pb-[calc(theme(spacing.3)+env(safe-area-inset-bottom))]',
  },
} as const;
