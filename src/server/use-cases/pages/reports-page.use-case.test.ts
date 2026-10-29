import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('../reports/reports.use-cases', () => ({
  getReportsContextUseCase: vi.fn(),
  getReportsTransactionsUseCase: vi.fn(),
  getReportsPeriodSummariesUseCase: vi.fn(async () => []),
  resolveYtdBudgetStart: vi.fn(() => null),
}));

import {
  getReportsContextUseCase,
  getReportsTransactionsUseCase,
  getReportsPeriodSummariesUseCase,
} from '../reports/reports.use-cases';
import { getReportsPageDataUseCase } from './reports-page.use-case';

const admin = {
  id: 'u1',
  name: 'Alex',
  email: 'alex@example.com',
  role: 'admin',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as never;

describe('getReportsPageDataUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getReportsContextUseCase).mockResolvedValue({
      accounts: [],
      periods: [],
      categories: [],
      users: [admin],
      budgets: [],
    });
    vi.mocked(getReportsTransactionsUseCase).mockResolvedValue({
      transactions: [],
      hasMore: false,
    });
  });

  it('fetches transactions for the union of current and comparison windows', async () => {
    await getReportsPageDataUseCase('g1', ['u1'], admin, { preset: 'yearly' });

    expect(getReportsTransactionsUseCase).toHaveBeenCalledTimes(1);
    const [, window] = vi.mocked(getReportsTransactionsUseCase).mock.calls[0]!;
    expect(window.startDate).toBeInstanceOf(Date);
    expect(window.endDate).toBeInstanceOf(Date);
    expect(window.startDate.getTime()).toBeLessThan(window.endDate.getTime());
  });

  it('sets transactionsTruncated when the fetch overflowed', async () => {
    vi.mocked(getReportsTransactionsUseCase).mockResolvedValue({
      transactions: [],
      hasMore: true,
    });

    const result = await getReportsPageDataUseCase('g1', ['u1'], admin, { preset: 'monthly' });
    expect(result.transactionsTruncated).toBe(true);
  });

  it('loads complete budget summaries separately from the report transaction list', async () => {
    await getReportsPageDataUseCase('g1', ['u1'], admin, {
      preset: 'custom',
      customStart: '2024-05-20',
      customEnd: '2024-05-25',
    });
    expect(getReportsPeriodSummariesUseCase).toHaveBeenCalledWith('g1', [], [], [], {
      start: expect.any(Date),
      end: expect.any(Date),
    });
    const reportWindow = vi.mocked(getReportsPeriodSummariesUseCase).mock.calls[0]![4];
    const comparisonUnion = vi.mocked(getReportsTransactionsUseCase).mock.calls[0]![1];
    expect(comparisonUnion.startDate.getTime()).toBeLessThan(reportWindow.start.getTime());
  });
});
