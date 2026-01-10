/**
 * Day Cell Component
 *
 * Touch-optimized calendar day button with all visual states
 * 48px minimum touch target (WCAG AA compliant)
 *
 * Features:
 * - All date states (selected, today, disabled, weekend, other month)
 * - Framer Motion tap/hover animations
 * - Full accessibility (ARIA labels, keyboard support)
 * - Italian locale formatting
 */

"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { motion } from "framer-motion";
import { dayButtonVariants, getDayState } from "@/lib/utils/date-drawer-variants";

export interface DayCellProps {
  /**
   * The date this cell represents
   */
  date: Date;

  /**
   * Whether this date is currently selected
   */
  isSelected: boolean;

  /**
   * Whether this date is today
   */
  isToday: boolean;

  /**
   * Whether this date should be disabled (outside min/max range)
   */
  isDisabled: boolean;

  /**
   * Whether this date falls on a weekend (Saturday/Sunday)
   */
  isWeekend: boolean;

  /**
   * Whether this date belongs to a different month (padding date)
   */
  isOtherMonth: boolean;

  /**
   * Callback when date is clicked
   */
  onClick: (date: Date) => void;

  /**
   * Size variant (mobile or desktop)
   * @default "mobile"
   */
  size?: "mobile" | "desktop";
}

/**
 * DayCell - Individual calendar day button
 *
 * Renders a single day in the calendar grid with full interactivity
 * Handles all visual states and touch optimization
 *
 * @example
 * ```tsx
 * <DayCell
 *   date={new Date(2024, 0, 15)}
 *   isSelected={selectedDate?.getDate() === 15}
 *   isToday={isToday(date)}
 *   isDisabled={date < minDate}
 *   isWeekend={isWeekend(date)}
 *   isOtherMonth={!isSameMonth(date, currentMonth)}
 *   onClick={handleDateSelect}
 * />
 * ```
 */
export function DayCell({
  date,
  isSelected,
  isToday,
  isDisabled,
  isWeekend,
  isOtherMonth,
  onClick,
  size = "mobile",
}: DayCellProps) {
  // Determine which visual state to apply
  const state = getDayState({
    isSelected,
    isToday,
    isDisabled,
    isWeekend,
    isOtherMonth,
  });

  // Format day number (1-31)
  const dayNumber = format(date, "d");

  // Format full date for accessibility
  const fullDate = format(date, "d MMMM yyyy", { locale: it });

  // Handle click
  const handleClick = () => {
    if (!isDisabled) {
      onClick(date);
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <motion.button
      type="button"
      className={dayButtonVariants({ state, size })}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={`Seleziona ${fullDate}`}
      aria-pressed={isSelected}
      aria-disabled={isDisabled}
      aria-current={isToday ? "date" : undefined}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      // Framer Motion animations
      whileTap={!isDisabled ? { scale: 0.95 } : undefined}
      whileHover={!isDisabled ? { scale: 1.05 } : undefined}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 20,
      }}
    >
      {dayNumber}
    </motion.button>
  );
}
