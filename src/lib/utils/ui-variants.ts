/**
 * ============================================================================
 * CENTRALIZED UI VARIANTS LIBRARY
 * Using Class Variance Authority (CVA) for type-safe, reusable style patterns
 *
 * Best Practice 2025: All component variants in one place
 * Based on shadcn/ui + Tailwind CSS v4 + CVA pattern
 * ============================================================================
 */

import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// CARD VARIANTS - Centralized card styling
// ============================================================================

/**
 * Card component variants
 *
 * Usage:
 * ```tsx
 * <div className={cardVariants({ variant: "interactive", padding: "lg" })}>
 *   Card content
 * </div>
 * ```
 */
export const cardVariants = cva(
  // Base styles - always applied
  "card-soft transition-all duration-200",
  {
    variants: {
      variant: {
        default: "hover:shadow-xl hover:border-primary/30",
        elevated: "shadow-2xl border-primary/40",
        flat: "shadow-none border-primary/10",
        interactive: "cursor-pointer hover:bg-interactive-hover hover:scale-[1.02]",
        glass: "liquid-glass",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4 sm:p-6",
        lg: "p-6 sm:p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

// ============================================================================
// TEXT VARIANTS - Centralized typography
// ============================================================================

/**
 * Text component variants for consistent typography
 *
 * Usage:
 * ```tsx
 * <p className={textVariants({ variant: "heading", size: "xl" })}>
 *   Heading Text
 * </p>
 * ```
 */
export const textVariants = cva("", {
  variants: {
    variant: {
      heading: "text-heading",
      body: "text-body",
      muted: "text-muted-foreground",
      emphasis: "text-text-emphasis font-semibold",
      subtle: "text-subtle",
      primary: "text-primary font-medium",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
      "3xl": "text-3xl",
    },
  },
  defaultVariants: {
    variant: "body",
    size: "md",
  },
});

// ============================================================================
// ICON CONTAINER VARIANTS - Centralized icon backgrounds
// ============================================================================

/**
 * Icon container with gradient backgrounds
 *
 * Usage:
 * ```tsx
 * <div className={iconContainerVariants({ size: "md", color: "primary" })}>
 *   <Icon />
 * </div>
 * ```
 */
export const iconContainerVariants = cva(
  // Base: flex centering and rounded
  "flex items-center justify-center rounded-2xl shadow-lg transition-all",
  {
    variants: {
      size: {
        sm: "size-8",
        md: "size-11",
        lg: "size-14",
        xl: "size-16",
      },
      color: {
        primary: "bg-primary/10 text-primary",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        success: "bg-success/10 text-success",
        muted: "bg-primary/12 text-primary",
        accent: "bg-accent/10 text-primary",
      },
    },
    defaultVariants: {
      size: "md",
      color: "primary",
    },
  }
);

// ============================================================================
// STATUS BADGE VARIANTS - Status indicators
// ============================================================================

/**
 * Status badge for financial states, progress, etc.
 *
 * Usage:
 * ```tsx
 * <div className={statusBadgeVariants({ status: "success", size: "md" })}>
 *   <div className="w-2 h-2 rounded-full bg-current" />
 *   In regola
 * </div>
 * ```
 */
export const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-bold transition-colors",
  {
    variants: {
      status: {
        success: "bg-success/10 text-success border border-success/20",
        warning: "bg-warning/10 text-warning border border-warning/20",
        danger: "bg-destructive/10 text-destructive border border-destructive/20",
        neutral: "bg-primary/10 text-primary border border-primary/20",
        info: "bg-accent/10 text-primary border border-accent/20",
      },
      size: {
        sm: "px-1.5 py-0.5 text-xs",
        md: "px-2 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      status: "neutral",
      size: "md",
    },
  }
);

// ============================================================================
// BUTTON VARIANTS - Extended from shadcn/ui button
// ============================================================================

/**
 * Additional button variants beyond shadcn/ui defaults
 *
 * Usage:
 * ```tsx
 * <button className={financialButtonVariants({ intent: "income" })}>
 *   Add Income
 * </button>
 * ```
 */
export const financialButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-all disabled:opacity-50",
  {
    variants: {
      intent: {
        income: "bg-success text-success hover:bg-success/90 shadow-success/20",
        expense: "bg-destructive text-destructive hover:bg-destructive/90",
        transfer: "bg-secondary text-secondary hover:bg-secondary/90",
        neutral: "bg-primary/10 text-primary hover:bg-primary/15",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-6 text-base",
      },
    },
    defaultVariants: {
      intent: "neutral",
      size: "md",
    },
  }
);

// ============================================================================
// PROGRESS BAR VARIANTS - Financial progress indicators
// ============================================================================

/**
 * Progress bar for budgets, goals, etc.
 *
 * Usage:
 * ```tsx
 * <div className={progressBarVariants({ status: "warning" })}>
 *   <div style={{ width: '75%' }} className={progressFillVariants({ status: "warning" })} />
 * </div>
 * ```
 */
export const progressBarVariants = cva(
  "w-full h-3 rounded-full shadow-inner overflow-hidden",
  {
    variants: {
      status: {
        success: "bg-primary/20",
        warning: "bg-primary/20",
        danger: "bg-primary/20",
        neutral: "bg-primary/20",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  }
);

export const progressFillVariants = cva(
  "h-full rounded-full transition-all duration-1000 ease-out relative",
  {
    variants: {
      status: {
        success: "bg-success shadow-lg shadow-success/20",
        warning: "bg-warning",
        danger: "bg-destructive",
        neutral: "bg-primary",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  }
);

// ============================================================================
// TRANSACTION CARD VARIANTS - Specific to transactions
// ============================================================================

/**
 * Transaction card variants for grouped/single transactions
 *
 * Usage:
 * ```tsx
 * <Card className={transactionCardVariants({ context: "due", urgency: "high" })}>
 *   Transaction content
 * </Card>
 * ```
 */
export const transactionCardVariants = cva(
  "py-0 backdrop-blur-sm transition-all duration-300",
  {
    variants: {
      context: {
        regular: "bg-card border border-primary/20 shadow-lg hover:shadow-xl",
        recurring: "bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20",
        due: "", // Determined by urgency
      },
      urgency: {
        none: "",
        low: "bg-gradient-to-r from-primary/10 via-card to-card border-primary/20 hover:shadow-primary/20",
        medium: "bg-gradient-to-r from-warning/10 via-warning/5 to-card border-warning/30 hover:shadow-warning/20",
        high: "bg-gradient-to-r from-destructive/10 via-destructive/5 to-card border-destructive/30 hover:shadow-destructive/20",
      },
    },
    compoundVariants: [
      {
        context: "due",
        urgency: "high",
        className: "hover:shadow-xl",
      },
    ],
    defaultVariants: {
      context: "regular",
      urgency: "none",
    },
  }
);

// ============================================================================
// AMOUNT DISPLAY VARIANTS - Financial amount styling
// ============================================================================

/**
 * Financial amount display with semantic colors
 *
 * Usage:
 * ```tsx
 * <span className={amountVariants({ type: "income", size: "lg" })}>
 *   €1,234.56
 * </span>
 * ```
 */
export const amountVariants = cva("font-bold tabular-nums", {
  variants: {
    type: {
      income: "text-success",
      expense: "text-destructive",
      transfer: "text-secondary",
      balance: "text-black",
      neutral: "text-muted-foreground",
    },
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl",
    },
    emphasis: {
      default: "",
      strong: "font-extrabold tracking-tight",
      subtle: "font-semibold",
    },
  },
  defaultVariants: {
    type: "balance",
    size: "md",
    emphasis: "default",
  },
});

// ============================================================================
// DIVIDER VARIANTS - Section separators
// ============================================================================

/**
 * Divider for separating sections
 *
 * Usage:
 * ```tsx
 * <hr className={dividerVariants({ color: "primary" })} />
 * ```
 */
export const dividerVariants = cva("border-0", {
  variants: {
    color: {
      default: "border-t border-border",
      primary: "border-t border-primary/20",
      muted: "border-t border-muted",
      transparent: "border-t border-transparent",
    },
    spacing: {
      none: "my-0",
      sm: "my-2",
      md: "my-4",
      lg: "my-6",
    },
  },
  defaultVariants: {
    color: "default",
    spacing: "md",
  },
});

// ============================================================================
// CALENDAR/DATE PICKER VARIANTS - Re-export from date-drawer-variants
// ============================================================================

/**
 * Calendar and date picker variants
 * Organized in separate file for better maintainability
 * Import these for calendar/date picker components
 */
export {
  dayButtonVariants,
  drawerContentVariants,
  monthNavButtonVariants,
  presetButtonVariants,
  calendarTriggerVariants,
  weekdayLabelVariants,
  getDayState,
  type DayButtonVariants,
  type DrawerContentVariants,
  type MonthNavButtonVariants,
  type PresetButtonVariants,
  type CalendarTriggerVariants,
  type WeekdayLabelVariants,
  type DayState,
} from "./date-drawer-variants";

// ============================================================================
// EXPORT TYPES - For TypeScript IntelliSense
// ============================================================================

export type CardVariants = VariantProps<typeof cardVariants>;
export type TextVariants = VariantProps<typeof textVariants>;
export type IconContainerVariants = VariantProps<typeof iconContainerVariants>;
export type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
export type FinancialButtonVariants = VariantProps<typeof financialButtonVariants>;
export type ProgressBarVariants = VariantProps<typeof progressBarVariants>;
export type ProgressFillVariants = VariantProps<typeof progressFillVariants>;
export type TransactionCardVariants = VariantProps<typeof transactionCardVariants>;
export type AmountVariants = VariantProps<typeof amountVariants>;
export type DividerVariants = VariantProps<typeof dividerVariants>;
