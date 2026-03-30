/**
 * Log solo in sviluppo — evita rumore e leak di contesto in produzione.
 */
export function devWarn(...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args);
  }
}
