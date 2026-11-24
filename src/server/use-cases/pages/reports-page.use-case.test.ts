import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock('../reports/reports.use-cases', () => ({
  getReportsPageContextUseCase: vi.fn(),
  getReportsTransactionsUseCase: vi.fn(),
  getReportsPeriodSummariesUseCase: vi.fn(async () => []),
  resolveYtdBudgetStart: vi.fn(() => null),
}));

import {
  getReportsPageContextUseCase,
  getReportsTransactionsUseCase,
  getReportsPeriodSummariesUseCase,
  resolveYtdBudgetStart,
} from '../reports/reports.use-cases';
import { getReportsPageDataUseCase } from './reports-page.use-case';
import * as reportLogic from '../reports/report.logic';
import * as ledger from '@/server/ledger';

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
    vi.mocked(getReportsPageContextUseCase).mockResolvedValue({
      accounts: [],
      periods: [],
      categories: [],
      users: [admin],
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

  it('computes member flows once for all member sections', async () => {
    const secondMember = {
      id: 'u2',
      name: 'Sam',
      email: 'sam@example.com',
      role: 'member',
      group_id: 'g1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    } as never;
    vi.mocked(getReportsPageContextUseCase).mockResolvedValue({
      accounts: [],
      periods: [],
      categories: [],
      users: [admin, secondMember],
    });
    const computeFlows = vi.spyOn(reportLogic, 'computeUserFlows');

    const result = await getReportsPageDataUseCase('g1', ['u1', 'u2'], admin, {
      preset: 'monthly',
    });

    expect(Object.keys(result.sections)).toEqual(['all', 'u1', 'u2']);
    expect(computeFlows).toHaveBeenCalledTimes(1);
  });

  it('classifies each fetched ledger row once across all report sections and windows', async () => {
    const secondMember = {
      id: 'u2',
      name: 'Sam',
      email: 'sam@example.com',
      role: 'member',
      group_id: 'g1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    } as never;
    vi.mocked(getReportsPageContextUseCase).mockResolvedValue({
      accounts: [
        {
          id: 'a1',
          name: 'Cash',
          type: 'cash',
          user_ids: ['u1'],
          group_id: 'g1',
          balance: 100,
        } as never,
      ],
      periods: [],
      categories: [],
      users: [admin, secondMember],
    });
    const transactions = ['2024-06-10', '2024-05-10'].map(
      (date, index) =>
        ({
          id: `t${index}`,
          description: '',
          amount: '2.00',
          type: 'expense',
          category: 'food',
          date,
          user_id: 'u1',
          account_id: 'a1',
          to_account_id: null,
          frequency: 'once',
          recurring_series_id: null,
          group_id: 'g1',
          created_at: '',
          updated_at: '',
        }) as never
    );
    vi.mocked(getReportsTransactionsUseCase).mockResolvedValue({
      transactions,
      hasMore: false,
    });
    const classify = vi.spyOn(ledger, 'classifyMovement');

    await getReportsPageDataUseCase('g1', ['u1', 'u2'], admin, { preset: 'monthly' });

    expect(classify).toHaveBeenCalledTimes(transactions.length);
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
