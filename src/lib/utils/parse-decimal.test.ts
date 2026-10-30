import { describe, expect, it } from 'vitest';
import { parseDecimal } from './parse-decimal';

describe('decimal input across locales and submit methods', () => {
  it.each(['1.234,56', '1,234.56', '1234,56', '1234.56'])(
    'parses %s without truncation',
    (value) => {
      expect(parseDecimal(value)).toBe(1234.56);
    }
  );
  it.each(['1.234', '12abc', '1,2,3', '12.3456', 'Infinity', '', '1.23.45'])(
    'rejects invalid input %s',
    (value) => {
      expect(parseDecimal(value)).toBeNaN();
    }
  );
  it('supports fractional shares without money rounding', () => {
    expect(parseDecimal('1,23456789', 10)).toBe(1.23456789);
    expect(parseDecimal('12,50')).toBe(12.5);
  });
});
