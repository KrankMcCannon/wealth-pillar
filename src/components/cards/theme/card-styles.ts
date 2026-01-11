import type { CSSProperties } from "react";

export const cardStyles = {
  account: {
    container: "min-w-[180px] shrink-0 px-3",
    negativeLabel: "text-destructive/80 font-medium",
    actionsButton: "h-8 w-8 text-primary hover:text-primary/80",
    actionsIcon: "h-4 w-4 text-primary",
    actionItemIcon: "mr-2 h-4 w-4",
    deleteItem: "text-destructive focus:text-destructive",
    icon: "h-5 w-5",
  },
  budget: {
    container:
      "p-3 hover:bg-accent/10 transition-colors duration-200 cursor-pointer w-full text-left",
    row: "flex items-center justify-between mb-2",
    left: "flex items-center gap-3 flex-1",
    content: "flex-1",
    title: "truncate max-w-35 sm:max-w-40 mb-1",
    statusBadge: "w-fit",
    right: "text-right shrink-0 ml-2",
    progress: "relative",
  },
  series: {
    base: "p-3 bg-card rounded-xl transition-all duration-300 group cursor-pointer",
    inactive: "border border-primary/20 opacity-60",
    overdue: "border border-destructive/30 hover:border-destructive/40",
    dueToday: "border border-warning/40 hover:border-warning/50",
    dueSoon: "border border-warning/30 hover:border-warning/40",
    default: "border border-primary/20 hover:border-primary/30",
    layout: "flex items-center justify-between gap-3",
    left: "flex items-center gap-3 flex-1 min-w-0",
    icon: "rounded-lg shrink-0",
    content: "flex-1 min-w-0",
    titleRow: "flex items-center gap-2 mb-0.5",
    title: "group-hover:text-primary/80 transition-colors truncate",
    details: "space-y-0.5",
    frequency: "font-medium",
    userBadges: "flex items-center gap-1 mt-1.5",
    userBadge:
      "w-5 h-5 rounded-full border border-white/20 dark:border-gray-700 flex items-center justify-center text-[10px] font-bold text-white",
    userBadgeOverflow: "text-[10px] text-muted-foreground font-medium",
    right: "flex flex-col items-end gap-1.5 shrink-0",
    actions: "flex items-center gap-0.5",
    actionButton:
      "h-6 w-6 p-0 rounded-md transition-all duration-200",
    actionPrimary: "hover:bg-primary/8",
    actionWarning: "hover:bg-warning/10",
    actionNeutral: "hover:bg-primary/5",
    actionDestructive: "hover:bg-destructive/10",
    actionIcon: "h-3 w-3",
    actionIconAccent: "text-accent",
    actionIconWarning: "text-warning",
    actionIconPrimary: "text-primary",
    actionIconDestructive: "text-destructive",
  },
} as const;

export function getBudgetStatusTextClass(status: "success" | "warning" | "danger") {
  if (status === "success") return "text-success";
  if (status === "warning") return "text-warning";
  return "text-destructive";
}

export function getBudgetProgressStyle(progress: number): CSSProperties {
  return { width: `${Math.min(progress, 100)}%` };
}

export function getSeriesCardClassName(params: {
  isActive: boolean;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
}) {
  const { isActive, isOverdue, isDueToday, isDueSoon } = params;
  if (!isActive) return `${cardStyles.series.base} ${cardStyles.series.inactive}`;
  if (isOverdue) return `${cardStyles.series.base} ${cardStyles.series.overdue}`;
  if (isDueToday) return `${cardStyles.series.base} ${cardStyles.series.dueToday}`;
  if (isDueSoon) return `${cardStyles.series.base} ${cardStyles.series.dueSoon}`;
  return `${cardStyles.series.base} ${cardStyles.series.default}`;
}

export function getSeriesUserBadgeStyle(color: string | undefined): CSSProperties {
  return { backgroundColor: color || '#6366f1' }; // Fallback to primary color
}
