import { describe, expect, it } from 'vitest';
import { parseCredemRows } from './credem.parser';
import { credemFixtureRows } from './__fixtures__/credem-sample.rows';

describe('parseCredemRows', () => {
  it('parses lista movimenti rows and skips provisional movements', () => {
    const groups = parseCredemRows(credemFixtureRows);
    expect(groups).toHaveLength(1);
    const group = groups[0]!;
    expect(group.format).toBe('credem');
    expect(group.excludedCount).toBe(1);
    expect(group.rows).toHaveLength(2);

    const salary = group.rows.find((row) => row.description.includes('EMOLUMENTI'));
    expect(salary).toMatchObject({
      date: '2026-06-26',
      type: 'income',
      amount: 2275,
      rawSource: { bank: 'credem', causale: 'EMRET' },
    });

    const netflix = group.rows.find((row) => row.description.includes('NETFLIX'));
    expect(netflix).toMatchObject({
      date: '2026-06-25',
      type: 'expense',
      amount: 13.99,
      rawSource: { bank: 'credem', causale: 'PDINT' },
    });
  });
});
