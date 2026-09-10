import { describe, expect, it } from 'vitest';
import type { Budget, BudgetPeriod } from '@/lib/types';
import {
  allocatedFromBudgets,
  deletePeriodBudgetList,
  materializePeriodBudgets,
  parseBudgetsSnapshot,
  resolvePeriodBudgets,
  snapshotNeedsLiveCopy,
  upsertPeriodBudgetList,
} from './period-budgets.logic';

const live: Budget = {
  id: 'live-1',
  description: 'Live',
  amount: 400,
  type: 'monthly',
  icon: null,
  categories: ['food'],
  user_id: 'u1',
  group_id: 'g1',
  created_at: '',
  updated_at: '',
};

const snap: Budget = { ...live, id: 'snap-1', description: 'Snap', amount: 150 };

function period(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'p1',
    user_id: 'u1',
    start_date: '2024-05-01',
    end_date: '2024-05-31',
    is_active: false,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('parseBudgetsSnapshot', () => {
  it('returns null for missing or non-array values', () => {
    expect(parseBudgetsSnapshot(null)).toBeNull();
    expect(parseBudgetsSnapshot(undefined)).toBeNull();
    expect(parseBudgetsSnapshot({ id: 'x' })).toBeNull();
  });

  it('keeps an empty array (no envelopes) distinct from missing', () => {
    expect(parseBudgetsSnapshot([])).toEqual([]);
  });
});

describe('snapshotNeedsLiveCopy', () => {
  it('is true for missing or empty snapshots, false when envelopes exist', () => {
    expect(snapshotNeedsLiveCopy(null)).toBe(true);
    expect(snapshotNeedsLiveCopy([])).toBe(true);
    expect(snapshotNeedsLiveCopy([snap])).toBe(false);
  });
});

describe('resolvePeriodBudgets', () => {
  it('uses live budgets for an open period even if a snapshot exists', () => {
    expect(
      resolvePeriodBudgets(
        period({ end_date: null, is_active: true, budgets_snapshot: [snap] }),
        [live]
      )
    ).toEqual([live]);
  });

  it('uses the snapshot for a closed period', () => {
    expect(resolvePeriodBudgets(period({ budgets_snapshot: [snap] }), [live])).toEqual([
      expect.objectContaining({ id: 'snap-1', amount: 150 }),
    ]);
  });

  it('does not use live envelopes when the closed period has no snapshot', () => {
    expect(resolvePeriodBudgets(period(), [live])).toEqual([]);
  });

  it('does not fall back when the snapshot is an empty list', () => {
    expect(resolvePeriodBudgets(period({ budgets_snapshot: [] }), [live])).toEqual([]);
  });
});

describe('materializePeriodBudgets', () => {
  it('does not copy live budgets when the snapshot is missing', () => {
    expect(materializePeriodBudgets(period())).toEqual([]);
  });

  it('uses the stored snapshot when present', () => {
    expect(materializePeriodBudgets(period({ budgets_snapshot: [snap] }))).toEqual([
      expect.objectContaining({ id: 'snap-1', amount: 150 }),
    ]);
  });
});

describe('upsertPeriodBudgetList / deletePeriodBudgetList', () => {
  it('appends a new envelope and removes by id', () => {
    const created = upsertPeriodBudgetList([], {
      description: 'New',
      amount: 80,
      type: 'monthly',
      categories: ['food'],
      user_id: 'u1',
      group_id: 'g1',
    });
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ description: 'New', amount: 80 });
    expect(deletePeriodBudgetList(created, created[0]!.id)).toEqual([]);
  });

  it('replaces an existing envelope', () => {
    const updated = upsertPeriodBudgetList([snap], {
      description: 'Edited',
      amount: 90,
      type: 'monthly',
      categories: ['food'],
      user_id: 'u1',
    }, snap.id);
    expect(updated).toHaveLength(1);
    expect(updated[0]).toMatchObject({ id: 'snap-1', description: 'Edited', amount: 90 });
  });
});

describe('allocatedFromBudgets', () => {
  it('sums positive amounts', () => {
    expect(allocatedFromBudgets([live, { ...live, id: 'z', amount: 0 }, snap])).toBe(550);
  });
});
