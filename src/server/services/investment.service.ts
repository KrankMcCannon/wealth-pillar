import { MarketDataService } from './market-data-service';
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

  // ================== SERVICE LAYER ==================
  /**
   * Get user portfolio with real-time values
   */
  static async getPortfolio(userId: string) {
    const investments = await this.getByUserDb(userId);

    const symbols = [...new Set((investments as Investment[]).map((inv) => inv.symbol).filter(Boolean))] as string[];
    // Fetch time series data from cache/API
    const marketDataList = await MarketDataService.getBatchMarketData(symbols);

    // Map symbol -> latest price
    const priceMap: Record<string, number> = {};
    marketDataList.forEach((item: MarketDataBatchResult) => {
      if (item.data && Array.isArray(item.data) && item.data.length > 0) {
        priceMap[item.symbol] = parseFloat(item.data[0].close);
      }
    });

    let totalInvested = 0;
    let totalCurrentValue = 0;

    const enrichedInvestments = (investments as Investment[]).map((inv) => {
      let currentPrice = 0;
      let currentValue = 0;

      const price = priceMap[inv.symbol];

      if (price) {
        currentPrice = price;
        currentValue = currentPrice * Number(inv.shares_acquired);
      } else {
        currentPrice = 0;
        currentValue = 0;
      }

      totalInvested += Number(inv.amount);
      totalCurrentValue += currentValue;

      return {
        ...inv,
        amount: Number(inv.amount),
        shares_acquired: Number(inv.shares_acquired),
        currency_rate: Number(inv.currency_rate),
        tax_paid: Number(inv.tax_paid),
        net_earn: Number(inv.net_earn),
        created_at: inv.created_at,
        currentPrice,
        currentValue,
        currency: inv.currency,
      };
    });

    return {
      investments: enrichedInvestments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalReturn: totalCurrentValue - totalInvested,
        totalReturnPercent: totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0
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
   * Calculate forecast (Sandbox)
   * Calculates compound interest for a given amount over years.
   */
  static calculateForecast(amount: number, years: number = 10, rate: number = 0.07) {
    const data = [];
    let current = amount;
    for (let i = 0; i <= years; i++) {
      data.push({
        year: new Date().getFullYear() + i,
        amount: Math.round(current)
      });
      current = current * (1 + rate);
    }
    return data;
  }

  /**
   * Get historical portfolio performance
   */
  static async getHistoricalPortfolio(userId: string) {
    const investments = await this.getByUserDb(userId);
    if (!investments || investments.length === 0) return [];

    const symbols = [...new Set((investments as Investment[]).map((inv) => inv.symbol).filter(Boolean))] as string[];
    const marketDataList = await MarketDataService.getBatchMarketData(symbols);

    // Create a map of Symbol -> { DateString -> ClosePrice }
    const historyMap: Record<string, Record<string, number>> = {};

    marketDataList.forEach((item: MarketDataBatchResult) => {
      if (item.data && Array.isArray(item.data)) {
        historyMap[item.symbol] = {};
        item.data.forEach((day: any) => {
          // Ensure date is YYYY-MM-DD
          const dateKey = day.datetime.split(' ')[0];
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
          } else {
            totalValue += price * Number(inv.shares_acquired);
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
