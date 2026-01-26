import { MarketDataService } from './market-data.service';
import type { Database } from '@/lib/types/database.types';
import { supabase } from '@/server/db/supabase';
import { cache } from 'react';

type Investment = Database['public']['Tables']['investments']['Row'];
type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];

interface MarketDataBatchResult {
  symbol: string;
  data: any; // Stored as Json in DB, typically TimeSeriesData[]
}

export class InvestmentService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static getByUserDb = cache(async (userId: string) => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });

  private static async createDb(data: InvestmentInsert) {
    const { data: created, error } = await supabase
      .from('investments')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  private static async deleteDb(id: string) {
    const { data, error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  private static getUniqueSymbols(investments: Investment[]): string[] {
    return [...new Set(investments.map((inv) => inv.symbol).filter(Boolean))] as string[];
  }

  private static getLatestCloseFromSeries(data: any): number {
    if (!Array.isArray(data) || data.length === 0) return 0;

    const normalizeDateKey = (entry: any): string => {
      const raw = entry?.datetime ?? entry?.time ?? entry?.date ?? '';
      return String(raw).split(' ')[0].split('T')[0];
    };

    const latest = data.reduce((acc, current) => {
      return normalizeDateKey(current) > normalizeDateKey(acc) ? current : acc;
    }, data[0]);

    const closeValue = latest?.close;
    const parsed = Number.parseFloat(closeValue);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private static normalizeDateKey(value: string | Date | null | undefined): string {
    if (!value) return '';
    const raw = value instanceof Date ? value.toISOString() : String(value);
    return raw.split(' ')[0].split('T')[0];
  }

  private static buildSeriesIndex(
    seriesRows: Array<{ symbol: string; data: any }>
  ): Record<string, Array<{ date: string; close: number }>> {
    const index: Record<string, Array<{ date: string; close: number }>> = {};

    seriesRows.forEach((row) => {
      const symbol = String(row?.symbol || '').toUpperCase();
      const data = Array.isArray(row?.data) ? row.data : [];
      if (!symbol || data.length === 0) return;

      const points = data
        .map((entry: any) => {
          const date = this.normalizeDateKey(entry?.datetime ?? entry?.time ?? entry?.date);
          const close = Number.parseFloat(entry?.close);
          return {
            date,
            close: Number.isFinite(close) ? close : 0,
          };
        })
        .filter((point) => point.date && point.close > 0)
        .sort((a, b) => a.date.localeCompare(b.date));

      if (points.length > 0) {
        index[symbol] = points;
      }
    });

    return index;
  }

  private static getCloseForDate(
    points: Array<{ date: string; close: number }> | undefined,
    targetDateKey?: string
  ): number {
    if (!points || points.length === 0) return 0;
    if (!targetDateKey) return points[points.length - 1]?.close ?? 0;

    let found = false;
    let close = 0;

    for (const point of points) {
      if (point.date <= targetDateKey) {
        close = point.close;
        found = true;
      } else {
        break;
      }
    }

    if (found) return close;
    return points[0]?.close ?? 0;
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
  static async getPortfolio(userId: string) {
    const investments = await this.getByUserDb(userId);

    const symbols = this.getUniqueSymbols(investments as Investment[]);
    const seriesRows = await MarketDataService.getCachedSeriesBySymbols(symbols);
    const seriesIndex = this.buildSeriesIndex(seriesRows);

    let totalInvested = 0;
    let totalTaxPaid = 0;
    let totalCurrentValue = 0;
    let totalInitialValue = 0;

    const enrichedInvestments = (investments as Investment[]).map((inv) => {
      const symbolKey = inv.symbol?.toUpperCase();
      const currencyRate = Number(inv.currency_rate) || 1;
      const shares = Number(inv.shares_acquired);

      // 1. Current (Live) Value: No date passed = latest price
      const livePrice = symbolKey ? this.getCloseForDate(seriesIndex[symbolKey], undefined) : 0;
      const currentValue = livePrice * currencyRate * shares;

      // 2. Initial (Historical) Value: Price at creation date
      const creationDateKey = this.normalizeDateKey(inv.created_at);
      const initialPrice = symbolKey ? this.getCloseForDate(seriesIndex[symbolKey], creationDateKey) : 0;
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
  static async addInvestment(data: InvestmentInsert) {
    return this.createDb(data);
  }

  /**
   * Delete an investment
   */
  static async deleteInvestment(id: string) {
    return this.deleteDb(id);
  }

  /**
   * Get historical portfolio performance
   */
  static async getHistoricalPortfolio(userId: string) {
    const investments = await this.getByUserDb(userId);
    if (!investments || investments.length === 0) return [];

    const marketDataList = await this.getMarketDataForInvestments(investments as Investment[]);

    // Create a map of Symbol -> { DateString -> ClosePrice }
    const historyMap: Record<string, Record<string, number>> = {};

    marketDataList.forEach((item: MarketDataBatchResult) => {
      if (item.data && Array.isArray(item.data)) {
        historyMap[item.symbol] = {};
        item.data.forEach((day: any) => {
          const rawDate = day?.datetime ?? day?.time ?? day?.date;
          if (!rawDate) return;
          const dateKey = String(rawDate).split(' ')[0];
          historyMap[item.symbol][dateKey] = parseFloat(day.close);
        });
      }
    });

    // Determine date range (from earliest investment to now)
    const earliestDate = (investments as Investment[]).reduce((min: Date, inv) => {
      const d = new Date(inv.created_at || new Date());
      return d < min ? d : min;
    }, new Date());

    const now = new Date();
    const data = [];

    // Generate daily points
    for (let d = new Date(earliestDate); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let totalValue = 0;

      (investments as Investment[]).forEach((inv) => {
        const invDate = new Date(inv.created_at || new Date());

        if (invDate <= d) {
          // Get price for this date
          let price = historyMap[inv.symbol]?.[dateStr];

          // Gap filling: look back up to 3 days
          if (!price) {
            const yesterday = new Date(d);
            yesterday.setDate(d.getDate() - 1);
            let yStr = yesterday.toISOString().split('T')[0];
            price = historyMap[inv.symbol]?.[yStr];

            if (!price) {
              const twoDaysAgo = new Date(d);
              twoDaysAgo.setDate(d.getDate() - 2);
              yStr = twoDaysAgo.toISOString().split('T')[0];
              price = historyMap[inv.symbol]?.[yStr];

              if (!price) {
                const threeDaysAgo = new Date(d);
                threeDaysAgo.setDate(d.getDate() - 3);
                yStr = threeDaysAgo.toISOString().split('T')[0];
                price = historyMap[inv.symbol]?.[yStr];
              }
            }
          }

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
}
