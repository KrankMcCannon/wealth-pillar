/**
 * ============================================================================
 * DATE DRAWER CVA VARIANTS
 * Type-safe styling using Class Variance Authority
 * Redesigned with primary/white color scheme
 * ============================================================================
 */

import { cva, type VariantProps } from "class-variance-authority";

// ============================================================================
// DAY BUTTON VARIANTS - REDESIGNED
// ============================================================================

/**
 * Day cell button variants
 * Modern primary/white design with enhanced visual hierarchy
 */
export const dayButtonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center",
    "rounded-xl",
    "text-base font-semibold tabular-nums",
    "transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
  ].join(" "),
  {
    variants: {
      state: {
        // Default state - White with border
        default: [
          "text-primary dark:text-primary",
          "bg-card dark:bg-card/90",
          "hover:bg-primary hover:text-white",
          "hover:scale-110 hover:shadow-md",
          "active:scale-95",
          "border border-primary/15",
        ].join(" "),

        // Selected date - Full primary color
        selected: [
          "bg-primary text-white",
          "ring-4 ring-primary/20",
          "shadow-lg shadow-primary/40",
          "hover:bg-primary/90 hover:scale-110",
          "font-bold scale-105",
          "border-0",
        ].join(" "),

        // Today's date - Primary outline
        today: [
          "bg-card dark:bg-card/90",
          "text-primary",
          "ring-2 ring-primary",
          "font-bold",
          "hover:bg-primary hover:text-white hover:scale-110",
          "border-0",
        ].join(" "),

        // Disabled date
        disabled: [
          "text-gray-300 dark:text-gray-600",
          "bg-primary/5 dark:bg-primary/10",
          "cursor-not-allowed",
          "hover:bg-primary/5 hover:scale-100",
          "opacity-40",
          "border border-primary/15",
        ].join(" "),

        // Weekend date
        weekend: [
          "text-primary dark:text-primary",
          "bg-card dark:bg-card/90",
          "hover:bg-primary hover:text-white",
          "hover:scale-110",
          "border border-primary/15",
        ].join(" "),

        // Other month date
        otherMonth: [
          "text-gray-300 dark:text-gray-600",
          "bg-primary/5 dark:bg-primary/10",
          "hover:bg-primary/10 hover:text-primary/60",
          "hover:scale-105",
          "border border-primary/15",
        ].join(" "),
      },

      size: {
        // Mobile/Universal: 48px touch target
        mobile: "h-12 w-12 min-h-12 min-w-12 text-base",
        // Desktop: Same size for consistency
        desktop: "h-12 w-12 min-h-12 min-w-12 text-base",
      },
    },

    // Compound variants
    compoundVariants: [
      {
        state: "selected",
        size: "mobile",
        className: "shadow-xl shadow-primary/40",
      },
      {
        state: "today",
        size: "mobile",
        className: "ring-[3px]",
      },
    ],

    defaultVariants: {
      state: "default",
      size: "mobile",
    },
  }
);

// ============================================================================
// DRAWER CONTENT VARIANTS
// ============================================================================

export const drawerContentVariants = cva(
  // Base styles
  [
    "fixed z-50",
    "bg-card dark:bg-card",
    "shadow-2xl",
  ].join(" "),
  {
    variants: {
      position: {
        bottom: [
          "bottom-0 left-0 right-0",
          "rounded-t-3xl",
          "border-t-4 border-primary",
          "shadow-primary/10",
          "data-[state=open]:slide-in-from-bottom",
          "data-[state=closed]:slide-out-to-bottom",
        ].join(" "),

        center: [
          "top-1/2 left-1/2",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-2xl",
          "border-2 border-primary/20",
          "shadow-primary/30",
          "data-[state=open]:zoom-in-95",
          "data-[state=closed]:zoom-out-95",
        ].join(" "),
      },

      size: {
        compact: "max-h-[60vh]",
        full: "max-h-[90vh]",
      },
    },

    defaultVariants: {
      position: "bottom",
      size: "full",
    },
  }
);

// ============================================================================
// MONTH HEADER VARIANTS - REDESIGNED
// ============================================================================

