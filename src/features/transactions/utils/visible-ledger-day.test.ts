import { describe, expect, it } from 'vitest';
import { pickVisibleLedgerDay } from './visible-ledger-day';

const days = [{ isoDate: '2026-09-11' }, { isoDate: '2026-09-10' }, { isoDate: '2026-09-09' }];

describe('pickVisibleLedgerDay', () => {
  it('stays on the newest day when no groups are measured yet', () => {
    expect(pickVisibleLedgerDay(days, new Map(), 160, '2026-09-11')).toBe('2026-09-11');
  });

  it('picks the first day whose bottom sits below the spendable bar', () => {
    const bottoms = new Map([
      ['2026-09-11', 120],
      ['2026-09-10', 400],
      ['2026-09-09', 700],
    ]);
    expect(pickVisibleLedgerDay(days, bottoms, 160, '2026-09-11')).toBe('2026-09-10');
  });

  it('uses the newest day when that group is still below the bar', () => {
    const bottoms = new Map([
      ['2026-09-11', 500],
      ['2026-09-10', 800],
    ]);
    expect(pickVisibleLedgerDay(days, bottoms, 160, '2026-09-11')).toBe('2026-09-11');
  });

  it('falls back to the oldest measured day after scrolling past the list', () => {
    const bottoms = new Map([
      ['2026-09-11', 40],
      ['2026-09-10', 80],
      ['2026-09-09', 120],
    ]);
    expect(pickVisibleLedgerDay(days, bottoms, 160, '2026-09-11')).toBe('2026-09-09');
  });
});
