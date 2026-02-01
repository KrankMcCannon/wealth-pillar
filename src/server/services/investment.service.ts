import { MarketDataService } from './market-data.service';
import type { Database } from '@/lib/types/database.types';
import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type {
  TimeSeriesEntry,
  MarketDataBatchResult,
} from '@/lib/types/market-data.types';
import {
  normalizeDateKey,
  buildSeriesIndex,
  getCloseForDate,
} from '@/lib/types/market-data.types';

type Investment = Database['public']['Tables']['investments']['Row'];
type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];

/**
 * Enriched investment with calculated values
 */
interface EnrichedInvestment extends Investment {
  currentPrice: number;
  currentValue: number;
  initialValue: number;
  totalPaid: number;
  totalGain: number;
}

/**
 * Portfolio summary
 */
export interface PortfolioSummary {
  totalInvested: number;
  totalTaxPaid: number;
  totalPaid: number;
  totalCurrentValue: number;
  totalInitialValue: number;
  totalReturn: number;
  totalReturnPercent: number;
}

/**
 * Full portfolio result
 */
export interface PortfolioResult {
  investments: EnrichedInvestment[];
  summary: PortfolioSummary;
}

/**
 * Historical portfolio data point
 */
export interface HistoricalDataPoint {
  date: string;
  value: number;
}

export class InvestmentService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static readonly getByUserDb = cache(async (userId: string): Promise<Investment[]> => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Investment[];
  });

  private static async createDb(data: InvestmentInsert): Promise<Investment> {
    const { data: created, error } = await supabase
      .from('investments')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as Investment;
  }

  private static async deleteDb(id: string): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Investment;
  }

  private static getUniqueSymbols(investments: Investment[]): string[] {
    return [...new Set(investments.map((inv) => inv.symbol).filter(Boolean))] as string[];
  }

  private static async getMarketDataForInvestments(
    investments: Investment[]
  ): Promise<MarketDataBatchResult[]> {
    const symbols = this.getUniqueSymbols(investments);
    if (symbols.length === 0) return [];
    return MarketDataService.getBatchMarketData(symbols);
  }

  // ================== SERVICE LAYER ==================
  /**
   * Get user portfolio with real-time values
   */
  static async getPortfolio(userId: string): Promise<PortfolioResult> {
    const investments = await this.getByUserDb(userId);

    const symbols = this.getUniqueSymbols(investments);
    const seriesRows = await MarketDataService.getCachedSeriesBySymbols(symbols);
    const seriesIndex = buildSeriesIndex(seriesRows);

    let totalInvested = 0;
    let totalTaxPaid = 0;
    let totalCurrentValue = 0;
    let totalInitialValue = 0;

    const enrichedInvestments: EnrichedInvestment[] = investments.map((inv) => {
      const symbolKey = inv.symbol?.toUpperCase();
      const currencyRate = Number(inv.currency_rate) || 1;
      const shares = Number(inv.shares_acquired);

      // 1. Current (Live) Value: No date passed = latest price
      const livePrice = symbolKey ? getCloseForDate(seriesIndex[symbolKey]) : 0;
      const currentValue = livePrice * currencyRate * shares;

      // 2. Initial (Historical) Value: Price at creation date
      const creationDateKey = normalizeDateKey(inv.created_at);
      const initialPrice = symbolKey ? getCloseForDate(seriesIndex[symbolKey], creationDateKey) : 0;
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
        amount: investmentAmount,
        shares_acquired: shares,
        currency_rate: currencyRate,
        tax_paid: taxPaid,
        net_earn: Number(inv.net_earn),
        created_at: inv.created_at,
        currentPrice: livePrice * currencyRate,
        currentValue,
        initialValue,
        currency: inv.currency,
        totalPaid,
        totalGain,
      };
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
        totalReturnPercent
      }
    };
  }

  /**
   * Create a new investment
   */
  static async addInvestment(data: InvestmentInsert): Promise<Investment> {
    return this.createDb(data);
  }

  /**
   * Delete an investment
   */
  static async deleteInvestment(id: string): Promise<Investment> {
    return this.deleteDb(id);
  }

  /**
   * Get historical portfolio performance
   */
  static async getHistoricalPortfolio(userId: string): Promise<HistoricalDataPoint[]> {
    const investments = await this.getByUserDb(userId);
    if (!investments || investments.length === 0) return [];

    const marketDataList = await this.getMarketDataForInvestments(investments);

    // Create a map of Symbol -> { DateString -> ClosePrice }
    const historyMap: Record<string, Record<string, number>> = {};

    marketDataList.forEach((item) => {
      if (item.data && Array.isArray(item.data)) {
        historyMap[item.symbol] = {};
        item.data.forEach((day: TimeSeriesEntry) => {
          const rawDate = day?.datetime ?? day?.time ?? day?.date;
          if (!rawDate) return;
          const dateKey = String(rawDate).split(' ')[0];
          historyMap[item.symbol][dateKey] = Number.parseFloat(String(day.close));
        });
      }
    });

    // Determine date range (from earliest investment to now)
    const earliestDate = investments.reduce((min: Date, inv) => {
      const d = new Date(inv.created_at || new Date());
      return d < min ? d : min;
    }, new Date());

    const now = new Date();
    const data: HistoricalDataPoint[] = [];

    // Generate daily points
    for (let d = new Date(earliestDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let totalValue = 0;

      investments.forEach((inv) => {
        const invDate = new Date(inv.created_at || new Date());

        if (invDate <= d) {
          // Gap filling: look back up to 3 days using helper
          const price = this.findPriceWithGapFilling(historyMap, inv.symbol, d);

          if (price) {
            const currencyRate = Number(inv.currency_rate) || 1;
            totalValue += price * Number(inv.shares_acquired) * currencyRate;
          }
        }
      });

      if (totalValue > 0) {
        data.push({
          date: dateStr,
          value: totalValue
        });
      }
    }

    return data;
  }

  /**
   * Helper to find price for a date, looking back up to 3 days if missing (gap filling)
   */
  private static findPriceWithGapFilling(
    historyMap: Record<string, Record<string, number>>,
    symbol: string,
    targetDate: Date
  ): number | undefined {
    const dateStr = targetDate.toISOString().split('T')[0];
    let price = historyMap[symbol]?.[dateStr];

    if (price) return price;

    // Look back up to 3 days
    for (let i = 1; i <= 3; i++) {
      const pastDate = new Date(targetDate);
      pastDate.setDate(targetDate.getDate() - i);
      const pastDateStr = pastDate.toISOString().split('T')[0];
      price = historyMap[symbol]?.[pastDateStr];
      if (price) return price;
    }

    return undefined;
  }
}
