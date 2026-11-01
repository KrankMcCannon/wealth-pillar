import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildPortfolioHistory,
  buildPortfolioHistoryWithSnapshots,
  type SeriesIndex,
} from './investment.portfolio.logic';
import type { investments } from '@/server/db/schema';

vi.mock('@/server/repositories/portfolio-snapshot.repository', () => ({
  PortfolioSnapshotRepository: {
    findByUserIds: vi.fn(),
    upsertMany: vi.fn(),
  },
}));

import { PortfolioSnapshotRepository } from '@/server/repositories/portfolio-snapshot.repository';

type InvestmentRow = typeof investments.$inferSelect;

function row(overrides: Partial<InvestmentRow> = {}): InvestmentRow {
  return {
    id: 'inv-1',
    user_id: 'user-1',
    name: 'Test ETF',
    symbol: 'AAA',
    amount: '1000',
    shares_acquired: '2',
    currency: 'EUR',
    currency_rate: '1',
    tax_paid: '10',
    net_earn: '0',
    created_at: new Date('2024-01-01T12:00:00Z'),
    updated_at: new Date('2024-01-01T12:00:00Z'),
    ...overrides,
  };
}

describe('buildPortfolioHistoryWithSnapshots', () => {
  const seriesIndex: SeriesIndex = {
    AAA: [
      { date: '2024-01-01', close: 10 },
      { date: '2024-01-02', close: 12 },
    ],
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-03T18:00:00Z'));
    vi.mocked(PortfolioSnapshotRepository.findByUserIds).mockReset();
    vi.mocked(PortfolioSnapshotRepository.upsertMany).mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('sums users without writing snapshots and stays stable on a second load', async () => {
    let stored: Array<{ user_id: string; snapshot_date: string; value: string }> = [];
    vi.mocked(PortfolioSnapshotRepository.findByUserIds).mockImplementation(
      async () => stored as Awaited<ReturnType<typeof PortfolioSnapshotRepository.findByUserIds>>
    );
    vi.mocked(PortfolioSnapshotRepository.upsertMany).mockImplementation(async (rows) => {
      stored = [...stored, ...rows];
    });
    const rows = [row(), row({ id: 'inv-2', user_id: 'user-2', shares_acquired: '3' })];
    const first = await buildPortfolioHistoryWithSnapshots(['user-1', 'user-2'], rows, seriesIndex);
    expect(stored).toHaveLength(0);
    expect(PortfolioSnapshotRepository.upsertMany).not.toHaveBeenCalled();
    expect(first).toEqual(buildPortfolioHistory(rows, seriesIndex));
    expect(first.find((point) => point.date === '2024-01-02')?.value).toBe(60);
    expect(
      await buildPortfolioHistoryWithSnapshots(['user-1', 'user-2'], rows, seriesIndex)
    ).toEqual(first);
  });

  it('rebuilds past values after changing shares, moving the purchase date and removing holdings', async () => {
    vi.mocked(PortfolioSnapshotRepository.findByUserIds).mockResolvedValue([
      { user_id: 'user-1', snapshot_date: '2024-01-01', value: '20' },
      { user_id: 'user-1', snapshot_date: '2024-01-02', value: '24' },
    ] as never);
    const updated = row({ shares_acquired: '12' });
    const history = await buildPortfolioHistoryWithSnapshots(['user-1'], [updated], seriesIndex);
    expect(history.find((point) => point.date === '2024-01-01')?.value).toBe(120);
    expect(history.find((point) => point.date === '2024-01-02')?.value).toBe(144);
    const moved = { ...updated, created_at: new Date('2024-01-02T12:00:00Z') };
    const movedHistory = await buildPortfolioHistoryWithSnapshots(['user-1'], [moved], seriesIndex);
    expect(movedHistory.some((point) => point.date === '2024-01-01')).toBe(false);
    expect(await buildPortfolioHistoryWithSnapshots(['user-1'], [], seriesIndex)).toEqual([]);
    expect(PortfolioSnapshotRepository.upsertMany).not.toHaveBeenCalled();
  });

  it('does not persist unknown valuations or expose a partial grouped snapshot', async () => {
    const knownSnapshot = { user_id: 'user-1', snapshot_date: '2024-01-02', value: '24' };
    vi.mocked(PortfolioSnapshotRepository.findByUserIds).mockResolvedValue([
      knownSnapshot,
    ] as never);
    const result = await buildPortfolioHistoryWithSnapshots(
      ['user-1', 'user-2'],
      [row(), row({ id: 'missing', user_id: 'user-2', symbol: 'MISSING' })],
      seriesIndex
    );
    expect(result).toEqual([]);
    for (const [writes] of vi.mocked(PortfolioSnapshotRepository.upsertMany).mock.calls) {
      expect(writes.every((snapshot) => snapshot.user_id === 'user-1')).toBe(true);
    }
  });

  it('matches full rebuild for a single user when snapshots are empty', async () => {
    vi.mocked(PortfolioSnapshotRepository.findByUserIds)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const rows = [row()];
    const expected = buildPortfolioHistory(rows, seriesIndex);
    const actual = await buildPortfolioHistoryWithSnapshots(['user-1'], rows, seriesIndex);

    expect(actual.map((p) => p.date)).toEqual(expected.map((p) => p.date));
    for (const point of expected) {
      const match = actual.find((p) => p.date === point.date);
      expect(match?.value).toBeCloseTo(point.value, 2);
    }
  });
});
