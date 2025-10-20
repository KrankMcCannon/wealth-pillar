"use client";

import * as React from "react";
import { format, parse, isValid, subDays, startOfWeek, startOfMonth, startOfYear } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Form Date Picker Component - Modern Edition
 *
 * Beautiful, modern calendar-based date picker with Italian locale support.
 * Formats dates as YYYY-MM-DD for form submission.
 * Allows both manual input and calendar selection.
 *
 * Features:
 * - Italian locale (DD/MM/YYYY display format)
 * - ISO 8601 format (YYYY-MM-DD) for API/database
 * - Manual text input with validation
 * - Calendar popup selection with quick presets
 * - Min/max date constraints
 * - Modern glassmorphism design
 * - Quick action buttons (Today, Yesterday, Last week, etc.)
 * - Clear button for easy reset
 * - Responsive (works beautifully on mobile)
 *
 * @example
 * ```tsx
 * <FormDatePicker
 *   value={formData.date}
 *   onChange={(date) => handleChange('date', date)}
 *   placeholder="Seleziona data"
 *   minDate={new Date('2020-01-01')}
 * />
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FormDatePickerProps {
  /** Current date value (YYYY-MM-DD format) */
  value: string;
  /** Callback when date changes (returns YYYY-MM-DD string) */
  onChange: (date: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Show quick action presets */
  showPresets?: boolean;
}

// ============================================================================
// QUICK PRESETS
// ============================================================================

const DATE_PRESETS = [
  {
    label: "Oggi",
    getValue: () => new Date(),
  },
  {
    label: "Ieri",
    getValue: () => subDays(new Date(), 1),
  },
  {
    label: "7 giorni fa",
    getValue: () => subDays(new Date(), 7),
  },
  {
    label: "30 giorni fa",
    getValue: () => subDays(new Date(), 30),
  },
  {
    label: "Inizio settimana",
    getValue: () => startOfWeek(new Date(), { locale: it }),
  },
  {
    label: "Inizio mese",
    getValue: () => startOfMonth(new Date()),
  },
  {
    label: "Inizio anno",
    getValue: () => startOfYear(new Date()),
  },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function FormDatePicker({
  value,
  onChange,
  placeholder = "Seleziona data",
  disabled = false,
  className,
  minDate,
  maxDate,
  showPresets = true,
}: FormDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Convert string value to Date object
  const selectedDate = value ? new Date(value) : undefined;

  // Sync input value with prop value
  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setInputValue(format(date, "dd/MM/yyyy"));
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onChange(formatDateForInput(date));
      setIsOpen(false);
    }
  };

  const handlePresetSelect = (presetIndex: number) => {
    const preset = DATE_PRESETS[presetIndex];
    const date = preset.getValue();
    onChange(formatDateForInput(date));
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the input as DD/MM/YYYY
    if (newValue.length === 10) {
      const parsed = parse(newValue, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange(formatDateForInput(parsed));
      }
    } else if (newValue === "") {
      onChange("");
    }
  };

  const handleInputBlur = () => {
    // Reset input to formatted value if invalid
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setInputValue(format(date, "dd/MM/yyyy"));
      }
    } else {
      setInputValue("");
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setInputValue("");
  };

  const isDateDisabled = (date: Date) => {
    // Normalize dates to midnight for comparison (ignore time component)
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    if (minDate) {
      const normalizedMin = new Date(minDate);
      normalizedMin.setHours(0, 0, 0, 0);
      if (normalizedDate < normalizedMin) return true;
    }

    if (maxDate) {
      const normalizedMax = new Date(maxDate);
      normalizedMax.setHours(0, 0, 0, 0);
      if (normalizedDate > normalizedMax) return true;
    }

    return false;
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        {/* Input Group - Side by Side Layout */}
        <div className="flex gap-2 w-full">
          {/* Text Input Field */}
          <div className="relative flex-1">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder={!inputValue ? "GG/MM/AAAA" : placeholder}
              disabled={disabled}
              className="pr-8 text-primary"
              autoFocus={false}
            />
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary transition-colors"
                aria-label="Cancella data"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Calendar Button */}
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "h-10 w-10 shrink-0 border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/40 transition-all",
                value && "bg-primary/10 border-primary/40"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="sr-only">Apri calendario</span>
            </Button>
          </PopoverTrigger>
        </div>

        {/* Calendar Popover */}
        <PopoverContent
          className="w-auto p-0 rounded-2xl shadow-xl border-primary/20"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={10}
        >
          <div className="flex flex-col md:flex-row">
            {/* Quick Presets Sidebar (only on desktop if enabled) */}
            {showPresets && (
              <div className="md:border-r border-b md:border-b-0 border-primary/20 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm">
                <div className="p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">
                    Scorciatoie
                  </p>
                  <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
                    {DATE_PRESETS.map((preset, index) => {
                      const presetDate = preset.getValue();

                      return (
                        <Button
                          key={preset.label}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePresetSelect(index)}
                          className={cn(
                            "justify-start text-xs whitespace-nowrap md:w-full",
                            "hover:bg-primary/10 hover:text-primary",
                            value === formatDateForInput(presetDate) && "bg-primary/10 text-primary font-medium"
                          )}
                        >
                          {preset.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Calendar */}
            <div className="bg-gradient-to-br from-card to-card/90 backdrop-blur-sm">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                locale={it}
                autoFocus
                className="rounded-2xl"
              />

              {/* Footer Actions */}
              <div className="border-t border-primary/20 p-3 flex items-center justify-between bg-card/50 backdrop-blur-sm rounded-b-2xl">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange(formatDateForInput(new Date()));
                    setIsOpen(false);
                  }}
                  className="text-xs hover:bg-primary/10 hover:text-primary"
                >
                  Oggi
                </Button>

                {value && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onChange("");
                      setIsOpen(false);
                    }}
                    className="text-xs text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                  >
                    Cancella
                  </Button>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats date string to YYYY-MM-DD for form input
 */
export function formatDateForInput(date: Date | string | null): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parses YYYY-MM-DD string to Date object
 */
export function parseInputDate(dateString: string): Date | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Gets today's date as YYYY-MM-DD string
 */
export function getTodayString(): string {
  const today = new Date();
  return formatDateForInput(today);
}

/**
 * Checks if date is today
 */
export function isToday(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if date is in the past
 */
export function isPast(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Checks if date is in the future
 */
export function isFuture(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date > today;
}

// Export types
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
