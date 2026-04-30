import { stitchDashboardShell } from '@/styles/home-design-foundation';

export const pageContainerStyles = {
  /**
   * Altezza dal contenuto: evita `min-h-svh` + `flex-1` che creano un “buco” enorme
   * sopra la bottom bar fissa quando il contenuto è corto (home / transazioni / ricorrenti).
   */
  container: `relative flex w-full min-h-0 flex-col ${stitchDashboardShell.pageBackground} pt-[64px]`,
} as const;
