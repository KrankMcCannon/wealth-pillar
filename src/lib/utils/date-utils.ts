/**
 * Date Utilities - Powered by Luxon
 * 
 * Centralized date handling for consistent formatting and manipulation
 * throughout the application. All date operations should use these utilities
 * instead of native Date object.
 */

import { DateTime, Settings } from 'luxon';

// Configure Luxon defaults
Settings.defaultLocale = 'it';
Settings.defaultZone = 'Europe/Rome';

// ============================================================================
// Types
// ============================================================================

export type DateInput = string | Date | DateTime | null | undefined;

export interface DateFormatOptions {
  locale?: string;
  includeTime?: boolean;
  includeYear?: boolean;
  weekday?: 'short' | 'long' | 'narrow';
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert any date input to Luxon DateTime
 * Handles strings (ISO, date-only), Date objects, and DateTime instances
 */
export function toDateTime(date: DateInput): DateTime | null {
  if (!date) return null;
  
  if (DateTime.isDateTime(date)) {
    return date;
  }
  
  if (date instanceof Date) {
    return DateTime.fromJSDate(date);
  }
  
  if (typeof date === 'string') {
    // Try ISO first
    let dt = DateTime.fromISO(date);
    if (dt.isValid) return dt;
    
    // Try SQL format
    dt = DateTime.fromSQL(date);
    if (dt.isValid) return dt;
    
    // Try common formats
    dt = DateTime.fromFormat(date, 'yyyy-MM-dd');
    if (dt.isValid) return dt;
    
    return null;
  }
  
  return null;
}

/**
 * Convert DateTime to ISO string for database storage
 */
export function toISOString(date: DateInput): string {
  const dt = toDateTime(date);
  if (!dt) return DateTime.now().toISO() ?? '';
  return dt.toISO() ?? '';
}

/**
 * Convert DateTime to date-only string (YYYY-MM-DD)
 */
export function toDateString(date: DateInput): string {
  const dt = toDateTime(date);
  if (!dt) return DateTime.now().toISODate() ?? '';
  return dt.toISODate() ?? '';
}

/**
 * Convert DateTime to JavaScript Date
 */
export function toJSDate(date: DateInput): Date {
  const dt = toDateTime(date);
  if (!dt) return new Date();
  return dt.toJSDate();
}

// ============================================================================
// Current Date/Time
// ============================================================================

/**
 * Get current DateTime
 */
export function now(): DateTime {
  return DateTime.now();
}

/**
 * Get start of today (midnight)
 */
export function today(): DateTime {
  return DateTime.now().startOf('day');
}

/**
 * Get yesterday at start of day
 */
export function yesterday(): DateTime {
  return DateTime.now().minus({ days: 1 }).startOf('day');
}

/**
 * Get current timestamp as ISO string
 */
export function nowISO(): string {
  return DateTime.now().toISO() ?? '';
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function todayDateString(): string {
  return DateTime.now().toISODate() ?? '';
}

// ============================================================================
// Formatting
// ============================================================================

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Format date for display with smart relative dates
 * Returns "Oggi", "Ieri", or compact format "Lun 15 Gen 2025"
 */
export function formatDateSmart(date: DateInput, locale = 'it-IT'): string {
  const dt = toDateTime(date);
  if (!dt) return '';
  
  const todayStart = today();
  const yesterdayStart = yesterday();
  const dateStart = dt.startOf('day');
  
  if (dateStart.equals(todayStart)) {
    return 'Oggi';
  }
  
  if (dateStart.equals(yesterdayStart)) {
    return 'Ieri';
  }
  
  // Compact format: "Lun 15 Gen 2025"
  const dayOfWeek = capitalize(dt.setLocale(locale).toFormat('ccc'));
  const day = dt.day;
  const month = capitalize(dt.setLocale(locale).toFormat('MMM'));
  const year = dt.year;
  
  return `${dayOfWeek} ${day} ${month} ${year}`;
}

/**
 * Format date for list display (short format)
 */
export function formatDateShort(date: DateInput, locale = 'it-IT'): string {
  const dt = toDateTime(date);
  if (!dt) return '';
  return dt.setLocale(locale).toFormat('d MMM');
}

/**
 * Format date for full display
 */
export function formatDateFull(date: DateInput, locale = 'it-IT'): string {
  const dt = toDateTime(date);
  if (!dt) return '';
  return dt.setLocale(locale).toFormat('cccc d MMMM yyyy');
}

/**
 * Format date with weekday and day/month (for transaction groups)
 */
export function formatDateWithWeekday(date: DateInput, locale = 'it-IT'): string {
  const dt = toDateTime(date);
  if (!dt) return '';
  return dt.setLocale(locale).toLocaleString({
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Format date range for display
 */
export function formatDateRange(
  start: DateInput,
  end: DateInput,
  locale = 'it-IT'
): string {
  const startDt = toDateTime(start);
  const endDt = toDateTime(end);
  
  if (!startDt) return '';
  
  const startStr = startDt.setLocale(locale).toFormat('d MMM');
  
  if (!endDt) {
    return `${startStr} - Oggi`;
  }
  
  const endStr = endDt.setLocale(locale).toFormat('d MMM yyyy');
  return `${startStr} - ${endStr}`;
}

// ============================================================================
// Comparisons
// ============================================================================

/**
 * Check if date is today
 */
export function isToday(date: DateInput): boolean {
  const dt = toDateTime(date);
  if (!dt) return false;
  return dt.hasSame(DateTime.now(), 'day');
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: DateInput): boolean {
  const dt = toDateTime(date);
  if (!dt) return false;
  return dt.hasSame(DateTime.now().minus({ days: 1 }), 'day');
}

/**
 * Check if date is within the last N days
 */
export function isWithinDays(date: DateInput, days: number): boolean {
  const dt = toDateTime(date);
  if (!dt) return false;
  const threshold = DateTime.now().minus({ days });
  return dt >= threshold;
}

/**
 * Check if date is within the last week
 */
export function isWithinWeek(date: DateInput): boolean {
  return isWithinDays(date, 7);
}

/**
 * Check if date is within the last month
 */
export function isWithinMonth(date: DateInput): boolean {
  const dt = toDateTime(date);
  if (!dt) return false;
  const threshold = DateTime.now().minus({ months: 1 });
  return dt >= threshold;
}

/**
 * Check if date is within the last year
 */
export function isWithinYear(date: DateInput): boolean {
  const dt = toDateTime(date);
  if (!dt) return false;
  const threshold = DateTime.now().minus({ years: 1 });
  return dt >= threshold;
}

/**
 * Check if date is in a date range (inclusive)
 */
export function isInRange(date: DateInput, start: DateInput, end: DateInput): boolean {
  const dt = toDateTime(date);
  const startDt = toDateTime(start);
  const endDt = toDateTime(end);
  
  if (!dt || !startDt) return false;
  
  if (endDt) {
    return dt >= startDt && dt <= endDt;
  }
  
  return dt >= startDt;
}

// ============================================================================
// Calculations
// ============================================================================

/**
 * Get difference between two dates in days
 */
export function diffInDays(date1: DateInput, date2: DateInput): number {
  const dt1 = toDateTime(date1);
  const dt2 = toDateTime(date2);
  
  if (!dt1 || !dt2) return 0;
  
  return Math.ceil(dt2.diff(dt1, 'days').days);
}

/**
 * Add days to a date
 */
export function addDays(date: DateInput, days: number): DateTime {
  const dt = toDateTime(date);
  if (!dt) return DateTime.now().plus({ days });
  return dt.plus({ days });
}

/**
 * Add months to a date
 */
export function addMonths(date: DateInput, months: number): DateTime {
  const dt = toDateTime(date);
  if (!dt) return DateTime.now().plus({ months });
  return dt.plus({ months });
}

/**
 * Subtract days from a date
 */
export function subtractDays(date: DateInput, days: number): DateTime {
  const dt = toDateTime(date);
  if (!dt) return DateTime.now().minus({ days });
  return dt.minus({ days });
}

/**
 * Get start of period (day, week, month, year)
 */
export function startOf(date: DateInput, unit: 'day' | 'week' | 'month' | 'year'): DateTime {
  const dt = toDateTime(date);
  if (!dt) return DateTime.now().startOf(unit);
  return dt.startOf(unit);
}

/**
 * Get end of period (day, week, month, year)
 */
export function endOf(date: DateInput, unit: 'day' | 'week' | 'month' | 'year'): DateTime {
  const dt = toDateTime(date);
  if (!dt) return DateTime.now().endOf(unit);
  return dt.endOf(unit);
}

/**
 * Get days in a specific month
 */
export function getDaysInMonth(year: number, month: number): number {
  return DateTime.local(year, month).daysInMonth ?? 30;
}

/**
 * Get the next occurrence of a specific day in the current or next month
 */
export function getNextOccurrenceOfDay(
  dueDay: number,
  referenceDate: DateInput = null
): DateTime {
  const ref = toDateTime(referenceDate) ?? DateTime.now();
  const currentDay = ref.day;
  
  // Limit due day to valid range
  const effectiveDueDay = Math.min(dueDay, getDaysInMonth(ref.year, ref.month));
  
  if (currentDay <= effectiveDueDay) {
    // Due day is in current month
    return ref.set({ day: effectiveDueDay });
  }
  
  // Due day is in next month
  const nextMonth = ref.plus({ months: 1 });
  const nextMonthDueDay = Math.min(dueDay, getDaysInMonth(nextMonth.year, nextMonth.month));
  return nextMonth.set({ day: nextMonthDueDay });
}

// ============================================================================
// Days Until Calculations (for Recurring)
// ============================================================================

/**
 * Calculate days until a specific date
 */
export function daysUntil(date: DateInput): number {
  const dt = toDateTime(date);
  if (!dt) return 0;
  
  const todayStart = today();
  const diff = dt.startOf('day').diff(todayStart, 'days').days;
  return Math.ceil(diff);
}

/**
 * Get human-readable days until string
 */
export function formatDaysUntil(date: DateInput): string {
  const days = daysUntil(date);
  
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Domani';
  if (days < 0) return `${Math.abs(days)} giorni fa`;
  if (days < 7) return `Fra ${days} giorni`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'Fra 1 settimana' : `Fra ${weeks} settimane`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? 'Fra 1 mese' : `Fra ${months} mesi`;
  }
  
  const years = Math.floor(days / 365);
  return years === 1 ? 'Fra 1 anno' : `Fra ${years} anni`;
}

// ============================================================================
// Re-exports from Luxon for convenience
// ============================================================================

export { DateTime, Duration, Interval, Settings } from 'luxon';
