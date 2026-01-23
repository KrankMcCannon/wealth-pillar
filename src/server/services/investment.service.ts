import { InvestmentRepository } from '@/server/dal';
import { twelveData } from '@/lib';
import { Prisma } from '@prisma/client';

export class InvestmentService {
  /**
   * Get user portfolio with real-time values
   */
  static async getPortfolio(userId: string) {
    const investments = await InvestmentRepository.getByUser(userId);

    const symbols = investments.map(inv => inv.symbol).filter(Boolean);
    const quotes = await twelveData.getQuotes(symbols);

    let totalInvested = 0;
    let totalCurrentValue = 0;

    const enrichedInvestments = investments.map((inv) => {
      let currentPrice = 0;
      let currentValue = 0;

      const quote = quotes[inv.symbol];

      if (quote && quote.close) {
        currentPrice = parseFloat(quote.close);
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
  static async addInvestment(data: Prisma.investmentsCreateInput) {
    return InvestmentRepository.create(data);
  }

  /**
   * Delete an investment
   */
  static async deleteInvestment(id: string) {
    return InvestmentRepository.delete(id);
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
}
