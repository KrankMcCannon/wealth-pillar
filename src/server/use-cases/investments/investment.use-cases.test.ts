import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getInvestmentsOverviewUseCase,
  resolveInvestmentsTargetUserIds,
  updateInvestmentUseCase,
  addInvestmentUseCase,
} from './investment.use-cases';
import { InvestmentRepository } from '@/server/repositories/investment.repository';
import { getBatchMarketDataUseCase } from '../market-data/market-data.use-cases';

vi.mock('@/server/repositories/investment.repository', () => ({
  InvestmentRepository: {
    findByUser: vi.fn(),
    findByIdAndUser: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
    findByUsers: vi.fn(),
    getTotalsByUsers: vi.fn(),
  },
}));

vi.mock('@/server/repositories/portfolio-snapshot.repository', () => ({
  PortfolioSnapshotRepository: {
    findByUserIds: vi.fn().mockResolvedValue([]),
    upsertMany: vi.fn(),
  },
}));

vi.mock('../market-data/market-data.use-cases', () => ({
  getBatchMarketDataUseCase: vi.fn(),
}));

describe('resolveInvestmentsTargetUserIds', () => {
  const groupUserIds = ['user-a', 'user-b'];

  it('scopes members to their own id', () => {
    expect(
      resolveInvestmentsTargetUserIds({ id: 'user-a', role: 'member' }, groupUserIds, 'all')
    ).toEqual(['user-a']);
  });

  it('allows admins to filter to one group member', () => {
    expect(
      resolveInvestmentsTargetUserIds({ id: 'admin-1', role: 'admin' }, groupUserIds, 'user-b')
    ).toEqual(['user-b']);
  });

  it('returns all group users for admin all scope', () => {
    expect(
      resolveInvestmentsTargetUserIds({ id: 'admin-1', role: 'admin' }, groupUserIds, 'all')
    ).toEqual(groupUserIds);
  });
});

describe('getInvestmentsOverviewUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(InvestmentRepository.getTotalsByUsers).mockResolvedValue({
      totalInvested: 100,
      totalTaxPaid: 0,
      count: 1,
    });
  });

  it('deduplicates repository and market fetches', async () => {
    vi.mocked(InvestmentRepository.findByUser).mockResolvedValue([
      {
        id: 'inv-1',
        user_id: 'user-1',
        name: 'ETF',
        symbol: 'AAA',
        amount: '100',
        shares_acquired: '1',
        currency: 'EUR',
        currency_rate: '1',
        tax_paid: '0',
        net_earn: '0',
        created_at: new Date('2024-01-01'),
        updated_at: new Date('2024-01-01'),
      },
    ]);

    vi.mocked(getBatchMarketDataUseCase).mockResolvedValue([
      {
        symbol: 'AAA',
        data: [{ datetime: '2024-01-01', close: 10 }],
        lastUpdated: '2024-01-01T12:00:00.000Z',
      },
    ]);

    const result = await getInvestmentsOverviewUseCase('user-1');

    expect(InvestmentRepository.findByUser).toHaveBeenCalledTimes(1);
    expect(InvestmentRepository.getTotalsByUsers).toHaveBeenCalledWith(['user-1']);
    expect(getBatchMarketDataUseCase).toHaveBeenCalledTimes(1);
    expect(getBatchMarketDataUseCase).toHaveBeenCalledWith(['AAA']);
    expect(result.investments).toHaveLength(1);
    expect(result.portfolioHistory.length).toBeGreaterThan(0);
  });

  it('returns empty overview without market fetch when user has no investments', async () => {
    vi.mocked(InvestmentRepository.findByUser).mockResolvedValue([]);

    const result = await getInvestmentsOverviewUseCase('user-1');

    expect(getBatchMarketDataUseCase).not.toHaveBeenCalled();
    expect(result.portfolioHistory).toEqual([]);
    expect(result.investments).toEqual([]);
  });

  it('aggregates across multiple users via findByUsers', async () => {
    vi.mocked(InvestmentRepository.findByUsers).mockResolvedValue([]);

    await getInvestmentsOverviewUseCase(['user-1', 'user-2']);

    expect(InvestmentRepository.findByUsers).toHaveBeenCalledTimes(1);
    expect(InvestmentRepository.findByUsers).toHaveBeenCalledWith(['user-1', 'user-2']);
    expect(InvestmentRepository.findByUser).not.toHaveBeenCalled();
  });
});

describe('investment purchase rates', () => {
  beforeEach(() => {
    vi.mocked(InvestmentRepository.findByIdAndUser).mockResolvedValue({
      currency: 'USD',
      currency_rate: '0.86',
    } as never);
  });
  it('preserves the stored rate on an unrelated partial update', async () => {
    await updateInvestmentUseCase('lot', 'owner', { name: 'Renamed' });
    expect(InvestmentRepository.update).toHaveBeenCalledWith(
      'lot',
      expect.objectContaining({ currency_rate: '0.86' }),
      'owner'
    );
  });
  it('rejects USD creation and currency changes without an explicit positive rate', async () => {
    await expect(addInvestmentUseCase({ currency: 'USD' } as never)).rejects.toThrow(
      'INVALID_CURRENCY_RATE'
    );
    vi.mocked(InvestmentRepository.findByIdAndUser).mockResolvedValue({
      currency: 'EUR',
      currency_rate: '1',
    } as never);
    await expect(updateInvestmentUseCase('lot', 'owner', { currency: 'USD' })).rejects.toThrow(
      'INVALID_CURRENCY_RATE'
    );
    for (const currencyRate of [0, -1, NaN, Infinity]) {
      await expect(
        updateInvestmentUseCase('lot', 'owner', { currency: 'USD', currency_rate: currencyRate })
      ).rejects.toThrow('INVALID_CURRENCY_RATE');
    }
  });
});
