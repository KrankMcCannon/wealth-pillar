/**
 * Recharts 3: il default di `initialDimension` è {-1,-1}; al primo paint le dimensioni
 * calcolate non sono valide e compare un warning in console finché non interviene ResizeObserver.
 * Valori iniziali positivi plausibili per tipo di grafico; il resize aggiorna subito dopo.
 */
export const rechartsInitialDimension = { width: 360, height: 350 } as const;

export const rechartsSandboxInitialDimension = { width: 360, height: 400 } as const;

/** Contenitori tipo torta (~180–200px altezza). */
export const rechartsPieChartInitialDimension = { width: 360, height: 200 } as const;

/** Bar chart trend (wrapper fino ~350px su md). */
export const rechartsBarTrendsInitialDimension = { width: 360, height: 320 } as const;
