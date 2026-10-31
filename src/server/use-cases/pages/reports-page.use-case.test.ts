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
  resolveYtdBudgetStart,
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

  it('does not load hidden budget summaries on the main report path', async () => {
    const result = await getReportsPageDataUseCase('g1', ['u1'], admin, {
      preset: 'custom',
      customStart: '2024-05-20',
      customEnd: '2024-05-25',
    });
    expect(getReportsPeriodSummariesUseCase).not.toHaveBeenCalled();
    expect(result.periods).toEqual([]);
    expect(result.currentWindow).toEqual({ start: '2024-05-20', end: '2024-05-25' });
    expect(result.comparisonWindow).toEqual({ start: '2024-05-14', end: '2024-05-19' });
  });

  it('returns the actual budget-anchored YTD bounds for drill-down links', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 30, 12));
    vi.mocked(resolveYtdBudgetStart).mockReturnValueOnce(new Date(2025, 11, 15));
    try {
      const result = await getReportsPageDataUseCase('g1', ['u1'], admin, { preset: 'ytd' });
      expect(result.currentWindow).toEqual({ start: '2025-12-15', end: '2026-10-30' });
      expect(result.comparisonWindow).toEqual({ start: '2024-12-15', end: '2025-10-30' });
    } finally {
      vi.useRealTimers();
    }
  });
});
