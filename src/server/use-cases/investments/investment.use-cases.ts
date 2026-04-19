import { InvestmentRepository } from '@/server/repositories/investment.repository';
import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { investments } from '@/server/db/schema';
import {
  TimeSeriesEntry,
  buildSeriesIndex,
  getCloseForDate,
  normalizeDateKey,
} from '@/lib/types/market-data.types';
import type { Database } from '@/lib/types/database.types';
import { getMarketDataUseCase } from '../market-data/market-data.use-cases';

type Investment = typeof investments.$inferSelect;
type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];

export interface EnrichedInvestment extends Omit<
  Investment,
  'amount' | 'shares_acquired' | 'currency_rate' | 'tax_paid' | 'net_earn'
> {
  amount: number;
  shares_acquired: number;
  currency_rate: number;
  tax_paid: number;
  net_earn: number;
  currentPrice: number;
  currentValue: number;
  initialValue: number;
  totalPaid: number;
  totalGain: number;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalTaxPaid: number;
  totalPaid: number;
  totalCurrentValue: number;
  totalInitialValue: number;
  totalReturn: number;
  totalReturnPercent: number;
}

export interface PortfolioResult {
  investments: EnrichedInvestment[];
  summary: PortfolioSummary;
}

export async function getPortfolioUseCase(userId: string): Promise<PortfolioResult> {
  const investments = await InvestmentRepository.findByUser(userId);
  const symbols = [...new Set(investments.map((inv) => inv.symbol.toUpperCase()))];

  const seriesRows = await MarketDataRepository.findBySymbols(symbols);
  const seriesIndex = buildSeriesIndex(seriesRows);

  let totalInvested = 0;
  let totalTaxPaid = 0;
  let totalCurrentValue = 0;
  let totalInitialValue = 0;

  const enrichedInvestments: EnrichedInvestment[] = investments.map((inv) => {
    const symbolKey = inv.symbol.toUpperCase();
    const currencyRate = Number(inv.currency_rate) || 1;
    const shares = Number(inv.shares_acquired);

    const symbolData = seriesIndex[symbolKey];
    const livePrice = symbolData ? getCloseForDate(symbolData) : 0;
    const currentValue = livePrice * currencyRate * shares;

    const creationDateKey = normalizeDateKey(inv.created_at || new Date());
    const initialPrice = symbolData ? getCloseForDate(symbolData, creationDateKey) : 0;
    const initialValue = initialPrice * currencyRate * shares;

    const investmentAmount = Number(inv.amount);
    const taxPaid = Number(inv.tax_paid) || 0;
    const totalPaid = investmentAmount + taxPaid;
    const totalGain = currentValue - totalPaid;

    totalInvested += investmentAmount;
    totalTaxPaid += taxPaid;
    totalCurrentValue += currentValue;
    totalInitialValue += initialValue;

    return {
      ...inv,
      amount: Number(inv.amount),
      shares_acquired: Number(inv.shares_acquired),
      currency_rate: Number(inv.currency_rate),
      tax_paid: Number(inv.tax_paid),
      net_earn: Number(inv.net_earn),
      currentPrice: livePrice * currencyRate,
      currentValue,
      initialValue,
      totalPaid,
      totalGain,
    } as EnrichedInvestment;
  });

  const totalPaid = totalInvested + totalTaxPaid;
  const totalReturn = totalCurrentValue - totalPaid;
  const totalReturnPercent = totalPaid > 0 ? (totalReturn / totalPaid) * 100 : 0;

  return {
    investments: enrichedInvestments,
    summary: {
      totalInvested,
      totalTaxPaid,
      totalPaid,
      totalCurrentValue,
      totalInitialValue,
      totalReturn,
      totalReturnPercent,
    },
  };
}

