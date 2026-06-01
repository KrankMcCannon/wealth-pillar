import { describe, it, expect } from 'vitest';
import {
  dayButtonVariants,
  monthNavButtonVariants,
  weekdayLabelVariants,
  getDayState,
} from './date-drawer-variants';

describe('getDayState', () => {
  const defaultOptions = {
    isSelected: false,
    isToday: false,
    isDisabled: false,
    isWeekend: false,
    isOtherMonth: false,
  };

  describe('priority order', () => {
    it('should return "disabled" when isDisabled is true (highest priority)', () => {
      const result = getDayState({
        ...defaultOptions,
        isDisabled: true,
        isSelected: true,
        isToday: true,
      });
      expect(result).toBe('disabled');
    });

    it('should return "selected" when isSelected is true (after disabled)', () => {
      const result = getDayState({
        ...defaultOptions,
        isSelected: true,
        isToday: true,
        isWeekend: true,
      });
      expect(result).toBe('selected');
    });

    it('should return "today" when isToday is true (after selected)', () => {
      const result = getDayState({
        ...defaultOptions,
        isToday: true,
        isWeekend: true,
        isOtherMonth: true,
      });
      expect(result).toBe('today');
    });

    it('should return "otherMonth" when isOtherMonth is true (after today)', () => {
      const result = getDayState({
        ...defaultOptions,
        isOtherMonth: true,
        isWeekend: true,
      });
      expect(result).toBe('otherMonth');
    });

    it('should return "weekend" when isWeekend is true (after otherMonth)', () => {
      const result = getDayState({
        ...defaultOptions,
        isWeekend: true,
      });
      expect(result).toBe('weekend');
    });

    it('should return "default" when no special conditions', () => {
      const result = getDayState(defaultOptions);
      expect(result).toBe('default');
    });
  });
});

describe('CVA Variants', () => {
  describe('dayButtonVariants', () => {
    it('should return valid classes for default variant', () => {
      const className = dayButtonVariants({ state: 'default' });
      expect(className).toContain('rounded-xl');
      expect(className).toBeTruthy();
    });

    it('should return valid classes for selected variant', () => {
      const className = dayButtonVariants({ state: 'selected' });
      expect(className).toContain('bg-primary');
      expect(className).toBeTruthy();
    });

    it('should return valid classes for today variant', () => {
      const className = dayButtonVariants({ state: 'today' });
      expect(className).toContain('ring-2');
    });

    it('should return valid classes for disabled variant', () => {
      const className = dayButtonVariants({ state: 'disabled' });
      expect(className).toContain('cursor-not-allowed');
    });

    it('should return valid classes for weekend variant', () => {
      const className = dayButtonVariants({ state: 'weekend' });
      expect(className).toBeTruthy();
    });

    it('should return valid classes for otherMonth variant', () => {
      const className = dayButtonVariants({ state: 'otherMonth' });
      expect(className).toBeTruthy();
    });
  });

  describe('monthNavButtonVariants', () => {
    it('should return valid classes when enabled', () => {
      const className = monthNavButtonVariants({ disabled: false });
      expect(className).toContain('hover:bg-primary');
    });

    it('should return valid classes when disabled', () => {
      const className = monthNavButtonVariants({ disabled: true });
      expect(className).toContain('cursor-not-allowed');
    });
  });

  describe('weekdayLabelVariants', () => {
    it('should return valid classes for weekday', () => {
      const className = weekdayLabelVariants({ isWeekend: false });
      expect(className).toContain('text-primary');
    });

    it('should return valid classes for weekend', () => {
      const className = weekdayLabelVariants({ isWeekend: true });
      expect(className).toContain('text-primary/80');
    });
  });
});
