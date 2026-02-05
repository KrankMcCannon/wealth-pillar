import { describe, it, expect } from 'vitest';
import { cn } from './ui-variants';

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', 'active', false)).toBe('base active');
  });

  it('should merge conflicting Tailwind classes', () => {
    // twMerge should keep 'p-4' when both 'p-2' and 'p-4' are provided
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('should handle objects with boolean values', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });
});