/**
 * Month navigation button variants
 * Circular primary buttons with enhanced hover states
 */
export const monthNavButtonVariants = cva(
  // Base styles
  [
    "h-11 w-11 shrink-0",
    "inline-flex items-center justify-center",
    "rounded-full",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      disabled: {
        true: [
          "opacity-30",
          "cursor-not-allowed",
          "bg-primary/10 text-primary",
          "hover:bg-primary/10 hover:text-primary hover:scale-100",
          "hover:shadow-none",
        ].join(" "),
        false: [
          "bg-primary/10 text-primary",
          "hover:bg-primary hover:text-white",
          "hover:scale-110 hover:shadow-lg hover:shadow-primary/30",
          "active:scale-95",
        ].join(" "),
      },
    },
    defaultVariants: {
      disabled: false,
    },
  }
);

// ============================================================================
// PRESET BUTTON VARIANTS - REDESIGNED
// ============================================================================

/**
 * Quick preset button variants
 * Clean bordered design with primary color on hover/active
 */
export const presetButtonVariants = cva(
  // Base styles
  [
    "w-full",
    "h-11 px-4",
    "rounded-xl",
    "text-sm font-semibold",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      active: {
        true: [
          "bg-primary text-white",
          "border-primary",
          "shadow-md shadow-primary/30",
          "ring-2 ring-primary/20",
        ].join(" "),
        false: [
          "bg-card dark:bg-card/90",
          "text-primary dark:text-primary",
          "border-2 border-primary/20",
          "hover:border-primary/20 hover:bg-primary hover:text-white",
          "hover:shadow-md hover:shadow-primary/20",
          "active:scale-95",
        ].join(" "),
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

// ============================================================================
// CALENDAR INPUT FIELD VARIANTS - REDESIGNED
// ============================================================================

/**
 * Calendar trigger button variants
 * Primary color theme with enhanced states
 */
export const calendarTriggerVariants = cva(
  // Base styles
  [
    "h-11 w-11 shrink-0",
    "rounded-xl",
    "transition-all duration-200",
  ].join(" "),
  {
    variants: {
      active: {
        true: [
          "bg-primary text-white border-primary",
          "ring-2 ring-primary/30",
          "scale-105",
        ].join(" "),
        false: [
          "border-2 border-primary/20",
          "bg-card dark:bg-card/90 text-primary",
          "hover:bg-primary hover:text-white hover:border-primary",
          "hover:scale-105 hover:shadow-md hover:shadow-primary/20",
          "active:scale-95",
        ].join(" "),
      },
    },
    defaultVariants: {
      active: false,
    },
  }
);

// ============================================================================
// WEEKDAY LABEL VARIANTS
// ============================================================================

/**
 * Weekday label variants
 * Primary color emphasis
 */
export const weekdayLabelVariants = cva(
  // Base styles
  [
    "text-xs font-bold uppercase",
    "text-center py-2",
    "tracking-wider",
  ].join(" "),
  {
    variants: {
      isWeekend: {
        true: "text-primary/80",
        false: "text-primary",
      },
    },
    defaultVariants: {
      isWeekend: false,
    },
  }
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DayButtonVariants = VariantProps<typeof dayButtonVariants>;
export type DrawerContentVariants = VariantProps<typeof drawerContentVariants>;
export type MonthNavButtonVariants = VariantProps<typeof monthNavButtonVariants>;
export type PresetButtonVariants = VariantProps<typeof presetButtonVariants>;
export type CalendarTriggerVariants = VariantProps<typeof calendarTriggerVariants>;
export type WeekdayLabelVariants = VariantProps<typeof weekdayLabelVariants>;

export type DayState = NonNullable<DayButtonVariants["state"]>;

/**
 * Helper function to determine day state
 */
export function getDayState(options: {
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isWeekend: boolean;
  isOtherMonth: boolean;
}): DayState {
  const { isSelected, isToday, isDisabled, isWeekend, isOtherMonth } = options;

  if (isDisabled) return "disabled";
  if (isSelected) return "selected";
  if (isToday) return "today";
  if (isOtherMonth) return "otherMonth";
  if (isWeekend) return "weekend";
  return "default";
}
