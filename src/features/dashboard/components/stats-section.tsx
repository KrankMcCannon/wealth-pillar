/**
 * StatsSection - Statistics section with multiple metrics
 */

"use client";

import { DashboardGrid } from "./dashboard-grid";
import { MetricCard } from "./metric-card";

interface Stat {
  label: string;
  value: number;
  trend?: number;
  icon?: React.ReactNode;
  type?: "income" | "expense" | "neutral" | "balance";
  showCurrency?: boolean;
}

interface StatsSectionProps {
  stats: Stat[];
  columns?: 1 | 2 | 3 | 4;
}

export function StatsSection({ stats, columns = 4 }: StatsSectionProps) {
  return (
    <DashboardGrid columns={columns}>
      {stats.map((stat, index) => (
        <MetricCard key={index} {...stat} />
      ))}
    </DashboardGrid>
  );
}
