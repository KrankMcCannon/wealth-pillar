import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BudgetPeriod, Transaction, Account } from '@/lib/types';
import {
  editBudgetPeriodClosingDateUseCase,
  editPeriodDatesUseCase,
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
    findByGroup: vi.fn(),
  },
}));

vi.mock('./load-period-liquidity-data', () => ({
  loadPeriodLiquidityData: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateBudgetPeriodCaches: vi.fn(),
}));

import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { loadPeriodLiquidityData } from './load-period-liquidity-data';

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

describe('editPeriodDatesUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadPeriodLiquidityData).mockResolvedValue({
      transactions: [] as Transaction[],
      accounts: [] as Account[],
    });
  });

  it('shifts the next period start and recalculates both when a closed end changes', async () => {
    const closed = closedPeriod();
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([closed, active]);
    vi.mocked(BudgetPeriodsRepository.update)
      .mockResolvedValueOnce({ ...closed, end_date: '2024-05-28' })
      .mockResolvedValueOnce({ ...active, start_date: '2024-05-29' });

    const result = await editPeriodDatesUseCase('u1', 'closed-1', { endDate: '2024-05-28' });

    expect(result.period.end_date).toBe('2024-05-28');
    expect(result.nextPeriod?.start_date).toBe('2024-05-29');
    expect(BudgetPeriodsRepository.update).toHaveBeenNthCalledWith(
      1,
      'closed-1',
      expect.objectContaining({ end_date: '2024-05-28', snapshot_at: expect.any(Date) })
    );
    expect(BudgetPeriodsRepository.update).toHaveBeenNthCalledWith(
      2,
      'active-1',
      expect.objectContaining({ start_date: '2024-05-29', snapshot_at: expect.any(Date) })
    );
  });

  it('shifts the previous period end and recalculates both when a closed start changes', async () => {
    const older = closedPeriod({ id: 'older', start_date: '2024-04-01', end_date: '2024-04-30' });
    const closed = closedPeriod();
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([older, closed, active]);
    vi.mocked(BudgetPeriodsRepository.update)
      .mockResolvedValueOnce({ ...closed, start_date: '2024-05-05' })
      .mockResolvedValueOnce({ ...older, end_date: '2024-05-04' });

    const result = await editPeriodDatesUseCase('u1', 'closed-1', { startDate: '2024-05-05' });

    expect(result.previousPeriod?.end_date).toBe('2024-05-04');
    expect(BudgetPeriodsRepository.update).toHaveBeenNthCalledWith(
      2,
      'older',
      expect.objectContaining({ end_date: '2024-05-04', snapshot_at: expect.any(Date) })
    );
  });

  it('lets an active period change start and shifts the previous closing date', async () => {
    const closed = closedPeriod();
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(active);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([closed, active]);
    vi.mocked(BudgetPeriodsRepository.update)
      .mockResolvedValueOnce({ ...active, start_date: '2024-05-20' })
      .mockResolvedValueOnce({ ...closed, end_date: '2024-05-19' });

    const result = await editPeriodDatesUseCase('u1', 'active-1', { startDate: '2024-05-20' });

    expect(result.period.start_date).toBe('2024-05-20');
    expect(result.previousPeriod?.end_date).toBe('2024-05-19');
  });

  it('rejects editing the end date of an active period', async () => {
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(activePeriod());

    await expect(
      editPeriodDatesUseCase('u1', 'active-1', { endDate: '2024-06-15' })
    ).rejects.toMatchObject({ code: 'cannotEditActiveEnd' });
  });

  it('rejects end date before period start', async () => {
    const closed = closedPeriod();
    const active = activePeriod();
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(closed);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([closed, active]);

    await expect(
      editPeriodDatesUseCase('u1', 'closed-1', { endDate: '2024-04-30' })
    ).rejects.toMatchObject({ code: 'endBeforeStart' });
  });
});

describe('editBudgetPeriodClosingDateUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loadPeriodLiquidityData).mockResolvedValue({
      transactions: [] as Transaction[],
      accounts: [] as Account[],
    });
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
  });

  it('rejects editing the active period via the closing-date wrapper', async () => {
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(activePeriod());

    await expect(
      editBudgetPeriodClosingDateUseCase('u1', 'active-1', '2024-06-15')
    ).rejects.toThrow(EditClosingDateError);
    await expect(
      editBudgetPeriodClosingDateUseCase('u1', 'active-1', '2024-06-15')
    ).rejects.toMatchObject({ code: 'cannotEditActiveEnd' });
  });
});
