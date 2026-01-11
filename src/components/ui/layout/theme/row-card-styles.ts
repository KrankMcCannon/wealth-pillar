/**
 * RowCard Theme Styles
 *
 * Centralized styling for unified row card components.
 * Supports variants: regular, interactive, highlighted, muted
 * Includes swipe-to-delete styles and animations
 */

import type { CSSProperties } from "react";
import type { MotionValue } from "framer-motion";

export const rowCardStyles = {
  // Wrapper container (for swipe layers)
  wrapper: "relative w-full overflow-hidden",

  // Base card styles
  base: "relative z-10 flex items-center justify-between bg-card rounded-none border-0 transition-colors first:pb-3 last:pt-3",

  // Variant styles
  variant: {
    regular: "",
    interactive: "cursor-pointer hover:bg-primary/5 active:bg-primary/10",
    highlighted: "border-primary/30 bg-primary/5",
    muted: "opacity-60",
  },

  // Swipe gesture styles
  swipe: {
    wrapper: "relative overflow-hidden",
    deleteLayer: "absolute inset-y-0 right-0 z-0 flex items-center justify-end",
    deleteButton:
      "px-6 h-full bg-destructive text-white font-medium flex items-center justify-center rounded-r-lg hover:bg-destructive/90 active:bg-destructive/80 transition-all duration-200 ease-out",
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

/**
 * Swipe Animation Tokens
 * These define the physics and behavior of swipe gestures
 */
export const rowCardTokens = {
  interaction: {
    swipe: {
      actionWidth: 100, // Width of delete button area
      threshold: 50, // Minimum drag distance to trigger open
      velocityThreshold: -200, // Minimum velocity to trigger open (negative = left)
    },
    spring: {
      stiffness: 300,
      damping: 30,
    },
    drag: {
      elastic: 0.2, // How much to allow dragging beyond constraints
    },
    tap: {
      threshold: 5, // Minimum x position to consider card as "open" on tap
    },
  },
};

/**
 * Helper: Generate motion style for swipe animation
 * Note: Uses type assertion to work around React 19 + Framer Motion type incompatibility
 */
export function getRowCardMotionStyle(x: MotionValue<number>) {
  return { x } as unknown as CSSProperties;
}

/**
 * Helper: Generate delete layer style based on open state
 */
export function getRowCardDeleteLayerStyle(isOpen: boolean, actionWidth: number): CSSProperties {
  return {
    width: isOpen ? `${actionWidth}px` : '0px',
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateX(0)' : 'translateX(12px)',
    transition: 'width 0.25s ease, opacity 0.2s ease, transform 0.25s ease',
  };
}
