/**
 * MetricCard Theme Styles
 *
 * Centralized styling for metric/summary card components.
 * Supports variants: default, highlighted, success, warning, danger
 * Designed for financial metrics with semantic color coding
 */

export const metricCardStyles = {
  // Base card styles
  base: "rounded-xl border bg-card p-3 transition-colors sm:p-4",

  // Variant styles
  variant: {
    default: "border-primary/10",
    highlighted: "border-primary/20 bg-primary/5",
    success: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-destructive/30 bg-destructive/5",
  },

  // Size variants
  size: {
    sm: "p-3",
    md: "p-3 sm:p-4",
    lg: "p-4 sm:p-5",
  },

  // Header section
  header: {
    container: "flex items-center justify-between mb-1",
    labelRow: "flex items-center gap-2",
    label: "text-xs font-medium text-primary",
    iconContainer: "w-6 h-6 rounded-lg flex items-center justify-center",
    iconColor: {
      primary: "bg-primary/5 text-primary",
      success: "bg-success/5 text-success",
      warning: "bg-warning/5 text-warning",
      destructive: "bg-destructive/5 text-destructive",
      muted: "bg-primary/5 text-primary/60",
      accent: "bg-primary/5 text-primary",
    },
  },

  // Value section
  value: {
    container: "mb-1",
    text: "font-bold",
    size: {
      sm: "text-[11px]",
      md: "text-sm",
      lg: "text-base",
      xl: "text-lg",
    },
    color: {
      income: "text-success",
      expense: "text-destructive",
      neutral: "text-primary",
    },
  },

  // Description text
  description: "text-[11px] mt-1",

  // Stats grid (sub-metrics)
  stats: {
    container: "mt-2 pt-2 border-t border-primary/10 grid gap-2 sm:gap-3",
    gridCols: {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
    },
    item: "flex items-center justify-between gap-2",
    itemBase: "rounded-lg border border-primary/10 bg-primary/5 px-2.5 py-2",
    itemVariant: {
      default: "border-primary/10 bg-primary/5",
      primary: "border-primary/15 bg-primary/8",
      success: "border-success/15 bg-success/8",
      warning: "border-warning/15 bg-warning/8",
      destructive: "border-destructive/15 bg-destructive/8",
      muted: "border-primary/10 bg-primary/5",
    },
    label: "text-[11px] font-medium",
    labelVariant: {
      primary: "text-primary/70",
      success: "text-success/70",
      warning: "text-warning/70",
      destructive: "text-destructive/70",
      muted: "text-primary/60",
    },
    value: "text-xs font-semibold",
    valueVariant: {
      primary: "text-primary",
      success: "text-success",
      warning: "text-warning",
      destructive: "text-destructive",
      muted: "text-primary/60",
    },
  },

  // Actions section
  actions: {
    container: "mt-2 pt-2 border-t border-primary/10",
  },

  // Loading state
  loading: {
    container: "animate-pulse",
    label: "h-3 bg-primary/10 rounded w-20",
    value: "h-7 bg-primary/10 rounded w-24",
    stats: "h-3 bg-primary/10 rounded w-16",
  },
  textTone: {
    default: "text-primary/70",
    highlighted: "text-primary/70",
    success: "text-success/70",
    warning: "text-warning/70",
    danger: "text-destructive/70",
  },
  textToneStrong: {
    default: "text-primary",
    highlighted: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  },
};

/**
 * MetricGrid Theme Styles
 *
 * Responsive grid container for multiple MetricCard components
 */
export const metricGridStyles = {
  base: "grid gap-3 sm:gap-4",

  // Responsive column layouts
  columns: {
    1: "grid-cols-1",
    2: "grid-cols-2 sm:grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
  },

  // Gap sizes
  gap: {
    sm: "gap-2",
    md: "gap-3 sm:gap-4",
    lg: "gap-4 sm:gap-6",
  },
};
