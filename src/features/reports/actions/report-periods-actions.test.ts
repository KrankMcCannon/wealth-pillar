import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadReportPeriodsAction } from './report-periods-actions';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import {
  getReportsContextUseCase,
  getReportsPeriodSummariesUseCase,
} from '@/server/use-cases/reports/reports.use-cases';
import type { User } from '@/lib/types';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn(), getGroupUsers: vi.fn() }));
vi.mock('@/server/use-cases/reports/reports.use-cases', () => ({
  getReportsContextUseCase: vi.fn(),
  getReportsPeriodSummariesUseCase: vi.fn(),
}));

const window = { start: '2026-10-01', end: '2026-10-30' };
const member = { id: 'u1', group_id: 'g1', role: 'member' } as User;

describe('loadReportPeriodsAction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(member);
    vi.mocked(getReportsContextUseCase).mockResolvedValue({
      periods: [],
      accounts: [],
      budgets: [],
      categories: [],
      users: [],
    });
    vi.mocked(getReportsPeriodSummariesUseCase).mockResolvedValue([
      { userId: 'u1' },
      { userId: 'u2' },
    ] as never);
  });
  it('denies anonymous callers before reading financial data', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    expect((await loadReportPeriodsAction(window)).data).toBeNull();
    expect(getReportsContextUseCase).not.toHaveBeenCalled();
  });
  it('rejects malformed and reversed ranges before reading financial data', async () => {
    for (const range of [
      { start: '2026-02-30', end: '2026-03-01' },
      { start: window.end, end: window.start },
    ])
      expect((await loadReportPeriodsAction(range)).data).toBeNull();
    expect(getReportsContextUseCase).not.toHaveBeenCalled();
  });
  it('derives the group from auth and returns only the member’s periods', async () => {
    const result = await loadReportPeriodsAction(window);
    expect(getGroupUsers).not.toHaveBeenCalled();
    expect(getReportsContextUseCase).toHaveBeenCalledWith('g1', ['u1']);
    expect(result.data).toEqual([{ userId: 'u1' }]);
  });
  it('allows admins to see their group, excluding unrelated users', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...member, role: 'admin' });
    vi.mocked(getGroupUsers).mockResolvedValue([
      member,
      { ...member, id: 'u2' },
      { ...member, id: 'u3', group_id: 'other' },
    ]);
    const result = await loadReportPeriodsAction(window);
    expect(getReportsContextUseCase).toHaveBeenCalledWith('g1', ['u1', 'u2']);
    expect(result.data).toHaveLength(2);
  });
});
