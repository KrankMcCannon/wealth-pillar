import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DateTime } from 'luxon';
import {
  toDateTime,
  toISOString,
  toDateString,
  toJSDate,
  now,
  today,
  yesterday,
  nowISO,
  todayDateString,
  formatDateSmart,
  formatDateShort,
  formatDateFull,
  formatDateWithWeekday,
  formatDateRange,
  isToday,
  isYesterday,
  isWithinDays,
  isWithinWeek,
  isWithinMonth,
  isWithinYear,
  isInRange,
  diffInDays,
  addDays,
  addMonths,
  subtractDays,
  startOf,
  endOf,
  getDaysInMonth,
  getNextOccurrenceOfDay,
  daysUntil,
  formatDaysUntil,
} from './date-utils';

describe('date-utils', () => {
  // Use a fixed date for consistent testing
  const fixedDate = DateTime.fromISO('2024-06-15T12:00:00', { zone: 'Europe/Rome' });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate.toJSDate());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('toDateTime', () => {
    it('should return null for null/undefined input', () => {
      expect(toDateTime(null)).toBeNull();
      expect(toDateTime(undefined)).toBeNull();
    });

    it('should return same DateTime instance', () => {
      const dt = DateTime.now();
      expect(toDateTime(dt)).toBe(dt);
    });

    it('should convert Date object to DateTime', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = toDateTime(date);
      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(true);
    });

    it('should parse date-only string (YYYY-MM-DD)', () => {
      const result = toDateTime('2024-01-15');
      expect(result).not.toBeNull();
      expect(result?.day).toBe(15);
      expect(result?.month).toBe(1);
      expect(result?.year).toBe(2024);
    });

    it('should parse ISO string with timezone', () => {
      const result = toDateTime('2024-01-15T10:30:00Z');
      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(true);
    });

    it('should parse SQL format', () => {
      const result = toDateTime('2024-01-15 10:30:00');
      expect(result).not.toBeNull();
      expect(result?.isValid).toBe(true);
    });

    it('should return null for invalid string', () => {
      expect(toDateTime('invalid-date')).toBeNull();
    });

    it('should return null for other types', () => {
      expect(toDateTime(123 as unknown as string)).toBeNull();
    });
  });

  describe('toISOString', () => {
    it('should convert valid date to ISO string', () => {
      const result = toISOString('2024-01-15');
      expect(result).toContain('2024-01-15');
    });

    it('should return current time for null input', () => {
      const result = toISOString(null);
      expect(result).toContain('2024-06-15');
    });
  });

  describe('toDateString', () => {
    it('should convert valid date to date-only string', () => {
      const result = toDateString('2024-01-15T10:30:00Z');
      expect(result).toBe('2024-01-15');
    });

    it('should return today for null input', () => {
      const result = toDateString(null);
      expect(result).toBe('2024-06-15');
    });
  });

  describe('toJSDate', () => {
    it('should convert valid date to JS Date', () => {
      const result = toJSDate('2024-01-15');
      expect(result).toBeInstanceOf(Date);
    });

    it('should return current date for null input', () => {
      const result = toJSDate(null);
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('current date functions', () => {
    it('now() should return current DateTime', () => {
      const result = now();
      expect(result.day).toBe(15);
      expect(result.month).toBe(6);
      expect(result.year).toBe(2024);
    });

    it('today() should return start of today', () => {
      const result = today();
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
    });

    it('yesterday() should return start of yesterday', () => {
      const result = yesterday();
      expect(result.day).toBe(14);
      expect(result.hour).toBe(0);
    });

    it('nowISO() should return ISO string', () => {
      const result = nowISO();
      expect(result).toContain('2024-06-15');
    });

    it('todayDateString() should return date-only string', () => {
      const result = todayDateString();
      expect(result).toBe('2024-06-15');
    });
  });

  describe('formatDateSmart', () => {
    it('should return "Oggi" for today', () => {
      expect(formatDateSmart('2024-06-15')).toBe('Oggi');
    });

    it('should return "Ieri" for yesterday', () => {
      expect(formatDateSmart('2024-06-14')).toBe('Ieri');
    });

    it('should return formatted date for other dates', () => {
      const result = formatDateSmart('2024-06-10');
      expect(result).toContain('Lun');
      expect(result).toContain('10');
      expect(result).toContain('2024');
    });

    it('should return empty string for null input', () => {
      expect(formatDateSmart(null)).toBe('');
    });
  });

  describe('formatDateShort', () => {
    it('should format date in short format', () => {
      const result = formatDateShort('2024-06-15');
      expect(result).toContain('15');
    });

    it('should return empty string for null input', () => {
      expect(formatDateShort(null)).toBe('');
    });
  });

  describe('formatDateFull', () => {
    it('should format date in full format', () => {
      const result = formatDateFull('2024-06-15');
      expect(result).toContain('2024');
    });

    it('should return empty string for null input', () => {
      expect(formatDateFull(null)).toBe('');
    });
  });

  describe('formatDateWithWeekday', () => {
    it('should format date with weekday', () => {
      const result = formatDateWithWeekday('2024-06-15');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty string for null input', () => {
      expect(formatDateWithWeekday(null)).toBe('');
    });
  });

  describe('formatDateRange', () => {
    it('should format range with start and end', () => {
      const result = formatDateRange('2024-06-01', '2024-06-30');
      expect(result).toContain('1');
      expect(result).toContain('30');
    });

    it('should format range with only start', () => {
      const result = formatDateRange('2024-06-01', null);
      expect(result).toContain('Oggi');
    });

    it('should return empty string for null start', () => {
      expect(formatDateRange(null, '2024-06-30')).toBe('');
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday('2024-06-15')).toBe(true);
    });

    it('should return false for other dates', () => {
      expect(isToday('2024-06-14')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isToday(null)).toBe(false);
    });
  });

  describe('isYesterday', () => {
    it('should return true for yesterday', () => {
      expect(isYesterday('2024-06-14')).toBe(true);
    });

    it('should return false for today', () => {
      expect(isYesterday('2024-06-15')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isYesterday(null)).toBe(false);
    });
  });

  describe('isWithinDays', () => {
    it('should return true for date within range', () => {
      expect(isWithinDays('2024-06-14', 7)).toBe(true);
    });

    it('should return false for date outside range', () => {
      expect(isWithinDays('2024-06-01', 7)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isWithinDays(null, 7)).toBe(false);
    });
  });

  describe('isWithinWeek', () => {
    it('should return true for date within week', () => {
      expect(isWithinWeek('2024-06-14')).toBe(true);
    });

    it('should return false for date outside week', () => {
      expect(isWithinWeek('2024-06-01')).toBe(false);
    });
  });

  describe('isWithinMonth', () => {
    it('should return true for date within month', () => {
      expect(isWithinMonth('2024-06-01')).toBe(true);
    });

    it('should return false for date outside month', () => {
      expect(isWithinMonth('2024-04-01')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isWithinMonth(null)).toBe(false);
    });
  });

  describe('isWithinYear', () => {
    it('should return true for date within year', () => {
      expect(isWithinYear('2024-01-01')).toBe(true);
    });

    it('should return false for date outside year', () => {
      expect(isWithinYear('2023-01-01')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isWithinYear(null)).toBe(false);
    });
  });

  describe('isInRange', () => {
    it('should return true for date within range', () => {
      expect(isInRange('2024-06-15', '2024-06-01', '2024-06-30')).toBe(true);
    });

    it('should return true for date at start boundary', () => {
      expect(isInRange('2024-06-01', '2024-06-01', '2024-06-30')).toBe(true);
    });

    it('should return true for date at end boundary', () => {
      expect(isInRange('2024-06-30', '2024-06-01', '2024-06-30')).toBe(true);
    });

    it('should return false for date outside range', () => {
      expect(isInRange('2024-07-01', '2024-06-01', '2024-06-30')).toBe(false);
    });

    it('should return true for date after start when no end', () => {
      expect(isInRange('2024-06-15', '2024-06-01', null)).toBe(true);
    });

    it('should return false when date is null', () => {
      expect(isInRange(null, '2024-06-01', '2024-06-30')).toBe(false);
    });

    it('should return false when start is null', () => {
      expect(isInRange('2024-06-15', null, '2024-06-30')).toBe(false);
    });
  });

  describe('diffInDays', () => {
    it('should calculate positive difference', () => {
      expect(diffInDays('2024-06-01', '2024-06-15')).toBe(14);
    });

    it('should calculate negative difference', () => {
      expect(diffInDays('2024-06-15', '2024-06-01')).toBe(-14);
    });

    it('should return 0 for same day', () => {
      expect(diffInDays('2024-06-15', '2024-06-15')).toBe(0);
    });

    it('should return 0 for null inputs', () => {
      expect(diffInDays(null, '2024-06-15')).toBe(0);
      expect(diffInDays('2024-06-15', null)).toBe(0);
    });
  });

  describe('addDays', () => {
    it('should add days to date', () => {
      const result = addDays('2024-06-15', 10);
      expect(result.day).toBe(25);
    });

    it('should handle negative days', () => {
      const result = addDays('2024-06-15', -5);
      expect(result.day).toBe(10);
    });

    it('should use current date for null input', () => {
      const result = addDays(null, 5);
      expect(result.day).toBe(20);
    });
  });

  describe('addMonths', () => {
    it('should add months to date', () => {
      const result = addMonths('2024-06-15', 2);
      expect(result.month).toBe(8);
    });

    it('should handle year rollover', () => {
      const result = addMonths('2024-12-15', 2);
      expect(result.year).toBe(2025);
      expect(result.month).toBe(2);
    });

    it('should use current date for null input', () => {
      const result = addMonths(null, 1);
      expect(result.month).toBe(7);
    });
  });

  describe('subtractDays', () => {
    it('should subtract days from date', () => {
      const result = subtractDays('2024-06-15', 10);
      expect(result.day).toBe(5);
    });

    it('should handle month rollover', () => {
      const result = subtractDays('2024-06-05', 10);
      expect(result.month).toBe(5);
    });

    it('should use current date for null input', () => {
      const result = subtractDays(null, 5);
      expect(result.day).toBe(10);
    });
  });

  describe('startOf', () => {
    it('should get start of day', () => {
      const result = startOf('2024-06-15T14:30:00', 'day');
      expect(result.hour).toBe(0);
      expect(result.minute).toBe(0);
    });

    it('should get start of month', () => {
      const result = startOf('2024-06-15', 'month');
      expect(result.day).toBe(1);
    });

    it('should get start of year', () => {
      const result = startOf('2024-06-15', 'year');
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    it('should use current date for null input', () => {
      const result = startOf(null, 'day');
      expect(result.hour).toBe(0);
    });
  });

  describe('endOf', () => {
    it('should get end of day', () => {
      const result = endOf('2024-06-15T14:30:00', 'day');
      expect(result.hour).toBe(23);
      expect(result.minute).toBe(59);
    });

    it('should get end of month', () => {
      const result = endOf('2024-06-15', 'month');
      expect(result.day).toBe(30);
    });

    it('should use current date for null input', () => {
      const result = endOf(null, 'day');
      expect(result.hour).toBe(23);
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for 30-day month', () => {
      expect(getDaysInMonth(2024, 6)).toBe(30);
    });

    it('should return correct days for 31-day month', () => {
      expect(getDaysInMonth(2024, 7)).toBe(31);
    });

    it('should return correct days for February in leap year', () => {
      expect(getDaysInMonth(2024, 2)).toBe(29);
    });

    it('should return correct days for February in non-leap year', () => {
      expect(getDaysInMonth(2023, 2)).toBe(28);
    });
  });

  describe('getNextOccurrenceOfDay', () => {
    it('should return date in current month if day not passed', () => {
      const result = getNextOccurrenceOfDay(20, '2024-06-15');
      expect(result.day).toBe(20);
      expect(result.month).toBe(6);
    });

    it('should return date in next month if day has passed', () => {
      const result = getNextOccurrenceOfDay(10, '2024-06-15');
      expect(result.day).toBe(10);
      expect(result.month).toBe(7);
    });

    it('should handle end of month gracefully', () => {
      const result = getNextOccurrenceOfDay(31, '2024-06-15');
      expect(result.day).toBe(30); // June has 30 days
    });

    it('should use current date when reference is null', () => {
      const result = getNextOccurrenceOfDay(20);
      expect(result.day).toBe(20);
    });
  });

  describe('daysUntil', () => {
    it('should return 0 for today', () => {
      expect(daysUntil('2024-06-15')).toBe(0);
    });

    it('should return positive for future date', () => {
      expect(daysUntil('2024-06-20')).toBe(5);
    });

    it('should return negative for past date', () => {
      expect(daysUntil('2024-06-10')).toBe(-5);
    });

    it('should return 0 for null', () => {
      expect(daysUntil(null)).toBe(0);
    });
  });

  describe('formatDaysUntil', () => {
    it('should return "Oggi" for today', () => {
      expect(formatDaysUntil('2024-06-15')).toBe('Oggi');
    });

    it('should return "Domani" for tomorrow', () => {
      expect(formatDaysUntil('2024-06-16')).toBe('Domani');
    });

    it('should return "X giorni fa" for past dates', () => {
      expect(formatDaysUntil('2024-06-10')).toBe('5 giorni fa');
    });

    it('should return "Fra X giorni" for days ahead', () => {
      expect(formatDaysUntil('2024-06-18')).toBe('Fra 3 giorni');
    });

    it('should return "Fra 1 settimana" for 7 days', () => {
      expect(formatDaysUntil('2024-06-22')).toBe('Fra 1 settimana');
    });

    it('should return "Fra X settimane" for weeks ahead', () => {
      expect(formatDaysUntil('2024-07-01')).toBe('Fra 2 settimane');
    });

    it('should return "Fra 1 mese" for ~30 days', () => {
      expect(formatDaysUntil('2024-07-15')).toBe('Fra 1 mese');
    });

    it('should return "Fra X mesi" for months ahead', () => {
      expect(formatDaysUntil('2024-09-15')).toBe('Fra 3 mesi');
    });

    it('should return "Fra 1 anno" for ~365 days', () => {
      expect(formatDaysUntil('2025-06-15')).toBe('Fra 1 anno');
    });

    it('should return "Fra X anni" for years ahead', () => {
      expect(formatDaysUntil('2026-06-15')).toBe('Fra 2 anni');
    });
  });

  // Edge cases for remaining branch coverage
  describe('edge cases for null coalescing branches', () => {
    it('toDateTime should return null for invalid YYYY-MM-DD format', () => {
      // Line 53: Invalid date-only format
      expect(toDateTime('2024-99-99')).toBeNull();
    });

    it('toDateTime should handle format that fails all parsers', () => {
      // Line 66: Will try fromFormat as last resort
      expect(toDateTime('not-a-date-format-at-all')).toBeNull();
    });

    it('toISOString should handle empty string fallback', () => {
      // The function always returns a valid string
      const result = toISOString(null);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('toDateString should handle empty string fallback', () => {
      // The function always returns a valid string
      const result = toDateString(null);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('nowISO should return valid ISO string', () => {
      // Line 130: nowISO uses ?? '' fallback
      const result = nowISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('todayDateString should return valid date string', () => {
      // Line 137: todayDateString uses ?? '' fallback
      const result = todayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('getDaysInMonth should handle edge cases', () => {
      // Line 371: daysInMonth ?? 30 fallback
      // All valid months have daysInMonth defined, but we test various months
      expect(getDaysInMonth(2024, 1)).toBe(31); // January
      expect(getDaysInMonth(2024, 4)).toBe(30); // April
      expect(getDaysInMonth(2024, 12)).toBe(31); // December
    });
  });
});
