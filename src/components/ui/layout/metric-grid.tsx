"use client";

/**
 * MetricGrid - Responsive Grid Container for Metric Cards
 *
 * A simple, responsive grid container for displaying multiple MetricCard components.
 * Automatically adjusts column count based on screen size.
 *
 * Usage:
 * ```tsx
 * <MetricGrid columns={4}>
 *   <MetricCard label="Total Earned" value={1000} />
 *   <MetricCard label="Total Spent" value={500} />
 *   <MetricCard label="Balance" value={500} />
 *   <MetricCard label="Savings" value={200} />
 * </MetricGrid>
 * ```
 */

import { memo } from "react";
import { metricGridStyles } from "./theme/metric-card-styles";
import { cn } from "@/lib/utils";

export interface MetricGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4; // Responsive column count
  gap?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * MetricGrid Component
 *
 * Provides a responsive grid layout for MetricCard components.
 * Columns automatically adjust for mobile/tablet/desktop breakpoints.
 */
export const MetricGrid = memo(({
  children,
  columns = 2,
  gap = "md",
  className,
}: MetricGridProps) => {
  const gridClasses = cn(
    metricGridStyles.base,
    metricGridStyles.columns[columns],
    metricGridStyles.gap[gap],
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
});

MetricGrid.displayName = "MetricGrid";
