/**
 * DashboardGrid - Responsive grid for dashboard cards
 */

"use client";

import { cn } from "@/lib";

interface DashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

const gridColumns = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
};

export function DashboardGrid({ children, columns = 3, className }: DashboardGridProps) {
  return (
    <div className={cn("grid gap-4", gridColumns[columns], className)}>
      {children}
    </div>
  );
}
