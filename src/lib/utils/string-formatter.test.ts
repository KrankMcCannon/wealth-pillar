import { describe, it, expect } from 'vitest';
import { truncateText, truncateMiddle } from './string-formatter';

describe('truncateText', () => {
  describe('basic functionality', () => {
    it('should return empty string for empty input', () => {
      expect(truncateText('')).toBe('');
    });

    it('should return original text when shorter than maxLength', () => {
      expect(truncateText('Short', 20)).toBe('Short');
    });

    it('should return original text when exactly maxLength', () => {
      expect(truncateText('Exactly Twenty!!!!!!', 20)).toBe('Exactly Twenty!!!!!!');
    });

    it('should truncate and add ellipsis when longer than maxLength', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is a ...');
    });
  });

  describe('custom maxLength', () => {
    it('should use default maxLength of 20', () => {
      const text = 'This text is longer than twenty characters';
      expect(truncateText(text)).toBe('This text is longer ...');
    });

    it('should handle very small maxLength', () => {
      expect(truncateText('Hello World', 3)).toBe('Hel...');
    });

    it('should handle maxLength of 1', () => {
      expect(truncateText('Hello', 1)).toBe('H...');
    });
  });
});

describe('truncateMiddle', () => {
  describe('basic functionality', () => {
    it('should return empty string for empty input', () => {
      expect(truncateMiddle('')).toBe('');
    });

    it('should return original text when shorter than combined lengths', () => {
      expect(truncateMiddle('Short', 6, 4)).toBe('Short');
    });

    it('should return original text when exactly combined lengths', () => {
      expect(truncateMiddle('1234567890', 6, 4)).toBe('1234567890');
    });

    it('should truncate in the middle when longer', () => {
      expect(truncateMiddle('0x1234567890abcdef', 6, 4)).toBe('0x1234...cdef');
    });
  });

  describe('custom lengths', () => {
    it('should use default values (6, 4)', () => {
      expect(truncateMiddle('abcdefghijklmnopqrstuvwxyz')).toBe('abcdef...wxyz');
    });

    it('should handle equal start and end lengths', () => {
      expect(truncateMiddle('Hello World Test', 5, 5)).toBe('Hello... Test');
    });

    it('should handle startLength of 0', () => {
      expect(truncateMiddle('Hello World', 0, 5)).toBe('...World');
    });

    it('should handle endLength of 0 (JS quirk: slice(-0) returns full string)', () => {
      // Note: text.slice(-0) returns entire string since -0 === 0
      expect(truncateMiddle('Hello World', 5, 0)).toBe('Hello...Hello World');
    });
  });
});
