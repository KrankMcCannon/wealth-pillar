import { describe, expect, it } from 'vitest';
import { parseImportAmount } from './parse-import-amount';

describe('parseImportAmount', () => {
  it('parses dot-decimal amounts', () => {
    expect(parseImportAmount('4500.80')).toBe(4500.8);
    expect(parseImportAmount('-281.99')).toBe(-281.99);
  });

  it('parses Italian comma-decimal amounts', () => {
    expect(parseImportAmount('4500,80')).toBe(4500.8);
    expect(parseImportAmount('-5.000,00')).toBe(-5000);
    expect(parseImportAmount('15,00')).toBe(15);
  });

  it('returns null for empty values', () => {
    expect(parseImportAmount('')).toBeNull();
    expect(parseImportAmount(undefined)).toBeNull();
  });
});
