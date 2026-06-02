import { describe, it, expect, vi, beforeEach } from 'vitest';
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
  } as InvestmentRow;
}

describe('buildPortfolioHistoryWithSnapshots', () => {
  const seriesIndex: SeriesIndex = {
    AAA: [
      { date: '2024-01-01', close: 10 },
      { date: '2024-01-02', close: 12 },
    ],
  };

  beforeEach(() => {
    vi.mocked(PortfolioSnapshotRepository.findByUserIds).mockReset();
    vi.mocked(PortfolioSnapshotRepository.upsertMany).mockReset();
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
