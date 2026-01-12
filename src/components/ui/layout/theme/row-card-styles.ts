/**
 * RowCard Theme Styles
 *
 * Centralized styling for unified row card components.
 * Supports variants: regular, interactive, highlighted, muted
 */

export const rowCardStyles = {
  // Wrapper container (for swipe layers)
  wrapper: "relative w-full overflow-hidden",

  // Base card styles
  base: "relative z-10 flex items-center justify-between first:pb-2 last:pt-2",

  // Variant styles
  variant: {
    regular: "",
    interactive: "cursor-pointer hover:bg-primary/5 active:bg-primary/10",
    highlighted: "border-primary/20 bg-primary/5",
    muted: "opacity-60",
  },

  // Layout structure
  layout: {
    left: "flex items-center gap-3 flex-1 min-w-0",
    content: "flex-1 min-w-0",
    right: "flex flex-col items-end gap-1 shrink-0 ml-3 text-primary",
    rightRow: "flex items-center gap-2 shrink-0 ml-3 text-primary",
  },

  // Icon styles
  icon: {
    container: "rounded-lg shrink-0 flex items-center justify-center",
    size: {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    },
    color: {
      primary: "bg-primary/10 text-primary",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning",
      destructive: "bg-destructive/10 text-destructive",
      muted: "bg-primary/10 text-primary/60",
      accent: "bg-primary/10 text-primary",
      none: "",
    },
  },

  // Text styles
  title: "font-medium text-sm text-primary truncate",
  subtitle: "text-xs text-primary/60 truncate mt-0.5",
  metadata: "flex items-center gap-2 mt-0.5 text-xs text-primary/60",
  value: "text-md font-semibold text-primary",
  valueVariant: {
    primary: "text-primary",
    success: "text-success",
    destructive: "text-destructive",
  },
  secondaryValue: "text-xs text-primary/60",
};
