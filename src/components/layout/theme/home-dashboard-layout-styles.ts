/**
 * Griglia home dashboard (colonna primaria 8 + aside ricorrenze 4).
 * Usata da home caricata e da loading per allineamento CLS.
 */
export const homeDashboardLayoutStyles = {
  main: 'flex min-h-0 flex-1 flex-col px-3 pb-24 pt-3 md:pb-8',
  grid: 'grid grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-2 md:gap-6',
  primaryColumn: 'flex min-w-0 flex-col gap-5 md:col-span-8 md:row-span-2',
  /** Intento principale: controllo rapido delle finanze (sopra saldi). */
  heroSection: 'space-y-1.5 md:space-y-2',
  heroTitle:
    'text-[clamp(1.125rem,2.6vw,1.375rem)] font-semibold leading-snug tracking-tight text-foreground',
  heroLead:
    'max-w-prose text-[clamp(0.8125rem,2.2vw,0.9375rem)] leading-relaxed text-muted-foreground',
  /** Skeleton hero (loading) — stessa scansione visiva della home caricata. */
  heroSkeletonTitle: 'h-7 w-[min(100%,18rem)] animate-pulse rounded-md bg-muted md:h-8',
  heroSkeletonLead: 'h-4 w-full max-w-md animate-pulse rounded-md bg-muted/75',
  /** Testo guida sotto «Chiudi periodo» (home). */
  periodCloseHint:
    'text-pretty text-xs leading-snug text-muted-foreground sm:max-w-[15rem] sm:text-end',
  asideColumn: 'min-w-0 md:col-span-4 md:col-start-9 md:row-span-2 md:row-start-1',
  /** Primo focus utile: salta header sticky (tastiera / screen reader). */
  skipLink:
    'sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none',
} as const;
