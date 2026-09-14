import { describe, expect, it } from 'vitest';
import { detectFormatFromRows, parseImportRows } from './import-templates';
import { credemFixtureRows } from './__fixtures__/credem-sample.rows';
import { householdFixtureRows } from './__fixtures__/household-sample.rows';
import { revolutFixtureRows } from './__fixtures__/revolut-sample.rows';

describe('detectFormatFromRows', () => {
  it('detects credem, revolut, and household from their headers', () => {
    expect(detectFormatFromRows(credemFixtureRows)).toBe('credem');
    expect(detectFormatFromRows(revolutFixtureRows)).toBe('revolut');
    expect(detectFormatFromRows(householdFixtureRows)).toBe('household');
  });

  it('returns null for unknown headers', () => {
    expect(detectFormatFromRows([['foo', 'bar', 'baz', 'qux']])).toBeNull();
  });

  it('prefers credem when both bank signatures are present', () => {
    expect(
      detectFormatFromRows([
        [
          'Data contabile',
          'Data valuta',
          'Importo',
          'Type',
          'Product',
          'Started date',
          'Completed date',
          'Description',
          'Amount',
        ],
      ])
    ).toBe('credem');
  });
});

describe('parseImportRows', () => {
  it('parses household rows with the year from the filename', () => {
    const result = parseImportRows(householdFixtureRows, {
      fileName: '2026-sept.csv',
    });
    expect(result.format).toBe('household');
    const pharmacy = result.groups
      .flatMap((group) => group.rows)
      .find((row) => row.description === 'Pharmacy');
    expect(pharmacy?.date).toBe('2026-09-01');
  });

  it('uses the injected now year when the filename has no year', () => {
    const result = parseImportRows(householdFixtureRows, {
      fileName: 'sept.csv',
      now: new Date('2024-01-15T00:00:00Z'),
    });
    const pharmacy = result.groups
      .flatMap((group) => group.rows)
      .find((row) => row.description === 'Pharmacy');
    expect(pharmacy?.date).toBe('2024-09-01');
  });

  it('throws for unsupported formats', () => {
    expect(() => parseImportRows([['foo', 'bar', 'baz', 'qux']], { fileName: 'x.csv' })).toThrow(
      'Unsupported import format'
    );
  });

  it('throws when a matched file has no importable rows', () => {
    expect(() =>
      parseImportRows(
        [
          ['Colonna 1', 'Day', 'What', 'Categoria', 'Shared', 'Member A', 'Member B'],
          ['9', '2', '', '', '', '', ''],
        ],
        { fileName: '2026.csv' }
      )
    ).toThrow('No importable transactions found in file');
  });
});

describe('parseImportFile', () => {
  it('reads utf-8 csv euro amounts', async () => {
    const { parseImportFile } = await import('./index');
    const csv = [
      'Colonna 1,Day,What,Categoria,Shared,Member A,Member B',
      '9,1,Pharmacy,Salute,"€ 16,84",,',
    ].join('\n');
    const file = new File([csv], '2026-sept.csv', { type: 'text/csv' });
    const result = await parseImportFile(file);
    expect(result.groups.flatMap((group) => group.rows)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ description: 'Pharmacy', amount: 16.84, date: '2026-09-01' }),
      ])
    );
  });
});
