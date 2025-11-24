/**
 * Quick Presets Component
 *
 * Fast date selection with common presets
 * Optimized for mobile with vertical list layout
 *
 * Features:
 * - Italian preset labels
 * - Active state highlighting
 * - Touch-optimized button sizes
 * - Common financial date patterns
 */

"use client";

import { format, subDays, startOfWeek, startOfMonth, startOfYear, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { Zap } from "lucide-react";
import { calendarDrawerStyles } from "@/src/lib/styles/calendar-drawer.styles";
import { presetButtonVariants } from "@/src/lib/utils/date-drawer-variants";
import { cn } from "@/src/lib/utils/ui-variants";

/**
 * Preset configuration type
 */
interface PresetConfig {
  /** Display label (Italian) */
  label: string;
  /** Function to calculate the date */
  getValue: () => Date;
  /** Unique identifier */
  id: string;
}

/**
 * Available date presets
 * Common patterns for financial applications
 */
const DATE_PRESETS: PresetConfig[] = [
  {
    id: "today",
    label: "Oggi",
    getValue: () => new Date(),
  },
  {
    id: "yesterday",
    label: "Ieri",
    getValue: () => subDays(new Date(), 1),
  },
  {
    id: "7-days-ago",
    label: "7 giorni fa",
    getValue: () => subDays(new Date(), 7),
  },
  {
    id: "30-days-ago",
    label: "30 giorni fa",
    getValue: () => subDays(new Date(), 30),
  },
  {
    id: "week-start",
    label: "Inizio settimana",
    getValue: () => startOfWeek(new Date(), { weekStartsOn: 1, locale: it }),
  },
  {
    id: "month-start",
    label: "Inizio mese",
    getValue: () => startOfMonth(new Date()),
  },
  {
    id: "year-start",
    label: "Inizio anno",
    getValue: () => startOfYear(new Date()),
  },
];

export interface QuickPresetsProps {
  /**
   * Currently selected date (for highlighting active preset)
   */
  selectedDate?: Date;

  /**
   * Callback when preset is selected
   */
  onSelect: (date: Date) => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * QuickPresets - Fast date selection buttons
 *
 * Provides quick access to commonly used dates
 * Optimized for mobile with large touch targets
 *
 * @example
 * ```tsx
 * <QuickPresets
 *   selectedDate={selectedDate}
 *   onSelect={handleDateSelect}
 * />
 * ```
 */
export function QuickPresets({ selectedDate, onSelect, className }: QuickPresetsProps) {
  return (
    <section className={cn(calendarDrawerStyles.presets.section, className)} aria-label="Scorciatoie data">
      {/* Section Title */}
      <h3 className={calendarDrawerStyles.presets.title}>
        <Zap className="h-4 w-4" />
        Scorciatoie
      </h3>

      {/* Preset Buttons */}
      <div className={calendarDrawerStyles.presets.container}>
        {DATE_PRESETS.map((preset) => {
          const presetDate = preset.getValue();
          const isActive = selectedDate ? isSameDay(presetDate, selectedDate) : false;

          // Format date for aria-label
          const formattedDate = format(presetDate, "d MMMM yyyy", { locale: it });

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(presetDate)}
              className={cn(
                calendarDrawerStyles.presets.button.base,
                presetButtonVariants({ active: isActive })
              )}
              aria-label={`${preset.label}: ${formattedDate}`}
              aria-pressed={isActive}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/**
 * Export presets for use in other components
 */
export { DATE_PRESETS };
export type { PresetConfig };
