import type { CSSProperties } from 'react';

export const rechartsInitialDimension = { width: 400, height: 300 };
export const rechartsPieChartInitialDimension = { width: 300, height: 250 };
export const rechartsBarTrendsInitialDimension = { width: 300, height: 250 };
export const rechartsBenchmarkInitialDimension = { width: 400, height: 300 };
export const rechartsSandboxInitialDimension = { width: 600, height: 300 };

/**
 * Colori e stili Recharts allineati ai token OKLCH in globals.css (dark mode incluso).
 */
export const investmentChartColors = {
  grid: 'var(--color-border)',
  axis: 'var(--color-muted-foreground)',
  linePrimary: 'var(--color-chart-1)',
  lineSecondary: 'var(--color-chart-2)',
  areaAccent: 'var(--color-chart-2)',
} as const;

export function rechartsTooltipContentStyle(): CSSProperties {
  return {
    backgroundColor: 'var(--color-popover)',
    color: 'var(--color-popover-foreground)',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    boxShadow: '0 4px 16px oklch(0 0 0 / 0.08)',
  };
}

export const rechartsTooltipItemStyle: CSSProperties = {
  color: 'var(--color-popover-foreground)',
};
