import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BudgetPeriod, Transaction, Account } from '@/lib/types';
import {
  editBudgetPeriodClosingDateUseCase,
  findLatestClosedPeriod,
  EditClosingDateError,
} from './edit-closing-date.use-case';

vi.mock('@/server/repositories/budget-periods.repository', () => ({
  BudgetPeriodsRepository: {
    findById: vi.fn(),
    findByUser: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/server/repositories/accounts.repository', () => ({
  AccountsRepository: {
    findByUser: vi.fn(),
  },
}));

vi.mock('../transactions/get-transactions.use-case', () => ({
  getTransactionsByUserUseCase: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateBudgetPeriodCaches: vi.fn(),
}));

import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { getTransactionsByUserUseCase } from '../transactions/get-transactions.use-case';

function closedPeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'closed-1',
    user_id: 'u1',
    start_date: '2024-05-01',
    end_date: '2024-05-31',
    is_active: false,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function activePeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'active-1',
    user_id: 'u1',
    start_date: '2024-06-01',
    end_date: null,
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('findLatestClosedPeriod', () => {
  it('returns the closed period adjacent to the active period', () => {
    const active = activePeriod();
    const latest = closedPeriod();
    const older = closedPeriod({ id: 'older', end_date: '2024-04-30', start_date: '2024-04-01' });

    const result = findLatestClosedPeriod([latest, older, active], active);
    expect(result?.id).toBe('closed-1');
  });

  it('returns null when no closed period matches the active start', () => {
    const active = activePeriod({ start_date: '2024-07-01' });
    expect(findLatestClosedPeriod([closedPeriod()], active)).toBeNull();
  });
});

describe('editBudgetPeriodClosingDateUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTransactionsByUserUseCase).mockResolvedValue([] as Transaction[]);
    vi.mocked(AccountsRepository.findByUser).mockResolvedValue([] as Account[]);
  });

  it('updates closed snapshot and shifts active start date', async () => {
    const closed = closedPeriod();
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([closed, active]);
    vi.mocked(BudgetPeriodsRepository.update)
      .mockResolvedValueOnce({ ...closed, end_date: '2024-05-28' })
      .mockResolvedValueOnce({ ...active, start_date: '2024-05-29' });

    const result = await editBudgetPeriodClosingDateUseCase('u1', 'closed-1', '2024-05-28');

    expect(result.closedPeriod.end_date).toBe('2024-05-28');
    expect(result.activePeriod.start_date).toBe('2024-05-29');
    expect(BudgetPeriodsRepository.update).toHaveBeenCalledTimes(2);
    expect(BudgetPeriodsRepository.update).toHaveBeenNthCalledWith(
      2,
      'active-1',
      expect.objectContaining({ start_date: '2024-05-29' })
    );
  });

  it('rejects editing the active period', async () => {
    const active = activePeriod();
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(active);

    await expect(
      editBudgetPeriodClosingDateUseCase('u1', 'active-1', '2024-06-15')
    ).rejects.toThrow(EditClosingDateError);

    await expect(
      editBudgetPeriodClosingDateUseCase('u1', 'active-1', '2024-06-15')
    ).rejects.toMatchObject({ code: 'periodMustBeClosed' });
  });

  it('rejects editing a non-latest closed period', async () => {
    const closed = closedPeriod({ id: 'older', end_date: '2024-04-30' });
    const latest = closedPeriod();
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([latest, closed, active]);

    await expect(
      editBudgetPeriodClosingDateUseCase('u1', 'older', '2024-04-28')
    ).rejects.toMatchObject({ code: 'notLatestPeriod' });
  });

  it('rejects end date before period start', async () => {
    const closed = closedPeriod();
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([closed, active]);

    await expect(
      editBudgetPeriodClosingDateUseCase('u1', 'closed-1', '2024-04-30')
    ).rejects.toMatchObject({ code: 'endBeforeStart' });
  });
});
