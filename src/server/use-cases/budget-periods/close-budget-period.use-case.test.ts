import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Budget, BudgetPeriod } from '@/lib/types';
import { closeBudgetPeriodUseCase } from './close-budget-period.use-case';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { loadPeriodLiquidityData } from './load-period-liquidity-data';
import { getBudgetsByUserUseCase } from '../budgets/get-budgets.use-case';

vi.mock('./budget-period-transaction', () => ({
  withBudgetPeriodTransaction: vi.fn(
    async (_userId: string, mutate: (tx: Record<string, never>) => Promise<unknown>) => mutate({})
  ),
}));
vi.mock('@/server/repositories/budget-periods.repository', () => ({
  BudgetPeriodsRepository: { findById: vi.fn(), update: vi.fn() },
}));
vi.mock('./load-period-liquidity-data', () => ({ loadPeriodLiquidityData: vi.fn() }));
vi.mock('../budgets/get-budgets.use-case', () => ({ getBudgetsByUserUseCase: vi.fn() }));
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
vi.mock('@/lib/utils/cache-utils', () => ({ invalidateBudgetPeriodCaches: vi.fn() }));

const active = {
  id: 'p1',
  user_id: 'u1',
  group_id: 'g1',
  start_date: '2024-05-01',
  end_date: null,
  is_active: true,
  created_at: '',
  updated_at: '',
} as BudgetPeriod;
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue(active);
  vi.mocked(loadPeriodLiquidityData).mockResolvedValue({ transactions: [], accounts: [] });
  vi.mocked(getBudgetsByUserUseCase).mockResolvedValue([]);
});

describe('closing a budget period', () => {
  it.each([
    { is_active: false, end_date: '2024-05-31' },
    { is_active: false, end_date: null },
    { is_active: true, end_date: '2024-05-31' },
  ])('refuses a period that is not active and open: %j', async (state) => {
    vi.mocked(BudgetPeriodsRepository.findById).mockResolvedValue({ ...active, ...state });
    await expect(closeBudgetPeriodUseCase('u1', 'p1', '2024-05-31')).rejects.toMatchObject({
      code: 'periodNotOpen',
    });
    expect(BudgetPeriodsRepository.update).not.toHaveBeenCalled();
    expect(getBudgetsByUserUseCase).not.toHaveBeenCalled();
  });

  it('snapshots an open period within the mutation transaction', async () => {
    const budget = {
      id: 'b1',
      description: 'Food',
      amount: 100,
      type: 'monthly',
      categories: ['food'],
      user_id: 'u1',
      group_id: 'g1',
      created_at: '',
      updated_at: '',
    } as Budget;
    vi.mocked(getBudgetsByUserUseCase).mockResolvedValue([budget]);
    vi.mocked(BudgetPeriodsRepository.update).mockResolvedValue({
      ...active,
      end_date: '2024-05-31',
      is_active: false,
    });
    const result = await closeBudgetPeriodUseCase('u1', 'p1', '2024-05-31');
    expect(result?.is_active).toBe(false);
    expect(BudgetPeriodsRepository.findById).toHaveBeenCalledWith('p1', {});
    expect(BudgetPeriodsRepository.update).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({
        end_date: '2024-05-31',
        is_active: false,
        snapshot_at: expect.any(Date),
        budgets_snapshot: [expect.objectContaining({ amount: 100 })],
      }),
      {}
    );
  });
});
