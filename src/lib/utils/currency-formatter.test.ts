import { describe, it, expect } from 'vitest';
import { formatCurrency } from './currency-formatter';

describe('formatCurrency', () => {
  describe('basic formatting', () => {
    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('0,00 €');
    });

    it('should format positive integers', () => {
      expect(formatCurrency(100)).toBe('100,00 €');
    });

    it('should format positive decimals', () => {
      expect(formatCurrency(99.99)).toBe('99,99 €');
    });

    it('should round to 2 decimal places', () => {
      expect(formatCurrency(99.999)).toBe('100,00 €');
      expect(formatCurrency(99.994)).toBe('99,99 €');
    });
  });

  describe('negative numbers', () => {
    it('should format negative integers', () => {
      expect(formatCurrency(-100)).toBe('-100,00 €');
    });

    it('should format negative decimals', () => {
      expect(formatCurrency(-99.99)).toBe('-99,99 €');
    });
  });

  describe('thousand separators', () => {
    it('should add thousands separator', () => {
      expect(formatCurrency(1000)).toBe('1.000,00 €');
    });

    it('should add multiple thousands separators', () => {
      expect(formatCurrency(1000000)).toBe('1.000.000,00 €');
    });

    it('should format large numbers correctly', () => {
      expect(formatCurrency(1234567.89)).toBe('1.234.567,89 €');
    });

    it('should format negative large numbers', () => {
      expect(formatCurrency(-1234567.89)).toBe('-1.234.567,89 €');
    });
  });

  describe('edge cases', () => {
    it('should handle NaN', () => {
      expect(formatCurrency(Number.NaN)).toBe('0,00 €');
    });

    it('should handle very small decimals', () => {
      expect(formatCurrency(0.01)).toBe('0,01 €');
    });

    it('should handle negative fractional values', () => {
      expect(formatCurrency(-0.5)).toBe('-0,50 €');
    });
  });
});
