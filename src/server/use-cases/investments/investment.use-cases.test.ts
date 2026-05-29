import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInvestmentsOverviewUseCase } from './investment.use-cases';
import { InvestmentRepository } from '@/server/repositories/investment.repository';
import { getBatchMarketDataUseCase } from '../market-data/market-data.use-cases';

vi.mock('@/server/repositories/investment.repository', () => ({
  InvestmentRepository: {
    findByUser: vi.fn(),
    findByUsers: vi.fn(),
  },
}));

vi.mock('../market-data/market-data.use-cases', () => ({
  getBatchMarketDataUseCase: vi.fn(),
}));

describe('getInvestmentsOverviewUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    ] as unknown as Awaited<ReturnType<typeof InvestmentRepository.findByUser>>);

    vi.mocked(getBatchMarketDataUseCase).mockResolvedValue([
      {
        symbol: 'AAA',
        data: [{ datetime: '2024-01-01', close: 10 }],
      },
    ]);

    const result = await getInvestmentsOverviewUseCase('user-1');

    expect(InvestmentRepository.findByUser).toHaveBeenCalledTimes(1);
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
