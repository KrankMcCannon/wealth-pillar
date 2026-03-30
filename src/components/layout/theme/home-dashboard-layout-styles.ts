/**
 * Home dashboard: colonna unica; su desktop le ricorrenze stanno sotto saldi/budget (più respiro della vecchia sidebar 4/12).
 */
export const homeDashboardLayoutStyles = {
  main: 'flex min-h-0 w-full flex-1 flex-col px-3 pb-24 pt-3 md:mx-auto md:max-w-6xl md:pb-8 md:px-4',
  grid: 'grid grid-cols-1 gap-4 md:gap-6',
  primaryColumn: 'flex min-w-0 flex-col gap-6',
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
  /** Wrapper `<details>`: bordo leggero aperti/hover per gerarchia senza rumore. */
  periodCloseDetails:
    'rounded-lg border border-transparent transition-[background-color,border-color] duration-150 hover:border-border/45 hover:bg-muted/20 open:border-border/35 open:bg-muted/10 motion-reduce:transition-none',
  /** `<summary>`: target touch ~44px, focus ring tastiera, marker nascosti. */
  periodCloseSummary:
    'block min-h-11 w-full cursor-pointer list-none rounded-md px-1.5 py-2 text-pretty text-xs leading-snug text-muted-foreground outline-none marker:hidden sm:max-w-[17rem] sm:text-end [&::-webkit-details-marker]:hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none sm:min-h-0 sm:px-1 sm:py-1.5',
  /** Link testuale dentro il summary. */
  periodCloseSummaryLabel:
    'underline decoration-muted-foreground/45 underline-offset-2 transition-colors group-open:no-underline group-open:text-foreground hover:text-foreground hover:decoration-foreground/35',
  /** Ricorrenze: stessa larghezza della colonna principale (non più strip laterale stretta). */
  asideColumn: 'min-w-0',
  /** Primo focus utile: salta header sticky (tastiera / screen reader). */
  skipLink:
    'sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none',
} as const;
