import { financialDecimal } from '@/lib/utils/financial-decimal';
import { financialTransaction } from '@/server/repositories/db-executor';
import { portfolioMarketSymbols } from './currency-conversion';
import { financialDateKey } from '@/lib/utils/financial-date';
import { InvestmentRepository } from '@/server/repositories/investment.repository';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { PortfolioSnapshotRepository } from '@/server/repositories/portfolio-snapshot.repository';
import { lockPortfolio } from '@/server/repositories/portfolio-lock';
import {
  batchResultsToSeriesIndex,
  buildPortfolioHistoryExact,
} from './investment.portfolio.logic';

/** Daily, idempotent rebuild. The same lock prevents stale reinsertion after a backdated edit. */
export async function persistPortfolioSnapshotsUseCase(userId: string) {
  return financialTransaction(async (tx) => {
    await lockPortfolio(userId, tx);
    const lots = await InvestmentRepository.findByUser(userId, tx);
    if (!lots.length) return { saved: 0 };
    const symbols = portfolioMarketSymbols(lots);
    const quotes = await MarketDataRepository.findBySymbols(symbols, tx);
    const today = financialDateKey(new Date());
    const points = buildPortfolioHistoryExact(lots, batchResultsToSeriesIndex(quotes));
    // History omits days with even one missing price; today is still an open day.
    const rows = points
      .filter((point) => point.date < today)
      .map((point) => ({
        user_id: userId,
        snapshot_date: point.date,
        value: financialDecimal(point.value).toFixed(2),
      }));
    await PortfolioSnapshotRepository.upsertMany(rows, tx);
    return { saved: rows.length };
  });
}
