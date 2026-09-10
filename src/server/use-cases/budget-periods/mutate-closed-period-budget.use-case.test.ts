import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Budget, BudgetPeriod } from '@/lib/types';
import {
  ClosedPeriodBudgetError,
  deleteClosedPeriodBudgetUseCase,
  upsertClosedPeriodBudgetUseCase,
} from './mutate-closed-period-budget.use-case';

vi.mock('@/server/repositories/budget-periods.repository', () => ({
  BudgetPeriodsRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateBudgetPeriodCaches: vi.fn(),
}));

import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';

const live: Budget = {
  id: 'live-1',
  description: 'Live',
  amount: 200,
  type: 'monthly',
  icon: null,
  categories: ['food'],
  user_id: 'u1',
  group_id: 'g1',
  created_at: '',
  updated_at: '',
};

function closedPeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'closed-1',
    user_id: 'u1',
    group_id: 'g1',
    start_date: '2024-05-01',
    end_date: '2024-05-31',
    is_active: false,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

const input = {
  description: 'Groceries',
  amount: 80,
  type: 'monthly' as const,
  categories: ['food'],
  user_id: 'other',
  group_id: 'g1',
};

describe('upsertClosedPeriodBudgetUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BudgetPeriodsRepository.update).mockImplementation(async (_id, data) =>
      closedPeriod({ budgets_snapshot: data.budgets_snapshot as Budget[] })
    );
  });

  it('rejects an open period', async () => {
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(
      closedPeriod({ end_date: null, is_active: true })
    );
    await expect(upsertClosedPeriodBudgetUseCase('u1', 'closed-1', input)).rejects.toMatchObject({
      code: 'periodMustBeClosed',
    } satisfies Partial<ClosedPeriodBudgetError>);
  });

  it('starts from an empty snapshot then appends', async () => {
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closedPeriod());
    const saved = await upsertClosedPeriodBudgetUseCase('u1', 'closed-1', input);
    expect(saved).toMatchObject({ description: 'Groceries', amount: 80, user_id: 'u1' });
    const written = vi.mocked(BudgetPeriodsRepository.update).mock.calls[0]?.[1]
      .budgets_snapshot as Budget[];
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({ description: 'Groceries', amount: 80 });
  });

  it('updates an existing snapshot row', async () => {
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(
      closedPeriod({ budgets_snapshot: [live] })
    );
    const saved = await upsertClosedPeriodBudgetUseCase('u1', 'closed-1', input, 'live-1');
    expect(saved).toMatchObject({ id: 'live-1', description: 'Groceries', amount: 80 });
    const written = vi.mocked(BudgetPeriodsRepository.update).mock.calls[0]?.[1]
      .budgets_snapshot as Budget[];
    expect(written).toHaveLength(1);
  });
});

describe('deleteClosedPeriodBudgetUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(BudgetPeriodsRepository.update).mockResolvedValue(
      closedPeriod({ budgets_snapshot: [] })
    );
  });

  it('writes the remaining snapshot', async () => {
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(
      closedPeriod({ budgets_snapshot: [live] })
    );
    await expect(deleteClosedPeriodBudgetUseCase('u1', 'closed-1', 'live-1')).resolves.toEqual({
      id: 'live-1',
    });
    expect(vi.mocked(BudgetPeriodsRepository.update).mock.calls[0]?.[1].budgets_snapshot).toEqual(
      []
    );
  });
});
