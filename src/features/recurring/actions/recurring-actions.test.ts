import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteRecurringSeriesAction } from './recurring-actions';
import type { RecurringTransactionSeries, User } from '@/lib/types';

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/server/use-cases/recurring/recurring.use-cases', () => ({
  getSeriesByIdUseCase: vi.fn(),
  deleteSeriesUseCase: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  getSeriesByIdUseCase,
  deleteSeriesUseCase,
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
