import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BudgetPeriod } from '@/lib/types';
import {
  findPreviousPeriod,
  findNextPeriod,
  rewindClosedPeriodUseCase,
  RewindClosedPeriodError,
} from './rewind-closed-period.use-case';

vi.mock('@/server/repositories/budget-periods.repository', () => ({
  BudgetPeriodsRepository: {
    findById: vi.fn(),
    findByUser: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/server/db/drizzle', () => ({
  db: {
    transaction: vi.fn(async (fn: (tx: Record<string, never>) => Promise<unknown>) => fn({})),
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateBudgetPeriodCaches: vi.fn(),
}));

import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';

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

function activePeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  return {
    id: 'active-1',
    user_id: 'u1',
    group_id: 'g1',
    start_date: '2024-06-01',
    end_date: null,
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('findNextPeriod', () => {
  it('returns the closest newer persisted period', () => {
    const latest = closedPeriod();
    const older = closedPeriod({ id: 'older', start_date: '2024-04-01', end_date: '2024-04-30' });
    const active = activePeriod();

    expect(findNextPeriod([latest, older, active], older)?.id).toBe('closed-1');
    expect(findNextPeriod([latest, older, active], latest)?.id).toBe('active-1');
  });
});

describe('findPreviousPeriod', () => {
  it('returns the closest older persisted period', () => {
    const latest = closedPeriod();
    const older = closedPeriod({ id: 'older', start_date: '2024-04-01', end_date: '2024-04-30' });
    const active = activePeriod();

    expect(findPreviousPeriod([latest, older, active], latest)?.id).toBe('older');
  });

  it('skips synthetic ids', () => {
    const latest = closedPeriod();
    const synthetic = closedPeriod({
      id: 'active-generated-u1',
      start_date: '2024-04-01',
      end_date: '2024-04-30',
    });

    expect(findPreviousPeriod([latest, synthetic], latest)).toBeNull();
  });
});

describe('rewindClosedPeriodUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes an active period and reopens the previous closed one', async () => {
    const latest = closedPeriod();
    const active = activePeriod();
    const reopened = { ...latest, is_active: true, end_date: null, snapshot_at: null };

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(active);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([latest, active]);
    vi.mocked(BudgetPeriodsRepository.delete).mockResolvedValue(undefined);
    vi.mocked(BudgetPeriodsRepository.update).mockResolvedValue(reopened);

    const result = await rewindClosedPeriodUseCase('u1', 'active-1');

    expect(result.deletedPeriodId).toBe('active-1');
    expect(result.previousPeriod.id).toBe('closed-1');
    expect(BudgetPeriodsRepository.delete).toHaveBeenCalledTimes(1);
    expect(BudgetPeriodsRepository.delete).toHaveBeenCalledWith('active-1', expect.anything());
    expect(BudgetPeriodsRepository.update).toHaveBeenCalledWith(
      'closed-1',
      expect.objectContaining({
        is_active: true,
        end_date: null,
        snapshot_at: null,
      }),
      expect.anything()
    );
  });

  it('refuses a closed period', async () => {
    const latest = closedPeriod();
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(latest);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([latest, active]);

    await expect(rewindClosedPeriodUseCase('u1', 'closed-1')).rejects.toMatchObject({
      code: 'periodMustBeActive',
    });
    expect(BudgetPeriodsRepository.delete).not.toHaveBeenCalled();
  });

  it('refuses when there is no previous period', async () => {
    const active = activePeriod();

    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(active);
    vi.mocked(BudgetPeriodsRepository.findByUser).mockResolvedValue([active]);

    await expect(rewindClosedPeriodUseCase('u1', 'active-1')).rejects.toMatchObject({
      code: 'noPreviousPeriod',
    });
  });

  it('refuses a synthetic period id', async () => {
    await expect(rewindClosedPeriodUseCase('u1', 'active-generated-u1')).rejects.toBeInstanceOf(
      RewindClosedPeriodError
    );
    expect(BudgetPeriodsRepository.findById).not.toHaveBeenCalled();
  });
});
