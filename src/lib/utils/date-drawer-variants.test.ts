import { describe, it, expect } from 'vitest';
import {
  dayButtonVariants,
  drawerContentVariants,
  monthNavButtonVariants,
  presetButtonVariants,
  calendarTriggerVariants,
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
      const className = dayButtonVariants({ state: 'default', size: 'mobile' });
      expect(className).toContain('rounded-xl');
      expect(className).toBeTruthy();
    });

    it('should return valid classes for selected variant', () => {
      const className = dayButtonVariants({ state: 'selected', size: 'mobile' });
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

    it('should handle desktop size', () => {
      const className = dayButtonVariants({ state: 'default', size: 'desktop' });
      expect(className).toContain('h-12');
    });
  });

  describe('drawerContentVariants', () => {
    it('should return valid classes for bottom position', () => {
      const className = drawerContentVariants({ position: 'bottom' });
      expect(className).toContain('bottom-0');
    });

    it('should return valid classes for center position', () => {
      const className = drawerContentVariants({ position: 'center' });
      expect(className).toContain('-translate-x-1/2');
    });

    it('should handle compact size', () => {
      const className = drawerContentVariants({ size: 'compact' });
      expect(className).toContain('max-h-[60vh]');
    });

    it('should handle full size', () => {
      const className = drawerContentVariants({ size: 'full' });
      expect(className).toContain('max-h-[90vh]');
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

  describe('presetButtonVariants', () => {
    it('should return valid classes when active', () => {
      const className = presetButtonVariants({ active: true });
      expect(className).toContain('bg-primary');
    });

    it('should return valid classes when inactive', () => {
      const className = presetButtonVariants({ active: false });
      expect(className).toContain('bg-card');
    });
  });

  describe('calendarTriggerVariants', () => {
    it('should return valid classes when active', () => {
      const className = calendarTriggerVariants({ active: true });
      expect(className).toContain('bg-primary');
    });

    it('should return valid classes when inactive', () => {
      const className = calendarTriggerVariants({ active: false });
      expect(className).toContain('border-2');
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