export async function addInvestmentUseCase(data: InvestmentInsert) {
  const depositData = {
    ...data,
    amount: data.amount?.toString(),
    shares_acquired: data.shares_acquired?.toString(),
    currency_rate: data.currency_rate?.toString(),
    tax_paid: data.tax_paid?.toString(),
    net_earn: data.net_earn?.toString(),
  } as typeof investments.$inferInsert;

  return await InvestmentRepository.create(depositData);
}

export async function deleteInvestmentUseCase(id: string) {
  return await InvestmentRepository.delete(id);
}

export async function updateInvestmentUseCase(
  id: string,
  userId: string,
  data: Partial<InvestmentInsert>
) {
  const existing = await InvestmentRepository.findByIdAndUser(id, userId);
  if (!existing) throw new Error('Investment not found');

  const updateData = {
    ...data,
    amount: data.amount?.toString(),
    shares_acquired: data.shares_acquired?.toString(),
    currency_rate: data.currency_rate?.toString(),
    tax_paid: data.tax_paid?.toString(),
    net_earn: data.net_earn?.toString(),
  } as Partial<typeof investments.$inferInsert>;

  return await InvestmentRepository.update(id, updateData);
}

export async function getInvestmentByIdForUserUseCase(id: string, userId: string) {
  return await InvestmentRepository.findByIdAndUser(id, userId);
}

export async function getHistoricalPortfolioUseCase(userId: string) {
  const investments = await InvestmentRepository.findByUser(userId);
  if (investments.length === 0) return [];

  const symbols = [...new Set(investments.map((inv) => inv.symbol.toUpperCase()))];
  const marketDataList = await Promise.all(
    symbols.map(async (sym) => ({
      symbol: sym,
      data: await getMarketDataUseCase(sym),
    }))
  );

  const historyMap: Record<string, Record<string, number>> = {};
  marketDataList.forEach((item) => {
    const symbol = item.symbol;
    const symbolMap: Record<string, number> = (historyMap[symbol] = {});
    item.data.forEach((day: TimeSeriesEntry) => {
      const rawDate = day.datetime || day.time || day.date;
      if (!rawDate) return;
      const dateKey = String(rawDate).split(' ')[0];
      if (dateKey) {
        symbolMap[dateKey] = Number(day.close);
      }
    });
  });

  const earliestDate = investments.reduce((min: Date, inv) => {
    const d = new Date(inv.created_at || new Date());
    return d < min ? d : min;
  }, new Date());

  const endDate = new Date();
  const portfolioHistory: { date: string; value: number }[] = [];
  const currentDate = new Date(earliestDate);

  while (currentDate.getTime() <= endDate.getTime()) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dateStr) {
      let totalValue = 0;

      investments.forEach((inv) => {
        const invDate = new Date(inv.created_at || new Date());
        if (invDate <= currentDate) {
          const price = findPriceWithGapFilling(historyMap, inv.symbol.toUpperCase(), currentDate);
          if (price) {
            totalValue += price * Number(inv.shares_acquired) * (Number(inv.currency_rate) || 1);
          }
        }
      });

      if (totalValue > 0) {
        portfolioHistory.push({ date: dateStr, value: totalValue });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return portfolioHistory;
}

function findPriceWithGapFilling(
  historyMap: Record<string, Record<string, number>>,
  symbol: string,
  targetDate: Date
): number | undefined {
  const parts = targetDate.toISOString().split('T');
  const dateStr = parts[0];
  if (!dateStr) return undefined;

  const symbolHistory = historyMap[symbol];
  if (!symbolHistory) return undefined;

  let price = symbolHistory[dateStr];
  if (price !== undefined) return price;

  for (let i = 1; i <= 3; i++) {
    const pastDate = new Date(targetDate);
    pastDate.setDate(targetDate.getDate() - i);
    const pastParts = pastDate.toISOString().split('T');
    const pastDateStr = pastParts[0];
    if (pastDateStr) {
      price = symbolHistory[pastDateStr];
      if (price !== undefined) return price;
    }
  }
  return undefined;
}
