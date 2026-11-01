import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
vi.mock('@/server/repositories/accounts.repository', () => ({
  AccountsRepository: { findById: vi.fn() },
}));
vi.mock('@/server/repositories/users.repository', () => ({
  UsersRepository: { findByIds: vi.fn() },
}));
import {
  createRecurringSeriesAction,
  updateRecurringSeriesAction,
  deleteRecurringSeriesAction,
} from './recurring-actions';
import type { RecurringTransactionSeries, User } from '@/lib/types';

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/server/use-cases/recurring/recurring.use-cases', () => ({
  getSeriesByIdUseCase: vi.fn(),
  deleteSeriesUseCase: vi.fn(),
  createSeriesUseCase: vi.fn(),
  updateSeriesUseCase: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  getSeriesByIdUseCase,
  deleteSeriesUseCase,
  createSeriesUseCase,
  updateSeriesUseCase,
} from '@/server/use-cases/recurring/recurring.use-cases';

const member = {
  id: 'member-1',
  name: 'Member',
  email: 'member@example.com',
  role: 'member',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

const otherSeries = {
  id: 's2',
  description: 'Other',
  amount: 10,
  type: 'expense',
  category: 'food',
  frequency: 'monthly',
  user_ids: ['member-2'],
  account_id: 'a1',
  start_date: '2024-01-01',
  due_day: 1,
  is_active: true,
  total_executions: 0,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as RecurringTransactionSeries;

describe('deleteRecurringSeriesAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AccountsRepository.findById).mockResolvedValue({
      id: 'a1',
      group_id: 'g1',
      user_ids: [member.id],
    } as Awaited<ReturnType<typeof AccountsRepository.findById>>);
    vi.mocked(UsersRepository.findByIds).mockImplementation(
      async (ids) =>
        ids.map((id) => ({ id, group_id: 'g1' })) as Awaited<
          ReturnType<typeof UsersRepository.findByIds>
        >
    );
    vi.mocked(getCurrentUser).mockResolvedValue(member);
    vi.mocked(getSeriesByIdUseCase).mockResolvedValue(otherSeries);
  });

  it('denies member deleting another user series', async () => {
    const result = await deleteRecurringSeriesAction('s2');

    expect(result.data).toBeNull();
    expect(result.error).toBe('Permesso negato');
    expect(deleteSeriesUseCase).not.toHaveBeenCalled();
  });
});

describe('recurring definition guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AccountsRepository.findById).mockResolvedValue({
      id: 'a1',
      group_id: 'g1',
      user_ids: [member.id],
    } as Awaited<ReturnType<typeof AccountsRepository.findById>>);
    vi.mocked(UsersRepository.findByIds).mockImplementation(
      async (ids) =>
        ids.map((id) => ({ id, group_id: 'g1' })) as Awaited<
          ReturnType<typeof UsersRepository.findByIds>
        >
    );
    vi.mocked(getCurrentUser).mockResolvedValue(member);
    vi.mocked(getSeriesByIdUseCase).mockResolvedValue({ ...otherSeries, user_ids: [member.id] });
  });
  it('rejects transfers without destination before writing', async () => {
    const result = await createRecurringSeriesAction({
      ...otherSeries,
      user_ids: [member.id],
      start_date: '2024-01-01',
      end_date: null,
      type: 'transfer',
    });
    expect(result.error).toContain('conto destinazione');
    expect(createSeriesUseCase).not.toHaveBeenCalled();
  });
  it('rejects invalid weekdays and date ranges on update', async () => {
    expect(
      (await updateRecurringSeriesAction({ id: 's2', frequency: 'weekly', due_day: 31 })).error
    ).toContain('1 e 7');
    expect(
      (await updateRecurringSeriesAction({ id: 's2', end_date: '2023-12-31' })).error
    ).toContain('precedere');
    expect(updateSeriesUseCase).not.toHaveBeenCalled();
  });
  it('allows stopping a legacy transfer but prevents resuming it', async () => {
    const legacy = { ...otherSeries, user_ids: [member.id], type: 'transfer' as const };
    vi.mocked(getSeriesByIdUseCase).mockResolvedValue(legacy);
    vi.mocked(updateSeriesUseCase).mockResolvedValue({ ...legacy, is_active: false });
    expect((await updateRecurringSeriesAction({ id: 's2', is_active: false })).error).toBeNull();
    expect((await updateRecurringSeriesAction({ id: 's2', is_active: true })).error).toContain(
      'conto destinazione'
    );
    expect(updateSeriesUseCase).toHaveBeenCalledTimes(1);
  });
});
