/**
 * Date Utilities - Centralized date handling functions
 *
 * Provides safe, consistent date parsing and formatting across the application.
 * All date operations should go through these functions.
 *
 * Features:
 * - Safe date parsing (returns null if invalid)
 * - Locale-aware formatting (EUR format)
 * - Type-safe date operations
 * - Consistent error handling
 */

/**
 * Safely parse a date from various input formats
 *
 * Handles:
 * - ISO 8601 strings (2024-10-24T12:00:00Z)
 * - Date objects
 * - Unix timestamps (milliseconds or seconds)
 * - Invalid/null values (returns null)
 *
 * @param dateInput The date to parse (string, Date, number, or null)
 * @returns Parsed Date object or null if invalid
 *
 * @example
 * safeParseDate('2024-10-24T12:00:00Z') // Returns Date object
 * safeParseDate('invalid') // Returns null
 * safeParseDate(null) // Returns null
 * safeParseDate(new Date()) // Returns same Date
 */
export function safeParseDate(dateInput: string | Date | number | null | undefined): Date | null {
  if (!dateInput) {
    return null;
  }

  try {
    // Handle Date objects
    if (dateInput instanceof Date) {
      return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    // Handle ISO strings and timestamps
    if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    // Handle timestamps (assume milliseconds if > year 2000)
    if (typeof dateInput === 'number') {
      if (dateInput > 100000000000) {
        // Likely milliseconds
        return new Date(dateInput);
      } else {
        // Likely seconds
        return new Date(dateInput * 1000);
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Format a date for display
 *
 * Formats dates using EU locale (DD/MM/YYYY HH:mm)
 * Returns "Data non disponibile" for invalid dates
 *
 * @param dateInput The date to format
 * @param format Format type: 'short' (DD/MM/YYYY), 'long' (full), or 'time' (HH:mm)
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-10-24T12:00:00Z', 'short') // '24/10/2024'
 * formatDate('2024-10-24T12:00:00Z', 'long') // '24 ottobre 2024 12:00'
 * formatDate('2024-10-24T12:00:00Z', 'time') // '12:00'
 * formatDate(null) // 'Data non disponibile'
 */
export function formatDate(
  dateInput: string | Date | number | null | undefined,
  format: 'short' | 'long' | 'time' = 'short'
): string {
  const date = safeParseDate(dateInput);

  if (!date) {
    return 'Data non disponibile';
  }

  try {
    const options: Intl.DateTimeFormatOptions = {};

    if (format === 'short') {
      options.year = 'numeric';
      options.month = '2-digit';
      options.day = '2-digit';
    } else if (format === 'long') {
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
      options.hour = '2-digit';
      options.minute = '2-digit';
    } else if (format === 'time') {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Intl.DateTimeFormat('it-IT', options).format(date);
  } catch {
    return 'Data non disponibile';
  }
}

/**
 * Get the start of a day (midnight)
 *
 * @param date The date to get the start of
 * @returns Date set to 00:00:00 of the given date
 *
 * @example
 * const date = new Date('2024-10-24T14:30:00');
 * const start = getStartOfDay(date);
 * // Returns 2024-10-24T00:00:00
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of a day (23:59:59.999)
 *
 * @param date The date to get the end of
 * @returns Date set to 23:59:59.999 of the given date
 *
 * @example
 * const date = new Date('2024-10-24T14:30:00');
 * const end = getEndOfDay(date);
 * // Returns 2024-10-24T23:59:59.999
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Get the start of a month
 *
 * @param date The date in the month
 * @returns Date set to first day of month at 00:00:00
 *
 * @example
 * const date = new Date('2024-10-24');
 * const start = getStartOfMonth(date);
 * // Returns 2024-10-01T00:00:00
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Get the end of a month
 *
 * @param date The date in the month
 * @returns Date set to last day of month at 23:59:59.999
 *
 * @example
 * const date = new Date('2024-10-24');
 * const end = getEndOfMonth(date);
 * // Returns 2024-10-31T23:59:59.999
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  const end = new Date(date);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Add days to a date
 *
 * @param date The base date
 * @param days Number of days to add (can be negative)
 * @returns New date with days added
 *
 * @example
 * addDays(new Date('2024-10-24'), 7) // 2024-10-31
 * addDays(new Date('2024-10-24'), -3) // 2024-10-21
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 *
 * @param date The base date
 * @param months Number of months to add (can be negative)
 * @returns New date with months added
 *
 * @example
 * addMonths(new Date('2024-10-24'), 1) // 2024-11-24
 * addMonths(new Date('2024-10-24'), -3) // 2024-07-24
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Check if a date is within a number of days (in the future)
 *
 * @param date The date to check
 * @param daysAhead Number of days from today
 * @returns true if date is within the specified days
 *
 * @example
 * isWithinDays(new Date('2024-10-27'), 7) // true (within 7 days from today)
 * isWithinDays(new Date('2024-11-24'), 7) // false (more than 7 days away)
 */
export function isWithinDays(date: Date, daysAhead: number): boolean {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= daysAhead;
}

/**
 * Check if a date is in the past
 *
 * @param date The date to check
 * @returns true if date is before now
 *
 * @example
 * isPast(new Date('2024-10-20')) // true (in the past)
 * isPast(new Date('2024-10-30')) // false (in the future)
 */
export function isPast(date: Date): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Check if a date is in the future
 *
 * @param date The date to check
 * @returns true if date is after now
 *
 * @example
 * isFuture(new Date('2024-10-30')) // true (in the future)
 * isFuture(new Date('2024-10-20')) // false (in the past)
 */
export function isFuture(date: Date): boolean {
  return new Date(date).getTime() > Date.now();
}

/**
 * Check if a date is today
 *
 * @param date The date to check
 * @returns true if date is today
 *
 * @example
 * isToday(new Date()) // true
 * isToday(new Date('2024-10-20')) // depends on current date
 */
export function isToday(date: Date): boolean {
  const today = getStartOfDay();
  const checkDate = getStartOfDay(date);
  return today.getTime() === checkDate.getTime();
}

/**
 * Get difference in days between two dates
 *
 * @param date1 First date
 * @param date2 Second date
 * @returns Number of days between dates (negative if date1 < date2)
 *
 * @example
 * daysBetween(new Date('2024-10-24'), new Date('2024-10-31')) // 7
 * daysBetween(new Date('2024-10-31'), new Date('2024-10-24')) // -7
 */
export function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get a date range for a specific period
 *
 * @param period 'today', 'week', 'month', 'quarter', 'year'
 * @param baseDate Base date to calculate from (defaults to today)
 * @returns { start, end } date range
 *
 * @example
 * getDateRange('week') // Returns start and end of current week
 * getDateRange('month') // Returns start and end of current month
 */
export function getDateRange(
  period: 'today' | 'week' | 'month' | 'quarter' | 'year',
  baseDate: Date = new Date()
): { start: Date; end: Date } {
  switch (period) {
    case 'today':
      return {
        start: getStartOfDay(baseDate),
        end: getEndOfDay(baseDate),
      };

    case 'week': {
      const start = new Date(baseDate);
      // Get Monday of this week
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    case 'month':
      return {
        start: getStartOfMonth(baseDate),
        end: getEndOfMonth(baseDate),
      };

    case 'quarter': {
      const quarter = Math.floor(baseDate.getMonth() / 3);
      const start = new Date(baseDate.getFullYear(), quarter * 3, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(baseDate.getFullYear(), quarter * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    case 'year': {
      const start = new Date(baseDate.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(baseDate.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);

      return { start, end };
    }

    default:
      return {
        start: getStartOfDay(baseDate),
        end: getEndOfDay(baseDate),
      };
  }
}
