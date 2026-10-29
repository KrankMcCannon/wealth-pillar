import { describe, expect, it } from 'vitest';
import { parseYearFromFileName, resolveImportYear } from './import-row-utils';

describe('parseYearFromFileName', () => {
  it('reads the first four-digit year from the filename', () => {
    expect(parseYearFromFileName('2026-sept.csv')).toBe(2026);
  });

  it('returns null when no year is present', () => {
    expect(parseYearFromFileName('sept.csv')).toBeNull();
  });

  it('ignores four-digit numbers outside 1900-2100', () => {
    expect(parseYearFromFileName('1234-expenses.csv')).toBeNull();
  });
});

describe('resolveImportYear', () => {
  it('falls back to the injected date when the filename has no year', () => {
    expect(resolveImportYear('Sept.csv', new Date('2024-03-01T00:00:00Z'))).toBe(2024);
  });
});
