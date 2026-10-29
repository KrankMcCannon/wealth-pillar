import { describe, expect, it } from 'vitest';
import { parseHouseholdRows } from './household.parser';
import { householdFixtureRows } from './__fixtures__/household-sample.rows';

describe('parseHouseholdRows', () => {
  it('splits amount columns from headers, skips empty and totale rows, and keeps category hints', () => {
    const groups = parseHouseholdRows(householdFixtureRows, { year: 2026 });
    const byKey = Object.fromEntries(groups.map((group) => [group.productKey, group]));

    expect(byKey.shared?.rows).toHaveLength(2);
    expect(byKey['member a']?.rows).toHaveLength(2);
    expect(byKey['member b']?.rows).toHaveLength(1);

    expect(byKey.shared?.rows.find((row) => row.description === 'Pharmacy')).toMatchObject({
      date: '2026-09-01',
      amount: 16.84,
      type: 'expense',
      categoryHint: 'salute',
      rawSource: { bank: 'household', product: 'Shared' },
    });

    expect(byKey['member a']?.rows.find((row) => row.description === 'Groceries')).toMatchObject({
      date: '2026-09-05',
      amount: 12,
      categoryHint: 'spesa',
    });

    expect(byKey['member b']?.rows[0]).toMatchObject({
      description: 'Fuel',
      date: '2026-09-06',
      amount: 40,
    });

    expect(byKey.shared?.rows.find((row) => row.description === 'Dinner')).toMatchObject({
      amount: 30,
    });
    expect(byKey['member a']?.rows.find((row) => row.description === 'Dinner')).toMatchObject({
      amount: 10,
    });
  });

  it('skips invalid calendar dates', () => {
    const groups = parseHouseholdRows(householdFixtureRows, { year: 2026 });
    const descriptions = groups.flatMap((group) => group.rows.map((row) => row.description));
    expect(descriptions).not.toContain('Invalid date');
  });
});
